import React, { useState, useEffect, useRef } from "react";
// Firebase and component imports - ensure these paths are correct for your project
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebaseConfig";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import "../styles/DashboardPage.css";

// --- WebRTC Streaming Logic ---
// This function establishes the WebRTC connection with the backend.
async function fetchWebRTCStream(videoElement, backendOfferUrl) {
  console.log(`[WebRTC] Initializing WebRTC stream via ${backendOfferUrl}`);
  
  const pc = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
  });

  // This promise resolves with the peer connection object on success
  // or rejects on failure.
  return new Promise((resolve, reject) => {
    let hasResolved = false;

    const cleanup = (errorMsg) => {
      if (hasResolved && !errorMsg) return;
      hasResolved = true;

      console.warn(`[WebRTC] Cleaning up connection. Reason: ${errorMsg || 'Normal cleanup'}`);
      if (pc.signalingState !== 'closed') {
        pc.close();
      }
      if (videoElement && videoElement.srcObject) {
        videoElement.srcObject.getTracks().forEach(track => track.stop());
        videoElement.srcObject = null;
      }
      if (errorMsg) {
        reject(new Error(errorMsg));
      }
    };

    pc.ontrack = (event) => {
      console.log(`[WebRTC] Track received: ${event.track.kind}`);
      if (videoElement.srcObject !== event.streams[0]) {
        videoElement.srcObject = event.streams[0];
        console.log('[WebRTC] Stream assigned to video element.');
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`[WebRTC] Connection state: ${pc.connectionState}`);
      if (pc.connectionState === 'connected') {
        if (!hasResolved) {
          hasResolved = true;
          resolve(pc);
        }
      } else if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
        cleanup(`Connection state changed to ${pc.connectionState}`);
      }
    };

    (async () => {
      try {
        pc.addTransceiver('video', { direction: 'recvonly' });
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        console.log(`[WebRTC] Sending offer to backend...`);
        const res = await fetch(backendOfferUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sdp: offer.sdp, type: offer.type }),
        });

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Offer request failed: ${res.status} - ${errorText}`);
        }

        const answer = await res.json();
        if (answer.error) {
           throw new Error(`Backend error: ${answer.error}`);
        }
        
        console.log(`[WebRTC] Received answer from backend.`);
        await pc.setRemoteDescription(new RTCSessionDescription(answer));

      } catch (error) {
        cleanup(`Setup failed: ${error.message}`);
      }
    })();
  });
}


// --- Main Dashboard Page Component ---
const DashboardPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [areaCount, setAreaCount] = useState(0);
  const [cctvCount, setCctvCount] = useState(0);

  const userSession = localStorage.getItem("userSession")
    ? JSON.parse(localStorage.getItem("userSession"))
    : null;
  const username = userSession ? userSession.username : "Guest";

  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  useEffect(() => {
    // This effect fetches data for the top cards, independent of the stream.
    const unsubAreas = onSnapshot(collection(db, "areas"), (snapshot) => {
      setAreaCount(snapshot.size);
    }, (err) => console.error("[DB] Error fetching areas:", err));

    const unsubDevices = onSnapshot(collection(db, "devices"), (snapshot) => {
      const activeDevices = snapshot.docs.filter(doc => doc.data().status === "Active");
      setCctvCount(activeDevices.length);
    }, (err) => console.error("[DB] Error fetching devices:", err));

    return () => {
      unsubAreas();
      unsubDevices();
    };
  }, []);

  const cardData = [
    { icon: ( <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 512 512"> <path fill="#fff" d="M16 240v120h344V240zm312 88H48v-56h280Zm56-88h32v120h-32zm56 0h32v120h-32zm-54.572-66.7a31.98 31.98 0 0 1 2.32-38.418a63.745 63.745 0 0 0 3.479-78.69L385.377 48H348.8l-1.82 1.3l18.207 25.49a31.81 31.81 0 0 1-1.736 39.265a64.1 64.1 0 0 0-4.649 76.993L364.77 200h38.46Zm72 0a31.98 31.98 0 0 1 2.32-38.418a63.745 63.745 0 0 0 3.479-78.69L457.377 48H420.8l-1.82 1.3l18.207 25.49a31.81 31.81 0 0 1-1.736 39.265a64.1 64.1 0 0 0-4.649 76.993L436.77 200h38.46Z"/> </svg> ), number: 4, label: "Terdeteksi Hari ini", },
    { icon: ( <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24"> <path fill="#fff" d="M18.618 7.462L6.403 2.085a1 1 0 0 0-.77-.016a1 1 0 0 0-.552.537l-3 7a1 1 0 0 0 .525 1.313L9.563 13.9L8.323 17H4v-3H2v8h2v-3h4.323c.823 0 1.552-.494 1.856-1.258l1.222-3.054l3.419 1.465a1 1 0 0 0 1.311-.518l3-6.857a1 1 0 0 0-.513-1.316m1.312 8.91l-1.858-.742l1.998-5l1.858.741z"/> </svg> ), number: cctvCount, label: "Perangkat CCTV", },
    { icon: ( <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 256 256"> <path fill="#fff" d="M124 175a8 8 0 0 0 7.94 0c2.45-1.41 60-35 60-94.95A64 64 0 0 0 64 80c0 60 57.58 93.54 60 95m4-119a24 24 0 1 1-24 24a24 24 0 0 1 24-24m112 128c0 31.18-57.71 48-112 48S16 215.18 16 184c0-14.59 13.22-27.51 37.23-36.37a8 8 0 0 1 5.54 15C42.26 168.74 32 176.92 32 184c0 13.36 36.52 32 96 32s96-18.64 96-32c0-7.08-10.26-15.26-26.77-21.36a8 8 0 0 1 5.54-15C226.78 156.49 240 169.41 240 184"/> </svg> ), number: areaCount, label: "Area", },
    { icon: ( <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24"> <path fill="#fff" d="M10.514 6.49a4.5 4.5 0 0 1 2.973 0l7.6 2.66c.803.282.803 1.418 0 1.7l-7.6 2.66a4.5 4.5 0 0 1-2.973 0l-5.509-1.93a1.24 1.24 0 0 0-.436.597a1 1 0 0 1 .013 1.635l.004.018l.875 3.939a.6.6 0 0 1-.585.73H3.125a.6.6 0 0 1-.586-.73l.875-3.94l.005-.017a1 1 0 0 1 .132-1.707a2.35 2.35 0 0 1 .413-.889l-1.05-.367c-.804-.282-.804-1.418 0-1.7z"/><path fill="#fff" d="m6.393 12.83l-.332 2.654c-.057.452.127.92.52 1.196c1.157.815 3.043 1.82 5.42 1.82a9 9 0 0 0 5.473-1.834c.365-.28.522-.727.47-1.152l-.336-2.685l-4.121 1.442a4.5 4.5 0 0 1-2.973 0z"/> </svg> ), number: 15, label: "Mahasiswa", },
  ];
  const detectedInfoData = Array(6).fill({ date: "06/06/2025 23:04:06", message: "Terdeteksi merokok", student: "Ada Mahasiswa" });

  return (
    <div className={`dashboard-container ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
      <Sidebar isOpen={sidebarOpen} toggle={toggleSidebar} />
      <div className="dashboard-main">
        <Navbar toggle={toggleSidebar} username={username} />
        <section className="dashboard-content">
          <div className="dashboard-row card-row">
            {cardData.map((card, index) => <DashboardCard key={index} card={card} />)}
          </div>
          <hr className="dashboard-divider" />
          <div className="dashboard-row two-columns">
            <LeftColumn />
            <RightColumn detectedInfoData={detectedInfoData} />
          </div>
        </section>
      </div>
    </div>
  );
};

