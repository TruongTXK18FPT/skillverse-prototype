import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';
import businessService from '../../services/businessService';
import { ElevatorAuthLayout, HologramBusinessRegisterForm } from '../../components/elevator';
import PendingApprovalModal from '../../components/elevator/PendingApprovalModal';
import { useToast } from '../../hooks/useToast';
import Toast from '../../components/Toast';
import { BusinessRegistrationRequest } from '../../data/userDTOs';

const ElevatorBusinessRegisterPage: React.FC = () => {
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
      navigate('/register-business', { replace: true });
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

        // Signal to HologramBusinessRegisterForm to trigger animation
        const userName = result.authData.user.fullName?.split(' ')[0] || 'Commander';
        setGoogleRegisterSuccess({ userName });
      } catch (error) {
        console.error('Google register error:', error);

        let userMessage = 'Đăng ký Google thất bại. Vui lòng thử lại.';

        if (error instanceof Error) {
          if (error.message.includes('RECRUITER accounts')) {
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
      companyName: string;
      businessEmail: string;
      companyWebsite: string;
      businessAddress: string;
      taxId: string;
      password: string;
      confirmPassword: string;
      contactPersonName: string;
      contactPersonPhone?: string;
      contactPersonPosition: string;
      companySize: string;
      industry: string;
      companyDocuments?: File[];
    }
  ): Promise<{ success: boolean; userName?: string; error?: string }> => {
    setIsLoading(true);

    try {
      // Create registration request matching backend BusinessRegistrationRequest
      const registrationRequest: BusinessRegistrationRequest = {
        companyName: data.companyName,
        businessEmail: data.businessEmail,
        companyWebsite: data.companyWebsite,
        businessAddress: data.businessAddress,
        taxId: data.taxId,
        password: data.password,
        confirmPassword: data.confirmPassword,
        contactPersonName: data.contactPersonName,
        contactPersonPhone: data.contactPersonPhone || undefined,
        contactPersonPosition: data.contactPersonPosition,
        companySize: data.companySize,
        industry: data.industry
      };

      // Prepare files
      const files = {
        documents: data.companyDocuments && data.companyDocuments.length > 0 ? data.companyDocuments : undefined
      };

      console.log('Attempting business registration for:', registrationRequest.businessEmail);
      
      const response = await businessService.register(registrationRequest, files);
      
      console.log('Business registration successful:', response);
      
      // Check if requires verification (email verification) or pending approval
      if (response.requiresVerification) {
        // Email verification needed - navigate to OTP page
        setRegisteredEmail(data.businessEmail);
        setPendingRedirect('/verify-otp');
      } else {
        // Account is pending admin approval - show modal
        setPendingApprovalEmail(data.businessEmail);
        setShowPendingModal(true);
      }
      
      // Return success with company name for animation
      return {
        success: true,
        userName: data.companyName
      };
    } catch (error: unknown) {
      console.error('Business registration error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Đăng ký doanh nghiệp thất bại. Vui lòng thử lại.';

      // Check if error is about pending approval
      if (errorMessage.toLowerCase().includes('pending') && errorMessage.toLowerCase().includes('approval')) {
        // Show pending approval modal instead of error
        setPendingApprovalEmail(data.businessEmail);
        setShowPendingModal(true);
        return { success: true, userName: data.companyName };
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
            message: 'Đơn đăng ký doanh nghiệp đã được gửi. Vui lòng xác thực email để hoàn tất quá trình đăng ký.',
            fromLogin: false,
            requiresVerification: true,
            userType: 'business'
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
        <HologramBusinessRegisterForm
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
        userType="business"
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

export default ElevatorBusinessRegisterPage;
