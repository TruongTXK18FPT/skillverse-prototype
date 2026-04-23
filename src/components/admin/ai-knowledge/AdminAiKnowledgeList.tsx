import React from 'react';
import { ChevronLeft, ChevronRight, Eye, RefreshCw } from 'lucide-react';
import {
  AiKnowledgeApprovalStatus,
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
                <td colSpan={6} className="adminaiknowledge-empty-cell">Đang tải tài liệu...</td>
              </tr>
            )}

            {!loading && documents.length === 0 && (
              <tr>
                <td colSpan={6} className="adminaiknowledge-empty-cell">Không có tài liệu phù hợp với bộ lọc hiện tại.</td>
              </tr>
            )}

            {!loading &&
              documents.map((document) => (
                <tr
                  key={document.id}
                  className={selectedId === document.id ? 'selected' : ''}
                >
                  <td>
                    <strong>{document.title}</strong>
                    <div className="adminaiknowledge-cell-sub">{document.originalFileName || 'Không có tên tệp'}</div>
                  </td>
                  <td>
                    <strong>{document.useCase}</strong>
                    <div className="adminaiknowledge-cell-sub">{document.docType || 'Không rõ docType'}</div>
                  </td>
                  <td>
                    <div className="adminaiknowledge-badge-group">
                      <span className={`adminaiknowledge-badge adminaiknowledge-badge--${getApprovalBadgeClass(document.approvalStatus)}`}>
                        {document.approvalStatus}
                      </span>
                      <span className={`adminaiknowledge-badge adminaiknowledge-badge--${getIngestionBadgeClass(document.ingestionStatus)}`}>
                        {document.ingestionStatus}
                      </span>
                    </div>
                  </td>
                  <td>
                    <strong>{document.skillSlug || '—'}</strong>
                    <div className="adminaiknowledge-cell-sub">
                      C:{document.courseId ?? '—'} · M:{document.moduleId ?? '—'} · A:{document.assignmentId ?? '—'}
                    </div>
                  </td>
                  <td>
                    <strong>{formatDateTime(document.updatedAt)}</strong>
                    <div className="adminaiknowledge-cell-sub">Tạo: {formatDateTime(document.createdAt)}</div>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="adminaiknowledge-action-btn"
                      onClick={() => onSelect(document.id)}
                    >
                      <Eye size={15} />
                      Xem
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="adminaiknowledge-pagination">
        <button type="button" onClick={onPrevPage} disabled={currentPage === 0}>
          <ChevronLeft size={16} />
          Trước
        </button>
        <span>
          Trang {totalPages === 0 ? 0 : currentPage + 1}/{Math.max(totalPages, 1)} • {totalElements.toLocaleString('vi-VN')} tài liệu
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
