import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import "../styles/AddDevicePage.css"; // Reuse the styles from AddDevicePage

const ViewDevicePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  // Get username from localStorage
  const userSession = JSON.parse(localStorage.getItem("userSession"));
  const username = userSession ? userSession.username : "Guest";

  // Get device details from location state
  const deviceData = location.state || {
    id: "",
    cctvName: "",
    cameraPort: "",
    status: "Aktif",
    ipAddress: "",
    cameraType: "",
    area: "",
    username: "",
    password: "",
    description: "",
  };

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const handleBackClick = () => navigate(-1);

  return (
    <div className={`layout-container ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
      <Sidebar isOpen={sidebarOpen} toggle={toggleSidebar} />
      <div className="layout-main">
        <Navbar toggle={toggleSidebar} username={username} />
        <div className="page-content">
          <button className="back-button" onClick={handleBackClick}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white">
              <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6z" />
            </svg>
            Kembali
          </button>
          <div className="add-device-card">
            <h1>Detail Perangkat</h1>
            <hr className="card-divider" />
            <form>
              <div className="add-device-form-group">
                <label>ID</label>
                <span>:</span>
                <input type="text" value={deviceData.id} readOnly />
              </div>
              <div className="add-device-form-group">
                <label>Nama CCTV</label>
                <span>:</span>
                <input type="text" value={deviceData.cctvName} readOnly />
              </div>
              <div className="add-device-form-group">
                <label>Port Kamera</label>
                <span>:</span>
                <input type="text" value={deviceData.cameraPort} readOnly />
              </div>
              <div className="add-device-form-group">
                <label>Status</label>
                <span>:</span>
                <input type="text" value={deviceData.status} readOnly />
              </div>
              <div className="add-device-form-group">
                <label>IP Address</label>
                <span>:</span>
                <input type="text" value={deviceData.ipAddress} readOnly />
              </div>
              <div className="add-device-form-group">
                <label>Tipe Kamera</label>
                <span>:</span>
                <input type="text" value={deviceData.cameraType} readOnly />
              </div>
              <div className="add-device-form-group">
                <label>Area</label>
                <span>:</span>
                <input type="text" value={deviceData.area} readOnly />
              </div>
              <div className="add-device-form-group">
                <label>Username</label>
                <span>:</span>
                <input type="text" value={deviceData.username} readOnly />
              </div>
              <div className="add-device-form-group">
                <label>Password</label>
                <span>:</span>
                <input type="password" value={deviceData.password} readOnly />
              </div>
              <div className="add-device-form-group">
                <label>Deskripsi</label>
                <span>:</span>
                <textarea value={deviceData.description} readOnly></textarea>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewDevicePage;
