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
  useOverlay?: boolean;
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
    message: '',
    useOverlay: false
  });

  const showToast = (
    type: 'success' | 'error' | 'warning' | 'info',
    title: string,
    message: string,
    actionButton?: { text: string; onClick: () => void },
    useOverlay?: boolean
  ) => {
    setToast({
      isVisible: true,
      type,
      title,
      message,
      actionButton,
      useOverlay
    });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
    if (options.onClose) {
      options.onClose();
    }
  };

  // Convenience methods for different toast types
  const showSuccess = (title: string, message: string, actionButton?: { text: string; onClick: () => void }, useOverlay?: boolean) => 
    showToast('success', title, message, actionButton, useOverlay);

  const showError = (title: string, message: string, actionButton?: { text: string; onClick: () => void }, useOverlay?: boolean) => 
    showToast('error', title, message, actionButton, useOverlay);

  const showWarning = (title: string, message: string, actionButton?: { text: string; onClick: () => void }, useOverlay?: boolean) => 
    showToast('warning', title, message, actionButton, useOverlay);

  const showInfo = (title: string, message: string, actionButton?: { text: string; onClick: () => void }, useOverlay?: boolean) => 
    showToast('info', title, message, actionButton, useOverlay);

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
