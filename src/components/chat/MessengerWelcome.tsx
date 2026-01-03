import React, { useState, useEffect } from 'react';
import { 
  Users, 
  MessageCircle, 
  Sparkles, 
  Gift,
  Image as ImageIcon,
  Smile,
  Send,
  CheckCircle,
  ArrowRight,
  X
} from 'lucide-react';
import './MessengerWelcome.css';

interface MessengerWelcomeProps {
  onClose: () => void;
  onGetStarted: () => void;
}

const MessengerWelcome: React.FC<MessengerWelcomeProps> = ({ onClose, onGetStarted }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const features = [
    {
      icon: MessageCircle,
      title: 'Trò chuyện Realtime',
      description: 'Gửi và nhận tin nhắn ngay lập tức với WebSocket',
      color: '#6366f1'
    },
    {
      icon: Smile,
      title: 'Custom Emojis',
      description: 'Sử dụng emoji đặc biệt của SkillVerse',
      color: '#f59e0b'
    },
    {
      icon: Gift,
      title: 'Gửi GIF',
      description: 'Tìm kiếm và gửi GIF từ GIPHY',
      color: '#ec4899'
    },
    {
      icon: ImageIcon,
      title: 'Chia sẻ Hình ảnh',
      description: 'Upload và gửi hình ảnh nhanh chóng',
      color: '#8b5cf6'
    },
    {
      icon: Users,
      title: 'Quản lý Nhóm',
      description: 'Xem danh sách thành viên, Mentor có thể kick members',
      color: '#10b981'
    },
    {
      icon: Sparkles,
      title: 'UI Premium',
      description: 'Giao diện đẹp mắt với animations mượt mà',
      color: '#06b6d4'
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="messenger-welcome-overlay">
      <div className="messenger-welcome-modal">
        <button className="welcome-close" onClick={onClose}>
          <X size={24} />
        </button>

        <div className="welcome-header">
          <div className="welcome-icon-large">
            <MessageCircle size={48} />
            <Sparkles size={24} className="sparkle-icon" />
          </div>
          <h2>Chào mừng đến với SkillVerse Chat!</h2>
          <p>Trải nghiệm hệ thống nhắn tin hiện đại và đầy đủ tính năng</p>
        </div>

        <div className="welcome-features">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`feature-card ${currentStep === index ? 'active' : ''}`}
              style={{ '--feature-color': feature.color } as React.CSSProperties}
            >
              <div className="feature-icon">
                <feature.icon size={24} />
              </div>
              <div className="feature-content">
                <h4>{feature.title}</h4>
                <p>{feature.description}</p>
              </div>
              {currentStep === index && (
                <div className="feature-indicator">
                  <CheckCircle size={20} />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="welcome-steps">
          {features.map((_, index) => (
            <div
              key={index}
              className={`step-dot ${currentStep === index ? 'active' : ''}`}
              onClick={() => setCurrentStep(index)}
            />
          ))}
        </div>

        <div className="welcome-actions">
          <button className="skip-btn" onClick={onClose}>
            Bỏ qua
          </button>
          <button className="get-started-btn" onClick={onGetStarted}>
            Bắt đầu ngay
            <ArrowRight size={18} />
          </button>
        </div>

        <div className="welcome-footer">
          <p>💡 Tip: Nhấn <kbd>Enter</kbd> để gửi, <kbd>Shift+Enter</kbd> để xuống dòng</p>
        </div>
      </div>
    </div>
  );
};

export default MessengerWelcome;
