/**
 * [Nghiệp vụ] Panel cho learner nộp/cập nhật evidence tại 1 node trong journey.
 *
 * Theo spec Phase 1 (§1.1.6): tối giản 1 record hiện tại, rework update cùng row.
 * - submissionText optional (text OR file bắt buộc ít nhất 1)
 * - attachmentUrl optional (pdf/doc/docx, upload qua uploadEvidence)
 *
 * Panel chỉ hiển thị status preview + nút trigger mở modal.
 * Form logic nằm trong NodeEvidenceSubmissionModal.
 */
import React, { FC, useState, useEffect, useCallback } from 'react';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Send,
  Shield,
  UserCheck,
  XCircle,
  Cpu,
} from 'lucide-react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';
import {
  getNodeEvidence,
  selfConfirmNode,
  submitNodeEvidence,
} from '../../services/nodeMentoringService';
import { uploadEvidence } from '../../services/mentorVerificationService';
import { useAuth } from '../../context/AuthContext';
import { uploadDocument, uploadImage } from '../../services/fileUploadService';
import type {
  NodeEvidenceRecordResponse,
  NodeVerificationStatus,
} from '../../types/NodeMentoring';
import NodeEvidenceSubmissionModal from './NodeEvidenceSubmissionModal';
import './NodeEvidenceSubmissionPanel.css';

interface NodeEvidenceSubmissionPanelProps {
  journeyId: number;
  nodeId: string;
  /** Optional callback when a submission succeeds so parent can refresh. */
  onSubmitted?: (record: NodeEvidenceRecordResponse) => void;
  compact?: boolean;
}

const statusBadge = (status: NodeVerificationStatus) => {
  switch (status) {
    case 'VERIFIED':
      return (
        <span className="nesp-badge nesp-badge--verified">
          <CheckCircle size={14} /> Đã xác thực
        </span>
      );
    case 'APPROVED':
      return (
        <span className="nesp-badge nesp-badge--approved">
          <CheckCircle size={14} /> Đã duyệt
        </span>
      );
    case 'UNDER_REVIEW':
      return (
        <span className="nesp-badge nesp-badge--pending">
          <Clock size={14} /> Đang review
        </span>
      );
    case 'REJECTED':
      return (
        <span className="nesp-badge nesp-badge--rejected">
          <XCircle size={14} /> Bị từ chối
        </span>
      );
    case 'PENDING':
    default:
      return (
        <span className="nesp-badge nesp-badge--pending">
          <Clock size={14} /> Chưa xác thực
        </span>
      );
  }
};

const aiStatusBadge = (status?: string) => {
  if (!status) return null;
  switch (status) {
    case 'PASSED':
      return (
        <span className="nesp-badge nesp-badge--ai-passed">
          <Cpu size={14} /> Hệ thống: Đạt
        </span>
      );
    case 'FAILED':
      return (
        <span className="nesp-badge nesp-badge--ai-failed">
          <Cpu size={14} /> Hệ thống: Cần nộp lại
        </span>
      );
    case 'NEEDS_ADMIN_REVIEW':
      return (
        <span className="nesp-badge nesp-badge--ai-needs-admin">
          <Cpu size={14} /> Hệ thống: Đang chờ đánh giá
        </span>
      );
    case 'PENDING':
      return (
        <span className="nesp-badge nesp-badge--ai-pending">
          <Cpu size={14} /> Hệ thống: Đang chờ đánh giá
        </span>
      );
    default:
      return null;
  }
};

