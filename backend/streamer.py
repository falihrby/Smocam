from aiortc.contrib.media import MediaPlayer
import logging
import shutil
import os

# Logger for this streamer module
logger = logging.getLogger("app.streamer")
logger.setLevel(logging.DEBUG) # Ensure streamer's own logs are at DEBUG

# Logger for aiortc's media components (MediaPlayer, which uses FFmpeg)
aiortc_media_logger = logging.getLogger("aiortc.contrib.media")
aiortc_media_logger.setLevel(logging.DEBUG) # CRUCIAL for seeing FFmpeg logs

def check_ffmpeg():
    ffmpeg_path = shutil.which("ffmpeg")
    if ffmpeg_path:
        logger.debug(f"FFmpeg found at: {ffmpeg_path}")
        if os.access(ffmpeg_path, os.X_OK):
            logger.info(f"FFmpeg at {ffmpeg_path} is executable.")
            return True
        else:
            logger.warning(f"FFmpeg found at {ffmpeg_path} but is NOT executable.")
            return False
    logger.error("ffmpeg command not found in PATH. MediaPlayer will fail.")
    return False

def create_local_tracks(rtsp_url, pc_id="N/A"):
    logger.info(f"[{pc_id}] [RTSP Streamer] Initializing track creation for: {rtsp_url}")
    options = {
        "rtsp_transport": "tcp",
        "stimeout": "5000000",
        "buffer_size": "2048000",
        "analyzeduration": "3000000",
        "probesize": "1500000",
    }
    player = None
    try:
        logger.debug(f"[{pc_id}] [RTSP Streamer] Creating MediaPlayer for '{rtsp_url}' with options: {options}")
        player = MediaPlayer(rtsp_url, format="rtsp", options=options)
        logger.info(f"[{pc_id}] [RTSP Streamer] MediaPlayer object INSTANTIATED for {rtsp_url}. Player: {player}")

        logger.debug(f"[{pc_id}] [RTSP Streamer] Attempting to access player.video to start RTSP connection...")
        video_track = player.video

        if video_track:
            logger.info(f"[{pc_id}] [RTSP Streamer] SUCCESS: Video track obtained. Kind: {video_track.kind}, ID: {video_track.id}")
            @video_track.on("ended")
            async def on_ended():
                logger.warning(f"[{pc_id}] [RTSP Streamer] Video track for {rtsp_url} has ENDED.")
            return video_track
        else:
            logger.error(f"[{pc_id}] [RTSP Streamer] FAILURE: player.video is None. No video track initialized from {rtsp_url}.")
            if player and player.audio: # Check if player object exists before accessing audio
                logger.info(f"[{pc_id}] [RTSP Streamer] Audio track found ({player.audio.kind}), but no video. Stopping audio.")
                if hasattr(player.audio, 'stop'): player.audio.stop()
            return None
    except Exception as e:
        logger.critical(f"[{pc_id}] [RTSP Streamer] CRITICAL EXCEPTION during MediaPlayer/track retrieval for {rtsp_url}: {e}", exc_info=True)
        if player:
            logger.info(f"[{pc_id}] [RTSP Streamer] Attempting to stop player resources due to exception.")
            if player.video and hasattr(player.video, 'stop'):
                try: player.video.stop()
                except Exception as stop_ex: logger.error(f"[{pc_id}] Exception stopping video track: {stop_ex}")
            if player.audio and hasattr(player.audio, 'stop'):
                try: player.audio.stop()
                except Exception as stop_ex: logger.error(f"[{pc_id}] Exception stopping audio track: {stop_ex}")
        return None