import cv2

rtsp_url = "rtsp://admin:Rahmat27.@192.168.1.10:554/stream1"
cap = cv2.VideoCapture(rtsp_url, cv2.CAP_FFMPEG)

frame_saved = False

while True:
    ret, frame = cap.read()
    if not ret:
        print("❌ Gagal ambil frame dari RTSP")
        continue

    if not frame_saved:
        cv2.imwrite("frame.jpg", frame)
        print("✅ Frame pertama berhasil disimpan sebagai 'frame.jpg'")
        frame_saved = True
        break  # Hentikan setelah satu kali sukses
