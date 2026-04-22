/**
 * [Nghiệp vụ] Dossier hiển thị toàn bộ trạng thái verification của một journey.
 *
 * Read-only viewer cho mentor xem tổng quan trước khi đưa ra quyết định final.
 * Mirror pattern từ MentorVerificationAdminTab (detail modal view).
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  FileText,
  ExternalLink,
  BookOpen,
  Target,
  User,
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import {
  JourneyCompletionGateResponse,
  JourneyOutputAssessmentResponse,
  NodeEvidenceRecordResponse,
} from '../../types/NodeMentoring';
import { getCompletionGate, getLatestOutputAssessment } from '../../services/nodeMentoringService';
import './JourneyVerificationDossier.css';

interface JourneyVerificationDossierProps {
  journeyId: number;
  journeyTitle?: string;
  learnerName?: string;
  /** Node evidences đã được load từ ngoài (optional) */
  nodeEvidences?: NodeEvidenceRecordResponse[];
  readonly?: boolean;
}

const JourneyVerificationDossier: React.FC<JourneyVerificationDossierProps> = ({
  journeyId,
  journeyTitle,
  learnerName,
  nodeEvidences = [],
  readonly = true,
}) => {
  const { showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [gate, setGate] = useState<JourneyCompletionGateResponse | null>(null);
  const [outputAssessment, setOutputAssessment] = useState<JourneyOutputAssessmentResponse | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [gateData, assessmentData] = await Promise.all([
        getCompletionGate(journeyId),
        getLatestOutputAssessment(journeyId),
      ]);
      setGate(gateData);
      setOutputAssessment(assessmentData);
    } catch (err: any) {
      showError('Lỗi tải dữ liệu', err.response?.data?.message || 'Không thể tải dossier');
    } finally {
      setLoading(false);
    }
  }, [journeyId, showError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getGateBadge = (status: string) => {
    switch (status) {
      case 'PASSED':
        return (
          <span className="jvd-badge jvd-badge-success">
            <CheckCircle size={14} /> PASS
          </span>
        );
      case 'BLOCKED':
        return (
          <span className="jvd-badge jvd-badge-danger">
            <XCircle size={14} /> BLOCKED
          </span>
        );
      case 'NOT_REQUIRED':
        return (
          <span className="jvd-badge jvd-badge-muted">
            Không yêu cầu
          </span>
        );
      default:
        return (
          <span className="jvd-badge jvd-badge-warning">
            <Clock size={14} /> Chờ xác nhận
          </span>
        );
    }
  };

  const getNodeStatusIcon = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return <CheckCircle size={16} className="jvd-icon-success" />;
      case 'REJECTED':
        return <XCircle size={16} className="jvd-icon-danger" />;
      case 'UNDER_REVIEW':
        return <Clock size={16} className="jvd-icon-warning" />;
      default:
        return <Clock size={16} className="jvd-icon-muted" />;
    }
  };

  if (loading) {
    return (
      <div className="jvd-container">
        <div className="jvd-loading">Đang tải dossier...</div>
      </div>
    );
  }

  if (!gate) {
    return (
      <div className="jvd-container">
        <div className="jvd-error">
          <AlertCircle size={32} />
          <p>Không thể tải thông tin verification.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="jvd-container">
      {/* Header */}
      <div className="jvd-header">
        <div className="jvd-header-main">
          <ShieldCheck size={24} />
          <div>
            <h2 className="jvd-title">Journey Verification Dossier</h2>
            {journeyTitle && <p className="jvd-subtitle">{journeyTitle}</p>}
          </div>
        </div>
        <div className="jvd-header-meta">
          {learnerName && (
            <span className="jvd-meta-item">
              <User size={14} /> {learnerName}
            </span>
          )}
          <span className="jvd-meta-item">
            <BookOpen size={14} /> Journey #{journeyId}
          </span>
        </div>
      </div>

      {/* Gate Status Card */}
      <div className="jvd-card jvd-gate-card">
        <div className="jvd-card-header">
          <h3>Final Gate Status</h3>
          {getGateBadge(gate.finalGateStatus)}
        </div>

        <div className="jvd-checklist">
          <div className={`jvd-check-item ${gate.hasPassCompletionReport ? 'passed' : ''}`}>
            {gate.hasPassCompletionReport ? (
              <CheckCircle size={18} />
            ) : (
              <Clock size={18} />
            )}
            <span>Completion Report từ Mentor</span>
          </div>
          <div className={`jvd-check-item ${gate.outputAssessmentApproved ? 'passed' : ''}`}>
            {gate.outputAssessmentApproved ? (
              <CheckCircle size={18} />
            ) : (
              <Clock size={18} />
            )}
            <span>Output Assessment đã duyệt</span>
          </div>
          <div className={`jvd-check-item ${gate.finalVerificationRequired ? 'required' : ''}`}>
            {gate.finalVerificationRequired ? (
              <ShieldCheck size={18} />
            ) : (
              <CheckCircle size={18} />
            )}
            <span>
              {gate.finalVerificationRequired
                ? 'Yêu cầu final verification'
                : 'Không yêu cầu final verification'}
            </span>
          </div>
        </div>

        {gate.blockingReasons.length > 0 && (
          <div className="jvd-blocking">
            <h4><AlertCircle size={16} /> Lý do chưa thể hoàn thành:</h4>
            <ul>
              {gate.blockingReasons.map((reason, idx) => (
                <li key={idx}>{reason}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Output Assessment Section */}
      {gate.journeyOutputVerificationRequired && (
        <div className="jvd-card">
          <div className="jvd-card-header">
            <h3><FileText size={18} /> Output Assessment</h3>
            {outputAssessment && (
              <span className={`jvd-assessment-status ${outputAssessment.assessmentStatus.toLowerCase()}`}>
                {outputAssessment.assessmentStatus}
              </span>
            )}
          </div>

          {outputAssessment ? (
            <div className="jvd-assessment-content">
              <div className="jvd-field">
                <label>Nội dung từ learner:</label>
                <div className="jvd-text">{outputAssessment.submissionText || '(Không có nội dung)'}</div>
              </div>

              {outputAssessment.evidenceUrl && (
                <div className="jvd-field">
                  <label>Evidence:</label>
                  <a
                    href={outputAssessment.evidenceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="jvd-link"
                  >
                    <ExternalLink size={14} /> Xem evidence
                  </a>
                </div>
              )}

              {outputAssessment.attachmentUrl && (
                <div className="jvd-field">
                  <label>Attachment:</label>
                  <a
                    href={outputAssessment.attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="jvd-link"
                  >
                    <ExternalLink size={14} /> Tải attachment
                  </a>
                </div>
              )}

              {outputAssessment.feedback && (
                <div className="jvd-field">
                  <label>Feedback từ mentor:</label>
                  <div className="jvd-feedback">{outputAssessment.feedback}</div>
                </div>
              )}

              {outputAssessment.score !== undefined && outputAssessment.score !== null && (
                <div className="jvd-field">
                  <label>Điểm:</label>
                  <span className="jvd-score">{outputAssessment.score}/100</span>
                </div>
              )}
            </div>
          ) : (
            <div className="jvd-empty">
              <Clock size={32} />
              <p>Learner chưa nộp output assessment.</p>
            </div>
          )}
        </div>
      )}

      {/* Node Evidences Summary */}
      {nodeEvidences.length > 0 && (
        <div className="jvd-card">
          <div className="jvd-card-header">
            <h3><Target size={18} /> Node Submissions ({nodeEvidences.length})</h3>
          </div>
          <div className="jvd-nodes-list">
            {nodeEvidences.map((evidence) => (
              <div key={evidence.id} className="jvd-node-item">
                <div className="jvd-node-status">
                  {getNodeStatusIcon(evidence.verificationStatus)}
                </div>
                <div className="jvd-node-info">
                  <span className="jvd-node-id">Node: {evidence.nodeId}</span>
                  <span className="jvd-node-verification">{evidence.verificationStatus}</span>
                </div>
                {evidence.latestReview && (
                  <div className="jvd-node-review">
                    Review: {evidence.latestReview.reviewResult}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {readonly && (
        <div className="jvd-readonly-notice">
          <AlertCircle size={14} /> Chế độ xem chỉ đọc
        </div>
      )}
    </div>
  );
};

export default JourneyVerificationDossier;
