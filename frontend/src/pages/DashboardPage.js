import React, { useState, useRef, useEffect, useCallback } from "react";
// Firebase and component imports - ensure these paths are correct for your project
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebaseConfig"; 
import Sidebar from "../components/Sidebar"; 
import Navbar from "../components/Navbar"; 
import "../styles/DashboardPage.css"; 

// Function to fetch WebRTC stream (Integrated and Updated Version)
async function fetchWebRTCStream(videoElement, rtspUrl, backendOfferUrl = 'http://192.168.1.4:5050/offer') {
  console.log(`[WebRTC] Initializing WebRTC stream for: ${rtspUrl} via ${backendOfferUrl}`);
  
  return new Promise((resolve, reject) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    let streamResolved = false;
    let currentStream = videoElement.srcObject instanceof MediaStream ? videoElement.srcObject : new MediaStream();

    const cleanup = (errorMsg) => {
      const isError = !!errorMsg;
      if (streamResolved && !isError) return; 
      
      if (isError && streamResolved) {
        console.warn(`[WebRTC] Error after stream resolution for ${rtspUrl}: ${errorMsg}. Connection might have been closed already.`);
      } else if (isError) {
        streamResolved = true; 
      }

      console.warn(`[WebRTC] Cleaning up connection for ${rtspUrl}. Reason: ${errorMsg || 'Normal cleanup'}`);
      if (pc.signalingState !== 'closed') {
        pc.close();
      }
      if (videoElement && videoElement.srcObject === currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        videoElement.srcObject = null; 
      }
      // Only reject if not already resolved successfully, or if an error occurs after resolution but before 'connected'
      if (isError && (!streamResolved || (streamResolved && pc.connectionState !== 'connected' && pc.connectionState !== 'completed'))) {
         reject(new Error(errorMsg));
      }
    };

    pc.ontrack = (event) => {
      console.log(`[WebRTC] 🔥 ontrack: ${event.track.kind} for RTSP URL: ${rtspUrl}`);
      if (!(currentStream instanceof MediaStream)) {
        currentStream = new MediaStream();
      }
      currentStream.getTracks().filter(t => t.kind === event.track.kind).forEach(t => {
        currentStream.removeTrack(t);
        t.stop();
      });
      currentStream.addTrack(event.track);

      if (videoElement.srcObject !== currentStream) {
        videoElement.srcObject = currentStream;
      }
      console.log(`[WebRTC] Assigned/updated stream to video element for ${rtspUrl}.`);
      
      videoElement.onloadedmetadata = () => {
        console.log(`[WebRTC] Video metadata loaded for ${rtspUrl}. Dimensions: ${videoElement.videoWidth}x${videoElement.videoHeight}.`);
        videoElement.play()
          .then(() => {
            console.log(`[WebRTC] Video playback initiated for ${rtspUrl}. Waiting for 'connected' state.`);
          })
          .catch(err => {
            console.error(`[WebRTC] Video play() FAILED for ${rtspUrl}:`, err);
            cleanup(`Video play() failed: ${err.name} - ${err.message}`);
          });
      };
    };

    videoElement.onerror = (e) => {
      console.error(`[WebRTC] Video element error event for ${rtspUrl}. Code: ${videoElement.error?.code}, Message: ${videoElement.error?.message}`, e);
      cleanup(`Video element error: ${videoElement.error?.message || 'Unknown video error'} (Code: ${videoElement.error?.code})`);
    };
    videoElement.onstalled = () => console.warn(`[WebRTC] Video stalled for ${rtspUrl}.`);
    videoElement.onwaiting = () => console.warn(`[WebRTC] Video waiting for data for ${rtspUrl}.`);

    pc.onicecandidate = (event) => {
      // if (event.candidate) console.debug(`[WebRTC] ICE candidate for ${rtspUrl}:`, event.candidate.candidate.substring(0, 70) + "...");
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`[WebRTC] ICE connection state change for ${rtspUrl}: ${pc.iceConnectionState}`);
      if (pc.iceConnectionState === 'failed') {
        cleanup(`ICE connection failed for ${rtspUrl}`);
      } else if (pc.iceConnectionState === 'disconnected') {
        console.warn(`[WebRTC] ICE connection for ${rtspUrl} is disconnected. Monitoring peer connection state.`);
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`[WebRTC] Peer Connection state change for ${rtspUrl}: ${pc.connectionState}`);
      if ((pc.connectionState === 'connected' || pc.connectionState === 'completed')) {
        if (!streamResolved) {
          console.log(`[WebRTC] Peer connection for ${rtspUrl} is ${pc.connectionState}. Resolving with PC object.`);
          streamResolved = true;
          resolve(pc); 
        }
      } else if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        cleanup(`Peer connection ${pc.connectionState} for ${rtspUrl}`);
      } else if (pc.connectionState === 'disconnected') {
        console.warn(`[WebRTC] Peer connection for ${rtspUrl} is disconnected. Monitoring...`);
      }
    };

    pc.addTransceiver('video', { direction: 'recvonly' });

    (async () => {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        console.log(`[WebRTC] Sending offer for ${rtspUrl} to backend (${backendOfferUrl})...`);
        const res = await fetch(backendOfferUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sdp: offer.sdp,
            type: offer.type,
            rtspUrl,
          }),
        });

        if (!res.ok) {
          const errorText = await res.text();
          console.error(`[WebRTC] Offer request to backend failed for ${rtspUrl}: ${res.status} ${res.statusText}`, errorText);
          throw new Error(`Offer to backend failed: ${res.status} ${res.statusText}. Response: ${errorText}`);
        }

        const answer = await res.json();
        if (answer.error) { 
            console.error(`[WebRTC] Backend returned an error for ${rtspUrl}: ${answer.error}`);
            throw new Error(`Backend error: ${answer.error}`);
        }
        console.log(`[WebRTC] Received answer for ${rtspUrl} from backend.`);
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        console.log(`[WebRTC] Remote description set for ${rtspUrl}. WebRTC setup process initiated. Waiting for connection...`);
      } catch (error) {
        console.error(`[WebRTC] Error during WebRTC setup signaling for ${rtspUrl}:`, error);
        cleanup(`Setup signaling error: ${error.message}`);
      }
    })();
  });
}

const DashboardPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedArea, setSelectedArea] = useState("Semua Area");
  const [selectedBox, setSelectedBox] = useState(null);
  const areaButtonsRef = useRef(null);
  const rectangleRef = useRef(null);
  const [areaButtons, setAreaButtons] = useState(["Semua Area"]);
  const [areaCount, setAreaCount] = useState(0);
  const [cctvCount, setCctvCount] = useState(0);
  const [devices, setDevices] = useState([]);
  
  const [isStreamLoading, setIsStreamLoading] = useState(false);
  const [streamError, setStreamError] = useState(null);
  const [isStreamPlaying, setIsStreamPlaying] = useState(false);

  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const currentPcRef = useRef(null); 

  const userSession = localStorage.getItem("userSession") 
    ? JSON.parse(localStorage.getItem("userSession")) 
    : null;
  const username = userSession ? userSession.username : "Guest";

  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  const handleMouseDrag = (e) => {
    if (e.type === 'touchstart') return;
    e.preventDefault();
    const scrollContainer = areaButtonsRef.current;
    if (!scrollContainer) return;
    let startX = e.clientX;
    let scrollLeft = scrollContainer.scrollLeft;
    let isDragging = true;
    const onMouseMove = (event) => {
      if (!isDragging) return;
      const x = event.clientX;
      const walk = (startX - x) * 1.5;
      scrollContainer.scrollLeft = scrollLeft + walk;
    };
    const onMouseUp = () => {
      isDragging = false;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  const handleBoxClick = useCallback((box) => {
    console.log("[DashboardPage] Box clicked, new selectedBox ID:", box?.id);
    setSelectedBox(box); 
  }, []);

  useEffect(() => {
    console.log("[DashboardPage] Firestore data fetching. InitialLoad:", initialLoadComplete, "SelectedBox:", selectedBox?.id);
    const areasCollectionRef = collection(db, "areas");
    const devicesCollectionRef = collection(db, "devices");
    const fetchedAreas = new Set();

    const unsubAreas = onSnapshot(areasCollectionRef, (snapshot) => {
      snapshot.docs.forEach((doc) => fetchedAreas.add(doc.data().areaName));
      setAreaButtons(["Semua Area", ...Array.from(fetchedAreas)]);
      setAreaCount(fetchedAreas.size);
    }, (err) => console.error("[DB] Error fetching areas:", err));

    const unsubDevices = onSnapshot(devicesCollectionRef, (snapshot) => {
      console.log("[DB] Devices snapshot received.");
      const devicesData = snapshot.docs.map((doc) => {
        const d = doc.data();
        if (!d.username || !d.password || !d.ipAddress || !d.cameraPort) {
          console.warn(`[DB] Device ${doc.id} missing RTSP components.`);
          return null;
        }
        let path = d.defaultStreamPath || "/Streaming/Channels/101";
        if (d.ipAddress === "192.168.1.8") path = d.subStreamPath || "/media/video1";
        else if (d.cameraName?.toLowerCase().includes("unv")) path = d.mainStreamPath || "/media/video2";
        const rtspUrl = `rtsp://${d.username}:${d.password}@${d.ipAddress}:${d.cameraPort}${path}`;
        return { id: doc.id, ...d, rtspUrl };
      }).filter(device => device && device.status === "Active");

      setDevices(devicesData);
      setCctvCount(devicesData.length);

      if (!initialLoadComplete && devicesData.length > 0) {
        if (!selectedBox || !devicesData.find(d => d.id === selectedBox?.id)) {
          console.log("[DB] Setting initial selectedBox:", devicesData[0].id);
          setSelectedBox(devicesData[0]);
        }
        setInitialLoadComplete(true);
      } else if (initialLoadComplete && selectedBox && !devicesData.find(d => d.id === selectedBox.id)) {
        console.log("[DB] Selected camera no longer active. Resetting.");
        setSelectedBox(devicesData.length > 0 ? devicesData[0] : null);
      } else if (devicesData.length === 0 && selectedBox !== null) {
        console.log("[DB] No active devices. Clearing selection.");
        setSelectedBox(null);
      }
    }, (err) => console.error("[DB] Error fetching devices:", err));

    return () => {
      console.log("[DB] Unsubscribing from Firestore.");
      unsubAreas();
      unsubDevices();
    };
  }, [initialLoadComplete, selectedBox]);

  useEffect(() => {
    const videoEl = rectangleRef.current;
    console.log(`[WebRTC Effect] Triggered. SelectedBox: ${selectedBox?.id}, URL: ${selectedBox?.rtspUrl}`);
    setIsStreamPlaying(false);

    if (!selectedBox || !selectedBox.rtspUrl || !videoEl) {
      if (currentPcRef.current) {
        console.log("[WebRTC Effect] Closing previous connection (no box/URL).");
        currentPcRef.current.close();
        currentPcRef.current = null;
      }
      if (videoEl?.srcObject) {
        videoEl.srcObject.getTracks().forEach(track => track.stop());
        videoEl.srcObject = null;
      }
      setStreamError(null);
      setIsStreamLoading(false);
      return;
    }

    console.log("[WebRTC Effect] Attempting to fetch stream for:", selectedBox.cameraName);
    setIsStreamLoading(true);
    setStreamError(null);

    if (currentPcRef.current) {
      console.log("[WebRTC Effect] Closing existing connection.");
      currentPcRef.current.close();
      currentPcRef.current = null;
    }
    if (videoEl.srcObject) {
        videoEl.srcObject.getTracks().forEach(track => track.stop());
        videoEl.srcObject = null;
    }

    let localPcForCleanup;
    fetchWebRTCStream(videoEl, selectedBox.rtspUrl)
      .then((pc) => { 
        console.log("[WebRTC Effect] Connection successful for:", selectedBox.cameraName);
        currentPcRef.current = pc; 
        localPcForCleanup = pc;
        // isStreamLoading set to false by 'playing' event
      })
      .catch(err => {
        console.error("[WebRTC Effect] Failed to establish stream for:", selectedBox.cameraName, err);
        setStreamError(err.message || "Failed to load stream.");
        setIsStreamLoading(false);
        if (currentPcRef.current === localPcForCleanup && localPcForCleanup) { 
             currentPcRef.current = null;
        }
      });

    return () => {
      console.log("[WebRTC Effect] Cleanup for SelectedBox ID:", selectedBox?.id);
      const pcToClose = currentPcRef.current || localPcForCleanup;
      if (pcToClose) {
        console.log("[WebRTC Effect] Closing connection in cleanup.");
        pcToClose.close();
        if (currentPcRef.current === pcToClose) currentPcRef.current = null;
      }
      if (videoEl?.srcObject) {
        videoEl.srcObject.getTracks().forEach(track => track.stop());
        videoEl.srcObject = null;
      }
       setIsStreamLoading(false); 
       setIsStreamPlaying(false);
    };
  }, [selectedBox]); 

  useEffect(() => {
    const videoEl = rectangleRef.current;
    if (!videoEl || !selectedBox) {
        setIsStreamPlaying(false);
        return;
    }
    const handlePlaying = () => {
        console.log("[Video Event] 'playing' for:", selectedBox?.cameraName);
        setIsStreamPlaying(true);
        setStreamError(null); 
        setIsStreamLoading(false); 
    };
    const handleWaiting = () => {
        console.warn("[Video Event] 'waiting' (buffering) for:", selectedBox?.cameraName);
        setIsStreamPlaying(false); 
        setIsStreamLoading(true); 
    };
    const handleError = (e) => { 
        console.error("[Video Event] HTMLMediaElement 'error' for:", selectedBox?.cameraName, videoEl.error);
        setIsStreamPlaying(false);
        if (!streamError) { 
            setStreamError(`Video player error: ${videoEl.error?.message || 'Unknown'} (Code: ${videoEl.error?.code})`);
        }
        setIsStreamLoading(false);
    };
    videoEl.addEventListener('playing', handlePlaying);
    videoEl.addEventListener('waiting', handleWaiting);
    videoEl.addEventListener('error', handleError);
    return () => {
        videoEl.removeEventListener('playing', handlePlaying);
        videoEl.removeEventListener('waiting', handleWaiting);
        videoEl.removeEventListener('error', handleError);
    };
  }, [selectedBox, streamError]);

  const filteredDevices = selectedArea === "Semua Area" ? devices : devices.filter(device => device.area === selectedArea);

  const cardData = [
    { icon: ( <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 512 512"> <path fill="#fff" d="M16 240v120h344V240zm312 88H48v-56h280Zm56-88h32v120h-32zm56 0h32v120h-32zm-54.572-66.7a31.98 31.98 0 0 1 2.32-38.418a63.745 63.745 0 0 0 3.479-78.69L385.377 48H348.8l-1.82 1.3l18.207 25.49a31.81 31.81 0 0 1-1.736 39.265a64.1 64.1 0 0 0-4.649 76.993L364.77 200h38.46Zm72 0a31.98 31.98 0 0 1 2.32-38.418a63.745 63.745 0 0 0 3.479-78.69L457.377 48H420.8l-1.82 1.3l18.207 25.49a31.81 31.81 0 0 1-1.736 39.265a64.1 64.1 0 0 0-4.649 76.993L436.77 200h38.46Z"/> </svg> ), number: 4, label: "Terdeteksi Hari ini", },
    { icon: ( <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24"> <path fill="#fff" d="M18.618 7.462L6.403 2.085a1 1 0 0 0-.77-.016a1 1 0 0 0-.552.537l-3 7a1 1 0 0 0 .525 1.313L9.563 13.9L8.323 17H4v-3H2v8h2v-3h4.323c.823 0 1.552-.494 1.856-1.258l1.222-3.054l3.419 1.465a1 1 0 0 0 1.311-.518l3-6.857a1 1 0 0 0-.513-1.316m1.312 8.91l-1.858-.742l1.998-5l1.858.741z"/> </svg> ), number: cctvCount, label: "Perangkat CCTV", },
    { icon: ( <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 256 256"> <path fill="#fff" d="M124 175a8 8 0 0 0 7.94 0c2.45-1.41 60-35 60-94.95A64 64 0 0 0 64 80c0 60 57.58 93.54 60 95m4-119a24 24 0 1 1-24 24a24 24 0 0 1 24-24m112 128c0 31.18-57.71 48-112 48S16 215.18 16 184c0-14.59 13.22-27.51 37.23-36.37a8 8 0 0 1 5.54 15C42.26 168.74 32 176.92 32 184c0 13.36 36.52 32 96 32s96-18.64 96-32c0-7.08-10.26-15.26-26.77-21.36a8 8 0 0 1 5.54-15C226.78 156.49 240 169.41 240 184"/> </svg> ), number: areaCount, label: "Area", },
    { icon: ( <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24"> <path fill="#fff" d="M10.514 6.49a4.5 4.5 0 0 1 2.973 0l7.6 2.66c.803.282.803 1.418 0 1.7l-7.6 2.66a4.5 4.5 0 0 1-2.973 0l-5.509-1.93a1.24 1.24 0 0 0-.436.597a1 1 0 0 1 .013 1.635l.004.018l.875 3.939a.6.6 0 0 1-.585.73H3.125a.6.6 0 0 1-.586-.73l.875-3.94l.005-.017a1 1 0 0 1 .132-1.707a2.35 2.35 0 0 1 .413-.889l-1.05-.367c-.804-.282-.804-1.418 0-1.7z"/><path fill="#fff" d="m6.393 12.83l-.332 2.654c-.057.452.127.92.52 1.196c1.157.815 3.043 1.82 5.42 1.82a9 9 0 0 0 5.473-1.834c.365-.28.522-.727.47-1.152l-.336-2.685l-4.121 1.442a4.5 4.5 0 0 1-2.973 0z"/> </svg> ), number: 15, label: "Mahasiswa", },
  ];
  const detectedInfoData = Array(6).fill({ date: "02/02/2023 10:04:06", message: "Terdeteksi merokok", student: "Ada Mahasiswa" });

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
            <LeftColumn
              areaButtons={areaButtons}
              selectedArea={selectedArea}
              setSelectedArea={setSelectedArea}
              areaButtonsRef={areaButtonsRef}
              handleMouseDrag={handleMouseDrag}
              rectangleRef={rectangleRef}
              devices={filteredDevices}
              loading={isStreamLoading} 
              handleBoxClick={handleBoxClick}
              selectedBox={selectedBox}
              streamError={streamError} 
              isStreamPlaying={isStreamPlaying}
            />
            <RightColumn detectedInfoData={detectedInfoData} />
          </div>
        </section>
      </div>
    </div>
  );
};

const DashboardCard = ({ card }) => ( <div className="dashboard-card"> <div className="card-left"><div className="icon-box">{card.icon}</div></div> <div className="card-right"> <div className="card-number">{card.number}</div> <div className="card-label">{card.label}</div> </div> </div> );

const LeftColumn = ({ areaButtons, selectedArea, setSelectedArea, areaButtonsRef, handleMouseDrag, rectangleRef, devices, loading, handleBoxClick, selectedBox, streamError, isStreamPlaying, }) => ( <div className="dashboard-column left-column"> <div className="area-buttons" ref={areaButtonsRef} onMouseDown={handleMouseDrag} onTouchStart={handleMouseDrag}> {areaButtons.map((area, i) => ( <button key={i} className={`area-button ${selectedArea === area ? "active" : ""}`} onClick={() => setSelectedArea(area)}>{area}</button> ))} </div> <div className="empty-rectangle-wrapper"> {selectedBox && <div className="rectangle-label">{selectedBox.cameraName || "Kamera"}</div>} <video ref={rectangleRef} autoPlay muted playsInline className="cctv-video" style={{ display: selectedBox ? 'block' : 'none', backgroundColor: '#000' }} /> {loading && <div className="loading-indicator">Memuat stream...</div>} {!loading && !selectedBox && devices.length > 0 && ( <div className="no-cameras-message">Pilih kamera untuk memulai stream.</div> )} {!loading && !selectedBox && devices.length === 0 && ( <div className="no-cameras-message">Tidak ada kamera aktif di area ini.</div> )} {!loading && selectedBox && streamError && ( <div className="stream-error-message">{streamError}</div> )} {!loading && selectedBox && !isStreamPlaying && !streamError && ( <div className="stream-error-message">Gagal memuat stream atau stream tidak tersedia. (Periksa konsol)</div> )} </div> {devices.length > 0 && ( <div className="scrollable-boxes-container"> <div className="scrollable-boxes"> {devices.map((device) => ( <div className={`scroll-box-wrapper ${selectedBox?.id === device.id ? "selected" : ""}`} key={device.id} onClick={() => handleBoxClick(device)} title={device.cameraName || device.id} > <div className="scroll-box"><div className="scroll-box-content"></div></div> <div className="scroll-box-label">{device.cameraName || device.id}</div> </div> ))} </div> </div> )} </div> );

const RightColumn = ({ detectedInfoData }) => ( <div className="dashboard-column right-column"> <div className="detected-today"> <h4>Terdeteksi hari ini</h4> <a href="/report" className="chevron-link"> <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className="chevron-icon"> <path fill="currentColor" d="M8.7 5.3a1 1 0 0 1 1.4 0l6 6a1 1 0 0 1 0 1.4l-6 6a1 1 0 1 1-1.4-1.4L13.59 12L8.7 7.41a1 1 0 0 1 0-1.41Z" /> </svg> </a> </div> {detectedInfoData.map((info, i) => ( <div className="detected-info-row" key={i}> <div className="detected-details"> <div className="detected-date">{info.date}</div> <div className="detected-message">{info.message}</div> <div className="detected-student">{info.student}</div> </div> <div className="detected-photo"><div className="photo-placeholder"></div></div> </div> ))} </div> );

export default DashboardPage;
