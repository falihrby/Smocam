// Navbar.js
import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAlignLeft } from "@fortawesome/free-solid-svg-icons";
import "../styles/NavBar.css";

const NavBar = ({ toggle, username }) => (
  <header className="navbar">
    <div className="navbar-left">
      <button className="toggle-button" onClick={toggle} aria-label="Toggle Sidebar">
        <FontAwesomeIcon icon={faAlignLeft} />
      </button>
    </div>
    <div className="navbar-right">
      <span className="navbar-username">{username}</span> {/* Display the username here */}
    </div>
  </header>
);

export default NavBar;
