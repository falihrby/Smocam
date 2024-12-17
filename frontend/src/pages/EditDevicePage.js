import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import "../styles/AddDevicePage.css";

const EditDevicePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Device data from the previous page
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

  // State to manage the form data
  const [formData, setFormData] = useState(deviceData);

  // Toggle sidebar
  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  // Get username from localStorage
  const userSession = JSON.parse(localStorage.getItem("userSession"));
  const username = userSession ? userSession.username : "Guest";

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Save changes and navigate back to the device list
  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation (basic)
    if (!formData.cctvName || !formData.cameraPort || !formData.ipAddress || !formData.cameraType || !formData.area) {
      alert("Please fill out all required fields.");
      return;
    }

    console.log("Device Updated:", formData);
    alert("Device successfully updated!");

    // Navigate back to devices page (you can pass updated data to the state or update backend)
    navigate("/devices");
  };

  const handleBackClick = () => {
    navigate(-1); // Go back to the previous page
  };

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
            <h1>Edit Perangkat</h1>
            <hr className="card-divider" />
            <form onSubmit={handleSubmit}>
              <div className="add-device-form-group">
                <label>ID</label>
                <span>:</span>
                <input type="text" value={formData.id} readOnly />
              </div>
              <div className="add-device-form-group">
                <label>Nama CCTV *</label>
                <span>:</span>
                <input
                  type="text"
                  name="cctvName"
                  value={formData.cctvName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="add-device-form-group">
                <label>Port Kamera *</label>
                <span>:</span>
                <input
                  type="text"
                  name="cameraPort"
                  value={formData.cameraPort}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="add-device-form-group">
                <label>Status</label>
                <span>:</span>
                <select name="status" value={formData.status} onChange={handleInputChange}>
                  <option value="Aktif">Aktif</option>
                  <option value="Tidak Aktif">Tidak Aktif</option>
                </select>
              </div>
              <div className="add-device-form-group">
                <label>IP Address *</label>
                <span>:</span>
                <input
                  type="text"
                  name="ipAddress"
                  value={formData.ipAddress}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="add-device-form-group">
                <label>Tipe Kamera *</label>
                <span>:</span>
                <select
                  name="cameraType"
                  value={formData.cameraType}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Pilih Tipe</option>
                  <option value="PTZ">PTZ</option>
                  <option value="Fixed">Fixed</option>
                </select>
              </div>
              <div className="add-device-form-group">
                <label>Area *</label>
                <span>:</span>
                <select
                  name="area"
                  value={formData.area}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Pilih Area</option>
                  <option value="Customer Service">Customer Service</option>
                  <option value="Lobby Utama">Lobby Utama</option>
                </select>
              </div>
              <div className="add-device-form-group">
                <label>Username</label>
                <span>:</span>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                />
              </div>
              <div className="add-device-form-group">
                <label>Password</label>
                <span>:</span>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                />
              </div>
              <div className="add-device-form-group">
                <label>Deskripsi</label>
                <span>:</span>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                ></textarea>
              </div>
              <div className="add-device-form-group">
                <button type="submit" className="add-device-submit-button">
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditDevicePage;
