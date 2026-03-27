import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, X, ChevronRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import MeowlRobotic from "../../assets/meowl-skin/meowl-robotic.png";
import "../../styles/OnboardingBanner.css";

export const GOOGLE_PASSWORD_ONBOARDING_SESSION_KEY =
  "googlePasswordOnboardingPending";

const GoogleUserOnboardingBanner = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsVisible(false);
      return;
    }

    const hasPendingPrompt =
      sessionStorage.getItem(GOOGLE_PASSWORD_ONBOARDING_SESSION_KEY) === "true";
    const isEligible =
      (user.authProvider === "GOOGLE" || hasPendingPrompt) &&
      !user.googleLinked &&
      Array.isArray(user.roles) &&
      user.roles.includes("USER");

    if (!isEligible) {
      setIsVisible(false);
      return;
    }

    sessionStorage.removeItem(GOOGLE_PASSWORD_ONBOARDING_SESSION_KEY);
    const timer = window.setTimeout(() => setIsVisible(true), 600);
    return () => window.clearTimeout(timer);
  }, [user]);

  const handleClose = () => {
    sessionStorage.removeItem(GOOGLE_PASSWORD_ONBOARDING_SESSION_KEY);
    setIsVisible(false);
  };

  const handleSetPassword = () => {
    sessionStorage.removeItem(GOOGLE_PASSWORD_ONBOARDING_SESSION_KEY);
    setIsVisible(false);
    navigate("/set-password");
  };

  if (!isVisible) return null;

  return (
    <div
      className="gob-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gob-title"
    >
      <div
        className="gob-modal__backdrop"
        onClick={handleClose}
      />
      <div className="gob-banner">
        <button
          className="gob-banner__close-btn"
          onClick={handleClose}
          aria-label="Đóng"
        >
          <X size={16} />
        </button>

        {/* Left: Content */}
        <div className="gob-banner__left">
          <div className="gob-banner__top">
            <div className="gob-banner__icon">
              <Shield size={22} />
            </div>
            <div className="gob-banner__header">
              <span className="gob-banner__eyebrow">
                <span className="gob-banner__eyebrow-dot" />
                Khuyến nghị bảo mật
              </span>
              <h3 id="gob-title" className="gob-banner__title">
                Thiết lập mật khẩu dự phòng
              </h3>
            </div>
          </div>

          <p className="gob-banner__description">
            Bạn đang đăng nhập bằng Google. Để tránh mất quyền truy cập khi
            Google lỗi hoặc bị khóa phiên, hãy tạo mật khẩu dự phòng.
          </p>

          <div className="gob-banner__smart-note">
            Đây là tính năng tùy chọn — bạn vẫn có thể tiếp tục đăng nhập
            bằng Google mà không cần đặt mật khẩu.
          </div>

          <div className="gob-banner__benefits">
            <span className="gob-banner__benefit-item">Đăng nhập bằng email khi cần</span>
            <span className="gob-banner__benefit-item">Không phụ thuộc Google</span>
            <span className="gob-banner__benefit-item">Bảo vệ tài khoản tốt hơn</span>
          </div>

          <div className="gob-banner__actions">
            <button
              className="gob-banner__action-btn gob-banner__action-btn--secondary"
              onClick={handleClose}
            >
              Để sau
            </button>
            <button
              className="gob-banner__action-btn gob-banner__action-btn--primary"
              onClick={handleSetPassword}
            >
              Thiết lập mật khẩu
              <ChevronRight size={15} />
            </button>
          </div>
        </div>

        {/* Right: Meowl Mascot */}
        <div className="gob-banner__right">
          <img
            src={MeowlRobotic}
            alt="Meowl robot companion"
            className="gob-banner__mascot"
          />
        </div>
      </div>
    </div>
  );
};

export default GoogleUserOnboardingBanner;
