import React, { useState, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import '../styles/MeowlGuide.css';
import guideMessages from './MeowlGuideMsg.json';
import MeowlChat from './MeowlChat';

interface GuideStep {
  id: number;
  titleEn: string;
  titleVi: string;
  contentEn: string;
  contentVi: string;
}



interface MeowlGuideProps {
  currentPage?: string;
  languageOverride?: 'en' | 'vi';
}

const MeowlGuide: React.FC<MeowlGuideProps> = ({ currentPage = 'home', languageOverride }) => {
  const { language: contextLanguage } = useLanguage();
  const language = languageOverride || contextLanguage;
  
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [guideSteps, setGuideSteps] = useState<GuideStep[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // Animation control states
  const [showOptions, setShowOptions] = useState(false);
  const [visibleOptions, setVisibleOptions] = useState<boolean[]>([false, false, false]);

  // Load messages based on current page
  useEffect(() => {
    const messages = guideMessages[currentPage as keyof typeof guideMessages] || guideMessages.home;
    setGuideSteps(messages);
    setCurrentStep(0); // Reset to first message when page changes
  }, [currentPage]);

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
          setVisibleOptions(prev => [true, prev[1], prev[2]]);
        }, 100);
        
        const option2Timer = setTimeout(() => {
          setVisibleOptions(prev => [prev[0], true, prev[2]]);
        }, 300);
        
        const option3Timer = setTimeout(() => {
          setVisibleOptions(prev => [prev[0], prev[1], true]);
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

  const handleChatClose = () => {
    setIsChatOpen(false);
  };

  const handleMascotClick = () => {
    setIsOpen(true);
    setCurrentStep(0);
  };



  // Safety check for empty guideSteps
  if (guideSteps.length === 0) {
    return null;
  }

  const currentGuide = guideSteps[currentStep];
  const title = language === 'en' ? currentGuide.titleEn : currentGuide.titleVi;
  const content = language === 'en' ? currentGuide.contentEn : currentGuide.contentVi;

  return (
    <>
      {/* MeowlChat Component */}
      <MeowlChat isOpen={isChatOpen} onClose={handleChatClose} />

      {/* Dialogue Options - Above Mascot with staggered animation */}
      {isOpen && showOptions && (
        <div className="dialogue-options-floating">
          <button 
            className={`dialogue-option-floating dialogue-option--chat ${visibleOptions[0] ? 'slide-in' : 'hidden'}`}
            onClick={(e) => {
              e.stopPropagation();
              handleChatWithMeowl();
            }}
          >
            {language === 'en' ? 'Chat with Meowl' : 'Trò chuyện với Meowl'}
          </button>
          <button 
            className={`dialogue-option-floating dialogue-option--continue ${visibleOptions[1] ? 'slide-in' : 'hidden'}`}
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
          >
            {language === 'en' ? 'Continue' : 'Tiếp tục'}
          </button>
          <button 
            className={`dialogue-option-floating dialogue-option--exit ${visibleOptions[2] ? 'slide-in' : 'hidden'}`}
            onClick={(e) => {
              e.stopPropagation();
              handleExit();
            }}
          >
            {language === 'en' ? 'Exit' : 'Thoát'}
          </button>
        </div>
      )}

      {/* Mascot Button */}
      <div className={`meowl-mascot ${isOpen ? 'mascot-active' : ''}`} onClick={handleMascotClick}>
        <div className="quest-indicator">
          <HelpCircle size={22} />
        </div>
        <img 
          src="/images/meowl_bg_clear.png" 
          alt="Meowl Guide" 
          className="mascot-image"
        />
        <div className="mascot-pulse"></div>
      </div>

      {/* Guide Dialog */}
      {isOpen && (
        <div className="meowl-dialog-overlay">
          <div className="meowl-dialog">
            {/* Avatar Section */}
            <div className="dialog-avatar">
              <img 
                src="/images/meowl_bg_clear.png" 
                alt="Meowl" 
                className="avatar-image"
              />
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
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MeowlGuide;
