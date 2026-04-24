import React from 'react';
import {
  Archive,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  RefreshCw,
  ShieldX,
  SquareArrowOutUpRight,
} from 'lucide-react';
import {
  AiKnowledgeApprovalStatus,
  AiKnowledgeDocumentDetailResponse,
  AiKnowledgeDocumentListItemResponse,
  AiKnowledgeIngestionStatus,
} from '../../../types/aiKnowledge';

interface AdminAiKnowledgeListProps {
  documents: AiKnowledgeDocumentListItemResponse[];
  loading: boolean;
  selectedId: number | null;
  currentPage: number;
  totalPages: number;
  totalElements: number;
  onSelect: (id: number) => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  onRefresh: () => void;
  refreshing: boolean;

  // Accordion Detail Props
  detail: AiKnowledgeDocumentDetailResponse | null;
  detailLoading: boolean;
  actionLoading: 'approve' | 'reject' | 'reindex' | 'archive' | null;
  onRefreshDetail: () => void;
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

const getApprovalBadgeClass = (status: AiKnowledgeApprovalStatus) => {
  if (status === AiKnowledgeApprovalStatus.APPROVED) return 'approved';
  if (status === AiKnowledgeApprovalStatus.REJECTED) return 'rejected';
  return 'pending';
};

const getIngestionBadgeClass = (status: AiKnowledgeIngestionStatus) => {
  if (status === AiKnowledgeIngestionStatus.INDEXED) return 'indexed';
  if (status === AiKnowledgeIngestionStatus.FAILED) return 'failed';
  return 'not-ingested';
};

const AdminAiKnowledgeList: React.FC<AdminAiKnowledgeListProps> = ({
  documents,
  loading,
  selectedId,
  currentPage,
  totalPages,
  totalElements,
  onSelect,
  onPrevPage,
  onNextPage,
  onRefresh,
  refreshing,

  detail,
  detailLoading,
  actionLoading,
  onRefreshDetail,
  onApprove,
  onReject,
  onReindex,
  onArchive,
  reviewNote,
  onReviewNoteChange,
}) => {
  return (
    <section className="adminaiknowledge-card adminaiknowledge-list-panel">
      <div className="adminaiknowledge-section-header adminaiknowledge-section-header--compact">
        <div>
          <span className="adminaiknowledge-section-eyebrow">Kho tài liệu</span>
          <h2>Danh sách tài liệu AI</h2>
          <p>{totalElements.toLocaleString('vi-VN')} tài liệu đang hiển thị theo bộ lọc hiện tại.</p>
        </div>
        <button
          type="button"
          className="adminaiknowledge-secondary-btn"
          onClick={onRefresh}
          disabled={refreshing}
        >
          <RefreshCw size={16} className={refreshing ? 'adminaiknowledge-spinning' : ''} />
          Làm mới
        </button>
      </div>

      <div className="adminaiknowledge-table-wrap">
        <table className="adminaiknowledge-table">
          <thead>
            <tr>
              <th>Tiêu đề</th>
              <th>Use case</th>
              <th>Trạng thái</th>
              <th>Scope</th>
              <th>Thời gian</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="adminaiknowledge-empty-cell">
                  Đang tải tài liệu...
                </td>
              </tr>
            )}

            {!loading && documents.length === 0 && (
              <tr>
                <td colSpan={6} className="adminaiknowledge-empty-cell">
                  Không có tài liệu phù hợp với bộ lọc hiện tại.
                </td>
              </tr>
            )}

