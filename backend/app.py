from flask import Flask, request, jsonify
from flask_cors import CORS
from aiortc import RTCPeerConnection, RTCSessionDescription
from aiortc.contrib.media import MediaPlayer
import subprocess
import json
import asyncio

app = Flask(__name__)
CORS(app)  # Allow all origins (safe for development)

pcs = set()

# Simpan RTSP URL jika dibutuhkan
rtsp_url_store = {}

# -------- Set RTSP URL (opsional endpoint frontend) --------
@app.route("/api/set-rtsp-url", methods=["POST"])
def set_rtsp_url():
    data = request.get_json()
    rtsp_url_store["url"] = data.get("rtspUrl")
    return jsonify({"message": "RTSP URL saved successfully"})

# -------- RTSP to WebRTC Track --------
def create_local_tracks(rtsp_url):
    try:
        options = {"rtsp_transport": "tcp"}
        player = MediaPlayer(rtsp_url, format="rtsp", options=options)
        if player and player.video:
            return player.video
        print("[ERROR] RTSP stream has no video track.")
        return None
    except Exception as e:
        print(f"[ERROR] Failed to open RTSP stream: {e}")
        return None

# -------- WebRTC Offer Handler --------
@app.route("/offer", methods=["POST"])
def offer():
    params = request.get_json()
    print("Received params:", params)
    if not params or "sdp" not in params or "type" not in params:
        return jsonify({"error": "Missing required parameters"}), 400

    offer = RTCSessionDescription(sdp=params["sdp"], type=params["type"])
    rtsp_url = params.get("rtspUrl") or rtsp_url_store.get("url")
    if not rtsp_url:
        return jsonify({"error": "RTSP URL not provided"}), 400

    pc = RTCPeerConnection()
    pcs.add(pc)

    async def handle_offer():
        await pc.setRemoteDescription(offer)
        video_track = create_local_tracks(rtsp_url)

        if not video_track:
            await pc.close()
            pcs.discard(pc)
            return None

        pc.addTrack(video_track)
        answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)

        return {
            "sdp": pc.localDescription.sdp,
            "type": pc.localDescription.type
        }

    result = asyncio.run(handle_offer())

    if result is None:
        return jsonify({"error": "Failed to create video track"}), 500

    return jsonify(result)

# -------- RTSP Fetch via Firebase Handler --------
@app.route("/api/get_rtsp")
def get_rtsp():
    area = request.args.get("area")
    camera = request.args.get("camera")

    result = subprocess.run(
        ["python3", "fetch_rtsp.py", area, camera],
        capture_output=True, text=True
    )

    if result.returncode != 0:
        return jsonify({"error": result.stderr}), 500

    try:
        data = json.loads(result.stdout)
    except json.JSONDecodeError as e:
        return jsonify({"error": "Failed to parse RTSP info", "details": str(e)}), 500

    return jsonify(data)

# -------- Shutdown Cleanup --------
@app.route("/shutdown")
def shutdown():
    async def close_all():
        await asyncio.gather(*[pc.close() for pc in pcs])
        pcs.clear()
    asyncio.run(close_all())
    return "ok"

@app.route("/")
def index():
    return "Server is running."

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5050, debug=True)
