# File: backend/app.py

# --- Set ICE Address before aiortc import ---
import os
os.environ["AIORTC_ICE_ADDRESSES"] = "192.168.1.4" 

import asyncio
import uuid
import logging
import shutil
from aiohttp import web
import aiohttp_cors
from aiortc import (
    RTCPeerConnection, 
    RTCSessionDescription, 
    RTCConfiguration, 
    RTCIceServer
)
from aiortc.contrib.media import MediaPlayer

# --- Logging Configuration ---
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s.%(msecs)03d %(levelname)-8s %(name)-20s %(funcName)-15s %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger("app")
logging.getLogger("aiortc").setLevel(logging.WARNING)
logging.getLogger("aiortc.contrib.media").setLevel(logging.WARNING)

# --- Global State ---
pcs = set()

# --- Helper Functions ---
def check_ffmpeg():
    """Checks if the ffmpeg command is available."""
    return shutil.which("ffmpeg") is not None

def create_local_tracks(rtsp_url, pc_id=""):
    """Creates a video track from an RTSP source with low-latency options."""
    logger.info(f"[{pc_id}] Creating MediaPlayer for: {rtsp_url}")
    options = {
        "rtsp_transport": "tcp", "stimeout": "5000000",
        "max_delay": "500000", "fflags": "nobuffer",
        "flags": "low_delay", "probesize": "32",
        "analyzeduration": "0",
    }
    try:
        player = MediaPlayer(rtsp_url, format="rtsp", options=options)
        return player.video
    except Exception as e:
        logger.error(f"[{pc_id}] EXCEPTION: Failed to create MediaPlayer: {e}")
        return None

# --- aiohttp Route Handlers ---
async def offer(request):
    """
    Handles the WebRTC offer from the client.
    Now expects 'rtspUrl' in the request body to be dynamic.
    """
    pc_id = f"pc-{uuid.uuid4()}"
    try:
        params = await request.json()
        # **MODIFIED: Check for rtspUrl in the request**
        if not all(k in params for k in ["sdp", "type", "rtspUrl"]):
            logger.warning(f"[{pc_id}] Offer request missing sdp, type, or rtspUrl.")
            return web.json_response({"error": "Missing sdp, type, or rtspUrl in offer"}, status=400)
        
        client_offer = RTCSessionDescription(sdp=params["sdp"], type=params["type"])
        rtsp_url = params["rtspUrl"]
        logger.info(f"[{pc_id}] Received offer for RTSP stream: {rtsp_url}")

    except Exception as e:
        logger.error(f"[{pc_id}] Could not parse request JSON: {e}")
        return web.json_response({"error": "Invalid JSON in request body"}, status=400)

    config = RTCConfiguration(iceServers=[RTCIceServer(urls=["stun:stun.l.google.com:19302"])])
    pc = RTCPeerConnection(configuration=config)
    pcs.add(pc)

    # ... (Cleanup functions and event handlers remain the same)
    async def cleanup_pc(reason=""):
        if pc in pcs: logger.info(f"[{pc_id}] Cleaning up PC. Reason: {reason}"); await pc.close(); pcs.remove(pc)
    @pc.on("connectionstatechange")
    async def on_connectionstatechange():
        if pc.connectionState in ["failed", "closed", "disconnected"]: await cleanup_pc(f"Conn state: {pc.connectionState}")
    
    try:
        # **MODIFIED: Use the dynamic rtsp_url from the request**
        video_track = create_local_tracks(rtsp_url=rtsp_url, pc_id=pc_id)
        if not video_track:
            raise Exception(f"Failed to get video track from {rtsp_url}")

        pc.addTrack(video_track)
        await pc.setRemoteDescription(client_offer)
        answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        logger.info(f"[{pc_id}] Handshake complete. Sending answer.")

        return web.json_response({"sdp": pc.localDescription.sdp, "type": pc.localDescription.type})

    except Exception as e:
        logger.error(f"[{pc_id}] EXCEPTION during offer/answer: {e}", exc_info=True)
        await cleanup_pc(f"Exception during setup: {e}")
        return web.json_response({"error": str(e)}, status=500)

# --- Application Setup ---
if __name__ == "__main__":
    app = web.Application()
    cors = aiohttp_cors.setup(app, defaults={
        "*": aiohttp_cors.ResourceOptions(allow_credentials=True, expose_headers="*", allow_headers="*", allow_methods="*")
    })
    cors.add(app.router.add_post("/offer", offer))
    logger.info("Starting SMOCAM Backend API server on port 5050...")
    web.run_app(app, host="0.0.0.0", port=5050)
