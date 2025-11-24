import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';
import { ElevatorAuthLayout, HologramMentorRegisterForm } from '../../components/elevator';
import { useToast } from '../../hooks/useToast';
import Toast from '../../components/Toast';

const ElevatorMentorRegisterPage: React.FC = () => {
  const { registerMentor, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast, isVisible, hideToast, showSuccess, showError } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [pendingRedirect, setPendingRedirect] = useState<string | null>(null);
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
      navigate('/register-mentor', { replace: true });
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

        // Signal to HologramMentorRegisterForm to trigger animation
        const userName = result.authData.user.fullName?.split(' ')[0] || 'Commander';
        setGoogleRegisterSuccess({ userName });
      } catch (error) {
        console.error('Google register error:', error);

        let userMessage = 'Đăng ký Google thất bại. Vui lòng thử lại.';

        if (error instanceof Error) {
          if (error.message.includes('MENTOR accounts')) {
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
      expertise: string;
      yearsOfExperience: string;
      education: string;
      address: string;
      region: string;
    }
  ): Promise<{ success: boolean; userName?: string; error?: string }> => {
    setIsLoading(true);

    try {
      // Prepare mentor registration data
      const mentorData = {
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
        phone: data.phone || undefined,
        bio: data.bio || undefined,
        expertise: data.expertise || undefined,
        yearsOfExperience: data.yearsOfExperience ? parseInt(data.yearsOfExperience) : undefined,
        education: data.education || undefined,
        address: data.address || undefined,
        region: data.region,
      };

      console.log('Mentor registration data:', mentorData);

      // Call registerMentor function from AuthContext
      const result = await registerMentor(mentorData);
      
      console.log('Mentor registration result:', result);

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
      console.error('Mentor registration error:', error);
      const errorMessage = (error as Error).message || 'Đăng ký mentor thất bại. Vui lòng thử lại.';

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
            email: '', // Will be filled from form
            message: 'Vui lòng kiểm tra email và nhập mã xác thực để hoàn tất đăng ký mentor.',
            requiresVerification: true,
            userType: 'mentor'
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
        <HologramMentorRegisterForm
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

export default ElevatorMentorRegisterPage;
