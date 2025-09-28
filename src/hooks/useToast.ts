import { useState, useCallback } from 'react';

export interface ToastData {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  autoCloseDelay?: number;
  showCountdown?: boolean;
  countdownText?: string;
  actionButton?: {
    text: string;
    onClick: () => void;
  };
}

export const useToast = () => {
  const [toast, setToast] = useState<ToastData | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const showToast = useCallback((toastData: ToastData) => {
    setToast(toastData);
    setIsVisible(true);
  }, []);

  const hideToast = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => setToast(null), 300); // Wait for animation to complete
  }, []);

  const showSuccess = useCallback((title: string, message: string, autoCloseDelay = 5) => {
    showToast({
      type: 'success',
      title,
      message,
      autoCloseDelay,
      showCountdown: true
    });
  }, [showToast]);

  const showError = useCallback((title: string, message: string, autoCloseDelay = 8) => {
    showToast({
      type: 'error',
      title,
      message,
      autoCloseDelay,
      showCountdown: true
    });
  }, [showToast]);

  const showWarning = useCallback((title: string, message: string, autoCloseDelay = 6) => {
    showToast({
      type: 'warning',
      title,
      message,
      autoCloseDelay,
      showCountdown: true
    });
  }, [showToast]);

  const showInfo = useCallback((title: string, message: string, autoCloseDelay = 5) => {
    showToast({
      type: 'info',
      title,
      message,
      autoCloseDelay,
      showCountdown: true
    });
  }, [showToast]);

  return {
    toast,
    isVisible,
    showToast,
    hideToast,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
};