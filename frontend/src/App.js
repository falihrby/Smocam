import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage";
import ReportPage from "./pages/ReportPage";
import RekamanPage from "./pages/RekamanPage";
import PrintEvidencePage from "./pages/PrintEvidencePage";
import ViolatorDataPage from "./pages/ViolatorDataPage";
import DetailViolatorPage from "./pages/DetailViolatorPage";
import ResumePage from "./pages/ResumePage";
import LoginPage from "./pages/LoginPage";
import DevicePage from "./pages/DevicePage";
import AddDevicePage from "./pages/AddDevicePage";
import ViewDevicePage from "./pages/ViewDevicePage";
import EditDevicePage from "./pages/EditDevicePage";
import AreaPage from "./pages/AreaPage";
import AccountPage from "./pages/AccountPage";
import AddAccountPage from "./pages/AddAccountPage";
import EditAccountPage from "./pages/EditAccountPage";
import ViewAccountPage from "./pages/ViewAccountPage"; 
import "./App.css";

function App() {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/report" element={<ReportPage />} />
          <Route path="/rekaman" element={<RekamanPage />} />
          <Route path="/print-bukti" element={<PrintEvidencePage />} />
          <Route path="/violator-data" element={<ViolatorDataPage />} />
          <Route path="/details" element={<DetailViolatorPage />} />
          <Route path="/resume" element={<ResumePage />} />
          <Route path="/devices" element={<DevicePage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/device-add" element={<AddDevicePage />} />
          <Route path="/device-view" element={<ViewDevicePage />} />
          <Route path="/device-edit" element={<EditDevicePage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/account-add" element={<AddAccountPage />} />
          <Route path="/account-edit" element={<EditAccountPage />} />
          <Route path="/account-view" element={<ViewAccountPage />} />
          <Route path="/areas" element={<AreaPage />} /> 
        </Routes>
      </div>
    </Router>
  );
}

export default App;
