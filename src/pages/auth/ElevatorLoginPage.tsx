import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';
import { ElevatorAuthLayout, HologramLoginForm } from '../../components/elevator';
import PendingApprovalModal from '../../components/elevator/PendingApprovalModal';
import { useToast } from '../../hooks/useToast';
import Toast from '../../components/shared/Toast';

const ElevatorLoginPage: React.FC = () => {
  const { login, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast, isVisible, hideToast, showSuccess, showError } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [pendingRedirect, setPendingRedirect] = useState<string | null>(null);
  const [googleLoginSuccess, setGoogleLoginSuccess] = useState<{ userName: string } | null>(null);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [pendingApprovalEmail, setPendingApprovalEmail] = useState<string>('');
  const [rememberMe, setRememberMe] = useState(false);
  const googleRememberMeRef = useRef(false);

  // Check if already authenticated
  useEffect(() => {
    // Only redirect if NOT loading (local or google) and NOT waiting for redirect
    // This prevents redirecting to warning page immediately after successful login
    if (!authLoading && isAuthenticated && !isLoading && !isGoogleLoading && !pendingRedirect && !googleLoginSuccess) {
      navigate('/auth-warning', { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate, isLoading, isGoogleLoading, pendingRedirect, googleLoginSuccess]);

  // Handle success message from other pages
  useEffect(() => {
    const state = location.state as { message?: string } | null;
    if (state?.message) {
      showSuccess('Thành công!', state.message);
      navigate('/login', { replace: true });
    }
  }, [location.state, navigate, showSuccess]);

  // Google login handler
  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsGoogleLoading(true);
      try {
        // Use remember choice captured at click time for deterministic behavior
        const result = await authService.loginWithGoogle(
          tokenResponse.access_token,
          googleRememberMeRef.current,
        );

        // Store redirect URL for after animation
        if (result.needsProfileCompletion) {
          setPendingRedirect('/profile');
        } else {
          const urlPath = new URL(result.redirectUrl).pathname;
          setPendingRedirect(urlPath);
        }

        // Signal to HologramLoginForm to trigger animation
        const userName = result.authData.user.fullName?.split(' ')[0] || 'Commander';
        setGoogleLoginSuccess({ userName });
      } catch (error) {
        console.error('Google login error:', error);

        let userMessage = 'Đăng nhập Google thất bại. Vui lòng thử lại.';

        if (error instanceof Error) {
          // Xử lý thông báo lỗi cụ thể từ Backend trả về
          if (error.message.includes('Business/Recruiter accounts must use email/password login')) {
             userMessage = 'Tài khoản Doanh nghiệp/Nhà tuyển dụng phải đăng nhập bằng Email và Mật khẩu.';
          } else if (error.message.includes('Only Student and Approved Mentor accounts')) {
             userMessage = 'Chỉ tài khoản Học viên và Mentor đã được duyệt mới có thể đăng nhập bằng Google.';
          } else if (error.message.includes('USER accounts')) {
            userMessage = 'Tài khoản này không thể đăng nhập bằng Google.';
          } else if (error.message.includes('not active')) {
            userMessage = 'Tài khoản chưa được kích hoạt. Vui lòng liên hệ bộ phận hỗ trợ.';
          } else if (error.message.includes('Mentor application was rejected')) {
             userMessage = 'Đơn đăng ký Mentor của bạn đã bị từ chối. Vui lòng kiểm tra email.';
          } else if (error.message.includes('Mentor account is pending approval')) {
             userMessage = 'Tài khoản Mentor của bạn đang chờ phê duyệt.';
          } else if (error.message.includes('network') || error.message.includes('timeout')) {
            userMessage = 'Lỗi kết nối. Vui lòng kiểm tra internet.';
          } else {
             // Fallback cho các lỗi khác từ Backend (nếu có message chi tiết)
             userMessage = error.message;
          }
        }

        showError('Đăng nhập thất bại', userMessage);
      } finally {
        setIsGoogleLoading(false);
      }
    },
    onError: () => {
      showError('Đăng nhập thất bại', 'Không thể đăng nhập với Google.');
    }
  });

  // Form submit handler
  const handleFormSubmit = async (
    email: string,
    password: string,
    rememberUser: boolean,
  ): Promise<{ success: boolean; userName?: string; error?: string }> => {
    setIsLoading(true);

    try {
      const redirectUrl = await login({ email, password }, rememberUser);

      // Store redirect for after animation
      const urlPath = new URL(redirectUrl).pathname;
      setPendingRedirect(urlPath);

      // Extract user name from email for welcome message
      const userName = email.split('@')[0];

      // Don't show toast - let elevator animation handle the success feedback
      return {
        success: true,
        userName: userName.charAt(0).toUpperCase() + userName.slice(1)
      };
    } catch (error: unknown) {
      console.error('Login error:', error);

      // Handle unverified email
      const authError = error as Error & { needsVerification?: boolean; email?: string };
      if (authError.needsVerification) {
        showError(
          'Tài khoản chưa được xác thực',
          'Đang chuyển hướng đến trang xác thực...'
        );

        setTimeout(() => {
          navigate('/verify-otp', {
            state: {
              email: authError.email || email,
              message: 'Vui lòng xác thực email để hoàn tất đăng ký.',
              fromLogin: true
            }
          });
        }, 2000);

        return { success: false };
      }

      const errorMessage = error instanceof Error
        ? error.message
        : 'Đăng nhập thất bại. Vui lòng thử lại.';

      // Check if error is about pending approval
      if (errorMessage.toLowerCase().includes('pending') && errorMessage.toLowerCase().includes('approval')) {
        // Show pending approval modal instead of error
        setPendingApprovalEmail(email);
        setShowPendingModal(true);
        // Return success: false without error to prevent form from showing the error message
        return { success: false };
      }

      // Xử lý các thông báo lỗi cụ thể
      let displayError = errorMessage;
      if (errorMessage.includes('Email does not exist')) {
        displayError = 'Email này chưa được đăng ký trong hệ thống.';
      } else if (errorMessage.includes('Incorrect email or password')) {
        displayError = 'Email hoặc mật khẩu không chính xác.';
      }

      return { success: false, error: displayError };
    } finally {
      setIsLoading(false);
    }
  };

  // Handle transition complete - navigate to dashboard
  const handleTransitionComplete = () => {
    if (pendingRedirect) {
      // Use window.location for full reload to ensure AuthContext updates
      window.location.href = pendingRedirect;
    }
  };

  return (
    <>
      <ElevatorAuthLayout onTransitionComplete={handleTransitionComplete}>
        <HologramLoginForm
          onSubmit={handleFormSubmit}
          onGoogleLogin={(rememberUser) => {
            googleRememberMeRef.current = rememberUser;
            handleGoogleLogin();
          }}
          isLoading={isLoading}
          isGoogleLoading={isGoogleLoading}
          googleLoginSuccess={googleLoginSuccess}
          rememberMe={rememberMe}
          onRememberMeChange={setRememberMe}
        />
      </ElevatorAuthLayout>

      {/* Pending Approval Modal */}
      <PendingApprovalModal
        isOpen={showPendingModal}
        onClose={() => {
          setShowPendingModal(false);
          // Stay on login page or refresh? Just close modal is fine
        }}
        userType="mentor"
        email={pendingApprovalEmail}
      />

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

export default ElevatorLoginPage;