            {!loading &&
              documents.map((document) => {
                const isSelected = selectedId === document.id;
                const canReview = detail?.id === document.id && detail.approvalStatus === AiKnowledgeApprovalStatus.PENDING && detail.mentorId != null;
                const canReindex = detail?.id === document.id && detail.approvalStatus === AiKnowledgeApprovalStatus.APPROVED;

                return (
                  <React.Fragment key={document.id}>
                    <tr
                      className={`${isSelected ? 'selected' : ''} adminaiknowledge-row-clickable`}
                      onClick={() => onSelect(document.id)}
                    >
                      <td>
                        <strong>{document.title}</strong>
                        <div className="adminaiknowledge-cell-sub">
                          {document.originalFileName || 'Không có tên tệp'}
                        </div>
                      </td>
                      <td>
                        <strong>{document.useCase}</strong>
                        <div className="adminaiknowledge-cell-sub">
                          {document.docType || 'Không rõ docType'}
                        </div>
                      </td>
                      <td>
                        <div className="adminaiknowledge-badge-group">
                          <span
                            className={`adminaiknowledge-badge adminaiknowledge-badge--${getApprovalBadgeClass(
                              document.approvalStatus
                            )}`}
                          >
                            {document.approvalStatus}
                          </span>
                          <span
                            className={`adminaiknowledge-badge adminaiknowledge-badge--${getIngestionBadgeClass(
                              document.ingestionStatus
                            )}`}
                          >
                            {document.ingestionStatus}
                          </span>
                        </div>
                      </td>
                      <td>
                        <strong>{document.skillSlug || '—'}</strong>
                        <div className="adminaiknowledge-cell-sub">
                          C:{document.courseId ?? '—'} · M:{document.moduleId ?? '—'} · A:
                          {document.assignmentId ?? '—'}
                        </div>
                      </td>
                      <td>
                        <strong>{formatDateTime(document.updatedAt)}</strong>
                        <div className="adminaiknowledge-cell-sub">
                          Tạo: {formatDateTime(document.createdAt)}
                        </div>
                      </td>
                      <td>
                        <button
                          type="button"
                          className={`adminaiknowledge-action-btn ${isSelected ? 'active' : ''}`}
                        >
                          <Eye size={15} />
                          {isSelected ? 'Đang xem' : 'Xem'}
                        </button>
                      </td>
                    </tr>

                    {isSelected && (
                      <tr className="adminaiknowledge-detail-row">
                        <td colSpan={6}>
                          <div className="adminaiknowledge-accordion-content">
                            {detailLoading && (
                              <div className="adminaiknowledge-detail-loading">
                                <RefreshCw size={20} className="adminaiknowledge-spinning" />
                                <span>Đang tải chi tiết...</span>
                              </div>
                            )}

                            {!detailLoading && detail && detail.id === document.id && (
                              <div className="adminaiknowledge-detail-inner">
                                <div className="adminaiknowledge-detail-grid">
                                  <div className="adminaiknowledge-detail-main">
                                    <div className="adminaiknowledge-detail-meta">
                                      <div><strong>Mô tả:</strong><span>{detail.description || '—'}</span></div>
                                      <div><strong>Industry / Level:</strong><span>{detail.industry || '—'} / {detail.level || '—'}</span></div>
                                      <div><strong>Doc type / MIME:</strong><span>{detail.docType || '—'} / {detail.mimeType || '—'}</span></div>
                                      <div><strong>Size:</strong><span>{detail.fileSizeBytes?.toLocaleString('vi-VN') || 0} bytes</span></div>
                                      <div><strong>Uploaded by:</strong><span>{detail.uploadedByUserId}</span></div>
                                      <div><strong>Approved by:</strong><span>{detail.approvedByUserId ?? '—'}</span></div>
                                      <div><strong>Approved at:</strong><span>{formatDateTime(detail.approvedAt)}</span></div>
                                      <div><strong>Indexed at:</strong><span>{formatDateTime(detail.indexedAt)}</span></div>
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
                                            onClick={(e) => { e.stopPropagation(); onApprove(); }}
                                            disabled={actionLoading != null}
                                          >
                                            <CheckCircle2 size={16} />
                                            {actionLoading === 'approve' ? 'Đang duyệt...' : 'Approve'}
                                          </button>
                                          <button
                                            type="button"
                                            className="adminaiknowledge-danger-btn"
                                            onClick={(e) => { e.stopPropagation(); onReject(); }}
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
                                        onClick={(e) => { e.stopPropagation(); onReindex(); }}
                                        disabled={!canReindex || actionLoading != null}
                                      >
                                        <RefreshCw size={16} className={actionLoading === 'reindex' ? 'adminaiknowledge-spinning' : ''} />
                                        {actionLoading === 'reindex' ? 'Đang reindex...' : 'Reindex'}
                                      </button>

                                      <button
                                        type="button"
                                        className="adminaiknowledge-danger-btn"
                                        onClick={(e) => { e.stopPropagation(); onArchive(); }}
                                        disabled={actionLoading != null}
                                      >
                                        <Archive size={16} />
                                        {actionLoading === 'archive' ? 'Đang archive...' : 'Archive'}
                                      </button>

                                      <button
                                        type="button"
                                        className="adminaiknowledge-secondary-btn"
                                        onClick={(e) => { e.stopPropagation(); onRefreshDetail(); }}
                                        disabled={actionLoading != null}
                                      >
                                        <RefreshCw size={16} />
                                        Làm mới chi tiết
                                      </button>
                                    </div>

                                    {canReview && (
                                      <div className="adminaiknowledge-field adminaiknowledge-review-note-field" onClick={(e) => e.stopPropagation()}>
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
                                  </div>

                                  <div className="adminaiknowledge-detail-sidebar">
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
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
          </tbody>
        </table>
      </div>

      <div className="adminaiknowledge-pagination">
        <button type="button" onClick={onPrevPage} disabled={currentPage === 0}>
          <ChevronLeft size={16} />
          Trước
        </button>
        <span>
          Trang {totalPages === 0 ? 0 : currentPage + 1}/{Math.max(totalPages, 1)} •{' '}
          {totalElements.toLocaleString('vi-VN')} tài liệu
        </span>
        <button type="button" onClick={onNextPage} disabled={currentPage + 1 >= totalPages}>
          Sau
          <ChevronRight size={16} />
        </button>
      </div>
    </section>
  );
};

export default AdminAiKnowledgeList;
