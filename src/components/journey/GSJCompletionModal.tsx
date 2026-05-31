import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, Award, Sparkles, ShieldCheck } from "lucide-react";
import JourneyVerificationDossier from "./JourneyVerificationDossier";
import "./GSJCompletionModal.css";

interface GSJCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  journeyId: number;
  journeyTitle?: string;
  learnerName?: string;
  learnerAvatar?: string;
}

const GSJCompletionModal: React.FC<GSJCompletionModalProps> = ({
  isOpen,
  onClose,
  journeyId,
  journeyTitle,
  learnerName,
  learnerAvatar,
}) => {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  // Handle ESC key press
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

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="gsj-cm-backdrop"
            className="gsj-cm-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Wrapper - offsets modal from the top navbar */}
          <motion.div
            key="gsj-cm-overlay-wrapper"
            className="gsj-cm-overlay-wrapper"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          >
            {/* Modal Dialog Card */}
            <motion.div
              className="gsj-cm-card"
              initial={{ opacity: 0, scale: 0.93, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              {/* Futuristic Background Design Elements */}
              <div className="gsj-cm-grid-pattern" />
              <div className="gsj-cm-glow-orb gsj-cm-glow-orb--cyan" />
              <div className="gsj-cm-glow-orb gsj-cm-glow-orb--violet" />

              {/* Close Button */}
              <button 
                className="gsj-cm-close-btn" 
                onClick={onClose}
                aria-label="Đóng modal"
              >
                <X size={18} />
              </button>

              {/* Top Hero Banner - Cyberpunk Congratulations */}
              <div className="gsj-cm-hero">
                <div className="gsj-cm-trophy-hex-wrap">
                  <div className="gsj-cm-trophy-hex">
                    <Trophy size={42} className="gsj-cm-trophy-icon" />
                  </div>
                  <div className="gsj-cm-trophy-pulse" />
                  <div className="gsj-cm-sparkle-decor gsj-cm-sparkle-decor--1"><Sparkles size={16} /></div>
                  <div className="gsj-cm-sparkle-decor gsj-cm-sparkle-decor--2"><Award size={18} /></div>
                </div>

                <div className="gsj-cm-title-block">
                  <span className="gsj-cm-eyebrow">
                    <ShieldCheck size={14} /> HÀNH TRÌNH ĐÃ HOÀN THÀNH XUẤT SẮC
                  </span>
                  <h2 className="gsj-cm-title">Chúc Mừng Bạn Đã Tốt Nghiệp Lộ Trình!</h2>
                  <p className="gsj-cm-desc">
                    Tất cả kỹ năng và bài kiểm tra trong lộ trình học của bạn đã được xác thực thành công. 
                    Dưới đây là chi tiết hồ sơ chứng nhận (Dossier) và đánh giá chung từ hệ thống.
                  </p>
                </div>
              </div>

              {/* Embedded Detailed Dossier (Scrollable Area) */}
              <div className="gsj-cm-dossier-wrapper">
                <JourneyVerificationDossier
                  journeyId={journeyId}
                  journeyTitle={journeyTitle}
                  learnerName={learnerName}
                  learnerAvatar={learnerAvatar}
                  readonly={true}
                />
              </div>

              {/* Modal Footer Actions */}
              <div className="gsj-cm-footer">
                <button 
                  type="button" 
                  className="gsj-cm-btn-dismiss" 
                  onClick={onClose}
                >
                  Xác nhận & Quay lại
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default GSJCompletionModal;
