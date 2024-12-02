import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import "../styles/DashboardPage.css";

const DashboardPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const cardData = [
    { icon: "📷", number: 123, label: "Cameras" },
    { icon: "🔔", number: 456, label: "Alerts" },
    { icon: "🗂️", number: 789, label: "Documents" },
    { icon: "👥", number: 101, label: "Users" },
  ];

  return (
    <div className={`dashboard-container ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
      <Sidebar isOpen={sidebarOpen} toggle={toggleSidebar} />
      <div className="dashboard-main">
        <Navbar toggle={toggleSidebar} />
        <section className="dashboard-content">
          {/* First Row with 4 Cards */}
          <div className="dashboard-row card-row">
            {cardData.map((card, index) => (
              <div className="dashboard-card" key={index}>
                <div className="card-left">
                  <div className="icon-box">{card.icon}</div>
                </div>
                <div className="card-right">
                  <div className="card-number">{card.number}</div>
                  <div className="card-label">{card.label}</div>
                </div>
              </div>
            ))}
          </div>
          {/* Divider Line */}
          <hr className="dashboard-divider" />
          {/* Second Row: Two Columns with 2/3 and 1/3 Width */}
          <div className="dashboard-row two-columns">
            <div className="dashboard-column left-column">
              <h2>Left Column (2/3)</h2>
              <p>Content for the left column goes here.</p>
            </div>
            <div className="dashboard-column right-column">
              <h2>Right Column (1/3)</h2>
              <p>Content for the right column goes here.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default DashboardPage;
