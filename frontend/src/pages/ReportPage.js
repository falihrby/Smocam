import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import "../styles/ReportPage.css";

const ReportPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedArea, setSelectedArea] = useState("All");
  const [selectedCCTV, setSelectedCCTV] = useState("All");
  const [startDate, setStartDate] = useState(""); // Start date for filter
  const [endDate, setEndDate] = useState(""); // End date for filter
  const rowsPerPage = 5;

  const toggleSidebar = () => setSidebarOpen((prevState) => !prevState);

  const tableData = [
    { no: 1, dateTime: "2024-12-01 14:32:06", description: "Detected smoking in Zone A", status: "Open", area: "Zone A", cctv: "CCTV-1" },
    { no: 2, dateTime: "2024-12-02 15:12:30", description: "Detected smoking in Zone B", status: "Resolved", area: "Zone B", cctv: "CCTV-2" },
    { no: 3, dateTime: "2024-12-02 15:12:30", description: "Detected smoking in Zone B", status: "Resolved", area: "Zone B", cctv: "CCTV-2" },
  ];

  // Convert a date string to a Date object
  const parseDate = (dateString) => new Date(dateString.split(" ")[0]);

  // Apply Area, CCTV, and Date filters
  const filteredData = tableData.filter(row => {
    const areaMatches = selectedArea === "All" || row.area === selectedArea;
    const cctvMatches = selectedCCTV === "All" || row.cctv === selectedCCTV;
    const rowDate = parseDate(row.dateTime);
    const startMatches = startDate === "" || rowDate >= new Date(startDate);
    const endMatches = endDate === "" || rowDate <= new Date(endDate);
    return areaMatches && cctvMatches && startMatches && endMatches;
  }).reverse(); 

  // Pagination logic
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const startRow = (currentPage - 1) * rowsPerPage;
  const currentRows = filteredData.slice(startRow, startRow + rowsPerPage);

  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const goToPage = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleAreaChange = (e) => {
    setSelectedArea(e.target.value);
    setCurrentPage(1);
  };

  const handleCCTVChange = (e) => {
    setSelectedCCTV(e.target.value);
    setCurrentPage(1);
  };

  const handleStartDateChange = (e) => {
    setStartDate(e.target.value);
    setCurrentPage(1);
  };

  const handleEndDateChange = (e) => {
    setEndDate(e.target.value);
    setCurrentPage(1);
  };

  const printReport = () => {
    window.print(); // Opens the browser's print dialog
  };

  return (
    <div className={`layout-container ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
      <Sidebar isOpen={sidebarOpen} toggle={toggleSidebar} />
      <div className="layout-main">
        <Navbar toggle={toggleSidebar} />
        <div className="page-content">
          <div className="custom-card">
            <div className="header-row">
              <h1>Laporan Terdeteksi Merokok</h1>
              <button className="print-button" onClick={printReport}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                  <path
                    fill="#fff"
                    d="M17 7.846H7v-3.23h10zm.616 4.27q.425 0 .712-.288t.288-.712t-.288-.713t-.712-.288t-.713.288t-.287.713t.287.712t.713.288M16 19v-4.538H8V19zm1 1H7v-4H3.577v-5.384q0-.85.577-1.425t1.423-.576h12.846q.85 0 1.425.576t.575 1.424V16H17z"
                  />
                </svg>
                Print
              </button>
            </div>
            <hr className="card-divider" />
            <div className="filter-container">
              <div className="dropdown-wrapper">
                <select
                  className="filter-dropdown"
                  value={selectedArea}
                  onChange={handleAreaChange}
                >
                  <option value="All">Semua Area</option>
                  <option value="Zone A">Zone A</option>
                  <option value="Zone B">Zone B</option>
                </select>
              </div>
              <div className="dropdown-wrapper">
                <select
                  className="filter-dropdown"
                  value={selectedCCTV}
                  onChange={handleCCTVChange}
                >
                  <option value="All">Semua CCTV</option>
                  <option value="CCTV-1">CCTV-1</option>
                  <option value="CCTV-2">CCTV-2</option>
                </select>
              </div>
              <div className="date-filter">
                <input
                  type="date"
                  className="filter-date"
                  value={startDate}
                  onChange={handleStartDateChange}
                />
                <span className="date-filter-separator">sampai</span>
                <input
                  type="date"
                  className="filter-date"
                  value={endDate}
                  onChange={handleEndDateChange}
                />
              </div>
            </div>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Tanggal dan Waktu</th>
                  <th style={{ width: "110px" }}>Deksripsi</th>
                  <th>Status</th>
                  <th>Area</th>
                  <th>CCTV</th>
                  <th style={{ width: "100px" }}>Gambar</th>
                  <th style={{ width: "170px" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {currentRows.map((row, index) => (
                  <tr key={index}>
                    <td>{row.no}</td>
                    <td>{row.dateTime}</td>
                    <td>{row.description}</td>
                    <td>{row.status}</td>
                    <td>{row.area}</td>
                    <td>{row.cctv}</td>
                    <td>
                      <div className="empty-box"></div>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="action-button">Print Bukti</button>
                        <button className="action-button">Rekaman</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <hr className="card-divider" />
            <div className="pagination">
              <button
                className="pagination-button"
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, index) => (
                <button
                  key={index}
                  className={`pagination-button ${currentPage === index + 1 ? "active" : ""}`}
                  onClick={() => goToPage(index + 1)}
                >
                  {index + 1}
                </button>
              ))}
              <button
                className="pagination-button"
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportPage;
