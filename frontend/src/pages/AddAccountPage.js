// src/pages/AddAccountPage.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import PopupNotification from "../components/PopupNotification";
import "../styles/AddAccountPage.css";

const AddAccountPage = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);

  // Popup Notification state
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");

  const userSession = JSON.parse(localStorage.getItem("userSession"));
  const username = userSession ? userSession.username : "Guest";

  const [formData, setFormData] = useState({
    id: "",
    fullName: "",
    username: "",
    email: "",
    role: "",
    status: "Active",
    password: "",
    confirmPassword: "",
  });

  // Password visibility toggles
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

  useEffect(() => {
    const generateAccountId = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const ids = querySnapshot.docs.map((doc) => parseInt(doc.data().id, 10) || 0);
        const nextId = String(Math.max(0, ...ids) + 1).padStart(3, "0");
        setFormData((prev) => ({ ...prev, id: nextId }));
      } catch (error) {
        console.error("Error generating ID:", error);
      }
    };

    generateAccountId();
  }, []);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  const handleBackClick = () => navigate(-1);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Input validations
    if (!validateEmail(formData.email)) {
      setPopupMessage("Email harus dalam format yang benar (contoh: user@example.com).");
      setIsPopupOpen(true);
      return;
    }

    if (!validatePassword(formData.password)) {
      setPopupMessage(
        "Password harus memiliki minimal 8 karakter, mengandung huruf besar, huruf kecil, dan angka."
      );
      setIsPopupOpen(true);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setPopupMessage("Konfirmasi password tidak cocok dengan password.");
      setIsPopupOpen(true);
      return;
    }

    if (formData.username === formData.email) {
      setPopupMessage("Username dan email tidak boleh sama.");
      setIsPopupOpen(true);
      return;
    }

    if (loading) return; // Prevent duplicate submissions
    setLoading(true);

    try {
      await addDoc(collection(db, "users"), {
        id: formData.id,
        fullName: formData.fullName,
        username: formData.username,
        email: formData.email,
        role: formData.role,
        status: formData.status,
        password: formData.password,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      setPopupMessage("Akun berhasil ditambahkan!");
      setIsPopupOpen(true);

      // Delay navigation to ensure popup shows
      setTimeout(() => {
        navigate("/account");
      }, 2000);
    } catch (error) {
      console.error("Kesalahan saat menambahkan akun:", error);
      setPopupMessage("Terjadi kesalahan saat menambahkan akun.");
      setIsPopupOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`add-account-page-container ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
      <Sidebar isOpen={sidebarOpen} toggle={toggleSidebar} />
      <div className="add-account-page-main">
        <Navbar toggle={toggleSidebar} username={username} />
        <PopupNotification
          isOpen={isPopupOpen}
          message={popupMessage}
          onClose={() => setIsPopupOpen(false)}
        />
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
                <label>Kata Sandi *</label>
                <span>:</span>
                <div className="password-input-wrapper">
                  <input
                    type={isPasswordVisible ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
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
                <label>Konfirmasi Kata Sandi *</label>
                <span>:</span>
                <div className="password-input-wrapper">
                  <input
                    type={isConfirmPasswordVisible ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
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
                  {loading ? "Menyimpan..." : "Tersimpan"}
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
