import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Logo from '../../assets/skillverse.png';
import './HologramForgotPasswordForm.css';

const HologramForgotPasswordForm: React.FC = () => {
  const { forgotPassword } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Vui lòng nhập email');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await forgotPassword(email);
      
      // Save OTP expiry time to localStorage using client clock to avoid timezone issues
      const minutes = (response as any)?.otpExpiryMinutes ?? 5;
      const storageKey = `otp_expiry_${email}`;
      const expiryIso = new Date(Date.now() + minutes * 60 * 1000).toISOString();
      localStorage.setItem(storageKey, expiryIso);
      
      // Navigate to verify OTP page with forgot-password mode
      navigate('/verify-otp', { 
        state: { 
          email, 
          mode: 'forgot-password' 
        } 
      });
    } catch (err: any) {
      setError(err.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      className="fgp-wrapper"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Borders */}
      <div className="fgp-border">
        <div className="fgp-border-corner top-left"></div>
        <div className="fgp-border-corner top-right"></div>
        <div className="fgp-border-corner bottom-left"></div>
        <div className="fgp-border-corner bottom-right"></div>
        <div className="fgp-border-line top"></div>
        <div className="fgp-border-line bottom"></div>
        <div className="fgp-border-line left"></div>
        <div className="fgp-border-line right"></div>
      </div>

      <div className="fgp-content">
        {/* Header */}
        <div className="fgp-header">
            <div className="fgp-icon-container">
                <img src={Logo} alt="SkillVerse" style={{ width: '60px', height: 'auto' }} />
            </div>
            <h1 className="fgp-title">Khôi phục mật khẩu</h1>
            <p className="fgp-subtitle">Khôi phục quyền truy cập tài khoản</p>
        </div>

        {error && (
            <div className="fgp-error-message">
                <AlertTriangle size={16} />
                <span>{error}</span>
            </div>
        )}

        <form onSubmit={handleSubmit} className="fgp-form">
                    <div className="fgp-field">
                        <label className="fgp-label">
                            <Mail size={14} />
                            <span>Địa chỉ email</span>
                        </label>
                        <div className="fgp-input-wrapper">
                            <input 
                                type="email" 
                                className="fgp-input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isLoading}
                                autoFocus
                            />
                        </div>
                    </div>

                    <button type="submit" className="fgp-submit-btn" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="fgp-spinner" size={18} />
                                <span>Đang gửi...</span>
                            </>
                        ) : (
                            <>
                                <span>Gửi yêu cầu khôi phục</span>
                            </>
                        )}
                        <div className="fgp-btn-glow"></div>
                    </button>
        </form>

        <div className="fgp-footer">
            <Link to="/login" className="fgp-back-link">
                <ArrowLeft size={16} />
                <span>Huỷ và quay lại đăng nhập</span>
            </Link>
        </div>
      </div>
      
      <div className="fgp-flicker"></div>
    </motion.div>
  );
};

export default HologramForgotPasswordForm;
