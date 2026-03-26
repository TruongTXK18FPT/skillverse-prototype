import { useState } from 'react';
import {
  CheckCircle2,
  Clock3,
  Download,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  X,
  ZoomIn,
} from 'lucide-react';
import {
  ShortTermApplicationResponse,
  ShortTermJobResponse,
  ShortTermApplicationStatus,
  ShortTermJobStatus,
  DeliverableType,
  Deliverable,
} from '../../types/ShortTermJob';
import shortTermJobService from '../../services/shortTermJobService';
import { useToast } from '../../hooks/useToast';
import { resolveRecruitmentAssetUrl } from '../../utils/recruitmentUi';
import TrustScoreDisplay from '../short-term-job/TrustScoreDisplay';
import DisputePanel from '../short-term-job/DisputePanel';
import { useAuth } from '../../context/AuthContext';
import './short-term-fleet.css';

interface ShortTermJobHandoverBoardProps {
  job: ShortTermJobResponse;
  applications: ShortTermApplicationResponse[];
  onRefresh: () => void;
  onJobUpdate?: (updatedJob: ShortTermJobResponse) => void;
}

type HandoverFilter = 'all' | 'submitted' | 'revision' | 'approved' | 'completed';

const ShortTermJobHandoverBoard = ({
  job,
  applications,
  onRefresh,
  onJobUpdate,
}: ShortTermJobHandoverBoardProps) => {
  const { user } = useAuth();
  const { showError, showSuccess } = useToast();
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [filter, setFilter] = useState<HandoverFilter>('all');
  const [revisionModal, setRevisionModal] = useState<ShortTermApplicationResponse | null>(null);
  const [revisionNote, setRevisionNote] = useState('');
  const [lightboxImage, setLightboxImage] = useState<Deliverable | null>(null);

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
      // Nếu chưa có selectedApplicantId, gọi selectCandidate trước
      if (!job.selectedApplicantId) {
        await shortTermJobService.selectCandidate(job.id, application.id);
      }
      const approvedApp = await shortTermJobService.approveWork(application.id, 'Bàn giao đạt yêu cầu.');
      // Log trạng thái trả về để debug
      console.debug('[STJ Handover] approveWork returned:', {
        id: approvedApp.id,
        status: approvedApp.status,
        jobId: approvedApp.jobId,
      });
      // Refresh job + applicants để UI cập nhật đúng trạng thái
      const refreshedJob = await shortTermJobService.getJobDetails(job.id);
      onJobUpdate?.(refreshedJob);
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
      // Debug: check current application status
      console.debug('[STJ Handover] handleCompleteJob', {
        applicationId: application.id,
        applicationStatus: application.status,
        jobId: job.id,
        selectedApplicantId: job.selectedApplicantId,
      });
      // Re-fetch latest job + applicants to get current state
      const freshJob = await shortTermJobService.getJobDetails(job.id);
      const freshApps = await shortTermJobService.getJobApplicants(job.id, 0, 50);
      const currentApp = freshApps.content?.find((a) => a.id === application.id);
      console.debug('[STJ Handover] before completeJob', {
        currentAppStatus: currentApp?.status,
        freshJobSelectedId: freshJob.selectedApplicantId,
      });
      if (currentApp?.status !== ShortTermApplicationStatus.APPROVED) {
        showError('Chưa duyệt bàn giao', 'Vui lòng duyệt bàn giao trước khi hoàn tất.');
        setActionLoading(null);
        return;
      }
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
                        src={resolveRecruitmentAssetUrl(application.userAvatar)}
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
                      {application.userId && (
                        <div style={{ marginTop: '0.25rem' }}>
                          <TrustScoreDisplay userId={application.userId} size="small" />
                        </div>
                      )}
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
                      {deliverables.map((deliverable, index) => {
                        // TODO: remove debug log after verifying images load
                        console.debug('[STJ Handover] deliverable', index, {
                          rawUrl: deliverable.fileUrl,
                          type: deliverable.type,
                          mimeType: deliverable.mimeType,
                          fileName: deliverable.fileName,
                          resolvedUrl: resolveRecruitmentAssetUrl(deliverable.fileUrl),
                        });
                        const resolvedUrl = resolveRecruitmentAssetUrl(deliverable.fileUrl);
                        console.debug(`[STJ Handover] Image URL debug: raw="${deliverable.fileUrl}", resolved="${resolvedUrl}", type=${deliverable.type}, mimeType=${deliverable.mimeType}`);
                        const isImage = deliverable.type === DeliverableType.IMAGE || /^\s*image\//i.test(deliverable.mimeType || '');
                        const isVideo = deliverable.type === DeliverableType.VIDEO || /^\s*video\//i.test(deliverable.mimeType || '');
                        const fileSize = deliverable.fileSize > 0
                          ? `${(deliverable.fileSize / 1024).toFixed(1)} KB`
                          : '';

                        return (
                          <li key={deliverable.id || index}>
                            {isImage ? (
                              <div className="stj-handover-card__image-item">
                                <img
                                  src={resolvedUrl}
                                  alt={deliverable.fileName || 'Hình ảnh bàn giao'}
                                  className="stj-handover-card__image-thumb"
                                  onClick={() => setLightboxImage({ ...deliverable, fileUrl: resolvedUrl || deliverable.fileUrl })}
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('stj-handover-card__image-fallback--hidden');
                                  }}
                                />
                                <div className="stj-handover-card__image-fallback stj-handover-card__image-fallback--hidden">
                                  <ImageIcon size={20} />
                                  <span>{deliverable.fileName}</span>
                                </div>
                                <div className="stj-handover-card__image-overlay">
                                  <button
                                    className="stj-handover-card__image-btn"
                                    onClick={() => setLightboxImage({ ...deliverable, fileUrl: resolvedUrl || deliverable.fileUrl })}
                                    title="Xem ảnh"
                                  >
                                    <ZoomIn size={14} />
                                  </button>
                                  <a
                                    href={resolvedUrl}
                                    download={deliverable.fileName}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="stj-handover-card__image-btn"
                                    title="Tải về"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Download size={14} />
                                  </a>
                                </div>
                                {fileSize && (
                                  <span className="stj-handover-card__image-size">{fileSize}</span>
                                )}
                              </div>
                            ) : isVideo ? (
                              <div className="stj-handover-card__file-item stj-handover-card__file-item--video">
                                <video
                                  src={resolvedUrl}
                                  className="stj-handover-card__video-thumb"
                                  onClick={() => window.open(resolvedUrl, '_blank')}
                                />
                                <div className="stj-handover-card__file-info">
                                  <a
                                    href={resolvedUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="stj-handover-card__file-link"
                                    title={deliverable.fileName || resolvedUrl || 'Video bàn giao'}
                                  >
                                    <ExternalLink size={11} />
                                    <span className="stj-handover-card__file-link-text">
                                      {deliverable.fileName || 'Video bàn giao'}
                                    </span>
                                  </a>
                                  {fileSize && <span className="stj-handover-card__file-size">{fileSize}</span>}
                                </div>
                                <a
                                  href={resolvedUrl}
                                  download={deliverable.fileName}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="stj-handover-card__file-download"
                                  title="Tải về"
                                >
                                  <Download size={12} />
                                </a>
                              </div>
                            ) : (
                              <div className="stj-handover-card__file-item">
                                <a
                                  href={resolvedUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="stj-handover-card__file-link"
                                  title={deliverable.fileName || resolvedUrl || 'File bàn giao'}
                                >
                                  <ExternalLink size={11} />
                                  <span className="stj-handover-card__file-link-text">
                                    {deliverable.fileName || 'File bàn giao'}
                                  </span>
                                </a>
                                {fileSize && <span className="stj-handover-card__file-size">{fileSize}</span>}
                                <a
                                  href={resolvedUrl}
                                  download={deliverable.fileName}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="stj-handover-card__file-download"
                                  title="Tải về"
                                >
                                  <Download size={12} />
                                </a>
                              </div>
                            )}
                          </li>
                        );
                      })}
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

                  {application.status === ShortTermApplicationStatus.COMPLETED &&
                    job.status !== ShortTermJobStatus.COMPLETED && job.status !== ShortTermJobStatus.PAID && (
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

      {/* Dispute Panel */}
      <DisputePanel
        jobId={job.id}
        applicationId={job.selectedApplicantId}
        currentUserId={user?.id || 0}
        currentUserRole="RECRUITER"
        jobStatus={job.status}
      />

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

      {lightboxImage && (
        <div
          className="stj-lightbox"
          onClick={() => setLightboxImage(null)}
        >
          <div className="stj-lightbox__inner" onClick={(e) => e.stopPropagation()}>
            <button
              className="stj-lightbox__close"
              onClick={() => setLightboxImage(null)}
            >
              <X size={20} />
            </button>
            <img
              src={resolveRecruitmentAssetUrl(lightboxImage.fileUrl)}
              alt={lightboxImage.fileName || 'Hình ảnh bàn giao'}
              className="stj-lightbox__img"
            />
            <div className="stj-lightbox__footer">
              <span className="stj-lightbox__filename">
                <ImageIcon size={14} />
                {lightboxImage.fileName || 'Hình ảnh bàn giao'}
              </span>
              <a
                href={resolveRecruitmentAssetUrl(lightboxImage.fileUrl)}
                download={lightboxImage.fileName}
                target="_blank"
                rel="noopener noreferrer"
                className="stj-lightbox__download"
              >
                <Download size={14} />
                Tải về
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShortTermJobHandoverBoard;
