from flask import Flask, request, jsonify
from flask_cors import CORS
from aiortc import RTCPeerConnection, RTCSessionDescription
from aiortc.contrib.media import MediaPlayer, MediaRecorder
import subprocess
import json
import asyncio
import threading

app = Flask(__name__)
CORS(app)  # Allow all origins (safe for development)

pcs = set()

# Media Player for RTSP Stream
class MediaPlayerWithRTSP:
    def __init__(self, rtsp_url):
        self.rtsp_url = rtsp_url
        self.process = None

    def start(self):
        # You can use ffmpeg to stream RTSP into a format compatible with WebRTC
        self.process = subprocess.Popen(
            ["ffmpeg", "-i", self.rtsp_url, "-f", "avi", "-q:v", "10", "-vcodec", "mpeg4", "pipe:1"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        return self.process.stdout

    def stop(self):
        if self.process:
            self.process.kill()

player = None

# Signaling for WebRTC
@app.route("/offer", methods=["POST"])
async def offer():
    offer = request.json
    offer_sdp = offer["sdp"]
    peer_id = offer["peer_id"]
    pc = RTCPeerConnection()
    pcs.add(pc)

    @pc.on("datachannel")
    def on_datachannel(channel):
        @channel.on("message")
        def on_message(message):
            print(f"Message from {peer_id}: {message}")

    # Answer to offer
    rtc_session_description = RTCSessionDescription(sdp=offer_sdp, type="offer")
    await pc.setRemoteDescription(rtc_session_description)

    # Create answer
    answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)

    # Return answer to client
    return jsonify({"sdp": pc.localDescription.sdp, "type": "answer"})


@app.route("/start", methods=["POST"])
def start_rtsp_stream():
    global player
    rtsp_url = request.json.get("rtsp_url")
    if rtsp_url:
        player = MediaPlayerWithRTSP(rtsp_url)
        threading.Thread(target=player.start).start()
        return jsonify({"status": "Streaming started", "rtsp_url": rtsp_url})
    else:
        return jsonify({"status": "Error", "message": "RTSP URL is missing!"}), 400


@app.route("/stop", methods=["POST"])
def stop_rtsp_stream():
    global player
    if player:
        player.stop()
        player = None
        return jsonify({"status": "Streaming stopped"})
    else:
        return jsonify({"status": "Error", "message": "No active stream!"}), 400


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5050)
