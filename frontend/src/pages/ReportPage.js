// frontend/src/pages/ReportPage.js
// Deskripsi   : Halaman laporan (Report) — menampilkan tabel deteksi, filter, paginasi,
//               tombol Print dan **Export CSV**. Kolom gambar diganti menjadi URL teks.
// Catatan     : Pastikan komponen Sidebar, Navbar, dan Dropdown sudah ada.
// -----------------------------------------------------------------------------
import React, { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../firebaseConfig";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import Dropdown from "../components/Dropdown";
import "../styles/ReportPage.css";
import { useNavigate } from "react-router-dom";

// ─────────────────────────────────────────────────────────────────────────────
// Util: Format timestamp Firestore → string ID
// ─────────────────────────────────────────────────────────────────────────────
const formatTimestamp = (firestoreTimestamp) => {
  if (!firestoreTimestamp?.toDate) return "Tanggal tidak valid";
  const date = firestoreTimestamp.toDate();
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

// ============================================================================
// ⇣  Komponen Utama — ReportPage  ⇣
// ============================================================================
const ReportPage = () => {
  // ───────── State basic UI ─────────
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [allDetections, setAllDetections] = useState([]);
  const [filteredDetections, setFilteredDetections] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  // ───────── State filter ─────────
  const [areas, setAreas] = useState(["Semua"]);
  const [cctvs, setCctvs] = useState(["Semua"]);
  const [selectedArea, setSelectedArea] = useState("Semua");
  const [selectedCCTV, setSelectedCCTV] = useState("Semua");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // ───────── Konstanta UI ─────────
  const rowsPerPage = 10;
  const { username = "Guest" } = JSON.parse(localStorage.getItem("userSession")) || {};

  // ========================================================================
  // 1) Ambil data Firestore (areas, devices, detections)
  // ========================================================================
  useEffect(() => {
    const unsubAreas = onSnapshot(collection(db, "areas"), (snap) => {
      const list = snap.docs.map((d) => d.data().areaName);
      setAreas(["Semua", ...new Set(list)]);
    });

    const unsubDevices = onSnapshot(collection(db, "devices"), (snap) => {
      const list = snap.docs.map((d) => d.data().cameraName);
      setCctvs(["Semua", ...new Set(list)]);
    });

    const unsubDetections = onSnapshot(
      query(collection(db, "detections"), orderBy("timestamp", "desc")),
      (snap) => {
        const list = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setAllDetections(list);
        setFilteredDetections(list); // data awal
      }
    );

    return () => {
      unsubAreas();
      unsubDevices();
      unsubDetections();
    };
  }, []);

  // ========================================================================
  // 2) Terapkan filter setiap perubahan
  // ========================================================================
  useEffect(() => {
    let data = [...allDetections];

    if (selectedArea !== "Semua") data = data.filter((d) => d.area === selectedArea);
    if (selectedCCTV !== "Semua") data = data.filter((d) => d.cctvName === selectedCCTV);

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      data = data.filter((d) => d.timestamp.toDate() >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      data = data.filter((d) => d.timestamp.toDate() <= end);
    }

    setFilteredDetections(data);
    setCurrentPage(1);
  }, [selectedArea, selectedCCTV, startDate, endDate, allDetections]);

  // ========================================================================
  // 3) Pagination helpers
  // ========================================================================
  const totalPages = Math.ceil(filteredDetections.length / rowsPerPage) || 1;
  const startRow = (currentPage - 1) * rowsPerPage;
  const currentRows = filteredDetections.slice(startRow, startRow + rowsPerPage);
  const goToPage = (p) => p >= 1 && p <= totalPages && setCurrentPage(p);

  // ========================================================================
  // 4) Export CSV (seluruh hasil filter, BUKAN hanya halaman tampil)
  // ========================================================================
  const exportToCSV = () => {
    const headers = [
      "No",
      "Timestamp",
      "Deskripsi",
      "Area",
      "CCTV",
      "Image URL",
    ];

    const rows = filteredDetections.map((row, idx) => [
      idx + 1,
      formatTimestamp(row.timestamp),
      row.message,
      row.area,
      row.cctvName,
      row.imageUrl || "-",
    ]);

    const escape = (v) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [headers, ...rows].map((arr) => arr.map(escape).join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "laporan_smocam.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printReport = () => window.print();

  // ========================================================================
  // 5) Render JSX
  // ========================================================================
  return (
    <div className={`layout-container ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
      <Sidebar isOpen={sidebarOpen} toggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="layout-main">
        <Navbar toggle={() => setSidebarOpen(!sidebarOpen)} username={username} />

        <div className="page-content">
          <div className="custom-card">
            {/* Header */}
            <div className="header-row">
              <h1>Laporan Terdeteksi Merokok</h1>
              <div className="header-actions">
                <button className="csv-button" onClick={exportToCSV}>Export CSV</button>
                <button className="print-button" onClick={printReport}>Cetak</button>
              </div>
            </div>
            <hr className="card-divider" />

            {/* Filter */}
            <div className="filter-container">
              <Dropdown label="Area" options={areas} selectedValue={selectedArea} onChange={setSelectedArea} />
              <Dropdown label="CCTV" options={cctvs} selectedValue={selectedCCTV} onChange={setSelectedCCTV} />
              <div className="date-filter">
                <input type="date" className="filter-date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                <span className="date-filter-separator">sampai</span>
                <input type="date" className="filter-date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>

            {/* Table */}
            <table className="custom-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Tanggal & Waktu</th>
                  <th>Deskripsi</th>
                  <th>Area</th>
                  <th>CCTV</th>
                  <th>Image URL</th>
                  <th style={{ width: 170 }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {currentRows.length ? (
                  currentRows.map((row, idx) => (
                    <tr key={row.id}>
                      <td>{startRow + idx + 1}</td>
                      <td>{formatTimestamp(row.timestamp)}</td>
                      <td>{row.message}</td>
                      <td>{row.area}</td>
                      <td>{row.cctvName}</td>
                      <td style={{ wordBreak: "break-all", fontSize: "0.75rem" }}>
                        {row.imageUrl ? (
                          <a href={row.imageUrl} target="_blank" rel="noopener noreferrer">
                            {row.imageUrl}
                          </a>
                        ) : (
                          "Tidak ada gambar"
                        )}
                      </td>
                      <td>
                        <div className="report-page-action-buttons">
                          <button
                            className="report-page-action-button"
                            onClick={() => window.open(row.imageUrl, "_blank")}
                            disabled={!row.imageUrl}
                          >
                            Lihat Bukti
                          </button>

                          <button
                            className="report-page-action-button violation-button"
                            onClick={() => navigate(`/violation-letter/${row.id}`)}
                          >
                            Buat Surat
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center", padding: "2rem" }}>
                      Tidak ada data yang cocok dengan filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <hr className="card-divider" />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    className={currentPage === i + 1 ? "active" : ""}
                    onClick={() => goToPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
                <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportPage;
