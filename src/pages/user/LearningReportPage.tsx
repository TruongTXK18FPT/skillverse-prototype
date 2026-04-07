import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  X,
  FileText,
  RefreshCw,
  Clock,
  TrendingUp,
  Target,
  Brain,
  Sparkles,
  Award,
  AlertCircle,
  CheckCircle2,
  Zap,
  BookOpen,
  BarChart2,
  Lightbulb,
  Trophy,
  Flame,
  Star,
  GraduationCap,
  Download,
  ArrowLeft,
} from "lucide-react";
import learningReportService, {
  StudentLearningReportResponse,
  ReportType,
  CanGenerateResponse,
  isValidReportId,
  parseReportId,
} from "../../services/learningReportService";
import { useAuth } from "../../context/AuthContext";
import MeowlKuruLoader from "../../components/kuru-loader/MeowlKuruLoader";
import MarkdownRenderer from "../../components/learning-report/MarkdownRenderer";
import { downloadLearningReportPDF } from "../../components/learning-report/PDFGenerator";
import "./LearningReportPage.css";
import "../../components/learning-report/MarkdownRenderer.css";

interface TocChildItem {
  id: string;
  title: string;
  level: 2 | 3;
}

interface TocParentItem {
  id: string;
  key: string;
  title: string;
  children: TocChildItem[];
}

// Section configuration for navigation
const SECTION_CONFIG = [
  { key: "overview", label: "Tổng quan", icon: BarChart2 },
  { key: "currentSkills", label: "Kỹ năng", icon: Brain },
  { key: "progress", label: "Tiến độ", icon: TrendingUp },
  { key: "strengths", label: "Điểm mạnh", icon: Award },
  { key: "areasToImprove", label: "Cần cải thiện", icon: AlertCircle },
  { key: "recommendations", label: "Đề xuất", icon: Lightbulb },
  { key: "learningGoals", label: "Mục tiêu", icon: Target },
  { key: "skillGaps", label: "Khoảng trống", icon: BookOpen },
  { key: "nextSteps", label: "Bước tiếp theo", icon: Zap },
  { key: "motivation", label: "Động lực", icon: Star },
];

// Meowl speech bubbles based on state
const getMeowlSpeech = (
  state: "loading" | "generating" | "error" | "no-report" | "report",
  trend?: string,
) => {
  const speeches = {
    loading: [
      "Meowl đang xem dữ liệu của bạn... 📚",
      "Chờ chút nha, Meowl đang tìm hiểu! 🔍",
    ],
    generating: [
      "Meowl đang phân tích rất chăm chỉ! 🧠",
      "AI đang làm việc, đợi Meowl tí nha~ ⚡",
      "Báo cáo sắp xong rồi! 🎯",
      "Đang thu thập thông tin học tập... 📊",
      "Meowl đang xử lý dữ liệu lớn! 💪",
    ],
    error: [
      "Ôi không! Có lỗi gì đó rồi... 😿",
      "Meowl gặp trục trặc, thử lại nha! 🔄",
    ],
    "no-report": [
      "Bạn chưa có báo cáo nào! Tạo ngay nha~ ✨",
      "Meowl sẵn sàng phân tích cho bạn! 📊",
    ],
    report: {
      improving: [
        "Woww! Bạn đang tiến bộ tuyệt vời! 🚀",
        "Meowl rất tự hào về bạn! 🌟",
        "Cứ giữ phong độ này nha! 💪",
      ],
      stable: ["Bạn đang học đều đặn đó! 📈", "Ổn định là tốt, cố lên! 🎯"],
      declining: [
        "Meowl thấy bạn hơi chùng... 😔",
        "Đừng lo, Meowl sẽ giúp bạn! 💖",
        "Cùng lập kế hoạch mới nha! 📝",
      ],
    },
  };

  if (state === "report" && trend) {
    const trendSpeeches =
      speeches.report[trend as keyof typeof speeches.report] ||
      speeches.report.stable;
    return trendSpeeches[Math.floor(Math.random() * trendSpeeches.length)];
  }

  const stateSpeeches = speeches[state as keyof typeof speeches];
  if (Array.isArray(stateSpeeches)) {
    return stateSpeeches[Math.floor(Math.random() * stateSpeeches.length)];
  }
  return "Meowl ở đây nè! 🐱";
};

