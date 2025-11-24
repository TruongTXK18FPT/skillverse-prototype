import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';
import { ElevatorAuthLayout, HologramPersonalRegisterForm } from '../../components/elevator';
import { useToast } from '../../hooks/useToast';
import Toast from '../../components/Toast';
import { UserRegistrationRequest } from '../../data/userDTOs';

const ElevatorPersonalRegisterPage: React.FC = () => {
  const { register, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast, isVisible, hideToast, showSuccess, showError } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [pendingRedirect, setPendingRedirect] = useState<string | null>(null);
  const [registeredEmail, setRegisteredEmail] = useState<string>('');
  const [googleRegisterSuccess, setGoogleRegisterSuccess] = useState<{ userName: string } | null>(null);

  // Check if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/auth-warning', { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Handle success message from other pages
  useEffect(() => {
    const state = location.state as { message?: string } | null;
    if (state?.message) {
      showSuccess('Thành công!', state.message);
      navigate('/register', { replace: true });
    }
  }, [location.state, navigate, showSuccess]);

  // Google register handler
  const handleGoogleRegister = useGoogleLogin({
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

        // Signal to HologramPersonalRegisterForm to trigger animation
        const userName = result.authData.user.fullName?.split(' ')[0] || 'Commander';
        setGoogleRegisterSuccess({ userName });
      } catch (error) {
        console.error('Google register error:', error);

        let userMessage = 'Đăng ký Google thất bại. Vui lòng thử lại.';

        if (error instanceof Error) {
          if (error.message.includes('USER accounts')) {
            userMessage = 'Tài khoản này không thể đăng ký bằng Google.';
          } else if (error.message.includes('not active')) {
            userMessage = 'Tài khoản chưa được kích hoạt.';
          } else if (error.message.includes('network') || error.message.includes('timeout')) {
            userMessage = 'Lỗi kết nối. Vui lòng kiểm tra internet.';
          }
        }

        showError('Đăng ký thất bại', userMessage);
      } finally {
        setIsGoogleLoading(false);
      }
    },
    onError: () => {
      showError('Đăng ký thất bại', 'Không thể đăng ký với Google.');
    }
  });

  // Form submit handler
  const handleFormSubmit = async (
    data: {
      fullName: string;
      email: string;
      password: string;
      confirmPassword: string;
      phone: string;
      bio: string;
      address: string;
      region: string;
    }
  ): Promise<{ success: boolean; userName?: string; error?: string }> => {
    setIsLoading(true);

    try {
      // Prepare registration data matching backend UserRegistrationRequest
      const registrationData: UserRegistrationRequest = {
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
        fullName: data.fullName,
        phone: data.phone || undefined,
        bio: data.bio || undefined,
        address: data.address || undefined,
        region: data.region,
      };

      console.log('Registration data:', registrationData);

      // Call register function from AuthContext
      const result = await register(registrationData);
      
      console.log('Registration result:', result);

      // Store email for verify-otp navigation
      setRegisteredEmail(data.email);

      // Check if verification is required
      if (result.requiresVerification) {
        console.log('Verification required, will redirect to verify-otp after animation');
        
        // Store redirect for after animation
        setPendingRedirect('/verify-otp');
        
        // Return success with user name for animation
        return {
          success: true,
          userName: data.fullName.split(' ')[0]
        };
      } else {
        console.log('No verification required, will redirect to login after animation');
        
        // Store redirect for after animation
        setPendingRedirect('/login');
        
        return {
          success: true,
          userName: data.fullName.split(' ')[0]
        };
      }
    } catch (error: unknown) {
      console.error('Registration error:', error);
      const errorMessage = (error as Error).message || 'Đăng ký thất bại. Vui lòng thử lại.';

      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Handle transition complete - navigate to next page
  const handleTransitionComplete = () => {
    if (pendingRedirect) {
      if (pendingRedirect === '/verify-otp') {
        // Navigate to OTP verification
        navigate('/verify-otp', { 
          state: { 
            email: registeredEmail,
            message: 'Vui lòng kiểm tra email và nhập mã xác thực để hoàn tất đăng ký.',
            fromLogin: false,
            requiresVerification: true,
            userType: 'user'
          }
        });
      } else {
        // Use window.location for full reload to ensure AuthContext updates
        window.location.href = pendingRedirect;
      }
    }
  };

  return (
    <>
      <ElevatorAuthLayout onTransitionComplete={handleTransitionComplete}>
        <HologramPersonalRegisterForm
          onSubmit={handleFormSubmit}
          onGoogleRegister={() => handleGoogleRegister()}
          isLoading={isLoading}
          isGoogleLoading={isGoogleLoading}
          googleRegisterSuccess={googleRegisterSuccess}
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

export default ElevatorPersonalRegisterPage;
