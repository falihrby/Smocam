import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import Dropdown from "../components/Dropdown";
import "../styles/ViolatorDataPage.css";

const ViolatorDataPage = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDepartment, setSelectedDepartment] = useState("Semua");
  const [selectedCCTV, setSelectedCCTV] = useState("Semua");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const rowsPerPage = 10;

  const toggleSidebar = () => setSidebarOpen((prevState) => !prevState);

  const tableData = [
    { no: 1, id: "11210910000013", dateTime: "2024-12-01 14:32:06", name: "John Doe", class: "2021", department: "Information Technology", faculty: "Engineering", area: "Zone A", cctv: "CCTV-1", image: "" },
    { no: 2, id: "11210910000012", dateTime: "2024-12-02 15:12:30", name: "Jane Smith", class: "2021", department: "Computer Science", faculty: "Engineering", area: "Zone B", cctv: "CCTV-2", image: "" },
    { no: 3, id: "11210910000010", dateTime: "2024-12-03 11:45:00", name: "Alice Johnson", class: "2021", department: "Information Technology", faculty: "Engineering", area: "Zone A", cctv: "CCTV-2", image: "" },
  ];

  // Convert a date string to a Date object
  const parseDate = (dateString) => new Date(dateString.split(" ")[0]);

  // Get username from localStorage
  const userSession = JSON.parse(localStorage.getItem("userSession"));
  const username = userSession ? userSession.username : "Guest";

  // Apply filters
  const filteredData = tableData.filter((row) => {
    const departmentMatches = selectedDepartment === "Semua" || row.department === selectedDepartment;
    const cctvMatches = selectedCCTV === "Semua" || row.cctv === selectedCCTV;
    const rowDate = parseDate(row.dateTime);
    const startMatches = startDate === "" || rowDate >= new Date(startDate);
    const endMatches = endDate === "" || rowDate <= new Date(endDate);
    return departmentMatches && cctvMatches && startMatches && endMatches;
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

  const handleStartDateChange = (e) => {
    setStartDate(e.target.value);
    setCurrentPage(1);
  };

  const handleEndDateChange = (e) => {
    setEndDate(e.target.value);
    setCurrentPage(1);
  };

  const printReport = () => {
    window.print();
  };

  const resume = () => {
    navigate("/resume");
  };

  return (
    <div className={`layout-container ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
      <Sidebar isOpen={sidebarOpen} toggle={toggleSidebar} />
      <div className="layout-main">
        <Navbar toggle={toggleSidebar} username={username} />
        <div className="page-content">
          <div className="custom-card">
          <div className="header-row">
              <h1>Data Pelanggar</h1>
              <div className="button-group">
                <button className="summary-button" onClick={resume}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                    <path 
                      fill="#fff" 
                      d="M11 2.05V13h10.95c-.501 5.053-4.765 9-9.95 9c-5.523 0-10-4.477-10-10c0-5.185 3.947-9.449 9-9.95m2 0A10 10 0 0 1 21.95 11H13z"
                    />
                  </svg>
                  Rangkuman
                </button>
                <button className="print-button" onClick={printReport}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                    <path
                      fill="#fff"
                      d="M17 7.846H7v-3.23h10zm.616 4.27q.425 0 .712-.288t.288-.712t-.288-.713t-.712-.288t-.713.288t-.287.713t.287.712t.713.288M16 19v-4.538H8V19zm1 1H7v-4H3.577v-5.384q0-.85.577-1.425t1.423-.576h12.846q.85 0 1.425.576t.575 1.424V16H17z"
                    />
                  </svg>
                  Cetak
                </button>
              </div>
            </div>
            <hr className="card-divider" />
            <div className="filter-container">
              <Dropdown
                label="Jurusan"
                options={["Semua", "Information Technology", "Computer Science"]}
                selectedValue={selectedDepartment}
                onChange={setSelectedDepartment}
              />
              <Dropdown
                label="CCTV"
                options={["Semua", "CCTV-1", "CCTV-2"]}
                selectedValue={selectedCCTV}
                onChange={setSelectedCCTV}
              />
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
            <div className="table-wrapper">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>ID</th>
                    <th>Tanggal dan Waktu</th>
                    <th>Nama</th>
                    <th>Jurusan</th>
                    <th>CCTV</th>
                    <th>Bukti Gambar</th>
                    <th style={{ width: "250px" }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRows.map((row, index) => (
                    <tr key={index}>
                      <td>{row.no}</td>
                      <td>{row.id}</td>
                      <td>{row.dateTime}</td>
                      <td>{row.name}</td>
                      <td>{row.department}</td>
                      <td>{row.cctv}</td>
                      <td>
                        <div className="empty-box"></div>
                      </td>
                      <td>
                        <div className="violator-data-action-buttons">
                          <button className="violator-data-action-button" onClick={() => navigate("/details", { state: row })}>Detail</button>
                          <button className="violator-data-action-button" onClick={() => navigate("/print-bukti")}>Cetak Bukti</button>
                          <button className="violator-data-action-button" onClick={() => navigate("/rekaman")}>Rekaman</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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

export default ViolatorDataPage;
