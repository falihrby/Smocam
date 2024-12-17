import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import Dropdown from "../components/Dropdown";
import "../styles/ResumePage.css";

const ResumePage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDepartment, setSelectedDepartment] = useState("Semua");
  const [selectedFaculty, setSelectedFaculty] = useState("Semua");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const rowsPerPage = 10;

  const toggleSidebar = () => setSidebarOpen((prevState) => !prevState);

  // Get username from localStorage
  const userSession = JSON.parse(localStorage.getItem("userSession"));
  const username = userSession ? userSession.username : "Guest";

  const handleBackClick = () => {
    navigate(-1);
  };

  const cardData = [
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 512 512">
          <path
            fill="#fff"
            d="M16 240v120h344V240zm312 88H48v-56h280Zm56-88h32v120h-32zm56 0h32v120h-32zm-54.572-66.7a31.98 31.98 0 0 1 2.32-38.418a63.745 63.745 0 0 0 3.479-78.69L385.377 48H348.8l-1.82 1.3l18.207 25.49a31.81 31.81 0 0 1-1.736 39.265a64.1 64.1 0 0 0-4.649 76.993L364.77 200h38.46Zm72 0a31.98 31.98 0 0 1 2.32-38.418a63.745 63.745 0 0 0 3.479-78.69L457.377 48H420.8l-1.82 1.3l18.207 25.49a31.81 31.81 0 0 1-1.736 39.265a64.1 64.1 0 0 0-4.649 76.993L436.77 200h38.46Z"
          />
        </svg>
      ),
      number: 4,
      label: "Terdeteksi Hari ini",
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24">
          <path
            fill="#fff"
            d="M18.618 7.462L6.403 2.085a1 1 0 0 0-.77-.016a1 1 0 0 0-.552.537l-3 7a1 1 0 0 0 .525 1.313L9.563 13.9L8.323 17H4v-3H2v8h2v-3h4.323c.823 0 1.552-.494 1.856-1.258l1.222-3.054l3.419 1.465a1 1 0 0 0 1.311-.518l3-6.857a1 1 0 0 0-.513-1.316m1.312 8.91l-1.858-.742l1.998-5l1.858.741z"
          />
        </svg>
      ),
      number: 7,
      label: "CCTV",
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 256 256">
          <path
            fill="#fff"
            d="M124 175a8 8 0 0 0 7.94 0c2.45-1.41 60-35 60-94.95A64 64 0 0 0 64 80c0 60 57.58 93.54 60 95m4-119a24 24 0 1 1-24 24a24 24 0 0 1 24-24m112 128c0 31.18-57.71 48-112 48S16 215.18 16 184c0-14.59 13.22-27.51 37.23-36.37a8 8 0 0 1 5.54 15C42.26 168.74 32 176.92 32 184c0 13.36 36.52 32 96 32s96-18.64 96-32c0-7.08-10.26-15.26-26.77-21.36a8 8 0 0 1 5.54-15C226.78 156.49 240 169.41 240 184"
          />
        </svg>
      ),
      number: 3,
      label: "Area",
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24">
          <path 
          fill="#fff" 
          d="M10.514 6.49a4.5 4.5 0 0 1 2.973 0l7.6 2.66c.803.282.803 1.418 0 1.7l-7.6 2.66a4.5 4.5 0 0 1-2.973 0l-5.509-1.93a1.24 1.24 0 0 0-.436.597a1 1 0 0 1 .013 1.635l.004.018l.875 3.939a.6.6 0 0 1-.585.73H3.125a.6.6 0 0 1-.586-.73l.875-3.94l.005-.017a1 1 0 0 1 .132-1.707a2.35 2.35 0 0 1 .413-.889l-1.05-.367c-.804-.282-.804-1.418 0-1.7z"/>
          <path fill="#fff" d="m6.393 12.83l-.332 2.654c-.057.452.127.92.52 1.196c1.157.815 3.043 1.82 5.42 1.82a9 9 0 0 0 5.473-1.834c.365-.28.522-.727.47-1.152l-.336-2.685l-4.121 1.442a4.5 4.5 0 0 1-2.973 0z"/>
        </svg>
      ),
      number: 15,
      label: "Mahasiswa",
    },
  ];

  const tableData = [
    { no: 3, id: "11210910000010", name: "Alice Johnson", department: "Information Technology", faculty: "Engineering", violations: 2 },
    { no: 1, id: "11210910000013", name: "John Doe", department: "Information Technology", faculty: "Engineering", violations: 5 },
    { no: 2, id: "11210910000012", name: "Jane Smith", department: "Computer Science", faculty: "Engineering", violations: 3 },
  ];

  const parseDate = (dateString) => {
    if (!dateString) return new Date(0); 
    return new Date(dateString.split(" ")[0]);
  };  

  const filteredData = tableData
  .filter((row) => {
    const departmentMatches = selectedDepartment === "Semua" || row.department === selectedDepartment;
    const facultyMatches = selectedFaculty === "Semua" || row.faculty === selectedFaculty; 
    const rowDate = row.dateTime ? parseDate(row.dateTime) : new Date(0); 
    const startMatches = startDate === "" || rowDate >= new Date(startDate);
    const endMatches = endDate === "" || rowDate <= new Date(endDate);
    return departmentMatches && facultyMatches && startMatches && endMatches;
  })
  .sort((a, b) => a.no - b.no);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const startRow = (currentPage - 1) * rowsPerPage;
  const currentRows = filteredData.slice(startRow, startRow + rowsPerPage);

  const handleStartDateChange = (e) => {
    setStartDate(e.target.value);
    setCurrentPage(1);
  };

  const handleEndDateChange = (e) => {
    setEndDate(e.target.value);
    setCurrentPage(1);
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
            Back
          </button>
          <div className="resume-card-row">
            {cardData.map((card, index) => (
              <div key={index} className="resume-card">
                <div className="resume-card-left">
                  <div className="icon-box">{card.icon}</div>
                </div>
                <div className="resume-card-right">
                  <div className="resume-card-number">{card.number}</div>
                  <div className="resume-card-label">{card.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty Text Columns Row */}
          <div className="empty-text-row">
            <div className="empty-column"></div>
            <div className="empty-column"></div>
          </div>

          <div className="custom-card">
            <h1>Data Pelanggar</h1>
            <div className="filter-container">
              <Dropdown 
                label="Jurusan" 
                options={["Semua", "Information Technology", "Computer Science"]} 
                selectedValue={selectedDepartment} 
                onChange={setSelectedDepartment} 
              />
              <Dropdown 
                label="Fakultas" 
                options={["Semua", "Engineering", "Health"]} 
                selectedValue={selectedFaculty} 
                onChange={setSelectedFaculty} 
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
                    <th>Nama</th>
                    <th>Departemen</th>
                    <th>Fakultas</th>
                    <th>Jumlah Pelanggaran</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRows.map((row, index) => (
                    <tr key={index}>
                      <td>{row.no}</td>
                      <td>{row.id}</td>
                      <td>{row.name}</td>
                      <td>{row.department}</td>
                      <td>{row.faculty}</td>
                      <td>{row.violations}</td>
                      <td>
                        <div div className="resume-page-action-buttons">
                          <button
                            className="resume-page-action-button"
                            onClick={() => navigate(`/details/${row.id}`)}
                          >
                            Detail
                          </button>
                          <button
                            className="resume-page-action-button"
                            onClick={() => navigate(`/print-bukti/${row.id}`)}
                          >
                            Print Bukti
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pagination">
              <button 
                className="pagination-button" 
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} 
                disabled={currentPage === 1}
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, index) => (
                <button 
                  key={index} 
                  className={`pagination-button ${currentPage === index + 1 ? "active" : ""}`} 
                  onClick={() => setCurrentPage(index + 1)}
                >
                  {index + 1}
                </button>
              ))}
              <button 
                className="pagination-button" 
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} 
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

export default ResumePage;
