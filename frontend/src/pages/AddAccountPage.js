import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import "../styles/AddAccountPage.css";

const AddAccountPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Extract tableData from location state
  const tableData = useMemo(() => location.state?.tableData || [], [location.state]);

  const [formData, setFormData] = useState({
    id: "",
    fullName: "", // Added full name field
    username: "",
    email: "",
    role: "",
    status: "Active",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    // Generate the next ID based on the last account ID
    const generateAccountId = () => {
      const lastId = tableData.length > 0 ? parseInt(tableData[tableData.length - 1].id, 10) : 0;
      const nextId = String(lastId + 1).padStart(3, "0");
      setFormData((prev) => ({ ...prev, id: nextId }));
    };
    generateAccountId();
  }, [tableData]);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  const handleBackClick = () => navigate(-1);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (
      !formData.fullName || // Added validation for full name
      !formData.username ||
      !formData.email ||
      !formData.role ||
      formData.password !== formData.confirmPassword
    ) {
      alert("Harap isi semua kolom yang diperlukan dan pastikan kata sandi sesuai.");
      return;
    }
    console.log("Account Added:", formData);
    alert("Akun berhasil ditambahkan!");
    navigate("/account");
  };

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
            <h1>Tambah Akun</h1>
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
                <label>Status</label>
                <span>:</span>
                <select name="status" value={formData.status} onChange={handleInputChange}>
                  <option value="Active">Aktif</option>
                  <option value="Inactive">Tidak Aktif</option>
                </select>
              </div>
              <div className="add-account-page-form-group">
                <label>Kata sandi *</label>
                <span>:</span>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="add-account-page-form-group">
                <label>Konfirmasi kata sandi *</label>
                <span>:</span>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="add-account-page-form-group">
                <button type="submit" className="add-account-page-submit-button">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddAccountPage;
