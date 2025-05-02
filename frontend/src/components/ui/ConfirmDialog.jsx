import React from "react";
import Modal from "./Modal";

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Подтверждение",
  message = "Вы уверены, что хотите выполнить это действие?",
  confirmButtonText = "Подтвердить",
  cancelButtonText = "Отмена",
  confirmButtonClass = "bg-red-600 hover:bg-red-700",
  size = "sm",
}) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size={size}>
      <div className="text-center">
        <p className="mb-6 text-gray-700">{message}</p>
        <div className="flex items-center justify-center space-x-4">
          <button
            type="button"
            className="rounded bg-gray-300 px-4 py-2 font-medium text-gray-800 hover:bg-gray-400"
            onClick={onClose}
          >
            {cancelButtonText}
          </button>
          <button
            type="button"
            className={`rounded px-4 py-2 font-medium text-white ${confirmButtonClass}`}
            onClick={handleConfirm}
          >
            {confirmButtonText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
