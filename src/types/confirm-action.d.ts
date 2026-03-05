import type { ConfirmDialogOptions } from "../context/ConfirmDialogContext";

declare global {
  function confirmAction(options: ConfirmDialogOptions | string): Promise<boolean>;
}

export {};

