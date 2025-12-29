import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, User, Lock, Mail, Phone, MapPin, AlertTriangle, ArrowRight, Loader } from 'lucide-react';
import MeowlKuruLoader from '../kuru-loader/MeowlKuruLoader';
import { useElevator } from './ElevatorAuthLayout';
import Logo from '../../assets/brand/skillverse.png';
import './HologramParentRegisterForm.css';

interface ParentRegisterData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  address: string;
  childEmail?: string;
}

interface HologramParentRegisterFormProps {
  onSubmit: (data: ParentRegisterData) => Promise<{ success: boolean; userName?: string; error?: string }>;
  isLoading?: boolean;
}

const HologramParentRegisterForm: React.FC<HologramParentRegisterFormProps> = ({
  onSubmit,
  isLoading = false,
}) => {
  const { triggerLoginSuccess } = useElevator();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [formData, setFormData] = useState<ParentRegisterData>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
    childEmail: '',
  });
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const validateForm = (): string | null => {
    if (!formData.fullName.trim()) return 'Vui lòng nhập họ tên';
    if (!formData.email.trim()) return 'Vui lòng nhập email';
    if (!/\S+@\S+\.\S+/.test(formData.email)) return 'Email không hợp lệ';
    if (!formData.password) return 'Vui lòng nhập mật khẩu';
    
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      return 'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt';
    }
    
    if (formData.password !== formData.confirmPassword) return 'Mật khẩu xác nhận không khớp';
    if (!formData.phone.trim()) return 'Vui lòng nhập số điện thoại';
    if (formData.childEmail && !/\S+@\S+\.\S+/.test(formData.childEmail)) return 'Email con cái không hợp lệ';
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
    <div className="reg-parent-form-container">
      {/* Hologram Borders */}
      <div className="reg-parent-border">
        <div className="reg-parent-corner top-left"></div>
        <div className="reg-parent-corner top-right"></div>
        <div className="reg-parent-corner bottom-left"></div>
        <div className="reg-parent-corner bottom-right"></div>
        <div className="reg-parent-line top"></div>
        <div className="reg-parent-line bottom"></div>
        <div className="reg-parent-line left"></div>
        <div className="reg-parent-line right"></div>
      </div>

      <div className="reg-parent-content">
        {/* Left Column: Header + Decoration */}
        <div className="reg-parent-left-column">
          <div className="reg-parent-header">
            <Link to="/" className="reg-parent-logo-container">
              <div className="reg-parent-logo-glow"></div>
              <img src={Logo} alt="SkillVerse" className="reg-parent-logo" />
            </Link>
            
            <div className="reg-parent-header-text">
              <h2 className="reg-parent-title">PHỤ HUYNH</h2>
              <p className="reg-parent-subtitle">CỔNG TRUY CẬP</p>
            </div>

            <div className="reg-parent-decoration">
              <div className="reg-parent-deco-line"></div>
              <div className="reg-parent-deco-dot"></div>
              <div className="reg-parent-deco-line"></div>
            </div>
          </div>

          {/* Login Link (Bottom Left) */}
          <div className="reg-parent-login-section">
             <p style={{ fontSize: '0.6rem', color: 'rgba(243, 232, 255, 0.6)', marginBottom: '0.5rem', letterSpacing: '1px' }}>
                ĐÃ CÓ TÀI KHOẢN?
             </p>
             <Link to="/login" className="reg-parent-login-link-btn">
                ĐĂNG NHẬP
             </Link>
          </div>
        </div>

        {/* Right Column: Form */}
        <div className="reg-parent-right-column">
          {isLoading && (
            <div className="loading-overlay">
              <MeowlKuruLoader />
            </div>
          )}

          <form onSubmit={handleSubmit} className="reg-parent-form">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="reg-parent-error"
                  style={{ gridColumn: '1 / -1' }}
                >
                  <AlertTriangle size={16} className="reg-parent-error-icon" />
                  <span className="reg-parent-error-text">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="reg-parent-field reg-parent-field-full">
              <label className="reg-parent-label">
                <User size={12} /> HỌ VÀ TÊN
              </label>
              <div className="reg-parent-input-wrapper">
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="reg-parent-input"
                />
              </div>
            </div>

            <div className="reg-parent-field reg-parent-field-full">
              <label className="reg-parent-label">
                <Mail size={12} /> ĐỊA CHỈ EMAIL
              </label>
              <div className="reg-parent-input-wrapper">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="reg-parent-input"
                />
              </div>
            </div>

            <div className="reg-parent-field">
              <label className="reg-parent-label">
                <Phone size={12} /> SỐ ĐIỆN THOẠI
              </label>
              <div className="reg-parent-input-wrapper">
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="reg-parent-input"
                />
              </div>
            </div>

            <div className="reg-parent-field">
              <label className="reg-parent-label">
                <MapPin size={12} /> ĐỊA CHỈ
              </label>
              <div className="reg-parent-input-wrapper">
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="reg-parent-input"
                />
              </div>
            </div>

            <div className="reg-parent-field reg-parent-field-full">
              <label className="reg-parent-label">
                <User size={12} /> EMAIL CỦA CON (NẾU CÓ)
              </label>
              <div className="reg-parent-input-wrapper">
                <input
                  type="email"
                  name="childEmail"
                  value={formData.childEmail}
                  onChange={handleInputChange}
                  className="reg-parent-input"
                  placeholder="Nhập email tài khoản con của bạn"
                />
              </div>
              {formData.childEmail && (
                <div style={{ fontSize: '0.65rem', color: '#9ca3af', marginTop: '0.25rem', fontStyle: 'italic' }}>
                  * Một email xác nhận sẽ được gửi đến tài khoản của con bạn để thiết lập liên kết phụ huynh.
                </div>
              )}
            </div>

            <div className="reg-parent-field">
              <label className="reg-parent-label">
                <Lock size={12} /> MẬT KHẨU
              </label>
              <div className="reg-parent-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  onFocus={() => setIsPasswordFocused(true)}
                  onBlur={() => setIsPasswordFocused(false)}
                  className="reg-parent-input"
                />
                <button
                  type="button"
                  className="reg-parent-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              
              <AnimatePresence>
              {(isPasswordFocused || (formData.password && formData.password.length > 0 && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(formData.password))) && (
                <motion.div
                  className="reg-parent-password-hint"
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: '0.5rem' }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  style={{ overflow: 'hidden' }}
                >
                  <p>Yêu cầu mật khẩu:</p>
                  <ul>
                    <li style={{ color: formData.password.length >= 8 ? '#10b981' : '#94a3b8' }}>
                      • Ít nhất 8 ký tự
                    </li>
                    <li style={{ color: /[A-Z]/.test(formData.password) ? '#10b981' : '#94a3b8' }}>
                      • 1 chữ viết hoa
                    </li>
                    <li style={{ color: /[a-z]/.test(formData.password) ? '#10b981' : '#94a3b8' }}>
                      • 1 chữ thường
                    </li>
                    <li style={{ color: /\d/.test(formData.password) ? '#10b981' : '#94a3b8' }}>
                      • 1 số
                    </li>
                    <li style={{ color: /[^A-Za-z0-9]/.test(formData.password) ? '#10b981' : '#94a3b8' }}>
                      • 1 ký tự đặc biệt
                    </li>
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
            </div>

            <div className="reg-parent-field">
              <label className="reg-parent-label">
                <Lock size={12} /> XÁC NHẬN MẬT KHẨU
              </label>
              <div className="reg-parent-input-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="reg-parent-input"
                />
                <button
                  type="button"
                  className="reg-parent-toggle-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="reg-parent-submit-btn"
              disabled={isLoading}
            >
              <div className="reg-parent-btn-glow"></div>
              {isLoading ? (
                <Loader size={16} className="reg-parent-spinner" />
              ) : (
                <>
                  KHỞI TẠO HỒ SƠ PHỤ HUYNH <ArrowRight size={16} />
                </>
              )}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
};

export default HologramParentRegisterForm;
