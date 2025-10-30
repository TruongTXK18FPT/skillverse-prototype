import React, { useState } from 'react';
import jobService from '../../services/jobService';
import { JobApplicationStatus } from '../../data/jobDTOs';
import { useToast } from '../../hooks/useToast';
import './AcceptModal.css';

interface AcceptModalProps {
  applicationId: number;
  applicantName: string;
  onClose: () => void;
  onSuccess: () => void;
}

const AcceptModal: React.FC<AcceptModalProps> = ({
  applicationId,
  applicantName,
  onClose,
  onSuccess
}) => {
  const { showSuccess, showError } = useToast();
  const [acceptanceMessage, setAcceptanceMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!acceptanceMessage.trim()) {
      setError('Tin nhắn chấp nhận là bắt buộc');
      return;
    }
    if (acceptanceMessage.length > 500) {
      setError('Tin nhắn không được vượt quá 500 ký tự');
      return;
    }

    setIsSubmitting(true);

    try {
      await jobService.updateApplicationStatus(applicationId, {
        status: 'ACCEPTED' as JobApplicationStatus,
        acceptanceMessage: acceptanceMessage.trim(),
        rejectionReason: undefined
      });

      showSuccess('Thành Công', `Đã chấp nhận ứng viên ${applicantName}`);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error accepting application:', error);
      showError('Lỗi Chấp Nhận', error instanceof Error ? error.message : 'Không thể chấp nhận ứng viên');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="acm-modal-overlay" onClick={onClose}>
      <div className="acm-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="acm-modal-header">
          <h3>✅ Chấp Nhận Ứng Viên</h3>
          <button className="acm-close-modal" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="acm-modal-body">
          <div className="acm-applicant-info">
            <p>
              Bạn đang chấp nhận ứng viên: <strong>{applicantName}</strong>
            </p>
          </div>

          <div className="acm-form-group">
            <label htmlFor="acceptanceMessage">
              Tin Nhắn Chấp Nhận *
              <span className="acm-char-count">
                {acceptanceMessage.length}/500
              </span>
            </label>
            <textarea
              id="acceptanceMessage"
              value={acceptanceMessage}
              onChange={(e) => {
                setAcceptanceMessage(e.target.value);
                setError('');
              }}
              placeholder="Chúc mừng! Bạn đã được chấp nhận cho vị trí này. Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất..."
              rows={6}
              maxLength={500}
              className={error ? 'error' : ''}
            />
            {error && <span className="acm-error-message">{error}</span>}
            <small className="acm-helper-text">
              Tin nhắn này sẽ được gửi qua email đến ứng viên cùng với thông báo chấp nhận.
            </small>
          </div>

          <div className="acm-modal-actions">
            <button
              type="button"
              className="acm-btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="acm-btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? '⏳ Đang Xử Lý...' : '✅ Xác Nhận Chấp Nhận'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AcceptModal;
