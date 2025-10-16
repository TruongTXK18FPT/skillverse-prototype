import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';
import Logo from '../../assets/skillverse.png';
import { useToast } from '../../hooks/useToast';
import Toast from '../../components/Toast';
import '../../styles/LoginPage.css';

const LoginPage = () => {
  const { theme } = useTheme();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast, isVisible, hideToast, showSuccess, showError } = useToast();
  
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Handle success message from other pages (like email verification)
  useEffect(() => {
    const state = location.state as { message?: string } | null;
    if (state?.message) {
      showSuccess('Thành công!', state.message);
      // Clear the state to prevent showing the message on refresh
      navigate('/login', { replace: true });
    }
  }, [location.state, navigate, showSuccess]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear any existing toasts when user starts typing
    // Toast will auto-close so no need to manually clear
  };

  // Google login handler
  const handleGoogleLogin = useGoogleLogin({
    // Use redirect flow to avoid COOP warnings (optional)
    // flow: 'auth-code', // Uncomment to use redirect instead of popup
    
    onSuccess: async (tokenResponse) => {
      setIsGoogleLoading(true);
      try {
        console.log('Google login successful, token received:', tokenResponse);
        
        // Use access_token to get user info, then send to backend
        // Backend will create/login user based on Google email
        const result = await authService.loginWithGoogle(tokenResponse.access_token);
        
        console.log('Backend authentication successful');
        console.log('Google login response:', result);
        
        // Show success toast
        showSuccess(
          'Đăng nhập thành công!',
          'Chào mừng bạn! Đang chuyển hướng...',
          2
        );
        
        // ✅ CRITICAL FIX: Force full page reload to ensure AuthContext updates
        // This is necessary because:
        // 1. Google login saves tokens to localStorage
        // 2. AuthContext needs to re-initialize from localStorage
        // 3. Direct navigation causes race condition (ProtectedRoute checks before AuthContext loads)
        // 4. Full reload ensures AuthContext useEffect runs and loads user data
        
        setTimeout(() => {
          if (result.needsProfileCompletion) {
            // New user: redirect to profile page
            window.location.href = '/profile';
          } else {
            // Existing user: redirect to role-specific page
            const urlPath = new URL(result.redirectUrl).pathname;
            window.location.href = urlPath;
          }
        }, 2000);
        
      } catch (error) {
        console.error('Google login error:', error);
        
        // ✅ SECURITY: Don't expose sensitive error details to users
        let userMessage = 'Đăng nhập Google thất bại. Vui lòng thử lại.';
        
        if (error instanceof Error) {
          // Only show safe error messages
          if (error.message.includes('USER accounts')) {
            userMessage = 'Tài khoản này không thể đăng nhập bằng Google. Vui lòng dùng email/password.';
          } else if (error.message.includes('not active')) {
            userMessage = 'Tài khoản chưa được kích hoạt. Vui lòng liên hệ hỗ trợ.';
          } else if (error.message.includes('network') || error.message.includes('timeout')) {
            userMessage = 'Lỗi kết nối. Vui lòng kiểm tra internet và thử lại.';
          }
          // Don't expose other internal errors
        }
        
        showError('Đăng nhập thất bại', userMessage);
      } finally {
        setIsGoogleLoading(false);
      }
    },
    onError: () => {
      console.error('Google login cancelled or failed');
      showError('Đăng nhập thất bại', 'Không thể đăng nhập với Google. Vui lòng thử lại.');
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      showError('Thiếu thông tin', 'Vui lòng nhập đầy đủ thông tin đăng nhập');
      return;
    }

    setLoading(true);

    try {
      console.log('Attempting login with:', formData);
      
      // Login and get redirect URL based on role
      const redirectUrl = await login(formData);
      
      console.log('Login successful, redirecting to:', redirectUrl);
      
      // Show success toast
      showSuccess(
        'Đăng nhập thành công!',
        'Chào mừng bạn trở lại. Đang chuyển hướng...',
        2
      );
      
      // Extract the path from the full URL for navigation
      const urlPath = new URL(redirectUrl).pathname;
      
      // Navigate to role-specific page after toast delay
      setTimeout(() => {
        navigate(urlPath, { replace: true });
      }, 2000);
      
    } catch (error: unknown) {
      console.error('Login error:', error);
      
      // Check if this is an unverified email error
      const authError = error as Error & { needsVerification?: boolean; email?: string };
      if (authError.needsVerification) {
        console.log('Email not verified, redirecting to verify-email page');
        
        showError(
          'Tài khoản chưa được xác thực',
          `${authError.message}\n\nĐang chuyển hướng đến trang xác thực...`
        );
        
        // Navigate to verify email page immediately with shorter delay
        setTimeout(() => {
          navigate('/verify-otp', {
            state: {
              email: authError.email || formData.email,
              message: 'Vui lòng xác thực email để hoàn tất đăng ký tài khoản.',
              fromLogin: true
            }
          });
        }, 2000);
        return;
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Đăng nhập thất bại. Vui lòng thử lại.';
      showError('Đăng nhập thất bại', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container" data-theme={theme}>
      <div className="login-content">
        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo-wrapper">
            <img src={Logo} alt="Skillverse Logo" className="logo-image" />
          </div>
        </div>

        {/* Welcome Text */}
        <div className="login-welcome">
          <h1>Chào mừng trở lại!</h1>
          <p>Đăng nhập để tiếp tục hành trình học tập của bạn</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="login-form">

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <div className="input-wrapper">
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Nhập email của bạn"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Mật khẩu</label>
            <div className="input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Nhập mật khẩu của bạn"
                required
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="form-options">
            <label className="remember-me">
              <input type="checkbox" disabled={loading} />
              <span>Ghi nhớ đăng nhập</span>
            </label>
            <Link to="/forgot-password" className="forgot-password">
              Quên mật khẩu?
            </Link>
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="spinner" size={20} />
                <span>Đang đăng nhập...</span>
              </>
            ) : (
              'Đăng nhập'
            )}
          </button>
        </form>

        {/* Social Login */}
        <div className="social-login">
          <div className="divider">
            <span>Hoặc đăng nhập với</span>
          </div>
          <div className="social-buttons">
            <button 
              className="social-button google" 
              onClick={() => handleGoogleLogin()}
              disabled={loading || isGoogleLoading}
            >
              {isGoogleLoading ? (
                <>
                  <Loader2 className="spinner" size={20} />
                  <span>Đang đăng nhập...</span>
                </>
              ) : (
                <>
                  <img src="https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png" alt="Google" className="social-icon" />
                  <span>Google</span>
                </>
              )}
            </button>
            <button className="social-button facebook" disabled={loading || isGoogleLoading}>
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Facebook_Logo_%282019%29.png/1200px-Facebook_Logo_%282019%29.png" alt="Facebook" className="social-icon" />
              <span>Facebook</span>
            </button>
          </div>
        </div>

        {/* Register Link */}
        <div className="register-link">
          <span>Chưa có tài khoản?</span>
          <div className="register-options">
            <Link to="/register" className="register-option personal">
              Bạn muốn đăng ký là cá nhân
            </Link>
            <Link to="/register/business" className="register-option business">
              Bạn muốn đăng ký là doanh nghiệp
            </Link>
            <Link to="/register/mentor" className="register-option mentor">
              Bạn muốn đăng ký là mentor
            </Link>
          </div>
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

export default LoginPage;