// File: src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import AuthGuard from "./components/AuthGuard"; // Import AuthGuard
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
import ViolationLetter from "./pages/ViolationLetter";
import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        {/* Redirect Root to Login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Login Route */}
        <Route
          path="/login"
          element={<LoginPage />}
        />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <AuthGuard>
              <DashboardPage />
            </AuthGuard>
          }
        />
        <Route
          path="/report"
          element={
            <AuthGuard>
              <ReportPage />
            </AuthGuard>
          }
        />
        <Route
          path="/rekaman"
          element={
            <AuthGuard>
              <RekamanPage />
            </AuthGuard>
          }
        />
        <Route
          path="/resume"
          element={
            <AuthGuard>
              <ResumePage />
            </AuthGuard>
          }
        />
        <Route
          path="/print-bukti"
          element={
            <AuthGuard>
              <PrintEvidencePage />
            </AuthGuard>
          }
        />
        <Route
          path="/violator-data"
          element={
            <AuthGuard>
              <ViolatorDataPage />
            </AuthGuard>
          }
        />
        <Route
          path="/details"
          element={
            <AuthGuard>
              <DetailViolatorPage />
            </AuthGuard>
          }
        />
        <Route
          path="/devices"
          element={
            <AuthGuard>
              <DevicePage />
            </AuthGuard>
          }
        />
        <Route
          path="/device-add"
          element={
            <AuthGuard>
              <AddDevicePage />
            </AuthGuard>
          }
        />
        <Route
          path="/device-view"
          element={
            <AuthGuard>
              <ViewDevicePage />
            </AuthGuard>
          }
        />
        <Route
          path="/device-edit"
          element={
            <AuthGuard>
              <EditDevicePage />
            </AuthGuard>
          }
        />
        <Route
          path="/account"
          element={
            <AuthGuard>
              <AccountPage />
            </AuthGuard>
          }
        />
        <Route
          path="/account-add"
          element={
            <AuthGuard>
              <AddAccountPage />
            </AuthGuard>
          }
        />
        <Route
          path="/account-edit"
          element={
            <AuthGuard>
              <EditAccountPage />
            </AuthGuard>
          }
        />
        <Route
          path="/account-view/:id"
          element={
            <AuthGuard>
              <ViewAccountPage />
            </AuthGuard>
          }
        />
        <Route
          path="/areas"
          element={
            <AuthGuard>
              <AreaPage />
            </AuthGuard>
          }
        />
        <Route
          path="/violation-letter/:id"
          element={
            <AuthGuard>
              <ViolationLetter />
            </AuthGuard>
          }
        />

        {/* Fallback Route to Login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
