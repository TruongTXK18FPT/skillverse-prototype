import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, User, Lock, Mail, Phone, MapPin, FileText, AlertTriangle } from 'lucide-react';
import { useElevator } from './ElevatorAuthLayout';
import Logo from '../../assets/skillverse.png';
import './HologramPersonalRegisterForm.css';

interface PersonalRegisterData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  bio: string;
  address: string;
  region: string;
}

interface HologramPersonalRegisterFormProps {
  onSubmit: (data: PersonalRegisterData) => Promise<{ success: boolean; userName?: string; error?: string }>;
  isLoading?: boolean;
}

const HologramPersonalRegisterForm: React.FC<HologramPersonalRegisterFormProps> = ({
  onSubmit,
  isLoading = false,
}) => {
  const { triggerLoginSuccess } = useElevator();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState<PersonalRegisterData>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    bio: '',
    address: '',
    region: 'Vietnam'
  });
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const validateForm = (): string | null => {
    if (!formData.fullName.trim()) return 'Vui lòng nhập họ tên';
    if (!formData.email.trim()) return 'Vui lòng nhập email';
    if (!/\S+@\S+\.\S+/.test(formData.email)) return 'Email không hợp lệ';
    if (!formData.password) return 'Vui lòng nhập mật khẩu';
    if (formData.password.length < 6) return 'Mật khẩu phải có ít nhất 6 ký tự';
    if (formData.password !== formData.confirmPassword) return 'Mật khẩu xác nhận không khớp';
    if (!formData.phone.trim()) return 'Vui lòng nhập số điện thoại';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    const result = await onSubmit(formData);

    if (result.success) {
      await triggerLoginSuccess(result.userName || formData.fullName.split(' ')[0]);
    } else if (result.error) {
      setError(result.error);
    }
  };

  return (
    <motion.div
      className="reg-personal-form-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Hologram Border Effect */}
      <div className="reg-personal-border">
        <div className="reg-personal-corner top-left"></div>
        <div className="reg-personal-corner top-right"></div>
        <div className="reg-personal-corner bottom-left"></div>
        <div className="reg-personal-corner bottom-right"></div>
        <div className="reg-personal-line top"></div>
        <div className="reg-personal-line bottom"></div>
        <div className="reg-personal-line left"></div>
        <div className="reg-personal-line right"></div>
      </div>

      {/* Form Content */}
      <div className="reg-personal-content">
        {/* Left Column - Header + Login Link */}
        <div className="reg-personal-left-column">
          {/* Header */}
          <div className="reg-personal-header">
            <motion.div
              className="reg-personal-logo-container"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <Link to="/" className="reg-personal-logo-link">
                <img src={Logo} alt="Skillverse" className="reg-personal-logo" />
                <div className="reg-personal-logo-glow"></div>
              </Link>
            </motion.div>

            <motion.div
              className="reg-personal-header-text"
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <h1 className="reg-personal-title">PERSONAL</h1>
              <p className="reg-personal-subtitle">REGISTRATION</p>
            </motion.div>

            <div className="reg-personal-decoration">
              <span className="reg-personal-deco-dot"></span>
              <span className="reg-personal-deco-line"></span>
              <span className="reg-personal-deco-dot"></span>
            </div>
          </div>

          {/* Login Link - In Left Column */}
          <div className="reg-personal-login-section">
            <p className="reg-personal-login-prompt">HAVE ACCOUNT?</p>
            <Link to="/login" className="reg-personal-login-link-btn">
              LOGIN
            </Link>
          </div>
        </div>

        {/* Right Column - Form */}
        <div className="reg-personal-right-column">
          {/* Error Message */}
          {error && (
            <motion.div
              className="reg-personal-error"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <AlertTriangle size={14} className="reg-personal-error-icon" />
              <span className="reg-personal-error-text">{error}</span>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="reg-personal-form">
          {/* Row 1: Full Name & Email */}
          <div className="reg-personal-field">
            <label className="reg-personal-label">
              <User size={14} />
              <span>FULL NAME</span>
            </label>
            <div className="reg-personal-input-wrapper">
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder="John Doe"
                disabled={isLoading}
                className="reg-personal-input"
                autoComplete="name"
              />
            </div>
          </div>

          <div className="reg-personal-field">
            <label className="reg-personal-label">
              <Mail size={14} />
              <span>EMAIL ADDRESS</span>
            </label>
            <div className="reg-personal-input-wrapper">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="john.doe@example.com"
                disabled={isLoading}
                className="reg-personal-input"
                autoComplete="email"
              />
            </div>
          </div>

          {/* Row 2: Password & Confirm Password */}
          <div className="reg-personal-field">
            <label className="reg-personal-label">
              <Lock size={14} />
              <span>PASSWORD</span>
            </label>
            <div className="reg-personal-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="••••••••"
                disabled={isLoading}
                className="reg-personal-input"
                autoComplete="new-password"
              />
              <button
                type="button"
                className="reg-personal-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="reg-personal-field">
            <label className="reg-personal-label">
              <Lock size={14} />
              <span>CONFIRM</span>
            </label>
            <div className="reg-personal-input-wrapper">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="••••••••"
                disabled={isLoading}
                className="reg-personal-input"
                autoComplete="new-password"
              />
              <button
                type="button"
                className="reg-personal-toggle-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Row 3: Phone & Region */}
          <div className="reg-personal-field">
            <label className="reg-personal-label">
              <Phone size={14} />
              <span>PHONE</span>
            </label>
            <div className="reg-personal-input-wrapper">
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+84 xxx xxx xxx"
                disabled={isLoading}
                className="reg-personal-input"
                autoComplete="tel"
              />
            </div>
          </div>

          <div className="reg-personal-field">
            <label className="reg-personal-label">
              <MapPin size={14} />
              <span>REGION</span>
            </label>
            <div className="reg-personal-input-wrapper">
              <select
                name="region"
                value={formData.region}
                onChange={handleInputChange}
                disabled={isLoading}
                className="reg-personal-input reg-personal-select"
              >
                <option value="Vietnam">Vietnam</option>
                <option value="Asia">Asia</option>
                <option value="Europe">Europe</option>
                <option value="America">America</option>
              </select>
            </div>
          </div>

          {/* Row 4: Address (Full Width) */}
          <div className="reg-personal-field reg-personal-field-full">
            <label className="reg-personal-label">
              <MapPin size={14} />
              <span>ADDRESS</span>
            </label>
            <div className="reg-personal-input-wrapper">
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="123 Main Street, District, City"
                disabled={isLoading}
                className="reg-personal-input"
                autoComplete="street-address"
              />
            </div>
          </div>

          {/* Row 5: Bio (Full Width) */}
          <div className="reg-personal-field reg-personal-field-full">
            <label className="reg-personal-label">
              <FileText size={14} />
              <span>BIO (OPTIONAL)</span>
            </label>
            <div className="reg-personal-input-wrapper">
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                placeholder="Tell us about yourself (optional)..."
                disabled={isLoading}
                className="reg-personal-input reg-personal-textarea"
                rows={2}
              />
            </div>
          </div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            className="reg-personal-submit-btn"
            disabled={isLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isLoading ? (
              <>
                <Loader2 className="reg-personal-spinner" size={18} />
                <span>REGISTERING...</span>
              </>
            ) : (
              <>
                <User size={18} />
                <span>REGISTER ACCOUNT</span>
              </>
            )}
            <div className="reg-personal-btn-glow"></div>
          </motion.button>
        </form>
        </div>
      </div>

      {/* Hologram Flicker Effect */}
      <div className="reg-personal-flicker"></div>
    </motion.div>
  );
};

export default HologramPersonalRegisterForm;
