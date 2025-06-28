// frontend/src/pages/ReportPage.js
// Deskripsi: Versi ini telah diperbaiki untuk menghapus impor yang tidak digunakan.

import React, { useState, useEffect } from "react";
// 'useNavigate' dihapus karena tidak digunakan
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
// 'where' dihapus karena tidak digunakan
import { db } from "../firebaseConfig";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import Dropdown from "../components/Dropdown";
import "../styles/ReportPage.css";

// Helper function untuk memformat Firestore Timestamp
const formatTimestamp = (firestoreTimestamp) => {
    if (!firestoreTimestamp?.toDate) return "Tanggal tidak valid";
    const date = firestoreTimestamp.toDate();
    const pad = (num) => String(num).padStart(2, '0');
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};


const ReportPage = () => {
    // 'navigate' dihapus karena tidak digunakan
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [allDetections, setAllDetections] = useState([]);
    const [filteredDetections, setFilteredDetections] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);

    // State untuk filter
    const [areas, setAreas] = useState(["Semua"]);
    const [cctvs, setCctvs] = useState(["Semua"]);
    const [selectedArea, setSelectedArea] = useState("Semua");
    const [selectedCCTV, setSelectedCCTV] = useState("Semua");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const rowsPerPage = 10;
    const userSession = JSON.parse(localStorage.getItem("userSession")) || { username: "Guest" };
    const username = userSession.username;

    // Fetch semua data (areas, devices, detections) dari Firestore saat komponen dimuat
    useEffect(() => {
        // Ambil data area untuk filter dropdown
        const unsubAreas = onSnapshot(collection(db, "areas"), (snap) => {
            const areaNames = snap.docs.map(doc => doc.data().areaName);
            setAreas(["Semua", ...new Set(areaNames)]);
        }, (err) => console.error("Error fetching areas:", err));

        // Ambil data cctv/device untuk filter dropdown
        const unsubDevices = onSnapshot(collection(db, "devices"), (snap) => {
            const cctvNames = snap.docs.map(doc => doc.data().cameraName);
            setCctvs(["Semua", ...new Set(cctvNames)]);
        }, (err) => console.error("Error fetching devices:", err));
        
        // Ambil semua data deteksi, diurutkan dari yang terbaru
        const detectionsQuery = query(collection(db, "detections"), orderBy("timestamp", "desc"));
        const unsubDetections = onSnapshot(detectionsQuery, (snap) => {
            const detectionList = snap.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setAllDetections(detectionList);
            setFilteredDetections(detectionList); // Set data awal yang belum difilter
        }, (err) => console.error("Error fetching detections:", err));

        // Cleanup listeners saat komponen di-unmount
        return () => {
            unsubAreas();
            unsubDevices();
            unsubDetections();
        };
    }, []);

    // Terapkan filter setiap kali ada perubahan pada state filter atau data utama
    useEffect(() => {
        let data = [...allDetections];

        // Filter berdasarkan area
        if (selectedArea !== "Semua") {
            data = data.filter(d => d.area === selectedArea);
        }

        // Filter berdasarkan CCTV
        if (selectedCCTV !== "Semua") {
            data = data.filter(d => d.cctvName === selectedCCTV);
        }

        // Filter berdasarkan tanggal mulai
        if (startDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            data = data.filter(d => d.timestamp.toDate() >= start);
        }
        
        // Filter berdasarkan tanggal selesai
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            data = data.filter(d => d.timestamp.toDate() <= end);
        }

        setFilteredDetections(data);
        setCurrentPage(1); // Reset ke halaman pertama setelah filter
    }, [selectedArea, selectedCCTV, startDate, endDate, allDetections]);


    // Logika Paginasi
    const totalPages = Math.ceil(filteredDetections.length / rowsPerPage);
    const startRow = (currentPage - 1) * rowsPerPage;
    const currentRows = filteredDetections.slice(startRow, startRow + rowsPerPage);

    const goToPage = (pageNumber) => {
        if (pageNumber >= 1 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
        }
    };

    const printReport = () => window.print();

    return (
        <div className={`layout-container ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
            <Sidebar isOpen={sidebarOpen} toggle={() => setSidebarOpen(!sidebarOpen)} />
            <div className="layout-main">
                <Navbar toggle={() => setSidebarOpen(!sidebarOpen)} username={username} />
                <div className="page-content">
                    <div className="custom-card">
                        <div className="header-row">
                            <h1>Laporan Terdeteksi Merokok</h1>
                            <button className="print-button" onClick={printReport}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="#fff" d="M17 7.846H7v-3.23h10zm.616 4.27q.425 0 .712-.288t.288-.712t-.288-.713t-.712-.288t-.713.288t-.287.713t.287.712t.713.288M16 19v-4.538H8V19zm1 1H7v-4H3.577v-5.384q0-.85.577-1.425t1.423-.576h12.846q.85 0 1.425.576t.575 1.424V16H17z"/></svg>
                                Cetak
                            </button>
                        </div>
                        <hr className="card-divider" />
                        <div className="filter-container">
                            <Dropdown label="Area" options={areas} selectedValue={selectedArea} onChange={setSelectedArea} />
                            <Dropdown label="CCTV" options={cctvs} selectedValue={selectedCCTV} onChange={setSelectedCCTV} />
                            <div className="date-filter">
                                <input type="date" className="filter-date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                                <span className="date-filter-separator">sampai</span>
                                <input type="date" className="filter-date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                            </div>
                        </div>

                        <table className="custom-table">
                            <thead>
                                <tr>
                                    <th>No</th>
                                    <th>Tanggal dan Waktu</th>
                                    <th>Deskripsi</th>
                                    <th>Area</th>
                                    <th>CCTV</th>
                                    <th>Gambar</th>
                                    <th style={{ width: "170px" }}>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentRows.length > 0 ? currentRows.map((row, index) => (
                                    <tr key={row.id}>
                                        <td>{startRow + index + 1}</td>
                                        <td>{formatTimestamp(row.timestamp)}</td>
                                        <td>{row.message}</td>
                                        <td>{row.area}</td>
                                        <td>{row.cctvName}</td>
                                        <td>
                                            <img src={row.imageUrl || "https://placehold.co/125x70/e0e0e0/7f7f7f?text=No+Image"} alt="Detection" className="empty-box" style={{objectFit: 'cover', width: '125px', height: '70px'}}/>
                                        </td>
                                        <td>
                                            <div className="report-page-action-buttons">
                                                <button className="report-page-action-button" onClick={() => window.open(row.imageUrl, '_blank')}>Lihat Bukti</button>
                                                {/* Tambahkan fungsionalitas lain jika perlu */}
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Tidak ada data yang cocok dengan filter.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        <hr className="card-divider" />
                        {totalPages > 1 && (
                            <div className="pagination">
                                <button className="pagination-button" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>Previous</button>
                                {Array.from({ length: totalPages }, (_, index) => (
                                    <button
                                        key={index}
                                        className={`pagination-button ${currentPage === index + 1 ? "active" : ""}`}
                                        onClick={() => goToPage(index + 1)}
                                    >
                                        {index + 1}
                                    </button>
                                ))}
                                <button className="pagination-button" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>Next</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportPage;
