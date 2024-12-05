import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage";
import ReportPage from "./pages/ReportPage";
import RekamanPage from "./pages/RekamanPage";
import PrintEvidencePage from "./pages/PrintEvidencePage";
import ViolatorDataPage from "./pages/ViolatorDataPage";
import DetailViolatorPage from "./pages/DetailViolatorPage";
import AccountPage from "./pages/AccountPage";
import LoginPage from "./pages/LoginPage";
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
          <Route path="/account" element={<AccountPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
