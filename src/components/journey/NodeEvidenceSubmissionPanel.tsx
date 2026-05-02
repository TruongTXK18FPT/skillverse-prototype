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
import { type FC, useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Clock, Send, Shield, UserCheck, XCircle } from 'lucide-react';
import {
  getNodeEvidence,
  selfConfirmNode,
  submitNodeEvidence,
} from '../../services/nodeMentoringService';
import { uploadEvidence } from '../../services/mentorVerificationService';
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

const NodeEvidenceSubmissionPanel: FC<NodeEvidenceSubmissionPanelProps> = ({
  journeyId,
  nodeId,
  onSubmitted,
  compact = false,
}) => {
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
  const canSelfConfirm =
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
    return uploadEvidence(file);
  }, []);

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
