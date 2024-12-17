import React from "react";
import "../styles/PopupNotification.css";

const PopupNotification = ({ isOpen, message, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="popup-notification-overlay">
      <div className="popup-notification-content">
        <p>{message}</p>
        <button onClick={onClose} className="popup-close-button">
          OK
        </button>
      </div>
    </div>
  );
};

export default PopupNotification;
