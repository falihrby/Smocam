// File: src/pages/AreaPage.js
import React, { useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import PopupForm from "../components/PopupForm";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";
import "../styles/AreaPage.css";

const AreaPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [areaData, setAreaData] = useState([
    { no: 1, id: "001", areaName: "Lobby" },
    { no: 2, id: "002", areaName: "Parking Lot" },
    { no: 3, id: "003", areaName: "Customer Service" },
  ]);

  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [popupContent, setPopupContent] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAreaId, setSelectedAreaId] = useState(null);

  const rowsPerPage = 10;
  const totalPages = Math.ceil(areaData.length / rowsPerPage);
  const startRow = (currentPage - 1) * rowsPerPage;
  const currentRows = areaData.slice(startRow, startRow + rowsPerPage);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const goToPage = (pageNumber) => setCurrentPage(pageNumber);

  // Add Area Handler
  const handleAddClick = () => {
    const nextId = `${String(
      Math.max(...areaData.map((area) => parseInt(area.id, 10))) + 1
    ).padStart(3, "0")}`;

    setPopupContent({
      title: "Add New Area",
      content: (
        <form>
          <div>
            <div className="form-row">
              <label className="popup-label">ID:</label>
              <input
                id="new-area-id"
                type="text"
                value={nextId}
                className="detail-input"
                disabled
              />
            </div>
            <div className="form-row">
              <label className="popup-label">Nama area:</label>
              <input
                id="new-area-name"
                type="text"
                placeholder="Masukan nama area"
                className="detail-input"
                required
              />
            </div>
          </div>
        </form>
      ),
      onSubmit: (e) => {
        e.preventDefault();
        const newAreaName = e.target.elements["new-area-name"].value;
        const newArea = {
          no: areaData.length + 1,
          id: nextId,
          areaName: newAreaName,
        };
        setAreaData((prev) => [...prev, newArea]);
        setIsPopupOpen(false);
      },
    });
    setIsPopupOpen(true);
  };

  const handleDetail = (row) => {
    setPopupContent({
      title: `Details of Area: ${row.areaName}`,
      content: (
        <div>
          <div className="form-row">
            <label className="popup-label">ID:</label>
            <input
              type="text"
              className="detail-input"
              value={row.id}
              disabled
            />
          </div>
          <div className="form-row">
            <label className="popup-label">Nama area:</label>
            <input
              type="text"
              className="detail-input"
              value={row.areaName}
              disabled
            />
          </div>
        </div>
      ),
    });
    setIsPopupOpen(true);
  };  

  // Edit Area Handler
  const handleEdit = (row) => {
    setPopupContent({
      title: `Edit Area: ${row.areaName}`,
      content: (
        <form>
          <div>
            <div className="form-row">
              <label className="popup-label">ID:</label>
              <input
                id="edit-area-id"
                type="text"
                value={row.id}
                className="detail-input"
                disabled
              />
            </div>
            <div className="form-row">
              <label className="popup-label">Nama area:</label>
              <input
                id="edit-area-name"
                type="text"
                defaultValue={row.areaName}
                required
                className="detail-input"
              />
            </div>
          </div>
        </form>
      ),
      onSubmit: (e) => {
        e.preventDefault();
        const updatedName = e.target.elements["edit-area-name"].value;
        setAreaData((prevData) =>
          prevData.map((area) =>
            area.id === row.id ? { ...area, areaName: updatedName } : area
          )
        );
        setIsPopupOpen(false);
      },
    });
    setIsPopupOpen(true);
  };

  // Delete Area Handler
  const handleDelete = (areaId) => {
    setSelectedAreaId(areaId);
    setIsModalOpen(true); // Open confirmation modal
  };

  const confirmDelete = () => {
    setAreaData((prevData) => prevData.filter((area) => area.id !== selectedAreaId));
    setIsModalOpen(false); // Close modal
    setSelectedAreaId(null); // Clear selection
  };

  const cancelDelete = () => {
    setIsModalOpen(false); // Close modal
    setSelectedAreaId(null); // Clear selection
  };

  return (
    <div className={`layout-container ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
      <Sidebar isOpen={sidebarOpen} toggle={toggleSidebar} />
      <div className="layout-main">
        <Navbar toggle={toggleSidebar} />
        <div className="page-content">
          {/* Delete Confirmation Modal */}
          <DeleteConfirmationModal
            isOpen={isModalOpen}
            onConfirm={confirmDelete}
            onCancel={cancelDelete}
            message="Apakah Anda yakin menghapus area ini?"
          />
          <div className="custom-card">
            <div className="header-row">
              <h1>Daftar Area</h1>
              <button className="add-button" onClick={handleAddClick}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="#fff"
                    d="M18 12.998h-5v5a1 1 0 0 1-2 0v-5H6a1 1 0 0 1 0-2h5v-5a1 1 0 1 1 2 0v5h5a1 1 0 0 1 0 2"
                  />
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
                    <th>Nama Area</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.no}</td>
                      <td>{row.id}</td>
                      <td>{row.areaName}</td>
                      <td>
                        <div className="action-buttons">
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
                          <button className="action-button-devices" onClick={() => handleDelete(row.id)}>
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
          <PopupForm
            isOpen={isPopupOpen}
            title={popupContent?.title}
            onClose={() => setIsPopupOpen(false)}
            onSubmit={popupContent?.onSubmit}
          >
            {popupContent?.content}
          </PopupForm>
        </div>
      </div>
    </div>
  );
};

export default AreaPage;
