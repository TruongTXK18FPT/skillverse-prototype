import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import Toast from "../components/shared/Toast";

export interface GlobalToastDetail {
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
  autoCloseDelay?: number;
  showCountdown?: boolean;
}

interface ToastContextValue {
  showToast: (detail: GlobalToastDetail) => void;
  showSuccess: (
    title: string,
    message: string,
    autoCloseDelay?: number,
  ) => void;
  showError: (
    title: string,
    message: string,
    autoCloseDelay?: number,
  ) => void;
  showWarning: (
    title: string,
    message: string,
    autoCloseDelay?: number,
  ) => void;
  showInfo: (
    title: string,
    message: string,
    autoCloseDelay?: number,
  ) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const noop = (): void => {};

let toastExecutor: ToastContextValue = {
  showToast: noop,
  showSuccess: noop,
  showError: noop,
  showWarning: noop,
  showInfo: noop,
};

export const showAppToast = (detail: GlobalToastDetail): void => {
  toastExecutor.showToast(detail);
};

export const showAppSuccess = (
  title: string,
  message: string,
  autoCloseDelay = 5,
): void => {
  toastExecutor.showSuccess(title, message, autoCloseDelay);
};

export const showAppError = (
  title: string,
  message: string,
  autoCloseDelay = 8,
): void => {
  toastExecutor.showError(title, message, autoCloseDelay);
};

export const showAppWarning = (
  title: string,
  message: string,
  autoCloseDelay = 6,
): void => {
  toastExecutor.showWarning(title, message, autoCloseDelay);
};

export const showAppInfo = (
  title: string,
  message: string,
  autoCloseDelay = 5,
): void => {
  toastExecutor.showInfo(title, message, autoCloseDelay);
};

export const useAppToast = (): ToastContextValue => {
  const context = useContext(ToastContext);

  if (!context) {
    return toastExecutor;
  }

  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toast, setToast] = useState<GlobalToastDetail | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const hideToast = useCallback(() => {
    setIsVisible(false);
    window.setTimeout(() => setToast(null), 300);
  }, []);

  const showToast = useCallback((detail: GlobalToastDetail) => {
    setToast(detail);
    setIsVisible(true);
  }, []);

  const contextValue = useMemo<ToastContextValue>(
    () => ({
      showToast,
      showSuccess: (title, message, autoCloseDelay = 5) =>
        showToast({
          type: "success",
          title,
          message,
          autoCloseDelay,
          showCountdown: true,
        }),
      showError: (title, message, autoCloseDelay = 8) =>
        showToast({
          type: "error",
          title,
          message,
          autoCloseDelay,
          showCountdown: true,
        }),
      showWarning: (title, message, autoCloseDelay = 6) =>
        showToast({
          type: "warning",
          title,
          message,
          autoCloseDelay,
          showCountdown: true,
        }),
      showInfo: (title, message, autoCloseDelay = 5) =>
        showToast({
          type: "info",
          title,
          message,
          autoCloseDelay,
          showCountdown: true,
        }),
    }),
    [showToast],
  );

  useEffect(() => {
    toastExecutor = contextValue;

    return () => {
      toastExecutor = {
        showToast: noop,
        showSuccess: noop,
        showError: noop,
        showWarning: noop,
        showInfo: noop,
      };
    };
  }, [contextValue]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {toast && (
        <Toast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          isVisible={isVisible}
          onClose={hideToast}
          autoCloseDelay={toast.autoCloseDelay}
          showCountdown={toast.showCountdown}
        />
      )}
    </ToastContext.Provider>
  );
};
