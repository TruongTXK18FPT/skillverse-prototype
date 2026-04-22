/**
 * [Nghiệp vụ] Form cho mentor submit completion report cho journey.
 *
 * Đây là bước quan trọng để "mở khóa" final gate cho learner hoàn thành journey.
 */
import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  Send,
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { ConfirmJourneyCompletionRequest, GateDecision } from '../../types/NodeMentoring';
import { submitCompletionReport } from '../../services/nodeMentoringService';
import './MentorCompletionReportForm.css';

interface MentorCompletionReportFormProps {
  journeyId: number;
  journeyTitle?: string;
  learnerName?: string;
  bookingId?: number;
  onSubmitted?: () => void;
  onCancel?: () => void;
}

const MentorCompletionReportForm: React.FC<MentorCompletionReportFormProps> = ({
  journeyId,
  journeyTitle,
  learnerName,
  bookingId,
  onSubmitted,
  onCancel,
}) => {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);

  // Form state
  const [gateDecision, setGateDecision] = useState<GateDecision>('PASS');
  const [completionNote, setCompletionNote] = useState('');

  const canSubmit = !loading;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    try {
      setLoading(true);
      const request: ConfirmJourneyCompletionRequest = {
        gateDecision,
        completionNote: completionNote.trim() || undefined,
        bookingId,
      };

      await submitCompletionReport(journeyId, request);
      showSuccess(
        'Thành công',
        `Đã ${gateDecision === 'PASS' ? 'xác nhận' : 'từ chối'} hoàn thành journey`
      );
      onSubmitted?.();
    } catch (err: any) {
      showError('Lỗi', err.response?.data?.message || 'Không thể xác nhận hoàn thành');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mcrf-container">
      <div className="mcrf-header">
        <ShieldCheck size={22} />
        <div>
          <h3>Xác nhận hoàn thành Journey</h3>
          {journeyTitle && <p className="mcrf-subtitle">{journeyTitle}</p>}
        </div>
      </div>

      <div className="mcrf-content">
        {learnerName && (
          <div className="mcrf-learner">
            <span className="mcrf-label">Learner:</span>
            <span className="mcrf-value">{learnerName}</span>
          </div>
        )}

        <div className="mcrf-form-group">
          <label>Quyết định xác nhận:</label>
          <div className="mcrf-decision-options">
            <button
              type="button"
              className={`mcrf-decision-btn ${gateDecision === 'PASS' ? 'active' : ''}`}
              onClick={() => setGateDecision('PASS')}
            >
              <CheckCircle size={18} />
              <div className="mcrf-decision-info">
                <span className="mcrf-decision-label">PASS</span>
                <span className="mcrf-decision-desc">Cho phép learner hoàn thành journey</span>
              </div>
            </button>
            <button
              type="button"
              className={`mcrf-decision-btn ${gateDecision === 'FAIL' ? 'active' : ''}`}
              onClick={() => setGateDecision('FAIL')}
            >
              <XCircle size={18} />
              <div className="mcrf-decision-info">
                <span className="mcrf-decision-label">FAIL</span>
                <span className="mcrf-decision-desc">Từ chối hoàn thành journey</span>
              </div>
            </button>
          </div>
        </div>

        <div className="mcrf-form-group">
          <label>Ghi chú (tùy chọn):</label>
          <textarea
            value={completionNote}
            onChange={(e) => setCompletionNote(e.target.value)}
            className="mcrf-textarea"
            rows={4}
            placeholder={`Nhập ghi chú về quyết định ${gateDecision === 'PASS' ? 'xác nhận' : 'từ chối'}...`}
          />
        </div>

        <div className="mcrf-warning">
          <strong>Lưu ý:</strong> Quyết định này sẽ ảnh hưởng đến việc learner có thể hoàn thành journey hay không.
          {gateDecision === 'PASS'
            ? ' PASS sẽ mở khóa gate cho phép learner complete.'
            : ' FAIL sẽ yêu cầu learner cần cải thiện thêm.'}
        </div>
      </div>

      <div className="mcrf-actions">
        {onCancel && (
          <button className="mcrf-btn mcrf-btn-secondary" onClick={onCancel} disabled={loading}>
            Hủy
          </button>
        )}
        <button
          className="mcrf-btn mcrf-btn-primary"
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          {loading ? (
            'Đang xử lý...'
          ) : (
            <>
              <Send size={16} /> Gửi xác nhận
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default MentorCompletionReportForm;
