import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import "../styles/RekamanPage.css";

const RekamanPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();

  const toggleSidebar = () => setSidebarOpen((prevState) => !prevState);

  // Get username from localStorage
  const userSession = JSON.parse(localStorage.getItem("userSession"));
  const username = userSession ? userSession.username : "Guest";

  const handleBackClick = () => {
    navigate(-1); // Navigates to the previous page
  };

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
          <div className="video-frame"></div>
        </div>
      </div>
    </div>
  );
};

export default RekamanPage;
