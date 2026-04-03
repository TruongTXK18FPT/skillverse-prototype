import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Brain,
  Database,
  Filter,
  RefreshCw,
  Route,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Waypoints,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import MeowlKuruLoader from "../kuru-loader/MeowlKuruLoader";
import { QuestionBankSummary } from "../../data/questionBankDTOs";
import { getQuestionBanks } from "../../services/questionBankService";
import adminJourneyService from "../../services/adminJourneyService";
import {
  AdminJourneyBreakdownItem,
  AdminJourneyDashboardResponse,
  AdminJourneyListItemResponse,
  AdminJourneyPageResponse,
  AdminQuestionAnalyticsItemResponse,
} from "../../types/adminJourneyAnalytics";
import "./JourneyManagementTab.css";

const JOURNEY_STATUS_OPTIONS = [
  "ASSESSMENT_PENDING",
  "TEST_IN_PROGRESS",
  "EVALUATION_PENDING",
  "ROADMAP_GENERATED",
  "ACTIVE",
  "PAUSED",
  "COMPLETED",
  "CANCELLED",
];

const JOURNEY_TYPE_OPTIONS = ["CAREER", "SKILL"];
const QUESTION_SOURCE_OPTIONS = ["BANK", "AI", "LEGACY_BANK", "NONE"];
const QUESTION_DIFFICULTY_OPTIONS = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"];
const QUESTION_AUTHORING_SOURCE_OPTIONS = ["MANUAL", "IMPORT", "AI_GENERATED"];

const JOURNEY_STATUS_LABELS: Record<string, string> = {
  ASSESSMENT_PENDING: "Chờ tạo bài đánh giá",
  TEST_IN_PROGRESS: "Đang làm bài đánh giá",
  EVALUATION_PENDING: "Chờ chấm điểm",
  ROADMAP_GENERATED: "Đã tạo lộ trình",
  ACTIVE: "Đang hoạt động",
  PAUSED: "Tạm dừng",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
};

const JOURNEY_TYPE_LABELS: Record<string, string> = {
  CAREER: "Hành trình nghề nghiệp",
  SKILL: "Hành trình kỹ năng",
};

const QUESTION_SOURCE_LABELS: Record<string, string> = {
  BANK: "Ngân hàng câu hỏi",
  AI: "AI sinh đề",
  LEGACY_BANK: "Ngân hàng legacy",
  NONE: "Chưa có nguồn đề",
};

const QUESTION_DIFFICULTY_LABELS: Record<string, string> = {
  BEGINNER: "Cơ bản",
  INTERMEDIATE: "Trung bình",
  ADVANCED: "Nâng cao",
  EXPERT: "Chuyên gia",
};

const QUESTION_AUTHORING_SOURCE_LABELS: Record<string, string> = {
  MANUAL: "Tạo thủ công",
  IMPORT: "Nhập dữ liệu",
  AI_GENERATED: "AI tạo",
};

const READINESS_STATUS_LABELS: Record<string, string> = {
  READY: "Sẵn sàng",
  WARNING: "Cần bổ sung",
  NOT_READY: "Chưa sẵn sàng",
  NEEDS_ATTENTION: "Cần kiểm tra",
};

const FUNNEL_LABELS: Record<string, string> = {
  JOURNEY_CREATED: "Hành trình mới tạo",
  ASSESSMENT_CREATED: "Đã tạo đánh giá",
  TEST_GENERATED: "Đã sinh đề",
  ASSESSMENT_GENERATED: "Đã sinh đề",
  TEST_SUBMITTED: "Đã nộp bài",
  ASSESSMENT_SUBMITTED: "Đã nộp bài",
  EVALUATED: "Đã đánh giá",
  ROADMAP_READY: "Lộ trình sẵn sàng",
  ROADMAP_GENERATED: "Lộ trình sẵn sàng",
};

const CHART_COLORS = ["#22d3ee", "#38bdf8", "#818cf8", "#a855f7", "#f59e0b", "#14b8a6"];

