# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
from aiortc import RTCPeerConnection, RTCSessionDescription, RTCConfiguration, RTCIceServer
from streamer import create_local_tracks, check_ffmpeg 
import asyncio
import uuid
import logging
import os

app = Flask(__name__)
CORS(app, resources={r"/offer": {"origins": "http://localhost:3000"}}, supports_credentials=True) # Adjust origin if your frontend is on a different port

logging.basicConfig(level=logging.INFO, format='%(asctime)s.%(msecs)03d %(levelname)s %(name)s: %(message)s', datefmt='%Y-%m-%d %H:%M:%S')
logger = logging.getLogger("app")
logger.setLevel(logging.DEBUG) 

aiortc_logger = logging.getLogger("aiortc")
aiortc_logger.setLevel(logging.INFO) # Set to DEBUG for extremely verbose aiortc logs if needed

pcs = set()

@app.route("/")
def index():
    logger.info("Backend API index route accessed.")
    ffmpeg_present = check_ffmpeg()
    return f"SMOCAM Backend API is running. FFmpeg check: {'Present and executable' if ffmpeg_present else 'NOT FOUND or NOT EXECUTABLE - CHECK SERVER LOGS AND PATH!'}"

@app.route("/offer", methods=["POST"])
async def offer():
    params = request.get_json()
    if not params:
        logger.warning("Offer request with no JSON body received.")
        return jsonify({"error": "Request body must be JSON"}), 400

    client_offer_sdp = params.get("sdp")
    client_offer_type = params.get("type")
    rtsp_url = params.get("rtspUrl")

    logger.debug(f"Received offer request params: sdp_present={bool(client_offer_sdp)}, type_present={bool(client_offer_type)}, rtspUrl={rtsp_url}")

    if not client_offer_sdp or not client_offer_type:
        logger.warning("Offer request missing SDP or type.")
        return jsonify({"error": "Missing SDP or type in offer"}), 400
    if not rtsp_url:
        logger.warning("Offer request missing RTSP URL.")
        return jsonify({"error": "RTSP URL not provided"}), 400

    logger.info(f"Processing offer for RTSP URL: {rtsp_url}")

    config = RTCConfiguration(iceServers=[
        RTCIceServer(urls=["stun:stun.l.google.com:19302"])
    ])
    pc = RTCPeerConnection(configuration=config)
    pc_id = f"pc-{uuid.uuid4()}"
    pcs.add(pc)
    logger.info(f"[{pc_id}] PeerConnection created.")

    @pc.on("icecandidate")
    async def on_icecandidate(candidate):
        if candidate:
            logger.info(f"[{pc_id}] LOCAL BACKEND ICE CANDIDATE GATHERED: type={candidate.type} protocol={candidate.protocol} address={candidate.address} port={candidate.port} sdpMid={candidate.sdpMid} sdpMLineIndex={candidate.sdpMLineIndex} foundation={candidate.foundation}")
        else:
            logger.info(f"[{pc_id}] All local backend ICE candidates gathered (event.candidate is null).")

    async def cleanup_pc(reason=""):
        logger.info(f"[{pc_id}] Cleaning up PeerConnection. Reason: {reason}")
        if pc in pcs:
            pcs.remove(pc)
        if pc.signalingState != "closed":
            logger.info(f"[{pc_id}] Closing PC (current signalingState: {pc.signalingState}, connectionState: {pc.connectionState})")
            await pc.close()
        logger.info(f"[{pc_id}] PeerConnection resources released.")

    @pc.on("iceconnectionstatechange")
    async def on_iceconnectionstatechange():
        logger.info(f"[{pc_id}] Backend ICE connection state is {pc.iceConnectionState}")
        if pc.iceConnectionState in ["failed", "disconnected", "closed"]:
            await cleanup_pc(f"Backend ICE state: {pc.iceConnectionState}")

    @pc.on("connectionstatechange") 
    async def on_connectionstatechange():
        logger.info(f"[{pc_id}] Backend Peer connection state is {pc.connectionState}")
        if pc.connectionState in ["failed", "disconnected", "closed"]:
            await cleanup_pc(f"Backend Peer connection state: {pc.connectionState}")
            
    @pc.on("track")
    async def on_track(track):
        logger.info(f"[{pc_id}] Track {track.kind} received by backend (unexpected for RTSP relay)")

    video_track = None
    try:
        logger.info(f"[{pc_id}] Attempting to create local tracks for: {rtsp_url}")
        video_track = create_local_tracks(rtsp_url, pc_id=pc_id) 
        
        if video_track:
            pc.addTrack(video_track)
            logger.info(f"[{pc_id}] Video track object ADDED to backend PeerConnection from RTSP: {rtsp_url}. Track kind: {video_track.kind}")
        else:
            logger.error(f"[{pc_id}] Failed to get a valid video track object from RTSP: {rtsp_url}. Cleaning up.")
            await cleanup_pc(f"Failed to get video track from RTSP: {rtsp_url}")
            return jsonify({"error": f"Failed to get video track from RTSP: {rtsp_url}"}), 500
            
    except Exception as e:
        logger.error(f"[{pc_id}] Exception while creating/adding local tracks from RTSP '{rtsp_url}': {e}", exc_info=True)
        await cleanup_pc(f"Exception creating/adding local tracks: {str(e)}")
        return jsonify({"error": f"Error creating/adding local tracks: {str(e)}"}), 500

    try:
        logger.info(f"[{pc_id}] Setting remote description (client's offer).")
        await pc.setRemoteDescription(RTCSessionDescription(sdp=client_offer_sdp, type=client_offer_type))
        logger.info(f"[{pc_id}] Remote description set.")
        await asyncio.sleep(0.5)
        logger.info(f"[{pc_id}] Creating answer.")
        answer = await pc.createAnswer()
        logger.info(f"[{pc_id}] Setting local description (server's answer).")
        await pc.setLocalDescription(answer)
        logger.info(f"[{pc_id}] Local description set. Sending answer to client.")

        return jsonify({"sdp": pc.localDescription.sdp, "type": pc.localDescription.type})
    except Exception as e:
        logger.error(f"[{pc_id}] Exception during SDP offer/answer exchange for '{rtsp_url}': {e}", exc_info=True)
        if video_track: 
             logger.info(f"[{pc_id}] Stopping video track due to SDP exchange error.")
             video_track.stop()
        await cleanup_pc(f"Exception during offer/answer: {str(e)}")
        return jsonify({"error": f"Error during offer/answer: {str(e)}"}), 500

if __name__ == "__main__":
    logger.info("Starting SMOCAM Backend API server...")
    if not check_ffmpeg():
        logger.critical("FFMPEG IS NOT FOUND OR NOT EXECUTABLE! MediaPlayer will likely fail. Please install FFmpeg and ensure it's in your system's PATH.")
    else:
        logger.info("FFmpeg check passed.")
    app.run(debug=True, host="0.0.0.0", port=5050)
