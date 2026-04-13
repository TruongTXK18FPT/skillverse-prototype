import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Briefcase,
  Building2,
  Calendar,
  Loader2,
  MapPin,
  RefreshCw,
  Search,
  Users,
  X,
} from "lucide-react";
import { JobPostingResponse, JobStatus } from "../../data/jobDTOs";
import adminService from "../../services/adminService";
import { useToast } from "../../hooks/useToast";
import Toast from "../shared/Toast";
import {
  formatCurrency,
  formatDate,
  getFullTimeStatusLabel,
  getFullTimeStatusTone,
  StatusTone,
} from "./jobManagementCommon";

interface FullTimeJobsViewProps {
  onDataChanged?: () => void;
}

const ITEMS_PER_PAGE = 8;
type FullTimeFilter = "ALL" | JobStatus;

const STATUS_OPTIONS: Array<{ value: JobStatus; label: string }> = [
  { value: JobStatus.IN_PROGRESS, label: "Bản nháp" },
  { value: JobStatus.PENDING_APPROVAL, label: "Chờ duyệt" },
  { value: JobStatus.OPEN, label: "Đang tuyển" },
  { value: JobStatus.REJECTED, label: "Bị từ chối" },
  { value: JobStatus.CLOSED, label: "Đã đóng" },
];

const STATUS_FILTER_ITEMS: Array<{ value: FullTimeFilter; label: string }> = [
  { value: "ALL", label: "Tất cả" },
  ...STATUS_OPTIONS,
];

const toneClass = (tone: StatusTone) =>
  `jmt-status-chip jmt-status-chip--${tone}`;

