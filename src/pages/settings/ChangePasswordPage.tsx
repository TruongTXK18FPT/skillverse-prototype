import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock,
  Eye,
  EyeOff,
  Shield,
  CheckCircle,
  ArrowLeft,
  ShieldCheck,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import '../../styles/PasswordPages.css';

const ChangePasswordPage = () => {
  const { changePassword } = useAuth();
  const { showError } = useToast();
  const navigate = useNavigate();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Password strength indicator
  const getPasswordStrength = (password: string): { strength: number; label: string; color: string } => {
    if (!password) return { strength: 0, label: '', color: '' };
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    
    if (strength <= 2) return { strength: 1, label: 'Yếu', color: '#ef4444' };
    if (strength === 3) return { strength: 2, label: 'Trung bình', color: '#f59e0b' };
    if (strength === 4) return { strength: 3, label: 'Tốt', color: '#10b981' };
    return { strength: 4, label: 'Rất mạnh', color: '#059669' };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  // Validate form
  const validate = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!currentPassword) {
      newErrors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại';
    }
    
    if (!newPassword) {
      newErrors.newPassword = 'Vui lòng nhập mật khẩu mới';
    } else if (newPassword.length < 8) {
      newErrors.newPassword = 'Mật khẩu phải có ít nhất 8 ký tự';
    }
    
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu không khớp';
    }
    
    if (currentPassword && newPassword && currentPassword === newPassword) {
      newErrors.newPassword = 'Mật khẩu mới phải khác mật khẩu hiện tại';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setLoading(true);
    
    try {
      await changePassword({
        currentPassword,
        newPassword,
        confirmPassword
      });
      navigate('/login?reason=password_changed', { replace: true });
    } catch (error: unknown) {
      const errorMessage = (error as Error).message || 
        'Đổi mật khẩu thất bại. Vui lòng thử lại.';
      showError('Lỗi', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="cosmic-password-page">
      <div className="cosmic-password-card">
        {/* LEFT: Form */}
        <div className="cosmic-password-card__left">
          {/* Header */}
          <div className="cosmic-password-header">
            <div className="cosmic-password-header__icon-wrap">
              <Shield size={26} />
            </div>
            <h1 className="cosmic-password-header__title">Đổi Mật Khẩu</h1>
            <p className="cosmic-password-header__subtitle">
              Cập nhật mật khẩu để bảo mật tài khoản
            </p>
          </div>

          {/* Security Notice */}
          <div className="cosmic-password-banner">
            <AlertTriangle
              size={14}
              style={{ flexShrink: 0, marginTop: 2, color: "var(--cp-accent)" }}
            />
            <span>
              Sau khi đổi mật khẩu, bạn sẽ được đăng xuất và cần đăng nhập lại.
            </span>
          </div>

          <form onSubmit={handleSubmit} className="cosmic-password-form">
            {/* Current Password */}
            <div className="cosmic-password-form__group">
              <label
                htmlFor="currentPassword"
                className="cosmic-password-form__label"
              >
                <Lock size={12} />
                Mật khẩu hiện tại
              </label>
              <div
                className={`cosmic-password-form__input-wrap ${
                  errors.currentPassword
                    ? "cosmic-password-form__input-wrap--error"
                    : ""
                }`}
              >
                <Lock size={16} className="cosmic-password-form__input-icon" />
                <input
                  type={showCurrent ? "text" : "password"}
                  id="currentPassword"
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    if (errors.currentPassword) {
                      setErrors({ ...errors, currentPassword: "" });
                    }
                  }}
                  placeholder="Nhập mật khẩu hiện tại"
                  disabled={loading}
                  className="cosmic-password-form__input"
                />
                <button
                  type="button"
                  className="cosmic-password-form__toggle-btn"
                  onClick={() => setShowCurrent(!showCurrent)}
                  disabled={loading}
                >
                  {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.currentPassword && (
                <span className="cosmic-password-form__error">
                  {errors.currentPassword}
                </span>
              )}
            </div>

            {/* New Password */}
            <div className="cosmic-password-form__group">
              <label
                htmlFor="newPassword"
                className="cosmic-password-form__label"
              >
                <Lock size={12} />
                Mật khẩu mới
              </label>
              <div
                className={`cosmic-password-form__input-wrap ${
                  errors.newPassword
                    ? "cosmic-password-form__input-wrap--error"
                    : ""
                }`}
              >
                <Lock size={16} className="cosmic-password-form__input-icon" />
                <input
                  type={showNew ? "text" : "password"}
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (errors.newPassword) {
                      setErrors({ ...errors, newPassword: "" });
                    }
                  }}
                  placeholder="Tối thiểu 8 ký tự"
                  disabled={loading}
                  className="cosmic-password-form__input"
                />
                <button
                  type="button"
                  className="cosmic-password-form__toggle-btn"
                  onClick={() => setShowNew(!showNew)}
                  disabled={loading}
                >
                  {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.newPassword && (
                <span className="cosmic-password-form__error">
                  {errors.newPassword}
                </span>
              )}

              {/* Password Strength */}
              {newPassword && !errors.newPassword && (
                <div className="cosmic-password-form__strength">
                  <div className="cosmic-password-form__strength-bar">
                    <div
                      className="cosmic-password-form__strength-fill"
                      style={{
                        width: `${(passwordStrength.strength / 4) * 100}%`,
                        backgroundColor: passwordStrength.color,
                      }}
                    />
                  </div>
                  <span
                    className="cosmic-password-form__strength-label"
                    style={{ color: passwordStrength.color }}
                  >
                    {passwordStrength.label}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="cosmic-password-form__group">
              <label
                htmlFor="confirmPassword"
                className="cosmic-password-form__label"
              >
                <Lock size={12} />
                Xác nhận mật khẩu mới
              </label>
              <div
                className={`cosmic-password-form__input-wrap ${
                  errors.confirmPassword
                    ? "cosmic-password-form__input-wrap--error"
                    : ""
                }`}
              >
                <Lock size={16} className="cosmic-password-form__input-icon" />
                <input
                  type={showConfirm ? "text" : "password"}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword) {
                      setErrors({ ...errors, confirmPassword: "" });
                    }
                  }}
                  placeholder="Nhập lại mật khẩu"
                  disabled={loading}
                  className="cosmic-password-form__input"
                />
                <button
                  type="button"
                  className="cosmic-password-form__toggle-btn"
                  onClick={() => setShowConfirm(!showConfirm)}
                  disabled={loading}
                >
                  {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <span className="cosmic-password-form__error">
                  {errors.confirmPassword}
                </span>
              )}
              {confirmPassword &&
                newPassword === confirmPassword &&
                !errors.confirmPassword && (
                  <span className="cosmic-password-form__success">
                    <CheckCircle size={12} />
                    Mật khẩu khớp
                  </span>
                )}
            </div>

            <div className="cosmic-password-form__actions">
              <button
                type="button"
                className="cosmic-password-form__btn cosmic-password-form__btn--secondary"
                onClick={handleBack}
                disabled={loading}
              >
                <ArrowLeft size={14} />
                Quay lại
              </button>
              <button
                type="submit"
                className="cosmic-password-form__btn cosmic-password-form__btn--primary"
                disabled={loading}
              >
                {loading ? "Đang xử lý..." : "Đổi mật khẩu"}
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT: Info */}
        <div className="cosmic-password-card__right">
          <div className="cosmic-password-info-card">
            <h3 className="cosmic-password-info-card__title">Lưu ý</h3>

            <div className="cosmic-password-benefit">
              <AlertTriangle
                size={15}
                className="cosmic-password-benefit__icon"
                style={{ color: "var(--cp-accent)" }}
              />
              <div>
                <div className="cosmic-password-benefit__title">Đăng xuất sau khi đổi</div>
                <div className="cosmic-password-benefit__text">
                  Bạn cần đăng nhập lại bằng mật khẩu mới
                </div>
              </div>
            </div>

            <div className="cosmic-password-benefit">
              <ShieldCheck
                size={15}
                className="cosmic-password-benefit__icon"
              />
              <div>
                <div className="cosmic-password-benefit__title">
                  Bảo mật tài khoản
                </div>
                <div className="cosmic-password-benefit__text">
                  Mật khẩu mới giúp bảo vệ tài khoản tốt hơn
                </div>
              </div>
            </div>

            <div className="cosmic-password-benefit">
              <RefreshCw
                size={15}
                className="cosmic-password-benefit__icon"
              />
              <div>
                <div className="cosmic-password-benefit__title">Đổi định kỳ</div>
                <div className="cosmic-password-benefit__text">
                  Nên cập nhật mật khẩu mỗi 3-6 tháng
                </div>
              </div>
            </div>
          </div>

          <div className="cosmic-password-tips">
            <h4 className="cosmic-password-tips__title">Mẹo mật khẩu mạnh</h4>
            <ul className="cosmic-password-tips__list">
              <li className="cosmic-password-tips__item">Tối thiểu 8 ký tự</li>
              <li className="cosmic-password-tips__item">Kết hợp chữ hoa &amp; thường</li>
              <li className="cosmic-password-tips__item">Thêm số và ký tự đặc biệt</li>
              <li className="cosmic-password-tips__item">Không dùng thông tin cá nhân</li>
              <li className="cosmic-password-tips__item">Không dùng lại mật khẩu cũ</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordPage;