const humanizeEnum = (value?: string | null) => {
  if (!value) return "--";
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const translateEnum = (value?: string | null, labelMap: Record<string, string> = {}) => {
  if (!value) return "--";
  return labelMap[value] ?? humanizeEnum(value);
};

const formatNumber = (value?: number | null) =>
  new Intl.NumberFormat("vi-VN").format(value ?? 0);

const formatPercent = (value?: number | null, digits = 1) =>
  `${(value ?? 0).toFixed(digits)}%`;

const formatScore = (value?: number | null) =>
  value == null ? "--" : `${Number(value).toFixed(1)}%`;

const formatDateTime = (value?: string | null) => {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const truncateText = (value?: string | null, maxLength = 96) => {
  if (!value) return "--";
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trimEnd()}…`;
};

const chartify = (
  items?: AdminJourneyBreakdownItem[],
  labelMap: Record<string, string> = {},
) =>
  (items ?? []).map((item) => ({
    label: translateEnum(item.label, labelMap),
    value: item.value,
  }));

const toIsoDateTime = (value: string) =>
  value ? new Date(value).toISOString() : undefined;

const getReadinessVariant = (value?: string | null) =>
  value === "READY" ? "success" : value === "NOT_READY" ? "danger" : "warning";

const getJourneyStatusVariant = (value?: string | null) => {
  switch (value) {
    case "ACTIVE":
    case "COMPLETED":
    case "ROADMAP_GENERATED":
      return "success";
    case "TEST_IN_PROGRESS":
      return "cyan";
    case "PAUSED":
      return "warning";
    case "CANCELLED":
      return "danger";
    default:
      return "violet";
  }
};

const getQuestionSourceVariant = (value?: string | null) => {
  switch (value) {
    case "BANK":
      return "cyan";
    case "LEGACY_BANK":
      return "warning";
    case "AI":
      return "violet";
    default:
      return "muted";
  }
};

const getAuthoringSourceVariant = (value?: string | null) => {
  switch (value) {
    case "MANUAL":
      return "cyan";
    case "IMPORT":
      return "warning";
    case "AI_GENERATED":
      return "violet";
    default:
      return "muted";
  }
};

const getRoadmapVariant = (value?: boolean) => (value ? "success" : "muted");
const getActiveVariant = (value?: boolean) => (value ? "success" : "muted");

const ChartTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value?: number }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="jmt-tooltip">
      <span className="jmt-tooltip__label">{label}</span>
      <strong className="jmt-tooltip__value">{formatNumber(payload[0]?.value)}</strong>
    </div>
  );
};

const StatusBadge = ({
  label,
  variant,
}: {
  label: string;
  variant: "success" | "warning" | "danger" | "violet" | "cyan" | "muted";
}) => <span className={`jmt-badge jmt-badge--${variant}`}>{label}</span>;

const EmptyState = ({ message }: { message: string }) => (
  <div className="jmt-empty-state">{message}</div>
);

const PaginationBar = ({
  page,
  totalPages,
  totalElements,
  onChange,
}: {
  page: number;
  totalPages: number;
  totalElements?: number;
  onChange: (nextPage: number) => void;
}) => {
  if (totalPages <= 0) return null;

  return (
    <div className="jmt-pagination">
      <span className="jmt-pagination__summary">
        Trang {page + 1}/{totalPages} • {formatNumber(totalElements)} bản ghi
      </span>
      <div className="jmt-pagination__controls">
        <button
          className="jmt-pagination__button"
          disabled={page <= 0}
          onClick={() => onChange(page - 1)}
        >
          Trước
        </button>
        <button
          className="jmt-pagination__button"
          disabled={page + 1 >= totalPages}
          onClick={() => onChange(page + 1)}
        >
          Sau
        </button>
      </div>
    </div>
  );
};

const JourneyManagementTab: React.FC = () => {
  const [dashboard, setDashboard] = useState<AdminJourneyDashboardResponse | null>(null);
  const [banks, setBanks] = useState<QuestionBankSummary[]>([]);
  const [journeysPage, setJourneysPage] =
    useState<AdminJourneyPageResponse<AdminJourneyListItemResponse> | null>(null);
  const [questionsPage, setQuestionsPage] =
    useState<AdminJourneyPageResponse<AdminQuestionAnalyticsItemResponse> | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [journeysLoading, setJourneysLoading] = useState(true);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [journeyPageIndex, setJourneyPageIndex] = useState(0);
  const [questionPageIndex, setQuestionPageIndex] = useState(0);
  const [journeyFilters, setJourneyFilters] = useState({
    status: "",
    type: "",
    domain: "",
    questionSource: "",
    questionBankId: "",
    hasRoadmap: "",
    createdFrom: "",
    createdTo: "",
    keyword: "",
  });
  const [questionFilters, setQuestionFilters] = useState({
    questionBankId: "",
    difficulty: "",
    skillArea: "",
    source: "",
    isActive: "",
    keyword: "",
  });

  const loadDashboard = useCallback(async () => {
    setDashboardLoading(true);
    try {
      const [dashboardResponse, bankResponse] = await Promise.all([
        adminJourneyService.getDashboard(),
        getQuestionBanks({ page: 0, size: 100 }),
      ]);
      setDashboard(dashboardResponse);
      setBanks(bankResponse.content ?? []);
      setError(null);
    } catch (fetchError) {
      console.error("Failed to load journey admin dashboard:", fetchError);
      setError("Không thể tải bảng điều phối hành trình.");
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  const loadJourneyPage = useCallback(async () => {
    setJourneysLoading(true);
    try {
      const response = await adminJourneyService.getJourneys({
        status: journeyFilters.status || undefined,
        type: journeyFilters.type || undefined,
        domain: journeyFilters.domain || undefined,
        questionSource: journeyFilters.questionSource || undefined,
        questionBankId: journeyFilters.questionBankId
          ? Number(journeyFilters.questionBankId)
          : undefined,
        hasRoadmap:
          journeyFilters.hasRoadmap === ""
            ? undefined
            : journeyFilters.hasRoadmap === "true",
        createdFrom: toIsoDateTime(journeyFilters.createdFrom),
        createdTo: toIsoDateTime(journeyFilters.createdTo),
        keyword: journeyFilters.keyword || undefined,
        page: journeyPageIndex,
        size: 8,
      });
      setJourneysPage(response);
      setError(null);
    } catch (fetchError) {
      console.error("Failed to load journey monitor:", fetchError);
      setError("Không thể tải danh sách giám sát hành trình.");
    } finally {
      setJourneysLoading(false);
    }
  }, [journeyFilters, journeyPageIndex]);

  const loadQuestionPage = useCallback(async () => {
    setQuestionsLoading(true);
    try {
      const response = await adminJourneyService.getQuestionAnalytics({
        questionBankId: questionFilters.questionBankId
          ? Number(questionFilters.questionBankId)
          : undefined,
        difficulty: questionFilters.difficulty || undefined,
        skillArea: questionFilters.skillArea || undefined,
        source: questionFilters.source || undefined,
        isActive:
          questionFilters.isActive === ""
            ? undefined
            : questionFilters.isActive === "true",
        keyword: questionFilters.keyword || undefined,
        page: questionPageIndex,
        size: 8,
      });
      setQuestionsPage(response);
      setError(null);
    } catch (fetchError) {
      console.error("Failed to load question analytics page:", fetchError);
      setError("Không thể tải phân tích câu hỏi.");
    } finally {
      setQuestionsLoading(false);
    }
  }, [questionFilters, questionPageIndex]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    void loadJourneyPage();
  }, [loadJourneyPage]);

  useEffect(() => {
    void loadQuestionPage();
  }, [loadQuestionPage]);

  const handleRefresh = async () => {
    await Promise.all([loadDashboard(), loadJourneyPage(), loadQuestionPage()]);
  };

  const domainOptions = useMemo(
    () =>
      Array.from(new Set(banks.map((bank) => bank.domain).filter(Boolean))).sort((left, right) =>
        left.localeCompare(right, "vi"),
      ),
    [banks],
  );

  const skillAreaOptions = useMemo(
    () =>
      Array.from(
        new Set((dashboard?.skillAreaBreakdown ?? []).map((item) => item.label).filter(Boolean)),
      ).sort((left, right) => left.localeCompare(right, "vi")),
    [dashboard],
  );

  const overviewCards = useMemo(
    () => [
      {
        label: "Tổng hành trình",
        value: formatNumber(dashboard?.totalJourneys),
        hint: `${formatNumber(dashboard?.roadmapReadyJourneys)} hành trình đã có lộ trình`,
        icon: Route,
        tone: "cyan",
      },
      {
        label: "Bài đánh giá",
        value: formatNumber(dashboard?.totalAssessmentTests),
        hint: `${formatNumber(dashboard?.totalEvaluations)} lượt đã chấm điểm`,
        icon: Activity,
        tone: "violet",
      },
      {
        label: "Ngân hàng câu hỏi",
        value: formatNumber(dashboard?.totalQuestionBanks),
        hint: `${formatNumber(dashboard?.totalActiveQuestions)} câu hỏi đang hoạt động`,
        icon: Database,
        tone: "blue",
      },
      {
        label: "Độ phủ liên kết ngân hàng",
        value: formatPercent(dashboard?.bankLinkedCoverageRate),
        hint: `${formatNumber(dashboard?.bankLinkedTests)} bài test đã gắn ngân hàng`,
        icon: Waypoints,
        tone: "emerald",
      },
      {
        label: "Khả năng phục hồi",
        value: formatPercent(dashboard?.recoveryCoverageRate),
        hint: `${formatNumber(dashboard?.legacyUnlinkedTests)} bài test legacy còn trống`,
        icon: ShieldCheck,
        tone: "amber",
      },
      {
        label: "Lượt phục vụ câu hỏi",
        value: formatNumber(dashboard?.questionSelectionsServed),
        hint: `${formatNumber(dashboard?.aiGeneratedTests)} bài test sinh bằng AI`,
        icon: TrendingUp,
        tone: "rose",
      },
    ],
    [dashboard],
  );

  const heroSignals = useMemo(
    () => [
      {
        label: "Tỷ lệ gắn ngân hàng câu hỏi",
        value: formatPercent(dashboard?.bankLinkedCoverageRate),
        hint: "Tỷ trọng bài test đã liên kết ngân hàng rõ ràng",
      },
      {
        label: "Tỷ lệ sẵn sàng khôi phục",
        value: formatPercent(dashboard?.recoveryCoverageRate),
        hint: "Ưu tiên dùng cho khôi phục cùng ngân hàng",
      },
      {
        label: "Hành trình có lộ trình",
        value: formatNumber(dashboard?.roadmapReadyJourneys),
        hint: "Hành trình đã đi trọn luồng đánh giá",
      },
      {
        label: "Bài test AI đang phục vụ",
        value: formatNumber(dashboard?.aiGeneratedTests),
        hint: "Luồng dự phòng ổn định khi thiếu ngân hàng phù hợp",
      },
    ],
    [dashboard],
  );

  const heroInsight = useMemo(() => {
    if (!dashboard) {
      return {
        title: "Đang đồng bộ tín hiệu vận hành",
        description:
          "Hệ thống sẽ hiển thị tín hiệu khôi phục, lộ trình và ngân hàng câu hỏi sau khi tải xong.",
      };
    }

    if (dashboard.legacyUnlinkedTests > 0) {
      return {
        title: "Còn điểm mù khôi phục cần theo dõi",
        description: `${formatNumber(
          dashboard.legacyUnlinkedTests,
        )} bài test legacy chưa gắn khóa trực tiếp với ngân hàng câu hỏi.`,
      };
    }

    if (dashboard.bankLinkedCoverageRate >= 70) {
      return {
        title: "Luồng ưu tiên ngân hàng đang vận hành tốt",
        description: `${formatPercent(
          dashboard.bankLinkedCoverageRate,
        )} bài test đã gắn ngân hàng rõ ràng, thuận lợi cho khôi phục và phân tích.`,
      };
    }

    return {
      title: "Cần tăng độ phủ ngân hàng câu hỏi cho hành trình",
      description:
        "Ưu tiên bổ sung ngân hàng cho các miền trọng điểm để giảm phụ thuộc vào luồng AI dự phòng.",
    };
  }, [dashboard]);

  const questionHealthSignals = useMemo(
    () => [
      {
        label: "Bài test khôi phục sẵn sàng",
        value: formatNumber(dashboard?.recoveryReadyTests),
        tone: "success",
      },
      {
        label: "Bài test legacy chưa gắn ngân hàng",
        value: formatNumber(dashboard?.legacyUnlinkedTests),
        tone: (dashboard?.legacyUnlinkedTests ?? 0) > 0 ? "warning" : "success",
      },
      {
        label: "Bài test sinh bởi AI",
        value: formatNumber(dashboard?.aiGeneratedTests),
        tone: "violet",
      },
    ],
    [dashboard],
  );

  const chartBlocks = useMemo(
    () => [
      {
        title: "Phễu đánh giá",
        description: "Theo dõi chuyển động từ tạo hành trình đến khi lộ trình sẵn sàng.",
        data: chartify(dashboard?.assessmentFunnel, FUNNEL_LABELS),
        icon: Activity,
      },
      {
        title: "Trạng thái hành trình",
        description: "Nhìn nhanh nơi người dùng đang dừng lại trong toàn bộ luồng.",
        data: chartify(dashboard?.journeyStatusBreakdown, JOURNEY_STATUS_LABELS),
        icon: Route,
      },
      {
        title: "Nguồn sinh đề",
        description: "So sánh đề từ ngân hàng câu hỏi, AI và dữ liệu legacy.",
        data: chartify(dashboard?.testSourceBreakdown, QUESTION_SOURCE_LABELS),
        icon: Database,
      },
      {
        title: "Phân tầng độ khó",
        description: "Kiểm tra cơ cấu câu hỏi hiện đang phục vụ hệ thống đánh giá.",
        data: chartify(dashboard?.difficultyBreakdown, QUESTION_DIFFICULTY_LABELS),
        icon: BarChart3,
      },
    ],
    [dashboard],
  );

  const questionSkillAreas = useMemo(
    () => (dashboard?.skillAreaBreakdown ?? []).slice(0, 10),
    [dashboard],
  );

  if (dashboardLoading && !dashboard) {
    return <MeowlKuruLoader message="Đang tải trung tâm quản trị hành trình..." />;
  }

  return (
    <div className="jmt-shell">
      <header className="jmt-hero">
        <div className="jmt-hero__copy">
          <span className="jmt-eyebrow">TRUNG TÂM HÀNH TRÌNH & NGÂN HÀNG CÂU HỎI</span>
          <h2 className="jmt-title">Bảng điều phối hành trình thông minh</h2>
          <p className="jmt-subtitle">
            Theo dõi toàn bộ luồng hành trình, khả năng khôi phục, mức độ phủ ngân hàng
            câu hỏi và sức khỏe nội dung bằng giao diện tập trung dành cho quản trị viên.
          </p>

          <div className="jmt-insight-row">
            <article className="jmt-insight-card">
              <div className="jmt-insight-card__icon">
                <Sparkles size={18} />
              </div>
              <div>
                <strong>{heroInsight.title}</strong>
                <span>{heroInsight.description}</span>
              </div>
            </article>

            <article className="jmt-insight-card jmt-insight-card--warning">
              <div className="jmt-insight-card__icon">
                <AlertTriangle size={18} />
              </div>
              <div>
                <strong>Ưu tiên cho quản trị viên</strong>
                <span>
                  Theo dõi ngân hàng thiếu câu hỏi, bài test legacy chưa liên kết và các
                  hành trình chờ chấm để tránh nghẽn luồng.
                </span>
              </div>
            </article>
          </div>
        </div>

        <aside className="jmt-hero__panel">
          <button className="jmt-refresh" onClick={handleRefresh}>
            <RefreshCw size={18} />
            Làm mới bảng điều phối
          </button>

          <div className="jmt-signal-grid">
            {heroSignals.map((signal) => (
              <article key={signal.label} className="jmt-signal-card">
                <span className="jmt-signal-card__label">{signal.label}</span>
                <strong className="jmt-signal-card__value">{signal.value}</strong>
                <span className="jmt-signal-card__hint">{signal.hint}</span>
              </article>
            ))}
          </div>
        </aside>
      </header>

      {error && <div className="jmt-alert">{error}</div>}

      <section className="jmt-overview-grid">
        {overviewCards.map(({ label, value, hint, icon: Icon, tone }) => (
          <article key={label} className={`jmt-card jmt-card--overview jmt-card--${tone}`}>
            <div className="jmt-card__icon">
              <Icon size={22} />
            </div>
            <div className="jmt-card__meta">
              <span className="jmt-card__label">{label}</span>
              <strong className="jmt-card__value">{value}</strong>
              <span className="jmt-card__hint">{hint}</span>
            </div>
          </article>
        ))}
      </section>

      <section className="jmt-chart-grid">
        {chartBlocks.map((block, index) => {
          const total = block.data.reduce((sum, item) => sum + item.value, 0);
          const leading = [...block.data].sort((left, right) => right.value - left.value)[0];
          const Icon = block.icon;

          return (
            <article key={block.title} className="jmt-card jmt-card--chart">
              <div className="jmt-section-head">
                <div>
                  <span className="jmt-section-head__eyebrow">Biểu đồ vận hành</span>
                  <h3>{block.title}</h3>
                  <p>{block.description}</p>
                </div>
                <div className="jmt-section-head__icon">
                  <Icon size={18} />
                </div>
              </div>

              {block.data.length > 0 ? (
                <>
                  <div className="jmt-chart">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={block.data}
                        layout="vertical"
                        margin={{ top: 8, right: 28, left: 12, bottom: 8 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          horizontal
                          vertical={false}
                          stroke="rgba(125, 211, 252, 0.08)"
                        />
                        <XAxis
                          type="number"
                          allowDecimals={false}
                          tick={{ fill: "#8fb0c6", fontSize: 12 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          type="category"
                          dataKey="label"
                          width={120}
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#d7ebff", fontSize: 12 }}
                          tickFormatter={(value) => truncateText(String(value), 18)}
                        />
                        <Tooltip
                          cursor={{ fill: "rgba(34, 211, 238, 0.08)" }}
                          content={<ChartTooltip />}
                        />
                        <Bar
                          dataKey="value"
                          radius={[0, 10, 10, 0]}
                          barSize={block.data.length > 6 ? 16 : 22}
                          label={{ position: "right", fill: "#d7ebff", fontSize: 12 }}
                        >
                          {block.data.map((item, cellIndex) => (
                            <Cell
                              key={`${block.title}-${item.label}`}
                              fill={CHART_COLORS[(index + cellIndex) % CHART_COLORS.length]}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="jmt-chart__footer">
                    <span>Tổng tín hiệu: {formatNumber(total)}</span>
                    <span>
                      Mức nổi bật nhất: <strong>{leading?.label ?? "--"}</strong>
                    </span>
                  </div>
                </>
              ) : (
                <EmptyState message="Chưa có dữ liệu biểu đồ cho khối này." />
              )}
            </article>
          );
        })}
      </section>

      <section className="jmt-grid jmt-grid--2">
        <article className="jmt-card">
          <div className="jmt-section-head">
            <div>
              <span className="jmt-section-head__eyebrow">Tín hiệu ngân hàng câu hỏi</span>
              <h3>Trí tuệ ngân hàng câu hỏi</h3>
              <p>Theo dõi ngân hàng nào đang phục vụ nhiều hành trình, đủ câu hỏi và dễ khôi phục.</p>
            </div>
            <div className="jmt-section-head__icon">
              <Waypoints size={18} />
            </div>
          </div>

          <div className="jmt-table-wrap">
            <table className="jmt-table">
              <thead>
                <tr>
                  <th>Ngân hàng câu hỏi</th>
                  <th>Sẵn sàng</th>
                  <th>Câu hỏi hoạt động</th>
                  <th>Lượt phục vụ</th>
                  <th>Test liên kết</th>
                  <th>Hành trình liên kết</th>
                  <th>Điểm TB</th>
                  <th>Lần dùng gần nhất</th>
                </tr>
              </thead>
              <tbody>
                {(dashboard?.topBanks ?? []).length > 0 ? (
                  (dashboard?.topBanks ?? []).map((bank) => (
                    <tr key={bank.questionBankId}>
                      <td>
                        <strong>{bank.title}</strong>
                        <div className="jmt-cell-sub">
                          {bank.domain}
                          {bank.industry ? ` • ${bank.industry}` : ""}
                          {bank.jobRole ? ` • ${bank.jobRole}` : ""}
                        </div>
                        <div className="jmt-cell-sub jmt-cell-sub--muted">
                          {truncateText(bank.readinessReason, 96)}
                        </div>
                      </td>
                      <td>
                        <StatusBadge
                          label={translateEnum(bank.readinessStatus, READINESS_STATUS_LABELS)}
                          variant={getReadinessVariant(bank.readinessStatus)}
                        />
                      </td>
                      <td>{formatNumber(bank.activeQuestionCount)}</td>
                      <td>{formatNumber(bank.totalQuestionUsage)}</td>
                      <td>{formatNumber(bank.linkedAssessmentTestCount)}</td>
                      <td>{formatNumber(bank.linkedJourneyCount)}</td>
                      <td>{formatScore(bank.averageScore)}</td>
                      <td>{formatDateTime(bank.lastUsedAt)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8}>
                      <EmptyState message="Chưa có dữ liệu ngân hàng câu hỏi nổi bật." />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>

        <article className="jmt-card">
          <div className="jmt-section-head">
            <div>
              <span className="jmt-section-head__eyebrow">Sức khỏe câu hỏi</span>
              <h3>Sức khỏe câu hỏi</h3>
              <p>Quan sát nguồn tạo câu hỏi, kỹ năng nổi bật và vùng cần xử lý sớm.</p>
            </div>
            <div className="jmt-section-head__icon">
              <Brain size={18} />
            </div>
          </div>

          <div className="jmt-health-grid">
            {questionHealthSignals.map((item) => (
              <article key={item.label} className={`jmt-health-card jmt-health-card--${item.tone}`}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </article>
            ))}
          </div>

          <div className="jmt-health-section">
            <h4>Nguồn tạo câu hỏi</h4>
            <div className="jmt-pill-grid">
              {(dashboard?.questionAuthoringSourceBreakdown ?? []).length > 0 ? (
                (dashboard?.questionAuthoringSourceBreakdown ?? []).map((item) => (
                  <div key={item.label} className="jmt-pill">
                    <StatusBadge
                      label={translateEnum(item.label, QUESTION_AUTHORING_SOURCE_LABELS)}
                      variant={getAuthoringSourceVariant(item.label)}
                    />
                    <strong>{formatNumber(item.value)}</strong>
                  </div>
                ))
              ) : (
                <EmptyState message="Chưa có thống kê nguồn tạo câu hỏi." />
              )}
            </div>
          </div>

          <div className="jmt-health-section">
            <h4>Kỹ năng xuất hiện nhiều nhất</h4>
            <div className="jmt-pill-grid jmt-pill-grid--skill">
              {questionSkillAreas.length > 0 ? (
                questionSkillAreas.map((item) => (
                  <div key={item.label} className="jmt-pill jmt-pill--quiet">
                    <span>{item.label}</span>
                    <strong>{formatNumber(item.value)}</strong>
                  </div>
                ))
              ) : (
                <EmptyState message="Chưa có thống kê kỹ năng nổi bật." />
              )}
            </div>
          </div>
        </article>
      </section>

      <section className="jmt-card">
        <div className="jmt-section-head">
          <div>
            <span className="jmt-section-head__eyebrow">Điểm nóng sử dụng</span>
            <h3>Câu hỏi nổi bật</h3>
            <p>Những câu hỏi đang được dùng nhiều nhất để quản trị viên nhìn ra trọng tâm nội dung.</p>
          </div>
          <div className="jmt-section-head__icon">
            <Activity size={18} />
          </div>
        </div>

        {(dashboard?.topQuestions ?? []).length > 0 ? (
          <div className="jmt-spotlight-grid">
            {(dashboard?.topQuestions ?? []).slice(0, 6).map((question, index) => (
              <article key={question.questionId} className="jmt-spotlight-card">
                <div className="jmt-spotlight-card__top">
                  <span className="jmt-spotlight-rank">Top {index + 1}</span>
                  <StatusBadge
                    label={`${formatNumber(question.usedCount)} lượt dùng`}
                    variant="cyan"
                  />
                </div>
                <h4 title={question.questionText}>{truncateText(question.questionText, 136)}</h4>
                <p>
                  {question.questionBankTitle}
                  {question.domain ? ` • ${question.domain}` : ""}
                  {question.jobRole ? ` • ${question.jobRole}` : ""}
                </p>
                <div className="jmt-tag-row">
                  {question.difficulty && (
                    <span className="jmt-tag">
                      {translateEnum(question.difficulty, QUESTION_DIFFICULTY_LABELS)}
                    </span>
                  )}
                  {question.skillArea && (
                    <span className="jmt-tag jmt-tag--subtle">{question.skillArea}</span>
                  )}
                  <span className="jmt-tag jmt-tag--subtle">
                    {question.isActive ? "Đang hoạt động" : "Đã tắt"}
                  </span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState message="Chưa có câu hỏi nổi bật để hiển thị." />
        )}
      </section>

      <section className="jmt-card">
        <div className="jmt-section-head">
          <div>
            <span className="jmt-section-head__eyebrow">Phân tích chi tiết</span>
            <h3>Phân tích câu hỏi</h3>
            <p>Lọc sâu theo bank, độ khó, kỹ năng, nguồn tạo và trạng thái hoạt động.</p>
          </div>
          <div className="jmt-section-head__icon">
            <Search size={18} />
          </div>
        </div>

        <div className="jmt-filter-grid">
          <label className="jmt-filter-field">
            <span>
              <Filter size={14} />
              Từ khóa
            </span>
            <input
              value={questionFilters.keyword}
              onChange={(event) => {
                setQuestionPageIndex(0);
                setQuestionFilters((prev) => ({ ...prev, keyword: event.target.value }));
              }}
              placeholder="Tìm câu hỏi, ngân hàng hoặc miền"
            />
          </label>

          <label className="jmt-filter-field">
            <span>Ngân hàng câu hỏi</span>
            <select
              value={questionFilters.questionBankId}
              onChange={(event) => {
                setQuestionPageIndex(0);
                setQuestionFilters((prev) => ({ ...prev, questionBankId: event.target.value }));
              }}
            >
              <option value="">Tất cả ngân hàng câu hỏi</option>
              {banks.map((bank) => (
                <option key={bank.id} value={bank.id}>
                  {bank.title}
                </option>
              ))}
            </select>
          </label>

          <label className="jmt-filter-field">
            <span>Độ khó</span>
            <select
              value={questionFilters.difficulty}
              onChange={(event) => {
                setQuestionPageIndex(0);
                setQuestionFilters((prev) => ({ ...prev, difficulty: event.target.value }));
              }}
            >
              <option value="">Tất cả độ khó</option>
              {QUESTION_DIFFICULTY_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {translateEnum(item, QUESTION_DIFFICULTY_LABELS)}
                </option>
              ))}
            </select>
          </label>

          <label className="jmt-filter-field">
            <span>Kỹ năng</span>
            <input
              list="jmt-skill-area-options"
              value={questionFilters.skillArea}
              onChange={(event) => {
                setQuestionPageIndex(0);
                setQuestionFilters((prev) => ({ ...prev, skillArea: event.target.value }));
              }}
              placeholder="Ví dụ: React, Java, Testing"
            />
          </label>

          <label className="jmt-filter-field">
            <span>Nguồn tạo</span>
            <select
              value={questionFilters.source}
              onChange={(event) => {
                setQuestionPageIndex(0);
                setQuestionFilters((prev) => ({ ...prev, source: event.target.value }));
              }}
            >
              <option value="">Tất cả nguồn tạo</option>
              {QUESTION_AUTHORING_SOURCE_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {translateEnum(item, QUESTION_AUTHORING_SOURCE_LABELS)}
                </option>
              ))}
            </select>
          </label>

          <label className="jmt-filter-field">
            <span>Trạng thái hoạt động</span>
            <select
              value={questionFilters.isActive}
              onChange={(event) => {
                setQuestionPageIndex(0);
                setQuestionFilters((prev) => ({ ...prev, isActive: event.target.value }));
              }}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="true">Chỉ câu hỏi đang hoạt động</option>
              <option value="false">Chỉ câu hỏi đã tắt</option>
            </select>
          </label>
        </div>

        <div className="jmt-table-wrap">
          <table className="jmt-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nội dung câu hỏi</th>
                <th>Ngân hàng câu hỏi</th>
                <th>Độ khó</th>
                <th>Kỹ năng</th>
                <th>Nguồn tạo</th>
                <th>Lượt dùng</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {(questionsPage?.content ?? []).length > 0 ? (
                (questionsPage?.content ?? []).map((question) => (
                  <tr key={question.questionId}>
                    <td>#{question.questionId}</td>
                    <td>
                      <strong>{truncateText(question.questionText, 112)}</strong>
                      <div className="jmt-cell-sub">
                        {question.domain}
                        {question.industry ? ` • ${question.industry}` : ""}
                        {question.jobRole ? ` • ${question.jobRole}` : ""}
                      </div>
                      <div className="jmt-cell-sub jmt-cell-sub--muted">
                        Cập nhật: {formatDateTime(question.updatedAt)}
                      </div>
                    </td>
                    <td>{question.questionBankTitle}</td>
                    <td>{translateEnum(question.difficulty, QUESTION_DIFFICULTY_LABELS)}</td>
                    <td>{question.skillArea || "--"}</td>
                    <td>
                      <StatusBadge
                        label={translateEnum(question.source, QUESTION_AUTHORING_SOURCE_LABELS)}
                        variant={getAuthoringSourceVariant(question.source)}
                      />
                    </td>
                    <td>{formatNumber(question.usedCount)}</td>
                    <td>
                      <StatusBadge
                        label={question.isActive ? "Đang hoạt động" : "Đã tắt"}
                        variant={getActiveVariant(question.isActive)}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8}>
                    <EmptyState message="Không có câu hỏi phù hợp với bộ lọc hiện tại." />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {questionsLoading && (
          <div className="jmt-inline-loading">Đang tải dữ liệu phân tích câu hỏi...</div>
        )}

        <PaginationBar
          page={questionPageIndex}
          totalPages={questionsPage?.totalPages ?? 0}
          totalElements={questionsPage?.totalElements}
          onChange={setQuestionPageIndex}
        />
      </section>

      <section className="jmt-card">
        <div className="jmt-section-head">
          <div>
            <span className="jmt-section-head__eyebrow">Giám sát vận hành</span>
            <h3>Giám sát hành trình</h3>
            <p>Theo dõi trạng thái, nguồn đề, lộ trình và hoạt động gần nhất của từng hành trình.</p>
          </div>
          <div className="jmt-section-head__icon">
            <Route size={18} />
          </div>
        </div>

        <div className="jmt-filter-grid jmt-filter-grid--journey">
          <label className="jmt-filter-field">
            <span>
              <Search size={14} />
              Từ khóa
            </span>
            <input
              value={journeyFilters.keyword}
              onChange={(event) => {
                setJourneyPageIndex(0);
                setJourneyFilters((prev) => ({ ...prev, keyword: event.target.value }));
              }}
              placeholder="Tìm người dùng, mục tiêu hoặc miền"
            />
          </label>

          <label className="jmt-filter-field">
            <span>Miền nghề nghiệp</span>
            <input
              list="jmt-domain-options"
              value={journeyFilters.domain}
              onChange={(event) => {
                setJourneyPageIndex(0);
                setJourneyFilters((prev) => ({ ...prev, domain: event.target.value }));
              }}
              placeholder="Ví dụ: Công nghệ thông tin"
            />
          </label>

          <label className="jmt-filter-field">
            <span>Trạng thái journey</span>
            <select
              value={journeyFilters.status}
              onChange={(event) => {
                setJourneyPageIndex(0);
                setJourneyFilters((prev) => ({ ...prev, status: event.target.value }));
              }}
            >
              <option value="">Tất cả trạng thái journey</option>
              {JOURNEY_STATUS_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {translateEnum(item, JOURNEY_STATUS_LABELS)}
                </option>
              ))}
            </select>
          </label>

          <label className="jmt-filter-field">
            <span>Loại journey</span>
            <select
              value={journeyFilters.type}
              onChange={(event) => {
                setJourneyPageIndex(0);
                setJourneyFilters((prev) => ({ ...prev, type: event.target.value }));
              }}
            >
              <option value="">Tất cả loại journey</option>
              {JOURNEY_TYPE_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {translateEnum(item, JOURNEY_TYPE_LABELS)}
                </option>
              ))}
            </select>
          </label>

          <label className="jmt-filter-field">
            <span>Nguồn đề</span>
            <select
              value={journeyFilters.questionSource}
              onChange={(event) => {
                setJourneyPageIndex(0);
                setJourneyFilters((prev) => ({ ...prev, questionSource: event.target.value }));
              }}
            >
              <option value="">Tất cả nguồn đề</option>
              {QUESTION_SOURCE_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {translateEnum(item, QUESTION_SOURCE_LABELS)}
                </option>
              ))}
            </select>
          </label>

          <label className="jmt-filter-field">
            <span>Ngân hàng câu hỏi</span>
            <select
              value={journeyFilters.questionBankId}
              onChange={(event) => {
                setJourneyPageIndex(0);
                setJourneyFilters((prev) => ({ ...prev, questionBankId: event.target.value }));
              }}
            >
              <option value="">Tất cả ngân hàng câu hỏi</option>
              {banks.map((bank) => (
                <option key={bank.id} value={bank.id}>
                  {bank.title}
                </option>
              ))}
            </select>
          </label>

          <label className="jmt-filter-field">
            <span>Lộ trình</span>
            <select
              value={journeyFilters.hasRoadmap}
              onChange={(event) => {
                setJourneyPageIndex(0);
                setJourneyFilters((prev) => ({ ...prev, hasRoadmap: event.target.value }));
              }}
            >
              <option value="">Tất cả trạng thái lộ trình</option>
              <option value="true">Đã có lộ trình</option>
              <option value="false">Chưa có lộ trình</option>
            </select>
          </label>

          <label className="jmt-filter-field">
            <span>Tạo từ thời điểm</span>
            <input
              type="datetime-local"
              value={journeyFilters.createdFrom}
              onChange={(event) => {
                setJourneyPageIndex(0);
                setJourneyFilters((prev) => ({ ...prev, createdFrom: event.target.value }));
              }}
            />
          </label>

          <label className="jmt-filter-field">
            <span>Tạo đến thời điểm</span>
            <input
              type="datetime-local"
              value={journeyFilters.createdTo}
              onChange={(event) => {
                setJourneyPageIndex(0);
                setJourneyFilters((prev) => ({ ...prev, createdTo: event.target.value }));
              }}
            />
          </label>
        </div>

        <div className="jmt-table-wrap">
          <table className="jmt-table">
            <thead>
              <tr>
                <th>Hành trình</th>
                <th>Người dùng</th>
                <th>Loại & mục tiêu</th>
                <th>Trạng thái</th>
                <th>Nguồn đề</th>
                <th>Ngân hàng câu hỏi</th>
                <th>Điểm gần nhất</th>
                <th>Lộ trình</th>
                <th>Hoạt động cuối</th>
              </tr>
            </thead>
            <tbody>
              {(journeysPage?.content ?? []).length > 0 ? (
                (journeysPage?.content ?? []).map((journey) => (
                  <tr key={journey.journeyId}>
                    <td>
                      <strong>#{journey.journeyId}</strong>
                      <div className="jmt-cell-sub">
                        {journey.domain || "--"}
                        {journey.jobRole ? ` • ${journey.jobRole}` : ""}
                      </div>
                      <div className="jmt-cell-sub jmt-cell-sub--muted">
                        Tạo lúc: {formatDateTime(journey.createdAt)}
                      </div>
                    </td>

                    <td>
                      <strong>{journey.userName}</strong>
                      <div className="jmt-cell-sub">{journey.userEmail}</div>
                    </td>

                    <td>
                      <strong>{translateEnum(journey.type, JOURNEY_TYPE_LABELS)}</strong>
                      <div className="jmt-cell-sub">{truncateText(journey.goal, 72)}</div>
                      <div className="jmt-cell-sub jmt-cell-sub--muted">
                        Tiến độ:{" "}
                        {journey.progressPercentage != null
                          ? formatPercent(journey.progressPercentage)
                          : "--"}
                      </div>
                    </td>

                    <td>
                      <StatusBadge
                        label={translateEnum(journey.status, JOURNEY_STATUS_LABELS)}
                        variant={getJourneyStatusVariant(journey.status)}
                      />
                      <div className="jmt-cell-sub jmt-cell-sub--muted">
                        Test: {translateEnum(journey.assessmentTestStatus)}
                      </div>
                    </td>

                    <td>
                      <StatusBadge
                        label={translateEnum(journey.questionSource, QUESTION_SOURCE_LABELS)}
                        variant={getQuestionSourceVariant(journey.questionSource)}
                      />
                    </td>

                    <td>{journey.questionBankTitle || "Chưa liên kết ngân hàng câu hỏi"}</td>
                    <td>{formatScore(journey.latestScore)}</td>
                    <td>
                      <StatusBadge
                        label={journey.roadmapReady ? "Đã sẵn sàng" : "Chưa có"}
                        variant={getRoadmapVariant(journey.roadmapReady)}
                      />
                    </td>
                    <td>{formatDateTime(journey.lastActivityAt)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9}>
                    <EmptyState message="Không có journey phù hợp với bộ lọc hiện tại." />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {journeysLoading && (
          <div className="jmt-inline-loading">Đang tải danh sách giám sát hành trình...</div>
        )}

        <PaginationBar
          page={journeyPageIndex}
          totalPages={journeysPage?.totalPages ?? 0}
          totalElements={journeysPage?.totalElements}
          onChange={setJourneyPageIndex}
        />
      </section>

      <datalist id="jmt-domain-options">
        {domainOptions.map((domain) => (
          <option key={domain} value={domain} />
        ))}
      </datalist>

      <datalist id="jmt-skill-area-options">
        {skillAreaOptions.map((skill) => (
          <option key={skill} value={skill} />
        ))}
      </datalist>
    </div>
  );
};

export default JourneyManagementTab;
