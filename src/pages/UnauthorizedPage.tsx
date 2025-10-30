import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/UnauthorizedPage.css';

const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();
  const userRole = localStorage.getItem('userRole');

  const getRoleMessage = () => {
    switch(userRole) {
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
    <div className="unauthorized-page">
      <div className="unauthorized-content">
        <div className="icon-container">
          <svg 
            width="120" 
            height="120" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        <h1>⛔ Không Có Quyền Truy Cập</h1>
        <p className="error-code">403 - Forbidden</p>
        <p className="error-message">
          {getRoleMessage()}
        </p>
        {userRole && (
          <div style={{ 
            marginTop: '16px', 
            padding: '12px 20px', 
            background: 'rgba(251, 146, 60, 0.1)', 
            border: '2px solid rgba(251, 146, 60, 0.3)',
            borderRadius: '8px',
            color: '#f97316',
            fontSize: '14px',
            fontWeight: 500
          }}>
            📌 Vai trò hiện tại: <strong>{userRole}</strong>
          </div>
        )}

        <div className="action-buttons">
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/')}
          >
            🏠 Về Trang Chủ
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => navigate(-1)}
          >
            ← Quay Lại
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
