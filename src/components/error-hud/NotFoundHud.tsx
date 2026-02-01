import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './NotFoundHud.css';

const NotFoundHud: React.FC = () => {
  const navigate = useNavigate();
  const [showHorrorModal, setShowHorrorModal] = useState(false);

  const handleSafePath = () => {
    navigate('/');
  };

  const handleDangerousPath = () => {
    setShowHorrorModal(true);
  };

  const confirmDangerousPath = () => {
    navigate('/pray', { state: { fromHorror: true } });
  };

  const cancelDangerousPath = () => {
    setShowHorrorModal(false);
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
          
          <button className="error-btn-danger" onClick={handleDangerousPath}>
            [ KHÁM PHÁ BÍ MẬT ]
          </button>
        </div>
      </div>

      {/* Hidden Easter Egg Modal */}
      {showHorrorModal && (
        <div className="horror-modal-overlay">
          <div className="horror-modal-content">
            <div className="horror-cracks"></div>
            <h2 className="horror-title" data-text="CẢNH BÁO">CẢNH BÁO</h2>
            <p className="horror-text">
              Bạn sắp khám phá một tính năng ẩn.<br/>
              Đây là easter egg thú vị của SkillVerse.<br/>
              <span className="horror-highlight">BẠN CÓ CHẮC KHÔNG?</span>
            </p>
            <div className="horror-actions">
              <button className="horror-btn-confirm" onClick={confirmDangerousPath}>
                ĐỒNG Ý, TIẾP TỤC
              </button>
              <button className="horror-btn-cancel" onClick={cancelDangerousPath}>
                KHÔNG, QUAY LẠI
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotFoundHud;
