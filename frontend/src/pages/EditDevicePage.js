import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../firebaseConfig"; // Firestore configuration
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import PopupNotification from "../components/PopupNotification";
import "../styles/AddDevicePage.css";

const EditDevicePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Device data from the previous page
  const deviceData = location.state || {
    id: "",
    cameraName: "",
    cameraPort: "",
    status: "Active",
    ipAddress: "",
    streamPath: "",
    area: "",
    username: "",
    description: "",
  };

  // Initialize form data with an empty password field
  const [formData, setFormData] = useState({
    ...deviceData,
    password: "", // Password is empty on page load
  });

  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [areas, setAreas] = useState([]);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  // Toggle sidebar visibility
  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  // Retrieve username for Navbar
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

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Fetch areas from Firestore
  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const areasQuery = query(collection(db, "areas"), where("areaName", "!=", ""));
        const querySnapshot = await getDocs(areasQuery);
        const areaList = querySnapshot.docs.map((doc) => doc.data().areaName);
        setAreas(areaList);
      } catch (error) {
        console.error("Error fetching areas:", error);
        setPopupMessage("Failed to fetch areas. Please try again.");
        setIsPopupOpen(true);
      }
    };

    fetchAreas();
  }, []);

  // Validate the form inputs
  const validateForm = () => {
    if (
      !formData.cameraName ||
      !formData.cameraPort ||
      !formData.ipAddress ||
      !formData.streamPath ||
      !formData.area
    ) {
      setPopupMessage("Harap isi semua kolom yang berbintang.");
      setIsPopupOpen(true);
      return false;
    }

    const ipRegex =
      /^(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)$/;

    if (!ipRegex.test(formData.ipAddress)) {
      setPopupMessage("Invalid IP Address format.");
      setIsPopupOpen(true);
      return false;
    }

    if (isNaN(formData.cameraPort) || formData.cameraPort.trim() === "") {
      setPopupMessage("Camera Port must be a valid number.");
      setIsPopupOpen(true);
      return false;
    }

    return true;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSaving(true);

    try {
      // Query Firestore for the document with the specified ID
      const devicesRef = collection(db, "devices");
      const q = query(devicesRef, where("id", "==", formData.id));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setPopupMessage("Perangkat tidak ditemukan.");
        setIsPopupOpen(true);
        setIsSaving(false);
        return;
      }

      // Get the Firestore document ID
      const deviceDoc = querySnapshot.docs[0];
      const documentId = deviceDoc.id;

      // Prepare the updated data
      const updatedData = {
        cameraName: formData.cameraName,
        cameraPort: formData.cameraPort,
        status: formData.status,
        ipAddress: formData.ipAddress,
        streamPath: formData.streamPath,
        area: formData.area,
        username: formData.username,
        description: formData.description,
        updatedAt: new Date(),
      };

      // Include password only if it's updated
      if (formData.password.trim()) {
        updatedData.password = formData.password;
      }

      // Update the document in Firestore
      await updateDoc(doc(db, "devices", documentId), updatedData);

      setPopupMessage("Perangkat berhasil diperbarui!");
      setIsPopupOpen(true);

      // Delay navigation to ensure the popup is displayed
      setTimeout(() => {
        navigate("/devices");
      }, 2000);
    } catch (error) {
      console.error("Error updating device:", error);
      setPopupMessage("Terjadi kesalahan saat memperbarui perangkat.");
      setIsPopupOpen(true);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle back navigation
  const handleBackClick = () => {
    navigate(-1);
  };

  return (
    <div className={`layout-container ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
      <Sidebar isOpen={sidebarOpen} toggle={toggleSidebar} />
      <div className="layout-main">
        <Navbar toggle={toggleSidebar} username={username} />
        <PopupNotification
          isOpen={isPopupOpen}
          message={popupMessage}
          onClose={() => setIsPopupOpen(false)}
        />
        <div className="page-content">
          <button className="back-button" onClick={handleBackClick}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white">
              <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6z" />
            </svg>
            Kembali
          </button>
          <div className="add-device-card">
            <h1>Edit Perangkat</h1>
            <hr className="card-divider" />
            <form onSubmit={handleSubmit}>
              <div className="add-device-form-group">
                <label>ID</label>
                <span>:</span>
                <input type="text" value={formData.id} readOnly />
              </div>
              <div className="add-device-form-group">
                <label>Nama CCTV *</label>
                <span>:</span>
                <input
                  type="text"
                  name="cameraName"
                  value={formData.cameraName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="add-device-form-group">
                <label>Port Kamera *</label>
                <span>:</span>
                <input
                  type="text"
                  name="cameraPort"
                  value={formData.cameraPort}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="add-device-form-group">
                <label>Status</label>
                <span>:</span>
                <select name="status" value={formData.status} onChange={handleInputChange}>
                  <option value="Active">{translateStatus("Active")}</option>
                  <option value="Inactive">{translateStatus("Inactive")}</option>
                </select>
              </div>
              <div className="add-device-form-group">
                <label>IP Address *</label>
                <span>:</span>
                <input
                  type="text"
                  name="ipAddress"
                  value={formData.ipAddress}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="add-device-form-group">
              <label>Stream Path *</label>
                <span>:</span>
                <input
                  type="text"
                  name="streamPath"
                  value={formData.streamPath}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="add-device-form-group">
                <label>Area *</label>
                <span>:</span>
                <select
                  name="area"
                  value={formData.area}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Pilih Area</option>
                  {areas.map((area, index) => (
                    <option key={index} value={area}>{area}</option>
                  ))}
                </select>
              </div>
              <div className="add-device-form-group">
                <label>Username</label>
                <span>:</span>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                />
              </div>
              <div className="add-device-form-group">
                <label>Kata Sandi Baru</label>
                <span>:</span>
                <div className="password-input-wrapper">
                  <input
                    type={isPasswordVisible ? "text" : "password"}
                    name="password"
                    value={formData.password}
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
              <div className="add-device-form-group">
                <label>Deksripsi</label>
                <span>:</span>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                ></textarea>
              </div>
              <p className="small-text">
                * Nama CCTV: Lokasi spesifik di area tersebut (contoh: Ruang 4002)
              </p>
              <div className="add-device-form-group">
                <button type="submit" className="add-device-submit-button" disabled={isSaving}>
                  {isSaving ? "Menyimpan..." : "Tersimpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditDevicePage;
