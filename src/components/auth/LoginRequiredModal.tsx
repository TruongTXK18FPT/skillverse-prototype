import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, LogIn, X, Zap, Rocket, Shield } from "lucide-react";
import { SpriteAnimator } from "../meowl-pet/SpriteAnimator";
import { PetState } from "../meowl-pet/types";
import { PET_CONFIG } from "../meowl-pet/constants";
import "./LoginRequiredModal.css";

interface LoginRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  feature?: string;
}

const LoginRequiredModal: React.FC<LoginRequiredModalProps> = ({
  isOpen,
  onClose,
  title = "Đăng nhập để tiếp tục",
  message = "Mở khóa toàn bộ tính năng của SkillVerse",
  feature,
}) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleLogin = () => {
    onClose();
    navigate("/login", { state: { from: window.location.pathname } });
  };

  const handleRegister = () => {
    onClose();
    navigate("/choose-role", {
      state: { from: window.location.pathname },
    });
  };

  const handleDismiss = () => {
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="lrm-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleDismiss}
          />

          {/* Main Container */}
          <div className="lrm-container" onClick={handleDismiss}>
            {/* Modal Card */}
            <motion.div
              className="lrm-modal"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label={title}
            >
              {/* Animated Background Grid */}
              <div className="lrm-grid-bg"></div>

              {/* Glowing Orbs */}
              <div className="lrm-orb lrm-orb-1"></div>
              <div className="lrm-orb lrm-orb-2"></div>
              <div className="lrm-orb lrm-orb-3"></div>

              {/* Close Button */}
              <button className="lrm-close" onClick={handleDismiss}>
                <X size={16} />
              </button>

              {/* Main Content Area */}
              <div className="lrm-main">
                {/* Meowl Character - Full Image */}
                <motion.div
                  className="lrm-meowl"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, type: "spring", damping: 20 }}
                >
                  <div className="lrm-thought-bubble" role="note" aria-label="Meowl thought">
                    Ơ... ai đó chưa đăng nhập kìa 😴
                  </div>
                  <div className="lrm-meowl-sprite" aria-hidden="true">
                    <SpriteAnimator
                      state={PetState.SLEEP}
                      facingRight={true}
                      config={{
                        ...PET_CONFIG,
                        width: 128,
                        height: 128,
                        animationSpeed: 170,
                      }}
                    />
                  </div>
                  <div className="lrm-meowl-glow"></div>
                </motion.div>

                {/* Content */}
                <div className="lrm-content">
                  {/* Icon */}
                  <motion.div
                    className="lrm-icon-wrap"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 400 }}
                  >
                    <div className="lrm-icon-hex">
                      <Lock size={20} />
                    </div>
                    <div className="lrm-icon-pulse"></div>
                  </motion.div>

                  {/* Text */}
                  <h2 className="lrm-title">{title}</h2>
                  <p className="lrm-message">{message}</p>

                  {feature && (
                    <div className="lrm-feature">
                      <Zap size={12} />
                      <span>{feature}</span>
                    </div>
                  )}

                  {/* Quick Benefits */}
                  <div className="lrm-benefits">
                    <div className="lrm-benefit">
                      <Rocket size={14} />
                      <span>Trải nghiệm đầy đủ</span>
                    </div>
                    <div className="lrm-benefit">
                      <Shield size={14} />
                      <span>An toàn & Bảo mật</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="lrm-actions">
                    <motion.button
                      className="lrm-btn lrm-btn-primary"
                      onClick={handleLogin}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <LogIn size={16} />
                      <span>Đăng nhập</span>
                    </motion.button>
                    <motion.button
                      className="lrm-btn lrm-btn-secondary"
                      onClick={handleRegister}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span>Tạo tài khoản</span>
                    </motion.button>
                  </div>

                  {/* Footer */}
                  <p className="lrm-footer">
                    Bằng việc tiếp tục, bạn đồng ý với{" "}
                    <a href="/terms-of-service">Điều khoản</a>
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default LoginRequiredModal;
