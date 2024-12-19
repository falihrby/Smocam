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
          {/* Authentication */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Dashboard */}
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* Reports */}
          <Route path="/report" element={<ReportPage />} />
          <Route path="/rekaman" element={<RekamanPage />} /> {/* RekamanPage Route Added */}
          <Route path="/resume" element={<ResumePage />} />
          <Route path="/print-bukti" element={<PrintEvidencePage />} />

          {/* Violators */}
          <Route path="/violator-data" element={<ViolatorDataPage />} />
          <Route path="/details" element={<DetailViolatorPage />} />

          {/* Devices */}
          <Route path="/devices" element={<DevicePage />} />
          <Route path="/device-add" element={<AddDevicePage />} />
          <Route path="/device-view" element={<ViewDevicePage />} />
          <Route path="/device-edit" element={<EditDevicePage />} />

          {/* Accounts */}
          <Route path="/account" element={<AccountPage />} />
          <Route path="/account-add" element={<AddAccountPage />} />
          <Route path="/account-edit" element={<EditAccountPage />} />
          <Route path="/account-view/:id" element={<ViewAccountPage />} />


          {/* Areas */}
          <Route path="/areas" element={<AreaPage />} />

          {/* 404 Page */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
