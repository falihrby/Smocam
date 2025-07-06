import React, { useState, useEffect, useRef } from "react";
import { collection, onSnapshot, query, orderBy, limit, where, Timestamp } from "firebase/firestore";
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { db, auth } from '../firebaseConfig';

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import "../styles/DashboardPage.css";

const formatTimestamp = (firestoreTimestamp) => {
    if (!firestoreTimestamp?.toDate) return "Invalid date";
    const date = firestoreTimestamp.toDate();
    const pad = (num) => String(num).padStart(2, '0');
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

async function fetchWebRTCStream(videoElement, backendOfferUrl, streamPayload, retries = 0) {
    const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    return new Promise((resolve, reject) => {
        const cleanup = (errorMsg) => {
            if (pc.connectionState === 'closed') return;
            if (videoElement?.srcObject) {
                videoElement.srcObject.getTracks().forEach(track => track.stop());
                videoElement.srcObject = null;
            }
            pc.close();
            if (errorMsg) reject(new Error(errorMsg));
        };

        pc.ontrack = (event) => {
            if (videoElement.srcObject !== event.streams[0]) {
                videoElement.srcObject = event.streams[0];
            }
        };

        pc.onconnectionstatechange = () => {
            if (pc.connectionState === 'connected') {
                resolve(pc);
            } else if (["disconnected", "failed", "closed"].includes(pc.connectionState)) {
                if (retries < 3) {
                    setTimeout(() => {
                        fetchWebRTCStream(videoElement, backendOfferUrl, streamPayload, retries + 1)
                            .then(resolve).catch(reject);
                    }, 3000);
                } else {
                    cleanup(`Connection failed after ${retries + 1} attempts`);
                }
            }
        };

        (async () => {
            try {
                pc.addTransceiver("video", { direction: "recvonly" });
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);

                const fullPayload = {
                    ...streamPayload,
                    sdp: pc.localDescription.sdp,
                    type: pc.localDescription.type,
                };

                const response = await fetch(backendOfferUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(fullPayload),
                });

                if (!response.ok) {
                    throw new Error(`Backend request failed: ${response.status}`);
                }

                const answer = await response.json();
                if (answer.error) throw new Error(`Backend error: ${answer.error}`);
                await pc.setRemoteDescription(new RTCSessionDescription(answer));
            } catch (error) {
                cleanup(error.message);
            }
        })();
    });
}

const DashboardCard = ({ card }) => (
    <div className="dashboard-card">
        <div className="icon-box">{card.icon}</div>
        <div className="card-details">
            <div className="card-number">{card.number}</div>
            <div className="card-label">{card.label}</div>
        </div>
    </div>
);

const RightColumn = ({ detectedInfoData }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const detectionsToday = detectedInfoData
        .filter((info) => info.timestamp?.toDate?.() >= today)
        .slice(0, 5); // ambil 5 teratas saja

    return (
        <div className="dashboard-column right-column">
            <div className="detected-today-header">
                <h4 className="column-title">Terdeteksi Hari Ini</h4>
                <a href="/report" className="chevron-link">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M8.7 5.3a1 1 0 0 1 1.4 0l6 6a1 1 0 0 1 0 1.4l-6 6a1 1 0 1 1-1.4-1.4L13.59 12L8.7 7.41a1 1 0 0 1 0-1.41Z" />
                    </svg>
                </a>
            </div>
            <div className="detections-list">
            {detectionsToday.length > 0 ? (
                detectionsToday.map((info) => {   // ← pakai { } di sini
                console.log(info.imageUrl);     // ← ini akan dieksekusi setiap render
                return (
                    <div className="detected-info-row" key={info.id}>
                    <div className="detected-details">
                        <div className="detected-date">{formatTimestamp(info.timestamp)}</div>
                        <div className="detected-message">{`${info.message} di ${info.area}`}</div>
                    </div>
                    <div className="detected-photo">
                        <img
                            src={info.imageUrl ||
                                "https://placehold.co/100x60/e0e0e0/7f7f7f?text=No+Image"}
                            alt="Detection snapshot"
                            referrerPolicy="no-referrer"
                            className="photo-snapshot"
                        />
                    </div>
                    </div>
                );
                })
            ) : (
                <div className="no-detections-message">Belum ada deteksi hari ini.</div>
            )}
            </div>
        </div>
    );
};

