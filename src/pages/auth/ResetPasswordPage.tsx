import React from 'react';
import { ElevatorAuthLayout, HologramResetPasswordForm } from '../../components/elevator';
import { useToast } from '../../hooks/useToast';
import Toast from '../../components/Toast';

const ResetPasswordPage: React.FC = () => {
  const { toast, isVisible, hideToast } = useToast();

  return (
    <>
      <ElevatorAuthLayout>
        <HologramResetPasswordForm />
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

export default ResetPasswordPage;
