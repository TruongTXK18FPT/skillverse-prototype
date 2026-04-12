import { useState, useCallback, useRef } from 'react';

export interface ToastData {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  autoCloseDelay?: number;
  showCountdown?: boolean;
  countdownText?: string;
  useOverlay?: boolean;
  actionButton?: {
    text: string;
    onClick: () => void;
  };
  secondaryActionButton?: {
    text: string;
    onClick: () => void;
  };
}

export const useToast = () => {
  const [toast, setToast] = useState<ToastData | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((toastData: ToastData) => {
    // Cancel any pending hide timer so new toast is never blocked
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    setToast(toastData);
    setIsVisible(true);
  }, []);

  const hideToast = useCallback(() => {
    setIsVisible(false);
    // Clear toast data after animation (300ms) to prevent blocking next toast
    hideTimerRef.current = setTimeout(() => {
      setToast(null);
      hideTimerRef.current = null;
    }, 300);
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