const slugifyHeading = (input: string): string =>
  input
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

const isSameLocalDate = (sourceDate: Date, targetDate: Date): boolean => {
  return (
    sourceDate.getFullYear() === targetDate.getFullYear() &&
    sourceDate.getMonth() === targetDate.getMonth() &&
    sourceDate.getDate() === targetDate.getDate()
  );
};

/** Memoized section content – only re-renders when section content actually changes */
const SectionContent = memo(
  ({ content }: { content: string }) => (
    <motion.div
      className="lr-page__section-markdown"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <MarkdownRenderer content={content} />
    </motion.div>
  ),
  (prev, next) => prev.content === next.content,
);
SectionContent.displayName = "SectionContent";

const LearningReportPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reportIdParam = searchParams.get("id");

  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [report, setReport] = useState<StudentLearningReportResponse | null>(null);
  const [canGenerate, setCanGenerate] = useState<CanGenerateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState("overview");
  const [activeHeadingId, setActiveHeadingId] = useState("lr-doc-overview");
  const [tocItems, setTocItems] = useState<TocParentItem[]>([]);
  const [selectedReportType, setSelectedReportType] = useState<ReportType>("COMPREHENSIVE");
  const [meowlSpeech, setMeowlSpeech] = useState("");
  const [generatingStep, setGeneratingStep] = useState(0);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const headingElementMapRef = useRef<Record<string, HTMLElement>>({});
  const headingParentMapRef = useRef<Record<string, string>>({});

  useEffect(() => {
    if (isValidReportId(reportIdParam)) {
      try {
        const validId = parseReportId(reportIdParam);
        loadReportById(validId);
      } catch {
        loadInitialData();
      }
    } else {
      loadInitialData();
    }
  }, [reportIdParam]);

  const loadReportById = async (reportId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const [reportData, canGen] = await Promise.all([
        learningReportService.getReportById(reportId),
        learningReportService.canGenerateReport(),
      ]);
      setReport(reportData);
      setCanGenerate(canGen);
    } catch (err: unknown) {
      console.error("Error loading report by ID:", err);
      setError("Không thể tải báo cáo. Báo cáo có thể không tồn tại hoặc đã bị xóa.");
      try {
        const latestReport = await learningReportService.getLatestReport();
        if (latestReport) {
          setReport(latestReport);
          setError(null);
        }
      } catch {
        // Keep the original error
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadInitialData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [latestReport, canGen] = await Promise.all([
        learningReportService.getLatestReport(),
        learningReportService.canGenerateReport(),
      ]);
      setReport(latestReport);
      setCanGenerate(canGen);
    } catch (err: unknown) {
      console.error("Error loading report data:", err);
      setError("Không thể tải dữ liệu. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoading) {
      setMeowlSpeech(getMeowlSpeech("loading"));
    } else if (isGenerating) {
      setMeowlSpeech(getMeowlSpeech("generating"));
    } else if (error) {
      setMeowlSpeech(getMeowlSpeech("error"));
    } else if (!report) {
      setMeowlSpeech(getMeowlSpeech("no-report"));
    } else {
      setMeowlSpeech(getMeowlSpeech("report", report.learningTrend));
    }
  }, [isLoading, isGenerating, error, report]);

  useEffect(() => {
    if (isGenerating) {
      const interval = setInterval(() => {
        setGeneratingStep((prev) => (prev + 1) % 4);
      }, 3000);
      return () => clearInterval(interval);
    } else {
      setGeneratingStep(0);
    }
  }, [isGenerating]);

  const handleGenerateReport = async () => {
    if (!canGenerate?.canGenerate) return;

    setIsGenerating(true);
    setError(null);
    setGeneratingStep(0);
    try {
      const newReport = await learningReportService.generateReport({
        reportType: selectedReportType,
        includeChatHistory: true,
        includeDetailedSkills: true,
      });
      setReport(newReport);
      const canGen = await learningReportService.canGenerateReport();
      setCanGenerate(canGen);
      setActiveSection("overview");
      setActiveHeadingId("lr-doc-overview");
    } catch (err: unknown) {
      console.error("Error generating report:", err);
      setError(err instanceof Error ? err.message : "Không thể tạo báo cáo.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateQuickReport = async () => {
    setIsGenerating(true);
    setError(null);
    setGeneratingStep(0);
    try {
      const newReport = await learningReportService.generateQuickReport();
      setReport(newReport);
      const canGen = await learningReportService.canGenerateReport();
      setCanGenerate(canGen);
      setActiveSection("overview");
      setActiveHeadingId("lr-doc-overview");
    } catch (err: unknown) {
      console.error("Error generating quick report:", err);
      setError(err instanceof Error ? err.message : "Không thể tạo báo cáo.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!report) return;
    setIsDownloadingPDF(true);
    try {
      let avatarUrl = user?.avatarMediaUrl || user?.avatarUrl;
      if (!user?.avatarMediaUrl && user?.id) {
        try {
          const userService = (await import('../../services/userService')).default;
          const freshUser = await userService.getUserProfile(user.id);
          if (freshUser.avatarMediaUrl) avatarUrl = freshUser.avatarMediaUrl;
        } catch (error) {
          console.error('Failed to fetch fresh profile:', error);
        }
      }
      await downloadLearningReportPDF(report, {
        filename: `learning-report-${report.reportId}-${new Date().toISOString().split("T")[0]}`,
        includeHeader: true,
        includeFooter: true,
        includePageNumbers: true,
        quality: "high",
        userAvatar: avatarUrl,
        branding: {
          companyName: "SkillVerse",
          tagline: "Your AI-Powered Learning Companion",
        },
      });
    } catch (err) {
      console.error("Error downloading PDF:", err);
      setError("Không thể tải PDF. Vui lòng thử lại.");
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  const getTotalStudyHours = (): string => {
    if (!report?.metrics) return "0h";
    const totalHours = report.metrics.totalStudyHours || 0;
    return `${totalHours}h`;
  };

  const getStreakDisplay = () => {
    const streak = report?.metrics?.currentStreak || 0;
    let emoji = "🔥";
    let description = "ngày liên tiếp";
    if (streak === 0) {
      emoji = "💤";
      description = "Bắt đầu streak!";
    } else if (streak >= 30) {
      emoji = "🔥🔥🔥";
      description = "Streak cháy!";
    } else if (streak >= 14) {
      emoji = "🔥🔥";
      description = "Streak mạnh!";
    } else if (streak >= 7) {
      emoji = "🔥";
      description = "Streak tốt!";
    }
    return { value: streak, emoji, description };
  };

  const getAvailableSections = () => {
    if (!report) return [];
    const sections = [{ key: "overview", available: true }];
    Object.entries(report.sections || {}).forEach(([key, content]) => {
      if (content && content.trim()) {
        sections.push({ key, available: true });
      }
    });
    return sections;
  };

  const availableSections = useMemo(() => getAvailableSections(), [report]);
  const detailSections = useMemo(
    () => availableSections.filter(({ key }) => key !== "overview"),
    [availableSections],
  );

  const isReportFromToday = useMemo(() => {
    if (!report?.generatedAt) return false;

    const reportDate = new Date(report.generatedAt);
    if (Number.isNaN(reportDate.getTime())) return false;

    return isSameLocalDate(reportDate, new Date());
  }, [report?.generatedAt]);

  const setSectionRef = useCallback(
    (key: string) => (node: HTMLElement | null) => {
      sectionRefs.current[key] = node;
    },
    [],
  );

  const handleSidebarSectionClick = useCallback((headingId: string) => {
    const headingNode = headingElementMapRef.current[headingId];
    if (!headingNode) return;
    headingNode.scrollIntoView({ behavior: "smooth", block: "start" });
    const parentKey = headingParentMapRef.current[headingId];
    if (parentKey) {
      setActiveSection(parentKey);
    }
    setActiveHeadingId(headingId);
  }, []);

  useEffect(() => {
    if (!report || detailSections.length === 0) {
      setTocItems([]);
      headingElementMapRef.current = {};
      headingParentMapRef.current = {};
      return;
    }

    if (isLoading || isGenerating) {
      return;
    }

    let isCancelled = false;
    let retryFrameId: number | null = null;

    const buildTocFromDom = (): boolean => {
      const parentItems: TocParentItem[] = [];
      const headingElementMap: Record<string, HTMLElement> = {};
      const headingParentMap: Record<string, string> = {};

      detailSections.forEach(({ key }) => {
        const sectionNode = sectionRefs.current[key];
        if (!sectionNode) return;

        const config = SECTION_CONFIG.find((section) => section.key === key);
        if (!config) return;

        const parentId = `lr-doc-${key}`;
        const parentHeading = sectionNode.querySelector(
          ".lr-page__doc-h2",
        ) as HTMLHeadingElement | null;

        if (parentHeading) {
          parentHeading.id = parentId;
          headingElementMap[parentId] = parentHeading;
          headingParentMap[parentId] = key;
        }

        const childHeadings = Array.from(
          sectionNode.querySelectorAll(
            ".lr-page__content-section-body h2.lr-markdown__h2, .lr-page__content-section-body h3.lr-markdown__h3",
          ),
        ) as HTMLHeadingElement[];

        const slugCounter: Record<string, number> = {};
        const children: TocChildItem[] = childHeadings.map((headingNode) => {
          const title = headingNode.textContent?.trim() || "Mục con";
          const level = headingNode.tagName.toLowerCase() === "h2" ? 2 : 3;
          const slug = slugifyHeading(title) || "section";
          const nextCount = (slugCounter[slug] ?? 0) + 1;
          slugCounter[slug] = nextCount;
          const childId = `${parentId}--${slug}-${nextCount}`;

          headingNode.id = childId;
          headingNode.dataset.parentHeading = parentId;
          headingElementMap[childId] = headingNode;
          headingParentMap[childId] = key;

          return { id: childId, title, level };
        });

        parentItems.push({
          id: parentId,
          key,
          title: config.label,
          children,
        });
      });

      if (parentItems.length === 0) {
        return false;
      }

      headingElementMapRef.current = headingElementMap;
      headingParentMapRef.current = headingParentMap;
      setTocItems(parentItems);

      const firstDetailKey = detailSections[0]?.key;
      const firstDetailHeadingId = firstDetailKey
        ? `lr-doc-${firstDetailKey}`
        : "lr-doc-overview";

      setActiveHeadingId((previous) =>
        headingElementMap[previous] ? previous : firstDetailHeadingId,
      );
      setActiveSection((previous) =>
        previous && sectionRefs.current[previous]
          ? previous
          : firstDetailKey || "overview",
      );

      return true;
    };

    const frameId = window.requestAnimationFrame(() => {
      if (isCancelled) return;

      const builtOnFirstFrame = buildTocFromDom();
      if (builtOnFirstFrame || isCancelled) return;

      // Retry once on the next frame in case markdown sections mount one tick later.
      retryFrameId = window.requestAnimationFrame(() => {
        if (isCancelled) return;
        buildTocFromDom();
      });
    });

    return () => {
      isCancelled = true;
      window.cancelAnimationFrame(frameId);
      if (retryFrameId !== null) {
        window.cancelAnimationFrame(retryFrameId);
      }
    };
  }, [report, detailSections, isGenerating, isLoading]);

  useEffect(() => {
    if (tocItems.length === 0) return;

    const visibleHeadings = new Map<string, { ratio: number; top: number }>();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const heading = entry.target as HTMLElement;
          const id = heading.id;
          if (!id) return;

          if (entry.isIntersecting) {
            visibleHeadings.set(id, {
              ratio: entry.intersectionRatio,
              top: entry.boundingClientRect.top,
            });
          } else {
            visibleHeadings.delete(id);
          }
        });

        if (visibleHeadings.size === 0) return;

        const sorted = Array.from(visibleHeadings.entries()).sort((a, b) => {
          const scoreA = Math.abs(a[1].top - 100) - a[1].ratio * 35;
          const scoreB = Math.abs(b[1].top - 100) - b[1].ratio * 35;
          return scoreA - scoreB;
        });

        const nextHeadingId = sorted[0]?.[0];
        if (!nextHeadingId) return;

        setActiveHeadingId((prev) =>
          prev === nextHeadingId ? prev : nextHeadingId,
        );

        const parentKey = headingParentMapRef.current[nextHeadingId];
        if (parentKey) {
          setActiveSection((prev) => (prev === parentKey ? prev : parentKey));
        }
      },
      {
        root: null,
        threshold: [0.1, 0.25, 0.4, 0.6],
        rootMargin: "-100px 0px -70% 0px",
      },
    );

    Object.values(headingElementMapRef.current).forEach((element) => {
      observer.observe(element);
    });

    return () => observer.disconnect();
  }, [tocItems]);

  const renderOverviewContent = () => {
    if (!report) return null;
    const progressValue = report.overallProgress ?? 0;
    const studyHours = report.metrics?.totalStudyHours ?? 0;
    const streakValue = report.metrics?.currentStreak ?? 0;
    const completedTasks = report.metrics?.totalTasksCompleted ?? 0;

    const renderEmptyStat = (unit = "") => (
      <div className="lr-page__stat-empty">
        <span className="lr-page__stat-empty-value">
          -{unit ? ` ${unit}` : ""}
        </span>
        <span className="lr-page__stat-empty-text">
          Chưa có dữ liệu, bắt đầu học ngay nhé!
        </span>
      </div>
    );

    return (
      <div className="lr-page__overview-content">
          <div className="lr-page__stats-grid">
            <motion.div className="lr-page__stat-card lr-page__stat-card--primary" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <div className="lr-page__stat-icon"><BarChart2 size={24} /></div>
              <div className="lr-page__stat-details">
                {progressValue > 0 ? (
                  <span className="lr-page__stat-value">{progressValue}%</span>
                ) : (
                  renderEmptyStat("%")
                )}
                <span className="lr-page__stat-label">Tiến độ tổng thể</span>
              </div>
              <div className="lr-page__stat-progress">
                <div className="lr-page__stat-progress-bar" style={{ width: `${progressValue}%` }} />
              </div>
            </motion.div>
            <motion.div className="lr-page__stat-card" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
              <div className="lr-page__stat-icon lr-page__stat-icon--time"><Clock size={24} /></div>
              <div className="lr-page__stat-details">
                {studyHours > 0 ? (
                  <span className="lr-page__stat-value">{getTotalStudyHours()}</span>
                ) : (
                  renderEmptyStat("h")
                )}
                <span className="lr-page__stat-label">Giờ học tổng</span>
              </div>
            </motion.div>
            <motion.div className="lr-page__stat-card" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
              <div className="lr-page__stat-icon lr-page__stat-icon--streak"><Flame size={24} /></div>
              <div className="lr-page__stat-details">
                {streakValue > 0 ? (
                  <span className="lr-page__stat-value">{getStreakDisplay().emoji} {getStreakDisplay().value}</span>
                ) : (
                  renderEmptyStat("")
                )}
                <span className="lr-page__stat-label">{getStreakDisplay().description}</span>
              </div>
            </motion.div>
            <motion.div className="lr-page__stat-card" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
              <div className="lr-page__stat-icon lr-page__stat-icon--tasks"><CheckCircle2 size={24} /></div>
              <div className="lr-page__stat-details">
                {completedTasks > 0 ? (
                  <span className="lr-page__stat-value">{completedTasks}</span>
                ) : (
                  renderEmptyStat("")
                )}
                <span className="lr-page__stat-label">Tasks hoàn thành</span>
              </div>
            </motion.div>
          </div>

          <motion.div className={`lr-page__trend-banner lr-page__trend-banner--${report.learningTrend}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
             {report.learningTrend === "improving" && <><Trophy size={20} /><span>Xu hướng: <strong>Đang tiến bộ tuyệt vời!</strong></span></>}
             {report.learningTrend === "stable" && <><TrendingUp size={20} /><span>Xu hướng: <strong>Ổn định và đều đặn</strong></span></>}
             {report.learningTrend === "declining" && <><AlertCircle size={20} /><span>Xu hướng: <strong>Cần tập trung hơn</strong></span></>}
          </motion.div>

          <div className="lr-page__cards-row">
            {report.recommendedFocus && (
              <motion.div className="lr-page__focus-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="lr-page__focus-header"><Target size={20} /><span>Đề xuất tập trung</span></div>
                <p className="lr-page__focus-text">{report.recommendedFocus}</p>
              </motion.div>
            )}
            <motion.div className="lr-page__summary-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div className="lr-page__summary-header"><GraduationCap size={20} /><span>Tóm tắt nhanh</span></div>
              <div className="lr-page__summary-content">
                <p>Báo cáo tạo vào <strong>{learningReportService.formatReportDate(report.generatedAt)}</strong>. Bạn đã dành <strong>{report.metrics?.totalStudyHours ?? 0} giờ</strong> học tập và hoàn thành <strong>{report.metrics?.totalTasksCompleted ?? 0} công việc</strong>.</p>
              </div>
              {!isReportFromToday && (
                <div className="lr-page__summary-actions">
                  <button
                    className="lr-page__action-btn lr-page__action-btn--pdf"
                    onClick={handleDownloadPDF}
                    disabled={isDownloadingPDF}
                  >
                    <Download size={16} className={isDownloadingPDF ? "spinning" : ""} />
                    <span>{isDownloadingPDF ? "ĐANG TẢI..." : "TẢI PDF"}</span>
                  </button>
                  <button
                    className="lr-page__action-btn lr-page__action-btn--new"
                    onClick={handleGenerateQuickReport}
                    disabled={!canGenerate?.canGenerate}
                  >
                    <RefreshCw size={16} />
                    <span>TẠO BÁO CÁO MỚI</span>
                  </button>
                </div>
              )}
            </motion.div>
          </div>
      </div>
    );
  };

  const renderSectionBody = (sectionKey: string) => {
    if (sectionKey === "overview") {
      return renderOverviewContent();
    }

    if (!report) return null;
    const content = report.sections?.[sectionKey as keyof typeof report.sections];
    if (!content) {
      return (
        <div className="lr-page__empty-section">
          <FileText size={48} />
          <p>Không có dữ liệu cho phần này</p>
        </div>
      );
    }

    return <SectionContent content={content} />;
  };

  return (
    <div className="lr-page">
      <div className="lr-page__container">
        {/* Header - Alien HUD Style */}
        <header className="lr-page__header">
          <div className="lr-page__header-left">
            <button className="lr-page__back-btn" onClick={() => navigate("/dashboard")}>
              <ArrowLeft size={20} />
            </button>
            <div className="lr-page__meowl-avatar">
              <img src="/images/meowl_bg_clear.png" alt="Meowl" />
              <div className="lr-page__meowl-status" />
            </div>
            <div className="lr-page__header-title">
              <h1>MEOWL LEARNING REPORT</h1>
              <p>{meowlSpeech}</p>
            </div>
          </div>
          <div className="lr-page__header-actions">
            <button className="lr-page__close-btn" onClick={() => navigate("/dashboard")}>
              <X size={24} />
            </button>
          </div>
        </header>

        {/* Main Interface */}
        <main className="lr-page__main">
          {isLoading ? (
            <div className="lr-page__loading-state">
              <MeowlKuruLoader size="large" text="Đang đồng bộ dữ liệu hệ thống..." fullScreen={false} />
            </div>
          ) : isGenerating ? (
            <div className="lr-page__generating-state">
              <div className="lr-page__loader-center">
                <MeowlKuruLoader size="large" text="Đang xử lý dữ liệu..." />

                <div className="lr-page__generating-steps">
                  <div className={`lr-page__step ${generatingStep >= 0 ? "lr-page__step--done" : ""}`}>
                    <CheckCircle2 size={16} />
                    <span>Thu thập dữ liệu</span>
                  </div>
                  <div className="lr-page__step-connector" />
                  <div
                    className={`lr-page__step ${generatingStep >= 1 ? "lr-page__step--done" : ""} ${generatingStep === 1 ? "lr-page__step--active" : ""}`}
                  >
                    {generatingStep === 1 ? (
                      <RefreshCw size={16} className="spinning" />
                    ) : (
                      <Brain size={16} />
                    )}
                    <span>Phân tích AI</span>
                  </div>
                  <div className="lr-page__step-connector" />
                  <div
                    className={`lr-page__step ${generatingStep >= 2 ? "lr-page__step--done" : ""} ${generatingStep === 2 ? "lr-page__step--active" : ""}`}
                  >
                    {generatingStep === 2 ? (
                      <RefreshCw size={16} className="spinning" />
                    ) : (
                      <FileText size={16} />
                    )}
                    <span>Tạo báo cáo</span>
                  </div>
                  <div className="lr-page__step-connector" />
                  <div
                    className={`lr-page__step ${generatingStep >= 3 ? "lr-page__step--done" : ""} ${generatingStep === 3 ? "lr-page__step--active" : ""}`}
                  >
                    {generatingStep === 3 ? (
                      <RefreshCw size={16} className="spinning" />
                    ) : (
                      <Sparkles size={16} />
                    )}
                    <span>Hoàn thiện</span>
                  </div>
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="lr-page__error-state">
              <AlertCircle size={64} color="#f87171" />
              <h3>TRỤC TRẶC HỆ THỐNG</h3>
              <button onClick={loadInitialData} className="lr-page__retry-btn">
                <RefreshCw size={18} /> THỬ LẠI
              </button>
            </div>
          ) : !report ? (
             <div className="lr-page__no-report-state">
               <div className="lr-page__setup-container">
                 <div className="lr-page__setup-icon"><Sparkles size={48} /></div>
                 <h3>TẠO PHÂN TÍCH MỚI</h3>
                 <p>Hệ thống AI Meowl đã sẵn sàng tổng hợp quá trình phát triển của bạn.</p>
                 
                 <div className="lr-page__setup-options">
                    <div className="lr-page__option-field">
                      <label>CẤU HÌNH PHẠM VI:</label>
                      <select value={selectedReportType} onChange={(e) => setSelectedReportType(e.target.value as ReportType)}>
                        <option value="COMPREHENSIVE">Báo cáo toàn diện</option>
                        <option value="WEEKLY_SUMMARY">Tổng kết tuần</option>
                        <option value="MONTHLY_SUMMARY">Tổng kết tháng</option>
                        <option value="SKILL_ASSESSMENT">Đánh giá kỹ năng</option>
                      </select>
                    </div>
                    <button className="lr-page__generate-btn-main" onClick={handleGenerateReport} disabled={!canGenerate?.canGenerate}>
                      <Zap size={20} /> KÍCH HOẠT PHÂN TÍCH
                    </button>
                    {!canGenerate?.canGenerate && (
                      <div className="lr-page__cooldown-msg">
                        <Clock size={14} /> <span>Hệ thống cần thời gian hồi phục.</span>
                      </div>
                    )}
                 </div>
               </div>
             </div>
          ) : (
            <>
              <section className="lr-page__overview-block">
                <header className="lr-page__content-section-header">
                  <div className="lr-page__content-section-title">
                    <BarChart2 size={18} />
                    <h2 className="lr-page__doc-h2">Tổng quan</h2>
                  </div>
                </header>
                <div className="lr-page__content-section-body">
                  {renderOverviewContent()}
                </div>
              </section>

              <div className="lr-page__report-layout">
                <aside className="lr-page__sidebar">
                  <nav className="lr-page__nav lr-page__toc" aria-label="Mục lục báo cáo">
                    {tocItems.map((parent) => {
                      const config = SECTION_CONFIG.find((section) => section.key === parent.key);
                      const IconComponent = config?.icon || FileText;
                      const isParentActive = activeSection === parent.key;
                      const isExpanded = isParentActive;

                      return (
                        <div key={parent.id} className="lr-page__toc-group">
                          <button
                            className={`lr-page__nav-item ${isParentActive ? "active" : ""}`}
                            onClick={() => handleSidebarSectionClick(parent.id)}
                          >
                            <IconComponent size={18} />
                            <span>{parent.title.toUpperCase()}</span>
                            <div className="lr-page__nav-indicator" />
                          </button>

                          <div className={`lr-page__toc-children ${isExpanded ? "lr-page__toc-children--open" : ""}`}>
                            {parent.children.map((child) => (
                              <button
                                key={child.id}
                                className={`lr-page__toc-child lr-page__toc-child--l${child.level} ${activeHeadingId === child.id ? "active" : ""}`}
                                onClick={() => handleSidebarSectionClick(child.id)}
                              >
                                <span>{child.title}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </nav>
                </aside>

                <section className="lr-page__content-view">
                  <div className="lr-page__content-scrollable">
                    {detailSections.map(({ key }) => {
                      const config = SECTION_CONFIG.find((section) => section.key === key);
                      if (!config) return null;
                      const IconComponent = config.icon;

                      return (
                        <section
                          key={key}
                          id={`lr-section-${key}`}
                          ref={setSectionRef(key)}
                          className="lr-page__content-section"
                        >
                          <header className="lr-page__content-section-header">
                            <div className="lr-page__content-section-title">
                              <IconComponent size={18} />
                              <h2 className="lr-page__doc-h2">{config.label}</h2>
                            </div>
                          </header>
                          <div className="lr-page__content-section-body">
                            {renderSectionBody(key)}
                          </div>
                        </section>
                      );
                    })}

                    <section className="lr-page__content-footer">
                      <div className="lr-page__content-footer-meta">
                        <span>Thời gian khởi tạo:</span>
                        <strong>{learningReportService.formatReportDate(report.generatedAt)}</strong>
                      </div>
                      <div className="lr-page__content-footer-actions">
                        <button className="lr-page__action-btn lr-page__action-btn--pdf" onClick={handleDownloadPDF} disabled={isDownloadingPDF}>
                          <Download size={18} className={isDownloadingPDF ? "spinning" : ""} />
                          <span>{isDownloadingPDF ? "ĐANG TẢI..." : "TẢI PDF"}</span>
                        </button>
                        <button className="lr-page__action-btn lr-page__action-btn--new" onClick={handleGenerateQuickReport} disabled={!canGenerate?.canGenerate}>
                          <RefreshCw size={18} />
                          <span>TẠO BÁO CÁO MỚI</span>
                        </button>
                      </div>
                    </section>
                  </div>
                </section>
              </div>
            </>
          )}
        </main>
      </div>
      
      {/* Background Decor */}
      <div className="lr-page__bg-overlay" />
      <div className="lr-page__scanline" />
    </div>
  );
};

export default LearningReportPage;
