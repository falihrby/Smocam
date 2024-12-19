import React, { useState, useEffect, useMemo } from "react";
import { collection, addDoc, deleteDoc, doc, onSnapshot, updateDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebaseConfig";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import PopupForm from "../components/PopupForm";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";
import PopupNotification from "../components/PopupNotification";
import "../styles/AreaPage.css";

const AreaPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [areaData, setAreaData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [popupContent, setPopupContent] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAreaId, setSelectedAreaId] = useState(null);

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");

  const areasCollectionRef = useMemo(() => collection(db, "areas"), []);

  // Get username from localStorage
  const userSession = JSON.parse(localStorage.getItem("userSession"));
  const username = userSession ? userSession.username : "Guest";

  useEffect(() => {
    const unsubscribe = onSnapshot(
      areasCollectionRef,
      (snapshot) => {
        const areas = snapshot.docs.map((doc, index) => ({
          docId: doc.id,
          no: index + 1,
          ...doc.data(),
        }));
        setAreaData(areas);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching areas:", error);
        setNotificationMessage("Error fetching data. Please check your connection.");
        setIsNotificationOpen(true);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [areasCollectionRef]);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  const goToNextPage = () => {
    if (currentPage < Math.ceil(areaData.length / rowsPerPage)) setCurrentPage((prev) => prev + 1);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const handleAddClick = () => {
    const maxId = Math.max(
      0,
      ...areaData.map((area) => parseInt(area.id, 10) || 0)
    );
    const nextId = String(maxId + 1).padStart(3, "0");

    setPopupContent({
      title: "Tambah Area Baru",
      content: (
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
            <label className="popup-label">Nama Area:</label>
            <input
              id="new-area-name"
              type="text"
              placeholder="Masukkan nama area"
              className="detail-input"
              required
            />
          </div>
        </div>
      ),
      onSubmit: async (e) => {
        e.preventDefault();
        const newAreaName = e.target.elements["new-area-name"].value;

        try {
          // Check for duplicate name
          const q = query(areasCollectionRef, where("areaName", "==", newAreaName));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            setNotificationMessage("Nama area sudah ada, silakan gunakan nama lain.");
            setIsNotificationOpen(true);
            return;
          }

          await addDoc(areasCollectionRef, {
            id: nextId,
            areaName: newAreaName,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          setNotificationMessage("Area berhasil ditambahkan!");
        } catch (error) {
          console.error("Error adding area:", error);
          setNotificationMessage("Gagal menambahkan area. Silakan coba lagi.");
        } finally {
          setIsNotificationOpen(true);
          setIsPopupOpen(false);
        }
      },
    });
    setIsPopupOpen(true);
  };

  const handleEdit = (row) => {
    setPopupContent({
      title: `Edit Area: ${row.areaName}`,
      content: (
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
            <label className="popup-label">Nama Area:</label>
            <input
              id="edit-area-name"
              type="text"
              defaultValue={row.areaName}
              required
              className="detail-input"
            />
          </div>
        </div>
      ),
      onSubmit: async (e) => {
        e.preventDefault();
        const updatedName = e.target.elements["edit-area-name"].value;

        try {
          // Check for duplicate name
          if (updatedName !== row.areaName) {
            const q = query(areasCollectionRef, where("areaName", "==", updatedName));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
              setNotificationMessage("Nama area sudah ada, silakan gunakan nama lain.");
              setIsNotificationOpen(true);
              return;
            }
          }

          const areaRef = doc(db, "areas", row.docId);
          await updateDoc(areaRef, {
            areaName: updatedName,
            updatedAt: new Date(),
          });
          setNotificationMessage("Area berhasil diperbarui!");
        } catch (error) {
          console.error("Error updating area:", error);
          setNotificationMessage("Gagal memperbarui area. Silakan coba lagi.");
        } finally {
          setIsNotificationOpen(true);
          setIsPopupOpen(false);
        }
      },
    });
    setIsPopupOpen(true);
  };

  const handleDeleteClick = (docId) => {
    setSelectedAreaId(docId);
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      const areaRef = doc(db, "areas", selectedAreaId);
      await deleteDoc(areaRef);
      setNotificationMessage("Area berhasil dihapus!");
    } catch (error) {
      console.error("Error deleting area:", error);
      setNotificationMessage("Gagal menghapus area. Silakan coba lagi.");
    } finally {
      setIsNotificationOpen(true);
      setIsModalOpen(false);
      setSelectedAreaId(null);
    }
  };

  const cancelDelete = () => {
    setIsModalOpen(false);
    setSelectedAreaId(null);
  };

  const totalPages = Math.ceil(areaData.length / rowsPerPage);
  const currentRows = areaData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

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
            message="Apakah Anda yakin ingin menghapus area ini?"
          />
          <PopupNotification
            isOpen={isNotificationOpen}
            message={notificationMessage}
            onClose={() => setIsNotificationOpen(false)}
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
            {loading ? (
              <p>Memuat Area...</p>
            ) : (
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
                      <tr key={row.docId}>
                        <td>{row.no}</td>
                        <td>{row.id}</td>
                        <td>{row.areaName}</td>
                        <td>
                          <div className="action-buttons">
                            <button className="action-button-devices" onClick={() => handleEdit(row)}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
                                <path fill="#fff" d="M3 21v-4.25L16.2 3.575q.3-.275.663-.425t.762-.15t.775.15t.65.45L20.425 5q.3.275.438.65T21 6.4q0 .4-.137.763t-.438.662L7.25 21zM17.6 7.8L19 6.4L17.6 5l-1.4 1.4z" />
                              </svg>
                            </button>
                            <button className="action-button-devices" onClick={() => handleDeleteClick(row.docId)}>
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
              <button disabled={currentPage === 1} onClick={goToPreviousPage}>Previous</button>
              {Array.from({ length: totalPages }, (_, index) => (
                <button
                  key={index}
                  className={currentPage === index + 1 ? "active" : ""}
                  onClick={() => setCurrentPage(index + 1)}
                >
                  {index + 1}
                </button>
              ))}
              <button disabled={currentPage === totalPages} onClick={goToNextPage}>Next</button>
            </div>
          </div>
          <PopupForm
            isOpen={isPopupOpen}
            title={popupContent?.title}
            onClose={() => setIsPopupOpen(false)}
            onSubmit={popupContent?.onSubmit}
            footerNote="* Area: Lokasi umum, seperti lantai atau gedung (contoh: Lantai 1)"
          >
            {popupContent?.content}
          </PopupForm>
        </div>
      </div>
    </div>
  );
};

export default AreaPage;
