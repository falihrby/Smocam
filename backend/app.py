import os, asyncio, uuid, logging, time
from datetime import datetime
from threading import Thread
from queue import Queue, Empty
from concurrent.futures import ThreadPoolExecutor

import cv2, av
from aiohttp import web
import aiohttp_cors
from aiortc import (
    RTCPeerConnection, RTCSessionDescription, RTCConfiguration,
    RTCIceServer, VideoStreamTrack
)
from ultralytics import YOLO
import firebase_admin
from firebase_admin import credentials, firestore
from supabase import create_client, Client

# ─────────────── 1. ENV & Logging ───────────────
os.environ["AV_CODEC_THREADS"] = "1"
av.logging.set_level(av.logging.ERROR)
logging.basicConfig(level=logging.INFO, format="%(levelname)s:%(name)s:%(message)s")
logger = logging.getLogger("smocam")

EXECUTOR = ThreadPoolExecutor(max_workers=4)
ICE_SERVERS = [RTCIceServer(urls=["stun:stun.l.google.com:19302"])]
DETECTION_QUEUE = asyncio.Queue()
DETECTION_FRAME_QUEUE = asyncio.Queue(maxsize=1)
UPLOAD_SEMAPHORE = asyncio.Semaphore(2)

# ─────────────── 2. Supabase ───────────────
SUPABASE_URL  = "https://lzahhwiqhhpdheoexslk.supabase.co"
SUPABASE_KEY  = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6YWhod2lxaGhwZGhlb2V4c2xrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTczNDc5NywiZXhwIjoyMDY3MzEwNzk3fQ.gYTCMgud_O9ZUoR_woVJGpATy3yYwHPqndTlD4rvbNk"
BUCKET_NAME   = "smocam-images"
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ─────────────── 3. Firestore ───────────────
try:
    cred = credentials.Certificate("firebase-service-account.json")
    firebase_admin.initialize_app(cred)
    db = firestore.client()
    logger.info("✅ Firestore connected.")
except Exception as e:
    db = None
    logger.error("❌ Firestore init failed: %s", e)

# ─────────────── 4. YOLOv8 Model ───────────────
try:
    model = YOLO("bestM7.pt")
    CLASS_NAMES = model.model.names
    logger.info("✅ YOLO model loaded.")
except Exception as e:
    model = None
    CLASS_NAMES = []
    logger.error("❌ YOLO load error: %s", e)

def run_yolo(frame):
    return model.predict(frame, verbose=False, imgsz=640)

# ─────────────── 5. Threaded RTSP Reader ───────────────
class ThreadedVideoCapture:
    def __init__(self, url: str):
        self.url = url
        self.cap = cv2.VideoCapture(url + "?rtsp_transport=tcp", cv2.CAP_FFMPEG)
        if not self.cap.isOpened():
            logger.warning("⚠️ Cannot open stream")

        self.q = Queue(maxsize=10)
        self.run = True
        Thread(target=self._reader, daemon=True).start()

    def _reader(self):
        while self.run:
            if not self.cap.isOpened():
                time.sleep(1)
                continue
            ok, f = self.cap.read()
            if ok and not self.q.full():
                self.q.put(f)
            else:
                time.sleep(0.01)

    def read(self):
        try: return True, self.q.get(timeout=1)
        except Empty: return False, None

    def release(self):
        self.run = False
        self.cap.release()

# ─────────────── 6. WebRTC Track ───────────────
class RTSPVideoProcessor(VideoStreamTrack):
    kind = "video"

    def __init__(self, rtsp_url: str, area: str, cam: str):
        super().__init__()
        self.reader = ThreadedVideoCapture(rtsp_url)
        self.area, self.cam = area, cam

    async def recv(self):
        pts, tbase = await self.next_timestamp()
        ok, frame = self.reader.read()
        if not ok:
            blank = av.VideoFrame(width=640, height=360, format="rgb24")
            blank.pts, blank.time_base = pts, tbase
            await asyncio.sleep(0.02)
            return blank

        stream = cv2.resize(frame, (640, 360))

        if DETECTION_FRAME_QUEUE.empty():
            await DETECTION_FRAME_QUEUE.put((frame.copy(), self.area, self.cam))

        v = av.VideoFrame.from_ndarray(cv2.cvtColor(stream, cv2.COLOR_BGR2RGB), format="rgb24")
        v.pts, v.time_base = pts, tbase
        return v

    def stop(self):
        self.reader.release()

