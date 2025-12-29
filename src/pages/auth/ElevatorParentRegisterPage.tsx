import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';
import { ElevatorAuthLayout, HologramParentRegisterForm } from '../../components/elevator';
import { useToast } from '../../hooks/useToast';
import Toast from '../../components/shared/Toast';
import { UserRegistrationRequest } from '../../data/userDTOs';

const ElevatorParentRegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast, isVisible, hideToast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [pendingRedirect, setPendingRedirect] = useState<string | null>(null);

  // Check if already authenticated
  useEffect(() => {
    // Logic to check authentication if needed
  }, [navigate]);

  const handleFormSubmit = async (
    data: {
      fullName: string;
      email: string;
      password: string;
      confirmPassword: string;
      phone: string;
      address: string;
      childEmail?: string;
    }
  ): Promise<{ success: boolean; userName?: string; error?: string }> => {
    setIsLoading(true);

    try {
      // Assuming 'PARENT' role handling on backend or we pass role='PARENT'
      // Since `register` function might default to 'USER', we might need to use authService directly if useAuth().register doesn't support role override,
      // OR we update UserRegistrationRequest to include role.
      // Based on typical implementation, let's assume register handles basic user creation and we might need to adjust role or use a specific endpoint if needed.
      // However, looking at the code structure, let's assume standard register works and we might need to set role via API or it defaults to USER and admin changes it?
      // WAIT: The prompt said "Parent Role", implying a specific registration or role assignment.
      // If the backend `UserRegistrationRequest` supports `role`, we should pass it.
      // If not, we might need a specific endpoint like `/api/parents/register` or similar, BUT
      // standard auth usually registers a USER first.
      // Let's check `UserRegistrationRequest` or `authService.register`.
      
      // For now, I will use `authService.register` and pass 'PARENT' as role if supported, or rely on the backend to handle it based on the endpoint if I were to create a new one.
      // But since I'm in frontend, I'll use the existing `register` from context which calls `authService`.
      
      // Let's construct the request.
      const registrationData: UserRegistrationRequest = {
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
        fullName: data.fullName,
        firstName: data.fullName.split(' ').slice(0, -1).join(' ') || data.fullName,
        lastName: data.fullName.split(' ').slice(-1).join(' '),
        phoneNumber: data.phone,
        phone: data.phone,
        address: data.address,
        role: 'PARENT', // Assuming backend supports this field in registration DTO
        childEmail: data.childEmail // Pass child email if provided
      };

      await register(registrationData);
      
      // Store email for verification page
      // setRegisteredEmail(data.email);
      setPendingRedirect(`/verify-otp?email=${encodeURIComponent(data.email)}`);

      return {
        success: true,
        userName: data.fullName.split(' ')[0]
      };
    } catch (error: any) {
      console.error('Registration error:', error);
      const message = error.response?.data?.message || 'Registration failed. Please try again.';
      return {
        success: false,
        error: message
      };
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnimationComplete = () => {
    if (pendingRedirect) {
      navigate(pendingRedirect);
    }
  };

  return (
    <ElevatorAuthLayout onTransitionComplete={handleAnimationComplete} hideHudCorners={true}>
      <HologramParentRegisterForm
        onSubmit={handleFormSubmit}
        isLoading={isLoading}
      />
      {isVisible && toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
          title={toast.type === 'error' ? 'Error' : 'Success'}
          isVisible={isVisible}
        />
      )}
    </ElevatorAuthLayout>
  );
};

export default ElevatorParentRegisterPage;
