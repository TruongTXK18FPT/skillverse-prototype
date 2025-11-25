import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle, Info, Shield, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import Toast from '../../components/Toast';
import '../../styles/PasswordPages.css';

const SetPasswordPage = () => {
  const { user, setPassword } = useAuth();
  const { toast, isVisible, hideToast, showSuccess, showError } = useToast();
  const navigate = useNavigate();
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Check if user is Google user without password
  const canSetPassword = user?.authProvider === 'GOOGLE' && !user?.googleLinked;

  const validate = () => {
    const newErrors: {[key: string]: string} = {};
    
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
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setLoading(true);
    
    try {
      const response = await setPassword({ newPassword, confirmPassword });
      
      // Update user in localStorage to reflect password has been set
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        userData.googleLinked = true; // Mark as having password
        localStorage.setItem('user', JSON.stringify(userData));
      }
      
      showSuccess(
        'Thành công!',
        response.message,
        5
      );
      
      setTimeout(() => {
        // Reload page to refresh AuthContext with updated user data
        window.location.href = '/profile/user';
      }, 2000);
      
    } catch (error: unknown) {
      const errorMessage = (error as Error).message || 
        'Đặt mật khẩu thất bại. Vui lòng thử lại.';
      showError('Lỗi', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    navigate('/dashboard');
  };

  if (!canSetPassword) {
    return (
      <div className="password-page">
        <div className="password-page__card">
          <div className="password-page__alert password-page__alert--info">
            <Info size={24} />
            <div>
              <h3 className="password-page__alert-title">Không khả dụng</h3>
              <p className="password-page__alert-text">
                Chức năng này chỉ dành cho người dùng đăng nhập bằng Google lần đầu 
                và chưa thiết lập mật khẩu dự phòng.
              </p>
              <button className="password-page__alert-btn" onClick={() => navigate('/dashboard')}>
                Quay lại Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="password-page">
      <div className="password-page__card">
        {/* Header with Optional Badge */}
        <div className="password-page__header">
          <div className="password-page__icon-wrapper">
            <Shield size={48} />
          </div>
          <h1 className="password-page__title">
            Đặt Mật Khẩu Dự Phòng
            <span className="password-page__badge--optional">Không bắt buộc</span>
          </h1>
          <p className="password-page__subtitle">
            Tạo mật khẩu để có thể đăng nhập bằng email khi Google OAuth không khả dụng
          </p>
        </div>

        {/* Info Banner */}
        <div className="password-page__info-banner">
          <Info size={20} />
          <div>
            <strong>Lưu ý:</strong> Đây là tính năng tùy chọn. Bạn vẫn có thể tiếp tục 
            sử dụng Google để đăng nhập mà không cần đặt mật khẩu.
          </div>
        </div>

        <form onSubmit={handleSubmit} className="password-form">
          {/* New Password */}
          <div className="password-form__group">
            <label htmlFor="newPassword" className="password-form__label">
              Mật khẩu mới
            </label>
            <div className={`password-form__input-group ${errors.newPassword ? 'password-form__input-group--error' : ''}`}>
              <Lock size={20} className="password-form__input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                id="newPassword"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (errors.newPassword) {
                    setErrors({...errors, newPassword: ''});
                  }
                }}
                placeholder="Nhập mật khẩu mới (tối thiểu 8 ký tự)"
                className="password-form__input"
              />
              <button
                type="button"
                className="password-form__toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.newPassword && (
              <span className="password-form__error-msg">{errors.newPassword}</span>
            )}
          </div>

          {/* Confirm Password */}
          <div className="password-form__group">
            <label htmlFor="confirmPassword" className="password-form__label">
              Xác nhận mật khẩu
            </label>
            <div className={`password-form__input-group ${errors.confirmPassword ? 'password-form__input-group--error' : ''}`}>
              <Lock size={20} className="password-form__input-icon" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) {
                    setErrors({...errors, confirmPassword: ''});
                  }
                }}
                placeholder="Nhập lại mật khẩu"
                className="password-form__input"
              />
              <button
                type="button"
                className="password-form__toggle-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <span className="password-form__error-msg">{errors.confirmPassword}</span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="password-form__actions">
            <button 
              type="button" 
              className="password-form__btn password-form__btn--secondary"
              onClick={handleSkip}
              disabled={loading}
            >
              <X size={16} />
              Bỏ qua
            </button>
            <button 
              type="submit" 
              className="password-form__btn password-form__btn--primary"
              disabled={loading}
            >
              {loading ? 'Đang xử lý...' : 'Đặt Mật Khẩu'}
            </button>
          </div>
        </form>

        {/* Benefits Section */}
        <div className="password-page__benefits">
          <h3 className="password-page__benefits-title">🎯 Lợi ích khi đặt mật khẩu:</h3>
          <div className="password-page__benefits-grid">
            <div className="password-page__benefit-item">
              <CheckCircle size={20} className="password-page__benefit-icon" />
              <div>
                <h4 className="password-page__benefit-title">Đăng nhập linh hoạt</h4>
                <p className="password-page__benefit-text">Sử dụng cả Google và email+password</p>
              </div>
            </div>
            <div className="password-page__benefit-item">
              <CheckCircle size={20} className="password-page__benefit-icon" />
              <div>
                <h4 className="password-page__benefit-title">Backup an toàn</h4>
                <p className="password-page__benefit-text">Truy cập tài khoản khi Google lỗi</p>
              </div>
            </div>
            <div className="password-page__benefit-item">
              <CheckCircle size={20} className="password-page__benefit-icon" />
              <div>
                <h4 className="password-page__benefit-title">Bảo mật kép</h4>
                <p className="password-page__benefit-text">Tăng cường bảo vệ tài khoản</p>
              </div>
            </div>
            <div className="password-page__benefit-item">
              <CheckCircle size={20} className="password-page__benefit-icon" />
              <div>
                <h4 className="password-page__benefit-title">Không giới hạn</h4>
                <p className="password-page__benefit-text">Không phụ thuộc vào dịch vụ bên thứ ba</p>
              </div>
            </div>
          </div>
        </div>

        {/* Security Tips */}
        <div className="password-page__security-tips">
          <h4 className="password-page__tips-title">💡 Mẹo tạo mật khẩu mạnh:</h4>
          <ul className="password-page__tips-list">
            <li className="password-page__tip-item">Sử dụng ít nhất 8 ký tự</li>
            <li className="password-page__tip-item">Kết hợp chữ hoa, chữ thường, số và ký tự đặc biệt</li>
            <li className="password-page__tip-item">Không sử dụng thông tin cá nhân dễ đoán</li>
            <li className="password-page__tip-item">Không dùng mật khẩu giống với tài khoản khác</li>
          </ul>
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

export default SetPasswordPage;
