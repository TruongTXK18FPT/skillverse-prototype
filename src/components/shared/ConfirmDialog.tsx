import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const dialogNode = (
    <div className="confirm-dialog-overlay" role="dialog" aria-modal="true" onClick={onCancel}>
      <div className={`confirm-dialog confirm-dialog--${variant}`} onClick={(event) => event.stopPropagation()}>
        <div className="confirm-dialog__header">
          <h3>{title}</h3>
        </div>
        <p className="confirm-dialog__message">{message}</p>
        <div className="confirm-dialog__actions">
          {cancelLabel && (
            <button className="confirm-dialog__btn confirm-dialog__btn--ghost" onClick={onCancel}>
              {cancelLabel}
            </button>
          )}
          <button className={`confirm-dialog__btn confirm-dialog__btn--primary confirm-dialog__btn--${variant}`} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(dialogNode, document.body);
};

export default ConfirmDialog;
