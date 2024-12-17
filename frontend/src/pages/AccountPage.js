import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, deleteDoc, doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebaseConfig";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";
import PopupNotification from "../components/PopupNotification"; 
import "../styles/AccountPage.css";

const AccountPage = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [tableData, setTableData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState(null);

  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");

  // Get username from localStorage
  const userSession = JSON.parse(localStorage.getItem("userSession"));
  const username = userSession ? userSession.username : "Guest";

  // Fetch data from Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "users"),
      (querySnapshot) => {
        const accounts = querySnapshot.docs.map((doc, index) => ({
          no: index + 1,
          docId: doc.id,
          ...doc.data(),
        }));
        setTableData(accounts);
        setLoading(false);
      },
      (error) => {
        console.error("Kesalahan pengambilan akun:", error);
        setPopupMessage("Kesalahan pengambilan data. Silakan periksa koneksi Anda.");
        setIsPopupOpen(true);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Sidebar toggle logic
  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  // Pagination logic
  const totalPages = Math.ceil(tableData.length / rowsPerPage);
  const paginateRows = (rows, page, limit) => rows.slice((page - 1) * limit, page * limit);
  const currentRows = paginateRows(tableData, currentPage, rowsPerPage);

  // Translation logic for status
  const translateStatus = (status) => {
    const translations = {
      Active: "Aktif",
      Inactive: "Tidak Aktif",
    };
    return translations[status] || status;
  };

  // Navigation Handlers
  const handleDetail = (account) => navigate(`/account-view/${account.docId}`);
  const handleEdit = (account) => navigate("/account-edit", { state: account });
  const handleAdd = () => navigate("/account-add");

  // Delete Handlers
  const handleDeleteClick = (accountId) => {
    setSelectedAccountId(accountId);
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      const accountRef = doc(db, "users", selectedAccountId);
      const docSnap = await getDoc(accountRef);

      if (!docSnap.exists()) {
        throw new Error("ID dokumen tidak ada.");
      }

      await deleteDoc(accountRef);

      setPopupMessage("Akun berhasil dihapus!");
      setTableData((prevData) => prevData.filter((account) => account.docId !== selectedAccountId));
    } catch (error) {
      console.error("Kesalahan menghapus dokumen:", error.message);
      setPopupMessage(`Gagal menghapus akun: ${error.message}`);
    } finally {
      setIsPopupOpen(true);
      setIsModalOpen(false);
      setSelectedAccountId(null);
    }
  };

  const cancelDelete = () => {
    setIsModalOpen(false);
    setSelectedAccountId(null);
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
            message="Apakah Anda yakin ingin menghapus akun ini?"
            buttonType="confirm"
          />
          <PopupNotification
            isOpen={isPopupOpen}
            message={popupMessage}
            onClose={() => setIsPopupOpen(false)}
          />
          <div className="custom-card">
            <div className="header-row">
              <h1>Kelola Akun</h1>
              <button className="add-button" onClick={handleAdd} aria-label="Add Account">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
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
              <p>Memuat akun...</p>
            ) : (
              <div className="table-wrapper">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>ID</th>
                      <th>Nama Lengkap</th>
                      <th>Username</th>
                      <th>Peran</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentRows.map((row) => (
                      <tr key={row.docId}>
                        <td>{row.no}</td>
                        <td>{row.id}</td>
                        <td>{row.fullName}</td>
                        <td>{row.username}</td>
                        <td>{row.role}</td>
                        <td>{translateStatus(row.status)}</td>
                        <td>
                          <div className="action-buttons-accounts">
                            <button className="action-button-accounts" onClick={() => handleDetail(row)} aria-label="View">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
                                <path
                                  fill="#fff"
                                  d="M12 9a3 3 0 0 0-3 3a3 3 0 0 0 3 3a3 3 0 0 0 3-3a3 3 0 0 0-3-3m0 8a5 5 0 0 1-5-5a5 5 0 0 1 5-5a5 5 0 0 1 5 5a5 5 0 0 1-5 5m0-12.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5"
                                />
                              </svg>
                            </button>
                            <button className="action-button-accounts" onClick={() => handleEdit(row)} aria-label="Edit">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
                                <path fill="#fff" d="M3 21v-4.25L16.2 3.575q.3-.275.663-.425t.762-.15t.775.15t.65.45L20.425 5q.3.275.438.65T21 6.4q0 .4-.137.763t-.438.662L7.25 21zM17.6 7.8L19 6.4L17.6 5l-1.4 1.4z" />
                              </svg>
                            </button>
                            <button className="action-button-accounts" onClick={() => handleDeleteClick(row.docId)} aria-label="Delete">
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
            <hr className="card-divider" />
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

export default AccountPage;
