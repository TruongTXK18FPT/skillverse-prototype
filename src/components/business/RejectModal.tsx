import React, { useState } from 'react';
import jobService from '../../services/jobService';
import { JobApplicationStatus } from '../../data/jobDTOs';
import { useToast } from '../../hooks/useToast';
import './RejectModal.css';

interface RejectModalProps {
  applicationId: number;
  applicantName: string;
  onClose: () => void;
  onSuccess: () => void;
}

const RejectModal: React.FC<RejectModalProps> = ({
  applicationId,
  applicantName,
  onClose,
  onSuccess
}) => {
  const { showSuccess, showError } = useToast();
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!rejectionReason.trim()) {
      setError('Lý do từ chối là bắt buộc');
      return;
    }
    if (rejectionReason.length > 300) {
      setError('Lý do không được vượt quá 300 ký tự');
      return;
    }

    setIsSubmitting(true);

    try {
      await jobService.updateApplicationStatus(applicationId, {
        status: 'REJECTED' as JobApplicationStatus,
        acceptanceMessage: undefined,
        rejectionReason: rejectionReason.trim()
      });

      showSuccess('Thành Công', `Đã từ chối ứng viên ${applicantName}`);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error rejecting application:', error);
      showError('Lỗi Từ Chối', error instanceof Error ? error.message : 'Không thể từ chối ứng viên');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rjm-modal-overlay" onClick={onClose}>
      <div className="rjm-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="rjm-modal-header">
          <h3>❌ Từ Chối Ứng Viên</h3>
          <button className="rjm-close-modal" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="rjm-modal-body">
          <div className="rjm-applicant-info">
            <p>
              Bạn đang từ chối ứng viên: <strong>{applicantName}</strong>
            </p>
          </div>

          <div className="rjm-form-group">
            <label htmlFor="rejectionReason">
              Lý Do Từ Chối *
              <span className="rjm-char-count">
                {rejectionReason.length}/300
              </span>
            </label>
            <textarea
              id="rejectionReason"
              value={rejectionReason}
              onChange={(e) => {
                setRejectionReason(e.target.value);
                setError('');
              }}
              placeholder="Cảm ơn bạn đã ứng tuyển. Tuy nhiên, chúng tôi đã tìm được ứng viên phù hợp hơn cho vị trí này..."
              rows={5}
              maxLength={300}
              className={error ? 'error' : ''}
            />
            {error && <span className="rjm-error-message">{error}</span>}
            <small className="rjm-helper-text">
              Lý do này sẽ được gửi qua email đến ứng viên cùng với thông báo từ chối.
            </small>
          </div>

          <div className="rjm-modal-actions">
            <button
              type="button"
              className="rjm-btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="rjm-btn-danger"
              disabled={isSubmitting}
            >
              {isSubmitting ? '⏳ Đang Xử Lý...' : '❌ Xác Nhận Từ Chối'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RejectModal;
