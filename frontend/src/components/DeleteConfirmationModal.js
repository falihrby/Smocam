import React from "react";
import "../styles/DeleteConfirmationModal.css";

const DeleteConfirmationModal = ({ isOpen, onConfirm, onCancel, message }) => {
  if (!isOpen) return null; // Do not render if the modal is not open

  return (
    <div className="delete-confirmation-overlay">
      <div className="delete-confirmation-content">
        <h3>Konfirmasi Penghapusan</h3>
        <p>{message || "Apakah Anda yakin ingin menghapus item ini?"}</p>
        <div className="delete-confirmation-actions">
          <button className="delete-confirmation-button delete-cancel-button" onClick={onCancel}>
            Batal
          </button>
          <button className="delete-confirmation-button delete-confirm-button" onClick={onConfirm}>
            Ya, Hapus
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
