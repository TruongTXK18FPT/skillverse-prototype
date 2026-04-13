import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  Loader2,
  Search,
  ShieldX,
  X,
} from "lucide-react";
import adminService from "../../services/adminService";
import { useToast } from "../../hooks/useToast";
import Toast from "../shared/Toast";
import {
  AdminPendingJob,
  formatBudgetRange,
  formatDate,
} from "./jobManagementCommon";

interface JobApprovalViewProps {
  onDataChanged?: () => void;
}

type ApprovalAction = "approve" | "reject";
const ITEMS_PER_PAGE = 8;

const toPendingJob = (
  source: Record<string, unknown>,
  type: "FULL_TIME" | "SHORT_TERM",
): AdminPendingJob => ({
  id: Number(source.id ?? 0),
  title: String(source.title ?? "Chưa có tiêu đề"),
  description: String(source.description ?? ""),
  status: String(source.status ?? "PENDING_APPROVAL"),
  recruiterCompanyName: String(
    source.recruiterCompanyName ?? "Không rõ công ty",
  ),
  createdAt: source.createdAt ? String(source.createdAt) : undefined,
  deadline: source.deadline ? String(source.deadline) : undefined,
  budget: typeof source.budget === "number" ? source.budget : undefined,
  minBudget:
    typeof source.minBudget === "number" ? source.minBudget : undefined,
  maxBudget:
    typeof source.maxBudget === "number" ? source.maxBudget : undefined,
  isRemote: typeof source.isRemote === "boolean" ? source.isRemote : undefined,
  location: typeof source.location === "string" ? source.location : null,
  applicantCount:
    typeof source.applicantCount === "number"
      ? source.applicantCount
      : undefined,
  requiredSkills: Array.isArray(source.requiredSkills)
    ? (source.requiredSkills as string[])
    : undefined,
  _jobType: type,
});

