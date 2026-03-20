import { useState } from 'react';
import {
  CheckCircle2,
  Clock3,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  RefreshCw,
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

  const handoverApps = applications.filter(
    (app) =>
      app.status === ShortTermApplicationStatus.SUBMITTED
      || app.status === ShortTermApplicationStatus.REVISION_REQUIRED
      || app.status === ShortTermApplicationStatus.APPROVED
      || app.status === ShortTermApplicationStatus.COMPLETED
      || app.status === ShortTermApplicationStatus.PAID
  );

  const filteredApps = handoverApps.filter((app) => {
    if (filter === 'submitted') return app.status === ShortTermApplicationStatus.SUBMITTED;
    if (filter === 'revision') return app.status === ShortTermApplicationStatus.REVISION_REQUIRED;
    if (filter === 'approved') return app.status === ShortTermApplicationStatus.APPROVED;
    if (filter === 'completed') {
      return (
        app.status === ShortTermApplicationStatus.COMPLETED
        || app.status === ShortTermApplicationStatus.PAID
      );
    }
    return true;
  });

  const countSubmitted = handoverApps.filter(
    (application) => application.status === ShortTermApplicationStatus.SUBMITTED
  ).length;
  const countRevision = handoverApps.filter(
    (application) => application.status === ShortTermApplicationStatus.REVISION_REQUIRED
  ).length;
  const countApproved = handoverApps.filter(
    (application) => application.status === ShortTermApplicationStatus.APPROVED
  ).length;
  const countCompleted = handoverApps.filter(
    (application) =>
      application.status === ShortTermApplicationStatus.COMPLETED
      || application.status === ShortTermApplicationStatus.PAID
  ).length;

  const statCards = [
    {
      key: 'submitted',
      label: 'Đã nộp',
      meta: 'Chờ recruiter review',
      value: countSubmitted,
    },
    {
      key: 'revision',
      label: 'Cần sửa',
      meta: 'Chờ ứng viên cập nhật',
      value: countRevision,
    },
    {
      key: 'approved',
      label: 'Đã duyệt',
      meta: 'Sẵn sàng chốt job',
      value: countApproved,
    },
    {
      key: 'completed',
      label: 'Hoàn tất',
      meta: 'Đã nghiệm thu / thanh toán',
      value: countCompleted,
    },
  ] as const;

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
      case ShortTermApplicationStatus.SUBMITTED:
        return 'Đã nộp';
      case ShortTermApplicationStatus.REVISION_REQUIRED:
        return 'Cần sửa lại';
      case ShortTermApplicationStatus.APPROVED:
        return 'Đã duyệt';
      case ShortTermApplicationStatus.COMPLETED:
        return 'Hoàn thành';
      case ShortTermApplicationStatus.PAID:
        return 'Đã thanh toán';
      default:
        return status;
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
      <div className="stj-handover-stats">
        {statCards.map((stat) => (
          <div
            key={stat.key}
            className={`stj-handover-stat stj-handover-stat--${stat.key}`}
          >
            <div className="stj-handover-stat__body">
              <span className="stj-handover-stat__label">{stat.label}</span>
              <span className="stj-handover-stat__meta">{stat.meta}</span>
            </div>
            <span className={`stj-handover-stat__num stj-handover-stat__num--${stat.key}`}>
              {stat.value}
            </span>
          </div>
        ))}
      </div>

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
          {filteredApps.map((application) => {
            const isBusy = actionLoading === application.id;
            const deliverables = application.deliverables || [];
            const revisionCount = application.revisionCount || 0;

            return (
              <div
                key={application.id}
                className={`stj-handover-card ${getStatusBadgeClass(application.status)}`}
              >
                <div className="stj-handover-card__header">
                  <div className="stj-handover-card__identity">
                    {application.userAvatar ? (
                      <img
                        src={application.userAvatar}
                        alt={application.userFullName}
                        className="stj-handover-card__avatar"
                      />
                    ) : (
                      <div className="stj-handover-card__avatar stj-handover-card__avatar--fallback">
                        {application.userFullName
                          ? application.userFullName
                              .split(' ')
                              .map((name) => name[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()
                          : '??'}
                      </div>
                    )}
                    <div>
                      <strong className="stj-handover-card__name">
                        {application.userFullName || 'Không xác định'}
                      </strong>
                      <span className="stj-handover-card__subtitle">
                        {application.userProfessionalTitle || 'Ứng viên'}
                      </span>
                    </div>
                  </div>
                  <span className={`stj-handover-badge ${getStatusBadgeClass(application.status)}`}>
                    {getStatusLabel(application.status)}
                  </span>
                </div>

                <div className="stj-handover-card__meta">
                  <span>
                    <Clock3 size={12} />
                    Nộp: {formatDate(application.submittedAt || application.appliedAt)}
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

                {application.workNote && (
                  <p className="stj-handover-card__note">
                    {application.workNote}
                  </p>
                )}

                {deliverables.length > 0 && (
                  <div className="stj-handover-card__files">
                    <span className="stj-handover-card__files-label">
                      <Download size={12} />
                      Bàn giao ({deliverables.length})
                    </span>
                    <ul className="stj-handover-card__file-list">
                      {deliverables.map((deliverable, index) => (
                        <li key={deliverable.id || index}>
                          <a
                            href={deliverable.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="stj-handover-card__file-link"
                          >
                            <ExternalLink size={11} />
                            {deliverable.fileName || 'File bàn giao'}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="stj-handover-card__actions">
                  {application.status === ShortTermApplicationStatus.SUBMITTED && (
                    <>
                      <button
                        className="stj-action-btn stj-action-btn--approve"
                        disabled={isBusy}
                        onClick={() => handleApproveWork(application)}
                      >
                        {isBusy ? <Loader2 size={13} className="stj-spin" /> : <CheckCircle2 size={13} />}
                        Duyệt bàn giao
                      </button>
                      <button
                        className="stj-action-btn stj-action-btn--revision"
                        disabled={isBusy}
                        onClick={() => {
                          setRevisionModal(application);
                          setRevisionNote('');
                        }}
                      >
                        <RefreshCw size={13} />
                        Yêu cầu sửa
                      </button>
                    </>
                  )}

                  {application.status === ShortTermApplicationStatus.REVISION_REQUIRED && (
                    <div className="stj-handover-card__info-chip">
                      <RefreshCw size={13} />
                      Đã yêu cầu sửa lại - chờ ứng viên nộp lại
                    </div>
                  )}

                  {application.status === ShortTermApplicationStatus.APPROVED && (
                    <button
                      className="stj-action-btn stj-action-btn--approve"
                      disabled={isBusy}
                      onClick={() => handleCompleteJob(application)}
                    >
                      {isBusy ? <Loader2 size={13} className="stj-spin" /> : <CheckCircle2 size={13} />}
                      Hoàn tất job
                    </button>
                  )}

                  {application.status === ShortTermApplicationStatus.COMPLETED && (
                    <button
                      className="stj-action-btn stj-action-btn--approve"
                      disabled={isBusy}
                      onClick={() => handleMarkAsPaid(application)}
                    >
                      {isBusy ? <Loader2 size={13} className="stj-spin" /> : <CheckCircle2 size={13} />}
                      Xác nhận thanh toán
                    </button>
                  )}

                  {application.status === ShortTermApplicationStatus.PAID && (
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

      {revisionModal && (
        <div className="stj-modal-backdrop" onClick={() => setRevisionModal(null)}>
          <div className="stj-modal" onClick={(event) => event.stopPropagation()}>
            <span className="stj-modal__eyebrow">Yêu cầu sửa bàn giao</span>
            <h3>{revisionModal.userFullName}</h3>
            <p>Mô tả chi tiết những gì cần sửa để ứng viên hiểu rõ yêu cầu.</p>
            <textarea
              className="stj-textarea"
              value={revisionNote}
              onChange={(event) => setRevisionNote(event.target.value)}
              placeholder="Ví dụ: Logo cần đặt ở vị trí chính giữa, màu nền cần chuyển sang #020617..."
              rows={4}
            />
            <div className="stj-modal__actions">
              <button
                className="stj-btn stj-btn--secondary"
                onClick={() => setRevisionModal(null)}
              >
                Hủy
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
