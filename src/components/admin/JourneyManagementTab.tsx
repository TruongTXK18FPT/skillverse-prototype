import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  Database,
  RefreshCw,
  Route,
  Search,
  ShieldCheck,
  Waypoints,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import MeowlKuruLoader from "../kuru-loader/MeowlKuruLoader";
import { getQuestionBanks } from "../../services/questionBankService";
import adminJourneyService from "../../services/adminJourneyService";
import { QuestionBankSummary } from "../../data/questionBankDTOs";
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

const formatNumber = (value?: number | null) =>
  new Intl.NumberFormat("vi-VN").format(value ?? 0);

const formatPercent = (value?: number | null) => `${(value ?? 0).toFixed(2)}%`;

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

const titleCase = (value?: string | null) => {
  if (!value) return "--";
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const chartify = (items?: AdminJourneyBreakdownItem[]) =>
  (items ?? []).map((item) => ({
    label: titleCase(item.label),
    value: item.value,
  }));

const toIsoDateTime = (value: string) =>
  value ? new Date(value).toISOString() : undefined;

const PaginationBar = ({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (nextPage: number) => void;
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className="jmt-pagination">
      <button
        className="jmt-pagination__button"
        disabled={page <= 0}
        onClick={() => onChange(page - 1)}
      >
        Trước
      </button>
      <span className="jmt-pagination__label">
        Trang {page + 1}/{totalPages}
      </span>
      <button
        className="jmt-pagination__button"
        disabled={page + 1 >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        Sau
      </button>
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
      setError("Không thể tải dashboard journey admin.");
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
      setError("Không thể tải Journey Monitor.");
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
      setError("Không thể tải Question Analytics.");
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

  const overviewCards = useMemo(
    () => [
      {
        label: "Journeys",
        value: formatNumber(dashboard?.totalJourneys),
        hint: `${formatNumber(dashboard?.roadmapReadyJourneys)} roadmap ready`,
        icon: Route,
      },
      {
        label: "Assessment Tests",
        value: formatNumber(dashboard?.totalAssessmentTests),
        hint: `${formatNumber(dashboard?.bankLinkedTests)} linked to bank`,
        icon: Activity,
      },
      {
        label: "Question Banks",
        value: formatNumber(dashboard?.totalQuestionBanks),
        hint: `${formatNumber(dashboard?.totalActiveQuestions)} active questions`,
        icon: Database,
      },
      {
        label: "Recovery Coverage",
        value: formatPercent(dashboard?.recoveryCoverageRate),
        hint: `${formatNumber(dashboard?.legacyUnlinkedTests)} legacy gaps`,
        icon: ShieldCheck,
      },
    ],
    [dashboard],
  );

  const chartBlocks = useMemo(
    () => [
      { title: "Assessment Funnel", data: chartify(dashboard?.assessmentFunnel), color: "#1d4ed8" },
      { title: "Journey Status", data: chartify(dashboard?.journeyStatusBreakdown).slice(0, 6), color: "#0f766e" },
      { title: "Test Source", data: chartify(dashboard?.testSourceBreakdown), color: "#b45309" },
      { title: "Difficulty Mix", data: chartify(dashboard?.difficultyBreakdown), color: "#7c3aed" },
    ],
    [dashboard],
  );

  const questionSkillAreas = useMemo(
    () => (dashboard?.skillAreaBreakdown ?? []).slice(0, 8),
    [dashboard],
  );

  if (dashboardLoading && !dashboard) {
    return <MeowlKuruLoader message="Đang tải Journey Management..." />;
  }

  return (
    <div className="jmt-shell">
      <div className="jmt-header">
        <div>
          <span className="jmt-eyebrow">Journey Intelligence</span>
          <h2 className="jmt-title">Journey Management</h2>
          <p className="jmt-subtitle">
            Theo dõi luồng journey, assessment recovery, question bank usage và hành vi vận hành của admin AI.
          </p>
        </div>
        <button className="jmt-refresh" onClick={handleRefresh}>
          <RefreshCw size={18} />
          Làm mới
        </button>
      </div>

      {error && <div className="jmt-alert">{error}</div>}

      <section className="jmt-overview-grid">
        {overviewCards.map(({ label, value, hint, icon: Icon }) => (
          <article key={label} className="jmt-card jmt-card--overview">
            <div className="jmt-card__icon"><Icon size={20} /></div>
            <div className="jmt-card__meta">
              <span className="jmt-card__label">{label}</span>
              <strong className="jmt-card__value">{value}</strong>
              <span className="jmt-card__hint">{hint}</span>
            </div>
          </article>
        ))}
      </section>

      <section className="jmt-chart-grid">
        {chartBlocks.map((block) => (
          <article key={block.title} className="jmt-card">
            <div className="jmt-section-head">
              <h3>{block.title}</h3>
              <BarChart3 size={18} />
            </div>
            <div className="jmt-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={block.data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#dbe4f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} angle={-12} textAnchor="end" height={56} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill={block.color} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>
        ))}
      </section>

      <section className="jmt-grid jmt-grid--2">
        <article className="jmt-card">
          <div className="jmt-section-head">
            <h3>Bank Intelligence</h3>
            <Waypoints size={18} />
          </div>
          <div className="jmt-table-wrap">
            <table className="jmt-table">
              <thead>
                <tr>
                  <th>Bank</th>
                  <th>Ready</th>
                  <th>Questions</th>
                  <th>Usage</th>
                  <th>Tests</th>
                  <th>Avg Score</th>
                </tr>
              </thead>
              <tbody>
                {(dashboard?.topBanks ?? []).map((bank) => (
                  <tr key={bank.questionBankId}>
                    <td>
                      <strong>{bank.title}</strong>
                      <div className="jmt-cell-sub">{bank.domain} {bank.jobRole ? `• ${bank.jobRole}` : ""}</div>
                    </td>
                    <td>
                      <span className={`jmt-badge ${bank.readinessStatus === "READY" ? "ready" : "warn"}`}>
                        {titleCase(bank.readinessStatus)}
                      </span>
                    </td>
                    <td>{formatNumber(bank.activeQuestionCount)}</td>
                    <td>{formatNumber(bank.totalQuestionUsage)}</td>
                    <td>{formatNumber(bank.linkedAssessmentTestCount)}</td>
                    <td>{bank.averageScore != null ? `${bank.averageScore.toFixed(2)}%` : "--"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="jmt-card">
          <div className="jmt-section-head">
            <h3>Question Health</h3>
            <Database size={18} />
          </div>
          <div className="jmt-pill-grid">
            {(dashboard?.questionAuthoringSourceBreakdown ?? []).map((item) => (
              <div key={item.label} className="jmt-pill">
                <span>{titleCase(item.label)}</span>
                <strong>{formatNumber(item.value)}</strong>
              </div>
            ))}
          </div>
          <div className="jmt-pill-grid jmt-pill-grid--skill">
            {questionSkillAreas.map((item) => (
              <div key={item.label} className="jmt-pill jmt-pill--quiet">
                <span>{item.label}</span>
                <strong>{formatNumber(item.value)}</strong>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="jmt-card">
        <div className="jmt-section-head">
          <h3>Top Questions</h3>
          <Activity size={18} />
        </div>
        <div className="jmt-table-wrap">
          <table className="jmt-table">
            <thead>
              <tr>
                <th>Question</th>
                <th>Bank</th>
                <th>Difficulty</th>
                <th>Skill Area</th>
                <th>Used</th>
              </tr>
            </thead>
            <tbody>
              {(dashboard?.topQuestions ?? []).map((question) => (
                <tr key={question.questionId}>
                  <td>{question.questionText}</td>
                  <td>{question.questionBankTitle}</td>
                  <td>{titleCase(question.difficulty)}</td>
                  <td>{question.skillArea || "--"}</td>
                  <td>{formatNumber(question.usedCount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="jmt-card">
        <div className="jmt-section-head">
          <h3>Question Analytics</h3>
          <Search size={18} />
        </div>
        <div className="jmt-filter-bar">
          <input
            value={questionFilters.skillArea}
            onChange={(e) => { setQuestionPageIndex(0); setQuestionFilters((prev) => ({ ...prev, skillArea: e.target.value })); }}
            placeholder="Skill area"
          />
          <select value={questionFilters.questionBankId} onChange={(e) => { setQuestionPageIndex(0); setQuestionFilters((prev) => ({ ...prev, questionBankId: e.target.value })); }}>
            <option value="">Tất cả bank</option>
            {banks.map((bank) => <option key={bank.id} value={bank.id}>{bank.title}</option>)}
          </select>
          <select value={questionFilters.difficulty} onChange={(e) => { setQuestionPageIndex(0); setQuestionFilters((prev) => ({ ...prev, difficulty: e.target.value })); }}>
            <option value="">Tất cả độ khó</option>
            {QUESTION_DIFFICULTY_OPTIONS.map((item) => <option key={item} value={item}>{titleCase(item)}</option>)}
          </select>
          <select value={questionFilters.source} onChange={(e) => { setQuestionPageIndex(0); setQuestionFilters((prev) => ({ ...prev, source: e.target.value })); }}>
            <option value="">Tất cả nguồn</option>
            {QUESTION_AUTHORING_SOURCE_OPTIONS.map((item) => <option key={item} value={item}>{titleCase(item)}</option>)}
          </select>
          <select value={questionFilters.isActive} onChange={(e) => { setQuestionPageIndex(0); setQuestionFilters((prev) => ({ ...prev, isActive: e.target.value })); }}>
            <option value="">Active + Inactive</option>
            <option value="true">Chỉ Active</option>
            <option value="false">Chỉ Inactive</option>
          </select>
          <input
            value={questionFilters.keyword}
            onChange={(e) => { setQuestionPageIndex(0); setQuestionFilters((prev) => ({ ...prev, keyword: e.target.value })); }}
            placeholder="Tìm question / bank / domain"
          />
        </div>
        <div className="jmt-table-wrap">
          <table className="jmt-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Question</th>
                <th>Bank</th>
                <th>Difficulty</th>
                <th>Source</th>
                <th>Used</th>
              </tr>
            </thead>
            <tbody>
              {(questionsPage?.content ?? []).map((question) => (
                <tr key={question.questionId}>
                  <td>#{question.questionId}</td>
                  <td>{question.questionText}</td>
                  <td>{question.questionBankTitle}</td>
                  <td>{titleCase(question.difficulty)}</td>
                  <td>{titleCase(question.source)}</td>
                  <td>{formatNumber(question.usedCount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {questionsLoading && <div className="jmt-inline-loading">Đang tải analytics câu hỏi...</div>}
        <PaginationBar page={questionPageIndex} totalPages={questionsPage?.totalPages ?? 0} onChange={setQuestionPageIndex} />
      </section>

      <section className="jmt-card">
        <div className="jmt-section-head">
          <h3>Journey Monitor</h3>
          <Route size={18} />
        </div>
        <div className="jmt-filter-bar jmt-filter-bar--wide">
          <input
            value={journeyFilters.domain}
            onChange={(e) => { setJourneyPageIndex(0); setJourneyFilters((prev) => ({ ...prev, domain: e.target.value })); }}
            placeholder="Domain"
          />
          <select value={journeyFilters.status} onChange={(e) => { setJourneyPageIndex(0); setJourneyFilters((prev) => ({ ...prev, status: e.target.value })); }}>
            <option value="">Tất cả status</option>
            {JOURNEY_STATUS_OPTIONS.map((item) => <option key={item} value={item}>{titleCase(item)}</option>)}
          </select>
          <select value={journeyFilters.type} onChange={(e) => { setJourneyPageIndex(0); setJourneyFilters((prev) => ({ ...prev, type: e.target.value })); }}>
            <option value="">Tất cả loại</option>
            {JOURNEY_TYPE_OPTIONS.map((item) => <option key={item} value={item}>{titleCase(item)}</option>)}
          </select>
          <select value={journeyFilters.questionSource} onChange={(e) => { setJourneyPageIndex(0); setJourneyFilters((prev) => ({ ...prev, questionSource: e.target.value })); }}>
            <option value="">Tất cả nguồn test</option>
            {QUESTION_SOURCE_OPTIONS.map((item) => <option key={item} value={item}>{titleCase(item)}</option>)}
          </select>
          <select value={journeyFilters.questionBankId} onChange={(e) => { setJourneyPageIndex(0); setJourneyFilters((prev) => ({ ...prev, questionBankId: e.target.value })); }}>
            <option value="">Mọi question bank</option>
            {banks.map((bank) => <option key={bank.id} value={bank.id}>{bank.title}</option>)}
          </select>
          <select value={journeyFilters.hasRoadmap} onChange={(e) => { setJourneyPageIndex(0); setJourneyFilters((prev) => ({ ...prev, hasRoadmap: e.target.value })); }}>
            <option value="">Roadmap: tất cả</option>
            <option value="true">Đã có roadmap</option>
            <option value="false">Chưa có roadmap</option>
          </select>
          <input type="datetime-local" value={journeyFilters.createdFrom} onChange={(e) => { setJourneyPageIndex(0); setJourneyFilters((prev) => ({ ...prev, createdFrom: e.target.value })); }} />
          <input type="datetime-local" value={journeyFilters.createdTo} onChange={(e) => { setJourneyPageIndex(0); setJourneyFilters((prev) => ({ ...prev, createdTo: e.target.value })); }} />
          <input
            value={journeyFilters.keyword}
            onChange={(e) => { setJourneyPageIndex(0); setJourneyFilters((prev) => ({ ...prev, keyword: e.target.value })); }}
            placeholder="Tìm user / domain / goal"
          />
        </div>
        <div className="jmt-table-wrap">
          <table className="jmt-table">
            <thead>
              <tr>
                <th>Journey</th>
                <th>User</th>
                <th>Status</th>
                <th>Question Source</th>
                <th>Question Bank</th>
                <th>Latest Score</th>
                <th>Roadmap</th>
                <th>Last Activity</th>
              </tr>
            </thead>
            <tbody>
              {(journeysPage?.content ?? []).map((journey) => (
                <tr key={journey.journeyId}>
                  <td>
                    <strong>#{journey.journeyId}</strong>
                    <div className="jmt-cell-sub">{journey.domain || "--"} {journey.jobRole ? `• ${journey.jobRole}` : ""}</div>
                  </td>
                  <td>
                    <strong>{journey.userName}</strong>
                    <div className="jmt-cell-sub">{journey.userEmail}</div>
                  </td>
                  <td><span className="jmt-badge">{titleCase(journey.status)}</span></td>
                  <td>{titleCase(journey.questionSource)}</td>
                  <td>{journey.questionBankTitle || "--"}</td>
                  <td>{journey.latestScore != null ? `${journey.latestScore}%` : "--"}</td>
                  <td>{journey.roadmapReady ? "Ready" : "Pending"}</td>
                  <td>{formatDateTime(journey.lastActivityAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {journeysLoading && <div className="jmt-inline-loading">Đang tải Journey Monitor...</div>}
        <PaginationBar page={journeyPageIndex} totalPages={journeysPage?.totalPages ?? 0} onChange={setJourneyPageIndex} />
      </section>
    </div>
  );
};

export default JourneyManagementTab;
