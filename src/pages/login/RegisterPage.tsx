import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import '../../styles/AuthPages.css';
import { UserRegistrationRequest } from '../../data/userDTOs';
import { useToast } from '../../hooks/useToast';
import Toast from '../../components/Toast';

const RegisterPage = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { toast, isVisible, hideToast, showSuccess, showError } = useToast();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    bio: '',
    address: '',
    region: 'Vietnam'
  });
  
  // Removed province and district states as we're not using location features
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  // Removed province fetching as we're not using location features

  // Remove province/district fetching as we're not using them anymore

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Vui lòng nhập họ tên';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Vui lòng nhập email hợp lệ';
    }

    if (!formData.password) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Mật khẩu phải có ít nhất 8 ký tự';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu không khớp';
    }

    // Optional fields validation (only phone number format if provided)
    if (formData.phone && !/^\d{10,11}$/.test(formData.phone)) {
      newErrors.phone = 'Số điện thoại không hợp lệ (10-11 chữ số)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Prepare registration data matching backend UserRegistrationRequest
      const registrationData: UserRegistrationRequest = {
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        fullName: formData.fullName,
        phone: formData.phone || undefined,
        bio: formData.bio || undefined,
        address: formData.address || undefined,
        region: formData.region,
        // socialLinks is optional and not set here
      };

      console.log('Registration data:', registrationData);

      // Call register function from AuthContext
      const result = await register(registrationData);
      
      console.log('Registration result:', result);

      // Always show success toast first
      showSuccess(
        'Đăng ký thành công!',
        'Tài khoản của bạn đã được tạo. Đang chuyển hướng...',
        2
      );

      // Check if verification is required
      if (result.requiresVerification) {
        console.log('Verification required, navigating to verify-email');
        
        // Navigate to OTP verification page immediately
        setTimeout(() => {
          navigate('/verify-otp', { 
            state: { 
              email: result.email || formData.email,
              message: result.message || 'Vui lòng kiểm tra email và nhập mã xác thực để hoàn tất đăng ký.',
              requiresVerification: true,
              userType: 'user' // Add user type information for regular users
            }
          });
        }, 2000);
      } else {
        console.log('No verification required, navigating to login');
        
        // Navigate to login page
        setTimeout(() => {
          navigate('/login', {
            state: {
              message: 'Đăng ký thành công! Vui lòng đăng nhập.'
            }
          });
        }, 2000);
      }

    } catch (error: unknown) {
      console.error('Registration error:', error);
      const errorMessage = (error as Error).message || 'Đăng ký thất bại. Vui lòng thử lại.';
      showError(
        'Đăng ký thất bại',
        errorMessage
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  return (
    <div className="auth-container" data-theme={theme}>
      <div className="auth-content">
        <div className="auth-header">
          <button onClick={() => navigate(-1)} className="back-button">
            <ArrowLeft size={20} />
            <span>Quay lại</span>
          </button>
          <h1>Tạo Tài Khoản</h1>
          <p>Tham gia cộng đồng học viên và bắt đầu hành trình của bạn ngay hôm nay</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          
          <div className="form-grid">            {/* Full Name */}
            <div className="form-group">
              <label htmlFor="fullName">Họ và Tên</label>
              <div className="input-group">
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Nhập họ và tên của bạn"
                  className={errors.fullName ? 'error' : ''}
                />
              </div>
              {errors.fullName && <span className="error-message">{errors.fullName}</span>}
            </div>

            {/* Bio */}
            <div className="form-group">
              <label htmlFor="bio">Giới Thiệu Bản Thân (Tùy chọn)</label>
              <div className="input-group">
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Mô tả ngắn về bản thân..."
                  rows={3}
                  className={errors.bio ? 'error' : ''}
                />
              </div>
              {errors.bio && <span className="error-message">{errors.bio}</span>}
            </div>
            {/* Phone */}
            <div className="form-group">
              <label htmlFor="phone">Số Điện Thoại</label>
              <div className="input-group">
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Nhập số điện thoại"
                  className={errors.phone ? 'error' : ''}
                />
              </div>
              {errors.phone && <span className="error-message">{errors.phone}</span>}
            </div>

            {/* Email */}
            <div className="form-group">
              <label htmlFor="email">Địa Chỉ Email</label>
              <div className="input-group">
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Nhập email của bạn"
                  className={errors.email ? 'error' : ''}
                />
              </div>
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            {/* Address */}
            <div className="form-group">
              <label htmlFor="address">Địa Chỉ (Tùy chọn)</label>
              <div className="input-group">
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Nhập địa chỉ của bạn..."
                  className={errors.address ? 'error' : ''}
                />
              </div>
              {errors.address && <span className="error-message">{errors.address}</span>}
            </div>

            {/* Password Fields */}
            <div className="form-group">
              <label htmlFor="password">Mật Khẩu</label>
              <div className="input-group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Tạo mật khẩu"
                  className={errors.password ? 'error' : ''}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && <span className="error-message">{errors.password}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Xác Nhận Mật Khẩu</label>
              <div className="input-group">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Xác nhận mật khẩu"
                  className={errors.confirmPassword ? 'error' : ''}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
            </div>
          </div>

          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Đang xử lý...' : 'Tạo Tài Khoản'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Đã có tài khoản?</p>
          <Link to="/login" className="auth-link">
            Đăng nhập
          </Link>
        </div>
      </div>

      <div className="auth-background">
        <div className="auth-features">
          <h2>Tại Sao Chọn SkillVerse?</h2>
          <ul>
            <li>
              <div className="feature-icon">🎯</div>
              <div className="feature-text">
                <h3>Lộ Trình Học Tập Cá Nhân Hóa</h3>
                <p>Tùy chỉnh hành trình học tập dựa trên mục tiêu và sở thích của bạn</p>
              </div>
            </li>
            <li>
              <div className="feature-icon">👥</div>
              <div className="feature-text">
                <h3>Cộng Đồng Chuyên Gia</h3>
                <p>Kết nối với các chuyên gia trong ngành và đồng học viên</p>
              </div>
            </li>
            <li>
              <div className="feature-icon">🏆</div>
              <div className="feature-text">
                <h3>Chứng Chỉ Kỹ Năng</h3>
                <p>Nhận chứng chỉ để thể hiện thành tích của bạn</p>
              </div>
            </li>
            <li>
              <div className="feature-icon">💡</div>
              <div className="feature-text">
                <h3>Học Tập Tương Tác</h3>
                <p>Học thông qua các dự án thực hành và ứng dụng thực tế</p>
              </div>
            </li>
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
          showCountdown={toast.showCountdown}
          countdownText={toast.countdownText}
          actionButton={toast.actionButton}
        />
      )}
    </div>
  );
};

export default RegisterPage;
