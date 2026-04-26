import React from 'react';
import { useNavigate } from 'react-router-dom';
import './NotFoundHud.css';

const NotFoundHud: React.FC = () => {
  const navigate = useNavigate();

  const handleSafePath = () => {
    navigate('/');
  };

  return (
    <div className="error-404-container">
      <div className="error-404-content">
        <h1 className="error-404-glitch" data-text="LỖI 404: KHÔNG TÌM THẤY TRANG">
          LỖI 404: KHÔNG TÌM THẤY TRANG
        </h1>
        
        <p className="error-404-description">
          Trang bạn tìm kiếm không tồn tại.
        </p>

        <div className="error-404-actions">
          <button className="error-btn-safe" onClick={handleSafePath}>
            [ QUAY VỀ TRANG CHỦ ]
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundHud;
