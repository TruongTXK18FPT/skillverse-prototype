import { useMemo } from 'react';
import { useToast as useBaseToast } from '../hooks/useToast';

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
  const {
    toast,
    isVisible,
    hideToast: hideBaseToast,
    showToast: showBaseToast,
  } = useBaseToast();

  const hideToast = () => {
    hideBaseToast();
    if (options.onClose) {
      options.onClose();
    }
  };

  const showToast = (
    type: 'success' | 'error' | 'warning' | 'info',
    title: string,
    message: string,
    actionButton?: { text: string; onClick: () => void },
    useOverlay?: boolean
  ) => {
    showBaseToast({
      isVisible: true,
      type,
      title,
      message,
      autoCloseDelay: options.autoCloseDelay,
      showCountdown: options.showCountdown,
      actionButton,
      useOverlay
    } as any);
  };

  const normalizedToast = useMemo<ToastState>(
    () => ({
      isVisible,
      type: toast?.type ?? 'success',
      title: toast?.title ?? '',
      message: toast?.message ?? '',
      useOverlay: (toast as any)?.useOverlay ?? false,
      actionButton: toast?.actionButton,
    }),
    [isVisible, toast],
  );

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
    toast: normalizedToast,
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
