import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, getDocs, query, orderBy, where } from "firebase/firestore";
import { db } from "../firebaseConfig";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import PopupNotification from "../components/PopupNotification";
import "../styles/AddDevicePage.css";

const AddDevicePage = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [areas, setAreas] = useState([]);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const userSession = JSON.parse(localStorage.getItem("userSession"));
  const username = userSession ? userSession.username : "Guest";

  const [formData, setFormData] = useState({
    id: "",
    cameraName: "",
    cameraPort: "",
    status: "Active",
    ipAddress: "",
    area: "",
    username: "",
    password: "",
    description: "",
  });

  const translateStatus = (status) => {
    const translations = {
      Active: "Aktif",
      Inactive: "Tidak Aktif",
    };
    return translations[status] || status;
  };

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const devicesQuery = query(collection(db, "devices"), orderBy("id", "desc"));
        const querySnapshot = await getDocs(devicesQuery);
        if (!querySnapshot.empty) {
          const lastDevice = querySnapshot.docs[0].data();
          const nextId = String(parseInt(lastDevice.id, 10) + 1).padStart(3, "0");
          setFormData((prev) => ({ ...prev, id: nextId }));
        } else {
          setFormData((prev) => ({ ...prev, id: "001" }));
        }
      } catch (error) {
        console.error("Error fetching devices:", error);
        setPopupMessage("Failed to fetch device data. Please try again.");
        setIsPopupOpen(true);
      }
    };

    fetchDevices();
  }, []);

  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const areasQuery = query(collection(db, "areas"), orderBy("areaName", "asc"));
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

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  const handleBackClick = () => navigate(-1);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateUniqueCameraName = async (name) => {
    try {
      const cameraQuery = query(collection(db, "devices"), where("cameraName", "==", name));
      const querySnapshot = await getDocs(cameraQuery);
      return querySnapshot.empty;
    } catch (error) {
      console.error("Error checking unique camera name:", error);
      setPopupMessage("Failed to check camera name. Please try again.");
      setIsPopupOpen(true);
      return false;
    }
  };

  const validateForm = async () => {
    const ipRegex =
      /^(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)$/;

    if (
      !formData.cameraName ||
      !formData.cameraPort ||
      !formData.ipAddress ||
      !formData.area ||
      !formData.username ||
      !formData.password ||
      !formData.status
    ) {
      setPopupMessage("Please fill out all required fields.");
      setIsPopupOpen(true);
      return false;
    }

    if (!ipRegex.test(formData.ipAddress)) {
      setPopupMessage("Invalid IP Address format.");
      setIsPopupOpen(true);
      return false;
    }

    if (isNaN(formData.cameraPort)) {
      setPopupMessage("Camera port must be a number.");
      setIsPopupOpen(true);
      return false;
    }

    const isUniqueName = await validateUniqueCameraName(formData.cameraName);
    if (!isUniqueName) {
      setPopupMessage("Camera name is already in use. Please choose another.");
      setIsPopupOpen(true);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!(await validateForm())) return;

    setIsSaving(true);
    try {
      await addDoc(collection(db, "devices"), {
        ...formData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      setPopupMessage("Perangkat Berhasil Ditambah!");
      setIsPopupOpen(true);

      setTimeout(() => {
        navigate("/devices");
      }, 2000);
    } catch (error) {
      console.error("Error saving device:", error);
      setPopupMessage("Failed to save the device. Please try again.");
      setIsPopupOpen(true);
    } finally {
      setIsSaving(false);
    }
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
            <h1>Tambah Perangkat</h1>
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
                <input type="text" name="cameraName" value={formData.cameraName} onChange={handleInputChange} />
              </div>
              <div className="add-device-form-group">
                <label>Port Kamera *</label>
                <span>:</span>
                <input type="text" name="cameraPort" value={formData.cameraPort} onChange={handleInputChange} />
              </div>
              <div className="add-device-form-group">
                <label>Status *</label>
                <span>:</span>
                <select name="status" value={formData.status} onChange={handleInputChange}>
                  <option value="Active">{translateStatus("Active")}</option>
                  <option value="Inactive">{translateStatus("Inactive")}</option>
                </select>
              </div>
              <div className="add-device-form-group">
                <label>IP Address *</label>
                <span>:</span>
                <input type="text" name="ipAddress" value={formData.ipAddress} onChange={handleInputChange} />
              </div>
              <div className="add-device-form-group">
                <label>Area *</label>
                <span>:</span>
                <select name="area" value={formData.area} onChange={handleInputChange}>
                  <option value="">Pilih Area</option>
                  {areas.map((area, index) => (
                    <option key={index} value={area}>{area}</option>
                  ))}
                </select>
              </div>
              <div className="add-device-form-group">
                <label>Username *</label>
                <span>:</span>
                <input type="text" name="username" value={formData.username} onChange={handleInputChange} />
              </div>
              <div className="add-device-form-group">
                <label>Kata Sandi *</label>
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
                    onClick={() => setIsPasswordVisible((prev) => !prev)}
                    className="password-toggle-icon"
                  />
                </div>
              </div>
              <div className="add-device-form-group">
                <label>Deksripsi</label>
                <span>:</span>
                <textarea name="description" value={formData.description} onChange={handleInputChange}></textarea>
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

export default AddDevicePage;
