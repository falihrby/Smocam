import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import classNames from "classnames";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import "../styles/SideBar.css";

const Sidebar = ({ isOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeItem, setActiveItem] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  const handleItemClick = (itemName) => {
    setActiveItem((prevItem) => (prevItem === itemName ? "" : itemName));
  };

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    // Clear session and redirect to login
    localStorage.removeItem("userSession");
    navigate("/login");
  };

  useEffect(() => {
    const fetchUserRole = async () => {
      const userSession = JSON.parse(localStorage.getItem("userSession"));

      if (userSession?.id) {
        const userDoc = await getDoc(doc(db, "users", userSession.id));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.role === "Admin" && userData.status === "Active") {
            setIsAdmin(true);
          }
        }
      }
    };

    fetchUserRole();
  }, []);

  return (
    <div className={classNames("sidebar", { "is-open": isOpen })}>
      <div className="sidebar-header">
        <img src="/assets/logo_fst.png" alt="Logo" className="sidebar-logo" />
        <h4 className="sidebar-title">Aplikasi SmoCam</h4>
      </div>
      <hr className="dashboard-divider" />
      <nav className="nav">
        <ul className="nav-list">
          {/* Dashboard */}
          <li className="nav-item">
            <a
              href="/dashboard"
              className={classNames("nav-link", { active: isActive("/dashboard") })}
            >
              <DashboardIcon />
              Beranda
            </a>
          </li>

          {/* Report */}
          <li className="nav-item">
            <a
              href="/report"
              className={classNames("nav-link", { active: isActive("/report") })}
            >
              <ReportIcon />
              Laporan
            </a>
          </li>

          {/* Offender Data */}
          {/* <li className="nav-item">
            <a
              href="/violator-data"
              className={classNames("nav-link", { active: isActive("/violator-data") })}
            >
              <OffenderIcon />
              Data Pelanggar
            </a>
          </li> */}

          {/* Management */}
          <li className="nav-item">
            <div
              className={classNames("nav-link", { active: isActive("/manajemen") })}
              onClick={() => handleItemClick("manajemen")}
            >
              <ManagementIcon />
              Manajemen
              <img
                src={
                  activeItem === "manajemen"
                    ? "/icon/caret-up.svg"
                    : "/icon/caret-down.svg"
                }
                alt="Toggle"
                className="nav-caret"
              />
            </div>
            {activeItem === "manajemen" && (
              <ul className="submenu">
                <li className="submenu-item">
                  <a
                    href="/devices"
                    className={classNames("submenu-button", { active: isActive("/devices") })}
                  >
                    Perangkat
                  </a>
                </li>
                <li className="submenu-item">
                  <a
                    href="/areas"
                    className={classNames("submenu-button", { active: isActive("/areas") })}
                  >
                    Area
                  </a>
                </li>
              </ul>
            )}
          </li>

          {/* Account Management (Admins Only) */}
          {isAdmin && (
            <li className="nav-item">
              <a
                href="/account"
                className={classNames("nav-link", { active: isActive("/account") })}
              >
                <AccountIcon />
                Kelola Akun
              </a>
            </li>
          )}

          {/* Logout */}
          <li className="nav-item" onClick={handleLogout}>
            <div className="nav-link">
              <LogoutIcon />
              Keluar
            </div>
          </li>
        </ul>
      </nav>
    </div>
  );
};

const DashboardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="nav-icon" viewBox="0 0 20 20">
    <path
      fill="currentColor"
      d="M9.293 2.293a1 1 0 0 1 1.414 0l7 7A1 1 0 0 1 17 11h-1v6a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-6H3a1 1 0 0 1-.707-1.707z"
    />
  </svg>
);

const ReportIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <path fill="currentColor" d="M19.69 5.015a3.7 3.7 0 0 0-2-1v-.28a1.73 1.73 0 0 0-1.75-1.72h-8a1.74 1.74 0 0 0-1.75 1.72v.3a3.8 3.8 0 0 0-1.86 1a3.58 3.58 0 0 0-1.08 2.58v9.72a4.6 4.6 0 0 0 1.4 3.29A4.73 4.73 0 0 0 8 21.985h8a4.73 4.73 0 0 0 3.35-1.36a4.6 4.6 0 0 0 1.4-3.29v-9.73a3.66 3.66 0 0 0-1.06-2.59m-12-1.29a.24.24 0 0 1 .25-.22h8a.24.24 0 0 1 .25.22v2a.24.24 0 0 1-.25.22h-8a.24.24 0 0 1-.25-.22zm8.16 13.13h-7.7a1 1 0 0 1 0-2h7.7a1 1 0 1 1 0 2m0-4.39h-7.7a1 1 0 0 1 0-2h7.7a1 1 0 0 1 0 2"/>
  </svg>
);

// const OffenderIcon = () => (
//   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
//     <path
//       fill="currentColor"
//       d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2M9 17H7v-7h2zm4 0h-2V7h2zm4 0h-2v-4h2z"
//     />
//   </svg>
// );

const ManagementIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <path fill="currentColor" d="M3 8h18V4H3zm0 6h18v-4H3zm0 6h18v-4H3zM4 7V5h2v2zm0 6v-2h2v2zm0 6v-2h2v2z" />
  </svg>
);

const AccountIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <path fill="currentColor" d="M12 4a4 4 0 0 1 4 4a4 4 0 0 1-4 4a4 4 0 0 1-4-4a4 4 0 0 1 4-4m0 10c4.42 0 8 1.79 8 4v2H4v-2c0-2.21 3.58-4 8-4" />
  </svg>
);

const LogoutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <path
      fill="currentColor"
      d="M6 2a3 3 0 0 0-3 3v14a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V5a3 3 0 0 0-3-3zm10.293 5.293a1 1 0 0 1 1.414 0l4 4a1 1 0 0 1 0 1.414l-4 4a1 1 0 0 1-1.414-1.414L18.586 13H10a1 1 0 1 1 0-2h8.586l-2.293-2.293a1 1 0 0 1 0-1.414"
    />
  </svg>
);

export default Sidebar;
