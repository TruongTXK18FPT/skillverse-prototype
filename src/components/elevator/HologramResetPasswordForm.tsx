import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Logo from '../../assets/skillverse.png';
import './HologramResetPasswordForm.css';

interface LocationState {
  email: string;
  otp: string;
}

const HologramResetPasswordForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { resetPassword } = useAuth();
  
  const state = location.state as LocationState;
  const email = state?.email || '';
  const otp = state?.otp || '';
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Redirect if no email/otp
  useEffect(() => {
    if (!email || !otp) {
      navigate('/forgot-password', { replace: true });
    }
  }, [email, otp, navigate]);

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return 'Mật khẩu phải có ít nhất 8 ký tự';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Mật khẩu phải chứa ít nhất 1 chữ hoa';
    }
    if (!/[a-z]/.test(password)) {
      return 'Mật khẩu phải chứa ít nhất 1 chữ thường';
    }
    if (!/\d/.test(password)) {
      return 'Mật khẩu phải chứa ít nhất 1 chữ số';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    setIsLoading(true);

    try {
      await resetPassword({ email, otp, newPassword, confirmPassword });
      setSuccess(true);
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login', {
          state: {
            message: 'Đặt lại mật khẩu thành công! Vui lòng đăng nhập.',
            email
          }
        });
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <motion.div 
        className="rsp-wrapper"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="rsp-border">
          <div className="rsp-border-corner top-left"></div>
          <div className="rsp-border-corner top-right"></div>
          <div className="rsp-border-corner bottom-left"></div>
          <div className="rsp-border-corner bottom-right"></div>
          <div className="rsp-border-line top"></div>
          <div className="rsp-border-line bottom"></div>
          <div className="rsp-border-line left"></div>
          <div className="rsp-border-line right"></div>
        </div>

        <div className="rsp-content">
          <div className="rsp-success-icon">
            <CheckCircle size={64} />
          </div>
          <h2 className="rsp-success-title">ĐẶT LẠI MẬT KHẨU THÀNH CÔNG</h2>
          <p className="rsp-success-text">
            Đang chuyển hướng đến trang đăng nhập...
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="rsp-wrapper"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Borders */}
      <div className="rsp-border">
        <div className="rsp-border-corner top-left"></div>
        <div className="rsp-border-corner top-right"></div>
        <div className="rsp-border-corner bottom-left"></div>
        <div className="rsp-border-corner bottom-right"></div>
        <div className="rsp-border-line top"></div>
        <div className="rsp-border-line bottom"></div>
        <div className="rsp-border-line left"></div>
        <div className="rsp-border-line right"></div>
      </div>

      <div className="rsp-content">
        {/* Header */}
        <div className="rsp-header">
          <div className="rsp-logo-container">
            <img src={Logo} alt="SkillVerse" className="rsp-logo" />
          </div>
          <div className="rsp-icon-container">
            <Lock size={48} />
          </div>
          <h1 className="rsp-title">ĐẶT LẠI MẬT KHẨU</h1>
          <p className="rsp-subtitle">
            Tạo mật khẩu mới cho <span className="rsp-email">{email}</span>
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="rsp-form">
          {/* Error Alert */}
          {error && (
            <motion.div 
              className="rsp-alert rsp-alert--error"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <AlertTriangle size={20} />
              <span>{error}</span>
            </motion.div>
          )}

          {/* New Password */}
          <div className="rsp-input-group">
            <label htmlFor="newPassword" className="rsp-label">
              <Lock size={16} />
              <span>MẬT KHẨU MỚI</span>
            </label>
            <div className="rsp-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="rsp-input"
                placeholder="Nhập mật khẩu mới (tối thiểu 8 ký tự)"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="rsp-toggle-btn"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="rsp-input-group">
            <label htmlFor="confirmPassword" className="rsp-label">
              <Lock size={16} />
              <span>XÁC NHẬN MẬT KHẨU</span>
            </label>
            <div className="rsp-input-wrapper">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="rsp-input"
                placeholder="Nhập lại mật khẩu mới"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="rsp-toggle-btn"
                disabled={isLoading}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Password Requirements */}
          <div className="rsp-requirements">
            <div className="rsp-requirements-title">YÊU CẦU MẬT KHẨU:</div>
            <div className="rsp-requirements-list">
              <div className={`rsp-requirement ${newPassword.length >= 8 ? 'rsp-requirement--met' : ''}`}>
                <CheckCircle size={14} />
                <span>Tối thiểu 8 ký tự</span>
              </div>
              <div className={`rsp-requirement ${/[A-Z]/.test(newPassword) ? 'rsp-requirement--met' : ''}`}>
                <CheckCircle size={14} />
                <span>Chữ hoa (A-Z)</span>
              </div>
              <div className={`rsp-requirement ${/[a-z]/.test(newPassword) ? 'rsp-requirement--met' : ''}`}>
                <CheckCircle size={14} />
                <span>Chữ thường (a-z)</span>
              </div>
              <div className={`rsp-requirement ${/\d/.test(newPassword) ? 'rsp-requirement--met' : ''}`}>
                <CheckCircle size={14} />
                <span>Chữ số (0-9)</span>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            className="rsp-submit-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 size={20} className="rsp-spinner" />
                <span>ĐANG XỬ LÝ...</span>
              </>
            ) : (
              <span>ĐẶT LẠI MẬT KHẨU</span>
            )}
          </button>
        </form>
      </div>
    </motion.div>
  );
};

export default HologramResetPasswordForm;
