import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Calendar,
  BarChart2,
  Lightbulb,
  Trophy,
  Flame,
  Star,
  ChevronRight,
  GraduationCap,
  Download,
} from "lucide-react";
import learningReportService, {
  StudentLearningReportResponse,
  ReportType,
  CanGenerateResponse,
  isValidReportId,
  parseReportId,
} from "../../services/learningReportService";
import MeowlKuruLoader from "../kuru-loader/MeowlKuruLoader";
import MarkdownRenderer from "./MarkdownRenderer";
import { downloadLearningReportPDF } from "./PDFGenerator";
import "./LearningReportModal.css";
import "./MarkdownRenderer.css";

interface LearningReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  meowlSkin?: boolean;
  initialReport?: StudentLearningReportResponse | null;
  initialReportId?: number | null;
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

const LearningReportModal: React.FC<LearningReportModalProps> = ({
  isOpen,
  onClose,
  meowlSkin: _meowlSkin = true,
  initialReport = null,
  initialReportId = null,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [report, setReport] = useState<StudentLearningReportResponse | null>(
    null,
  );
  const [canGenerate, setCanGenerate] = useState<CanGenerateResponse | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState("overview");
  const [selectedReportType, setSelectedReportType] =
    useState<ReportType>("COMPREHENSIVE");
  const [meowlSpeech, setMeowlSpeech] = useState("");
  const [generatingStep, setGeneratingStep] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  // Using imported validation helpers from learningReportService

  useEffect(() => {
    if (isOpen) {
      if (initialReport) {
        // If an initial report is provided, use it directly
        setReport(initialReport);
        setIsLoading(false);
        setError(null);
        // Still load canGenerate info
        learningReportService
          .canGenerateReport()
          .then(setCanGenerate)
          .catch(console.error);
      } else if (isValidReportId(initialReportId)) {
        // Load specific report by ID with validation
        try {
          const validId = parseReportId(initialReportId);
          loadReportById(validId);
        } catch {
          // If parsing fails, fall back to latest report
          loadInitialData();
        }
      } else {
        // Otherwise load the latest report
        loadInitialData();
      }
      setActiveSection("overview");
    }
  }, [isOpen, initialReport, initialReportId]);

  // Load a specific report by ID with error handling
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
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Không thể tải báo cáo. Báo cáo có thể không tồn tại hoặc đã bị xóa.";
      setError(errorMessage);
      // Try to load latest report as fallback
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

  // Update Meowl speech based on state
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

  // Animated generating steps
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
    } catch (err: unknown) {
      console.error("Error generating report:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Không thể tạo báo cáo.";
      setError(errorMessage);
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
    } catch (err: unknown) {
      console.error("Error generating quick report:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Không thể tạo báo cáo.";
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle PDF download
  const handleDownloadPDF = async () => {
    if (!report) return;

    setIsDownloadingPDF(true);
    try {
      await downloadLearningReportPDF(report, {
        filename: `learning-report-${report.reportId}-${new Date().toISOString().split("T")[0]}`,
        includeHeader: true,
        includeFooter: true,
        includePageNumbers: true,
        quality: "high",
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

  // Format study hours from minutes
  const formatStudyHours = (totalMinutes: number | undefined): string => {
    if (!totalMinutes) return "0h";
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
  };

  // Calculate total study hours from metrics
  const getTotalStudyHours = (): string => {
    if (!report?.metrics) return "0h";
    const totalHours = report.metrics.totalStudyHours || 0;
    return `${totalHours}h`;
  };

  // Get streak display with fire emoji intensity
  const getStreakDisplay = (): {
    value: number;
    emoji: string;
    description: string;
  } => {
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

  const getSectionTitle = (key: string): string => {
    const titles: Record<string, string> = {
      overview: "📊 Tổng quan báo cáo",
      currentSkills: "🎯 Kỹ năng hiện tại",
      learningGoals: "🏆 Mục tiêu học tập",
      progress: "📈 Tiến độ học tập",
      strengths: "💪 Điểm mạnh",
      areasToImprove: "🔧 Cần cải thiện",
      recommendations: "💡 Đề xuất học tập",
      skillGaps: "📚 Khoảng trống kỹ năng",
      nextSteps: "🚀 Bước tiếp theo",
      motivation: "✨ Động lực & Khuyến khích",
    };
    return titles[key] || key;
  };

  // Get available sections from report
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

  const renderSectionContent = () => {
    if (!report) return null;

    if (activeSection === "overview") {
      return (
        <div className="lr-modal__overview-content">
          {/* Stats Grid */}
          <div className="lr-modal__stats-grid">
            <motion.div
              className="lr-modal__stat-card lr-modal__stat-card--primary"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <div className="lr-modal__stat-icon">
                <BarChart2 size={24} />
              </div>
              <div className="lr-modal__stat-details">
                <span className="lr-modal__stat-value">
                  {report.overallProgress}%
                </span>
                <span className="lr-modal__stat-label">Tiến độ tổng thể</span>
              </div>
              <div className="lr-modal__stat-progress">
                <div
                  className="lr-modal__stat-progress-bar"
                  style={{ width: `${report.overallProgress}%` }}
                />
              </div>
            </motion.div>

            <motion.div
              className="lr-modal__stat-card"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 }}
            >
              <div className="lr-modal__stat-icon lr-modal__stat-icon--time">
                <Clock size={24} />
              </div>
              <div className="lr-modal__stat-details">
                <span className="lr-modal__stat-value">
                  {getTotalStudyHours()}
                </span>
                <span className="lr-modal__stat-label">Giờ học tổng</span>
              </div>
            </motion.div>

            <motion.div
              className="lr-modal__stat-card"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="lr-modal__stat-icon lr-modal__stat-icon--streak">
                <Flame size={24} />
              </div>
              <div className="lr-modal__stat-details">
                <span className="lr-modal__stat-value">
                  {getStreakDisplay().emoji} {getStreakDisplay().value}
                </span>
                <span className="lr-modal__stat-label">
                  {getStreakDisplay().description}
                </span>
              </div>
            </motion.div>

            <motion.div
              className="lr-modal__stat-card"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25 }}
            >
              <div className="lr-modal__stat-icon lr-modal__stat-icon--tasks">
                <CheckCircle2 size={24} />
              </div>
              <div className="lr-modal__stat-details">
                <span className="lr-modal__stat-value">
                  {report.metrics?.totalTasksCompleted ?? 0}
                </span>
                <span className="lr-modal__stat-label">Tasks hoàn thành</span>
              </div>
            </motion.div>
          </div>

          {/* Additional Stats Row */}
          <div className="lr-modal__stats-row">
            <motion.div
              className="lr-modal__mini-stat"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <span className="lr-modal__mini-stat-label">Phiên học TB:</span>
              <span className="lr-modal__mini-stat-value">
                {formatStudyHours(report.metrics?.averageSessionDuration)}
              </span>
            </motion.div>
            <motion.div
              className="lr-modal__mini-stat"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 }}
            >
              <span className="lr-modal__mini-stat-label">Tổng phiên:</span>
              <span className="lr-modal__mini-stat-value">
                {report.metrics?.totalStudySessions ?? 0}
              </span>
            </motion.div>
            <motion.div
              className="lr-modal__mini-stat"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <span className="lr-modal__mini-stat-label">
                Streak dài nhất:
              </span>
              <span className="lr-modal__mini-stat-value">
                {report.metrics?.longestStreak ?? 0} ngày
              </span>
            </motion.div>
          </div>

          {/* Trend Badge */}
          <motion.div
            className={`lr-modal__trend-banner lr-modal__trend-banner--${report.learningTrend}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {report.learningTrend === "improving" && (
              <>
                <Trophy size={20} />
                <span>
                  Xu hướng: <strong>Đang tiến bộ tuyệt vời!</strong>
                </span>
              </>
            )}
            {report.learningTrend === "stable" && (
              <>
                <TrendingUp size={20} />
                <span>
                  Xu hướng: <strong>Ổn định và đều đặn</strong>
                </span>
              </>
            )}
            {report.learningTrend === "declining" && (
              <>
                <AlertCircle size={20} />
                <span>
                  Xu hướng: <strong>Cần tập trung hơn</strong>
                </span>
              </>
            )}
          </motion.div>

          {/* Recommended Focus */}
          {report.recommendedFocus && (
            <motion.div
              className="lr-modal__focus-card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <div className="lr-modal__focus-header">
                <Target size={20} />
                <span>Đề xuất tập trung</span>
              </div>
              <p className="lr-modal__focus-text">{report.recommendedFocus}</p>
            </motion.div>
          )}

          {/* Quick Summary */}
          <motion.div
            className="lr-modal__summary-card"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="lr-modal__summary-header">
              <GraduationCap size={20} />
              <span>Tóm tắt nhanh</span>
            </div>
            <div className="lr-modal__summary-content">
              <p>
                Báo cáo được tạo vào{" "}
                <strong>
                  {learningReportService.formatReportDate(report.generatedAt)}
                </strong>
                . Bạn đã dành{" "}
                <strong>{report.metrics?.totalStudyHours ?? 0} giờ</strong> học
                tập và hoàn thành{" "}
                <strong>
                  {report.metrics?.totalTasksCompleted ?? 0} công việc
                </strong>
                .
                {report.metrics?.currentStreak &&
                  report.metrics.currentStreak > 0 && (
                    <>
                      {" "}
                      Chuỗi học tập hiện tại:{" "}
                      <strong>{report.metrics.currentStreak} ngày</strong>!
                    </>
                  )}
              </p>
            </div>
          </motion.div>
        </div>
      );
    }

    // Render section content with enhanced markdown
    const content =
      report.sections?.[activeSection as keyof typeof report.sections];
    if (!content) {
      return (
        <div className="lr-modal__empty-section">
          <FileText size={48} />
          <p>Không có dữ liệu cho phần này</p>
        </div>
      );
    }

    return (
      <motion.div
        className="lr-modal__section-markdown"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        key={activeSection}
      >
        <MarkdownRenderer content={content} />
      </motion.div>
    );
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="lr-modal__overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="lr-modal__container"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="lr-modal__header">
            <div className="lr-modal__header-left">
              <div className="lr-modal__header-meowl-wrapper">
                <motion.img
                  src="/images/meowl_bg_clear.png"
                  alt="Meowl"
                  className="lr-modal__header-meowl"
                  animate={{ y: [0, -4, 0] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </div>
              <div className="lr-modal__header-info">
                <h2>🐱 Meowl Learning Report</h2>
                <p>{meowlSpeech}</p>
              </div>
            </div>
            <button className="lr-modal__close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          {/* Main Content Area */}
          <div className="lr-modal__main">
            {isLoading ? (
              <div className="lr-modal__loading-state">
                <MeowlKuruLoader size="medium" text="Đang tải dữ liệu..." />
              </div>
            ) : isGenerating ? (
              <div className="lr-modal__generating-state">
                <motion.div
                  className="lr-modal__generating-meowl"
                  animate={{ rotate: [0, -5, 5, -5, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                >
                  <img
                    src="/images/meowl_bg_clear.png"
                    alt="Meowl thinking"
                    className="lr-modal__generating-meowl-img"
                  />
                </motion.div>

                <div className="lr-modal__generating-content">
                  <h3>Meowl đang tạo báo cáo...</h3>
                  <p className="lr-modal__generating-subtext">
                    Quá trình phân tích AI có thể mất 15-30 giây
                  </p>

                  {/* Progress Steps */}
                  <div className="lr-modal__progress-steps">
                    <div
                      className={`lr-modal__step ${generatingStep >= 0 ? "lr-modal__step--done" : ""}`}
                    >
                      <CheckCircle2 size={16} />
                      <span>Thu thập dữ liệu</span>
                    </div>
                    <div className="lr-modal__step-connector" />
                    <div
                      className={`lr-modal__step ${generatingStep >= 1 ? "lr-modal__step--done" : ""} ${generatingStep === 1 ? "lr-modal__step--active" : ""}`}
                    >
                      {generatingStep === 1 ? (
                        <RefreshCw size={16} className="lr-modal__spinning" />
                      ) : (
                        <Brain size={16} />
                      )}
                      <span>Phân tích AI</span>
                    </div>
                    <div className="lr-modal__step-connector" />
                    <div
                      className={`lr-modal__step ${generatingStep >= 2 ? "lr-modal__step--done" : ""} ${generatingStep === 2 ? "lr-modal__step--active" : ""}`}
                    >
                      {generatingStep === 2 ? (
                        <RefreshCw size={16} className="lr-modal__spinning" />
                      ) : (
                        <FileText size={16} />
                      )}
                      <span>Tạo báo cáo</span>
                    </div>
                    <div className="lr-modal__step-connector" />
                    <div
                      className={`lr-modal__step ${generatingStep >= 3 ? "lr-modal__step--done" : ""} ${generatingStep === 3 ? "lr-modal__step--active" : ""}`}
                    >
                      {generatingStep === 3 ? (
                        <RefreshCw size={16} className="lr-modal__spinning" />
                      ) : (
                        <Sparkles size={16} />
                      )}
                      <span>Hoàn thiện</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : error ? (
              <div className="lr-modal__error-state">
                <AlertCircle size={48} />
                <h3>Đã xảy ra lỗi</h3>
                <p>{error}</p>
                <button
                  onClick={loadInitialData}
                  className="lr-modal__retry-btn"
                >
                  <RefreshCw size={16} />
                  Thử lại
                </button>
              </div>
            ) : !report ? (
              <div className="lr-modal__no-report-state">
                <motion.div
                  className="lr-modal__no-report-meowl"
                  animate={{ y: [0, -10, 0] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <img
                    src="/images/meowl_bg_clear.png"
                    alt="Meowl"
                    className="lr-modal__no-report-img"
                  />
                </motion.div>

                <div className="lr-modal__no-report-content">
                  <h3>Chào bạn! 👋</h3>
                  <p>
                    Meowl sẵn sàng phân tích quá trình học tập của bạn và đưa ra
                    báo cáo chi tiết với AI!
                  </p>

                  {/* Report Type Selection */}
                  <div className="lr-modal__type-selector">
                    <label>Chọn loại báo cáo:</label>
                    <select
                      value={selectedReportType}
                      onChange={(e) =>
                        setSelectedReportType(e.target.value as ReportType)
                      }
                    >
                      <option value="COMPREHENSIVE">
                        📋 Báo cáo toàn diện
                      </option>
                      <option value="WEEKLY_SUMMARY">📅 Tổng kết tuần</option>
                      <option value="MONTHLY_SUMMARY">🗓️ Tổng kết tháng</option>
                      <option value="SKILL_ASSESSMENT">
                        🎯 Đánh giá kỹ năng
                      </option>
                      <option value="GOAL_TRACKING">
                        🏁 Theo dõi mục tiêu
                      </option>
                    </select>
                  </div>

                  <button
                    className="lr-modal__generate-btn"
                    onClick={handleGenerateReport}
                    disabled={!canGenerate?.canGenerate}
                  >
                    <Sparkles size={18} />
                    Tạo báo cáo với AI
                  </button>

                  {!canGenerate?.canGenerate && canGenerate?.reason && (
                    <p className="lr-modal__cooldown-notice">
                      <Clock size={14} />
                      {learningReportService.getTimeUntilNextReport(
                        canGenerate.remainingCooldownMinutes || 0,
                      )}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <>
                {/* Sidebar Navigation */}
                <div className="lr-modal__sidebar">
                  <div className="lr-modal__sidebar-header">
                    <Calendar size={16} />
                    <span>
                      {learningReportService.formatReportDate(
                        report.generatedAt,
                      )}
                    </span>
                  </div>

                  <nav className="lr-modal__nav">
                    {getAvailableSections().map(({ key }) => {
                      const config = SECTION_CONFIG.find((s) => s.key === key);
                      if (!config) return null;
                      const IconComponent = config.icon;

                      return (
                        <button
                          key={key}
                          className={`lr-modal__nav-item ${activeSection === key ? "lr-modal__nav-item--active" : ""}`}
                          onClick={() => setActiveSection(key)}
                        >
                          <IconComponent size={18} />
                          <span>{config.label}</span>
                          <ChevronRight
                            size={14}
                            className="lr-modal__nav-arrow"
                          />
                        </button>
                      );
                    })}
                  </nav>

                  {/* Generate New Button */}
                  <div className="lr-modal__sidebar-footer">
                    {/* Download PDF Button */}
                    <button
                      className="lr-modal__download-pdf-btn"
                      onClick={handleDownloadPDF}
                      disabled={isDownloadingPDF}
                    >
                      <Download
                        size={16}
                        className={isDownloadingPDF ? "lr-modal__spinning" : ""}
                      />
                      {isDownloadingPDF ? "Đang tải..." : "Tải PDF"}
                    </button>

                    <button
                      className="lr-modal__new-report-btn"
                      onClick={handleGenerateQuickReport}
                      disabled={!canGenerate?.canGenerate || isGenerating}
                    >
                      <RefreshCw
                        size={16}
                        className={isGenerating ? "lr-modal__spinning" : ""}
                      />
                      Tạo báo cáo mới
                    </button>

                    {!canGenerate?.canGenerate &&
                      canGenerate?.remainingCooldownMinutes && (
                        <p className="lr-modal__sidebar-cooldown">
                          <Clock size={12} />
                          {learningReportService.getTimeUntilNextReport(
                            canGenerate.remainingCooldownMinutes,
                          )}
                        </p>
                      )}
                  </div>
                </div>

                {/* Content Area */}
                <div className="lr-modal__content" ref={contentRef}>
                  <div className="lr-modal__content-header">
                    <h3>{getSectionTitle(activeSection)}</h3>
                  </div>

                  <div className="lr-modal__content-body">
                    {renderSectionContent()}
                  </div>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default LearningReportModal;
