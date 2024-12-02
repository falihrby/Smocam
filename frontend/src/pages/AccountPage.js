import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import "../styles/AccountPage.css";

const AccountPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className={`account-container ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
      <Sidebar isOpen={sidebarOpen} toggle={toggleSidebar} />
      <div className="account-main">
        <Navbar toggle={toggleSidebar} />
        <section className="account-content">
          <h1>Account</h1>
          <p>Manage your account settings here.</p>
        </section>
      </div>
    </div>
  );
};

export default AccountPage;
