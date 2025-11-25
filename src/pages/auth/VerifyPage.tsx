import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import Toast from '../../components/Toast';
import { ElevatorAuthLayout } from '../../components/elevator';
import HologramVerifyForm from '../../components/elevator/HologramVerifyForm';

interface LocationState {
  email: string;
  message?: string;
  fromLogin?: boolean;
  requiresVerification?: boolean;
  userType?: 'user' | 'mentor' | 'business'; // Add user type
  mode?: 'register' | 'forgot-password'; // Add mode for different flows
}

const VerifyPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyEmail, resendOtp } = useAuth();
  const { toast, isVisible, hideToast, showSuccess, showError, showWarning } = useToast();
  
  const state = location.state as LocationState;
  const email = state?.email || '';
  const fromLogin = state?.fromLogin || false;
  const userType = state?.userType || 'user'; // Default to 'user' if not specified
  const mode = state?.mode || 'register'; // Default to 'register' if not specified
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes = 300 seconds
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isExpired, setIsExpired] = useState(false);
  
  // Redirect if no email in state
  useEffect(() => {
    if (!email) {
      navigate(fromLogin ? '/login' : '/register', { replace: true });
    }
  }, [email, navigate, fromLogin]);

  // Initialize timer from localStorage or state
  useEffect(() => {
    const storageKey = `otp_expiry_${email}`;
    const storedExpiry = localStorage.getItem(storageKey);
    
    if (storedExpiry) {
      const expiryTime = new Date(storedExpiry).getTime();
      const now = new Date().getTime();
      const remainingSeconds = Math.max(0, Math.floor((expiryTime - now) / 1000));
      
      setTimeLeft(remainingSeconds);
      if (remainingSeconds === 0) {
        setIsExpired(true);
      }
    }
  }, [email]);

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
  const handlePaste = (_index: number, e: React.ClipboardEvent) => {
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
      // console.log('Verifying OTP:', { email, otp: otpString, mode });
      
      // For forgot-password mode, skip API verification here
      // OTP will be verified when resetting password
      if (mode === 'forgot-password') {
        showSuccess(
          'Mã OTP hợp lệ!',
          'Đang chuyển đến trang đặt lại mật khẩu...',
          1.5
        );
      } else {
        // For registration flow, verify email with OTP
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
      }
      
      // Different redirect logic based on mode and user type
      setTimeout(() => {
        if (mode === 'forgot-password') {
          // Forgot password flow - navigate to reset password page
          navigate('/reset-password', { 
            state: { 
              email,
              otp: otpString // Pass OTP for backend verification
            }
          });
        } else if (userType === 'mentor' || userType === 'business') {
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
      }, mode === 'forgot-password' ? 1500 : (userType === 'mentor' || userType === 'business' ? 5000 : 3000));
      
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
      // console.log('Resending OTP to:', email);
      
      const response = await resendOtp({ email });
      
      showSuccess(
        'Đã gửi lại mã OTP',
        response || 'Mã OTP mới đã được gửi đến email của bạn.'
      );
      
      // Calculate and save new OTP expiry time
      const newExpiryTime = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
      const storageKey = `otp_expiry_${email}`;
      localStorage.setItem(storageKey, newExpiryTime.toISOString());
      
      // Reset timers
      setTimeLeft(300); // Reset to 5 minutes
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

  return (
    <>
      <ElevatorAuthLayout>
        <HologramVerifyForm
          email={email}
          otp={otp}
          isLoading={loading}
          isResendLoading={resendLoading}
          timeLeft={timeLeft}
          isExpired={isExpired}
          resendCooldown={resendCooldown}
          userType={userType}
          onOtpChange={handleOtpChange}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          onSubmit={handleSubmit}
          onResend={handleResendOtp}
          onBack={() => navigate(fromLogin ? '/login' : '/register')}
        />
      </ElevatorAuthLayout>

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
    </>
  );
};

export default VerifyPage;