# backend/app.py
import os
os.environ["AIORTC_ICE_ADDRESSES"] = "192.168.1.4"

import asyncio
import uuid
import logging
import time
import cv2
import av
import numpy as np
from datetime import datetime
from threading import Thread
from queue import Queue
from concurrent.futures import ThreadPoolExecutor

from aiohttp import web
import aiohttp_cors
from aiortc import RTCPeerConnection, RTCSessionDescription, RTCConfiguration, RTCIceServer, VideoStreamTrack

from ultralytics import YOLO
import firebase_admin
from firebase_admin import credentials, firestore, storage

# --- Logging Setup ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("smocam")

pcs = set()
PROCESSING_WIDTH, PROCESSING_HEIGHT = 640, 480
# --- OPTIMASI: Proses lebih sedikit frame untuk mengurangi beban CPU ---
FRAME_SKIP = 5 

# --- PERBAIKAN: Buat thread pool executor untuk proses berat (AI) ---
executor = ThreadPoolExecutor(max_workers=4)


ICE_SERVERS = [
    RTCIceServer(urls=["stun:stun.l.google.com:19302"]),
    RTCIceServer(urls=["stun:stun1.l.google.com:19302"]),
]

# --- Firebase & YOLO Init ---
try:
    cred = credentials.Certificate("firebase-service-account.json")
    firebase_admin.initialize_app(cred, {'storageBucket': 'smocam-3b5d2.appspot.com'})
    db = firestore.client()
    bucket = storage.bucket()
except Exception as e:
    logger.critical(f"Firebase init failed: {e}", exc_info=True)
    db = bucket = None

try:
    model = YOLO("best.pt")
    CLASS_NAMES = model.model.names
except Exception as e:
    logger.critical(f"YOLO model failed to load: {e}", exc_info=True)
    model = None


# --- Threaded Video Capture Class ---
class ThreadedVideoCapture:
    def __init__(self, rtsp_url):
        self.cap = cv2.VideoCapture(rtsp_url, cv2.CAP_FFMPEG)
        self.queue = Queue(maxsize=2)
        self.running = True
        self.thread = Thread(target=self._reader, daemon=True)
        self.thread.start()

    def _reader(self):
        while self.running:
            ret, frame = self.cap.read()
            if not ret:
                logger.warning("Failed to grab frame from RTSP source, retrying in 1 sec...")
                time.sleep(1)
                continue
            if not self.queue.full():
                self.queue.put(frame)

    def read(self):
        try:
            return True, self.queue.get(timeout=1)
        except self.queue.Empty:
            return False, None

    def release(self):
        self.running = False
        if self.thread.is_alive():
            self.thread.join()
        self.cap.release()


# --- PERBAIKAN: Fungsi untuk menjalankan model di thread terpisah ---
def run_model_prediction(frame):
    """Fungsi ini akan dijalankan di executor untuk menghindari blocking."""
    return model.predict(frame, verbose=False, imgsz=256)


# --- Stream Processor (Diperbarui untuk Performa) ---
class RTSPVideoProcessor(VideoStreamTrack):
    kind = "video"

    def __init__(self, rtsp_url, area_name, cctv_name):
        super().__init__()
        self.capture = ThreadedVideoCapture(rtsp_url)
        self.area_name = area_name
        self.cctv_name = cctv_name
        self.last_detection_time = 0
        self.frame_count = 0
        self.detection_cooldown = 10 

    async def recv(self):
        pts, time_base = await self.next_timestamp()
        ret, frame = self.capture.read()
        
        if not ret:
            blank_frame = av.VideoFrame(width=PROCESSING_WIDTH, height=PROCESSING_HEIGHT, format='rgb24')
            blank_frame.pts = pts
            blank_frame.time_base = time_base
            await asyncio.sleep(0.01)
            return blank_frame

        frame = cv2.resize(frame, (PROCESSING_WIDTH, PROCESSING_HEIGHT))
        self.frame_count += 1
        
        # --- PERBAIKAN: Jalankan AI di thread terpisah (non-blocking) ---
        if self.frame_count % FRAME_SKIP == 0:
            loop = asyncio.get_running_loop()
            results = await loop.run_in_executor(executor, run_model_prediction, frame.copy())
            
            now = time.time()
            for r in results:
                for box in r.boxes:
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    class_id = int(box.cls[0])
                    class_name = CLASS_NAMES[class_id]
                    conf = float(box.conf[0])

                    if 'smoking' in class_name.lower() and conf > 0.6:
                        if now - self.last_detection_time > self.detection_cooldown:
                            self.last_detection_time = now
                            asyncio.create_task(self.save_detection(frame.copy(), conf))

                        cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 2)
                        cv2.putText(frame, f"{class_name.upper()} {conf:.2f}", (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)

        img_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        av_frame = av.VideoFrame.from_ndarray(img_rgb, format="rgb24")
        av_frame.pts = pts
        av_frame.time_base = time_base
        return av_frame

    async def save_detection(self, frame, confidence):
        if not db or not bucket: return
        try:
            timestamp = datetime.now()
            success, encoded = cv2.imencode(".jpg", frame)
            if not success: return
            img_bytes = encoded.tobytes()

            filename = f"detections/{timestamp.strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}.jpg"
            blob = bucket.blob(filename)
            blob.upload_from_string(img_bytes, content_type="image/jpeg")
            blob.make_public()

            db.collection("detections").add({
                "timestamp": timestamp,
                "message": "Aktivitas merokok terdeteksi",
                "imageUrl": blob.public_url,
                "area": self.area_name,
                "cctvName": self.cctv_name,
                "confidence": confidence,
            })
            logger.info(f"Deteksi disimpan dari area {self.area_name}")
        except Exception as e:
            logger.error(f"Gagal menyimpan deteksi: {e}", exc_info=True)

    def stop(self):
        self.capture.release()

# --- WebRTC Offer Route (Tidak ada perubahan) ---
async def offer(request):
    if not model or not db:
        return web.json_response({"error": "Backend not ready"}, status=503)
    try:
        data = await request.json()
        for k in ["sdp", "type", "rtspUrl", "areaName", "cctvName"]:
            if k not in data:
                return web.json_response({"error": f"Missing {k}"}, status=400)

        config = RTCConfiguration(iceServers=ICE_SERVERS)
        pc = RTCPeerConnection(configuration=config)
        pcs.add(pc)

        @pc.on("connectionstatechange")
        async def on_state_change():
            logger.info(f"State changed: {pc.connectionState}")
            if pc.connectionState in ["failed", "closed", "disconnected"]:
                await pc.close()
                pcs.discard(pc)

        processor = RTSPVideoProcessor(data["rtspUrl"], data["areaName"], data["cctvName"])
        pc.addTrack(processor)

        await pc.setRemoteDescription(RTCSessionDescription(sdp=data["sdp"], type=data["type"]))
        answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)

        return web.json_response({"sdp": pc.localDescription.sdp, "type": pc.localDescription.type})
    except Exception as e:
        logger.error(f"Offer error: {e}", exc_info=True)
        return web.json_response({"error": "Internal error"}, status=500)


# --- Run App (Tidak ada perubahan) ---
if __name__ == "__main__":
    if not model or not db:
        logger.critical("Abort: model/db not ready")
    else:
        app = web.Application()
        cors = aiohttp_cors.setup(app, defaults={
            "*": aiohttp_cors.ResourceOptions(allow_credentials=True, expose_headers="*", allow_headers="*", allow_methods="*")
        })
        cors.add(app.router.add_post("/offer", offer))
        logger.info("Starting server on http://0.0.0.0:5050")
        web.run_app(app, host="0.0.0.0", port=5050)