const AreaSelectorAndStream = () => {
    const [areas, setAreas] = useState([]);
    const [devices, setDevices] = useState([]);
    const [selectedArea, setSelectedArea] = useState('');
    const videoRef = useRef(null);
    const pcRef = useRef(null);
    const [isLoading, setIsLoading] = useState(false);
    const [streamError, setStreamError] = useState(null);
    const backendUrl = 'http://192.168.1.8:5050/offer';

    useEffect(() => {
        const unsub = onSnapshot(query(collection(db, "areas"), orderBy("areaName")), (snap) => {
            const areaList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            areaList.sort((a, b) => a.areaName === 'Lobby' ? -1 : b.areaName === 'Lobby' ? 1 : a.areaName.localeCompare(b.areaName));
            setAreas(areaList);
            if (!selectedArea && areaList.length > 0) {
                setSelectedArea(areaList.find(a => a.areaName === 'Lobby')?.areaName || areaList[0].areaName);
            }
        });
        return () => unsub();
    }, [selectedArea]);

    useEffect(() => {
        const unsub = onSnapshot(collection(db, "devices"), (snap) => {
            setDevices(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsub();
    }, []);

    useEffect(() => {
        if (!selectedArea) return;

        const deviceInArea = devices.find(device => device.area === selectedArea);

        const stopStream = () => {
            if (pcRef.current) {
                pcRef.current.close();
                pcRef.current = null;
            }
            if (videoRef.current && videoRef.current.srcObject) {
                videoRef.current.srcObject.getTracks().forEach(track => track.stop());
                videoRef.current.srcObject = null;
            }
        };

        const startStream = async (device) => {
            stopStream();
            if (!videoRef.current) return;

            setIsLoading(true);
            setStreamError(null);

            try {
                const streamPayload = {
                    areaName: device.area,
                    cctvName: device.cameraName
                };
                const pc = await fetchWebRTCStream(videoRef.current, backendUrl, streamPayload);
                pcRef.current = pc;
            } catch (error) {
                setStreamError(`Koneksi ke kamera gagal: ${error.message}`);
            } finally {
                setIsLoading(false);
            }
        };

        if (deviceInArea) {
            startStream(deviceInArea);
        } else {
            stopStream();
            setStreamError(null);
        }

        return () => stopStream();
    }, [selectedArea, devices]);

    const deviceForSelectedArea = devices.find(device => device.area === selectedArea);

    return (
        <div className="dashboard-column left-column">
            <div className="area-tabs-container">
                {areas.map(area => (
                    <button key={area.id} className={`area-tab ${selectedArea === area.areaName ? 'active' : ''}`} onClick={() => setSelectedArea(area.areaName)}>
                        {area.areaName}
                    </button>
                ))}
            </div>

            {deviceForSelectedArea ? (
                <div className="cctv-stream-wrapper">
                    <h4 className="column-title">{deviceForSelectedArea.cameraName || selectedArea}</h4>
                    <div className="video-container">
                        <video ref={videoRef} autoPlay muted playsInline className="cctv-video" />
                        {isLoading && <div className="video-overlay">Menyambungkan ke stream...</div>}
                        {!isLoading && streamError && <div className="video-overlay error">{streamError}</div>}
                    </div>
                </div>
            ) : (
                <div className="no-device-container">
                    <p>Tidak ada perangkat CCTV di area "{selectedArea}".</p>
                </div>
            )}
        </div>
    );
};

const DashboardPage = () => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [areaCount, setAreaCount] = useState(0);
    const [cctvCount, setCctvCount] = useState(0);
    const [detections, setDetections] = useState([]);
    const [todayCount, setTodayCount] = useState(0);
    const [user, setUser] = useState(null);

    const { username } = JSON.parse(localStorage.getItem("userSession") || '{}') || { username: "Guest" };

    useEffect(() => {
        const initAuth = async () => {
            try {
                await signInAnonymously(auth);
            } catch (e) {
                console.error("Anonymous authentication error:", e);
            }
        };
        initAuth();

        const unsubscribeAuth = onAuthStateChanged(auth, setUser);
        return () => unsubscribeAuth();
    }, []);

    useEffect(() => {
        if (!user) return;

        const unsubAreas = onSnapshot(collection(db, "areas"), (snap) => setAreaCount(snap.size));
        const unsubDevices = onSnapshot(collection(db, "devices"), (snap) => {
            setCctvCount(snap.docs.filter(doc => doc.data().status === "Active").length);
        });

        const recentDetectionsQuery = query(collection(db, "detections"), orderBy("timestamp", "desc"), limit(6));
        const unsubRecent = onSnapshot(recentDetectionsQuery, (snap) => {
            setDetections(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const todayQuery = query(collection(db, "detections"), where("timestamp", ">=", Timestamp.fromDate(startOfToday)));
        const unsubToday = onSnapshot(todayQuery, (snap) => setTodayCount(snap.size));

        return () => { unsubAreas(); unsubDevices(); unsubRecent(); unsubToday(); };
    }, [user]);

    const cardData = [
        { icon: '🚬', number: todayCount, label: "Terdeteksi Hari ini" },
        { icon: '📹', number: cctvCount, label: "Perangkat CCTV" },
        { icon: '📍', number: areaCount, label: "Area" },
    ];

    return (
        <div className={`dashboard-container ${sidebarOpen ? "" : "sidebar-closed"}`}>
            <Sidebar isOpen={sidebarOpen} toggle={() => setSidebarOpen(!sidebarOpen)} />
            <div className="dashboard-main">
                <Navbar toggle={() => setSidebarOpen(!sidebarOpen)} username={username} />
                <main className="dashboard-content">
                    <div className="dashboard-header">
                        {cardData.map((card, index) => <DashboardCard key={index} card={card} />)}
                    </div>
                    <hr className="dashboard-divider" />
                    <div className="dashboard-body">
                        <AreaSelectorAndStream />
                        <RightColumn detectedInfoData={detections} />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DashboardPage;
