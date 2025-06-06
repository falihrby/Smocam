# --- Set ICE Address before aiortc import ---
import os
os.environ["AIORTC_ICE_ADDRESSES"] = "192.168.1.4"  # Replace with your LAN IP

import asyncio
import uuid
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from aiortc import RTCPeerConnection, RTCSessionDescription, RTCConfiguration, RTCIceServer
from streamer import create_local_tracks, check_ffmpeg

app = Flask(__name__)
CORS(app, resources={r"/offer": {"origins": "*"}})

# --- Logging Configuration ---
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s.%(msecs)03d %(levelname)-8s %(name)-30s %(funcName)-20s %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger("app")
aiortc_logger = logging.getLogger("aiortc")
aiortc_logger.setLevel(logging.DEBUG)
media_logger = logging.getLogger("aiortc.contrib.media")
media_logger.setLevel(logging.DEBUG)

pcs = set()
STATIC_RTSP_URL = "rtsp://admin:Admin123.@192.168.1.8:554/Streaming/Channels/101"

@app.route("/")
def index():
    logger.info("Backend API index route accessed.")
    ffmpeg_present = check_ffmpeg()
    status_message = (
        f"SMOCAM Backend API is running (Static RTSP Mode).\n"
        f"Streaming from: {STATIC_RTSP_URL}\n"
        f"FFmpeg check: {'Present and executable' if ffmpeg_present else 'NOT FOUND or NOT EXECUTABLE!'}"
    )
    return status_message.replace("\n", "<br>")

@app.route("/offer", methods=["POST"])
async def offer():
    params = request.get_json()
    if not params or "sdp" not in params or "type" not in params:
        logger.warning("Offer request missing sdp or type.")
        return jsonify({"error": "Missing sdp or type in offer"}), 400

    client_offer = RTCSessionDescription(sdp=params["sdp"], type=params["type"])

    config = RTCConfiguration(iceServers=[
        RTCIceServer(urls=[
            "stun:stun.l.google.com:19302",
            "stun:global.stun.twilio.com:3478?transport=udp",
            "stun:global.stun.twilio.com:3478?transport=tcp"
        ])
    ])
    pc = RTCPeerConnection(configuration=config)
    pc_id = f"pc-{uuid.uuid4()}"
    pcs.add(pc)
    logger.info(f"[{pc_id}] PeerConnection created.")

    async def cleanup_pc(reason=""):
        logger.info(f"[{pc_id}] Cleaning up PeerConnection. Reason: {reason}")
        if pc in pcs:
            pcs.remove(pc)
        if pc.signalingState != "closed":
            await pc.close()
        logger.info(f"[{pc_id}] PeerConnection resources released.")

    @pc.on("connectionstatechange")
    async def on_connectionstatechange():
        logger.info(f"[{pc_id}] Peer connection state is {pc.connectionState}")
        if pc.connectionState == "failed":
            await cleanup_pc(f"Peer connection state: {pc.connectionState}")

    @pc.on("iceconnectionstatechange")
    async def on_iceconnectionstatechange():
        logger.info(f"[{pc_id}] ICE connection state is {pc.iceConnectionState}")
        if pc.iceConnectionState == "failed":
            await cleanup_pc(f"ICE state: {pc.iceConnectionState}")

    @pc.on("icecandidate")
    def on_icecandidate(candidate):
        logger.debug(f"[{pc_id}] ICE candidate: {candidate}")

    try:
        video_track = create_local_tracks(rtsp_url=STATIC_RTSP_URL, pc_id=pc_id)
        if not video_track:
            raise Exception("Failed to get video track from RTSP source.")

        pc.addTrack(video_track)
        logger.info(f"[{pc_id}] Video track added to PeerConnection.")

        await pc.setRemoteDescription(client_offer)
        logger.info(f"[{pc_id}] Remote description (client's offer) set.")

        answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        logger.info(f"[{pc_id}] Local description (server's answer) set. Sending to client.")

        return jsonify({"sdp": pc.localDescription.sdp, "type": pc.localDescription.type})

    except Exception as e:
        logger.error(f"[{pc_id}] EXCEPTION during offer/answer: {e}", exc_info=True)
        await cleanup_pc(f"Exception during setup: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/stats")
def stats():
    return jsonify({"peerConnections": len(pcs)})

if __name__ == "__main__":
    logger.info("Starting SMOCAM Backend API server...")
    if not check_ffmpeg():
        logger.critical("FFMPEG IS NOT FOUND OR NOT EXECUTABLE! MediaPlayer will fail.")
    else:
        logger.info(f"FFmpeg check passed. Streaming from: {STATIC_RTSP_URL}")
    app.run(debug=True, host="0.0.0.0", port=5050, use_reloader=False)
