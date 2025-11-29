// SYSTEM ALERT MODAL - Unified Alert Replacement with Mothership Theme
import React from 'react';
import { X, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
import { useScrollLock } from './useScrollLock';

interface SystemAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  showCancel?: boolean;
}

export const SystemAlertModal: React.FC<SystemAlertModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  confirmText = 'OK',
  cancelText = 'CANCEL',
  onConfirm,
  showCancel = false
}) => {
  useScrollLock(isOpen);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={24} className="system-alert-icon-success" />;
      case 'error':
        return <XCircle size={24} className="system-alert-icon-error" />;
      case 'warning':
        return <AlertTriangle size={24} className="system-alert-icon-warning" />;
      default:
        return <Info size={24} className="system-alert-icon-info" />;
    }
  };

  const getTypeClass = () => {
    switch (type) {
      case 'success':
        return 'system-alert-success';
      case 'error':
        return 'system-alert-error';
      case 'warning':
        return 'system-alert-warning';
      default:
        return 'system-alert-info';
    }
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="system-alert-overlay" onClick={onClose}>
      <div className={`system-alert-container ${getTypeClass()}`} onClick={(e) => e.stopPropagation()}>
        <div className="system-alert-header">
          <div className="system-alert-title-row">
            {getIcon()}
            <h2 className="system-alert-title">
              {title || (type === 'success' ? 'MISSION SUCCESS' : type === 'error' ? 'SYSTEM ERROR' : type === 'warning' ? 'WARNING ALERT' : 'SYSTEM NOTIFICATION')}
            </h2>
          </div>
          <button className="system-alert-close" onClick={onClose} type="button">
            <X size={20} />
          </button>
        </div>

        <div className="system-alert-body">
          <p className="system-alert-message">{message}</p>
        </div>

        <div className="system-alert-footer">
          {showCancel && (
            <button type="button" onClick={onClose} className="system-alert-btn-secondary">
              {cancelText}
            </button>
          )}
          <button type="button" onClick={handleConfirm} className="system-alert-btn-primary">
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SystemAlertModal;