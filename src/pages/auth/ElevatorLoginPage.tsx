import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';
import { ElevatorAuthLayout, HologramLoginForm } from '../../components/elevator';
import PendingApprovalModal from '../../components/elevator/PendingApprovalModal';
import { useToast } from '../../hooks/useToast';
import Toast from '../../components/Toast';

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
        const result = await authService.loginWithGoogle(tokenResponse.access_token);

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
          if (error.message.includes('USER accounts')) {
            userMessage = 'Tài khoản này không thể đăng nhập bằng Google.';
          } else if (error.message.includes('not active')) {
            userMessage = 'Tài khoản chưa được kích hoạt.';
          } else if (error.message.includes('network') || error.message.includes('timeout')) {
            userMessage = 'Lỗi kết nối. Vui lòng kiểm tra internet.';
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
    password: string
  ): Promise<{ success: boolean; userName?: string; error?: string }> => {
    setIsLoading(true);

    try {
      const redirectUrl = await login({ email, password });

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

      return { success: false, error: errorMessage };
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
          onGoogleLogin={() => handleGoogleLogin()}
          isLoading={isLoading}
          isGoogleLoading={isGoogleLoading}
          googleLoginSuccess={googleLoginSuccess}
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