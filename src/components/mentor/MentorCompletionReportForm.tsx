/**
 * MentorCompletionReportForm — Phase 5 Redesign
 *
 * Enhanced completion report with auto-generated summary from workspace data:
 * - Total nodes completed / total
 * - Meetings scheduled / completed
 * - Assessment status
 * - Performance rating (1-10)
 * - Detailed mentor notes + suggestions for next steps
 *
 * Replaces the minimal PASS/FAIL form with a comprehensive report builder.
 */
import React, { useState, useMemo } from 'react';
import {
  ShieldCheck, CheckCircle, XCircle, Send, Award,
  Layers, Calendar, FileText, Star, TrendingUp, AlertTriangle,
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { ConfirmJourneyCompletionRequest, GateDecision } from '../../types/NodeMentoring';
import { submitCompletionReport } from '../../services/nodeMentoringService';
import './MentorCompletionReportForm.css';

interface WorkspaceSummary {
  totalNodes?: number;
  mainNodes?: number;
  sideNodes?: number;
  totalMeetings?: number;
  completedMeetings?: number;
  assessmentStatus?: string;
  learnerName?: string;
  bookingStatus?: string;
}

interface MentorCompletionReportFormProps {
  journeyId: number;
  journeyTitle?: string;
  learnerName?: string;
  bookingId?: number;
  /** Auto-summary data from workspace */
  workspaceSummary?: WorkspaceSummary;
  onSubmitted?: () => void;
  onCancel?: () => void;
}

const MentorCompletionReportForm: React.FC<MentorCompletionReportFormProps> = ({
  journeyId,
  journeyTitle,
  learnerName,
  bookingId,
  workspaceSummary,
  onSubmitted,
  onCancel,
}) => {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);

  // Form state
  const [gateDecision, setGateDecision] = useState<GateDecision>('PASS');
  const [completionNote, setCompletionNote] = useState('');
  const [performanceRating, setPerformanceRating] = useState(7);
  const [strengths, setStrengths] = useState('');
  const [improvements, setImprovements] = useState('');
  const [nextSteps, setNextSteps] = useState('');

  const canSubmit = !loading;

  // Build the comprehensive completion note from all fields
  const buildCompletionNote = useMemo(() => {
    const parts: string[] = [];

    if (performanceRating) {
      parts.push(`📊 Đánh giá tổng thể: ${performanceRating}/10`);
    }

    if (completionNote.trim()) {
      parts.push(`\n📝 Nhận xét chung:\n${completionNote.trim()}`);
    }

    if (strengths.trim()) {
      parts.push(`\n💪 Điểm mạnh:\n${strengths.trim()}`);
    }

    if (improvements.trim()) {
      parts.push(`\n🔧 Cần cải thiện:\n${improvements.trim()}`);
    }

    if (nextSteps.trim()) {
      parts.push(`\n🚀 Gợi ý tiếp theo:\n${nextSteps.trim()}`);
    }

    if (workspaceSummary) {
      const ws = workspaceSummary;
      const summaryLines: string[] = [];
      if (ws.totalNodes) summaryLines.push(`Roadmap: ${ws.totalNodes} nodes (${ws.mainNodes || 0} chính, ${ws.sideNodes || 0} phụ)`);
      if (ws.totalMeetings) summaryLines.push(`Meetings: ${ws.completedMeetings || 0}/${ws.totalMeetings} hoàn thành`);
      if (ws.assessmentStatus) summaryLines.push(`Output Assessment: ${ws.assessmentStatus}`);
      if (summaryLines.length > 0) {
        parts.push(`\n📋 Tóm tắt tự động:\n${summaryLines.join('\n')}`);
      }
    }

    return parts.join('\n');
  }, [completionNote, performanceRating, strengths, improvements, nextSteps, workspaceSummary]);

  const handleSubmit = async () => {
    if (!canSubmit) return;

    try {
      setLoading(true);
      const request: ConfirmJourneyCompletionRequest = {
        gateDecision,
        completionNote: buildCompletionNote || undefined,
        bookingId,
      };

      await submitCompletionReport(journeyId, request);
      showSuccess(
        'Thành công',
        `Đã ${gateDecision === 'PASS' ? 'xác nhận hoàn thành' : 'từ chối'} journey`
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
      {/* Header */}
      <div className="mcrf-header">
        <div className="mcrf-header-icon"><ShieldCheck size={22} /></div>
        <div>
          <h3>Xác nhận hoàn thành Journey</h3>
          {journeyTitle && <p className="mcrf-subtitle">{journeyTitle}</p>}
        </div>
      </div>

      <div className="mcrf-content">
        {/* Auto Summary Cards */}
        {workspaceSummary && (
          <div className="mcrf-summary-grid">
            <div className="mcrf-summary-card">
              <Layers size={16} />
              <div>
                <span className="mcrf-summary-value">{workspaceSummary.totalNodes || 0}</span>
                <span className="mcrf-summary-label">Nodes</span>
              </div>
            </div>
            <div className="mcrf-summary-card">
              <Calendar size={16} />
              <div>
                <span className="mcrf-summary-value">
                  {workspaceSummary.completedMeetings || 0}/{workspaceSummary.totalMeetings || 0}
                </span>
                <span className="mcrf-summary-label">Meetings</span>
              </div>
            </div>
            <div className="mcrf-summary-card">
              <FileText size={16} />
              <div>
                <span className="mcrf-summary-value">{workspaceSummary.assessmentStatus || 'N/A'}</span>
                <span className="mcrf-summary-label">Assessment</span>
              </div>
            </div>
          </div>
        )}

        {/* Learner info */}
        {learnerName && (
          <div className="mcrf-learner">
            <span className="mcrf-label">Học viên:</span>
            <span className="mcrf-value">{learnerName}</span>
          </div>
        )}

        {/* Gate Decision */}
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
                <span className="mcrf-decision-desc">Từ chối hoàn thành — yêu cầu cải thiện</span>
              </div>
            </button>
          </div>
        </div>

        {/* Performance Rating */}
        <div className="mcrf-form-group">
          <label><Star size={14} /> Đánh giá hiệu suất ({performanceRating}/10):</label>
          <div className="mcrf-rating-slider">
            <input
              type="range"
              min={1}
              max={10}
              value={performanceRating}
              onChange={(e) => setPerformanceRating(Number(e.target.value))}
              className="mcrf-slider"
            />
            <div className="mcrf-rating-labels">
              <span>1</span>
              <span>5</span>
              <span>10</span>
            </div>
          </div>
          <div className="mcrf-rating-stars">
            {Array.from({ length: 10 }, (_, i) => (
              <Star
                key={i}
                size={18}
                fill={i < performanceRating ? '#22d3ee' : 'transparent'}
                color={i < performanceRating ? '#22d3ee' : '#334155'}
                style={{ cursor: 'pointer', transition: 'all 0.15s' }}
                onClick={() => setPerformanceRating(i + 1)}
              />
            ))}
          </div>
        </div>

        {/* Main Note */}
        <div className="mcrf-form-group">
          <label>Nhận xét chung:</label>
          <textarea
            value={completionNote}
            onChange={(e) => setCompletionNote(e.target.value)}
            className="mcrf-textarea"
            rows={3}
            placeholder="Nhận xét tổng quan về quá trình học..."
          />
        </div>

        {/* Strengths */}
        <div className="mcrf-form-group">
          <label><TrendingUp size={14} /> Điểm mạnh:</label>
          <textarea
            value={strengths}
            onChange={(e) => setStrengths(e.target.value)}
            className="mcrf-textarea"
            rows={2}
            placeholder="Những điểm mạnh nổi bật của học viên..."
          />
        </div>

        {/* Improvements */}
        <div className="mcrf-form-group">
          <label><AlertTriangle size={14} /> Cần cải thiện:</label>
          <textarea
            value={improvements}
            onChange={(e) => setImprovements(e.target.value)}
            className="mcrf-textarea"
            rows={2}
            placeholder="Những lĩnh vực cần cải thiện..."
          />
        </div>

        {/* Next Steps */}
        <div className="mcrf-form-group">
          <label><Award size={14} /> Gợi ý bước tiếp theo:</label>
          <textarea
            value={nextSteps}
            onChange={(e) => setNextSteps(e.target.value)}
            className="mcrf-textarea"
            rows={2}
            placeholder="Khuyến nghị cho hành trình tiếp theo..."
          />
        </div>

        {/* Warning */}
        <div className="mcrf-warning">
          <strong>Lưu ý:</strong> Quyết định này sẽ ảnh hưởng đến việc learner có thể hoàn thành journey hay không.
          {gateDecision === 'PASS'
            ? ' PASS sẽ mở khóa gate cho phép learner complete.'
            : ' FAIL sẽ yêu cầu learner cần cải thiện thêm.'}
        </div>
      </div>

      {/* Actions */}
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
            <><Send size={16} /> Gửi Report & Xác nhận</>
          )}
        </button>
      </div>
    </div>
  );
};

export default MentorCompletionReportForm;
