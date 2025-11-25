import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';
import mentorService from '../../services/mentorService';
import { ElevatorAuthLayout, HologramMentorRegisterForm } from '../../components/elevator';
import PendingApprovalModal from '../../components/elevator/PendingApprovalModal';
import { useToast } from '../../hooks/useToast';
import Toast from '../../components/Toast';
import { MentorRegistrationRequest } from '../../data/userDTOs';

const ElevatorMentorRegisterPage: React.FC = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast, isVisible, hideToast, showSuccess, showError } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [pendingRedirect, setPendingRedirect] = useState<string | null>(null);
  const [registeredEmail, setRegisteredEmail] = useState<string>('');
  const [googleRegisterSuccess, setGoogleRegisterSuccess] = useState<{ userName: string } | null>(null);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [pendingApprovalEmail, setPendingApprovalEmail] = useState<string>('');

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
      linkedinProfile?: string;
      mainExpertise: string;
      yearsOfExperience: string;
      personalBio: string;
      cvFile?: File;
      certifications?: File[];
    }
  ): Promise<{ success: boolean; userName?: string; error?: string }> => {
    setIsLoading(true);

    try {
      // Create registration request matching backend MentorRegistrationRequest
      const registrationRequest: MentorRegistrationRequest = {
        fullName: data.fullName,
        email: data.email,
        linkedinProfile: data.linkedinProfile,
        mainExpertise: data.mainExpertise,
        yearsOfExperience: parseInt(data.yearsOfExperience),
        personalBio: data.personalBio,
        password: data.password,
        confirmPassword: data.confirmPassword
      };

      // Prepare files
      const files = {
        cv: data.cvFile || undefined,
        certifications: data.certifications && data.certifications.length > 0 ? data.certifications : undefined
      };

      console.log('Attempting mentor registration for:', registrationRequest.email);
      
      const response = await mentorService.register(registrationRequest, files);
      
      console.log('Mentor registration successful:', response);
      
      // Check if requires verification (email verification) or pending approval
      if (response.requiresVerification) {
        // Email verification needed - navigate to OTP page
        setRegisteredEmail(data.email);
        setPendingRedirect('/verify-otp');
      } else {
        // Account is pending admin approval - show modal
        setPendingApprovalEmail(data.email);
        setShowPendingModal(true);
      }
      
      // Return success with user name for animation
      return {
        success: true,
        userName: data.fullName.split(' ')[0]
      };
    } catch (error: unknown) {
      console.error('Mentor registration error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Đăng ký mentor thất bại. Vui lòng thử lại.';

      // Check if error is about pending approval
      if (errorMessage.toLowerCase().includes('pending') && errorMessage.toLowerCase().includes('approval')) {
        // Show pending approval modal instead of error
        setPendingApprovalEmail(data.email);
        setShowPendingModal(true);
        return { success: true, userName: data.fullName.split(' ')[0] };
      }

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
            message: 'Đơn đăng ký mentor đã được gửi. Vui lòng xác thực email để hoàn tất quá trình đăng ký.',
            fromLogin: false,
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
      <ElevatorAuthLayout onTransitionComplete={handleTransitionComplete} hideHudCorners={true}>
        <HologramMentorRegisterForm
          onSubmit={handleFormSubmit}
          onGoogleRegister={() => handleGoogleRegister()}
          isLoading={isLoading}
          isGoogleLoading={isGoogleLoading}
          googleRegisterSuccess={googleRegisterSuccess}
        />
      </ElevatorAuthLayout>

      {/* Pending Approval Modal */}
      <PendingApprovalModal
        isOpen={showPendingModal}
        onClose={() => {
          setShowPendingModal(false);
          navigate('/login');
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

export default ElevatorMentorRegisterPage;
