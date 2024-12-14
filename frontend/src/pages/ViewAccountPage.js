import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import "../styles/AddAccountPage.css"; // Reuse styles from AddAccountPage

const ViewAccountPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  // Get account details from location state
  const accountData = location.state || {
    id: "",
    fullName: "",
    username: "",
    email: "",
    role: "",
    status: "Aktif",
  };

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const handleBackClick = () => navigate(-1);

  return (
    <div className={`add-account-page-container ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
      <Sidebar isOpen={sidebarOpen} toggle={toggleSidebar} />
      <div className="add-account-page-main">
        <Navbar toggle={toggleSidebar} />
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
                <input type="text" value={accountData.id} readOnly />
              </div>
              <div className="add-account-page-form-group">
                <label>Nama Lengkap</label>
                <span>:</span>
                <input type="text" value={accountData.fullName} readOnly />
              </div>
              <div className="add-account-page-form-group">
                <label>Username</label>
                <span>:</span>
                <input type="text" value={accountData.username} readOnly />
              </div>
              <div className="add-account-page-form-group">
                <label>Email</label>
                <span>:</span>
                <input type="text" value={accountData.email} readOnly />
              </div>
              <div className="add-account-page-form-group">
                <label>Peran</label>
                <span>:</span>
                <input type="text" value={accountData.role} readOnly />
              </div>
              <div className="add-account-page-form-group">
                <label>Status</label>
                <span>:</span>
                <input type="text" value={accountData.status} readOnly />
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewAccountPage;
