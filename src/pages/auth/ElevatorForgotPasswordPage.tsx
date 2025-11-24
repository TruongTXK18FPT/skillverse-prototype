import React from 'react';
import { ElevatorAuthLayout, HologramForgotPasswordForm } from '../../components/elevator';
import { useToast } from '../../hooks/useToast';
import Toast from '../../components/Toast';

const ElevatorForgotPasswordPage: React.FC = () => {
  const { toast, isVisible, hideToast } = useToast();

  return (
    <>
      <ElevatorAuthLayout>
        <HologramForgotPasswordForm />
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

export default ElevatorForgotPasswordPage;
