import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import ConfirmDialog, { ConfirmVariant } from "../components/shared/ConfirmDialog";

export interface ConfirmDialogOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
}

type ConfirmFunction = (options: ConfirmDialogOptions | string) => Promise<boolean>;

interface ConfirmDialogState {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  variant: ConfirmVariant;
}

export const ConfirmDialogContext = createContext<ConfirmFunction | null>(null);

const fallbackConfirm: ConfirmFunction = async (options) => {
  const message = typeof options === "string" ? options : options.message;
  return window.confirm(message);
};

let confirmExecutor: ConfirmFunction = fallbackConfirm;

export const confirmAction: ConfirmFunction = (options) => confirmExecutor(options);

if (typeof globalThis !== "undefined") {
  (globalThis as { confirmAction?: ConfirmFunction }).confirmAction = confirmAction;
}

export const ConfirmDialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dialogState, setDialogState] = useState<ConfirmDialogState | null>(null);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const closeDialog = useCallback((value: boolean) => {
    if (resolverRef.current) {
      resolverRef.current(value);
      resolverRef.current = null;
    }
    setDialogState(null);
  }, []);

  const confirm = useCallback<ConfirmFunction>((options) => {
    const normalized: ConfirmDialogOptions =
      typeof options === "string"
        ? { message: options }
        : options;

    return new Promise<boolean>((resolve) => {
      if (resolverRef.current) {
        resolverRef.current(false);
      }

      resolverRef.current = resolve;
      setDialogState({
        title: normalized.title ?? "Xác nhận thao tác",
        message: normalized.message,
        confirmLabel: normalized.confirmLabel ?? "Xác nhận",
        cancelLabel: normalized.cancelLabel ?? "Hủy",
        variant: normalized.variant ?? "default",
      });
    });
  }, []);

  useEffect(() => {
    confirmExecutor = confirm;

    return () => {
      confirmExecutor = fallbackConfirm;
      if (resolverRef.current) {
        resolverRef.current(false);
        resolverRef.current = null;
      }
    };
  }, [confirm]);

  const contextValue = useMemo(() => confirm, [confirm]);

  return (
    <ConfirmDialogContext.Provider value={contextValue}>
      {children}
      <ConfirmDialog
        isOpen={Boolean(dialogState)}
        title={dialogState?.title ?? ""}
        message={dialogState?.message ?? ""}
        confirmLabel={dialogState?.confirmLabel}
        cancelLabel={dialogState?.cancelLabel}
        variant={dialogState?.variant}
        onConfirm={() => closeDialog(true)}
        onCancel={() => closeDialog(false)}
      />
    </ConfirmDialogContext.Provider>
  );
};
