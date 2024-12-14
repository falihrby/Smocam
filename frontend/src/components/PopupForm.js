// File: src/components/PopupForm.js
import React from "react";
import "../styles/PopupForm.css";

const PopupForm = ({ isOpen, title, children, onClose, onSubmit }) => {
  if (!isOpen) return null;

  return (
    <div className="popup-overlay">
      <form className="popup-content" onSubmit={onSubmit}>
        <h3 className="popup-title">{title}</h3>
        <hr className="popup-divider" />
        <div className="popup-body">{children}</div>
        <div className="popup-actions">
          <button
            type="button"
            className="popup-button popup-cancel-button"
            onClick={onClose}
          >
            Batal
          </button>
          {onSubmit && (
            <button
              type="submit"
              className="popup-button popup-confirm-button"
            >
              Simpan
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default PopupForm;
