import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, BrainCircuit, RefreshCw } from 'lucide-react';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import Toast from '../../components/shared/Toast';
import AdminAiKnowledgeUploadPanel from '../../components/admin/ai-knowledge/AdminAiKnowledgeUploadPanel';
import AdminAiKnowledgeFilters from '../../components/admin/ai-knowledge/AdminAiKnowledgeFilters';
import AdminAiKnowledgeList from '../../components/admin/ai-knowledge/AdminAiKnowledgeList';
import AdminAiKnowledgeDetailPanel from '../../components/admin/ai-knowledge/AdminAiKnowledgeDetailPanel';
import {
  archiveAdminAiKnowledgeDocument,
  getAdminAiKnowledgeDocumentDetail,
  listAdminAiKnowledgeDocuments,
  reindexAdminAiKnowledgeDocument,
  reviewAdminAiKnowledgeDocument,
  uploadAdminChatbotDocument,
  uploadAdminRoadmapDocument,
} from '../../services/aiKnowledgeService';
import {
  AdminChatbotKnowledgeUploadRequest,
  AdminRoadmapKnowledgeUploadRequest,
  AiKnowledgeDocumentDetailResponse,
  AiKnowledgeDocumentListItemResponse,
  ListAdminAiKnowledgeDocumentsParams,
} from '../../types/aiKnowledge';
import { useToast } from '../../hooks/useToast';
import './AdminAiKnowledgeDashboard.css';

type UploadKind = 'chatbot' | 'roadmap' | null;
type DetailAction = 'approve' | 'reject' | 'reindex' | 'archive' | null;
type ConfirmAction = Exclude<DetailAction, null>;

const PAGE_SIZE = 10;

const defaultFilters: ListAdminAiKnowledgeDocumentsParams = {
  page: 0,
  size: PAGE_SIZE,
};

const getApiErrorMessage = (error: unknown, fallback: string) => {
  const apiMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
  return apiMessage || fallback;
};