const DashboardCard = ({ card }) => (
  <div className="dashboard-card">
    <div className="card-left"><div className="icon-box">{card.icon}</div></div>
    <div className="card-right">
      <div className="card-number">{card.number}</div>
      <div className="card-label">{card.label}</div>
    </div>
  </div>
);

// --- Left Column: CCTV Stream Player ---
const LeftColumn = () => {
  const videoRef = useRef(null);
  const pcRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [streamError, setStreamError] = useState(null);

  // Your backend server URL
  const backendUrl = 'http://127.0.0.1:5050/offer';

  useEffect(() => {
    if (!videoRef.current) return;

    let isMounted = true;

    const startStream = async () => {
      setIsLoading(true);
      setStreamError(null);
      try {
        const pc = await fetchWebRTCStream(videoRef.current, backendUrl);
        if (isMounted) {
          pcRef.current = pc;
          setIsLoading(false);
        } else {
          pc.close(); // Cleanup if component unmounted during setup
        }
      } catch (error) {
        if (isMounted) {
          console.error("[React] Failed to fetch WebRTC stream:", error);
          setStreamError(error.message);
          setIsLoading(false);
        }
      }
    };

    startStream();

    // Cleanup function
    return () => {
      isMounted = false;
      console.log("[React] Cleaning up stream component.");
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
    };
  }, [backendUrl]); // Effect runs once on mount

  return (
    <div className="dashboard-column left-column">
      <div className="cctv-stream-wrapper">
        <div className="rectangle-label">Live CCTV Feed</div>
        <div className="video-container">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="cctv-video"
            style={{ backgroundColor: '#000' }}
          />
          {isLoading && <div className="video-overlay">Memuat stream...</div>}
          {!isLoading && streamError && (
            <div className="video-overlay error">{streamError}</div>
          )}
        </div>
      </div>
    </div>
  );
};

const RightColumn = ({ detectedInfoData }) => (
  <div className="dashboard-column right-column">
    <div className="detected-today">
      <h4>Terdeteksi hari ini</h4>
      <a href="/report" className="chevron-link">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className="chevron-icon">
          <path fill="currentColor" d="M8.7 5.3a1 1 0 0 1 1.4 0l6 6a1 1 0 0 1 0 1.4l-6 6a1 1 0 1 1-1.4-1.4L13.59 12L8.7 7.41a1 1 0 0 1 0-1.41Z" />
        </svg>
      </a>
    </div>
    {detectedInfoData.map((info, i) => (
      <div className="detected-info-row" key={i}>
        <div className="detected-details">
          <div className="detected-date">{info.date}</div>
          <div className="detected-message">{info.message}</div>
          <div className="detected-student">{info.student}</div>
        </div>
        <div className="detected-photo"><div className="photo-placeholder"></div></div>
      </div>
    ))}
  </div>
);

export default DashboardPage;
