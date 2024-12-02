import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import classNames from "classnames";
import "../styles/SideBar.css";

const Sidebar = ({ isOpen }) => {
  const location = useLocation(); // Get the current URL
  const [activeItem, setActiveItem] = useState("");

  const handleItemClick = (itemName) => {
    setActiveItem((prevItem) => (prevItem === itemName ? "" : itemName));
  };

  const isActive = (path) => location.pathname === path; // Check if the path matches the current URL

  return (
    <div className={classNames("sidebar", { "is-open": isOpen })}>
      <div className="sidebar-header">
        <img src="/assets/logo_fst.png" alt="Logo" className="sidebar-logo" />
        <h4 className="sidebar-title">Aplikasi Smocam</h4>
      </div>
      <nav className="nav">
        <ul className="nav-list">
          <li className="nav-item">
            <a
              href="/dashboard"
              className={classNames("nav-link", { active: isActive("/dashboard") })}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="nav-icon" viewBox="0 0 20 20">
                <path fill="currentColor" d="M9.293 2.293a1 1 0 0 1 1.414 0l7 7A1 1 0 0 1 17 
                11h-1v6a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3a1 
                1 0 0 1-1 1H5a1 1 0 0 1-1-1v-6H3a1 1 0 0 1-.707-1.707z"/>
              </svg>
              Beranda
            </a>
          </li>
          <li className="nav-item">
            <a
              href="/report"
              className={classNames("nav-link", { active: isActive("/report") })}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
              <path fill="currentColor" d="M9.5 2A1.5 1.5 0 0 0 8 3.5v1A1.5 1.5 0 0 0 9.5 6h5A1.5 
              1.5 0 0 0 16 4.5v-1A1.5 1.5 0 0 0 14.5 2z"/><path fill="currentColor" fill-rule="evenodd" 
              d="M6.5 4.037c-1.258.07-2.052.27-2.621.84C3 5.756 3 7.17 3 9.998v6c0 2.829 0 4.243.879 
              5.122c.878.878 2.293.878 5.121.878h6c2.828 0 4.243 0 5.121-.878c.879-.88.879-2.293.879-5.122v-6c0-2.828 
              0-4.242-.879-5.121c-.569-.57-1.363-.77-2.621-.84V4.5a3 3 0 0 1-3 3h-5a3 3 0 0 1-3-3zM7 9.75a.75.75 0 0 0 
              0 1.5h.5a.75.75 0 0 0 0-1.5zm3.5 0a.75.75 0 0 0 0 1.5H17a.75.75 0 0 0 0-1.5zM7 13.25a.75.75 0 0 0 0 
              1.5h.5a.75.75 0 0 0 0-1.5zm3.5 0a.75.75 0 0 0 0 1.5H17a.75.75 0 0 0 0-1.5zM7 16.75a.75.75 0 0 0 0 1.5h.5a.75.75 
              0 0 0 0-1.5zm3.5 0a.75.75 0 0 0 0 1.5H17a.75.75 0 0 0 0-1.5z" clip-rule="evenodd"/></svg>
              Laporan
            </a>
          </li>
          <li className="nav-item">
            <a
              href="/offender"
              className={classNames("nav-link", { active: isActive("/offender") })}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
              <path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 
              2-2V5c0-1.1-.9-2-2-2M9 17H7v-7h2zm4 0h-2V7h2zm4 0h-2v-4h2z"/></svg>
              Data Pelanggar
            </a>
          </li>
          <li className="nav-item">
            <div
              className={classNames("nav-link", { active: isActive("/manajemen") })}
              onClick={() => handleItemClick("manajemen")}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                <path fill="currentColor" d="M3 8h18V4H3zm0 6h18v-4H3zm0 6h18v-4H3zM4 7V5h2v2zm0 6v-2h2v2zm0 6v-2h2v2z"/>
              </svg>
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
                    href="/page1"
                    className={classNames("submenu-button", { active: isActive("/page1") })}
                  >
                    Perangkat
                  </a>
                </li>
                <li className="submenu-item">
                  <a
                    href="/page2"
                    className={classNames("submenu-button", { active: isActive("/page2") })}
                  >
                    Area
                  </a>
                </li>
              </ul>
            )}
          </li>
          <li className="nav-item">
            <a
              href="/account"
              className={classNames("nav-link", { active: isActive("/account") })}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                <path fill="currentColor" d="M12 4a4 4 0 0 1 4 4a4 4 0 0 1-4 4a4 4 0 0 1-4-4a4 4 
                0 0 1 4-4m0 10c4.42 0 8 1.79 8 4v2H4v-2c0-2.21 3.58-4 8-4"/>
              </svg>
              Kelola Akun
            </a>
          </li>
          <li className="nav-item">
            <a
              href="/logout"
              className={classNames("nav-link", { active: isActive("/logout") })}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
              <path fill="currentColor" fill-rule="evenodd" d="M6 2a3 3 0 0 0-3 3v14a3 3 0 0 0 3 
              3h6a3 3 0 0 0 3-3V5a3 3 0 0 0-3-3zm10.293 5.293a1 1 0 0 1 1.414 0l4 4a1 1 0 0 1 0 
              1.414l-4 4a1 1 0 0 1-1.414-1.414L18.586 13H10a1 1 0 1 1 0-2h8.586l-2.293-2.293a1 
              1 0 0 1 0-1.414" clip-rule="evenodd"/></svg>
              Keluar
            </a>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
