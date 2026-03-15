import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Target, ArrowRight, X, Zap, Map, Brain } from 'lucide-react';
import './../../styles/JourneyPromptModal.css';

const JOURNEY_PROMPT_KEY = 'journey_prompt_shown';

interface JourneyPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const JourneyPromptModal: React.FC<JourneyPromptModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setIsVisible(true), 100);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  const handleStartJourney = () => {
    localStorage.setItem(JOURNEY_PROMPT_KEY, 'true');
    onClose();
    navigate('/journey/create');
  };

  const handleDismiss = () => {
    localStorage.setItem(JOURNEY_PROMPT_KEY, 'true');
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  if (!isOpen) return null;

  return (
    <div className={`journey-prompt-overlay ${isVisible ? 'journey-prompt-overlay--visible' : ''}`}>
      <div className={`journey-prompt-modal ${isVisible ? 'journey-prompt-modal--visible' : ''}`}>
        {/* Close button */}
        <button className="journey-prompt__close" onClick={handleDismiss}>
          <X size={20} />
        </button>

        {/* Background decorations */}
        <div className="journey-prompt__bg">
          <div className="journey-prompt__bg-circle journey-prompt__bg-circle--1"></div>
          <div className="journey-prompt__bg-circle journey-prompt__bg-circle--2"></div>
          <div className="journey-prompt__bg-circle journey-prompt__bg-circle--3"></div>
        </div>

        {/* Content */}
        <div className="journey-prompt__content">
          {/* Icon */}
          <div className="journey-prompt__icon">
            <Sparkles size={32} />
          </div>

          {/* Title */}
          <h2 className="journey-prompt__title">
            Chào mừng đến với <span className="journey-prompt__title-highlight">Guided Journey</span>!
          </h2>

          {/* Description */}
          <p className="journey-prompt__description">
            Hành trình học tập cá nhân hóa dành riêng cho bạn. Để AI giúp bạn:
          </p>

          {/* Features */}
          <div className="journey-prompt__features">
            <div className="journey-prompt__feature">
              <div className="journey-prompt__feature-icon">
                <Brain size={20} />
              </div>
              <div className="journey-prompt__feature-text">
                <strong>Đánh giá kỹ năng</strong>
                <span>AI phân tích năng lực hiện tại của bạn</span>
              </div>
            </div>
            <div className="journey-prompt__feature">
              <div className="journey-prompt__feature-icon">
                <Map size={20} />
              </div>
              <div className="journey-prompt__feature-text">
                <strong>Tạo lộ trình</strong>
                <span>Lộ trình học tập phù hợp với mục tiêu</span>
              </div>
            </div>
            <div className="journey-prompt__feature">
              <div className="journey-prompt__feature-icon">
                <Target size={20} />
              </div>
              <div className="journey-prompt__feature-text">
                <strong>Theo dõi tiến độ</strong>
                <span>Đạt được mục tiêu nghề nghiệp nhanh hơn</span>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="journey-prompt__actions">
            <button className="journey-prompt__btn journey-prompt__btn--primary" onClick={handleStartJourney}>
              <Zap size={18} />
              Bắt đầu ngay
              <ArrowRight size={18} />
            </button>
            <button className="journey-prompt__btn journey-prompt__btn--secondary" onClick={handleDismiss}>
              Để sau
            </button>
          </div>

          {/* Note */}
          <p className="journey-prompt__note">
            Chỉ mất 3-5 phút để hoàn thành form đánh giá
          </p>
        </div>
      </div>
    </div>
  );
};

// Hook để kiểm tra và hiển thị prompt
export const useJourneyPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Chỉ hiển thị nếu chưa từng hiển thị
    const hasSeenPrompt = localStorage.getItem(JOURNEY_PROMPT_KEY);
    if (!hasSeenPrompt) {
      // Delay một chút để đảm bảo user đã đăng nhập
      setTimeout(() => {
        setShowPrompt(true);
      }, 1500);
    }
  }, []);

  const closePrompt = () => {
    setShowPrompt(false);
    localStorage.setItem(JOURNEY_PROMPT_KEY, 'true');
  };

  return { showPrompt, closePrompt };
};

export default JourneyPromptModal;
