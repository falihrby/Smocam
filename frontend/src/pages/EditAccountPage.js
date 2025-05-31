// src/pages/EditAccountPage.js
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import PopupNotification from "../components/PopupNotification";
import "../styles/AddAccountPage.css"; 

const EditAccountPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Popup Notification state
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState("success");

  // Get username from localStorage
  const userSession = JSON.parse(localStorage.getItem("userSession"));
  const username = userSession ? userSession.username : "Guest";

  // Get account data from location state
  const accountData = location.state || {
    id: "",
    fullName: "",
    username: "",
    email: "",
    role: "",
    status: "Active",
  };

  // Password visibility toggles
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

  // State to manage the form data
  const [formData, setFormData] = useState({ ...accountData, newPassword: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.fullName || !formData.username || !formData.email || !formData.role) {
      setPopupMessage("Harap isi semua kolom yang diperlukan.");
      setPopupType("error");
      setIsPopupOpen(true);
      return false;
    }

    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setPopupMessage("Kata sandi baru tidak cocok dengan konfirmasi kata sandi.");
      setPopupType("error");
      setIsPopupOpen(true);
      return false;
    }

    return true;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      // Query Firestore for the document with the custom 'id' field
      const q = query(collection(db, "users"), where("id", "==", formData.id));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setPopupMessage("Akun tidak ditemukan.");
        setPopupType("error");
        setIsPopupOpen(true);
        return;
      }

      // Get the document ID from the query result
      const docId = querySnapshot.docs[0].id;

      const updatedData = {
        fullName: formData.fullName,
        username: formData.username,
        email: formData.email,
        role: formData.role,
        status: formData.status,
        updatedAt: new Date(),
      };

      // Add new password if updated
      if (formData.newPassword) {
        updatedData.password = formData.newPassword;
      }

      // Update the Firestore document
      const accountRef = doc(db, "users", docId);
      await updateDoc(accountRef, updatedData);

      setPopupMessage("Akun berhasil diperbarui!");
      setPopupType("success");
      setIsPopupOpen(true);

      // Delay navigation to ensure popup shows
      setTimeout(() => {
        navigate("/account");
      }, 2000);
    } catch (error) {
      console.error("Error updating account:", error);
      setPopupMessage("Terjadi kesalahan saat memperbarui akun.");
      setPopupType("error");
      setIsPopupOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const handleBackClick = () => navigate(-1);

  return (
    <div className={`add-account-page-container ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
      <Sidebar isOpen={sidebarOpen} toggle={toggleSidebar} />
      <div className="add-account-page-main">
        <Navbar toggle={toggleSidebar} username={username} />
        <PopupNotification
          isOpen={isPopupOpen}
          message={popupMessage}
          onClose={() => setIsPopupOpen(false)}
          type={popupType}
        />
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
                <div className="password-input-wrapper">
                  <input
                    type={isPasswordVisible ? "text" : "password"}
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                  />
                  <img
                    src={isPasswordVisible ? "/icon/closeeye-icon.svg" : "/icon/eye-icon.svg"}
                    alt="Toggle Password Visibility"
                    className="password-toggle-icon"
                    onClick={() => setIsPasswordVisible((prev) => !prev)}
                  />
                </div>
              </div>
              <div className="add-account-page-form-group">
                <label>Konfirmasi Kata Sandi Baru</label>
                <span>:</span>
                <div className="password-input-wrapper">
                  <input
                    type={isConfirmPasswordVisible ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                  />
                  <img
                    src={isConfirmPasswordVisible ? "/icon/closeeye-icon.svg" : "/icon/eye-icon.svg"}
                    alt="Toggle Confirm Password Visibility"
                    className="password-toggle-icon"
                    onClick={() => setIsConfirmPasswordVisible((prev) => !prev)}
                  />
                </div>
              </div>
              <div className="add-account-page-form-group">
                <button
                  type="submit"
                  className="add-account-page-submit-button"
                  disabled={loading}
                >
                  {loading ? "Menyimpan..." : "Simpan"}
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
