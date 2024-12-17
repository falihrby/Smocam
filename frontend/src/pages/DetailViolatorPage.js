import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import "../styles/DetailViolatorPage.css";

const DetailViolatorPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  // Get username from localStorage
  const userSession = JSON.parse(localStorage.getItem("userSession"));
  const username = userSession ? userSession.username : "Guest";

  // Retrieve violator data from the state passed via navigation
  const violatorData = location.state;

  // Toggle sidebar visibility
  const toggleSidebar = () => setSidebarOpen((prevState) => !prevState);

  // Handle back button navigation
  const handleBackClick = () => {
    navigate(-1); // Navigate back to the previous page
  };

  // Fallback for invalid access (no data passed)
  if (!violatorData) {
    return (
      <div className="error-message">
        <h2>No data available</h2>
        <button onClick={handleBackClick} className="back-button">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className={`layout-container ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
      <Sidebar isOpen={sidebarOpen} toggle={toggleSidebar} />
      <div className="layout-main">
        <Navbar toggle={toggleSidebar} username={username} />
        <div className="page-content">
          <button className="back-button" onClick={handleBackClick}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="white"
            >
              <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6z" />
            </svg>
            Kembali
          </button>
          <div className="detail-card">
            <h1>Detail Pelanggar</h1>
            <hr className="card-divider" />
            <div className="detail-item">
                <label className="detail-label">Tanggal dan Waktu</label>
                <span className="detail-colon">:</span>
                <input type="text" className="detail-input" value={violatorData.dateTime} disabled />
            </div>
            <div className="detail-item">
                <label className="detail-label">NIM</label>
                <span className="detail-colon">:</span>
                <input type="text" className="detail-input" value={violatorData.id} disabled />
            </div>
            <div className="detail-item">
                <label className="detail-label">Nama</label>
                <span className="detail-colon">:</span>
                <input type="text" className="detail-input" value={violatorData.name} disabled />
            </div>
            <div className="detail-item">
                <label className="detail-label">Angkatan</label>
                <span className="detail-colon">:</span>
                <input type="text" className="detail-input" value={violatorData.class} disabled />
            </div>
            <div className="detail-item">
                <label className="detail-label">Jurusan</label>
                <span className="detail-colon">:</span>
                <input type="text" className="detail-input" value={violatorData.department} disabled />
            </div>
            <div className="detail-item">
                <label className="detail-label">Fakultas</label>
                <span className="detail-colon">:</span>
                <input type="text" className="detail-input" value={violatorData.faculty} disabled />
            </div>
            <div className="detail-item">
                <label className="detail-label">Area</label>
                <span className="detail-colon">:</span>
                <input type="text" className="detail-input" value={violatorData.area} disabled />
            </div>
            <div className="detail-item">
                <label className="detail-label">CCTV</label>
                <span className="detail-colon">:</span>
                <input type="text" className="detail-input" value={violatorData.cctv} disabled />
            </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default DetailViolatorPage;
