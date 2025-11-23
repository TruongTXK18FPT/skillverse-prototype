import React from 'react';
import { X, AlertTriangle, Calendar, Clock, Shield } from 'lucide-react';
import './CancellationLimitModal.css';

interface CancellationLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCloseAll?: () => void; // Close both modals
  message: string;
}

const CancellationLimitModal: React.FC<CancellationLimitModalProps> = ({
  isOpen,
  onClose,
  onCloseAll,
  message
}) => {
  if (!isOpen) return null;

  const handleClose = () => {
    onClose();
    if (onCloseAll) {
      onCloseAll();
    }
  };

  return (
    <div className="limit-modal-overlay" onClick={handleClose}>
      <div className="limit-modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="limit-modal-close" onClick={handleClose}>
          <X size={24} />
        </button>

        <div className="limit-modal-content">
          {/* Icon */}
          <div className="limit-icon-wrapper">
            <div className="limit-icon-bg"></div>
            <AlertTriangle className="limit-icon" size={64} />
          </div>

          {/* Title */}
          <h2 className="limit-modal-title">Đã Vượt Giới Hạn Hủy Gói</h2>

          {/* Message */}
          <p className="limit-modal-message">{message}</p>

          {/* Info Cards */}
          <div className="limit-info-cards">
            <div className="limit-info-card">
              <Calendar size={24} />
              <div>
                <h4>Giới hạn</h4>
                <p>1 lần/tháng</p>
              </div>
            </div>
            <div className="limit-info-card">
              <Clock size={24} />
              <div>
                <h4>Thử lại</h4>
                <p>Tháng sau</p>
              </div>
            </div>
            <div className="limit-info-card">
              <Shield size={24} />
              <div>
                <h4>Lý do</h4>
                <p>Chống lạm dụng</p>
              </div>
            </div>
          </div>

          {/* Note */}
          <div className="limit-note">
            <strong>💡 Gợi ý:</strong>
            <ul>
              <li>Bạn có thể tiếp tục sử dụng gói Premium hiện tại</li>
              <li>Chỉ hủy gia hạn tự động nếu không muốn gia hạn</li>
              <li>Liên hệ hỗ trợ nếu có vấn đề đặc biệt</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="limit-modal-actions">
            <button className="limit-btn-secondary" onClick={handleClose}>
              Đóng
            </button>
            <button 
              className="limit-btn-primary"
              onClick={() => {
                handleClose();
                // Optional: Navigate to support
              }}
            >
              Liên hệ hỗ trợ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CancellationLimitModal;
