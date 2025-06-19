import { useState } from 'react';

export interface UseToastOptions {
  autoCloseDelay?: number;
  showCountdown?: boolean;
  onClose?: () => void;
}

export interface ToastState {
  isVisible: boolean;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  actionButton?: {
    text: string;
    onClick: () => void;
  };
}

export const useToast = (options: UseToastOptions = {}) => {
  const [toast, setToast] = useState<ToastState>({
    isVisible: false,
    type: 'success',
    title: '',
    message: ''
  });

  const showToast = (
    type: 'success' | 'error' | 'warning' | 'info',
    title: string,
    message: string,
    actionButton?: { text: string; onClick: () => void }
  ) => {
    setToast({
      isVisible: true,
      type,
      title,
      message,
      actionButton
    });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
    if (options.onClose) {
      options.onClose();
    }
  };

  // Convenience methods for different toast types
  const showSuccess = (title: string, message: string, actionButton?: { text: string; onClick: () => void }) => 
    showToast('success', title, message, actionButton);

  const showError = (title: string, message: string, actionButton?: { text: string; onClick: () => void }) => 
    showToast('error', title, message, actionButton);

  const showWarning = (title: string, message: string, actionButton?: { text: string; onClick: () => void }) => 
    showToast('warning', title, message, actionButton);

  const showInfo = (title: string, message: string, actionButton?: { text: string; onClick: () => void }) => 
    showToast('info', title, message, actionButton);

  return {
    toast,
    showToast,
    hideToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    ...options
  };
};

// Preset configurations for common payment scenarios
export const usePaymentToast = () => {
  return useToast({
    autoCloseDelay: 5,
    showCountdown: true
  });
};

export const useMentorBookingToast = () => {
  return useToast({
    autoCloseDelay: 4,
    showCountdown: true
  });
};

export const useCourseEnrollmentToast = () => {
  return useToast({
    autoCloseDelay: 6,
    showCountdown: true
  });
};
