import React from 'react';
import '../../styles/ConfirmDialog.css';

export type ConfirmVariant = 'default' | 'danger' | 'primary';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  variant = 'default',
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className="confirm-dialog-overlay" role="dialog" aria-modal="true">
      <div className={`confirm-dialog confirm-dialog--${variant}`}>
        <div className="confirm-dialog__header">
          <h3>{title}</h3>
        </div>
        <p className="confirm-dialog__message">{message}</p>
        <div className="confirm-dialog__actions">
          <button className="confirm-dialog__btn confirm-dialog__btn--ghost" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button className={`confirm-dialog__btn confirm-dialog__btn--primary confirm-dialog__btn--${variant}`} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
