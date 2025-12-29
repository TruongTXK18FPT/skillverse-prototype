import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, Shield, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import Toast from '../../components/shared/Toast';
import '../../styles/PasswordPages.css';

const ChangePasswordPage = () => {
  const { user, changePassword } = useAuth();
  const { toast, isVisible, hideToast, showSuccess, showError } = useToast();
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
      const response = await changePassword({
        currentPassword,
        newPassword,
        confirmPassword
      });
      
      showSuccess(
        'Thành công!',
        response.message,
        5
      );
      
      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      setTimeout(() => {
        navigate('/profile');
      }, 2000);
      
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
    <div className="password-page">
      <div className="password-page__card">
        {/* Back Button */}
        <button className="password-page__back-btn" onClick={handleBack}>
          <ArrowLeft size={20} />
          <span>Quay lại</span>
        </button>

        {/* Header */}
        <div className="password-page__header">
          <div className="password-page__icon-wrapper">
            <Shield size={48} />
          </div>
          <h1 className="password-page__title">Đổi Mật Khẩu</h1>
          <p className="password-page__subtitle">
            Cập nhật mật khẩu của bạn để bảo mật tài khoản
          </p>
        </div>

        {/* Security Notice */}
        <div className="password-page__security-notice">
          <AlertCircle size={20} />
          <div>
            <strong>Lưu ý bảo mật:</strong> Sau khi đổi mật khẩu, bạn sẽ cần sử dụng 
            mật khẩu mới để đăng nhập vào tất cả các thiết bị.
          </div>
        </div>

        <form onSubmit={handleSubmit} className="password-form">
          {/* Current Password */}
          <div className="password-form__group">
            <label htmlFor="currentPassword" className="password-form__label">
              Mật khẩu hiện tại <span className="password-form__required-mark">*</span>
            </label>
            <div className={`password-form__input-group ${errors.currentPassword ? 'password-form__input-group--error' : ''}`}>
              <Lock size={20} className="password-form__input-icon" />
              <input
                type={showCurrent ? 'text' : 'password'}
                id="currentPassword"
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  if (errors.currentPassword) {
                    setErrors({...errors, currentPassword: ''});
                  }
                }}
                placeholder="Nhập mật khẩu hiện tại"
                disabled={loading}
                className="password-form__input"
              />
              <button
                type="button"
                className="password-form__toggle-btn"
                onClick={() => setShowCurrent(!showCurrent)}
                disabled={loading}
              >
                {showCurrent ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.currentPassword && (
              <span className="password-form__error-msg">{errors.currentPassword}</span>
            )}
          </div>

          {/* New Password */}
          <div className="password-form__group">
            <label htmlFor="newPassword" className="password-form__label">
              Mật khẩu mới <span className="password-form__required-mark">*</span>
            </label>
            <div className={`password-form__input-group ${errors.newPassword ? 'password-form__input-group--error' : ''}`}>
              <Lock size={20} className="password-form__input-icon" />
              <input
                type={showNew ? 'text' : 'password'}
                id="newPassword"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (errors.newPassword) {
                    setErrors({...errors, newPassword: ''});
                  }
                }}
                placeholder="Nhập mật khẩu mới (tối thiểu 8 ký tự)"
                disabled={loading}
                className="password-form__input"
              />
              <button
                type="button"
                className="password-form__toggle-btn"
                onClick={() => setShowNew(!showNew)}
                disabled={loading}
              >
                {showNew ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.newPassword && (
              <span className="password-form__error-msg">{errors.newPassword}</span>
            )}
            
            {/* Password Strength Indicator */}
            {newPassword && !errors.newPassword && (
              <div className="password-form__strength-indicator">
                <div className="password-form__strength-bar">
                  <div 
                    className="password-form__strength-fill"
                    style={{ 
                      width: `${(passwordStrength.strength / 4) * 100}%`,
                      backgroundColor: passwordStrength.color
                    }}
                  />
                </div>
                <span 
                  className="password-form__strength-label"
                  style={{ color: passwordStrength.color }}
                >
                  {passwordStrength.label}
                </span>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="password-form__group">
            <label htmlFor="confirmPassword" className="password-form__label">
              Xác nhận mật khẩu mới <span className="password-form__required-mark">*</span>
            </label>
            <div className={`password-form__input-group ${errors.confirmPassword ? 'password-form__input-group--error' : ''}`}>
              <Lock size={20} className="password-form__input-icon" />
              <input
                type={showConfirm ? 'text' : 'password'}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) {
                    setErrors({...errors, confirmPassword: ''});
                  }
                }}
                placeholder="Nhập lại mật khẩu mới"
                disabled={loading}
                className="password-form__input"
              />
              <button
                type="button"
                className="password-form__toggle-btn"
                onClick={() => setShowConfirm(!showConfirm)}
                disabled={loading}
              >
                {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <span className="password-form__error-msg">{errors.confirmPassword}</span>
            )}
            {confirmPassword && newPassword === confirmPassword && !errors.confirmPassword && (
              <span className="password-form__success-msg">
                <CheckCircle size={16} /> Mật khẩu khớp
              </span>
            )}
          </div>

          <button 
            type="submit" 
            className="password-form__submit-btn"
            disabled={loading}
          >
            {loading ? 'Đang xử lý...' : 'Đổi Mật Khẩu'}
          </button>
        </form>

        {/* Security Tips */}
        <div className="password-page__security-tips">
          <h3 className="password-page__tips-title">💡 Mẹo tạo mật khẩu mạnh:</h3>
          <div className="password-page__tips-grid">
            <div className="password-page__tip-grid-item">
              <CheckCircle size={16} className="password-page__tip-icon" />
              <span>Sử dụng ít nhất 8 ký tự</span>
            </div>
            <div className="password-page__tip-grid-item">
              <CheckCircle size={16} className="password-page__tip-icon" />
              <span>Kết hợp chữ hoa và chữ thường</span>
            </div>
            <div className="password-page__tip-grid-item">
              <CheckCircle size={16} className="password-page__tip-icon" />
              <span>Thêm số và ký tự đặc biệt</span>
            </div>
            <div className="password-page__tip-grid-item">
              <CheckCircle size={16} className="password-page__tip-icon" />
              <span>Không dùng thông tin cá nhân</span>
            </div>
            <div className="password-page__tip-grid-item">
              <CheckCircle size={16} className="password-page__tip-icon" />
              <span>Không dùng lại mật khẩu cũ</span>
            </div>
            <div className="password-page__tip-grid-item">
              <CheckCircle size={16} className="password-page__tip-icon" />
              <span>Đổi mật khẩu định kỳ 3-6 tháng</span>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="password-page__additional-info">
          <p className="password-page__info-text">
            <strong>Quên mật khẩu hiện tại?</strong> Bạn có thể sử dụng chức năng 
            <a href="/forgot-password" className="password-page__info-link"> Quên mật khẩu</a> để đặt lại.
          </p>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <Toast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          isVisible={isVisible}
          onClose={hideToast}
          autoCloseDelay={toast.autoCloseDelay}
        />
      )}
    </div>
  );
};

export default ChangePasswordPage;
