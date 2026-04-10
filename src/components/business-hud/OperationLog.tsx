import React, { useCallback, useEffect, useState } from "react";
import {
  Activity,
  BriefcaseBusiness,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileText,
  Loader2,
  MapPin,
  Search,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import jobService from "../../services/jobService";
import { JobPostingResponse, JobStatus } from "../../data/jobDTOs";
import { useToast } from "../../hooks/useToast";
import FullTimeJobFullPage from "./FullTimeJobFullPage";
import "./operation-log.css";

interface OperationLogProps {
  refreshTrigger?: number;
}

type StatusFilter = "ALL" | JobStatus;
type Tone = "cyan" | "emerald" | "amber" | "rose" | "slate" | "violet";

const STATUS_META: Record<JobStatus, { label: string; desc: string; tone: Tone }> = {
  [JobStatus.IN_PROGRESS]: {
    label: "Nháp",
    desc: "Tin đang được soạn nội bộ hoặc chờ hoàn thiện trước khi gửi duyệt.",
    tone: "violet",
  },
  [JobStatus.PENDING_APPROVAL]: {
    label: "Chờ duyệt",
    desc: "Tin đã gửi lên admin và đang chờ phê duyệt để mở tuyển.",
    tone: "amber",
  },
  [JobStatus.OPEN]: {
    label: "Đang mở",
    desc: "Tin đang hoạt động và tiếp tục nhận hồ sơ ứng tuyển.",
    tone: "emerald",
  },
  [JobStatus.REJECTED]: {
    label: "Từ chối",
    desc: "Tin cần cập nhật lại nội dung trước khi có thể gửi duyệt lại.",
    tone: "rose",
  },
  [JobStatus.CLOSED]: {
    label: "Đã đóng",
    desc: "Tin đã dừng nhận hồ sơ và ở chế độ lưu trữ hoặc tái sử dụng.",
    tone: "slate",
  },
};

const FILTERS: Array<{ value: StatusFilter; label: string; tone: Tone }> = [
  { value: "ALL", label: "Tất cả", tone: "cyan" },
  { value: JobStatus.OPEN, label: "Đang mở", tone: "emerald" },
  { value: JobStatus.PENDING_APPROVAL, label: "Chờ duyệt", tone: "amber" },
  { value: JobStatus.CLOSED, label: "Đã đóng", tone: "slate" },
  { value: JobStatus.REJECTED, label: "Từ chối", tone: "rose" },
  { value: JobStatus.IN_PROGRESS, label: "Nháp", tone: "violet" },
];

const JOBS_PER_PAGE = 6;

const parseDateOnly = (value: string) => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  }
  return new Date(value);
};

const formatDate = (value: string) =>
  parseDateOnly(value).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);

const compactCurrency = (value: number) => {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)} tỷ`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} triệu`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return value.toLocaleString("vi-VN");
};

const formatRelative = (value: string) => {
  const diffMinutes = Math.max(
    0,
    Math.round((Date.now() - new Date(value).getTime()) / (1000 * 60)),
  );
  if (diffMinutes < 1) return "vừa xong";
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return formatDate(value);
};

const getDeadlineMeta = (deadline: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = parseDateOnly(deadline);
  target.setHours(0, 0, 0, 0);
  const diff = Math.ceil((target.getTime() - today.getTime()) / 86400000);
  if (diff < 0) return { label: "Đã quá hạn", tone: "rose" as Tone };
  if (diff === 0) return { label: "Đến hạn hôm nay", tone: "amber" as Tone };
  if (diff <= 3) return { label: `Còn ${diff} ngày`, tone: "amber" as Tone };
  return { label: `Còn ${diff} ngày`, tone: "cyan" as Tone };
};

