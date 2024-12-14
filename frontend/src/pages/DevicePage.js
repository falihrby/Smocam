import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";
import "../styles/DevicePage.css";

const DevicePage = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const [tableData, setTableData] = useState([
    {
      no: 1,
      id: "001",
      cctvName: "Aula Gedung Toilet 1",
      cameraType: "PTZ",
      status: "Aktif",
      area: "Customer Service",
      ipAddress: "192.168.1.100",
    },
    {
      no: 2,
      id: "002",
      cctvName: "Aula Gedung 1",
      cameraType: "Fixed",
      status: "Tidak Aktif",
      area: "Customer Service",
      ipAddress: "192.168.1.101",
    },
  ]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);

  // Toggle sidebar visibility
  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  // Pagination logic
  const totalPages = Math.ceil(tableData.length / rowsPerPage);
  const startRow = (currentPage - 1) * rowsPerPage;
  const currentRows = tableData.slice(startRow, startRow + rowsPerPage);

  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const goToPage = (pageNumber) => setCurrentPage(pageNumber);

  const handleDetail = (device) => {
    navigate("/device-view", { state: device });
  };

  const handleEdit = (device) => {
    navigate("/device-edit", { state: device });
  };

  // Delete Handler
  const handleDeleteClick = (deviceId) => {
    setSelectedDeviceId(deviceId);
    setIsModalOpen(true); // Open modal
  };

  const confirmDelete = () => {
    setTableData((prevData) => prevData.filter((device) => device.id !== selectedDeviceId));
    setIsModalOpen(false); // Close modal
    setSelectedDeviceId(null); // Clear selection
  };

  const cancelDelete = () => {
    setIsModalOpen(false); // Close modal
    setSelectedDeviceId(null); // Clear selection
  };

  const handleAdd = () => {
    navigate("/device-add");
  };

  return (
    <div className={`layout-container ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
      <Sidebar isOpen={sidebarOpen} toggle={toggleSidebar} />
      <div className="layout-main">
        <Navbar toggle={toggleSidebar} />
        <div className="page-content">
          {/* Include the Delete Confirmation Modal */}
          <DeleteConfirmationModal
            isOpen={isModalOpen}
            onConfirm={confirmDelete}
            onCancel={cancelDelete}
            message="Apakah Anda yakin ingin menghapus perangkat ini?"
          />
          <div className="custom-card">
            <div className="header-row">
              <h1>Daftar Perangkat CCTV</h1>
              <button className="add-button" onClick={handleAdd}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                  <path fill="#fff" d="M18 12.998h-5v5a1 1 0 0 1-2 0v-5H6a1 1 0 0 1 0-2h5v-5a1 1 0 1 1 2 0v5h5a1 1 0 0 1 0 2" />
                </svg>
                Tambah
              </button>
            </div>
            <hr className="card-divider" />
            <div className="table-wrapper">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>ID</th>
                    <th>Nama CCTV</th>
                    <th>Tipe Kamera</th>
                    <th>Status</th>
                    <th>Area</th>
                    <th>IP Address</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.no}</td>
                      <td>{row.id}</td>
                      <td>{row.cctvName}</td>
                      <td>{row.cameraType}</td>
                      <td>{row.status}</td>
                      <td>{row.area}</td>
                      <td>{row.ipAddress}</td>
                      <td>
                        <div className="action-buttons-devices">
                          <button className="action-button-devices" onClick={() => handleDetail(row)}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
                              <path
                                fill="#fff"
                                d="M12 9a3 3 0 0 0-3 3a3 3 0 0 0 3 3a3 3 0 0 0 3-3a3 3 0 0 0-3-3m0 8a5 5 0 0 1-5-5a5 5 0 0 1 5-5a5 5 0 0 1 5 5a5 5 0 0 1-5 5m0-12.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5"
                              />
                            </svg>
                          </button>
                          <button className="action-button-devices" onClick={() => handleEdit(row)}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
                              <path fill="#fff" d="M3 21v-4.25L16.2 3.575q.3-.275.663-.425t.762-.15t.775.15t.65.45L20.425 5q.3.275.438.65T21 6.4q0 .4-.137.763t-.438.662L7.25 21zM17.6 7.8L19 6.4L17.6 5l-1.4 1.4z" />
                            </svg>
                          </button>
                          <button className="action-button-devices" onClick={() => handleDeleteClick(row.id)}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
                              <path fill="#fff" d="M7 21q-.825 0-1.412-.587T5 19V6H4V4h5V3h6v1h5v2h-1v13q0 .825-.587 1.413T17 21zm2-4h2V8H9zm4 0h2V8h-2z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <hr className="card-divider" />
            <div className="pagination">
              <button className="pagination-button" onClick={goToPreviousPage} disabled={currentPage === 1}>
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
              <button className="pagination-button" onClick={goToNextPage} disabled={currentPage === totalPages}>
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DevicePage;
