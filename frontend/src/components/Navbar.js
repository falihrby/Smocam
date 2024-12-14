import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAlignLeft } from "@fortawesome/free-solid-svg-icons"; // Keep only the toggle icon
import "../styles/NavBar.css";

const NavBar = ({ toggle, username }) => (
  <header className="navbar">
    {/* Left Section */}
    <div className="navbar-left">
      <button className="toggle-button" onClick={toggle} aria-label="Toggle Sidebar">
        <FontAwesomeIcon icon={faAlignLeft} />
      </button>
    </div>
    {/* Right Section */}
    <div className="navbar-right">
      <span className="navbar-username">{username}</span> 
    </div>
  </header>
);

export default NavBar;