const OperationLog: React.FC<OperationLogProps> = ({ refreshTrigger }) => {
  const { showError } = useToast();
  const [jobs, setJobs] = useState<JobPostingResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [currentPage, setCurrentPage] = useState(0);

  const fetchJobs = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await jobService.getMyJobs();
      setJobs(data);
    } catch (error) {
      console.error("Error fetching full-time jobs:", error);
      showError("Lỗi hệ thống", "Không thể tải trung tâm quản lý job dài hạn.");
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs, refreshTrigger]);

  useEffect(() => {
    setCurrentPage(0);
  }, [searchQuery, statusFilter]);

  const filteredJobs = jobs
    .filter((job) => {
      const query = searchQuery.trim().toLowerCase();
      const searchHit =
        !query ||
        job.title.toLowerCase().includes(query) ||
        job.description.toLowerCase().includes(query) ||
        job.requiredSkills.some((skill) => skill.toLowerCase().includes(query));
      const statusHit = statusFilter === "ALL" || job.status === statusFilter;
      return searchHit && statusHit;
    })
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );

  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / JOBS_PER_PAGE));

  useEffect(() => {
    if (currentPage > totalPages - 1) {
      setCurrentPage(Math.max(0, totalPages - 1));
    }
  }, [currentPage, totalPages]);

  const paginatedJobs = filteredJobs.slice(
    currentPage * JOBS_PER_PAGE,
    currentPage * JOBS_PER_PAGE + JOBS_PER_PAGE,
  );

  const openJobs = jobs.filter((job) => job.status === JobStatus.OPEN);
  const pendingJobs = jobs.filter(
    (job) => job.status === JobStatus.PENDING_APPROVAL,
  );
  const rejectedJobs = jobs.filter((job) => job.status === JobStatus.REJECTED);
  const draftJobs = jobs.filter((job) => job.status === JobStatus.IN_PROGRESS);
  const totalApplicants = jobs.reduce(
    (sum, job) => sum + (job.applicantCount || 0),
    0,
  );
  const jobsNeedAttention = jobs.filter((job) =>
    [JobStatus.PENDING_APPROVAL, JobStatus.REJECTED].includes(job.status),
  );
  const latestActivityAt = jobs.length
    ? jobs.reduce((latest, job) =>
        new Date(job.updatedAt).getTime() > new Date(latest.updatedAt).getTime()
          ? job
          : latest,
      ).updatedAt
    : null;

  const averageApplicantLoad = jobs.length
    ? Math.round(totalApplicants / jobs.length)
    : 0;

  if (selectedJobId) {
    return (
      <FullTimeJobFullPage
        jobId={selectedJobId}
        onBack={() => {
          setSelectedJobId(null);
          void fetchJobs();
        }}
      />
    );
  }

  return (
    <section className="oplog">
      <header className="oplog__hero">
        <div>
          <span className="oplog__eyebrow">
            <Activity size={14} />
            Full-time command center
          </span>
          <h2>Quản lý job dài hạn trên một trục điều phối thống nhất</h2>
          <p>
            Theo dõi trạng thái job, độ nóng của ứng viên và chuyển nhanh vào
            trang chi tiết để xử lý applicant, hợp đồng và vận hành tuyển dụng.
          </p>
          <div className="oplog__hero-tags">
            <span className="oplog__tag oplog__tag--cyan">
              <Sparkles size={13} />
              Luồng xem chi tiết riêng
            </span>
            <span className="oplog__tag oplog__tag--violet">
              <FileText size={13} />
              Quản trị tập trung
            </span>
            <span className="oplog__tag oplog__tag--amber">
              <Clock3 size={13} />
              Ưu tiên xử lý nhanh
            </span>
          </div>
        </div>

        <div className="oplog__pulse-card">
          <div className="oplog__pulse-row">
            <span>Đồng bộ gần nhất</span>
            <strong>
              {latestActivityAt ? formatRelative(latestActivityAt) : "Chưa có"}
            </strong>
          </div>
          <div className="oplog__pulse-row">
            <span>Job cần chú ý</span>
            <strong>{jobsNeedAttention.length}</strong>
          </div>
          <div className="oplog__pulse-row">
            <span>Tải ứng viên trung bình</span>
            <strong>{averageApplicantLoad} hồ sơ / job</strong>
          </div>
        </div>
      </header>

      <div className="oplog__stats">
        {[
          {
            label: "Tổng job",
            value: jobs.length,
            tone: "cyan" as Tone,
            icon: BriefcaseBusiness,
          },
          {
            label: "Đang mở",
            value: openJobs.length,
            tone: "emerald" as Tone,
            icon: Activity,
          },
          {
            label: "Chờ duyệt",
            value: pendingJobs.length,
            tone: "amber" as Tone,
            icon: Sparkles,
          },
          {
            label: "Bản nháp",
            value: draftJobs.length,
            tone: "violet" as Tone,
            icon: FileText,
          },
          {
            label: "Ứng viên",
            value: totalApplicants,
            tone: "slate" as Tone,
            icon: Users,
          },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <article
              key={stat.label}
              className="oplog__stat"
              data-tone={stat.tone}
              style={{ ["--index" as const]: index } as React.CSSProperties}
            >
              <div className="oplog__stat-icon">
                <Icon size={18} />
              </div>
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </article>
          );
        })}
      </div>

      <section className="oplog__toolbar">
        <label className="oplog__search">
          <Search size={15} />
          <input
            type="text"
            placeholder="Tìm theo tiêu đề, mô tả hoặc kỹ năng..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </label>

        <div className="oplog__filters">
          {FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              className={`oplog__filter ${statusFilter === filter.value ? "is-active" : ""}`}
              data-tone={filter.tone}
              onClick={() => setStatusFilter(filter.value)}
            >
              <span>{filter.label}</span>
              <strong>
                {filter.value === "ALL"
                  ? jobs.length
                  : jobs.filter((job) => job.status === filter.value).length}
              </strong>
            </button>
          ))}
        </div>

        <div className="oplog__summary">
          <span>
            <FileText size={13} />
            {filteredJobs.length}/{jobs.length} job
          </span>
          <span>
            <Clock3 size={13} />
            {latestActivityAt ? formatDateTime(latestActivityAt) : "Chưa có dữ liệu"}
          </span>
        </div>
      </section>

      <div className="oplog__workspace">
        <aside className="oplog__list-panel">
          <div className="oplog__panel-head">
            <div>
              <span>Full-time fleet</span>
              <h3>Danh sách chiến dịch tuyển dụng</h3>
            </div>
            <strong>{filteredJobs.length}</strong>
          </div>

          <div className="oplog__list-shell">
            {isLoading ? (
              <div className="oplog__state">
                <Loader2 size={24} className="oplog__spin" />
                <h4>Đang tải job dài hạn</h4>
                <p>Hệ thống đang đồng bộ dữ liệu tuyển dụng và applicant count.</p>
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="oplog__empty">
                <div className="oplog__empty-orb">
                  <Search size={28} />
                </div>
                <span className="oplog__eyebrow oplog__eyebrow--small">
                  <FileText size={12} />
                  Không có kết quả
                </span>
                <h3>Chưa có job phù hợp bộ lọc hiện tại</h3>
                <p>
                  Hãy đổi từ khóa hoặc trạng thái để quay lại toàn bộ danh sách
                  job full-time đang quản lý.
                </p>
              </div>
            ) : (
              <div className="oplog__list">
                {paginatedJobs.map((job, index) => {
                  const meta = STATUS_META[job.status];
                  const deadline = getDeadlineMeta(job.deadline);

                  return (
                    <button
                      key={job.id}
                      type="button"
                      className={`oplog__item oplog__item--${meta.tone}`}
                      onClick={() => setSelectedJobId(job.id)}
                      style={{ ["--index" as const]: index } as React.CSSProperties}
                    >
                      <div className="oplog__item-top">
                        <div>
                          <span className="oplog__item-id">JOB #{job.id} {job.title}</span>
                        </div>
                        <span className={`oplog__badge oplog__badge--${meta.tone}`}>
                          {meta.label}
                        </span>
                      </div>

                      <div className="oplog__item-meta">
                        <span>
                          <CalendarDays size={12} />
                          {formatDate(job.deadline)}
                        </span>
                        <span>
                          <Wallet size={12} />
                          {job.isNegotiable
                            ? "Thỏa thuận"
                            : `${compactCurrency(job.maxBudget)} VNĐ`}
                        </span>
                        <span>
                          <Users size={12} />
                          {job.applicantCount || 0} hồ sơ
                        </span>
                      </div>

                      <div className="oplog__item-bottom">
                        <span className={`oplog__deadline oplog__deadline--${deadline.tone}`}>
                          {deadline.label}
                        </span>
                        <span>
                          <MapPin size={12} />
                          {job.isRemote ? "Từ xa / hybrid" : job.location || "On-site"}
                        </span>
                      </div>

                      <div className="oplog__timeline">
                        <div>
                          <span>Cập nhật cuối</span>
                          <strong>{formatRelative(job.updatedAt)}</strong>
                        </div>
                        <div>
                          <span>Mô hình</span>
                          <strong>{job.isRemote ? "Remote / hybrid" : "On-site"}</strong>
                        </div>
                      </div>

                      {job.requiredSkills.length > 0 && (
                        <div className="oplog__skills">
                          {job.requiredSkills.slice(0, 5).map((skill) => (
                            <span key={`${job.id}-${skill}`}>{skill}</span>
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {filteredJobs.length > 0 && totalPages > 1 && (
              <div className="oplog__pagination">
                <button
                  type="button"
                  className="oplog__pagination-btn"
                  onClick={() => setCurrentPage((page) => Math.max(0, page - 1))}
                  disabled={currentPage === 0}
                >
                  <ChevronLeft size={14} />
                  Trước
                </button>
                <div className="oplog__pagination-pages">
                  {Array.from({ length: totalPages }, (_, page) => (
                    <button
                      key={page}
                      type="button"
                      className={`oplog__pagination-page ${currentPage === page ? "is-active" : ""}`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page + 1}
                    </button>
                  ))}
                </div>
                <div className="oplog__pagination-meta">
                  <span>
                    Trang {currentPage + 1}/{totalPages}
                  </span>
                  <strong>{filteredJobs.length} job</strong>
                </div>
                <button
                  type="button"
                  className="oplog__pagination-btn"
                  onClick={() =>
                    setCurrentPage((page) => Math.min(totalPages - 1, page + 1))
                  }
                  disabled={currentPage >= totalPages - 1}
                >
                  Sau
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        </aside>
      </div>

      {!isLoading && jobs.length > 0 && (
        <section className="oplog__stats">
          {[
            {
              label: "Đang xử lý",
              value: pendingJobs.length + draftJobs.length,
              tone: "amber" as Tone,
              icon: Clock3,
            },
            {
              label: "Có rủi ro",
              value: rejectedJobs.length,
              tone: "rose" as Tone,
              icon: Sparkles,
            },
            {
              label: "Budget max",
              value: openJobs.length
                ? formatCurrency(
                    Math.max(...openJobs.map((job) => job.maxBudget || 0)),
                  )
                : "0 ₫",
              tone: "cyan" as Tone,
              icon: Wallet,
            },
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
              <article
                key={stat.label}
                className="oplog__stat"
                data-tone={stat.tone}
                style={{ ["--index" as const]: index } as React.CSSProperties}
              >
                <div className="oplog__stat-icon">
                  <Icon size={18} />
                </div>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </article>
            );
          })}
        </section>
      )}
    </section>
  );
};

export default OperationLog;
