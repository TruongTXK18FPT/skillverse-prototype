import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { HelpCircle, Bell, BellOff } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { useMeowlSkin } from "../../context/MeowlSkinContext";
import { useMeowlState } from "../../context/MeowlStateContext";
import "../../styles/MeowlGuide.css";
import guideMessages from "./MeowlGuideMsg.json";
import MeowlChatV2 from "./MeowlChatV2";

interface GuideStep {
  id: number;
  titleEn: string;
  titleVi: string;
  contentEn: string;
  contentVi: string;
}

interface MeowlGuideProps {
  currentPage?: string;
  languageOverride?: "en" | "vi";
}

const STORAGE_KEYS = {
  BUBBLE_DISABLED: "meowl-bubble-disabled",
};

const MeowlGuide: React.FC<MeowlGuideProps> = ({
  currentPage = "home",
  languageOverride,
}) => {
  const navigate = useNavigate();
  const { language: contextLanguage } = useLanguage();
  const { currentSkin, currentSkinImage } = useMeowlSkin();
  const {
    stateImage,
    meowlState,
    recordInteraction,
    hasCheckedInToday,
    isAuthenticated,
    showCheckInSuccessModal,
    checkInCoins,
    closeCheckInSuccess,
  } = useMeowlState();
  const language = languageOverride || contextLanguage;

  // Use state image if available (lose-streak or sleeping), otherwise use skin
  const displayImage = stateImage || currentSkinImage;

  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [guideSteps, setGuideSteps] = useState<GuideStep[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Bubble mute state
  const [isBubbleDisabled, setIsBubbleDisabled] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.BUBBLE_DISABLED) === "true";
  });

  // Animation control states
  const [showOptions, setShowOptions] = useState(false);
  const [visibleOptions, setVisibleOptions] = useState<boolean[]>([
    false,
    false,
    false,
  ]);

  // Animation state for post-attendance
  const [isPerformingPostAttendanceAnim, setIsPerformingPostAttendanceAnim] =
    useState(false);
  const [animPhase, setAnimPhase] = useState<
    "none" | "exit" | "pause" | "enter" | "blink"
  >("none");

  // Load messages based on current page
  useEffect(() => {
    const messages =
      guideMessages[currentPage as keyof typeof guideMessages] ||
      guideMessages.home;
    setGuideSteps(messages);
    setCurrentStep(0); // Reset to first message when page changes
  }, [currentPage]);

  // Listen for external toggle events (sync with other components)
  useEffect(() => {
    const handleStorageChange = () => {
      setIsBubbleDisabled(
        localStorage.getItem(STORAGE_KEYS.BUBBLE_DISABLED) === "true",
      );
    };

    window.addEventListener("meowl-bubble-toggle", handleStorageChange);
    return () => {
      window.removeEventListener("meowl-bubble-toggle", handleStorageChange);
    };
  }, []);

  const toggleBubbleMute = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening guide
    const newState = !isBubbleDisabled;
    setIsBubbleDisabled(newState);
    localStorage.setItem(STORAGE_KEYS.BUBBLE_DISABLED, newState.toString());
    // Dispatch event for MeowlBubbleNotification to pick up
    window.dispatchEvent(new Event("meowl-bubble-toggle"));
  };

  // Staggered animation for dialogue options
  useEffect(() => {
    if (isOpen) {
      // Reset animation states
      setShowOptions(false);
      setVisibleOptions([false, false, false]);

      // Show options after 1 second delay
      const showOptionsTimer = setTimeout(() => {
        setShowOptions(true);

        // Show each option with staggered timing
        const option1Timer = setTimeout(() => {
          setVisibleOptions((prev) => [true, prev[1], prev[2]]);
        }, 100);

        const option2Timer = setTimeout(() => {
          setVisibleOptions((prev) => [prev[0], true, prev[2]]);
        }, 300);

        const option3Timer = setTimeout(() => {
          setVisibleOptions((prev) => [prev[0], prev[1], true]);
        }, 500);

        // Cleanup timers on unmount
        return () => {
          clearTimeout(option1Timer);
          clearTimeout(option2Timer);
          clearTimeout(option3Timer);
        };
      }, 500);

      return () => clearTimeout(showOptionsTimer);
    }
  }, [isOpen]);

  const handleNext = () => {
    if (currentStep < guideSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsOpen(false);
      setCurrentStep(0);
    }
  };

  const handleExit = () => {
    setIsOpen(false);
    setCurrentStep(0);
  };

  const handleChatWithMeowl = () => {
    setIsOpen(false); // Close guide dialog
    setIsChatOpen(true); // Open chat dialog
  };

  const handleOpenUserGuide = () => {
    setIsOpen(false);
    window.location.href = "/user-guide";
  };

  const handleChatClose = () => {
    setIsChatOpen(false);
  };

  // Auto-close success modal after 5 seconds
  useEffect(() => {
    if (showCheckInSuccessModal) {
      const timer = setTimeout(() => {
        handleCloseSuccess();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showCheckInSuccessModal]);

  const startPostAttendanceAnim = () => {
    setIsPerformingPostAttendanceAnim(true);
    setAnimPhase("exit");

    // Phase 1: Exit stage right (0.5s)
    setTimeout(() => {
      setAnimPhase("pause");

      // Phase 2: Pause (0.5s)
      setTimeout(() => {
        setAnimPhase("enter");

        // Phase 3: Enter and blink (1s)
        setTimeout(() => {
          setAnimPhase("blink");

          // Phase 4: Reset (after blink animation)
          setTimeout(() => {
            setAnimPhase("none");
            setIsPerformingPostAttendanceAnim(false);
          }, 2000);
        }, 1000);
      }, 500);
    }, 500);
  };

  const handleCloseSuccess = () => {
    closeCheckInSuccess();

    // Trigger animation sequence if not default skin
    if (currentSkin !== "default") {
      startPostAttendanceAnim();
    }
  };

  // Navigate to dashboard for check-in
  const goToDashboard = () => {
    if (window.location.pathname === "/dashboard") {
      const element = document.getElementById("learning-streak-section");
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      navigate("/dashboard");
      // Use logic to scroll after navigation
      setTimeout(() => {
        const element = document.getElementById("learning-streak-section");
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 800);
    }
  };

  const handleMascotClick = () => {
    // If frozen (lose-streak), navigate to dashboard for check-in
    if (meowlState === "lose-streak") {
      goToDashboard();
      return;
    }

    recordInteraction(); // Record user interaction when clicking Meowl
    setIsOpen(true);
    setCurrentStep(0);
  };

  const handleFreezeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    goToDashboard();
  };

  // Safety check for empty guideSteps
  if (guideSteps.length === 0) {
    return null;
  }

  const currentGuide = guideSteps[currentStep];
  const title = language === "en" ? currentGuide.titleEn : currentGuide.titleVi;
  const content =
    language === "en" ? currentGuide.contentEn : currentGuide.contentVi;

  // Handler for login request from MeowlChatV2
  const handleRequestLogin = () => {
    navigate("/login");
  };

  return (
    <>
      {/* MeowlChat Component - V2 with responsive design & guest management */}
      <MeowlChatV2
        isOpen={isChatOpen}
        onClose={handleChatClose}
        onRequestLogin={handleRequestLogin}
      />

      {/* Dialogue Options - Above Mascot with staggered animation (Desktop Only) */}
      {isOpen && showOptions && (
        <div className="dialogue-options-floating desktop-only-options">
          <button
            className={`dialogue-option-floating dialogue-option--chat ${visibleOptions[0] ? "slide-in" : "hidden"}`}
            onClick={(e) => {
              e.stopPropagation();
              handleChatWithMeowl();
            }}
          >
            {language === "en" ? "Chat with Meowl" : "Trò chuyện với Meowl"}
          </button>
          <button
            className={`dialogue-option-floating dialogue-option--chat ${visibleOptions[0] ? "slide-in" : "hidden"}`}
            onClick={(e) => {
              e.stopPropagation();
              handleOpenUserGuide();
            }}
            style={{ marginTop: "10px" }}
          >
            {language === "en" ? "User Guide" : "Hướng dẫn sử dụng"}
          </button>
          <button
            className={`dialogue-option-floating dialogue-option--continue ${visibleOptions[1] ? "slide-in" : "hidden"}`}
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
          >
            {language === "en" ? "Continue" : "Tiếp tục"}
          </button>
          <button
            className={`dialogue-option-floating dialogue-option--exit ${visibleOptions[2] ? "slide-in" : "hidden"}`}
            onClick={(e) => {
              e.stopPropagation();
              handleExit();
            }}
          >
            {language === "en" ? "Exit" : "Thoát"}
          </button>
        </div>
      )}

      {/* Mascot Button */}
      <div
        className={`meowl-mascot ${isOpen ? "mascot-active" : ""} ${meowlState !== "active" ? `meowl-state--${meowlState}` : ""} ${meowlState === "lose-streak" ? "meowl-frozen" : ""} ${animPhase !== "none" ? `meowl-anim-${animPhase}` : ""}`}
        onClick={handleMascotClick}
      >
        {/* Mute/Unmute Button (Hidden when lose-streak) */}
        {meowlState !== "lose-streak" && (
          <div
            className="meowl-mute-btn"
            onClick={toggleBubbleMute}
            title={
              isBubbleDisabled
                ? language === "en"
                  ? "Enable Notifications"
                  : "Bật thông báo"
                : language === "en"
                  ? "Mute Notifications"
                  : "Tắt thông báo"
            }
          >
            {isBubbleDisabled ? <BellOff size={18} /> : <Bell size={18} />}
          </div>
        )}

        {/* Check-in reminder indicator (Moved to bell position when lose-streak) */}
        {isAuthenticated && !hasCheckedInToday && (
          <div
            className={`meowl-checkin-reminder ${meowlState === "lose-streak" ? "reminder-replacement" : ""}`}
            onClick={handleMascotClick}
            title={
              language === "en"
                ? "You haven't checked in today!"
                : "Bạn chưa điểm danh hôm nay!"
            }
          >
            <span className="checkin-reminder-text">!</span>
          </div>
        )}

        <img src={displayImage} alt="Meowl Guide" className="mascot-image" />
        <div className="mascot-pulse"></div>

        {/* Blink efekt particles */}
        {animPhase === "blink" && (
          <div className="meowl-blink-particles">
            <div className="particle">✨</div>
            <div className="particle">💎</div>
            <div className="particle">⭐</div>
          </div>
        )}
      </div>

      {/* Guide Dialog */}
      {isOpen && (
        <div className="meowl-dialog-overlay">
          <div className="meowl-dialog">
            {/* Avatar Section */}
            <div className="dialog-avatar">
              <img src={displayImage} alt="Meowl" className="avatar-image" />
            </div>

            {/* Dialog Content */}
            <div className="dialog-content">
              {/* Header */}
              <div className="dialog-header">
                <div className="character-name">Meowl</div>
              </div>

              {/* Chat Bubble */}
              <div className="chat-bubble">
                <div className="chat-content">
                  <h3 className="chat-title">{title}</h3>
                  <div className="chat-text">
                    <p>{content}</p>
                  </div>
                </div>
              </div>

              {/* Mobile Options Container - Moved inside dialog content for mobile */}
              {showOptions && (
                <div className="dialogue-options-mobile">
                  <button
                    className={`dialogue-option-floating dialogue-option--chat ${visibleOptions[0] ? "slide-in" : "hidden"}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleChatWithMeowl();
                    }}
                  >
                    {language === "en"
                      ? "Chat with Meowl"
                      : "Trò chuyện với Meowl"}
                  </button>
                  <button
                    className={`dialogue-option-floating dialogue-option--chat ${visibleOptions[0] ? "slide-in" : "hidden"}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenUserGuide();
                    }}
                  >
                    {language === "en" ? "User Guide" : "Hướng dẫn sử dụng"}
                  </button>
                  <button
                    className={`dialogue-option-floating dialogue-option--continue ${visibleOptions[1] ? "slide-in" : "hidden"}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNext();
                    }}
                  >
                    {language === "en" ? "Continue" : "Tiếp tục"}
                  </button>
                  <button
                    className={`dialogue-option-floating dialogue-option--exit ${visibleOptions[2] ? "slide-in" : "hidden"}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExit();
                    }}
                  >
                    {language === "en" ? "Exit" : "Thoát"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Check-in Success Modal (Refined HUD) */}
      {showCheckInSuccessModal && (
        <div className="checkin-success-overlay" onClick={handleCloseSuccess}>
          <div
            className="checkin-success-modal tech-hud-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Background FX */}
            <div className="hud-grid-bg"></div>
            <div className="hud-scan-line"></div>

            {/* Tech Corners */}
            <div className="hud-corner top-left"></div>
            <div className="hud-corner top-right"></div>
            <div className="hud-corner bottom-left"></div>
            <div className="hud-corner bottom-right"></div>

            <div className="checkin-success-content">
              {/* Left Side: Holo Projector */}
              <div className="checkin-meowl-container">
                <div className="meowl-holo-base"></div>{" "}
                {/* Đế chiếu hologram */}
                <div className="meowl-holo-beam"></div>{" "}
                {/* Ánh sáng chiếu lên */}
                <img
                  src={displayImage}
                  alt="Meowl"
                  className="checkin-meowl-image"
                />
              </div>

              {/* Right Side: Data readout */}
              <div className="checkin-success-info">
                <div className="checkin-status-badge">
                  <span className="status-dot"></span>
                  SYSTEM SYNCED
                </div>

                <h2 className="checkin-success-title">
                  {language === "en"
                    ? "CHECK-IN COMPLETE"
                    : "ĐIỂM DANH THÀNH CÔNG"}
                </h2>

                <div className="checkin-reward-box">
                  <div className="reward-label">REWARD ACQUIRED</div>
                  <div className="reward-value">
                    <span className="reward-icon">🪙</span>
                    <span className="reward-amount">+{checkInCoins}</span>
                  </div>
                  <div className="reward-unit">CREDITS ADDED</div>
                </div>

                <button className="hud-action-btn" onClick={handleCloseSuccess}>
                  <span className="btn-text">
                    {language === "en" ? "CONFIRM" : "XÁC NHẬN"}
                  </span>
                  <div className="btn-glare"></div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MeowlGuide;
