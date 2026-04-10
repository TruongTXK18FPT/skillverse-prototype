import React from 'react';
import { useNavigate } from 'react-router-dom';
import meowlAvatar from '../assets/meowl-skin/meowl-acwy.png';
import '../styles/UnauthorizedPage.css';

const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();
  const userRole = localStorage.getItem('userRole');

  const getRoleMessage = () => {
    switch (userRole) {
      case 'USER':
        return 'Trang này chỉ dành cho Nhà tuyển dụng, Mentor hoặc Admin.';
      case 'RECRUITER':
        return 'Trang này không khả dụng cho Nhà tuyển dụng.';
      case 'MENTOR':
        return 'Trang này không khả dụng cho Mentor.';
      default:
        return 'Bạn không có quyền truy cập trang này. Vui lòng đăng nhập với tài khoản phù hợp.';
    }
  };

  return (
    <div className="unauth-page">
      <div className="unauth-glow-blob unauth-glow-blob--red" />
      <div className="unauth-glow-blob unauth-glow-blob--purple" />
      <div className="unauth-scanlines" />

      <div className="unauth-card">
        <div className="unauth-avatar-frame">
          <div className="unauth-avatar-ring unauth-avatar-ring--outer" />
          <div className="unauth-avatar-ring unauth-avatar-ring--inner" />
          <img
            src={meowlAvatar}
            alt="Meowl Guardian"
            className="unauth-avatar-img"
          />
          <div className="unauth-avatar-glow" />
        </div>

        <div className="unauth-error-badge">
          <span className="unauth-error-badge__code">403</span>
          <span className="unauth-error-badge__label">FORBIDDEN</span>
        </div>

        <h1 className="unauth-neon-title">
          <span className="unauth-neon-title__text">TRUY CẬP BỊ TỪ CHỐI</span>
        </h1>

        <p className="unauth-error-message">{getRoleMessage()}</p>

        {userRole && (
          <div className="unauth-role-indicator">
            <div className="unauth-role-indicator__dot" />
            <span className="unauth-role-indicator__label">
              VAI TRÒ HIỆN TẠI: <strong>{userRole}</strong>
            </span>
          </div>
        )}

        <div className="unauth-action-buttons">
          <button className="unauth-btn unauth-btn--neon" onClick={() => navigate('/')}>
            <span className="unauth-btn__icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </span>
            Về Trang Chủ
          </button>
          <button className="unauth-btn unauth-btn--outline" onClick={() => navigate(-1)}>
            <span className="unauth-btn__icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"/>
                <polyline points="12 19 5 12 12 5"/>
              </svg>
            </span>
            Quay Lại
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;