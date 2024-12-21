// src/pages/DevicePage.js
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { collection, deleteDoc, doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebaseConfig";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";
import PopupNotification from "../components/PopupNotification";
import "../styles/DevicePage.css";

const DevicePage = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [tableData, setTableData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState(null); 
  const [isDeleting, setIsDeleting] = useState(false);

  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");

  const [username, setUsername] = useState("Guest");

  useEffect(() => {
    const userSession = JSON.parse(localStorage.getItem("userSession"));
    if (userSession && userSession.username) {
      setUsername(userSession.username);
    }
  }, []);

  const devicesCollectionRef = useMemo(() => collection(db, "devices"), []);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      devicesCollectionRef,
      (snapshot) => {
        const devices = snapshot.docs.map((doc, index) => ({
          documentId: doc.id, // Store Firestore document ID
          no: index + 1, // Add numbering
          ...doc.data(), // Include all document fields
        }));

        setTableData(devices);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching devices:", error);
        setPopupMessage("Kesalahan pengambilan data. Silakan periksa koneksi Anda.");
        setIsPopupOpen(true);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [devicesCollectionRef]);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  const handleDeleteClick = (documentId) => {
    console.log("Document ID selected for deletion:", documentId);
    setSelectedDocumentId(documentId);
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedDocumentId) {
      setPopupMessage("Error: Tidak ada perangkat yang dipilih untuk dihapus.");
      setIsPopupOpen(true);
      return;
    }

    setIsDeleting(true);
    try {
      console.log(`Attempting to delete document with ID: ${selectedDocumentId}`);
      const deviceRef = doc(db, "devices", selectedDocumentId);

      // Delete the document
      await deleteDoc(deviceRef);
      console.log(`Document ID ${selectedDocumentId} successfully deleted.`);

      // Update table data
      setTableData((prevData) =>
        prevData.filter((device) => device.documentId !== selectedDocumentId)
      );

      setPopupMessage("Perangkat berhasil dihapus!");
    } catch (error) {
      console.error("Error deleting document:", error.message);
      setPopupMessage(`Gagal menghapus perangkat: ${error.message}`);
    } finally {
      setIsPopupOpen(true);
      setIsModalOpen(false);
      setSelectedDocumentId(null);
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setIsModalOpen(false);
    setSelectedDocumentId(null);
  };

  const totalPages = Math.ceil(tableData.length / rowsPerPage);
  const currentRows = tableData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const translateStatus = (status) => {
    const translations = {
      Active: "Aktif",
      Inactive: "Tidak Aktif",
      Maintenance: "Pemeliharaan",
    };
    return translations[status] || status;
  };

  return (
    <div className={`layout-container ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
      <Sidebar isOpen={sidebarOpen} toggle={toggleSidebar} />

      <div className="layout-main">
        <Navbar toggle={toggleSidebar} username={username} />

        <div className="page-content">
          <DeleteConfirmationModal
            isOpen={isModalOpen}
            onConfirm={confirmDelete}
            onCancel={cancelDelete}
            message="Apakah Anda yakin ingin menghapus perangkat ini?"
            isLoading={isDeleting}
          />

          <PopupNotification
            isOpen={isPopupOpen}
            message={popupMessage}
            onClose={() => setIsPopupOpen(false)}
          />

          <div className="custom-card">
            <div className="header-row">
              <h1>Daftar Perangkat CCTV</h1>
              <button className="add-button" onClick={() => navigate("/device-add")}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                  <path fill="#fff" d="M18 12.998h-5v5a1 1 0 0 1-2 0v-5H6a1 1 0 0 1 0-2h5v-5a1 1 0 1 1 2 0v5h5a1 1 0 0 1 0 2" />
                </svg>
                Tambah
              </button>
            </div>
            <hr className="card-divider" />

            {loading ? (
              <p>Memuat perangkat...</p>
            ) : (
              <div className="table-wrapper">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>ID</th>
                      <th>Nama CCTV</th>
                      <th>Port Kamera</th>
                      <th>Status</th>
                      <th>IP Address</th>
                      <th>Area</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentRows.map((device) => (
                      <tr key={device.documentId}>
                        <td>{device.no}</td>
                        <td>{device.id}</td>
                        <td>{device.cameraName || "N/A"}</td>
                        <td>{device.cameraPort || "N/A"}</td>
                        <td>{translateStatus(device.status)}</td>
                        <td>{device.ipAddress || "N/A"}</td>
                        <td>{device.area || "N/A"}</td>
                        <td>
                          <div className="action-buttons">
                            <button className="action-button-devices" onClick={() => navigate("/device-view", { state: device })}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
                                <path
                                  fill="#fff"
                                  d="M12 9a3 3 0 0 0-3 3a3 3 0 0 0 3 3a3 3 0 0 0 3-3a3 3 0 0 0-3-3m0 8a5 5 0 0 1-5-5a5 5 0 0 1 5-5a5 5 0 0 1 5 5a5 5 0 0 1-5 5m0-12.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5"
                                />
                              </svg>
                            </button>
                            <button className="action-button-devices" onClick={() => navigate("/device-edit", { state: device })}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
                                <path fill="#fff" d="M3 21v-4.25L16.2 3.575q.3-.275.663-.425t.762-.15t.775.15t.65.45L20.425 5q.3.275.438.65T21 6.4q0 .4-.137.763t-.438.662L7.25 21zM17.6 7.8L19 6.4L17.6 5l-1.4 1.4z" />
                              </svg>
                            </button>
                            <button className="action-button-devices" onClick={() => handleDeleteClick(device.documentId)}>
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
            )}

            <div className="pagination">
              <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
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

export default DevicePage;
