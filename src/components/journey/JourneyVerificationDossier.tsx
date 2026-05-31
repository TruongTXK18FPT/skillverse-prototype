/**
 * [Nghiệp vụ] Dossier hiển thị toàn bộ trạng thái verification của một journey.
 *
 * Read-only viewer cho mentor xem tổng quan trước khi đưa ra quyết định final.
 * Nâng cấp giao diện trang trọng, chuyên nghiệp, thuần Việt và cá nhân hóa sâu sắc.
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
  Award,
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
  learnerAvatar?: string; // Avatar ảnh của người học để cá nhân hóa
  /** Node evidences đã được load từ ngoài (optional) */
  nodeEvidences?: NodeEvidenceRecordResponse[];
  readonly?: boolean;
}

const JourneyVerificationDossier: React.FC<JourneyVerificationDossierProps> = ({
  journeyId,
  journeyTitle,
  learnerName,
  learnerAvatar,
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
      showError('Lỗi tải dữ liệu', err.response?.data?.message || 'Không thể tải hồ sơ thẩm định');
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
            <CheckCircle size={13} /> ĐÃ THÔNG QUA
          </span>
        );
      case 'BLOCKED':
        return (
          <span className="jvd-badge jvd-badge-danger">
            <XCircle size={13} /> CHƯA ĐẠT CỔNG
          </span>
        );
      case 'NOT_REQUIRED':
        return (
          <span className="jvd-badge jvd-badge-muted">
            KHÔNG YÊU CẦU
          </span>
        );
      default:
        return (
          <span className="jvd-badge jvd-badge-warning">
            <Clock size={13} /> CHỜ THẨM ĐỊNH
          </span>
        );
    }
  };

  const getNodeStatusLabel = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return 'Đã xác thực';
      case 'REJECTED':
        return 'Từ chối';
      case 'UNDER_REVIEW':
        return 'Đang thẩm định';
      default:
        return 'Chờ thực hành';
    }
  };

  const getNodeStatusIcon = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return <CheckCircle size={15} className="jvd-icon-success" />;
      case 'REJECTED':
        return <XCircle size={15} className="jvd-icon-danger" />;
      case 'UNDER_REVIEW':
        return <Clock size={15} className="jvd-icon-warning" />;
      default:
        return <Clock size={15} className="jvd-icon-muted" />;
    }
  };

  if (loading) {
    return (
      <div className="jvd-container jvd-loading-wrapper">
        <div className="jvd-loading">Đang tải hồ sơ chứng nhận...</div>
      </div>
    );
  }

  if (!gate) {
    return (
      <div className="jvd-container jvd-error-wrapper">
        <div className="jvd-error">
          <AlertCircle size={28} />
          <p>Không thể tải hồ sơ xác thực của hành trình này.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="jvd-container">
      {/* Header - Personalized Certificate Style */}
      <div className="jvd-header">
        <div className="jvd-header-main">
          {learnerAvatar ? (
            <div className="jvd-avatar-frame">
              <img src={learnerAvatar} alt={learnerName || "User"} className="jvd-avatar-img" />
              <div className="jvd-avatar-ring" />
            </div>
          ) : (
            <div className="jvd-avatar-placeholder">
              <User size={20} />
            </div>
          )}
          <div>
            <h2 className="jvd-title">Hồ Sơ Xác Thực Hành Trình</h2>
            {journeyTitle ? (
              <p className="jvd-subtitle">{journeyTitle}</p>
            ) : (
              <p className="jvd-subtitle">Báo cáo năng lực học tập và thực hành thực tế</p>
            )}
          </div>
        </div>
        <div className="jvd-header-meta">
          {learnerName && (
            <span className="jvd-meta-item jvd-meta-item--learner">
              {learnerName}
            </span>
          )}
          <span className="jvd-meta-item jvd-meta-item--id">
            Mã: #{journeyId}
          </span>
        </div>
      </div>

      {/* Main Grid Layout - More Compact */}
      <div className="jvd-body-grid">
        
        {/* Left Side: Gate Status */}
        <div className="jvd-section jvd-section--gate">
          <div className="jvd-card jvd-gate-card">
            <div className="jvd-card-header">
              <h3>Trạng Thái Thẩm Định</h3>
              {getGateBadge(gate.finalGateStatus)}
            </div>

            <div className="jvd-checklist">
              <div className={`jvd-check-item ${gate.hasPassCompletionReport ? 'passed' : ''}`}>
                {gate.hasPassCompletionReport ? (
                  <CheckCircle size={16} />
                ) : (
                  <Clock size={16} />
                )}
                <span>Báo cáo tốt nghiệp từ Mentor</span>
              </div>
              
              <div className={`jvd-check-item ${gate.outputAssessmentApproved ? 'passed' : ''}`}>
                {gate.outputAssessmentApproved ? (
                  <CheckCircle size={16} />
                ) : (
                  <Clock size={16} />
                )}
                <span>Bài thu hoạch đầu ra được duyệt</span>
              </div>
              
              <div className={`jvd-check-item ${gate.finalGateStatus === 'PASSED' ? 'passed' : gate.finalVerificationRequired ? 'required' : ''}`}>
                {gate.finalGateStatus === 'PASSED' ? (
                  <CheckCircle size={16} />
                ) : gate.finalVerificationRequired ? (
                  <ShieldCheck size={16} />
                ) : (
                  <CheckCircle size={16} />
                )}
                <span>
                  {gate.finalGateStatus === 'PASSED'
                    ? 'Thẩm định cuối cùng hoàn tất'
                    : gate.finalVerificationRequired
                      ? 'Yêu cầu thẩm định cuối cùng'
                      : 'Không yêu cầu thẩm định thêm'}
                </span>
              </div>
            </div>

            {gate.blockingReasons.length > 0 && (
              <div className="jvd-blocking">
                <h4><AlertCircle size={14} /> Các mục chưa hoàn thành:</h4>
                <ul>
                  {gate.blockingReasons.map((reason, idx) => (
                    <li key={idx}>{reason}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Output Assessment Content */}
        {gate.journeyOutputVerificationRequired && (
          <div className="jvd-section jvd-section--assessment">
            <div className="jvd-card">
              <div className="jvd-card-header">
                <h3><FileText size={16} /> Đánh Giá Bài Thu Hoạch</h3>
                {outputAssessment && (
                  <span className={`jvd-assessment-status jvd-assessment-status--${outputAssessment.assessmentStatus.toLowerCase()}`}>
                    {outputAssessment.assessmentStatus === 'APPROVED' ? 'Đã duyệt' : outputAssessment.assessmentStatus === 'REJECTED' ? 'Từ chối' : 'Đang duyệt'}
                  </span>
                )}
              </div>

              {outputAssessment ? (
                <div className="jvd-assessment-content">
                  <div className="jvd-field">
                    <label>Nội dung thu hoạch từ học viên:</label>
                    <div className="jvd-text">{outputAssessment.submissionText || '(Không có nội dung)'}</div>
                  </div>

                  <div className="jvd-resource-row">
                    {outputAssessment.evidenceUrl && (
                      <div className="jvd-field">
                        <label>Đường dẫn minh chứng:</label>
                        <a
                          href={outputAssessment.evidenceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="jvd-link"
                        >
                          <ExternalLink size={12} /> Xem sản phẩm thực tế
                        </a>
                      </div>
                    )}

                    {outputAssessment.attachmentUrl && (
                      <div className="jvd-field">
                        <label>Tài liệu đính kèm:</label>
                        <a
                          href={outputAssessment.attachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="jvd-link"
                        >
                          <ExternalLink size={12} /> Tải tài liệu đính kèm
                        </a>
                      </div>
                    )}
                  </div>

                  {outputAssessment.feedback && (
                    <div className="jvd-field">
                      <label>Nhận xét chi tiết từ Mentor:</label>
                      <div className="jvd-feedback">{outputAssessment.feedback}</div>
                    </div>
                  )}

                  {outputAssessment.score !== undefined && outputAssessment.score !== null && (
                    <div className="jvd-field jvd-field--score">
                      <label>Điểm đánh giá:</label>
                      <span className="jvd-score">
                        <Award size={14} />
                        {outputAssessment.score}/100 Điểm
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="jvd-empty">
                  <Clock size={24} />
                  <p>Học viên chưa nộp bài thu hoạch đầu ra.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Node Evidences Summary */}
        {nodeEvidences.length > 0 && (
          <div className="jvd-section jvd-section--nodes">
            <div className="jvd-card">
              <div className="jvd-card-header">
                <h3><Target size={16} /> Báo Cáo Thực Hành Theo Bài Học ({nodeEvidences.length})</h3>
              </div>
              <div className="jvd-nodes-list">
                {nodeEvidences.map((evidence) => (
                  <div key={evidence.id} className="jvd-node-item">
                    <div className="jvd-node-status">
                      {getNodeStatusIcon(evidence.verificationStatus)}
                    </div>
                    <div className="jvd-node-info">
                      <span className="jvd-node-id">Mục học tập: {evidence.nodeId}</span>
                      <span className="jvd-node-verification">{getNodeStatusLabel(evidence.verificationStatus)}</span>
                    </div>
                    {evidence.latestReview && (
                      <div className="jvd-node-review">
                        Đánh giá: {evidence.latestReview.reviewResult}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>

      {readonly && (
        <div className="jvd-readonly-notice">
          <ShieldCheck size={12} /> Hồ sơ lưu trữ điện tử chính thức · SkillVerse Certification
        </div>
      )}
    </div>
  );
};

export default JourneyVerificationDossier;
