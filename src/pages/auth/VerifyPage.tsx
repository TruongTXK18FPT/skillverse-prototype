import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Mail, Shield, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import Toast from '../../components/Toast';
import '../../styles/VerifyPage.css';

interface LocationState {
  email: string;
  message?: string;
  fromLogin?: boolean;
  requiresVerification?: boolean;
  userType?: 'user' | 'mentor' | 'business'; // Add user type
}

const VerifyPage = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyEmail, resendOtp } = useAuth();
  const { toast, isVisible, hideToast, showSuccess, showError, showWarning } = useToast();
  
  const state = location.state as LocationState;
  const email = state?.email || '';
  const fromLogin = state?.fromLogin || false;
  const userType = state?.userType || 'user'; // Default to 'user' if not specified
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes = 600 seconds
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isExpired, setIsExpired] = useState(false);

  // Redirect if no email in state
  useEffect(() => {
    if (!email) {
      navigate(fromLogin ? '/login' : '/register', { replace: true });
    }
  }, [email, navigate, fromLogin]);

  // Main countdown timer (10 minutes)
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setIsExpired(true);
    }
  }, [timeLeft]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Format time display
  const formatTime = useCallback((seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  // Handle OTP input change
  const handleOtpChange = (index: number, value: string) => {
    // Handle paste - when multiple characters are entered
    if (value.length > 1) {
      // Only allow digits for pasted content
      const cleanValue = value.replace(/\D/g, '');
      
      if (cleanValue.length > 0) {
        const newOtp = [...otp];
        
        // Fill inputs starting from current index
        for (let i = 0; i < cleanValue.length && (index + i) < 6; i++) {
          newOtp[index + i] = cleanValue[i];
        }
        
        setOtp(newOtp);
        
        // Focus on the next empty input or last input
        const focusIndex = Math.min(index + cleanValue.length, 5);
        setTimeout(() => {
          const nextInput = document.getElementById(`otp-${focusIndex}`) as HTMLInputElement;
          nextInput?.focus();
        }, 0);
      }
      return;
    }

    // Handle single character input
    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      setTimeout(() => {
        const nextInput = document.getElementById(`otp-${index + 1}`) as HTMLInputElement;
        nextInput?.focus();
      }, 0);
    }
  };

  // Handle paste event specifically
  const handlePaste = (index: number, e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const cleanValue = pastedText.replace(/\D/g, '').slice(0, 6); // Only digits, max 6
    
    if (cleanValue.length > 0) {
      const newOtp = [...otp];
      
      // Fill all inputs from the beginning for better UX
      for (let i = 0; i < 6; i++) {
        newOtp[i] = i < cleanValue.length ? cleanValue[i] : '';
      }
      
      setOtp(newOtp);
      
      // Focus on the next empty input or last filled input
      const focusIndex = Math.min(cleanValue.length, 5);
      setTimeout(() => {
        const targetInput = document.getElementById(`otp-${focusIndex}`) as HTMLInputElement;
        targetInput?.focus();
      }, 0);
    }
  };

  // Handle backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`) as HTMLInputElement;
      prevInput?.focus();
    }
  };

  // Submit OTP
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      showError('Mã OTP không hợp lệ', 'Vui lòng nhập đầy đủ 6 số');
      return;
    }

    if (isExpired) {
      showWarning('Mã OTP đã hết hạn', 'Vui lòng yêu cầu gửi lại mã mới');
      return;
    }

    setLoading(true);

    try {
      console.log('Verifying OTP:', { email, otp: otpString });
      
      await verifyEmail({ email, otp: otpString });
      
      // Different success messages based on user type
      if (userType === 'mentor') {
        showSuccess(
          'Xác thực email thành công!',
          'Đơn đăng ký mentor đã được gửi và đang chờ phê duyệt từ quản trị viên. Bạn sẽ nhận được thông báo qua email khi đơn đăng ký được xem xét.',
          5
        );
      } else if (userType === 'business') {
        showSuccess(
          'Xác thực email thành công!',
          'Đơn đăng ký doanh nghiệp đã được gửi và đang chờ phê duyệt từ quản trị viên. Bạn sẽ nhận được thông báo qua email khi đơn đăng ký được xem xét.',
          5
        );
      } else {
        // Regular user
        showSuccess(
          'Xác thực thành công!',
          'Tài khoản của bạn đã được xác thực. Đang chuyển hướng...',
          3
        );
      }
      
      // Different redirect logic based on user type
      setTimeout(() => {
        if (userType === 'mentor' || userType === 'business') {
          // For mentor and business, redirect to a waiting page or login with special message
          navigate('/login', { 
            state: { 
              message: `Đăng ký ${userType === 'mentor' ? 'mentor' : 'doanh nghiệp'} thành công! Email đã được xác thực. Vui lòng chờ phê duyệt từ quản trị viên. Bạn sẽ nhận được email thông báo khi đơn đăng ký được duyệt.`,
              userType: userType
            }
          });
        } else if (fromLogin) {
          // Regular user from login
          navigate('/login', { 
            state: { 
              message: 'Tài khoản đã được xác thực. Vui lòng đăng nhập lại.' 
            }
          });
        } else {
          // Regular user from registration
          navigate('/login', { 
            state: { 
              message: 'Đăng ký thành công! Tài khoản đã được xác thực. Vui lòng đăng nhập.' 
            }
          });
        }
      }, userType === 'mentor' || userType === 'business' ? 5000 : 3000); // Longer delay for mentor/business to read the message
      
    } catch (error: unknown) {
      console.error('Email verification error:', error);
      const errorMessage = (error as Error).message || 'Xác thực thất bại. Vui lòng thử lại.';
      
      // Clear OTP on error
      setOtp(['', '', '', '', '', '']);
      const firstInput = document.getElementById('otp-0') as HTMLInputElement;
      firstInput?.focus();
      
      showError('Xác thực thất bại', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;

    setResendLoading(true);

    try {
      console.log('Resending OTP to:', email);
      
      const response = await resendOtp({ email });
      
      showSuccess(
        'Đã gửi lại mã OTP',
        response || 'Mã OTP mới đã được gửi đến email của bạn.'
      );
      
      // Reset timers
      setTimeLeft(600); // Reset to 10 minutes
      setResendCooldown(60); // 60 seconds cooldown
      setIsExpired(false);
      
      // Clear current OTP
      setOtp(['', '', '', '', '', '']);
      const firstInput = document.getElementById('otp-0') as HTMLInputElement;
      firstInput?.focus();
      
    } catch (error: unknown) {
      console.error('Resend OTP error:', error);
      const errorMessage = (error as Error).message || 'Gửi lại mã OTP thất bại. Vui lòng thử lại.';
      showError('Gửi lại mã thất bại', errorMessage);
    } finally {
      setResendLoading(false);
    }
  };

  // Compute classes and text
  let timerClass = '';
  if (isExpired) {
    timerClass = 'expired';
  } else if (timeLeft <= 60) {
    timerClass = 'warning';
  }
  
  const timerText = isExpired ? 'Đã hết hạn' : `${formatTime(timeLeft)} còn lại`;
  const subtitleText = fromLogin 
    ? 'Xác thực tài khoản để tiếp tục đăng nhập'
    : 'Hoàn tất đăng ký tài khoản của bạn';

  return (
    <div className="verify-otp-container" data-theme={theme}>
      {/* Background Elements */}
      <div className="verify-otp-background">
        <div className="verify-otp-circle verify-otp-circle-1"></div>
        <div className="verify-otp-circle verify-otp-circle-2"></div>
        <div className="verify-otp-circle verify-otp-circle-3"></div>
      </div>

      <div className="verify-otp-content">
        {/* Header */}
        <div className="verify-otp-header">
          <button 
            onClick={() => navigate(fromLogin ? '/login' : '/register')} 
            className="verify-otp-back-button"
          >
            <ArrowLeft size={20} />
            Quay lại
          </button>
          
          <div className="verify-otp-icon-wrapper">
            <div className="verify-otp-icon">
              <Mail size={32} />
            </div>
            <div className="verify-otp-icon-ring"></div>
          </div>
          
          <h1 className="verify-otp-title">Xác Thực Email</h1>
          <p className="verify-otp-subtitle">{subtitleText}</p>
          
          <div className="verify-otp-email-display">
            <span className="verify-otp-email">{email}</span>
          </div>
        </div>

        {/* Timer Display */}
        <div className={`verify-otp-timer ${timerClass}`}>
          <Clock size={16} />
          <span>{timerText}</span>
        </div>

        {/* OTP Form */}
        <form onSubmit={handleSubmit} className="verify-otp-form">
          <div className="verify-otp-inputs">
            {Array.from({ length: 6 }, (_, index) => (
              <input
                key={`otp-${index}`}
                id={`otp-${index}`}
                type="text"
                value={otp[index] || ''}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={(e) => handlePaste(index, e)}
                className={`verify-otp-input ${isExpired ? 'expired' : ''}`}
                maxLength={1}
                disabled={loading || isExpired}
                autoComplete="one-time-code"
                autoFocus={index === 0}
              />
            ))}
          </div>

          <button 
            type="submit" 
            className={`verify-otp-submit ${loading ? 'loading' : ''} ${isExpired ? 'expired' : ''}`}
            disabled={loading || isExpired || otp.join('').length !== 6}
          >
            {(() => {
              if (loading) {
                return (
                  <>
                    <div className="verify-otp-spinner"></div>
                    Đang xác thực...
                  </>
                );
              }
              if (isExpired) {
                return (
                  <>
                    <AlertCircle size={20} />
                    Mã đã hết hạn
                  </>
                );
              }
              return (
                <>
                  <CheckCircle size={20} />
                  Xác Thực
                </>
              );
            })()}
          </button>
        </form>

        {/* Resend Section */}
        <div className="verify-otp-resend-section">
          <p className="verify-otp-resend-text">Không nhận được mã?</p>
          <button
            type="button"
            className={`verify-otp-resend-button ${resendCooldown > 0 ? 'disabled' : ''}`}
            onClick={handleResendOtp}
            disabled={resendLoading || resendCooldown > 0}
          >
            {(() => {
              if (resendLoading) {
                return (
                  <>
                    <div className="verify-otp-spinner-small"></div>
                    Đang gửi...
                  </>
                );
              }
              if (resendCooldown > 0) {
                return `Gửi lại sau ${resendCooldown}s`;
              }
              return 'Gửi lại mã';
            })()}
          </button>
        </div>

        {/* Security Features */}
        <div className="verify-otp-security">
          <div className="verify-otp-security-item">
            <Shield size={16} />
            <span>Bảo mật cao</span>
          </div>
          <div className="verify-otp-security-item">
            <Clock size={16} />
            <span>Hiệu lực 10 phút</span>
          </div>
          <div className="verify-otp-security-item">
            <Mail size={16} />
            <span>Mã hóa an toàn</span>
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

export default VerifyPage;