import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, User, Lock, Mail, AlertTriangle } from 'lucide-react';
import { useElevator } from './ElevatorAuthLayout';
import Logo from '../../assets/skillverse.png';
import './HologramLoginForm.css';

interface HologramLoginFormProps {
  onSubmit: (email: string, password: string) => Promise<{ success: boolean; userName?: string; error?: string }>;
  onGoogleLogin?: () => void;
  isLoading?: boolean;
  isGoogleLoading?: boolean;
  googleLoginSuccess?: { userName: string } | null;
}

const HologramLoginForm: React.FC<HologramLoginFormProps> = ({
  onSubmit,
  onGoogleLogin,
  isLoading = false,
  isGoogleLoading = false,
  googleLoginSuccess = null,
}) => {
  const { triggerLoginSuccess } = useElevator();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState<string | null>(null);

  // Handle Google login success
  React.useEffect(() => {
    if (googleLoginSuccess) {
      triggerLoginSuccess(googleLoginSuccess.userName);
    }
  }, [googleLoginSuccess, triggerLoginSuccess]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      setError('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    const result = await onSubmit(formData.email, formData.password);

    if (result.success) {
      await triggerLoginSuccess(result.userName || 'Commander');
    } else if (result.error) {
      setError(result.error);
    }
  };

  return (
    <motion.div
      className="hologram-form-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Hologram Border Effect */}
      <div className="hologram-border">
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
      <div className="hologram-content">
        {/* Left Column - Header + Register */}
        <div className="hologram-left-column">
          {/* Header */}
          <div className="hologram-header">
            <motion.div
              className="logo-container"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <Link to="/" className="logo-link">
                <img src={Logo} alt="Skillverse" className="hologram-logo" />
                <div className="logo-glow"></div>
              </Link>
            </motion.div>

            <motion.div
              className="header-text"
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <h1 className="hologram-title">AUTHENTICATION</h1>
              <p className="hologram-subtitle">IDENTIFY YOURSELF, OPERATOR</p>
            </motion.div>

            <div className="header-decoration">
              <span className="holo-deco-dot"></span>
              <span className="holo-deco-line"></span>
              <span className="holo-deco-dot"></span>
            </div>
          </div>

          {/* Register Links - In Left Column */}
          <div className="register-section">
            <p className="holo-register-prompt">NEW OPERATOR?</p>
            <div className="register-buttons">
              <Link to="/choose-role" className="register-btn personal" style={{ width: '100%' }}>
                <span className="btn-icon">🚀</span>
                <span>Đăng ký vai trò của bạn</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column - Form */}
        <div className="hologram-right-column">
          {/* Error Message */}
          {error && (
            <motion.div
              className="hologram-error"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <AlertTriangle size={8} className="hologram-error-icon" />
              <span className="hologram-error-text">{error}</span>
            </motion.div>
          )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="hologram-form">
          <div className="form-field">
            <label className="field-label">
              <Mail size={16} />
              <span className='hologram-subtitle'>EMAIL ADDRESS</span>
            </label>
            <div className="field-input-wrapper">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={isLoading}
                className="hologram-field-input"
                autoComplete="email"
              />
              <div className="input-glow"></div>
            </div>
          </div>

          <div className="form-field">
            <label className="field-label">
              <Lock size={16} />
              <span className='hologram-subtitle'>ACCESS CODE</span>
            </label>
            <div className="field-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                disabled={isLoading}
                className="hologram-field-input"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="hologram-password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              <div className="input-glow"></div>
            </div>
          </div>

          <div className="form-options">
            <label className="remember-option">
              <input type="checkbox" disabled={isLoading} />
              <span className="checkbox-custom"></span>
              <span>REMEMBER ACCESS</span>
            </label>
            <Link to="/forgot-password" className="forgot-link">
              FORGOT CODE?
            </Link>
          </div>

          <motion.button
            type="submit"
            className="submit-button"
            disabled={isLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isLoading ? (
              <>
                <Loader2 className="spinner" size={20} />
                <span>AUTHENTICATING...</span>
              </>
            ) : (
              <>
                <User size={20} />
                <span>INITIATE ACCESS</span>
              </>
            )}
            <div className="button-glow"></div>
          </motion.button>
        </form>

        {/* Divider */}
        <div className="hologram-divider">
          <span className="divider-line"></span>
          <span className="divider-text">ALTERNATE ACCESS</span>
          <span className="divider-line"></span>
        </div>

        {/* Social Login */}
        <div className="social-buttons">
          <motion.button
            type="button"
            className="social-btn google"
            onClick={onGoogleLogin}
            disabled={isLoading || isGoogleLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isGoogleLoading ? (
              <Loader2 className="spinner" size={18} />
            ) : (
              <img
                src="https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png"
                alt="Google"
                className="social-icon"
              />
            )}
            <span>GOOGLE PROTOCOL</span>
          </motion.button>

          </div>
        </div>
      </div>

      {/* Hologram Flicker Effect */}
      <div className="hologram-flicker"></div>
    </motion.div>
  );
};

export default HologramLoginForm;