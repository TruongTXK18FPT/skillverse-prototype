import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  Calendar,
  Clock3,
  Loader2,
  MapPin,
  RefreshCw,
  Search,
  ShieldMinus,
  ShieldPlus,
  Trash2,
  Users,
  X,
} from "lucide-react";
import adminService from "../../services/adminService";
import { useToast } from "../../hooks/useToast";
import { ShortTermJobStatus } from "../../types/ShortTermJob";
import Toast from "../shared/Toast";
import {
  AdminShortTermJob,
  canModifyShortTermJob,
  formatCurrency,
  formatDate,
  getShortTermStatusLabel,
  getShortTermStatusTone,
  getUrgencyLabel,
  isJobBanned,
  StatusTone,
} from "./jobManagementCommon";

interface ShortTermJobsViewProps {
  onDataChanged?: () => void;
}

type JobAction = "ban" | "unban" | "delete";
const ITEMS_PER_PAGE = 8;
type ShortTermFilter = "ALL" | ShortTermJobStatus;

const toneClass = (tone: StatusTone) =>
  `jmt-status-chip jmt-status-chip--${tone}`;

export const ShortTermJobsView: React.FC<ShortTermJobsViewProps> = ({
  onDataChanged,
}) => {
  const { toast, isVisible, hideToast, showError, showSuccess, showWarning } =
    useToast();

  const [jobs, setJobs] = useState<AdminShortTermJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [statusFilter, setStatusFilter] = useState<ShortTermFilter>("ALL");
  const [searchKeyword, setSearchKeyword] = useState("");

  const statusFilterItems = useMemo(
    () => [
      { value: "ALL" as ShortTermFilter, label: "Tất cả" },
      ...Object.values(ShortTermJobStatus).map((status) => ({
        value: status as ShortTermFilter,
        label: getShortTermStatusLabel(status),
      })),
    ],
    [],
  );

  const [selectedJob, setSelectedJob] = useState<AdminShortTermJob | null>(
    null,
  );
  const [actionType, setActionType] = useState<JobAction>("ban");
  const [actionReason, setActionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const loadJobs = useCallback(
    async (targetPage: number, status?: ShortTermJobStatus) => {
      setLoading(true);
      try {
        const response = await adminService.getAllJobs({
          page: targetPage,
          size: ITEMS_PER_PAGE,
          status,
        });

        setJobs((response.content ?? []) as AdminShortTermJob[]);
        setPage(response.number ?? 0);
        setTotalPages(response.totalPages ?? 0);
        setTotalItems(response.totalElements ?? 0);
      } catch (error) {
        console.error("Failed to load short-term jobs", error);
        showError("Lỗi", "Không thể tải danh sách short-term jobs");
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
    if (!searchKeyword.trim()) return jobs;

    const keyword = searchKeyword.toLowerCase();
    return jobs.filter((job) => {
      const title = String(job.title ?? "").toLowerCase();
      const company = String(job.recruiterCompanyName ?? "").toLowerCase();
      return (
        title.includes(keyword) ||
        company.includes(keyword) ||
        String(job.id).includes(keyword)
      );
    });
  }, [jobs, searchKeyword]);

  const disputedCount = filteredJobs.filter(
    (job) => job.status === "DISPUTED",
  ).length;
  const urgentCount = filteredJobs.filter(
    (job) => job.urgency === "ASAP" || job.urgency === "VERY_URGENT",
  ).length;

  const openActionModal = (job: AdminShortTermJob, action: JobAction) => {
    if (!canModifyShortTermJob(job.status)) {
      showWarning("Không thể thao tác", "Job đã ở trạng thái kết thúc");
      return;
    }

    setSelectedJob(job);
    setActionType(action);
    setActionReason("");
  };

  const closeActionModal = () => {
    setSelectedJob(null);
    setActionReason("");
  };

  const handleAction = async () => {
    if (!selectedJob) return;

    if (
      (actionType === "ban" || actionType === "delete") &&
      !actionReason.trim()
    ) {
      showWarning("Thiếu thông tin", "Vui lòng nhập lý do xử lý");
      return;
    }

    setActionLoading(true);
    try {
      if (actionType === "ban") {
        await adminService.banJob(selectedJob.id, actionReason.trim());
        showSuccess("Thành công", `Đã khóa job #${selectedJob.id}`);
      } else if (actionType === "unban") {
        await adminService.unbanJob(selectedJob.id);
        showSuccess("Thành công", `Đã mở khóa job #${selectedJob.id}`);
      } else {
        await adminService.deleteJob(selectedJob.id, actionReason.trim());
        showSuccess("Thành công", `Đã xóa job #${selectedJob.id}`);
      }

      closeActionModal();
      await loadJobs(page, statusFilter === "ALL" ? undefined : statusFilter);
      onDataChanged?.();
    } catch (error) {
      console.error("Failed to process short-term job action", error);
      showError("Lỗi", "Không thể xử lý thao tác với short-term job");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="jmt-stack">
      <div className="jmt-row jmt-row--between">
        <div>
          <h3 className="jmt-title">Quản lý việc làm Short-term</h3>
          <p className="jmt-subtitle">
            Quản lý các mission ngắn hạn, bao gồm trạng thái gấp, khóa tin và
            soft-delete.
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
        aria-label="Lọc trạng thái short-term"
      >
        {statusFilterItems.map((item) => (
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
            placeholder="Tìm theo ID, tiêu đề, công ty"
            value={searchKeyword}
            onChange={(event) => setSearchKeyword(event.target.value)}
          />
        </label>
      </div>

      <div className="jmt-kpi-grid jmt-kpi-grid--compact">
        <article className="jmt-kpi-card jmt-kpi-card--cyan">
          <div className="jmt-kpi-icon">
            <BadgeCheck size={16} />
          </div>
          <div>
            <div className="jmt-kpi-value">{totalItems}</div>
            <div className="jmt-kpi-label">Tổng job short-term</div>
          </div>
        </article>

        <article className="jmt-kpi-card jmt-kpi-card--red">
          <div className="jmt-kpi-icon">
            <AlertTriangle size={16} />
          </div>
          <div>
            <div className="jmt-kpi-value">{disputedCount}</div>
            <div className="jmt-kpi-label">
              Đang tranh chấp (trang hiện tại)
            </div>
          </div>
        </article>

        <article className="jmt-kpi-card jmt-kpi-card--amber">
          <div className="jmt-kpi-icon">
            <Clock3 size={16} />
          </div>
          <div>
            <div className="jmt-kpi-value">{urgentCount}</div>
            <div className="jmt-kpi-label">Mức độ gấp cao</div>
          </div>
        </article>
      </div>

      {loading ? (
        <div className="jmt-state-card">
          <Loader2 size={28} className="jmt-spin" />
          <p>Đang tải short-term jobs...</p>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="jmt-state-card">
          <p>Không có short-term job phù hợp bộ lọc.</p>
        </div>
      ) : (
        <div className="jmt-list-grid">
          {filteredJobs.map((job) => {
            const tone = getShortTermStatusTone(job.status);
            const banned = isJobBanned(job);
            const skills = Array.isArray(job.requiredSkills)
              ? (job.requiredSkills as string[])
              : [];

            return (
              <article
                key={job.id}
                className="jmt-job-card jmt-job-card--shortterm"
              >
                <header className="jmt-job-card__header">
                  <div>
                    <h4>
                      #{job.id} - {job.title || "Chưa có tiêu đề"}
                    </h4>
                    <p>{job.recruiterCompanyName || "Không rõ công ty"}</p>
                  </div>
                  <span className={toneClass(tone)}>
                    {getShortTermStatusLabel(job.status)}
                  </span>
                </header>

                <div className="jmt-job-card__meta">
                  <span>
                    <MapPin size={14} />{" "}
                    {job.isRemote ? "Remote" : job.location || "On-site"}
                  </span>
                  <span>
                    <Users size={14} /> {job.applicantCount || 0} ứng viên
                  </span>
                  <span>
                    <Calendar size={14} /> Hạn: {formatDate(job.deadline)}
                  </span>
                  <span>
                    <Clock3 size={14} /> {getUrgencyLabel(job.urgency)}
                  </span>
                </div>

                <div className="jmt-job-card__budget">
                  {formatCurrency(job.budget)}
                </div>

                <div className="jmt-tag-row">
                  {skills.slice(0, 4).map((skill) => (
                    <span key={skill} className="jmt-tag">
                      {skill}
                    </span>
                  ))}
                  {skills.length > 4 && (
                    <span className="jmt-tag jmt-tag--muted">
                      +{skills.length - 4}
                    </span>
                  )}
                </div>

                <footer className="jmt-job-card__footer">
                  <span>{banned ? "Đang bị khóa" : "Đang hoạt động"}</span>

                  <div className="jmt-row">
                    {banned ? (
                      <button
                        className="jmt-btn jmt-btn--ghost"
                        onClick={() => openActionModal(job, "unban")}
                      >
                        <ShieldPlus size={14} /> Mở khóa
                      </button>
                    ) : (
                      <button
                        className="jmt-btn jmt-btn--warn"
                        onClick={() => openActionModal(job, "ban")}
                      >
                        <ShieldMinus size={14} /> Khóa tin
                      </button>
                    )}

                    <button
                      className="jmt-btn jmt-btn--danger"
                      onClick={() => openActionModal(job, "delete")}
                    >
                      <Trash2 size={14} /> Xóa
                    </button>
                  </div>
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

      {selectedJob && (
        <div className="jmt-modal-overlay" role="dialog" aria-modal="true">
          <div className="jmt-modal-card">
            <div className="jmt-modal-head">
              <h4>
                {actionType === "ban"
                  ? "Xác nhận khóa tin"
                  : actionType === "unban"
                    ? "Xác nhận mở khóa"
                    : "Xác nhận xóa tin"}
                #{selectedJob.id}
              </h4>
              <button className="jmt-icon-btn" onClick={closeActionModal}>
                <X size={16} />
              </button>
            </div>

            {actionType === "ban" || actionType === "delete" ? (
              <>
                <p className="jmt-subtitle">
                  Lý do xử lý bắt buộc để phục vụ audit.
                </p>
                <textarea
                  className="jmt-textarea"
                  rows={4}
                  value={actionReason}
                  onChange={(event) => setActionReason(event.target.value)}
                  placeholder="Nhập lý do..."
                />
              </>
            ) : (
              <p className="jmt-subtitle">
                Hành động này sẽ mở khóa lại job để recruiter có thể tiếp tục
                vận hành.
              </p>
            )}

            <div className="jmt-row jmt-row--end">
              <button
                className="jmt-btn jmt-btn--ghost"
                onClick={closeActionModal}
                disabled={actionLoading}
              >
                Hủy
              </button>
              <button
                className="jmt-btn jmt-btn--danger"
                onClick={handleAction}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <Loader2 size={14} className="jmt-spin" />
                ) : null}
                Xác nhận
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

export default ShortTermJobsView;
