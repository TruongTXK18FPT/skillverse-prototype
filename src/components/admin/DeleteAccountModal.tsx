import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import './DeleteAccountModal.css';

interface DeleteAccountModalProps {
  isOpen: boolean;
  userName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  isOpen,
  userName,
  onConfirm,
  onCancel,
  isLoading = false
}) => {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setError('');
  };

  const handleConfirm = () => {
    if (inputValue !== 'XÓA') {
      setError('Vui lòng nhập chính xác "XÓA" để xác nhận');
      return;
    }
    onConfirm();
  };

  const handleCancel = () => {
    setInputValue('');
    setError('');
    onCancel();
  };

  if (!isOpen) return null;

  return (
    <div className="delete-account-modal-overlay">
      <div className="delete-account-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="delete-account-modal-header">
          <div className="delete-account-warning-icon">
            <AlertTriangle size={24} />
          </div>
          <h3>Xóa Vĩnh Viễn Tài Khoản</h3>
          <button
            className="delete-account-close-btn"
            onClick={handleCancel}
            disabled={isLoading}
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="delete-account-modal-body">
          <div className="delete-account-warning-message">
            ⚠️ <strong>CẢNH BÁO: Hành động này không thể hoàn tác!</strong>
          </div>

          <p className="delete-account-description">
            Bạn sắp xóa <strong>VĨNH VIỄN</strong> tài khoản của <strong>{userName}</strong>.
          </p>

          <div className="delete-account-consequence">
            <p><strong>Tất cả dữ liệu sau đây sẽ bị xóa:</strong></p>
            <ul>
              <li>✗ Thông tin cá nhân</li>
              <li>✗ Khóa học đã tạo</li>
              <li>✗ Danh sách đăng ký</li>
              <li>✗ Chứng chỉ</li>
              <li>✗ Tất cả dữ liệu liên quan</li>
            </ul>
          </div>

          <div className="delete-account-confirm-section">
            <p className="delete-account-confirm-label">
              Nhập <code>"XÓA"</code> để xác nhận:
            </p>
            <input
              type="text"
              className={`delete-account-confirm-input ${error ? 'error' : ''}`}
              placeholder="Nhập XÓA"
              value={inputValue}
              onChange={handleInputChange}
              disabled={isLoading}
              autoFocus
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !isLoading) {
                  handleConfirm();
                }
              }}
            />
            {error && <div className="delete-account-error">{error}</div>}
          </div>
        </div>

        {/* Footer */}
        <div className="delete-account-modal-footer">
          <button
            className="delete-account-btn cancel"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Hủy
          </button>
          <button
            className="delete-account-btn delete"
            onClick={handleConfirm}
            disabled={isLoading || inputValue !== 'XÓA'}
          >
            {isLoading ? 'Đang xóa...' : 'Xóa Vĩnh Viễn'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteAccountModal;