# ─────────────── 7. Detection Worker ───────────────
async def yolo_detection_worker():
    while True:
        frame, area, cam = await DETECTION_FRAME_QUEUE.get()
        loop = asyncio.get_running_loop()
        res = await loop.run_in_executor(EXECUTOR, run_yolo, frame)
        now = time.time()

        for r in res:
            for b in r.boxes:
                name = CLASS_NAMES[int(b.cls[0])].lower()
                if any(t in name for t in ("smoking", "smoke", "cigarette", "rokok")) and float(b.conf[0]) > 0.3:
                    await DETECTION_QUEUE.put((frame.copy(), float(b.conf[0]), area, cam))
                    await asyncio.sleep(10)  # cooldown deteksi
                    break

async def save_violation_async(frame, conf: float, area: str, cam: str):
    if not (supabase and db and model):
        return
    async with UPLOAD_SEMAPHORE:
        for r in model(frame, imgsz=640, verbose=False):
            for b in r.boxes:
                name = CLASS_NAMES[int(b.cls[0])].lower()
                if any(t in name for t in ("smoking", "smoke", "cigarette", "rokok")) and float(b.conf[0]) > 0.3:
                    x1, y1, x2, y2 = map(int, b.xyxy[0])
                    cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 2)
                    lbl = f"{name} {b.conf[0]:.2f}"
                    cv2.putText(frame, lbl, (x1, max(0, y1 - 8)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)

        ok, buf = cv2.imencode(".jpg", frame, [int(cv2.IMWRITE_JPEG_QUALITY), 95])
        if not ok:
            return
        fname = f"detections/{datetime.now():%Y%m%d_%H%M%S}_{uuid.uuid4().hex[:8]}.jpg"
        try:
            supabase.storage.from_(BUCKET_NAME).upload(fname, buf.tobytes(), {"content-type": "image/jpeg"})
            url = supabase.storage.from_(BUCKET_NAME).get_public_url(fname)
            logger.info("✅ Uploaded: %s", url)
            db.collection("detections").add({
                "timestamp": firestore.SERVER_TIMESTAMP,
                "message": "Telah deteksi merokok",
                "imageUrl": url,
                "area": area,
                "cctvName": cam,
                "confidence": conf,
            })
        except Exception as e:
            logger.error("❌ Upload error: %s", e)

async def detection_worker():
    while True:
        frame, conf, area, cam = await DETECTION_QUEUE.get()
        await save_violation_async(frame, conf, area, cam)

# ─────────────── 8. /offer Endpoint ───────────────
async def offer(request: web.Request):
    if not (model and db):
        return web.json_response({"error": "Backend not ready"}, status=503)

    data = await request.json()
    for k in ("sdp", "type", "areaName", "cctvName"):
        if k not in data:
            return web.json_response({"error": f"Missing {k}"}, status=400)

    pc = RTCPeerConnection(RTCConfiguration(iceServers=ICE_SERVERS))
    pc.addTrack(RTSPVideoProcessor(
        "rtsp://admin:Rahmat27.@192.168.1.10:554/stream2",
        data["areaName"], data["cctvName"])
    )

    await pc.setRemoteDescription(RTCSessionDescription(data["sdp"], data["type"]))
    answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    return web.json_response({"sdp": pc.localDescription.sdp, "type": pc.localDescription.type})

# ─────────────── 9. App Factory ───────────────
def create_app():
    app = web.Application()
    cors = aiohttp_cors.setup(app, defaults={
        "*": aiohttp_cors.ResourceOptions(allow_credentials=True,
                                          expose_headers="*",
                                          allow_headers="*",
                                          allow_methods="*")})
    cors.add(app.router.add_post("/offer", offer))
    app.on_startup.append(start_background_tasks)
    app.on_cleanup.append(cleanup_background_tasks)
    logger.info("🚀 Backend ready ▶ http://0.0.0.0:5050/offer")
    return app

async def start_background_tasks(app):
    app["detection_worker"] = asyncio.create_task(detection_worker())
    app["yolo_worker"] = asyncio.create_task(yolo_detection_worker())

async def cleanup_background_tasks(app):
    app["detection_worker"].cancel()
    app["yolo_worker"].cancel()
    await asyncio.gather(app["detection_worker"], app["yolo_worker"], return_exceptions=True)

# ─────────────── 10. main ───────────────
if __name__ == "__main__":
    web.run_app(create_app(), host="0.0.0.0", port=5050)
