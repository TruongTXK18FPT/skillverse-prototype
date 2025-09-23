import React, { useState, useEffect } from 'react';
import { X, HelpCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import '../styles/MeowlGuide.css';
import guideMessages from './MeowlGuideMsg.json';

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

  // Load messages based on current page
  useEffect(() => {
    const messages = guideMessages[currentPage as keyof typeof guideMessages] || guideMessages.home;
    setGuideSteps(messages);
    setCurrentStep(0); // Reset to first message when page changes
  }, [currentPage]);

  const handleNext = () => {
    if (currentStep < guideSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsOpen(false);
      setCurrentStep(0);
    }
  };

  const handleDialogClick = () => {
    handleNext();
  };

  const handleClose = () => {
    setIsOpen(false);
    setCurrentStep(0);
  };

  const handleMascotClick = () => {
    setIsOpen(true);
    setCurrentStep(0);
  };

  // Stop propagation when clicking on close button
  const handleStopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
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
        <div className="meowl-dialog-overlay" onClick={handleDialogClick}>
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
                <button className="close-btn" onClick={handleStopPropagation}>
                  <div className="close-btn-inner" onClick={handleClose}>
                    <X size={18} />
                  </div>
                </button>
              </div>

              {/* Chat Bubble */}
              <div className="chat-bubble">
                <div className="chat-content">
                  <h3 className="chat-title">{title}</h3>
                  <div className="chat-text">
                    <p>{content}</p>
                  </div>
                </div>
                <div className="continue-hint">
                  {language === 'en' ? 'Click anywhere to continue...' : 'Nhấn để tiếp tục...'}
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
