import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import "../styles/AddAccountPage.css"; // Reuse styles from AddAccountPage

const EditAccountPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Get account data from location state
  const accountData = location.state || {
    id: "",
    fullName: "", // Add "fullName" to the initial data
    username: "",
    email: "",
    role: "",
    status: "Active",
  };

  // State to manage the form data
  const [formData, setFormData] = useState({ ...accountData, newPassword: "", confirmPassword: "" });

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate required fields and password matching
    if (!formData.fullName || !formData.username || !formData.email || !formData.role) {
      alert("Harap isi semua kolom yang diperlukan.");
      return;
    }

    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      alert("Kata sandi tidak cocok.");
      return;
    }

    const updatedData = { ...formData };
    // Remove password fields if they are not being updated
    if (!formData.newPassword) {
      delete updatedData.newPassword;
      delete updatedData.confirmPassword;
    }

    console.log("Account Updated:", updatedData);
    alert("Akun berhasil diperbarui!");
    navigate("/account"); // Navigate back to account list
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
            <h1>Edit Akun</h1>
            <hr className="add-account-page-card-divider" />
            <form onSubmit={handleSubmit}>
              <div className="add-account-page-form-group">
                <label>ID</label>
                <span>:</span>
                <input type="text" value={formData.id} readOnly />
              </div>
              <div className="add-account-page-form-group">
                <label>Nama Lengkap *</label>
                <span>:</span>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="add-account-page-form-group">
                <label>Username *</label>
                <span>:</span>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="add-account-page-form-group">
                <label>Email *</label>
                <span>:</span>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="add-account-page-form-group">
                <label>Peran *</label>
                <span>:</span>
                <select name="role" value={formData.role} onChange={handleInputChange} required>
                  <option value="">Pilih Peran</option>
                  <option value="Admin">Admin</option>
                  <option value="Editor">Editor</option>
                  <option value="Viewer">Viewer</option>
                </select>
              </div>
              <div className="add-account-page-form-group">
                <label>Status *</label>
                <span>:</span>
                <select name="status" value={formData.status} onChange={handleInputChange}>
                  <option value="Active">Aktif</option>
                  <option value="Inactive">Tidak Aktif</option>
                </select>
              </div>
              <div className="add-account-page-form-group">
                <label>Kata Sandi Baru</label>
                <span>:</span>
                <input
                  type="password"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                />
              </div>
              <div className="add-account-page-form-group">
                <label>Konfirmasi Kata Sandi Baru</label>
                <span>:</span>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                />
              </div>
              <div className="add-account-page-form-group">
                <button type="submit" className="add-account-page-submit-button">
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditAccountPage;
