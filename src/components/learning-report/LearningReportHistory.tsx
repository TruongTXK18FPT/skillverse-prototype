import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import learningReportService, {
  StudentLearningReportResponse,
} from "../../services/learningReportService";
import LearningReportModal from "./LearningReportModal";
import "./LearningReportHistory.css";

interface LearningReportHistoryProps {
  maxItems?: number;
  showGenerateButton?: boolean;
  title?: string;
}

const LearningReportHistory: React.FC<LearningReportHistoryProps> = ({
  maxItems = 5,
  showGenerateButton = true,
  title = "Báo cáo học tập",
}) => {
  const [reports, setReports] = useState<StudentLearningReportResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] =
    useState<StudentLearningReportResponse | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [canGenerate, setCanGenerate] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const [history, canGen] = await Promise.all([
        learningReportService.getReportHistory(0, maxItems),
        learningReportService.canGenerateReport(),
      ]);
      setReports(history);
      setCanGenerate(canGen.canGenerate);
    } catch (error) {
      console.error("Error loading reports:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewReport = async (reportId: number) => {
    try {
      const report = await learningReportService.getReportById(reportId);
      setSelectedReport(report);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error loading report:", error);
    }
  };

  const handleGenerateNew = () => {
    setSelectedReport(null);
    setIsModalOpen(true);
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
              {reports.length} báo cáo
            </span>
          </div>

          {showGenerateButton && (
            <button
              className="lr-history__generate-btn"
              onClick={handleGenerateNew}
              disabled={!canGenerate}
            >
              <Sparkles size={16} />
              <span>Tạo mới</span>
            </button>
          )}
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
                <Sparkles size={16} />
                Tạo báo cáo đầu tiên
              </button>
            </div>
          ) : (
            <>
              {reports.map((report, index) => {
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
                          Báo cáo #{report.reportId}
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
                          {report.overallProgress}%
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

                    <div className="lr-history__item-action">
                      <Eye size={16} />
                      <ChevronRight size={16} />
                    </div>
                  </motion.div>
                );
              })}

              {reports.length >= maxItems && (
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

        {/* Quick Stats Preview */}
        {reports.length > 0 && reports[0] && reports[0].metrics && (
          <div className="lr-history__quick-preview">
            <div className="lr-history__preview-title">
              <Clock size={14} />
              <span>Báo cáo gần nhất</span>
            </div>
            <div className="lr-history__preview-stats">
              <div className="lr-history__preview-stat">
                <span className="lr-history__preview-stat-value">
                  {reports[0].metrics.totalStudyHours ?? 0}h
                </span>
                <span className="lr-history__preview-stat-label">Giờ học</span>
              </div>
              <div className="lr-history__preview-stat">
                <span className="lr-history__preview-stat-value">
                  {reports[0].metrics.currentStreak ?? 0}
                </span>
                <span className="lr-history__preview-stat-label">Streak</span>
              </div>
              <div className="lr-history__preview-stat">
                <span className="lr-history__preview-stat-value">
                  {reports[0].metrics.totalTasksCompleted ?? 0}
                </span>
                <span className="lr-history__preview-stat-label">Tasks</span>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Report Modal */}
      <LearningReportModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedReport(null);
          loadReports();
        }}
        initialReport={selectedReport}
      />
    </>
  );
};

export default LearningReportHistory;