const NodeEvidenceSubmissionPanel: FC<NodeEvidenceSubmissionPanelProps> = ({
  journeyId,
  nodeId,
  onSubmitted,
  compact = false,
}) => {
  const { user } = useAuth();
  const [current, setCurrent] = useState<NodeEvidenceRecordResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const record = await getNodeEvidence(journeyId, nodeId);
      setCurrent(record);
    } catch (err) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setLoadError(axiosErr.response?.data?.message || 'Không tải được evidence hiện tại.');
    } finally {
      setLoading(false);
    }
  }, [journeyId, nodeId]);

  useEffect(() => {
    load();
  }, [load]);

  const isLocked = current?.verificationStatus === 'VERIFIED';
  const isNodeAlreadyCompleted =
    current?.learnerMarkedComplete === true ||
    current?.roadmapProgressStatus === 'COMPLETED';
  const isAiReviewBlocking =
    !current?.hasMentorCoverage &&
    current?.latestAiReviewStatus !== 'PASSED' &&
    current?.verificationStatus !== 'VERIFIED';

  const canSelfConfirm =
    !isAiReviewBlocking &&
    !isLocked &&
    !isNodeAlreadyCompleted &&
    (current?.submissionStatus === 'SUBMITTED' || current?.submissionStatus === 'RESUBMITTED') &&
    current?.verificationStatus !== 'APPROVED';

  const handleSelfConfirm = useCallback(async () => {
    setConfirming(true);
    setConfirmError(null);
    try {
      const saved = await selfConfirmNode(journeyId, nodeId);
      setCurrent(saved);
      onSubmitted?.(saved);
    } catch (err) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setConfirmError(axiosErr.response?.data?.message || 'Không thể xác nhận hoàn thành node.');
    } finally {
      setConfirming(false);
    }
  }, [journeyId, nodeId, onSubmitted]);

  const handleUploadFile = useCallback(async (file: File): Promise<string> => {
    const isDocFile = (f: File) => {
      const ext = f.name.split('.').pop()?.toLowerCase();
      return f.type === 'application/pdf' ||
        f.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        ext === 'pdf' ||
        ext === 'docx' ||
        ext === 'doc';
    };

    const isImageFile = (f: File) => {
      const ext = f.name.split('.').pop()?.toLowerCase();
      return f.type.startsWith('image/') ||
        ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext || '');
    };

    if (isDocFile(file) && user?.id) {
      const result = await uploadDocument(file, user.id);
      return result.url;
    } else if (isImageFile(file) && user?.id) {
      const result = await uploadImage(file, user.id);
      return result.url;
    } else {
      return uploadEvidence(file);
    }
  }, [user]);

  const handleSubmit = useCallback(
    async (data: { submissionText: string; attachmentUrl?: string }) => {
      const saved = await submitNodeEvidence(journeyId, nodeId, {
        submissionText: data.submissionText,
        attachmentUrl: data.attachmentUrl,
      });
      setCurrent(saved);
      onSubmitted?.(saved);
    },
    [journeyId, nodeId, onSubmitted],
  );

  if (loading) {
    return (
      <div className={`nesp-container ${compact ? 'nesp-container--compact' : ''}`}>
        <div className="nesp-loading">Đang tải evidence…</div>
      </div>
    );
  }

  return (
    <div className={`nesp-container ${compact ? 'nesp-container--compact' : ''}`}>
      <div className="nesp-header">
        <div className="nesp-header__title">
          <Shield size={18} />
          <h3>Minh chứng node</h3>
        </div>
        <div className="nesp-header__actions">
          {current?.latestAiReviewStatus && aiStatusBadge(current.latestAiReviewStatus)}
          {current && statusBadge(current.verificationStatus)}
          {!isLocked && (
            <button
              type="button"
              className="nesp-btn nesp-btn--primary"
              onClick={() => setIsModalOpen(true)}
            >
              <Send size={14} />
              {current ? 'Cập nhật' : 'Nộp minh chứng'}
            </button>
          )}
        </div>
      </div>

      {loadError && (
        <div className="nesp-alert nesp-alert--error">
          <XCircle size={15} /> {loadError}
        </div>
      )}

      {confirmError && (
        <div className="nesp-alert nesp-alert--error">
          <XCircle size={15} /> {confirmError}
        </div>
      )}

      {current?.hasMentorCoverage && isNodeAlreadyCompleted && (
        <div className="nesp-alert nesp-alert--info">
          <CheckCircle size={15} /> Đã hoàn thành, chờ mentor xác thực.
        </div>
      )}

      {canSelfConfirm && (
        <button
          type="button"
          className="nesp-btn nesp-btn--confirm"
          onClick={handleSelfConfirm}
          disabled={confirming}
        >
          <UserCheck size={14} />
          {confirming ? 'Đang xác nhận…' : 'Xác nhận hoàn thành node'}
        </button>
      )}

      {current?.latestReview?.criteriaScores && current.latestReview.criteriaScores.length > 0 && (
        <div className="nesp-radar-section" style={{ marginTop: '16px', marginBottom: '16px', background: 'rgba(10, 15, 30, 0.6)', border: '1px solid rgba(0, 229, 255, 0.15)', borderRadius: '12px', padding: '16px', backdropFilter: 'blur(8px)', boxShadow: '0 8px 32px 0 rgba(0, 229, 255, 0.05)' }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', color: '#00e5ff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cpu size={16} /> Đánh giá năng lực Node
          </h4>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' }}>
            {/* Left side: Radar chart */}
            <div style={{ width: '220px', height: '220px', position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={current.latestReview.criteriaScores.map(cs => ({
                  subject: cs.title,
                  A: cs.score,
                  fullMark: cs.maxScore || 10
                }))}>
                  <PolarGrid stroke="rgba(0, 229, 255, 0.15)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 'dataMax']} tick={{ fill: '#64748b', fontSize: 9 }} />
                  <Radar name="Học viên" dataKey="A" stroke="#00e5ff" fill="#00e5ff" fillOpacity={0.25} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            
            {/* Right side: Detailed scores list */}
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {current.latestReview.criteriaScores.map(cs => (
                  <div key={cs.criterionId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '6px' }}>
                    <span style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>{cs.title}</span>
                    <span style={{ fontSize: '0.88rem', fontWeight: 'bold', color: '#00e5ff' }}>
                      {cs.score} <span style={{ fontSize: '0.75rem', color: '#64748b' }}>/ {cs.maxScore || 10}</span>
                    </span>
                  </div>
                ))}
                {current.latestReview.score !== undefined && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(0, 229, 255, 0.2)' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#fff' }}>Điểm tổng kết quy đổi:</span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#00e5ff' }}>{current.latestReview.score}%</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {current?.mentorFeedback && (
        <div className="nesp-feedback">
          <AlertCircle size={15} />
          <div>
            <strong>Mentor feedback:</strong>
            <p>{current.mentorFeedback}</p>
          </div>
        </div>
      )}

      {isLocked && (
        <div className="nesp-alert nesp-alert--info">
          <CheckCircle size={15} />
          Node này đã được mentor xác thực. Không thể chỉnh sửa evidence nữa.
        </div>
      )}

      <NodeEvidenceSubmissionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        nodeId={nodeId}
        existingEvidence={current}
        isLocked={isLocked}
        onSubmit={handleSubmit}
        onUploadFile={handleUploadFile}
      />
    </div>
  );
};

export default NodeEvidenceSubmissionPanel;