const AdminAiKnowledgeDashboard: React.FC = () => {
  const { toast, isVisible, hideToast, showSuccess, showError, showInfo } = useToast();
  const [filters, setFilters] = useState<ListAdminAiKnowledgeDocumentsParams>(defaultFilters);
  const [documents, setDocuments] = useState<AiKnowledgeDocumentListItemResponse[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<AiKnowledgeDocumentDetailResponse | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [listRefreshing, setListRefreshing] = useState(false);
  const [uploadingKind, setUploadingKind] = useState<UploadKind>(null);
  const [actionLoading, setActionLoading] = useState<DetailAction>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pageMeta, setPageMeta] = useState({ totalPages: 0, totalElements: 0, number: 0 });
  const [reviewNote, setReviewNote] = useState('');

  const fetchList = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) {
      setListRefreshing(true);
    } else {
      setListLoading(true);
    }

    try {
      const response = await listAdminAiKnowledgeDocuments(filters);
      if ((filters.page ?? 0) > 0 && response.content.length === 0 && response.totalElements > 0) {
        setFilters((previous) => ({
          ...previous,
          page: Math.max((previous.page ?? 0) - 1, 0),
        }));
        return null;
      }
      setDocuments(response.content);
      setPageMeta({
        totalPages: response.totalPages,
        totalElements: response.totalElements,
        number: response.number,
      });
      setError(null);

      if (response.content.length === 0) {
        setSelectedId(null);
        setDetail(null);
        return response;
      }

      setSelectedId((previous) => {
        if (previous && response.content.some((item: AiKnowledgeDocumentListItemResponse) => item.id === previous)) {
          return previous;
        }
        return response.content[0].id;
      });

      return response;
    } catch (fetchError) {
      setError(getApiErrorMessage(fetchError, 'Không thể tải danh sách tài liệu AI.'));
      return null;
    } finally {
      setListLoading(false);
      setListRefreshing(false);
    }
  }, [filters]);

  const fetchDetail = useCallback(async (id: number) => {
    setDetailLoading(true);
    try {
      const response = await getAdminAiKnowledgeDocumentDetail(id);
      setDetail(response);
      setError(null);
    } catch (fetchError) {
      setError(getApiErrorMessage(fetchError, 'Không thể tải chi tiết tài liệu AI.'));
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  useEffect(() => {
    if (selectedId != null) {
      void fetchDetail(selectedId);
    }
  }, [fetchDetail, selectedId]);

  useEffect(() => {
    setReviewNote('');
  }, [selectedId, detail?.id]);

  const handleResetFilters = () => {
    setFilters(defaultFilters);
  };

  const handleSelectDocument = (id: number) => {
    setSelectedId(id);
  };

  const handleRefreshAll = async () => {
    await refreshSelection(selectedId);
  };

  const handleRefreshDetail = async () => {
    if (selectedId == null) {
      await fetchList(true);
      return;
    }

    await fetchDetail(selectedId);
  };

  const handleUploadChatbotDocument = async (payload: AdminChatbotKnowledgeUploadRequest) => {
    setUploadingKind('chatbot');
    try {
      const created = await uploadAdminChatbotDocument(payload);
      showSuccess('Tải lên thành công', 'Tài liệu chatbot đã được tạo. Hệ thống sẽ phản ánh trạng thái mới sau khi refetch.');
      await refreshSelection(created.id);
    } catch (uploadError) {
      showError('Tải lên thất bại', getApiErrorMessage(uploadError, 'Không thể tải tài liệu chatbot.'));
      throw uploadError;
    } finally {
      setUploadingKind(null);
    }
  };

  const handleUploadRoadmapDocument = async (payload: AdminRoadmapKnowledgeUploadRequest) => {
    setUploadingKind('roadmap');
    try {
      const created = await uploadAdminRoadmapDocument(payload);
      showSuccess('Tải lên thành công', 'Tài liệu roadmap đã được tạo. Hệ thống sẽ refetch lại danh sách và chi tiết.');
      await refreshSelection(created.id);
    } catch (uploadError) {
      showError('Tải lên thất bại', getApiErrorMessage(uploadError, 'Không thể tải tài liệu roadmap.'));
      throw uploadError;
    } finally {
      setUploadingKind(null);
    }
  };

  const executeConfirmAction = async () => {
    if (!confirmAction || !detail?.id) {
      return;
    }

    setActionLoading(confirmAction);
    try {
      if (confirmAction === 'approve') {
        await reviewAdminAiKnowledgeDocument(detail.id, { approved: true, reviewNote: reviewNote.trim() || undefined });
        showSuccess('Đã approve', 'Tài liệu đã được duyệt. Hệ thống sẽ refetch lại trạng thái thực tế.');
      }

      if (confirmAction === 'reject') {
        await reviewAdminAiKnowledgeDocument(detail.id, { approved: false, reviewNote: reviewNote.trim() || undefined });
        showInfo('Đã reject', 'Tài liệu đã bị từ chối. Danh sách và chi tiết đã được refetch.');
      }

      if (confirmAction === 'reindex') {
        await reindexAdminAiKnowledgeDocument(detail.id);
        showSuccess('Đã gửi reindex', 'Yêu cầu reindex đã được gửi. Hệ thống sẽ refetch lại trạng thái thay vì giả định INDEXED ngay.');
      }

      if (confirmAction === 'archive') {
        await archiveAdminAiKnowledgeDocument(detail.id);
        showSuccess('Đã archive', 'Tài liệu đã được archive. Danh sách sẽ được tải lại.');
      }

      const actionType = confirmAction;
      setConfirmAction(null);
      setReviewNote('');
      await refreshSelection(actionType === 'archive' ? null : detail.id);
    } catch (actionError) {
      showError('Thao tác thất bại', getApiErrorMessage(actionError, 'Không thể hoàn tất thao tác tài liệu AI.'));
    } finally {
      setActionLoading(null);
    }
  };

  const confirmDialogMeta = useMemo(() => {
    switch (confirmAction) {
      case 'approve':
        return {
          title: 'Approve tài liệu',
          message: 'Bạn xác nhận duyệt tài liệu này? Hệ thống sẽ refetch lại detail/list sau khi thao tác hoàn tất.',
          confirmLabel: 'Approve',
          variant: 'primary' as const,
        };
      case 'reject':
        return {
          title: 'Reject tài liệu',
          message: 'Bạn xác nhận từ chối tài liệu này? Hệ thống sẽ refetch lại detail/list sau khi thao tác hoàn tất.',
          confirmLabel: 'Reject',
          variant: 'danger' as const,
        };
      case 'reindex':
        return {
          title: 'Reindex tài liệu',
          message: 'Bạn xác nhận gửi yêu cầu reindex cho tài liệu này? UI sẽ refetch thay vì giả định tài liệu đã INDEXED ngay.',
          confirmLabel: 'Reindex',
          variant: 'primary' as const,
        };
      case 'archive':
        return {
          title: 'Archive tài liệu',
          message: 'Bạn xác nhận archive tài liệu này? Thao tác sẽ xóa tài liệu khỏi danh sách hiện tại sau khi refetch.',
          confirmLabel: 'Archive',
          variant: 'danger' as const,
        };
      default:
        return null;
    }
  }, [confirmAction]);

  const refreshSelection = useCallback(async (preferredId: number | null) => {
    const response = await fetchList(true);
    if (!response) {
      return;
    }

    if (response.content.length === 0) {
      setSelectedId(null);
      setDetail(null);
      return;
    }

    const nextId =
      preferredId != null && response.content.some((item) => item.id === preferredId)
        ? preferredId
        : response.content[0].id;

    setSelectedId(nextId);
  }, [fetchList]);

  return (
    <div className="adminaiknowledge-wrapper">
      <header className="adminaiknowledge-header">
        <div>
          <span className="adminaiknowledge-eyebrow">AI & tài nguyên</span>
          <h1>Quản lý tài liệu AI</h1>
          <p>Admin tải tài liệu chatbot/roadmap, theo dõi danh sách, xem chi tiết và thực hiện review, reindex, archive trong cùng một màn hình.</p>
        </div>
        <button
          type="button"
          className="adminaiknowledge-refresh-btn"
          onClick={() => void handleRefreshAll()}
          disabled={listRefreshing || listLoading || detailLoading || actionLoading != null}
        >
          <RefreshCw size={16} className={listRefreshing ? 'adminaiknowledge-spinning' : ''} />
          Làm mới
        </button>
      </header>

      {error && (
        <div className="adminaiknowledge-empty-block">
          <AlertTriangle size={18} />
          {error}
        </div>
      )}

      <div className="adminaiknowledge-layout">
        <div className="adminaiknowledge-top-grid">
          <AdminAiKnowledgeUploadPanel
            uploadingKind={uploadingKind}
            onUploadChatbotDocument={handleUploadChatbotDocument}
            onUploadRoadmapDocument={handleUploadRoadmapDocument}
          />

          <section className="adminaiknowledge-card">
            <div className="adminaiknowledge-section-header">
              <div>
                <span className="adminaiknowledge-section-eyebrow">Tổng quan</span>
                <h2>Điều phối tài liệu</h2>
                <p>Chọn một tài liệu để review và kiểm tra extracted text trước khi ingest hoặc archive.</p>
              </div>
            </div>

            <div className="adminaiknowledge-empty-block">
              <BrainCircuit size={18} />
              Sau upload/approve/reindex, màn hình luôn refetch lại danh sách và chi tiết để phản ánh trạng thái backend thực tế.
            </div>
          </section>
        </div>

        <AdminAiKnowledgeFilters
          filters={filters}
          onChange={setFilters}
          onReset={handleResetFilters}
        />

        <div className="adminaiknowledge-content-grid">
          <AdminAiKnowledgeList
            documents={documents}
            loading={listLoading}
            selectedId={selectedId}
            currentPage={pageMeta.number}
            totalPages={pageMeta.totalPages}
            totalElements={pageMeta.totalElements}
            onSelect={handleSelectDocument}
            onPrevPage={() => setFilters((previous) => ({ ...previous, page: Math.max((previous.page ?? 0) - 1, 0) }))}
            onNextPage={() =>
              setFilters((previous) => ({
                ...previous,
                page: Math.min((previous.page ?? 0) + 1, Math.max(pageMeta.totalPages - 1, 0)),
              }))
            }
            onRefresh={() => void fetchList(true)}
            refreshing={listRefreshing}
          />

          <AdminAiKnowledgeDetailPanel
            detail={detail}
            loading={detailLoading}
            actionLoading={actionLoading}
            onRefresh={handleRefreshDetail}
            onApprove={() => setConfirmAction('approve')}
            onReject={() => setConfirmAction('reject')}
            onReindex={() => setConfirmAction('reindex')}
            onArchive={() => setConfirmAction('archive')}
            reviewNote={reviewNote}
            onReviewNoteChange={setReviewNote}
          />
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmAction != null && confirmDialogMeta != null}
        title={confirmDialogMeta?.title ?? ''}
        message={confirmDialogMeta?.message ?? ''}
        confirmLabel={confirmDialogMeta?.confirmLabel ?? 'Xác nhận'}
        cancelLabel="Hủy"
        variant={confirmDialogMeta?.variant ?? 'default'}
        onConfirm={() => void executeConfirmAction()}
        onCancel={() => setConfirmAction(null)}
      />

      {toast && (
        <Toast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          isVisible={isVisible}
          onClose={hideToast}
          autoCloseDelay={toast.autoCloseDelay}
          showCountdown={toast.showCountdown}
          countdownText={toast.countdownText}
          actionButton={toast.actionButton}
          secondaryActionButton={toast.secondaryActionButton}
        />
      )}
    </div>
  );
};

export default AdminAiKnowledgeDashboard;
