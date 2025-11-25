import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, X, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/OnboardingBanner.css';

const GoogleUserOnboardingBanner = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Chỉ hiện banner nếu:
    // 1. User đăng nhập bằng Google
    // 2. Chưa có password (chưa set password)
    // 3. Chưa dismiss banner này trước đó
    const isDismissed = localStorage.getItem('googlePasswordBannerDismissed');
    
    if (
      user?.authProvider === 'GOOGLE' && 
      !user?.googleLinked && 
      !isDismissed
    ) {
      // Delay 1 giây để user thấy dashboard trước
      setTimeout(() => setIsVisible(true), 1000);
    }
  }, [user]);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('googlePasswordBannerDismissed', 'true');
  };

  const handleSetPassword = () => {
    setIsVisible(false);
    navigate('/set-password');
  };

  const handleRemindLater = () => {
    setIsVisible(false);
    // Không lưu vào localStorage, sẽ hiện lại lần sau
  };

  if (!isVisible) return null;

  return (
    <div className="google-onboarding-banner">
      <div className="google-onboarding-banner__content">
        <div className="google-onboarding-banner__icon">
          <Shield size={24} />
        </div>
        
        <div className="google-onboarding-banner__text">
          <h3 className="google-onboarding-banner__title">
            🎉 Chào mừng bạn đến với Skillverse!
            <span className="google-onboarding-banner__badge">Không bắt buộc</span>
          </h3>
          <p className="google-onboarding-banner__description">
            Bạn đã đăng nhập bằng Google. Để tăng cường bảo mật, bạn có thể 
            <strong> tùy chọn </strong> tạo mật khẩu dự phòng cho tài khoản.
          </p>
          <div className="google-onboarding-banner__benefits">
            <span className="google-onboarding-banner__benefit-item">✅ Đăng nhập khi Google lỗi</span>
            <span className="google-onboarding-banner__benefit-item">✅ Bảo mật kép</span>
            <span className="google-onboarding-banner__benefit-item">✅ Linh hoạt hơn</span>
          </div>
        </div>

        <button 
          className="google-onboarding-banner__close-btn"
          onClick={handleDismiss}
          aria-label="Đóng"
        >
          <X size={20} />
        </button>
      </div>

      <div className="google-onboarding-banner__actions">
        <button 
          className="google-onboarding-banner__action-btn google-onboarding-banner__action-btn--secondary"
          onClick={handleRemindLater}
        >
          Để sau
        </button>
        <button 
          className="google-onboarding-banner__action-btn google-onboarding-banner__action-btn--primary"
          onClick={handleSetPassword}
        >
          Đặt mật khẩu ngay
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default GoogleUserOnboardingBanner;
