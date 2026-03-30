import React from 'react';
import ReactDOM from 'react-dom';
import { LogIn, X } from 'lucide-react';
import meowlAcwy from '../../assets/meowl-skin/meowl-acwy.png';
import './LoggedElsewhereModal.css';

interface LoggedElsewhereModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoggedElsewhereModal: React.FC<LoggedElsewhereModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const modalNode = (
    <div className="lm-backdrop" role="presentation">
      <div
        className="lm-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="logged-elsewhere-title"
        aria-describedby="logged-elsewhere-description"
      >
        <div className="lm-scanline" aria-hidden="true" />
        <div className="lm-grid-bg" aria-hidden="true" />

        <button
          type="button"
          className="lm-close"
          onClick={onClose}
          aria-label="Đóng thông báo"
        >
          <X size={16} />
        </button>

        <div className="lm-avatar-ring" aria-hidden="true">
          <div className="lm-ring1" />
          <div className="lm-ring2" />
          <div className="lm-avatar-wrap" aria-hidden="true">
            <img src={meowlAcwy} alt="" className="lm-avatar" />
            <div className="lm-avatar-glow" />
          </div>
        </div>

        <div className="lm-badge" aria-hidden="true">
          <span className="lm-badge-dot" />
          <span>Security Alert</span>
        </div>

        <h2 id="logged-elsewhere-title" className="lm-title">
          Tài khoản đã đăng nhập ở nơi khác
        </h2>

        <p
          id="logged-elsewhere-description"
          className="lm-desc"
        >
          Phiên hiện tại đã bị đăng xuất vì tài khoản được truy cập từ thiết bị khác. Hãy đăng nhập lại để tiếp tục.
        </p>

        <div className="lm-tips">
          <div className="lm-tip lm-tip-anim" style={{ animationDelay: '0.3s' }}>
            <span className="lm-tip-dot" />
            <span>Nếu không phải bạn — đổi mật khẩu ngay sau khi đăng nhập lại.</span>
          </div>
          <div className="lm-tip lm-tip-anim" style={{ animationDelay: '0.45s' }}>
            <span className="lm-tip-dot" />
            <span>Chỉ một thiết bị đăng nhập gần nhất được hoạt động.</span>
          </div>
        </div>

        <button
          type="button"
          className="lm-action"
          onClick={onClose}
        >
          <LogIn size={17} />
          <span>Đăng nhập lại</span>
        </button>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return modalNode;

  return ReactDOM.createPortal(modalNode, document.body);
};

export default LoggedElsewhereModal;