export const FullTimeJobsView: React.FC<FullTimeJobsViewProps> = ({
  onDataChanged,
}) => {
  const { toast, isVisible, hideToast, showError, showSuccess, showWarning } =
    useToast();

  const [jobs, setJobs] = useState<JobPostingResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [statusFilter, setStatusFilter] = useState<FullTimeFilter>("ALL");
  const [searchKeyword, setSearchKeyword] = useState("");

  const [closeModalJob, setCloseModalJob] = useState<JobPostingResponse | null>(
    null,
  );
  const [closeReason, setCloseReason] = useState("");
  const [closing, setClosing] = useState(false);

  const loadJobs = useCallback(
    async (targetPage: number, status?: JobStatus) => {
      setLoading(true);
      try {
        const response = await adminService.getAllFullTimeJobs({
          page: targetPage,
          size: ITEMS_PER_PAGE,
          status,
        });

        setJobs(response.content ?? []);
        setPage(response.number ?? 0);
        setTotalPages(response.totalPages ?? 0);
        setTotalItems(response.totalElements ?? 0);
      } catch (error) {
        console.error("Failed to load full-time jobs", error);
        showError("Lỗi", "Không thể tải danh sách việc làm full-time");
      } finally {
        setLoading(false);
      }
    },
    [showError],
  );

  useEffect(() => {
    loadJobs(0, statusFilter === "ALL" ? undefined : statusFilter);
  }, [loadJobs, statusFilter]);

  const filteredJobs = useMemo(() => {
    if (!searchKeyword.trim()) {
      return jobs;
    }

    const keyword = searchKeyword.toLowerCase();
    return jobs.filter((job) => {
      return (
        job.title.toLowerCase().includes(keyword) ||
        String(job.id).includes(keyword) ||
        job.recruiterCompanyName.toLowerCase().includes(keyword) ||
        job.recruiterEmail.toLowerCase().includes(keyword)
      );
    });
  }, [jobs, searchKeyword]);

  const openCount = filteredJobs.filter(
    (job) => job.status === JobStatus.OPEN,
  ).length;
  const pendingCount = filteredJobs.filter(
    (job) => job.status === JobStatus.PENDING_APPROVAL,
  ).length;

  const handleCloseJob = async () => {
    if (!closeModalJob) return;

    if (closeModalJob.status === JobStatus.CLOSED) {
      showWarning("Thông báo", "Tin tuyển dụng đã ở trạng thái đóng");
      return;
    }

    setClosing(true);
    try {
      await adminService.closeFullTimeJob(
        closeModalJob.id,
        closeReason || undefined,
      );
      showSuccess("Thành công", `Đã đóng tin #${closeModalJob.id}`);
      setCloseModalJob(null);
      setCloseReason("");
      await loadJobs(page, statusFilter === "ALL" ? undefined : statusFilter);
      onDataChanged?.();
    } catch (error) {
      console.error("Failed to close full-time job", error);
      showError("Lỗi", "Không thể đóng tin tuyển dụng");
    } finally {
      setClosing(false);
    }
  };

  return (
    <div className="jmt-stack">
      <div className="jmt-row jmt-row--between">
        <div>
          <h3 className="jmt-title">Quản lý việc làm Full-time</h3>
          <p className="jmt-subtitle">
            Theo dõi vòng đời tin tuyển dụng dài hạn, từ duyệt tin đến đóng tin.
          </p>
        </div>
        <button
          className="jmt-btn jmt-btn--ghost"
          onClick={() =>
            loadJobs(page, statusFilter === "ALL" ? undefined : statusFilter)
          }
        >
          <RefreshCw size={14} /> Làm mới
        </button>
      </div>

      <div
        className="jmt-filter-items"
        role="tablist"
        aria-label="Lọc trạng thái full-time"
      >
        {STATUS_FILTER_ITEMS.map((item) => (
          <button
            key={item.value}
            className={`jmt-filter-item ${statusFilter === item.value ? "active" : ""}`}
            onClick={() => {
              setStatusFilter(item.value);
              setPage(0);
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="jmt-toolbar">
        <label className="jmt-input-wrap jmt-input-wrap--icon jmt-input-wrap--grow">
          <Search size={14} />
          <input
            className="jmt-input"
            placeholder="Tìm theo ID, tiêu đề, công ty, email"
            value={searchKeyword}
            onChange={(event) => setSearchKeyword(event.target.value)}
          />
        </label>
      </div>

      <div className="jmt-kpi-grid jmt-kpi-grid--compact">
        <article className="jmt-kpi-card jmt-kpi-card--blue">
          <div className="jmt-kpi-icon">
            <Briefcase size={16} />
          </div>
          <div>
            <div className="jmt-kpi-value">{totalItems}</div>
            <div className="jmt-kpi-label">Tổng tin full-time</div>
          </div>
        </article>
        <article className="jmt-kpi-card jmt-kpi-card--green">
          <div className="jmt-kpi-icon">
            <Users size={16} />
          </div>
          <div>
            <div className="jmt-kpi-value">{openCount}</div>
            <div className="jmt-kpi-label">Đang tuyển (trang hiện tại)</div>
          </div>
        </article>
        <article className="jmt-kpi-card jmt-kpi-card--amber">
          <div className="jmt-kpi-icon">
            <Calendar size={16} />
          </div>
          <div>
            <div className="jmt-kpi-value">{pendingCount}</div>
            <div className="jmt-kpi-label">Chờ duyệt (trang hiện tại)</div>
          </div>
        </article>
      </div>

      {loading ? (
        <div className="jmt-state-card">
          <Loader2 size={28} className="jmt-spin" />
          <p>Đang tải danh sách full-time...</p>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="jmt-state-card">
          <p>Không tìm thấy tin full-time phù hợp bộ lọc.</p>
        </div>
      ) : (
        <div className="jmt-list-grid">
          {filteredJobs.map((job) => {
            const tone = getFullTimeStatusTone(job.status);

            return (
              <article
                key={job.id}
                className="jmt-job-card jmt-job-card--fulltime"
              >
                <header className="jmt-job-card__header">
                  <div>
                    <h4>
                      #{job.id} - {job.title}
                    </h4>
                    <p>{job.recruiterCompanyName}</p>
                  </div>
                  <span className={toneClass(tone)}>
                    {getFullTimeStatusLabel(job.status)}
                  </span>
                </header>

                <div className="jmt-job-card__meta">
                  <span>
                    <Building2 size={14} /> {job.recruiterEmail}
                  </span>
                  <span>
                    <MapPin size={14} />{" "}
                    {job.isRemote ? "Remote" : job.location || "On-site"}
                  </span>
                  <span>
                    <Users size={14} /> {job.applicantCount} ứng viên
                  </span>
                  <span>
                    <Calendar size={14} /> Hạn: {formatDate(job.deadline)}
                  </span>
                </div>

                <div className="jmt-job-card__budget">
                  {formatCurrency(job.minBudget)} -{" "}
                  {formatCurrency(job.maxBudget)}
                </div>

                <div className="jmt-tag-row">
                  {(job.requiredSkills ?? []).slice(0, 4).map((skill) => (
                    <span key={skill} className="jmt-tag">
                      {skill}
                    </span>
                  ))}
                  {(job.requiredSkills ?? []).length > 4 && (
                    <span className="jmt-tag jmt-tag--muted">
                      +{(job.requiredSkills ?? []).length - 4}
                    </span>
                  )}
                </div>

                <footer className="jmt-job-card__footer">
                  <span>Tạo: {formatDate(job.createdAt)}</span>
                  <button
                    className="jmt-btn jmt-btn--danger"
                    disabled={job.status === JobStatus.CLOSED}
                    onClick={() => setCloseModalJob(job)}
                  >
                    Đóng tin
                  </button>
                </footer>
              </article>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="jmt-pagination">
          <button
            className="jmt-btn jmt-btn--ghost"
            disabled={page <= 0}
            onClick={() =>
              loadJobs(
                page - 1,
                statusFilter === "ALL" ? undefined : statusFilter,
              )
            }
          >
            Trước
          </button>
          <span>
            Trang {page + 1} / {totalPages}
          </span>
          <button
            className="jmt-btn jmt-btn--ghost"
            disabled={page >= totalPages - 1}
            onClick={() =>
              loadJobs(
                page + 1,
                statusFilter === "ALL" ? undefined : statusFilter,
              )
            }
          >
            Sau
          </button>
        </div>
      )}

      {closeModalJob && (
        <div className="jmt-modal-overlay" role="dialog" aria-modal="true">
          <div className="jmt-modal-card">
            <div className="jmt-modal-head">
              <h4>Xác nhận đóng tin Full-time #{closeModalJob.id}</h4>
              <button
                className="jmt-icon-btn"
                onClick={() => {
                  setCloseModalJob(null);
                  setCloseReason("");
                }}
              >
                <X size={16} />
              </button>
            </div>

            <p className="jmt-subtitle">
              Lý do đóng tin (không bắt buộc). Thông tin này giúp audit rõ ràng
              hơn.
            </p>

            <textarea
              className="jmt-textarea"
              rows={4}
              value={closeReason}
              onChange={(event) => setCloseReason(event.target.value)}
              placeholder="Ví dụ: đã tuyển đủ nhân sự"
            />

            <div className="jmt-row jmt-row--end">
              <button
                className="jmt-btn jmt-btn--ghost"
                onClick={() => {
                  setCloseModalJob(null);
                  setCloseReason("");
                }}
                disabled={closing}
              >
                Hủy
              </button>
              <button
                className="jmt-btn jmt-btn--danger"
                onClick={handleCloseJob}
                disabled={closing}
              >
                {closing ? <Loader2 size={14} className="jmt-spin" /> : null}
                Xác nhận đóng tin
              </button>
            </div>
          </div>
        </div>
      )}

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
          useOverlay={toast.useOverlay}
          actionButton={toast.actionButton}
          secondaryActionButton={toast.secondaryActionButton}
        />
      )}
    </div>
  );
};

export default FullTimeJobsView;
