import React, { useEffect } from 'react';
import { AlertTriangle, Loader2, Trash2, X } from 'lucide-react';
import '../styles/StudyPlanner.css';

interface ClearOverdueConfirmModalProps {
  isOpen: boolean;
  targetCount: number;
  overdueDays: number;
  scopeLabel: string;
  isSubmitting: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}

const ClearOverdueConfirmModal: React.FC<ClearOverdueConfirmModalProps> = ({
  isOpen,
  targetCount,
  overdueDays,
  scopeLabel,
  isSubmitting,
  onCancel,
  onConfirm,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmitting) {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, isSubmitting, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="study-plan-clear-overdue-modal-overlay"
      onClick={() => {
        if (!isSubmitting) onCancel();
      }}
    >
      <div
        className="study-plan-clear-overdue-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="study-plan-clear-overdue-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="study-plan-clear-overdue-modal-header">
          <div className="study-plan-clear-overdue-modal-heading">
            <AlertTriangle size={18} />
            <h3 id="study-plan-clear-overdue-modal-title">
              Xác nhận xóa task quá hạn
            </h3>
          </div>
          <button
            type="button"
            className="study-plan-clear-overdue-modal-close-btn"
            onClick={onCancel}
            disabled={isSubmitting}
            aria-label="Đóng"
          >
            <X size={16} />
          </button>
        </div>

        <div className="study-plan-clear-overdue-modal-body">
          <p>
            Bạn sắp xóa <strong>{targetCount}</strong> task quá hạn hơn{' '}
            <strong>{overdueDays} ngày</strong> trong <strong>{scopeLabel}</strong>.
          </p>
          <p>Hành động này không thể hoàn tác.</p>
        </div>

        <div className="study-plan-clear-overdue-modal-actions">
          <button
            type="button"
            className="study-plan-clear-overdue-modal-btn study-plan-clear-overdue-modal-btn--cancel"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Hủy
          </button>
          <button
            type="button"
            className="study-plan-clear-overdue-modal-btn study-plan-clear-overdue-modal-btn--confirm"
            onClick={() => void onConfirm()}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={14} className="study-plan-clear-overdue-modal-spinner" />
                Đang xóa...
              </>
            ) : (
              <>
                <Trash2 size={14} />
                Xóa ngay
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClearOverdueConfirmModal;
