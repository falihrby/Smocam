# File: backend/streamer.py

from aiortc.contrib.media import MediaPlayer

def create_local_tracks(rtsp_url):
    print(f"[RTSP] Connecting to: {rtsp_url}")  # debug line
    options = {
        "rtsp_transport": "tcp",
        "stimeout": "5000000",
        "buffer_size": "2048000",
    }
    player = MediaPlayer(rtsp_url, format="rtsp", options=options)
    return player.video

