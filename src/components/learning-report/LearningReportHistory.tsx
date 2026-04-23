import React, { useEffect, useState } from "react";
import {
  Calendar,
  ChevronRight,
  Cpu,
  Download,
  Eye,
  FileClock,
  Layers,
  Plus,
  TrendingUp,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import learningReportService, {
  StudentLearningReportResponse,
} from "../../services/learningReportService";
import { downloadLearningReportPDF } from "./PDFGenerator";
import "./LearningReportHistory.css";

interface LearningReportHistoryProps {
  maxItems?: number;
  showGenerateButton?: boolean;
  title?: string;
}

const NeonHistoryStat: React.FC<{
  label: string;
  value: string;
  color: string;
}> = ({ label, value, color }) => (
  <div className="neon-h-stat" style={{ borderColor: `${color}30` }}>
    <span className="neon-h-stat-label">{label}</span>
    <strong className="neon-h-stat-value" style={{ color }}>
      {value}
    </strong>
  </div>
);

const LearningReportHistory: React.FC<LearningReportHistoryProps> = ({
  maxItems = 10,
  showGenerateButton = true,
  title = "Báo cáo học tập",
}) => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<StudentLearningReportResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  useEffect(() => {
    const loadReports = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const history = await learningReportService.getReportHistory(
          0,
          maxItems,
        );
        setReports(history.slice(0, maxItems));
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? err.message
            : "Không thể tải snapshot history.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadReports();
  }, [maxItems]);

  const handleDownload = async (
    report: StudentLearningReportResponse,
    event: React.MouseEvent,
  ) => {
    event.stopPropagation();
    setDownloadingId(report.reportId);
    try {
      await downloadLearningReportPDF(report, {
        filename: learningReportService.formatReportFileName(report),
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const getTrendColor = (trend: string) => {
    if (trend === "improving") return "#00ff88";
    if (trend === "declining") return "#ff6b35";
    return "#00d4ff";
  };

  return (
    <section className="neon-history">
      {/* Animated background */}
      <div className="neon-history-bg" />

      <header className="neon-history__header">
        <div className="neon-history__title-group">
          <div className="neon-history__eyebrow">
            <Cpu size={14} />
            Saved Analytics
          </div>
          <h3 className="neon-history__title">
            <Layers size={22} />
            {title}
          </h3>
        </div>

        {showGenerateButton && (
          <button
            className="neon-history__new"
            onClick={() => navigate("/learning-report")}
          >
            <Plus size={16} />
            <span>Mở report</span>
          </button>
        )}
      </header>

      {isLoading ? (
        <div className="neon-history__state">
          <div className="neon-history__loader" />
          <span>Đang tải snapshot...</span>
        </div>
      ) : error ? (
        <div className="neon-history__state neon-history__state--error">
          <TrendingUp size={20} />
          <span>{error}</span>
        </div>
      ) : reports.length === 0 ? (
        <div className="neon-history__state">
          <FileClock size={32} />
          <strong>Chưa có snapshot nào</strong>
          <span>Tạo báo cáo mới để lưu lại tiến độ học tập</span>
        </div>
      ) : (
        <div className="neon-history__list">
          {reports.map((report, index) => (
            <article
              key={report.reportId}
              className="neon-history__card"
              style={{ animationDelay: `${index * 0.08}s` }}
              onClick={() => navigate(`/learning-report?id=${report.reportId}`)}
            >
              {/* Glow border effect */}
              <div className="neon-history__card-glow" />

              <div className="neon-history__card-main">
                <div className="neon-history__card-info">
                  <div className="neon-history__card-head">
                    <strong>{report.reportName}</strong>
                    <div className="neon-history__badge">
                      <FileClock size={12} />
                      Snapshot
                    </div>
                  </div>
                  <div className="neon-history__meta">
                    <span>
                      <Calendar size={13} />
                      {learningReportService.formatReportDate(
                        report.generatedAt,
                      )}
                    </span>
                    <span
                      className="neon-history__trend"
                      style={{ color: getTrendColor(report.learningTrend) }}
                    >
                      <TrendingUp size={13} />
                      {report.learningTrend}
                    </span>
                  </div>
                </div>

                <div className="neon-history__stats">
                  <NeonHistoryStat
                    label="Progress"
                    value={`${report.overallProgress}%`}
                    color="#00f5ff"
                  />
                  <NeonHistoryStat
                    label="Study"
                    value={`${report.studyStats.totalStudyHours}h`}
                    color="#00d4ff"
                  />
                  <NeonHistoryStat
                    label="Streak"
                    value={`${report.studyStats.currentStreak} ngày`}
                    color="#ff6b35"
                  />
                  <NeonHistoryStat
                    label="Tasks"
                    value={`${report.taskStats.completedTasks}/${report.taskStats.totalTasks}`}
                    color="#00ff88"
                  />
                </div>
              </div>

              <div className="neon-history__actions">
                <button
                  type="button"
                  className="neon-history__btn neon-history__btn--view"
                  onClick={(event) => {
                    event.stopPropagation();
                    navigate(`/learning-report?id=${report.reportId}`);
                  }}
                >
                  <Eye size={15} />
                  <span>Xem</span>
                  <ChevronRight size={14} />
                </button>
                <button
                  type="button"
                  className="neon-history__btn neon-history__btn--download"
                  onClick={(event) => void handleDownload(report, event)}
                >
                  <Download size={15} />
                  <span>
                    {downloadingId === report.reportId ? "Đang tải..." : "PDF"}
                  </span>
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default LearningReportHistory;
