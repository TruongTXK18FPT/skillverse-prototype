import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { HelpCircle, Bell, BellOff } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { useMeowlSkin } from "../../context/MeowlSkinContext";
import { useMeowlState } from "../../context/MeowlStateContext";
import "../../styles/MeowlGuide.css";
import guideMessages from "./MeowlGuideMsg.json";
import MeowlChat from "./MeowlChat";

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
        closeCheckInSuccess();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showCheckInSuccessModal, closeCheckInSuccess]);

  // Navigate to dashboard for check-in
  const goToDashboard = () => {
    navigate("/dashboard");
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

  return (
    <>
      {/* MeowlChat Component */}
      <MeowlChat isOpen={isChatOpen} onClose={handleChatClose} />

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
        className={`meowl-mascot ${isOpen ? "mascot-active" : ""} ${meowlState !== "active" ? `meowl-state--${meowlState}` : ""} ${meowlState === "lose-streak" ? "meowl-frozen" : ""}`}
        onClick={handleMascotClick}
      >
        {/* Mute/Unmute Button (Replaces Quest Indicator) */}
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

        {/* Check-in reminder indicator */}
        {isAuthenticated && !hasCheckedInToday && (
          <div
            className="meowl-checkin-reminder"
            title={
              language === "en"
                ? "You haven't checked in today!"
                : "Bạn chưa điểm danh hôm nay!"
            }
          >
            <span className="checkin-reminder-text">!</span>
          </div>
        )}

        {/* Frozen Meowl notification bubble - Dark glass style */}
        {isAuthenticated && meowlState === "lose-streak" && (
          <div className="meowl-freeze-bubble" onClick={handleFreezeClick}>
            <div className="freeze-bubble-icon">🔥</div>
            <span className="freeze-bubble-text">
              {language === "en"
                ? "Check in to ignite Meowl and continue your streak!"
                : "Điểm danh để tiếp lửa cho Meowl đồng hành cùng bạn!"}
            </span>
            <button className="freeze-bubble-action">
              {language === "en" ? "Go to Dashboard 🔥" : "Vào Dashboard 🔥"}
            </button>
          </div>
        )}

        <img src={displayImage} alt="Meowl Guide" className="mascot-image" />
        <div className="mascot-pulse"></div>
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

      {/* Check-in Success Modal */}
      {showCheckInSuccessModal && (
        <div
          className="checkin-success-overlay"
          onClick={() => closeCheckInSuccess()}
        >
          <div
            className="checkin-success-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="checkin-success-content">
              <div className="checkin-success-meowl">
                <img
                  src={displayImage}
                  alt="Meowl"
                  className="checkin-meowl-image"
                />
                <div className="checkin-sparkles">✨</div>
              </div>
              <div className="checkin-success-info">
                <div className="checkin-success-title">
                  {language === "en"
                    ? "🎉 Check-in Successful!"
                    : "🎉 Điểm danh thành công!"}
                </div>
                <div className="checkin-success-message">
                  {language === "en"
                    ? "Meowl is happy to see you today!"
                    : "Meowl rất vui khi gặp bạn hôm nay!"}
                </div>
                <div className="checkin-success-reward">
                  <span className="reward-icon">🪙</span>
                  <span className="reward-text">+{checkInCoins} Coins</span>
                </div>
                <div className="checkin-progress-bar">
                  <div className="checkin-progress-fill"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MeowlGuide;
