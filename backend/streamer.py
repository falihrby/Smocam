# streamer.py
from aiortc.contrib.media import MediaPlayer
import logging
import shutil 
import os

logger = logging.getLogger("app.streamer") 
logger.setLevel(logging.DEBUG)

aiortc_media_logger = logging.getLogger("aiortc.contrib.media") 
aiortc_media_logger.setLevel(logging.INFO) # Set to DEBUG for FFmpeg command/output

def check_ffmpeg():
    """Checks if ffmpeg is in PATH and executable."""
    ffmpeg_path = shutil.which("ffmpeg")
    if ffmpeg_path:
        logger.debug(f"FFmpeg found at: {ffmpeg_path}")
        if os.access(ffmpeg_path, os.X_OK):
            return True
    logger.warning("ffmpeg command not found in PATH.")
    return False

def create_local_tracks(rtsp_url, pc_id="N/A"):
    logger.info(f"[{pc_id}] [RTSP Streamer] Initializing track creation for: {rtsp_url}")
    
    options = {
        "rtsp_transport": "tcp",  
        "stimeout": "5000000", 
        "buffer_size": "2048000", 
        "analyzeduration": "2000000", 
        "probesize": "1000000"       
    }
    
    player = None
    try:
        logger.debug(f"[{pc_id}] [RTSP Streamer] Creating MediaPlayer for '{rtsp_url}' with options: {options}")
        player = MediaPlayer(rtsp_url, format="rtsp", options=options)
        logger.info(f"[{pc_id}] [RTSP Streamer] MediaPlayer object INSTANTIATED for {rtsp_url}. Player: {player}")
        
        logger.debug(f"[{pc_id}] [RTSP Streamer] Attempting to access player.video (this may block and connect to RTSP)...")
        video_track = player.video # This is the point where connection to RTSP is usually made
        
        if video_track:
            logger.info(f"[{pc_id}] [RTSP Streamer] SUCCESS: Video track obtained from MediaPlayer for {rtsp_url}. Track kind: {video_track.kind}, ID: {video_track.id}")
            @video_track.on("ended")
            async def on_ended():
                logger.warning(f"[{pc_id}] [RTSP Streamer] Video track for {rtsp_url} has ENDED.")
            return video_track
        else:
            logger.error(f"[{pc_id}] [RTSP Streamer] FAILURE: MediaPlayer created for {rtsp_url}, but player.video is None (No video track).")
            if player.audio:
                logger.info(f"[{pc_id}] [RTSP Streamer] Audio track found: {player.audio.kind}, but no video.")
                player.audio.stop()
            return None

    except Exception as e:
        logger.critical(f"[{pc_id}] [RTSP Streamer] CRITICAL EXCEPTION during MediaPlayer access or video track retrieval for {rtsp_url}. Error: {e}", exc_info=True)
        if player:
            logger.info(f"[{pc_id}] [RTSP Streamer] Attempting to stop player resources due to exception.")
            if player.video: player.video.stop()
            if player.audio: player.audio.stop()
        return None
