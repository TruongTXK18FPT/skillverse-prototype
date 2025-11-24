import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Clock, CheckCircle, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import './HologramVerifyForm.css';

// Import Meowl assets
import MeowlUser from '../../assets/space-role/meowl-user.png';
import MeowlMentor from '../../assets/space-role/meowl-mentor.png';
import MeowlBusiness from '../../assets/space-role/meowl-business.png';

interface HologramVerifyFormProps {
  email: string;
  otp: string[];
  isLoading: boolean;
  isResendLoading: boolean;
  timeLeft: number;
  isExpired: boolean;
  resendCooldown: number;
  userType: 'user' | 'mentor' | 'business';
  onOtpChange: (index: number, value: string) => void;
  onPaste: (index: number, e: React.ClipboardEvent) => void;
  onKeyDown: (index: number, e: React.KeyboardEvent) => void;
  onSubmit: (e: React.FormEvent) => void;
  onResend: () => void;
  onBack: () => void;
}

const HologramVerifyForm: React.FC<HologramVerifyFormProps> = ({
  email,
  otp,
  isLoading,
  isResendLoading,
  timeLeft,
  isExpired,
  resendCooldown,
  userType,
  onOtpChange,
  onPaste,
  onKeyDown,
  onSubmit,
  onResend,
  onBack
}) => {
  // Select Meowl based on user type
  const getMeowlImage = () => {
    switch (userType) {
      case 'mentor':
        return MeowlMentor;
      case 'business':
        return MeowlBusiness;
      case 'user':
      default:
        return MeowlUser;
    }
  };

  // Format time mm:ss
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="v-hologram-verify-wrapper">
      {/* Meowl Mascot - Left/Side */}
      <motion.div 
        className="meowl-container"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5, duration: 0.8 }}
      >
        <img 
          src={getMeowlImage()} 
          alt="Meowl Companion" 
          className="v-meowl-image" 
        />
      </motion.div>

      {/* Hologram Form */}
      <motion.div
        className="v-hologram-form-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Hologram Border Effect */}
        <div className="v-hologram-border">
          <div className="border-corner top-left"></div>
          <div className="border-corner top-right"></div>
          <div className="border-corner bottom-left"></div>
          <div className="border-corner bottom-right"></div>
          <div className="border-line top"></div>
          <div className="border-line bottom"></div>
          <div className="border-line left"></div>
          <div className="border-line right"></div>
        </div>

        {/* Form Content */}
        <div className="v-hologram-content">
          {/* Back Button */}
          <button onClick={onBack} className="back-button">
            <ArrowLeft size={16} />
            <span>QUAY LẠI</span>
          </button>

          {/* Header */}
          <div className="v-hologram-header">
            <div className="verify-icon-container">
              <Mail size={48} />
            </div>
            
            <h1 className="v-hologram-title">XÁC THỰC EMAIL</h1>
            <p className="v-hologram-subtitle">
              Mã xác thực đã được gửi đến địa chỉ email
            </p>
            
            <div className="v-hologram-email-display">
              {email}
            </div>

            {/* Timer */}
            <div className={`verify-timer ${isExpired ? 'expired' : timeLeft <= 60 ? 'warning' : ''}`}>
              <Clock size={16} />
              <span>{isExpired ? 'HẾT HẠN' : formatTime(timeLeft)}</span>
            </div>
          </div>

          {/* OTP Form */}
          <form onSubmit={onSubmit} className="v-hologram-form">
            <div className="otp-inputs-container">
              {Array.from({ length: 6 }, (_, index) => (
                <input
                  key={`otp-${index}`}
                  id={`otp-${index}`}
                  type="text"
                  value={otp[index] || ''}
                  onChange={(e) => onOtpChange(index, e.target.value)}
                  onKeyDown={(e) => onKeyDown(index, e)}
                  onPaste={(e) => onPaste(index, e)}
                  className={`v-hologram-otp-input ${isExpired ? 'expired' : ''}`}
                  maxLength={1}
                  disabled={isLoading || isExpired}
                  autoComplete="one-time-code"
                  autoFocus={index === 0}
                />
              ))}
            </div>

            <div className="v-form-actions">
              <button 
                type="submit" 
                className={`v-submit-button ${isExpired ? 'expired' : ''}`}
                disabled={isLoading || isExpired || otp.join('').length !== 6}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="spinner" size={20} />
                    <span>ĐANG XÁC THỰC...</span>
                  </>
                ) : isExpired ? (
                  <>
                    <AlertCircle size={20} />
                    <span>MÃ ĐÃ HẾT HẠN</span>
                  </>
                ) : (
                  <>
                    <CheckCircle size={20} />
                    <span>XÁC THỰC</span>
                  </>
                )}
                <div className="button-glow"></div>
              </button>

              <div className="resend-container">
                <span>Không nhận được mã?</span>
                <button
                  type="button"
                  className="resend-button"
                  onClick={onResend}
                  disabled={isResendLoading || resendCooldown > 0}
                >
                  {isResendLoading ? (
                    <span className="spinner-small"></span>
                  ) : resendCooldown > 0 ? (
                    `Gửi lại sau ${resendCooldown}s`
                  ) : (
                    'Gửi lại mã'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Hologram Flicker Effect */}
        <div className="v-hologram-flicker"></div>
      </motion.div>
    </div>
  );
};

export default HologramVerifyForm;