export const JobApprovalView: React.FC<JobApprovalViewProps> = ({
  onDataChanged,
}) => {
  const { toast, isVisible, hideToast, showError, showSuccess, showWarning } =
    useToast();

  const [loading, setLoading] = useState(false);
  const [pendingFullTime, setPendingFullTime] = useState<AdminPendingJob[]>([]);
  const [pendingShortTerm, setPendingShortTerm] = useState<AdminPendingJob[]>(
    [],
  );
  const [searchKeyword, setSearchKeyword] = useState("");
  const [fullTimePage, setFullTimePage] = useState(0);
  const [shortTermPage, setShortTermPage] = useState(0);

  const [selectedJob, setSelectedJob] = useState<AdminPendingJob | null>(null);
  const [action, setAction] = useState<ApprovalAction>("approve");
  const [reason, setReason] = useState("");
  const [processing, setProcessing] = useState(false);

  const loadPending = useCallback(async () => {
    setLoading(true);
    try {
      const [fullTimeRaw, shortTermRaw] = await Promise.all([
        adminService.getPendingJobs(),
        adminService.getPendingShortTermJobs(),
      ]);

      setPendingFullTime(
        (fullTimeRaw ?? []).map((job) =>
          toPendingJob(job as Record<string, unknown>, "FULL_TIME"),
        ),
      );
      setPendingShortTerm(
        (shortTermRaw ?? []).map((job) =>
          toPendingJob(job as Record<string, unknown>, "SHORT_TERM"),
        ),
      );
    } catch (error) {
      console.error("Failed to load pending jobs", error);
      showError("Lỗi", "Không thể tải danh sách chờ duyệt");
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadPending();
  }, [loadPending]);

  const normalizedKeyword = searchKeyword.trim().toLowerCase();

  const filteredFullTime = useMemo(
    () =>
      pendingFullTime.filter((job) => {
        if (!normalizedKeyword) return true;
        return (
          String(job.id).includes(normalizedKeyword) ||
          String(job.title).toLowerCase().includes(normalizedKeyword) ||
          String(job.recruiterCompanyName)
            .toLowerCase()
            .includes(normalizedKeyword)
        );
      }),
    [pendingFullTime, normalizedKeyword],
  );

  const filteredShortTerm = useMemo(
    () =>
      pendingShortTerm.filter((job) => {
        if (!normalizedKeyword) return true;
        return (
          String(job.id).includes(normalizedKeyword) ||
          String(job.title).toLowerCase().includes(normalizedKeyword) ||
          String(job.recruiterCompanyName)
            .toLowerCase()
            .includes(normalizedKeyword)
        );
      }),
    [pendingShortTerm, normalizedKeyword],
  );

  const fullTimeTotalPages = Math.max(
    1,
    Math.ceil(filteredFullTime.length / ITEMS_PER_PAGE),
  );
  const shortTermTotalPages = Math.max(
    1,
    Math.ceil(filteredShortTerm.length / ITEMS_PER_PAGE),
  );

  useEffect(() => {
    setFullTimePage(0);
    setShortTermPage(0);
  }, [normalizedKeyword]);

  useEffect(() => {
    setFullTimePage((current) => Math.min(current, fullTimeTotalPages - 1));
  }, [fullTimeTotalPages]);

  useEffect(() => {
    setShortTermPage((current) => Math.min(current, shortTermTotalPages - 1));
  }, [shortTermTotalPages]);

  const pagedFullTime = useMemo(() => {
    const startIndex = fullTimePage * ITEMS_PER_PAGE;
    return filteredFullTime.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredFullTime, fullTimePage]);

  const pagedShortTerm = useMemo(() => {
    const startIndex = shortTermPage * ITEMS_PER_PAGE;
    return filteredShortTerm.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredShortTerm, shortTermPage]);

  const openActionModal = (
    job: AdminPendingJob,
    nextAction: ApprovalAction,
  ) => {
    setSelectedJob(job);
    setAction(nextAction);
    setReason("");
  };

  const closeActionModal = () => {
    setSelectedJob(null);
    setReason("");
  };

  const handleAction = async () => {
    if (!selectedJob) return;

    if (action === "reject" && !reason.trim()) {
      showWarning("Thiếu thông tin", "Vui lòng nhập lý do từ chối");
      return;
    }

    setProcessing(true);
    try {
      if (selectedJob._jobType === "FULL_TIME") {
        if (action === "approve") {
          await adminService.approveJob(selectedJob.id);
        } else {
          await adminService.rejectJob(selectedJob.id, reason.trim());
        }
      } else {
        if (action === "approve") {
          await adminService.approveShortTermJob(selectedJob.id);
        } else {
          await adminService.rejectShortTermJob(selectedJob.id, reason.trim());
        }
      }

      showSuccess(
        "Thành công",
        action === "approve"
          ? `Đã duyệt tin #${selectedJob.id}`
          : `Đã từ chối tin #${selectedJob.id}`,
      );

      closeActionModal();
      await loadPending();
      onDataChanged?.();
    } catch (error) {
      console.error("Failed to process approval action", error);
      showError("Lỗi", "Không thể xử lý yêu cầu duyệt/từ chối");
    } finally {
      setProcessing(false);
    }
  };

  const totalPending = pendingFullTime.length + pendingShortTerm.length;

  const renderPendingSection = (
    title: string,
    description: string,
    jobs: AdminPendingJob[],
    totalCount: number,
    currentPage: number,
    totalPages: number,
    onPrev: () => void,
    onNext: () => void,
    typeClass: "fulltime" | "shortterm",
  ) => {
    return (
      <section className="jmt-section-card">
        <header className="jmt-section-card__header">
          <div>
            <h4>{title}</h4>
            <p>{description}</p>
          </div>
          <span className="jmt-count-pill">{totalCount}</span>
        </header>

        {totalCount === 0 ? (
          <div className="jmt-state-card jmt-state-card--inline">
            <p>Không có tin chờ duyệt ở nhóm này.</p>
          </div>
        ) : (
          <div className="jmt-list-grid">
            {jobs.map((job) => (
              <article
                key={`${job._jobType}-${job.id}`}
                className={`jmt-job-card jmt-job-card--${typeClass}`}
              >
                <header className="jmt-job-card__header">
                  <div>
                    <h4>
                      #{job.id} - {job.title}
                    </h4>
                    <p>{job.recruiterCompanyName}</p>
                  </div>
                  <span className="jmt-status-chip jmt-status-chip--warning">
                    Chờ duyệt
                  </span>
                </header>

                <div className="jmt-job-card__meta">
                  <span>Ngân sách: {formatBudgetRange(job)}</span>
                  <span>Hạn: {formatDate(job.deadline)}</span>
                  <span>Tạo: {formatDate(job.createdAt)}</span>
                </div>

                <div className="jmt-tag-row">
                  {(job.requiredSkills ?? []).slice(0, 4).map((skill) => (
                    <span key={skill} className="jmt-tag">
                      {skill}
                    </span>
                  ))}
                </div>

                <footer className="jmt-job-card__footer">
                  <button
                    className="jmt-btn jmt-btn--success"
                    onClick={() => openActionModal(job, "approve")}
                  >
                    <CheckCircle2 size={14} /> Duyệt
                  </button>
                  <button
                    className="jmt-btn jmt-btn--danger"
                    onClick={() => openActionModal(job, "reject")}
                  >
                    <ShieldX size={14} /> Từ chối
                  </button>
                </footer>
              </article>
            ))}
          </div>
        )}

        {totalCount > 0 && totalPages > 1 ? (
          <div className="jmt-pagination">
            <button
              className="jmt-btn jmt-btn--ghost"
              onClick={onPrev}
              disabled={currentPage <= 0}
            >
              Trước
            </button>
            <span>
              Trang {currentPage + 1} / {totalPages}
            </span>
            <button
              className="jmt-btn jmt-btn--ghost"
              onClick={onNext}
              disabled={currentPage >= totalPages - 1}
            >
              Sau
            </button>
          </div>
        ) : null}
      </section>
    );
  };

  return (
    <div className="jmt-stack">
      <div className="jmt-row jmt-row--between">
        <div>
          <h3 className="jmt-title">Duyệt tin tuyển dụng hợp nhất</h3>
          <p className="jmt-subtitle">
            Một điểm duyệt chung cho cả Full-time và Short-term, giúp kiểm soát
            chất lượng đồng bộ.
          </p>
        </div>
        <button className="jmt-btn jmt-btn--ghost" onClick={loadPending}>
          <Clock3 size={14} /> Làm mới hàng chờ
        </button>
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
        <article className="jmt-kpi-card jmt-kpi-card--amber">
          <div className="jmt-kpi-icon">
            <Clock3 size={16} />
          </div>
          <div>
            <div className="jmt-kpi-value">{totalPending}</div>
            <div className="jmt-kpi-label">Tổng số tin chờ duyệt</div>
          </div>
        </article>

        <article className="jmt-kpi-card jmt-kpi-card--blue">
          <div className="jmt-kpi-icon">
            <CheckCircle2 size={16} />
          </div>
          <div>
            <div className="jmt-kpi-value">{pendingFullTime.length}</div>
            <div className="jmt-kpi-label">Full-time chờ duyệt</div>
          </div>
        </article>

        <article className="jmt-kpi-card jmt-kpi-card--cyan">
          <div className="jmt-kpi-icon">
            <CheckCircle2 size={16} />
          </div>
          <div>
            <div className="jmt-kpi-value">{pendingShortTerm.length}</div>
            <div className="jmt-kpi-label">Short-term chờ duyệt</div>
          </div>
        </article>
      </div>

      {loading ? (
        <div className="jmt-state-card">
          <Loader2 size={28} className="jmt-spin" />
          <p>Đang tải hàng chờ duyệt...</p>
        </div>
      ) : (
        <>
          {renderPendingSection(
            "Tin Full-time",
            "Flow tuyển dụng dài hạn, ưu tiên kiểm tra JD và mức lương.",
            pagedFullTime,
            filteredFullTime.length,
            fullTimePage,
            fullTimeTotalPages,
            () => setFullTimePage((page) => Math.max(0, page - 1)),
            () =>
              setFullTimePage((page) =>
                Math.min(fullTimeTotalPages - 1, page + 1),
              ),
            "fulltime",
          )}

          {renderPendingSection(
            "Tin Short-term",
            "Flow mission ngắn hạn, ưu tiên kiểm tra deadline và mức độ gấp.",
            pagedShortTerm,
            filteredShortTerm.length,
            shortTermPage,
            shortTermTotalPages,
            () => setShortTermPage((page) => Math.max(0, page - 1)),
            () =>
              setShortTermPage((page) =>
                Math.min(shortTermTotalPages - 1, page + 1),
              ),
            "shortterm",
          )}
        </>
      )}

      {selectedJob && (
        <div className="jmt-modal-overlay" role="dialog" aria-modal="true">
          <div className="jmt-modal-card">
            <div className="jmt-modal-head">
              <h4>
                {action === "approve" ? "Xác nhận duyệt" : "Xác nhận từ chối"} #
                {selectedJob.id}
              </h4>
              <button className="jmt-icon-btn" onClick={closeActionModal}>
                <X size={16} />
              </button>
            </div>

            {action === "reject" ? (
              <>
                <p className="jmt-subtitle">Lý do từ chối (bắt buộc).</p>
                <textarea
                  className="jmt-textarea"
                  rows={4}
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Nhập lý do từ chối..."
                />
              </>
            ) : (
              <p className="jmt-subtitle">
                Bạn đang duyệt tin tuyển dụng này để chuyển sang trạng thái
                public.
              </p>
            )}

            <div className="jmt-row jmt-row--end">
              <button
                className="jmt-btn jmt-btn--ghost"
                onClick={closeActionModal}
                disabled={processing}
              >
                Hủy
              </button>
              <button
                className={
                  action === "approve"
                    ? "jmt-btn jmt-btn--success"
                    : "jmt-btn jmt-btn--danger"
                }
                onClick={handleAction}
                disabled={processing}
              >
                {processing ? <Loader2 size={14} className="jmt-spin" /> : null}
                {action === "approve" ? "Xác nhận duyệt" : "Xác nhận từ chối"}
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

export default JobApprovalView;
