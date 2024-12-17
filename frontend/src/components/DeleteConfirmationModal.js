import React from "react";
import "../styles/DeleteConfirmationModal.css";

const DeleteConfirmationModal = ({
  isOpen,
  onConfirm,
  onCancel,
  message,
  title = "Konfirmasi Penghapusan",
  buttonType = "confirm", // "confirm" for Yes/Cancel, "ok" for single button
}) => {
  if (!isOpen) return null;

  return (
    <div className="delete-confirmation-overlay">
      <div className="delete-confirmation-content">
        <h3>{title}</h3>
        <p>{message || "Apakah Anda yakin ingin melanjutkan?"}</p>
        <div className="delete-confirmation-actions">
          {buttonType === "confirm" ? (
            <>
              <button
                className="delete-confirmation-button delete-cancel-button"
                onClick={onCancel}
              >
                Batal
              </button>
              <button
                className="delete-confirmation-button delete-confirm-button"
                onClick={onConfirm}
              >
                Ya, Hapus
              </button>
            </>
          ) : (
            <button
              className="delete-confirmation-button delete-confirm-button"
              onClick={onConfirm}
            >
              OK
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
