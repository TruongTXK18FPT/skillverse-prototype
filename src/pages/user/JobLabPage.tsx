import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Clock,
  DollarSign,
  FileCheck,
  FileText,
  FolderOpen,
  Globe,
  Link as LinkIcon,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  Send,
  Timer,
  Trash2,
  Upload,
  Wallet,
  XCircle,
  Zap,
} from "lucide-react";
import jobService from "../../services/jobService";
import shortTermJobService from "../../services/shortTermJobService";
import { JobApplicationResponse } from "../../data/jobDTOs";
import {
  ShortTermApplicationResponse,
  SubmitDeliverableRequest,
} from "../../types/ShortTermJob";
import MeowlKuruLoader from "../../components/kuru-loader/MeowlKuruLoader";
import "../../styles/JobLabWorkspace.css";

type JobType = "ALL" | "REGULAR" | "SHORT_TERM";
type ViewMode = "dashboard" | "applications" | "workspace";

type AppItem = {
  id: string;
  type: "REGULAR" | "SHORT_TERM";
  applicationId: number;
  title: string;
  company: string;
  budget: number;
  isRemote: boolean;
  location: string;
  appliedAt: string;
  status: string;
  coverLetter?: string;
  proposedPrice?: number;
  proposedDuration?: string;
  workNote?: string;
  revisionCount?: number;
  deliverables?: Array<{ id: number; fileName: string; fileUrl: string }>;
};

const STATUS_META: Record<
  string,
  { label: string; tone: string; hint: string }
> = {
  PENDING: {
    label: "Chờ phản hồi",
    tone: "amber",
    hint: "Nhà tuyển dụng chưa xử lý hồ sơ của bạn.",
  },
  REVIEWED: { label: "Đã xem", tone: "sky", hint: "Hồ sơ đã được mở xem." },
  ACCEPTED: {
    label: "Được chọn",
    tone: "emerald",
    hint: "Bắt đầu workspace để nhận việc ngay.",
  },
  WORKING: {
    label: "Đang làm",
    tone: "violet",
    hint: "Bạn đang thực hiện công việc.",
  },
  REVISION_REQUIRED: {
    label: "Cần sửa",
    tone: "orange",
    hint: "Nhà tuyển dụng đã gửi feedback, cần bạn cập nhật.",
  },
  SUBMITTED: {
    label: "Đã nộp",
    tone: "cyan",
    hint: "Bàn giao đã gửi, đang chờ kiểm tra.",
  },
  APPROVED: {
    label: "Đã duyệt",
    tone: "fuchsia",
    hint: "Bàn giao được duyệt, chờ hoàn tất.",
  },
  COMPLETED: {
    label: "Hoàn tất",
    tone: "green",
    hint: "Công việc đã hoàn thành.",
  },
  PAID: {
    label: "Đã thanh toán",
    tone: "green",
    hint: "Thanh toán đã được xác nhận.",
  },
  REJECTED: {
    label: "Không tiếp tục",
    tone: "red",
    hint: "Hồ sơ này đã bị từ chối.",
  },
  WITHDRAWN: {
    label: "Đã rút đơn",
    tone: "slate",
    hint: "Bạn đã chủ động rút đơn.",
  },
};

const WORKSPACE_STEPS: Record<string, string> = {
  ACCEPTED: "Nhận việc",
  WORKING: "Đang làm",
  SUBMITTED: "Đã nộp",
  COMPLETED: "Hoàn tất",
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value || 0);

const formatDate = (value?: string) =>
  value
    ? new Date(value).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "Cập nhật sau";

const canSubmitWork = (app: AppItem | null) =>
  Boolean(
    app &&
    app.type === "SHORT_TERM" &&
    ["ACCEPTED", "WORKING", "REVISION_REQUIRED"].includes(app.status),
  );

const JobLabPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("dashboard");
  const [jobType, setJobType] = useState<JobType>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [regularApps, setRegularApps] = useState<JobApplicationResponse[]>([]);
  const [shortTermApps, setShortTermApps] = useState<
    ShortTermApplicationResponse[]
  >([]);
  const [workNote, setWorkNote] = useState("");
  const [workFiles, setWorkFiles] = useState<File[]>([]);
  const [workLinks, setWorkLinks] = useState<string[]>([""]);
  const [isFinalSubmission, setIsFinalSubmission] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string>("");

  const loadApplications = async () => {
    setLoading(true);
    try {
      const [regular, shortTerm] = await Promise.all([
        jobService.getMyApplications().catch(() => []),
        shortTermJobService.getMyApplications().catch(() => []),
      ]);
      setRegularApps(regular);
      setShortTermApps(shortTerm);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const applications = useMemo<AppItem[]>(() => {
    const regular: AppItem[] = regularApps.map((app) => ({
      id: `regular-${app.id}`,
      type: "REGULAR",
      applicationId: app.id,
      title: app.jobTitle,
      company: app.recruiterCompanyName,
      budget: app.maxBudget,
      isRemote: app.isRemote,
      location: app.location || "",
      appliedAt: app.appliedAt,
      status: app.status,
      coverLetter: app.coverLetter || undefined,
    }));

    const shortTerm: AppItem[] = shortTermApps.map((app) => ({
      id: `shortterm-${app.id}`,
      type: "SHORT_TERM",
      applicationId: app.id,
      title: app.jobTitle || app.jobDetails?.title || "Gig job",
      company: app.jobDetails?.recruiterCompanyName || "",
      budget: app.jobBudget || app.proposedPrice || 0,
      isRemote: Boolean(app.jobDetails?.isRemote),
      location: app.jobDetails?.location || "",
      appliedAt: app.appliedAt,
      status: app.status,
      coverLetter: app.coverLetter || undefined,
      proposedPrice: app.proposedPrice,
      proposedDuration: app.proposedDuration,
      workNote: app.workNote,
      revisionCount: app.revisionCount,
      deliverables: (app.deliverables || []).map((item) => ({
        id: item.id,
        fileName: item.fileName,
        fileUrl: item.fileUrl,
      })),
    }));

    return [...regular, ...shortTerm].sort(
      (left, right) =>
        new Date(right.appliedAt).getTime() -
        new Date(left.appliedAt).getTime(),
    );
  }, [regularApps, shortTermApps]);

  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const matchesType = jobType === "ALL" || app.type === jobType;
      const query = searchTerm.trim().toLowerCase();
      const matchesQuery =
        !query ||
        [app.title, app.company, app.coverLetter]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));
      return matchesType && matchesQuery;
    });
  }, [applications, jobType, searchTerm]);

  useEffect(() => {
    if (!filteredApplications.length) {
      setSelectedId(null);
      return;
    }
    if (
      !selectedId ||
      !filteredApplications.some((app) => app.id === selectedId)
    ) {
      setSelectedId(filteredApplications[0].id);
    }
  }, [filteredApplications, selectedId]);

  const selectedApp =
    filteredApplications.find((app) => app.id === selectedId) ||
    applications.find((app) => app.id === selectedId) ||
    null;

  const stats = useMemo(
    () => ({
      total: applications.length,
      waiting: applications.filter((app) =>
        ["PENDING", "REVIEWED"].includes(app.status),
      ).length,
      active: applications.filter((app) =>
        [
          "ACCEPTED",
          "WORKING",
          "REVISION_REQUIRED",
          "SUBMITTED",
          "APPROVED",
        ].includes(app.status),
      ).length,
      completed: applications.filter((app) =>
        ["COMPLETED", "PAID"].includes(app.status),
      ).length,
      earnings: applications
        .filter((app) => ["COMPLETED", "PAID"].includes(app.status))
        .reduce((sum, app) => sum + app.budget, 0),
    }),
    [applications],
  );

  const openWorkspace = (app: AppItem) => {
    setSelectedId(app.id);
    setWorkNote("");
    setWorkFiles([]);
    setWorkLinks([""]);
    setIsFinalSubmission(false);
    setViewMode("workspace");
  };

  const submitDeliverables = async () => {
    if (!selectedApp || !canSubmitWork(selectedApp)) return;
    const links = workLinks.map((item) => item.trim()).filter(Boolean);
    if (!workNote.trim() && workFiles.length === 0 && links.length === 0) {
      setMessage("Hãy nhập báo cáo hoặc thêm file bàn giao.");
      return;
    }

    const payload: SubmitDeliverableRequest = {
      applicationId: selectedApp.applicationId,
      files: workFiles,
      workNote: workNote.trim() || undefined,
      links: links.length ? links : undefined,
      isFinalSubmission,
    };

    try {
      setSubmitting(true);
      await shortTermJobService.submitDeliverables(payload);
      setMessage("Đã gửi bàn giao thành công.");
      setViewMode("applications");
      await loadApplications();
    } catch (error: any) {
      setMessage(error?.message || "Không thể gửi bàn giao.");
    } finally {
      setSubmitting(false);
    }
  };

  const withdrawShortTermApplication = async (app: AppItem) => {
    if (app.type !== "SHORT_TERM") {
      setMessage("Luồng rút đơn full-time chưa được mở ở Job Lab mới.");
      return;
    }
    if (!window.confirm(`Rút đơn khỏi công việc "${app.title}"?`)) return;
    await shortTermJobService.withdrawApplication(app.applicationId);
    setMessage("Đã rút đơn thành công.");
    await loadApplications();
  };

  if (loading) {
    return (
      <div className="jlx-shell">
        <div className="jlx-loading">
          <MeowlKuruLoader size="large" text="Đang tải Job Lab..." />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`jlx-shell${viewMode === "workspace" ? " jlx-shell--workspace" : ""}`}
    >
      <aside className="jlx-sidebar">
        <div className="jlx-brand">
          <div className="jlx-brand__icon">
            <Zap size={20} />
          </div>
          <div>
            <strong>Job Lab</strong>
            <span>Workspace cá nhân</span>
          </div>
        </div>

        <nav className="jlx-nav">
          {[
            {
              id: "dashboard" as const,
              label: "Tổng quan",
              icon: Activity,
              count: undefined,
            },
            {
              id: "applications" as const,
              label: "Đơn",
              icon: FileText,
              count: stats.total,
            },
            {
              id: "workspace" as const,
              label: "Workspace",
              icon: ClipboardList,
              count: filteredApplications.length,
            },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              className={`jlx-nav__item${viewMode === item.id ? " is-active" : ""}`}
              onClick={() => setViewMode(item.id)}
            >
              <span className="jlx-nav__icon">
                <item.icon size={16} />
              </span>
              <span>{item.label}</span>
              {item.count !== undefined && (
                <span className="jlx-nav__count">{item.count}</span>
              )}
            </button>
          ))}
          <button
            type="button"
            className="jlx-nav__item"
            onClick={() => (window.location.href = "/jobs")}
          >
            <span className="jlx-nav__icon">
              <Plus size={16} />
            </span>
            <span>Tìm việc</span>
          </button>
        </nav>

        <div className="jlx-sidebar__meta">
          <article className="jlx-sidebar__card">
            <span>Tổng thu nhập</span>
            <strong>{formatCurrency(stats.earnings)}</strong>
          </article>
          <article className="jlx-sidebar__card">
            <span>Đang vận hành</span>
            <strong>{stats.active}</strong>
          </article>
        </div>
      </aside>

      <main className="jlx-main">
        <header className="jlx-header">
          <div>
            <h1>
              {viewMode === "dashboard" && "Tổng quan Job Lab"}
              {viewMode === "applications" && "Tất cả đơn ứng tuyển"}
              {viewMode === "workspace" && "Workspace"}
            </h1>
            <p>
              {viewMode === "dashboard" &&
                "Nhịp tuyển dụng, công việc đang làm và điểm cần xử lý."}
              {viewMode === "applications" &&
                "Tất cả đơn được gom trên một màn hình."}
              {viewMode === "workspace" &&
                "Mở workspace để làm việc không bị gián đoạn."}
            </p>
          </div>
          <div className="jlx-header__actions">
            <button
              type="button"
              className="jlx-btn jlx-btn--ghost"
              onClick={loadApplications}
            >
              <RefreshCw size={14} />
              Làm mới
            </button>
            <button
              type="button"
              className="jlx-btn jlx-btn--primary"
              onClick={() => (window.location.href = "/jobs")}
            >
              <Briefcase size={14} />
              Tìm việc
            </button>
          </div>
        </header>

        {message && <div className="jlx-banner">{message}</div>}

        {viewMode === "dashboard" && (
          <>
            <section className="jlx-stat-grid">
              <article className="jlx-stat-card is-cyan">
                <FileText size={18} />
                <strong>{stats.total}</strong>
                <span>Tổng đơn đã ứng tuyển</span>
              </article>
              <article className="jlx-stat-card is-amber">
                <Clock size={18} />
                <strong>{stats.waiting}</strong>
                <span>Chờ phản hồi</span>
              </article>
              <article className="jlx-stat-card is-violet">
                <ClipboardList size={18} />
                <strong>{stats.active}</strong>
                <span>Công việc đang vận hành</span>
              </article>
              <article className="jlx-stat-card is-green">
                <Wallet size={18} />
                <strong>{formatCurrency(stats.earnings)}</strong>
                <span>Thu nhập đã chốt</span>
              </article>
            </section>

            <section className="jlx-dashboard-grid">
              <article className="jlx-panel">
                <div className="jlx-panel__head">
                  <div>
                    <span className="jlx-panel__eyebrow">Cần mở workspace</span>
                    <h3>Các job đang có tiến trình</h3>
                  </div>
                </div>
                <div className="jlx-list">
                  {applications.slice(0, 6).map((app) => {
                    const status = STATUS_META[app.status] || {
                      label: app.status,
                      tone: "slate",
                    };
                    return (
                      <button
                        key={app.id}
                        type="button"
                        className="jlx-list__item"
                        onClick={() => openWorkspace(app)}
                      >
                        <div>
                          <strong>{app.title}</strong>
                          <p>{app.company || "SkillVerse"}</p>
                        </div>
                        <span className={`jlx-status is-${status.tone}`}>
                          {status.label}
                        </span>
                      </button>
                    );
                  })}
                  {!applications.length && (
                    <div className="jlx-empty-inline">
                      Chưa có đơn nào để hiển thị.
                    </div>
                  )}
                </div>
              </article>

              <article className="jlx-panel">
                <div className="jlx-panel__head">
                  <div>
                    <span className="jlx-panel__eyebrow">
                      Tổng kết trạng thái
                    </span>
                    <h3>Trạng thái đơn theo nhóm</h3>
                  </div>
                </div>
                <div className="jlx-status-stack">
                  <div className="jlx-status-block">
                    <div>
                      <strong>Chờ phản hồi</strong>
                      <p>PENDING &amp; REVIEWED</p>
                    </div>
                    <span>{stats.waiting}</span>
                  </div>
                  <div className="jlx-status-block">
                    <div>
                      <strong>Đang vận hành</strong>
                      <p>ACCEPTED → APPROVED</p>
                    </div>
                    <span>{stats.active}</span>
                  </div>
                  <div className="jlx-status-block">
                    <div>
                      <strong>Đã hoàn tất</strong>
                      <p>COMPLETED &amp; PAID</p>
                    </div>
                    <span>{stats.completed}</span>
                  </div>
                </div>
              </article>
            </section>
          </>
        )}

        {viewMode === "applications" && (
          <>
            <section className="jlx-toolbar">
              <div className="jlx-type-tabs">
                {[
                  { id: "ALL", label: "Tất cả" },
                  { id: "REGULAR", label: "Freelance" },
                  { id: "SHORT_TERM", label: "Gig" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`jlx-type-tab${jobType === item.id ? " is-active" : ""}`}
                    onClick={() => setJobType(item.id as JobType)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <label className="jlx-search">
                <Search size={16} />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Tìm theo tên, công ty..."
                />
              </label>
            </section>

            {!filteredApplications.length ? (
              <div className="jlx-empty-state">
                <FolderOpen size={42} />
                <h3>Không có đơn phù hợp</h3>
                <p>Thử đổi bộ lọc hoặc tìm thêm công việc mới.</p>
              </div>
            ) : (
              <div className="jlx-card-grid">
                {filteredApplications.map((app) => {
                  const status = STATUS_META[app.status] || {
                    label: app.status,
                    tone: "slate",
                    hint: "",
                  };
                  return (
                    <article key={app.id} className="jlx-job-card">
                      <div className="jlx-job-card__top">
                        <span
                          className={`jlx-type is-${app.type === "SHORT_TERM" ? "gig" : "regular"}`}
                        >
                          {app.type === "SHORT_TERM" ? "Gig" : "Freelance"}
                        </span>
                        <span className={`jlx-status is-${status.tone}`}>
                          {status.label}
                        </span>
                      </div>
                      <h4>{app.title}</h4>
                      <p className="jlx-job-card__company">
                        <Building2 size={14} />
                        {app.company || "SkillVerse"}
                      </p>
                      <div className="jlx-job-card__meta">
                        <span>
                          <DollarSign size={14} />
                          {formatCurrency(app.budget)}
                        </span>
                        <span>
                          <Calendar size={14} />
                          {formatDate(app.appliedAt)}
                        </span>
                      </div>
                      <p className="jlx-job-card__hint">{status.hint}</p>
                      <div className="jlx-job-card__actions">
                        <button
                          type="button"
                          className="jlx-btn jlx-btn--primary"
                          onClick={() => openWorkspace(app)}
                        >
                          <ClipboardList size={14} />
                          Mở workspace
                        </button>
                        {app.type === "SHORT_TERM" &&
                          ["PENDING", "REVIEWED"].includes(app.status) && (
                            <button
                              type="button"
                              className="jlx-btn jlx-btn--ghost"
                              onClick={() => withdrawShortTermApplication(app)}
                            >
                              <XCircle size={14} />
                              Rút đơn
                            </button>
                          )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}

        {viewMode === "workspace" && (
          <section className="jlx-workspace">
            {!filteredApplications.length ? (
              <div className="jlx-empty-state">
                <FolderOpen size={42} />
                <h3>Chưa có workspace nào</h3>
                <p>Hãy quay lại danh sách đơn để mở job chi tiết.</p>
              </div>
            ) : (
              <>
                <div className="jlx-workspace-bar">
                  <div className="jlx-workspace-bar__left">
                    <button
                      type="button"
                      className="jlx-workspace-bar__back"
                      onClick={() => setViewMode("applications")}
                    >
                      <FolderOpen size={14} />
                      Quay lại
                    </button>
                    <div className="jlx-workspace-bar__info">
                      <strong>{selectedApp?.title || "Workspace"}</strong>
                      <span>{filteredApplications.length} đơn</span>
                    </div>
                  </div>
                </div>
                <div className="jlx-workspace-layout">
                  <aside className="jlx-workspace-rail">
                    <div className="jlx-workspace-rail__head">
                      <div>
                        <span className="jlx-panel__eyebrow">
                          Danh sách đơn
                        </span>
                        <h3>Workspace</h3>
                      </div>
                      <span className="jlx-pill-count">
                        {filteredApplications.length}
                      </span>
                    </div>
                    <div className="jlx-workspace-rail__list">
                      {filteredApplications.map((app) => {
                        const status = STATUS_META[app.status] || {
                          label: app.status,
                          tone: "slate",
                        };
                        return (
                          <button
                            key={app.id}
                            type="button"
                            className={`jlx-workspace-entry${selectedApp?.id === app.id ? " is-active" : ""}`}
                            onClick={() => setSelectedId(app.id)}
                          >
                            <div className="jlx-workspace-entry__top">
                              <span className={`jlx-status is-${status.tone}`}>
                                {status.label}
                              </span>
                              <span className="jlx-type is-compact">
                                {app.type === "SHORT_TERM" ? "Gig" : "FT"}
                              </span>
                            </div>
                            <strong>{app.title}</strong>
                            <p>{app.company || "SkillVerse"}</p>
                          </button>
                        );
                      })}
                    </div>
                  </aside>

                  <div className="jlx-workspace-detail">
                    {selectedApp && (
                      <>
                        <div className="jlx-workspace-hero">
                          <div>
                            <div className="jlx-hero-badge">
                              <ClipboardList size={13} />
                              <span>Không gian làm việc</span>
                            </div>
                            <h2>{selectedApp.title}</h2>
                            <p>
                              {
                                (
                                  STATUS_META[selectedApp.status] || {
                                    hint: "",
                                  }
                                ).hint
                              }
                            </p>
                            <div className="jlx-hero-tags">
                              <span className="jlx-chip">
                                <Building2 size={12} />
                                {selectedApp.company || "SkillVerse"}
                              </span>
                              <span className="jlx-chip">
                                <DollarSign size={12} />
                                {formatCurrency(selectedApp.budget)}
                              </span>
                              {selectedApp.proposedDuration && (
                                <span className="jlx-chip">
                                  <Timer size={12} />
                                  {selectedApp.proposedDuration}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="jlx-hero-right">
                            <span
                              className={`jlx-status is-${(STATUS_META[selectedApp.status] || { tone: "slate" }).tone}`}
                            >
                              {
                                (
                                  STATUS_META[selectedApp.status] || {
                                    label: selectedApp.status,
                                  }
                                ).label
                              }
                            </span>
                            <div className="jlx-hero-meta">
                              <div className="jlx-hero-meta-item">
                                <Calendar size={13} />
                                <span>{formatDate(selectedApp.appliedAt)}</span>
                              </div>
                              <div className="jlx-hero-meta-item">
                                {selectedApp.isRemote ? (
                                  <Globe size={13} />
                                ) : (
                                  <MapPin size={13} />
                                )}
                                <span>
                                  {selectedApp.isRemote
                                    ? "Remote"
                                    : selectedApp.location || "Cập nhật sau"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {selectedApp.type === "SHORT_TERM" && (
                          <div className="jlx-stepper">
                            {Object.entries(WORKSPACE_STEPS).map(
                              ([key, label], index) => {
                                const allKeys = Object.keys(WORKSPACE_STEPS);
                                const currentIndex = allKeys.indexOf(
                                  selectedApp.status,
                                );
                                const stepIndex = index;
                                const done =
                                  currentIndex !== -1 &&
                                  stepIndex < currentIndex;
                                const active = stepIndex === currentIndex;
                                return (
                                  <React.Fragment key={key}>
                                    <div
                                      className={`jlx-step${done ? " is-done" : ""}${active ? " is-active" : ""}`}
                                    >
                                      <div className="jlx-step__dot">
                                        {done ? (
                                          <CheckCircle2 size={12} />
                                        ) : (
                                          index + 1
                                        )}
                                      </div>
                                      <span>{label}</span>
                                    </div>
                                    {index < Object.keys(WORKSPACE_STEPS).length - 1 && (
                                      <div className="jlx-step__connector" />
                                    )}
                                  </React.Fragment>
                                );
                              },
                            )}
                          </div>
                        )}

                        <div className="jlx-workspace-grid">
                          <article className="jlx-panel">
                            <div className="jlx-info-grid">
                              <div className="jlx-info-card">
                                <span>Ngày ứng tuyển</span>
                                <strong>
                                  {formatDate(selectedApp.appliedAt)}
                                </strong>
                              </div>
                              <div className="jlx-info-card">
                                <span>Loại công việc</span>
                                <strong>
                                  {selectedApp.type === "SHORT_TERM"
                                    ? "Gig"
                                    : "Freelance"}
                                </strong>
                              </div>
                              {selectedApp.proposedPrice && (
                                <div className="jlx-info-card">
                                  <span>Giá đề xuất</span>
                                  <strong>
                                    {formatCurrency(selectedApp.proposedPrice)}
                                  </strong>
                                </div>
                              )}
                              {selectedApp.revisionCount !== undefined && (
                                <div className="jlx-info-card">
                                  <span>Số vòng sửa</span>
                                  <strong>{selectedApp.revisionCount}</strong>
                                </div>
                              )}
                            </div>

                            {selectedApp.coverLetter && (
                              <div className="jlx-note">
                                <h4>
                                  <FileText size={16} />
                                  Cover letter
                                </h4>
                                <p>{selectedApp.coverLetter}</p>
                              </div>
                            )}

                            {selectedApp.workNote && (
                              <div className="jlx-note">
                                <h4>
                                  <FileCheck size={16} />
                                  Ghi chú bàn giao gần nhất
                                </h4>
                                <p>{selectedApp.workNote}</p>
                              </div>
                            )}

                            {!!selectedApp.deliverables?.length && (
                              <div className="jlx-deliverables">
                                {selectedApp.deliverables.map((item) => (
                                  <a
                                    key={item.id}
                                    href={item.fileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="jlx-deliverable"
                                  >
                                    <FileCheck size={14} />
                                    <span>{item.fileName}</span>
                                  </a>
                                ))}
                              </div>
                            )}
                          </article>

                          <aside className="jlx-workspace-side">
                            <article className="jlx-panel">
                              <div className="jlx-status-explainer">
                                <strong>
                                  {
                                    (
                                      STATUS_META[selectedApp.status] || {
                                        label: selectedApp.status,
                                      }
                                    ).label
                                  }
                                </strong>
                                <p>
                                  {
                                    (
                                      STATUS_META[selectedApp.status] || {
                                        hint: "",
                                      }
                                    ).hint
                                  }
                                </p>
                              </div>
                            </article>
                          </aside>
                        </div>

                        {canSubmitWork(selectedApp) && (
                          <article className="jlx-panel jlx-panel--workspace">
                            <div className="jlx-form-grid">
                              <div className="jlx-field">
                                <label>Báo cáo công việc</label>
                                <textarea
                                  value={workNote}
                                  onChange={(event) =>
                                    setWorkNote(event.target.value)
                                  }
                                  rows={7}
                                  placeholder="Mô tả kết quả công việc và nội dung bàn giao..."
                                />
                              </div>

                              <div className="jlx-field">
                                <label>Tệp đính kèm</label>
                                <label className="jlx-upload">
                                  <input
                                    type="file"
                                    multiple
                                    onChange={(event) =>
                                      setWorkFiles((current) => [
                                        ...current,
                                        ...Array.from(event.target.files || []),
                                      ])
                                    }
                                  />
                                  <Upload size={18} />
                                  <span>Thêm file bàn giao</span>
                                </label>
                                {!!workFiles.length && (
                                  <div className="jlx-upload-list">
                                    {workFiles.map((file, index) => (
                                      <div
                                        key={`${file.name}-${index}`}
                                        className="jlx-upload-item"
                                      >
                                        <span>{file.name}</span>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setWorkFiles((current) =>
                                              current.filter(
                                                (_, currentIndex) =>
                                                  currentIndex !== index,
                                              ),
                                            )
                                          }
                                        >
                                          <Trash2 size={12} />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <div className="jlx-field">
                                <label>Liên kết tham chiếu</label>
                                <div className="jlx-link-stack">
                                  {workLinks.map((link, index) => (
                                    <div key={index} className="jlx-link-row">
                                      <input
                                        value={link}
                                        onChange={(event) =>
                                          setWorkLinks((current) =>
                                            current.map((item, currentIndex) =>
                                              currentIndex === index
                                                ? event.target.value
                                                : item,
                                            ),
                                          )
                                        }
                                        placeholder="Link demo, GitHub, Figma..."
                                      />
                                      {workLinks.length > 1 && (
                                        <button
                                          type="button"
                                          className="jlx-icon-btn"
                                          onClick={() =>
                                            setWorkLinks((current) =>
                                              current.filter(
                                                (_, currentIndex) =>
                                                  currentIndex !== index,
                                              ),
                                            )
                                          }
                                        >
                                          <Trash2 size={12} />
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                  <button
                                    type="button"
                                    className="jlx-btn jlx-btn--ghost"
                                    onClick={() =>
                                      setWorkLinks((current) => [
                                        ...current,
                                        "",
                                      ])
                                    }
                                  >
                                    <LinkIcon size={14} />
                                    Thêm liên kết
                                  </button>
                                </div>
                              </div>

                              <button
                                type="button"
                                className={`jlx-final-toggle${isFinalSubmission ? " is-active" : ""}`}
                                onClick={() =>
                                  setIsFinalSubmission((current) => !current)
                                }
                              >
                                <div className="jlx-final-toggle__check">
                                  {isFinalSubmission ? (
                                    <CheckCircle2 size={16} />
                                  ) : (
                                    <ClipboardList size={16} />
                                  )}
                                </div>
                                <div>
                                  <strong>Bàn giao cuối cùng</strong>
                                  <span>
                                    Đánh dấu nếu đây là phiên bản hoàn chỉnh.
                                  </span>
                                </div>
                              </button>
                            </div>

                            <div className="jlx-submit-bar">
                              <div className="jlx-submit-bar__meta">
                                <span>{workFiles.length} file</span>
                                <span>
                                  {
                                    workLinks.filter((item) => item.trim())
                                      .length
                                  }{" "}
                                  link
                                </span>
                              </div>
                              <button
                                type="button"
                                className="jlx-btn jlx-btn--primary"
                                onClick={submitDeliverables}
                                disabled={submitting}
                              >
                                {submitting ? (
                                  <>
                                    <RefreshCw size={14} className="jlx-spin" />
                                    Đang gửi
                                  </>
                                ) : (
                                  <>
                                    <Send size={14} />
                                    {isFinalSubmission
                                      ? "Gửi bàn giao cuối"
                                      : "Gửi báo cáo"}
                                  </>
                                )}
                              </button>
                            </div>
                          </article>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </section>
        )}
      </main>
    </div>
  );
};

export default JobLabPage;
