import { useState } from 'react';
import {
  CheckCircle2,
  Clock3,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import {
  ShortTermApplicationResponse,
  ShortTermJobResponse,
  ShortTermApplicationStatus,
} from '../../types/ShortTermJob';
import shortTermJobService from '../../services/shortTermJobService';
import { useToast } from '../../hooks/useToast';
import './short-term-fleet.css';

interface ShortTermJobHandoverBoardProps {
  job: ShortTermJobResponse;
  applications: ShortTermApplicationResponse[];
  onRefresh: () => void;
}

type HandoverFilter = 'all' | 'submitted' | 'revision' | 'approved' | 'completed';

const ShortTermJobHandoverBoard = ({
  job,
  applications,
  onRefresh,
}: ShortTermJobHandoverBoardProps) => {
  const { showError, showSuccess } = useToast();
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [filter, setFilter] = useState<HandoverFilter>('all');
  const [revisionModal, setRevisionModal] = useState<ShortTermApplicationResponse | null>(null);
  const [revisionNote, setRevisionNote] = useState('');

  const handoverApps = applications.filter((app) =>
    app.status === ShortTermApplicationStatus.SUBMITTED ||
    app.status === ShortTermApplicationStatus.REVISION_REQUIRED ||
    app.status === ShortTermApplicationStatus.APPROVED ||
    app.status === ShortTermApplicationStatus.COMPLETED ||
    app.status === ShortTermApplicationStatus.PAID
  );

  const filteredApps = handoverApps.filter((app) => {
    if (filter === 'submitted') return app.status === ShortTermApplicationStatus.SUBMITTED;
    if (filter === 'revision') return app.status === ShortTermApplicationStatus.REVISION_REQUIRED;
    if (filter === 'approved') return app.status === ShortTermApplicationStatus.APPROVED;
    if (filter === 'completed') return (
      app.status === ShortTermApplicationStatus.COMPLETED ||
      app.status === ShortTermApplicationStatus.PAID
    );
    return true;
  });

  const countSubmitted = handoverApps.filter(
    (a) => a.status === ShortTermApplicationStatus.SUBMITTED
  ).length;
  const countRevision = handoverApps.filter(
    (a) => a.status === ShortTermApplicationStatus.REVISION_REQUIRED
  ).length;
  const countApproved = handoverApps.filter(
    (a) => a.status === ShortTermApplicationStatus.APPROVED
  ).length;
  const countCompleted = handoverApps.filter(
    (a) =>
      a.status === ShortTermApplicationStatus.COMPLETED ||
      a.status === ShortTermApplicationStatus.PAID
  ).length;

  const handleApproveWork = async (application: ShortTermApplicationResponse) => {
    try {
      setActionLoading(application.id);
      await shortTermJobService.approveWork(application.id, 'Bàn giao đạt yêu cầu.');
      showSuccess('Đã duyệt bàn giao', 'Công việc đã được chấp thuận.');
      onRefresh();
    } catch (error: any) {
      showError('Không thể duyệt', error.message || 'Vui lòng thử lại.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRequestRevision = async () => {
    if (!revisionModal || !revisionNote.trim()) {
      showError('Thiếu nội dung', 'Vui lòng nhập ghi chú yêu cầu sửa lại.');
      return;
    }
    try {
      setActionLoading(revisionModal.id);
      await shortTermJobService.requestRevision({
        applicationId: revisionModal.id,
        note: revisionNote.trim(),
      });
      setRevisionModal(null);
      setRevisionNote('');
      showSuccess('Đã yêu cầu sửa lại', 'Ứng viên sẽ được thông báo.');
      onRefresh();
    } catch (error: any) {
      showError('Không thể yêu cầu sửa', error.message || 'Vui lòng thử lại.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCompleteJob = async (application: ShortTermApplicationResponse) => {
    try {
      setActionLoading(application.id);
      await shortTermJobService.completeJob(job.id);
      showSuccess('Đã hoàn tất job', 'Công việc đã được đánh dấu hoàn thành.');
      onRefresh();
    } catch (error: any) {
      showError('Không thể hoàn tất', error.message || 'Vui lòng thử lại.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkAsPaid = async (application: ShortTermApplicationResponse) => {
    try {
      setActionLoading(application.id);
      await shortTermJobService.markAsPaid(job.id);
      showSuccess('Đã xác nhận thanh toán', 'Job đã được đánh dấu đã thanh toán.');
      onRefresh();
    } catch (error: any) {
      showError('Không thể xác nhận thanh toán', error.message || 'Vui lòng thử lại.');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadgeClass = (status: ShortTermApplicationStatus): string => {
    switch (status) {
      case ShortTermApplicationStatus.SUBMITTED:
        return 'stj-handover-badge--submitted';
      case ShortTermApplicationStatus.REVISION_REQUIRED:
        return 'stj-handover-badge--revision';
      case ShortTermApplicationStatus.APPROVED:
        return 'stj-handover-badge--approved';
      case ShortTermApplicationStatus.COMPLETED:
        return 'stj-handover-badge--completed';
      case ShortTermApplicationStatus.PAID:
        return 'stj-handover-badge--paid';
      default:
        return '';
    }
  };

  const getStatusLabel = (status: ShortTermApplicationStatus): string => {
    switch (status) {
      case ShortTermApplicationStatus.SUBMITTED: return 'Đã nộp';
      case ShortTermApplicationStatus.REVISION_REQUIRED: return 'Cần sửa lại';
      case ShortTermApplicationStatus.APPROVED: return 'Đã duyệt';
      case ShortTermApplicationStatus.COMPLETED: return 'Hoàn thành';
      case ShortTermApplicationStatus.PAID: return 'Đã thanh toán';
      default: return status;
    }
  };

  const formatDate = (date?: string): string => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="stj-handover-board">
      {/* Stats Row */}
      <div className="stj-handover-stats">
        <div className="stj-handover-stat">
          <span className="stj-handover-stat__num stj-handover-stat__num--submitted">
            {countSubmitted}
          </span>
          <span className="stj-handover-stat__label">Đã nộp</span>
        </div>
        <div className="stj-handover-stat">
          <span className="stj-handover-stat__num stj-handover-stat__num--revision">
            {countRevision}
          </span>
          <span className="stj-handover-stat__label">Cần sửa</span>
        </div>
        <div className="stj-handover-stat">
          <span className="stj-handover-stat__num stj-handover-stat__num--approved">
            {countApproved}
          </span>
          <span className="stj-handover-stat__label">Đã duyệt</span>
        </div>
        <div className="stj-handover-stat">
          <span className="stj-handover-stat__num stj-handover-stat__num--completed">
            {countCompleted}
          </span>
          <span className="stj-handover-stat__label">Hoàn tất</span>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="stj-handover-filters">
        <button
          className={`stj-filter-chip ${filter === 'all' ? 'stj-filter-chip--active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Tất cả ({handoverApps.length})
        </button>
        <button
          className={`stj-filter-chip ${filter === 'submitted' ? 'stj-filter-chip--active' : ''}`}
          onClick={() => setFilter('submitted')}
        >
          Đã nộp ({countSubmitted})
        </button>
        <button
          className={`stj-filter-chip ${filter === 'revision' ? 'stj-filter-chip--active' : ''}`}
          onClick={() => setFilter('revision')}
        >
          Cần sửa ({countRevision})
        </button>
        <button
          className={`stj-filter-chip ${filter === 'approved' ? 'stj-filter-chip--active' : ''}`}
          onClick={() => setFilter('approved')}
        >
          Đã duyệt ({countApproved})
        </button>
        <button
          className={`stj-filter-chip ${filter === 'completed' ? 'stj-filter-chip--active' : ''}`}
          onClick={() => setFilter('completed')}
        >
          Hoàn tất ({countCompleted})
        </button>
      </div>

      {/* Cards Grid */}
      {filteredApps.length === 0 ? (
        <div className="stj-handover-empty">
          <CheckCircle2 size={32} />
          <div>
            <strong>Không có bàn giao nào trong nhóm này</strong>
            <p>Bộ lọc hiện tại không có submission phù hợp.</p>
          </div>
        </div>
      ) : (
        <div className="stj-handover-grid">
          {filteredApps.map((app) => {
            const isBusy = actionLoading === app.id;
            const deliverables = app.deliverables || [];
            const revisionCount = app.revisionCount || 0;

            return (
              <div
                key={app.id}
                className={`stj-handover-card ${getStatusBadgeClass(app.status)}`}
              >
                {/* Card Header */}
                <div className="stj-handover-card__header">
                  <div className="stj-handover-card__identity">
                    {app.userAvatar ? (
                      <img
                        src={app.userAvatar}
                        alt={app.userFullName}
                        className="stj-handover-card__avatar"
                      />
                    ) : (
                      <div className="stj-handover-card__avatar stj-handover-card__avatar--fallback">
                        {app.userFullName
                          ? app.userFullName
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()
                          : '??'}
                      </div>
                    )}
                    <div>
                      <strong className="stj-handover-card__name">
                        {app.userFullName || 'Không xác định'}
                      </strong>
                      <span className="stj-handover-card__subtitle">
                        {app.userProfessionalTitle || 'Ứng viên'}
                      </span>
                    </div>
                  </div>
                  <span className={`stj-handover-badge ${getStatusBadgeClass(app.status)}`}>
                    {getStatusLabel(app.status)}
                  </span>
                </div>

                {/* Meta */}
                <div className="stj-handover-card__meta">
                  <span>
                    <Clock3 size={12} />
                    Nộp: {formatDate(app.submittedAt || app.appliedAt)}
                  </span>
                  <span>
                    <FileText size={12} />
                    {deliverables.length} files
                  </span>
                  {revisionCount > 0 && (
                    <span className="stj-handover-card__revision">
                      <RefreshCw size={12} />
                      {revisionCount} lần sửa
                    </span>
                  )}
                </div>

                {/* Work Note */}
                {app.workNote && (
                  <p className="stj-handover-card__note">
                    {app.workNote}
                  </p>
                )}

                {/* Deliverables */}
                {deliverables.length > 0 && (
                  <div className="stj-handover-card__files">
                    <span className="stj-handover-card__files-label">
                      <Download size={12} />
                      Bàn giao ({deliverables.length})
                    </span>
                    <ul className="stj-handover-card__file-list">
                      {deliverables.map((d, idx) => (
                        <li key={d.id || idx}>
                          <a
                            href={d.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="stj-handover-card__file-link"
                          >
                            <ExternalLink size={11} />
                            {d.fileName || 'File bàn giao'}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Actions */}
                <div className="stj-handover-card__actions">
                  {app.status === ShortTermApplicationStatus.SUBMITTED && (
                    <>
                      <button
                        className="stj-action-btn stj-action-btn--approve"
                        disabled={isBusy}
                        onClick={() => handleApproveWork(app)}
                      >
                        {isBusy ? <Loader2 size={13} className="stj-spin" /> : <CheckCircle2 size={13} />}
                        Duyệt bàn giao
                      </button>
                      <button
                        className="stj-action-btn stj-action-btn--revision"
                        disabled={isBusy}
                        onClick={() => {
                          setRevisionModal(app);
                          setRevisionNote('');
                        }}
                      >
                        <RefreshCw size={13} />
                        Yêu cầu sửa
                      </button>
                    </>
                  )}

                  {app.status === ShortTermApplicationStatus.REVISION_REQUIRED && (
                    <div className="stj-handover-card__info-chip">
                      <RefreshCw size={13} />
                      Đã yêu cầu sửa lại - chờ ứng viên nộp lại
                    </div>
                  )}

                  {app.status === ShortTermApplicationStatus.APPROVED && (
                    <button
                      className="stj-action-btn stj-action-btn--approve"
                      disabled={isBusy}
                      onClick={() => handleCompleteJob(app)}
                    >
                      {isBusy ? <Loader2 size={13} className="stj-spin" /> : <CheckCircle2 size={13} />}
                      Hoàn tất job
                    </button>
                  )}

                  {app.status === ShortTermApplicationStatus.COMPLETED && (
                    <button
                      className="stj-action-btn stj-action-btn--approve"
                      disabled={isBusy}
                      onClick={() => handleMarkAsPaid(app)}
                    >
                      {isBusy ? <Loader2 size={13} className="stj-spin" /> : <CheckCircle2 size={13} />}
                      Xác nhận thanh toán
                    </button>
                  )}

                  {app.status === ShortTermApplicationStatus.PAID && (
                    <div className="stj-handover-card__info-chip stj-handover-card__info-chip--success">
                      <CheckCircle2 size={13} />
                      Đã hoàn tất và thanh toán
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Revision Modal */}
      {revisionModal && (
        <div className="stj-modal-backdrop" onClick={() => setRevisionModal(null)}>
          <div className="stj-modal" onClick={(e) => e.stopPropagation()}>
            <span className="stj-modal__eyebrow">Yêu cầu sửa bàn giao</span>
            <h3>{revisionModal.userFullName}</h3>
            <p>Mô tả chi tiết những gì cần sửa để ứng viên hiểu rõ yêu cầu.</p>
            <textarea
              className="stj-textarea"
              value={revisionNote}
              onChange={(e) => setRevisionNote(e.target.value)}
              placeholder="Ví dụ: Logo cần đặt ở vị trí chính giữa, màu nền cần chuyển sang #020617..."
              rows={4}
            />
            <div className="stj-modal__actions">
              <button
                className="stj-btn stj-btn--secondary"
                onClick={() => setRevisionModal(null)}
              >
                Huỷ
              </button>
              <button
                className="stj-btn stj-btn--revision"
                disabled={actionLoading !== null || !revisionNote.trim()}
                onClick={handleRequestRevision}
              >
                {actionLoading !== null ? (
                  <Loader2 size={13} className="stj-spin" />
                ) : (
                  <RefreshCw size={13} />
                )}
                Gửi yêu cầu sửa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShortTermJobHandoverBoard;
