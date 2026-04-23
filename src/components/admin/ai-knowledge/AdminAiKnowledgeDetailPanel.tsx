import React from 'react';
import {
  Archive,
  CheckCircle2,
  FileText,
  RefreshCw,
  ShieldX,
  SquareArrowOutUpRight,
} from 'lucide-react';
import {
  AiKnowledgeApprovalStatus,
  AiKnowledgeDocumentDetailResponse,
} from '../../../types/aiKnowledge';

interface AdminAiKnowledgeDetailPanelProps {
  detail: AiKnowledgeDocumentDetailResponse | null;
  loading: boolean;
  actionLoading: 'approve' | 'reject' | 'reindex' | 'archive' | null;
  onRefresh: () => void;
  onApprove: () => void;
  onReject: () => void;
  onReindex: () => void;
  onArchive: () => void;
  reviewNote: string;
  onReviewNoteChange: (value: string) => void;
}

const formatDateTime = (value?: string | null) =>
  value
    ? new Date(value).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })
    : 'Chưa có';

const AdminAiKnowledgeDetailPanel: React.FC<AdminAiKnowledgeDetailPanelProps> = ({
  detail,
  loading,
  actionLoading,
  onRefresh,
  onApprove,
  onReject,
  onReindex,
  onArchive,
  reviewNote,
  onReviewNoteChange,
}) => {
  if (loading) {
    return (
      <aside className="adminaiknowledge-card adminaiknowledge-detail-panel">
        <div className="adminaiknowledge-empty-block">Đang tải chi tiết tài liệu...</div>
      </aside>
    );
  }

  if (!detail) {
    return (
      <aside className="adminaiknowledge-card adminaiknowledge-detail-panel">
        <div className="adminaiknowledge-empty-block">Chọn một tài liệu từ danh sách để xem chi tiết và thao tác.</div>
      </aside>
    );
  }

  const canReview = detail.approvalStatus === AiKnowledgeApprovalStatus.PENDING && detail.mentorId != null;
  const canReindex = detail.approvalStatus === AiKnowledgeApprovalStatus.APPROVED;

  return (
    <aside className="adminaiknowledge-card adminaiknowledge-detail-panel">
      <div className="adminaiknowledge-section-header">
        <div>
          <span className="adminaiknowledge-section-eyebrow">Chi tiết tài liệu</span>
          <h2>{detail.title}</h2>
          <p>{detail.description || 'Chưa có mô tả cho tài liệu này.'}</p>
        </div>
        <button
          type="button"
          className="adminaiknowledge-secondary-btn"
          onClick={onRefresh}
          disabled={actionLoading != null}
        >
          <RefreshCw size={16} />
          Làm mới chi tiết
        </button>
      </div>

      <div className="adminaiknowledge-detail-meta">
        <div><strong>Use case:</strong><span>{detail.useCase}</span></div>
        <div><strong>Approval:</strong><span>{detail.approvalStatus}</span></div>
        <div>
          <strong>Ingestion:</strong>
          <span>
            <span
              className={`adminaiknowledge-badge adminaiknowledge-badge--${detail.ingestionStatus === 'INDEXED' ? 'indexed-strong' : detail.ingestionStatus === 'NOT_INGESTED' ? 'not-ingested-strong' : 'failed'}`}
            >
              {detail.ingestionStatus}
            </span>
          </span>
        </div>
        <div><strong>Doc type:</strong><span>{detail.docType || 'Không rõ'}</span></div>
        <div><strong>Skill:</strong><span>{detail.skillName || detail.skillSlug || '—'}</span></div>
        <div><strong>Industry / Level:</strong><span>{detail.industry || '—'} / {detail.level || '—'}</span></div>
        <div><strong>Course / Module / Assignment:</strong><span>{detail.courseId ?? '—'} / {detail.moduleId ?? '—'} / {detail.assignmentId ?? '—'}</span></div>
        <div><strong>Uploaded by:</strong><span>{detail.uploadedByUserId}</span></div>
        <div><strong>Approved by:</strong><span>{detail.approvedByUserId ?? '—'}</span></div>
        <div><strong>Created:</strong><span>{formatDateTime(detail.createdAt)}</span></div>
        <div><strong>Updated:</strong><span>{formatDateTime(detail.updatedAt)}</span></div>
        <div><strong>Approved at:</strong><span>{formatDateTime(detail.approvedAt)}</span></div>
        <div><strong>Indexed at:</strong><span>{formatDateTime(detail.indexedAt)}</span></div>
        <div><strong>File:</strong><span>{detail.originalFileName || 'Không có tên'}</span></div>
        <div><strong>MIME / Size:</strong><span>{detail.mimeType || 'Không rõ'} / {detail.fileSizeBytes?.toLocaleString('vi-VN') || 0} bytes</span></div>
      </div>

      <div className="adminaiknowledge-detail-actions">
        {detail.storageUrl && (
          <a
            href={detail.storageUrl}
            target="_blank"
            rel="noreferrer"
            className="adminaiknowledge-secondary-btn adminaiknowledge-link-btn"
          >
            <SquareArrowOutUpRight size={16} />
            Mở file gốc
          </a>
        )}

        {canReview && (
          <>
            <button
              type="button"
              className="adminaiknowledge-primary-btn"
              onClick={onApprove}
              disabled={actionLoading != null}
            >
              <CheckCircle2 size={16} />
              {actionLoading === 'approve' ? 'Đang duyệt...' : 'Approve'}
            </button>
            <button
              type="button"
              className="adminaiknowledge-danger-btn"
              onClick={onReject}
              disabled={actionLoading != null}
            >
              <ShieldX size={16} />
              {actionLoading === 'reject' ? 'Đang từ chối...' : 'Reject'}
            </button>
          </>
        )}

        <button
          type="button"
          className="adminaiknowledge-secondary-btn"
          onClick={onReindex}
          disabled={!canReindex || actionLoading != null}
        >
          <RefreshCw size={16} className={actionLoading === 'reindex' ? 'adminaiknowledge-spinning' : ''} />
          {actionLoading === 'reindex' ? 'Đang reindex...' : 'Reindex'}
        </button>

        <button
          type="button"
          className="adminaiknowledge-danger-btn"
          onClick={onArchive}
          disabled={actionLoading != null}
        >
          <Archive size={16} />
          {actionLoading === 'archive' ? 'Đang archive...' : 'Archive'}
        </button>
      </div>

      {canReview && (
        <div className="adminaiknowledge-field adminaiknowledge-review-note-field">
          <span>Ghi chú review (tùy chọn)</span>
          <textarea
            rows={2}
            placeholder="Nhập lý do từ chối hoặc ghi chú khi duyệt..."
            value={reviewNote}
            onChange={(e) => onReviewNoteChange(e.target.value)}
            disabled={actionLoading != null}
          />
        </div>
      )}

      {detail.reviewNote && (
        <section className="adminaiknowledge-detail-section">
          <h3>Review note</h3>
          <p>{detail.reviewNote}</p>
        </section>
      )}

      <section className="adminaiknowledge-detail-section">
        <h3>
          <FileText size={16} />
          Extracted text
        </h3>
        {detail.extractError ? (
          <div className="adminaiknowledge-error-box">{detail.extractError}</div>
        ) : (
          <pre className="adminaiknowledge-extracted-text">{detail.extractedText || 'Chưa có extracted text.'}</pre>
        )}
      </section>
    </aside>
  );
};

export default AdminAiKnowledgeDetailPanel;
