import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Clock,
  TrendingUp,
  ChevronRight,
  Calendar,
  Sparkles,
  Eye,
  BarChart2,
  AlertCircle,
  Download,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import learningReportService, {
  StudentLearningReportResponse,
  isValidReportId,
} from "../../services/learningReportService";
import { useAuth } from "../../context/AuthContext";
import { downloadLearningReportPDF } from "./PDFGenerator";
import "./LearningReportHistory.css";

interface LearningReportHistoryProps {
  maxItems?: number;
  showGenerateButton?: boolean;
  title?: string;
}

const REPORTS_PER_PAGE = 3;

const LearningReportHistory: React.FC<LearningReportHistoryProps> = ({
  maxItems = 5,
  showGenerateButton = true,
  title = "Báo cáo học tập",
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState<StudentLearningReportResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [canGenerate, setCanGenerate] = useState(true);
  const [cooldownMinutes, setCooldownMinutes] = useState(0);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Using imported validation helper from learningReportService

  const loadHistoryPages = async () => {
    const limit = Math.max(maxItems, REPORTS_PER_PAGE);
    const firstBatch = await learningReportService.getReportHistory(0, limit);

    // Fast path: backend already respected requested size or no more data.
    if (firstBatch.length === 0 || firstBatch.length >= limit || firstBatch.length < REPORTS_PER_PAGE) {
      return firstBatch.slice(0, limit);
    }

    // Fallback: some environments cap page size server-side, so pull next pages explicitly.
    const merged = [...firstBatch];
    const seenKeys = new Set(
      firstBatch.map((report) => `${report.reportId ?? "na"}-${report.generatedAt ?? ""}`),
    );
    const maxExtraPages = Math.max(1, Math.ceil((limit - firstBatch.length) / REPORTS_PER_PAGE) + 2);

    for (let page = 1; page <= maxExtraPages && merged.length < limit; page += 1) {
      const pageBatch = await learningReportService.getReportHistory(page, REPORTS_PER_PAGE);
      if (pageBatch.length === 0) {
        break;
      }

      let addedCount = 0;
      for (const report of pageBatch) {
        const key = `${report.reportId ?? "na"}-${report.generatedAt ?? ""}`;
        if (seenKeys.has(key)) {
          continue;
        }

        seenKeys.add(key);
        merged.push(report);
        addedCount += 1;

        if (merged.length >= limit) {
          break;
        }
      }

      // Stop if backend starts returning duplicate pages or short last page.
      if (addedCount === 0 || pageBatch.length < REPORTS_PER_PAGE) {
        break;
      }
    }

    return merged.slice(0, limit);
  };

  const loadReports = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [history, canGen] = await Promise.all([
        loadHistoryPages(),
        learningReportService.canGenerateReport(),
      ]);
      // Filter out any reports with invalid IDs
      const validReports = history.filter((r) => isValidReportId(r.reportId));
      setReports(validReports);
      setCanGenerate(canGen.canGenerate);
      setCooldownMinutes(canGen.remainingCooldownMinutes ?? 0);
    } catch (error) {
      console.error("Error loading reports:", error);
      setLoadError("Không thể tải danh sách báo cáo. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleViewReport = async (reportId: number | undefined) => {
    if (!isValidReportId(reportId)) {
      setLoadError("ID báo cáo không hợp lệ.");
      return;
    }
    navigate(`/learning-report?id=${reportId}`);
  };

  const handleDownloadPDF = async (
    report: StudentLearningReportResponse,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation(); // Prevent opening modal

    if (!isValidReportId(report.reportId)) {
      console.error("Invalid reportId for PDF download:", report.reportId);
      return;
    }

    setDownloadingId(report.reportId);
    try {
      // Prefer avatarMediaUrl over avatarUrl
      const avatarUrl = user?.avatarMediaUrl || user?.avatarUrl;
      await downloadLearningReportPDF(report, {
        filename: learningReportService.formatReportFileName(report),
        userAvatar: avatarUrl,
      });
    } catch (error) {
      console.error("Error downloading PDF:", error);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleGenerateNew = () => {
    navigate("/learning-report");
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "improving":
        return "var(--color-success, #22c55e)";
      case "stable":
        return "var(--color-warning, #fbbf24)";
      case "declining":
        return "var(--color-error, #ef4444)";
      default:
        return "var(--color-text-secondary, #9ca3af)";
    }
  };

  const getReportTypeBadge = (type: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      COMPREHENSIVE: { label: "Toàn diện", color: "#8b5cf6" },
      WEEKLY_SUMMARY: { label: "Tuần", color: "#3b82f6" },
      MONTHLY_SUMMARY: { label: "Tháng", color: "#10b981" },
      SKILL_ASSESSMENT: { label: "Kỹ năng", color: "#f59e0b" },
      GOAL_TRACKING: { label: "Mục tiêu", color: "#ec4899" },
    };
    return badges[type] || { label: type, color: "#6b7280" };
  };

  const sortedReports = useMemo(
    () =>
      [...reports].sort((a, b) => {
        const aGeneratedAt = Date.parse(a.generatedAt || "");
        const bGeneratedAt = Date.parse(b.generatedAt || "");

        if (
          !Number.isNaN(aGeneratedAt) &&
          !Number.isNaN(bGeneratedAt) &&
          aGeneratedAt !== bGeneratedAt
        ) {
          return bGeneratedAt - aGeneratedAt;
        }

        if (!Number.isNaN(aGeneratedAt) && Number.isNaN(bGeneratedAt)) {
          return -1;
        }

        if (Number.isNaN(aGeneratedAt) && !Number.isNaN(bGeneratedAt)) {
          return 1;
        }

        return (b.reportId ?? 0) - (a.reportId ?? 0);
      }),
    [reports],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [reports.length]);

  const totalPages = Math.max(
    1,
    Math.ceil(sortedReports.length / REPORTS_PER_PAGE),
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedReports = useMemo(() => {
    const start = (currentPage - 1) * REPORTS_PER_PAGE;
    return sortedReports.slice(start, start + REPORTS_PER_PAGE);
  }, [currentPage, sortedReports]);

  const showingStart =
    sortedReports.length === 0
      ? 0
      : (currentPage - 1) * REPORTS_PER_PAGE + 1;
  const showingEnd =
    sortedReports.length === 0
      ? 0
      : Math.min(currentPage * REPORTS_PER_PAGE, sortedReports.length);

  const latestPreviewReport = sortedReports[0];

  return (
    <>
      <motion.div
        className="lr-history__container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Section Header */}
        <div className="lr-history__header">
          <div className="lr-history__header-title">
            <div className="lr-history__title-icon">
              <BarChart2 size={20} />
            </div>
            <h3>{title}</h3>
            <span className="lr-history__report-count">
              {sortedReports.length} BÁO CÁO
            </span>
          </div>

          {showGenerateButton && (
            <button
              className="lr-history__generate-btn"
              onClick={handleGenerateNew}
              disabled={!canGenerate}
              title={!canGenerate && cooldownMinutes > 0 ? `Cooldown: ${learningReportService.getTimeUntilNextReport(cooldownMinutes)}` : undefined}
            >
              <Sparkles size={16} />
              <span>
                {canGenerate ? "Tạo mới" : `Đợi ${learningReportService.getTimeUntilNextReport(cooldownMinutes)}`}
              </span>
            </button>
          )}
        </div>

        <div className="lr-history__summary">
          {sortedReports.length === 0
            ? "Chưa có báo cáo nào."
            : `Hiển thị ${showingStart}-${showingEnd} / ${sortedReports.length} (sắp xếp theo ngày tạo mới nhất)`}
        </div>

        {/* Reports List */}
        <div className="lr-history__list">
          {isLoading ? (
            <div className="lr-history__loading-skeleton">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="lr-history__skeleton-item">
                  <div className="lr-history__skeleton-icon" />
                  <div className="lr-history__skeleton-content">
                    <div className="lr-history__skeleton-title" />
                    <div className="lr-history__skeleton-meta" />
                  </div>
                </div>
              ))}
            </div>
          ) : reports.length === 0 ? (
            <div className="lr-history__empty-state">
              <FileText size={40} />
              <p>Chưa có báo cáo nào</p>
              <button
                className="lr-history__create-first-btn"
                onClick={handleGenerateNew}
              >
                Tạo báo cáo đầu tiên
              </button>
            </div>
          ) : (
            <>
              {paginatedReports.map((report, index) => {
                const typeBadge = getReportTypeBadge(report.reportType);

                return (
                  <motion.div
                    key={report.reportId}
                    className="lr-history__item"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => handleViewReport(report.reportId)}
                  >
                    <div className="lr-history__item-icon">
                      <FileText size={20} />
                    </div>

                    <div className="lr-history__item-info">
                      <div className="lr-history__item-title-row">
                        <span className="lr-history__item-title">
                          {report.reportName ||
                            learningReportService.formatReportTitle(report.generatedAt)}
                        </span>
                        <span
                          className="lr-history__type-badge"
                          style={{
                            backgroundColor: `${typeBadge.color}20`,
                            color: typeBadge.color,
                          }}
                        >
                          {typeBadge.label}
                        </span>
                      </div>

                      <div className="lr-history__item-meta">
                        <span className="lr-history__meta-item">
                          <Calendar size={12} />
                          {learningReportService.formatReportDate(
                            report.generatedAt,
                          )}
                        </span>
                        <span className="lr-history__meta-item">
                          <BarChart2 size={12} />
                          {report.overallProgress ?? 0}%
                        </span>
                        <span
                          className="lr-history__meta-item lr-history__meta-item--trend"
                          style={{ color: getTrendColor(report.learningTrend) }}
                        >
                          <TrendingUp size={12} />
                          {report.learningTrend === "improving" && "Tiến bộ"}
                          {report.learningTrend === "stable" && "Ổn định"}
                          {report.learningTrend === "declining" &&
                            "Cần cải thiện"}
                        </span>
                      </div>
                    </div>

                    <div className="lr-history__item-actions">
                      <button
                        className="lr-history__action-btn lr-history__action-btn--download"
                        onClick={(e) => handleDownloadPDF(report, e)}
                        disabled={downloadingId === report.reportId}
                        title="Tải PDF"
                      >
                        <Download
                          size={14}
                          className={
                            downloadingId === report.reportId
                              ? "lr-history__spinning"
                              : ""
                          }
                        />
                      </button>
                      <button
                        className="lr-history__action-btn"
                        title="Xem báo cáo"
                      >
                        <Eye size={16} />
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}

              {sortedReports.length > 0 && (
                <div className="lr-history__pagination">
                  <button
                    type="button"
                    className="lr-history__pagination-btn"
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                  >
                    Trang trước
                  </button>
                  <span className="lr-history__pagination-indicator">
                    Trang {currentPage}/{totalPages}
                  </span>
                  <button
                    type="button"
                    className="lr-history__pagination-btn"
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                  >
                    Trang sau
                  </button>
                </div>
              )}

              {reports.length > REPORTS_PER_PAGE && (
                <button
                  className="lr-history__view-all-btn"
                  onClick={handleGenerateNew}
                >
                  <span>Xem tất cả báo cáo</span>
                  <ChevronRight size={16} />
                </button>
              )}
            </>
          )}
        </div>

        {/* Error Message */}
        {loadError && (
          <div className="lr-history__error-message">
            <AlertCircle size={16} />
            <span>{loadError}</span>
          </div>
        )}

        {/* Quick Stats Preview */}
        {latestPreviewReport && latestPreviewReport.metrics && (
          <div className="lr-history__quick-preview">
            <div className="lr-history__preview-title">
              <Clock size={14} />
              <span>Báo cáo gần nhất</span>
            </div>
            <div className="lr-history__preview-stats">
              <div className="lr-history__preview-stat">
                <span className="lr-history__preview-stat-value">
                  {latestPreviewReport.metrics.totalStudyHours ?? 0}h
                </span>
                <span className="lr-history__preview-stat-label">Giờ học</span>
              </div>
              <div className="lr-history__preview-stat">
                <span className="lr-history__preview-stat-value">
                  {latestPreviewReport.metrics.currentStreak ?? 0}
                </span>
                <span className="lr-history__preview-stat-label">Streak</span>
              </div>
              <div className="lr-history__preview-stat">
                <span className="lr-history__preview-stat-value">
                  {latestPreviewReport.metrics.totalTasksCompleted ?? 0}
                </span>
                <span className="lr-history__preview-stat-label">Tasks</span>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </>
  );
};

export default LearningReportHistory;
