# backend/fetch_rtsp.py
import sys
import firebase_admin
from firebase_admin import credentials, firestore
import json

cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

area = sys.argv[1]
camera_name = sys.argv[2]

try:
    cameras_ref = db.collection("Cameras")
    query = cameras_ref.where("area", "==", area).where("cameraName", "==", camera_name).stream()
    result = None
    for doc in query:
        result = doc.to_dict()
        break

    if not result:
        print(json.dumps({"error": "Camera not found"}))
        sys.exit(1)

    username = result.get("username", "admin")
    password = result.get("password", "admin")
    ip = result.get("ipAddress")
    port = result.get("cameraPort", 554)
    rtsp_url = f"rtsp://{username}:{password}@{ip}:{port}/Streaming/Channels/101"

    print(json.dumps({"rtspUrl": rtsp_url}))
    sys.exit(0)

except Exception as e:
    print(json.dumps({"error": str(e)}))
    sys.exit(1)
