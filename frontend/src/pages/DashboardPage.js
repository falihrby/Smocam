// File: frontend/src/pages/DashboardPage.js

import React, { useState, useEffect, useRef } from "react";
import { collection, onSnapshot, query, orderBy, limit, where, Timestamp } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from "../firebaseConfig";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import "../styles/DashboardPage.css";

// --- WebRTC Streaming Logic ---
// FUNGSI INI TIDAK DIUBAH
async function fetchWebRTCStream(videoElement, backendOfferUrl) {
    console.log(`[WebRTC] Initializing stream from ${backendOfferUrl}`);
    const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    return new Promise((resolve, reject) => {
        let isConnectionEstablished = false;

        const cleanup = (errorMsg) => {
            if (isConnectionEstablished && !errorMsg) return;
            isConnectionEstablished = true;

            console.warn(`[WebRTC] Cleaning up connection. Reason: ${errorMsg || 'Normal cleanup'}`);
            if (pc.connectionState !== 'closed') pc.close();
            if (videoElement && videoElement.srcObject) {
                videoElement.srcObject.getTracks().forEach(track => track.stop());
                videoElement.srcObject = null;
            }
            if (errorMsg) reject(new Error(errorMsg));
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
                if (!isConnectionEstablished) {
                    isConnectionEstablished = true;
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

                const response = await fetch(backendOfferUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sdp: offer.sdp, type: offer.type }),
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Backend request failed: ${response.status} ${response.statusText} - ${errorText}`);
                }

                const answer = await response.json();
                if (answer.error) throw new Error(`Backend error: ${answer.error}`);
                
                await pc.setRemoteDescription(new RTCSessionDescription(answer));
                console.log(`[WebRTC] Handshake complete.`);
            } catch (error) {
                cleanup(`Setup failed: ${error.message}`);
            }
        })();
    });
}

// --- Helper Function to Format Firestore Timestamp ---
const formatTimestamp = (firestoreTimestamp) => {
    if (!firestoreTimestamp?.toDate) return "Invalid date";
    const date = firestoreTimestamp.toDate();
    const pad = (num) => String(num).padStart(2, '0');
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

// =============================================
// ===== KOMPONEN DENGAN LOGIKA DIPERBARUI =====
// =============================================
const AreaSelectorAndStream = () => {
    const [areas, setAreas] = useState([]);
    const [devices, setDevices] = useState([]);
    const [selectedArea, setSelectedArea] = useState(''); 
    const [activeStreamTitle, setActiveStreamTitle] = useState('');
    const videoRef = useRef(null);
    const pcRef = useRef(null);
    const [isLoading, setIsLoading] = useState(false);
    const [streamError, setStreamError] = useState(null);
    const backendUrl = 'http://192.168.1.4:5050/offer';

    // Mengambil daftar Area
    useEffect(() => {
        const areasQuery = query(collection(db, "areas"), orderBy("areaName"));
        const unsubscribe = onSnapshot(areasQuery, (snap) => {
            const areaList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // ** PERUBAHAN 1: Logika untuk mengurutkan 'Lobby' ke depan **
            areaList.sort((a, b) => {
                if (a.areaName === 'Lobby') return -1; // 'a' (Lobby) ditaruh sebelum 'b'
                if (b.areaName === 'Lobby') return 1;  // 'b' (Lobby) ditaruh sebelum 'a'
                return a.areaName.localeCompare(b.areaName); // Urutkan sisanya secara alfabetis
            });

            setAreas(areaList);
        }, (err) => console.error("Error fetching areas:", err));
        return () => unsubscribe();
    }, []);

    // Mengambil semua data Perangkat CCTV
    useEffect(() => {
        const devicesQuery = query(collection(db, "devices"));
        const unsubscribe = onSnapshot(devicesQuery, (snap) => {
            const deviceList = snap.docs.map(doc => doc.data());
            setDevices(deviceList);
        }, (err) => console.error("Error fetching devices:", err));
        return () => unsubscribe();
    }, []);

    // Mengatur area default saat data siap
    useEffect(() => {
        if (selectedArea || !areas.length) return;

        const lobbyExists = areas.some(area => area.areaName === 'Lobby');
        
        if (lobbyExists) {
            setSelectedArea('Lobby');
        } else {
            setSelectedArea(areas[0].areaName);
        }

    }, [areas, selectedArea]);

    useEffect(() => {
        const deviceInArea = devices.find(device => device.area === selectedArea);
        const shouldStream = !!deviceInArea;

        const startStream = async () => {
            if (!videoRef.current || pcRef.current) return;
            
            setIsLoading(true);
            setStreamError(null);
            try {
                console.log("Attempting to start WebRTC stream...");
                const pc = await fetchWebRTCStream(videoRef.current, backendUrl);
                pcRef.current = pc;
            } catch (error) {
                console.error("[React] Failed to start stream:", error);
                setStreamError("Gagal menyambungkan ke stream. Periksa konsol backend.");
            } finally {
                if (videoRef.current) {
                    setIsLoading(false);
                }
            }
        };

        const stopStream = () => {
            if (pcRef.current) {
                console.log("[React] Stopping stream and cleaning up connection.");
                pcRef.current.close();
                pcRef.current = null;
            }
        };

        if (shouldStream) {
            setActiveStreamTitle(deviceInArea?.cameraName || selectedArea);
            startStream();
        } else {
            stopStream();
        }
        
        return () => {
            stopStream();
        }

    }, [selectedArea, devices, backendUrl]);
    
    const deviceForSelectedArea = devices.find(device => device.area === selectedArea);
    const shouldShowVideoContainer = !!deviceForSelectedArea;

    return (
        <div className="dashboard-column left-column">
            <div className="area-tabs-container">
                {areas.map(area => (
                    <button 
                        key={area.id}
                        className={`area-tab ${selectedArea === area.areaName ? 'active' : ''}`}
                        onClick={() => setSelectedArea(area.areaName)}
                    >
                        {area.areaName}
                    </button>
                ))}
            </div>

            {shouldShowVideoContainer ? (
                <div className="cctv-stream-wrapper">
                    <h4 className="column-title">{activeStreamTitle}</h4>
                    <div className="video-container">
                        <video ref={videoRef} autoPlay muted playsInline className="cctv-video"/>
                        {isLoading && <div className="video-overlay">Menyambungkan ke stream...</div>}
                        {!isLoading && streamError && <div className="video-overlay error">{streamError}</div>}
                    </div>
                </div>
            ) : (
                <div className="no-device-container">
                    <p>Tidak ada perangkat CCTV di area ini.</p>
                </div>
            )}
        </div>
    );
};


// --- Main Dashboard Page Component ---
const DashboardPage = () => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [areaCount, setAreaCount] = useState(0);
    const [cctvCount, setCctvCount] = useState(0);
    const [detections, setDetections] = useState([]);
    const [todayCount, setTodayCount] = useState(0);
    const [user, setUser] = useState(null);

    const userSession = JSON.parse(localStorage.getItem("userSession")) || { username: "Guest" };
    const username = userSession.username;

    useEffect(() => {
        const auth = getAuth();
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribeAuth();
    }, []);

    useEffect(() => {
        if (!user) return;

        const unsubAreas = onSnapshot(collection(db, "areas"), (snap) => setAreaCount(snap.size), (err) => console.error("Error fetching areas:", err));
        const unsubDevices = onSnapshot(collection(db, "devices"), (snap) => {
            const active = snap.docs.filter(doc => doc.data().status === "Active").length;
            setCctvCount(active);
        }, (err) => console.error("Error fetching devices:", err));

        const recentDetectionsQuery = query(collection(db, "detections"), orderBy("timestamp", "desc"), limit(6));
        const unsubRecent = onSnapshot(recentDetectionsQuery, (snap) => {
            const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setDetections(list);
        }, (err) => console.error("Error fetching recent detections:", err));
        
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const todayQuery = query(collection(db, "detections"), where("timestamp", ">=", Timestamp.fromDate(startOfToday)));
        const unsubToday = onSnapshot(todayQuery, (snap) => setTodayCount(snap.size), (err) => console.error("Error fetching today's count:", err));

        return () => {
            unsubAreas();
            unsubDevices();
            unsubRecent();
            unsubToday();
        };
    }, [user]);

    const cardData = [
        { icon: ( <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 512 512"> <path fill="#fff" d="M16 240v120h344V240zm312 88H48v-56h280Zm56-88h32v120h-32zm56 0h32v120h-32zm-54.572-66.7a31.98 31.98 0 0 1 2.32-38.418a63.745 63.745 0 0 0 3.479-78.69L385.377 48H348.8l-1.82 1.3l18.207 25.49a31.81 31.81 0 0 1-1.736 39.265a64.1 64.1 0 0 0-4.649 76.993L364.77 200h38.46Zm72 0a31.98 31.98 0 0 1 2.32-38.418a63.745 63.745 0 0 0 3.479-78.69L457.377 48H420.8l-1.82 1.3l18.207 25.49a31.81 31.81 0 0 1-1.736 39.265a64.1 64.1 0 0 0-4.649 76.993L436.77 200h38.46Z"/> </svg> ), number: todayCount, label: "Terdeteksi Hari ini" },
        { icon: ( <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24"> <path fill="#fff" d="M18.618 7.462L6.403 2.085a1 1 0 0 0-.77-.016a1 1 0 0 0-.552.537l-3 7a1 1 0 0 0 .525 1.313L9.563 13.9L8.323 17H4v-3H2v8h2v-3h4.323c.823 0 1.552-.494 1.856-1.258l1.222-3.054l3.419 1.465a1 1 0 0 0 1.311-.518l3-6.857a1 1 0 0 0-.513-1.316m1.312 8.91l-1.858-.742l1.998-5l1.858.741z"/> </svg> ), number: cctvCount, label: "Perangkat CCTV" },
        { icon: ( <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 256 256"> <path fill="#fff" d="M124 175a8 8 0 0 0 7.94 0c2.45-1.41 60-35 60-94.95A64 64 0 0 0 64 80c0 60 57.58 93.54 60 95m4-119a24 24 0 1 1-24 24a24 24 0 0 1 24-24m112 128c0 31.18-57.71 48-112 48S16 215.18 16 184c0-14.59 13.22-27.51 37.23-36.37a8 8 0 0 1 5.54 15C42.26 168.74 32 176.92 32 184c0 13.36 36.52 32 96 32s96-18.64 96-32c0-7.08-10.26-15.26-26.77-21.36a8 8 0 0 1 5.54-15C226.78 156.49 240 169.41 240 184"/> </svg> ), number: areaCount, label: "Area" },
        { icon: ( <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24"> <path fill="#fff" d="M10.514 6.49a4.5 4.5 0 0 1 2.973 0l7.6 2.66c.803.282.803 1.418 0 1.7l-7.6 2.66a4.5 4.5 0 0 1-2.973 0l-5.509-1.93a1.24 1.24 0 0 0-.436.597a1 1 0 0 1 .013 1.635l.004.018l.875 3.939a.6.6 0 0 1-.585.73H3.125a.6.6 0 0 1-.586-.73l.875-3.94l.005-.017a1 1 0 0 1 .132-1.707a2.35 2.35 0 0 1 .413-.889l-1.05-.367c-.804-.282-.804-1.418 0-1.7z"/><path fill="#fff" d="m6.393 12.83l-.332 2.654c-.057.452.127.92.52 1.196c1.157.815 3.043 1.82 5.42 1.82a9 9 0 0 0 5.473-1.834c.365-.28.522-.727.47-1.152l-.336-2.685l-4.121 1.442a4.5 4.5 0 0 1-2.973 0z"/> </svg> ), number: 15, label: "Mahasiswa" },
    ];
    
    return (
        <div className={`dashboard-container ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
            <Sidebar isOpen={sidebarOpen} toggle={() => setSidebarOpen(!sidebarOpen)} />
            <div className="dashboard-main">
                <Navbar toggle={() => setSidebarOpen(!sidebarOpen)} username={username} />
                <section className="dashboard-content">
                    <div className="dashboard-row card-row">
                        {cardData.map((card, index) => <DashboardCard key={index} card={card} />)}
                    </div>
                    <hr className="dashboard-divider" />
                    <div className="dashboard-row two-columns">
                        <AreaSelectorAndStream />
                        <RightColumn detectedInfoData={detections} />
                    </div>
                </section>
            </div>
        </div>
    );
};

const DashboardCard = ({ card }) => ( <div className="dashboard-card"> <div className="card-left"><div className="icon-box">{card.icon}</div></div> <div className="card-right"> <div className="card-number">{card.number}</div> <div className="card-label">{card.label}</div> </div> </div> );

const RightColumn = ({ detectedInfoData }) => (
    <div className="dashboard-column right-column">
        <div className="detected-today-header">
            <h4 className="column-title">Terdeteksi hari ini</h4>
            <a href="/report" className="chevron-link">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M8.7 5.3a1 1 0 0 1 1.4 0l6 6a1 1 0 0 1 0 1.4l-6 6a1 1 0 1 1-1.4-1.4L13.59 12L8.7 7.41a1 1 0 0 1 0-1.41Z" /></svg>
            </a>
        </div>
        <div className="detections-list">
            {detectedInfoData.length > 0 ? (
                detectedInfoData.map((info) => (
                    <div className="detected-info-row" key={info.id}>
                        <div className="detected-details">
                            <div className="detected-date">{formatTimestamp(info.timestamp)}</div>
                            <div className="detected-message">{info.message}</div>
                            <div className="detected-student">{info.studentStatus}</div>
                        </div>
                        <div className="detected-photo">
                            <img src={info.imageUrl || "https://placehold.co/100x60/e0e0e0/7f7f7f?text=No+Image"} alt="Detection snapshot" className="photo-snapshot"/>
                        </div>
                    </div>
                ))
            ) : (
                <div className="no-detections-message">Belum ada deteksi hari ini.</div>
            )}
        </div>
    </div>
);

export default DashboardPage;
