import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AlertTriangle, Shield, Lock, ArrowLeft } from 'lucide-react';
import '../../styles/AlreadyAuthenticatedWarning.css';
import meowlAcwy from '../../assets/meowl-skin/meowl-acwy.png';

const AlreadyAuthenticatedWarning = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          navigate('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isAuthenticated, navigate]);

  return (
    <div className="auth-warning-page">
      <div className="auth-warning-bg">
        <div className="warning-stars"></div>
        <div className="warning-stars-2"></div>
      </div>

      <div className="auth-warning-container">
        <div className="auth-warning-shield">
          <img
            src={meowlAcwy}
            alt="Meowl đang phán xét bạn"
            className="meowl-acwy-icon"
          />
        </div>

        <div className="auth-warning-content">
          <div className="warning-header">
            <AlertTriangle className="warning-triangle" size={48} />
            <h1 className="warning-title">CẢNH BÁO BẢO MẬT</h1>
            <AlertTriangle className="warning-triangle" size={48} />
          </div>

          <div className="warning-message">
            <h2>TRUY CẬP BỊ CHẶN</h2>
            <p className="warning-text">
              Bạn đã đăng nhập với tài khoản <strong>{user?.email}</strong>
            </p>
            <p className="warning-subtext">
              Không thể truy cập trang đăng nhập khi đã xác thực!
            </p>
          </div>

          <div className="warning-reasons">
            <div className="reason-item">
              <Shield size={24} />
              <span>Bảo vệ phiên đăng nhập hiện tại</span>
            </div>
            <div className="reason-item">
              <Lock size={24} />
              <span>Ngăn chặn xung đột xác thực</span>
            </div>
            <div className="reason-item">
              <AlertTriangle size={24} />
              <span>Đảm bảo tính toàn vẹn dữ liệu</span>
            </div>
          </div>

          <div className="warning-redirect">
            <div className="countdown-circle">
              <span className="countdown-number">{countdown}</span>
            </div>
            <p className="redirect-text">
              Tự động chuyển hướng về trang chủ trong <strong>{countdown}</strong> giây
            </p>
          </div>

          <div className="warning-actions">
            <button 
              className="warning-btn warning-btn--primary"
              onClick={() => navigate('/')}
            >
              <ArrowLeft size={20} />
              Về Trang Chủ Ngay
            </button>
            <button 
              className="warning-btn warning-btn--secondary"
              onClick={() => navigate('/profile')}
            >
              Xem Hồ Sơ
            </button>
          </div>
        </div>

        <div className="warning-footer">
          <p>⚠️ Nếu bạn muốn đăng nhập tài khoản khác, vui lòng đăng xuất trước</p>
        </div>
      </div>
    </div>
  );
};

export default AlreadyAuthenticatedWarning;
