import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
import '../styles/Toast.css';

export interface ToastProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  isVisible: boolean;
  onClose: () => void;
  autoCloseDelay?: number; // in seconds
  showCountdown?: boolean;
  countdownText?: string;
  actionButton?: {
    text: string;
    onClick: () => void;
  };
}

interface ToastIconProps {
  type: 'success' | 'error' | 'warning' | 'info';
  size?: number;
}

const ToastIcon: React.FC<ToastIconProps> = ({ type, size = 48 }) => {
  switch (type) {
    case 'success':
      return <CheckCircle size={size} className="toast-icon-success" />;
    case 'error':
      return <XCircle size={size} className="toast-icon-error" />;
    case 'warning':
      return <AlertTriangle size={size} className="toast-icon-warning" />;
    case 'info':
      return <Info size={size} className="toast-icon-info" />;
    default:
      return <CheckCircle size={size} className="toast-icon-success" />;
  }
};

const Toast: React.FC<ToastProps> = ({
  type,
  title,
  message,
  isVisible,
  onClose,
  autoCloseDelay = 5,
  showCountdown = false,
  countdownText = "Closing in {countdown} seconds...",
  actionButton
}) => {
  const [countdown, setCountdown] = React.useState(autoCloseDelay);

  useEffect(() => {
    if (!isVisible) {
      setCountdown(autoCloseDelay);
      return;
    }

    let timer: number;
    if (isVisible && countdown > 0) {
      timer = window.setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (isVisible && countdown === 0) {
      onClose();
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isVisible, countdown, autoCloseDelay, onClose]);

  if (!isVisible) return null;

  const getToastClass = () => {
    return `toast toast-${type}`;
  };

  const getCountdownText = () => {
    return countdownText.replace('{countdown}', countdown.toString());
  };

  return (
    <div className="toast-overlay">
      <div className={getToastClass()}>
        <div className="toast-icon-container">
          <ToastIcon type={type} />
        </div>
        
        <div className="toast-content">
          <h3 className="toast-title">{title}</h3>
          <p className="toast-message">{message}</p>
          
          {showCountdown && (
            <div className="toast-countdown">
              <span className="countdown-text">{getCountdownText()}</span>
              <div className="countdown-bar">
                <div 
                  className="countdown-progress"
                  style={{ 
                    width: `${((autoCloseDelay - countdown) / autoCloseDelay) * 100}%` 
                  }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {actionButton && (
          <button 
            className="toast-action-button"
            onClick={actionButton.onClick}
          >
            {actionButton.text}
          </button>
        )}

        <button 
          className="toast-close-button"
          onClick={onClose}
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default Toast;
