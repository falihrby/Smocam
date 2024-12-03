import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import "../styles/ReportPage.css";

const ReportPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => setSidebarOpen((prevState) => !prevState);

  const reportData = [
    { date: "02/02/2023", time: "10:04:06", location: "Area 1", status: "Mahasiswa", details: "Terdeteksi merokok" },
    { date: "02/02/2023", time: "12:45:10", location: "Area 3", status: "Bukan Mahasiswa", details: "Terdeteksi merokok" },
    { date: "03/02/2023", time: "09:15:30", location: "Area 2", status: "Mahasiswa", details: "Terdeteksi merokok" },
  ];

  return (
    <div className={`layout-container ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
      <Sidebar isOpen={sidebarOpen} toggle={toggleSidebar} />
      <div className="layout-main">
        <Navbar toggle={toggleSidebar} />
        <div className="page-content">
          <h1>Report Page</h1>
          <div className="report-card">
            <table className="report-table">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Waktu</th>
                  <th>Lokasi</th>
                  <th>Status</th>
                  <th>Detail</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((report, index) => (
                  <tr key={index}>
                    <td>{report.date}</td>
                    <td>{report.time}</td>
                    <td>{report.location}</td>
                    <td>{report.status}</td>
                    <td>{report.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportPage;
