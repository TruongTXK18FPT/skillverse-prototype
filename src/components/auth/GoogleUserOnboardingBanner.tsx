import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, X, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import '../../styles/OnboardingBanner.css';

export const GOOGLE_PASSWORD_ONBOARDING_SESSION_KEY = 'googlePasswordOnboardingPending';

const GoogleUserOnboardingBanner = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const storageKey = useMemo(
    () => (user?.id ? `googlePasswordOnboardingSeen:${user.id}` : null),
    [user?.id],
  );

  useEffect(() => {
    if (!storageKey) {
      setIsVisible(false);
      return;
    }

    const hasPendingPrompt =
      sessionStorage.getItem(GOOGLE_PASSWORD_ONBOARDING_SESSION_KEY) === 'true';
    const isEligible =
      (user?.authProvider === 'GOOGLE' || hasPendingPrompt) &&
      !user?.googleLinked &&
      Array.isArray(user?.roles) &&
      user.roles.includes('USER');
    const wasSeen = localStorage.getItem(storageKey) === 'true';

    if (!isEligible || wasSeen) {
      setIsVisible(false);
      return;
    }

    localStorage.setItem(storageKey, 'true');
    sessionStorage.removeItem(GOOGLE_PASSWORD_ONBOARDING_SESSION_KEY);
    const timer = window.setTimeout(() => setIsVisible(true), 600);
    return () => window.clearTimeout(timer);
  }, [storageKey, user]);

  const handleClose = () => {
    sessionStorage.removeItem(GOOGLE_PASSWORD_ONBOARDING_SESSION_KEY);
    setIsVisible(false);
  };

  const handleSetPassword = () => {
    sessionStorage.removeItem(GOOGLE_PASSWORD_ONBOARDING_SESSION_KEY);
    setIsVisible(false);
    navigate('/set-password');
  };

  if (!isVisible) return null;

  return (
    <div className="google-onboarding-modal" role="dialog" aria-modal="true" aria-labelledby="google-onboarding-title">
      <div className="google-onboarding-modal__backdrop" onClick={handleClose} />
      <div className="google-onboarding-banner">
        <button
          className="google-onboarding-banner__close-btn"
          onClick={handleClose}
          aria-label="Đóng"
        >
          <X size={20} />
        </button>

        <div className="google-onboarding-banner__content">
          <div className="google-onboarding-banner__icon">
            <Shield size={24} />
          </div>

          <div className="google-onboarding-banner__text">
            <span className="google-onboarding-banner__eyebrow">Khuyen nghi bao mat</span>
            <h3 id="google-onboarding-title" className="google-onboarding-banner__title">
              Thiết lập mật khẩu dự phòng
            </h3>
            <p className="google-onboarding-banner__description">
              Bạn đang đăng nhập bằng Google. Để tránh mất quyền truy cập khi Google lỗi hoặc bị khóa phiên, hãy tạo mật khẩu dự phòng.
            </p>
            <div className="google-onboarding-banner__smart-note">
              Việc này không bắt buộc ngay bây giờ, nhưng nên làm trước khi bạn dùng các tính năng quan trọng của tài khoản.
            </div>
            <div className="google-onboarding-banner__benefits">
              <span className="google-onboarding-banner__benefit-item">Đăng nhập bằng email khi cần</span>
              <span className="google-onboarding-banner__benefit-item">Không phụ thuộc Google OAuth</span>
              <span className="google-onboarding-banner__benefit-item">Bảo vệ tài khoản tốt hơn</span>
            </div>
          </div>
        </div>

        <div className="google-onboarding-banner__actions">
          <button
          className="google-onboarding-banner__action-btn google-onboarding-banner__action-btn--secondary"
          onClick={handleClose}
          >
            Để sau
          </button>
          <button
          className="google-onboarding-banner__action-btn google-onboarding-banner__action-btn--primary"
          onClick={handleSetPassword}
          >
            Thiết lập mật khẩu ngay
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default GoogleUserOnboardingBanner;
