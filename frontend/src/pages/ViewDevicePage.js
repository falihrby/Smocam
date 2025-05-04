import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import "../styles/AddDevicePage.css"; // Reuse styles from AddDevicePage

const ViewDevicePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Get username for the Navbar from userSession
  const userSession = JSON.parse(localStorage.getItem("userSession"));
  const username = userSession ? userSession.username : "Guest";

  // Get device details from location state or fallback to default values
  const deviceData = location.state || {
    id: "",
    cameraName: "",
    cameraPort: "",
    status: "Active",
    ipAddress: "",
    area: "",
    username: "",
    description: "",
    createdAt: null,
    updatedAt: null,
  };

  // Function to toggle the sidebar
  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  // Function to go back to the previous page
  const handleBackClick = () => navigate(-1);

  // Helper function to format Firestore Timestamps or strings into MM/DD/YYYY, hh:mm:ss AM/PM
  const formatDate = (date) => {
    if (!date) return "N/A"; // Handle null or undefined dates
    try {
      let jsDate;
      // Firestore Timestamp to JS Date
      if (date?.seconds) {
        jsDate = new Date(date.seconds * 1000);
      } else {
        jsDate = new Date(date);
      }

      // Intl.DateTimeFormat for desired format
      return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }).format(jsDate);
    } catch {
      return "Invalid Date"; // Return fallback for unexpected data
    }
  };

  // Translation logic for status
  const translateStatus = (status) => {
    const translations = {
      Active: "Aktif",
      Inactive: "Tidak Aktif",
    };
    return translations[status] || status;
  };

  return (
    <div className={`layout-container ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} toggle={toggleSidebar} />
      <div className="layout-main">
        {/* Navbar */}
        <Navbar toggle={toggleSidebar} username={username} />

        {/* Page Content */}
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
              {[
                { label: "ID", value: deviceData.id },
                { label: "Nama CCTV", value: deviceData.cameraName },
                { label: "Port Kamera", value: deviceData.cameraPort },
                { label: "Status", value: translateStatus(deviceData.status) },
                { label: "IP Address", value: deviceData.ipAddress },
                { label: "Area", value: deviceData.area },
                { label: "Username", value: deviceData.username },
                {
                  label: "Deksripsi",
                  value: deviceData.description,
                  type: "textarea",
                },
                {
                  label: "Dibuat Pada",
                  value: formatDate(deviceData.createdAt),
                },
                {
                  label: "Diubah Pada",
                  value: formatDate(deviceData.updatedAt),
                },
              ].map((field, index) => (
                <div className="add-device-form-group" key={index}>
                  <label>{field.label}</label>
                  <span>:</span>
                  {field.type === "textarea" ? (
                    <textarea value={field.value} readOnly></textarea>
                  ) : (
                    <input type="text" value={field.value || "N/A"} readOnly />
                  )}
                </div>
              ))}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewDevicePage;
