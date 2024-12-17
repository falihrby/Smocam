import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import "../styles/AddAccountPage.css"; // Reuse styles from AddAccountPage

const ViewAccountPage = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Firestore Document ID from route parameter
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [accountData, setAccountData] = useState(null); // Account details state
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState(null); // Error state

  // Get username from localStorage
  const userSession = JSON.parse(localStorage.getItem("userSession"));
  const username = userSession ? userSession.username : "Guest";

  // Translation logic for status
  const translateStatus = (status) => {
    const translations = {
      Active: "Aktif",
      Inactive: "Tidak Aktif",
    };
    return translations[status] || status;
  };

  // Fetch account details from Firestore
  useEffect(() => {
    const fetchAccountDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        // Access the document using Firestore document ID
        const docRef = doc(db, "users", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();

          // Set account data (use the custom 'id' field instead of Firestore ID)
          setAccountData({
            ...data,
            createdAt: data.createdAt?.toDate().toLocaleString() || "N/A",
            updatedAt: data.updatedAt?.toDate().toLocaleString() || "N/A",
          });
        } else {
          setError("Account not found.");
        }
      } catch (err) {
        console.error("Error fetching account details:", err.message);
        setError("Failed to fetch account details. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchAccountDetails();
  }, [id]);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const handleBackClick = () => navigate(-1);

  if (loading) {
    return <div>Loading account details...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className={`add-account-page-container ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
      <Sidebar isOpen={sidebarOpen} toggle={toggleSidebar} />
      <div className="add-account-page-main">
        <Navbar toggle={toggleSidebar} username={username} />
        <div className="add-account-page-content">
          <button className="add-account-page-back-button" onClick={handleBackClick}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white">
              <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6z" />
            </svg>
            Kembali
          </button>
          <div className="add-account-page-card">
            <h1>Detail Akun</h1>
            <hr className="add-account-page-card-divider" />
            <form>
              <div className="add-account-page-form-group">
                <label>ID</label>
                <span>:</span>
                <input type="text" value={accountData.id || "N/A"} readOnly />
              </div>
              <div className="add-account-page-form-group">
                <label>Nama Lengkap</label>
                <span>:</span>
                <input type="text" value={accountData.fullName || "N/A"} readOnly />
              </div>
              <div className="add-account-page-form-group">
                <label>Username</label>
                <span>:</span>
                <input type="text" value={accountData.username || "N/A"} readOnly />
              </div>
              <div className="add-account-page-form-group">
                <label>Email</label>
                <span>:</span>
                <input type="text" value={accountData.email || "N/A"} readOnly />
              </div>
              <div className="add-account-page-form-group">
                <label>Peran</label>
                <span>:</span>
                <input type="text" value={accountData.role || "N/A"} readOnly />
              </div>
              <div className="add-account-page-form-group">
                <label>Status</label>
                <span>:</span>
                <input type="text" value={translateStatus(accountData.status) || "N/A"} readOnly />
              </div>
              <div className="add-account-page-form-group">
                <label>Dibuat Pada</label>
                <span>:</span>
                <input type="text" value={accountData.createdAt || "N/A"} readOnly />
              </div>
              <div className="add-account-page-form-group">
                <label>Diubah Pada</label>
                <span>:</span>
                <input type="text" value={accountData.updatedAt || "N/A"} readOnly />
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewAccountPage;
