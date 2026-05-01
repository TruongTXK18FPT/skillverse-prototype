import React, { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  ChevronRight,
  Cpu,
  Download,
  Eye,
  FileClock,
  Filter,
  Layers,
  Plus,
  Search,
  SlidersHorizontal,
  TrendingUp,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import learningReportService, {
  StudentLearningReportResponse,
} from "../../services/learningReportService";
import { downloadLearningReportPDF } from "./PDFGenerator";
import { useScrollToListTopOnPagination } from "../../hooks/useScrollToListTopOnPagination";
import "./LearningReportHistory.css";

interface LearningReportHistoryProps {
  maxItems?: number;
  showGenerateButton?: boolean;
  title?: string;
}

type ReportTrendFilter = "all" | "improving" | "stable" | "declining";
type ReportRangeFilter = "all" | "7d" | "30d" | "90d";
type ReportSortKey =
  | "newest"
  | "oldest"
  | "progress-desc"
  | "study-desc"
  | "streak-desc"
  | "tasks-desc";

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
  const REPORTS_PER_PAGE = 2;
  const navigate = useNavigate();
  const [reports, setReports] = useState<StudentLearningReportResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [trendFilter, setTrendFilter] = useState<ReportTrendFilter>("all");
  const [rangeFilter, setRangeFilter] = useState<ReportRangeFilter>("all");
  const [sortBy, setSortBy] = useState<ReportSortKey>("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const { withPaginationScroll } = useScrollToListTopOnPagination();

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

  const getTrendLabel = (trend: string) => {
    if (trend === "improving") return "Đang cải thiện";
    if (trend === "declining") return "Cần chú ý";
    return "Ổn định";
  };

  const getRangeLabel = (range: string) => {
    if (range === "7d") return "7 ngày";
    if (range === "90d") return "90 ngày";
    return "30 ngày";
  };

  const filteredReports = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return reports
      .filter((report) => {
        if (trendFilter !== "all" && report.learningTrend !== trendFilter) {
          return false;
        }

        if (rangeFilter !== "all" && report.range !== rangeFilter) {
          return false;
        }

        if (!normalizedSearch) {
          return true;
        }

        const searchable = [
          report.reportName,
          report.studentName,
          report.learningTrend,
          getTrendLabel(report.learningTrend),
          getRangeLabel(report.range),
          report.recommendedFocus,
          learningReportService.formatReportDate(report.generatedAt),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchable.includes(normalizedSearch);
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "oldest":
            return (
              new Date(a.generatedAt).getTime() -
              new Date(b.generatedAt).getTime()
            );
          case "progress-desc":
            return b.overallProgress - a.overallProgress;
          case "study-desc":
            return b.studyStats.totalStudyHours - a.studyStats.totalStudyHours;
          case "streak-desc":
            return b.studyStats.currentStreak - a.studyStats.currentStreak;
          case "tasks-desc": {
            const bTasks =
              b.taskStats.totalTasks > 0
                ? b.taskStats.completedTasks / b.taskStats.totalTasks
                : 0;
            const aTasks =
              a.taskStats.totalTasks > 0
                ? a.taskStats.completedTasks / a.taskStats.totalTasks
                : 0;
            return bTasks - aTasks;
          }
          case "newest":
          default:
            return (
              new Date(b.generatedAt).getTime() -
              new Date(a.generatedAt).getTime()
            );
        }
      });
  }, [rangeFilter, reports, searchTerm, sortBy, trendFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [rangeFilter, searchTerm, sortBy, trendFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredReports.length / REPORTS_PER_PAGE),
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedReports = useMemo(() => {
    const start = (currentPage - 1) * REPORTS_PER_PAGE;
    return filteredReports.slice(start, start + REPORTS_PER_PAGE);
  }, [currentPage, filteredReports]);

  const activeFilterCount =
    (searchTerm.trim() ? 1 : 0) +
    (trendFilter !== "all" ? 1 : 0) +
    (rangeFilter !== "all" ? 1 : 0);

  const resetFilters = () => {
    setSearchTerm("");
    setTrendFilter("all");
    setRangeFilter("all");
    setSortBy("newest");
    setCurrentPage(1);
  };

  return (
    <section className="neon-history">
      {/* Animated background */}
      <div className="neon-history-bg" />

      <header className="neon-history__header">
        <div className="neon-history__title-group">
          <div className="neon-history__eyebrow">
            <Cpu size={14} />
            Kho phân tích
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

      {!isLoading && !error && reports.length > 0 && (
        <div className="neon-history__controls" aria-label="Bộ lọc báo cáo">
          <label className="neon-history__search">
            <Search size={16} />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              aria-label="Tìm kiếm báo cáo học tập"
              placeholder="Tìm theo tên, ngày, trạng thái..."
            />
          </label>

          <label className="neon-history__control">
            <Filter size={15} />
            <select
              value={trendFilter}
              aria-label="Lọc báo cáo theo trạng thái"
              onChange={(event) =>
                setTrendFilter(event.target.value as ReportTrendFilter)
              }
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="improving">Đang cải thiện</option>
              <option value="stable">Ổn định</option>
              <option value="declining">Cần chú ý</option>
            </select>
          </label>

          <label className="neon-history__control">
            <Calendar size={15} />
            <select
              value={rangeFilter}
              aria-label="Lọc báo cáo theo chu kỳ"
              onChange={(event) =>
                setRangeFilter(event.target.value as ReportRangeFilter)
              }
            >
              <option value="all">Mọi chu kỳ</option>
              <option value="7d">7 ngày</option>
              <option value="30d">30 ngày</option>
              <option value="90d">90 ngày</option>
            </select>
          </label>

          <label className="neon-history__control">
            <SlidersHorizontal size={15} />
            <select
              value={sortBy}
              aria-label="Sắp xếp báo cáo"
              onChange={(event) =>
                setSortBy(event.target.value as ReportSortKey)
              }
            >
              <option value="newest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
              <option value="progress-desc">Progress cao nhất</option>
              <option value="study-desc">Giờ học cao nhất</option>
              <option value="streak-desc">Streak cao nhất</option>
              <option value="tasks-desc">Task tốt nhất</option>
            </select>
          </label>

          <div className="neon-history__result-meta">
            <span>
              {filteredReports.length}/{reports.length} snapshot
            </span>
            {activeFilterCount > 0 && (
              <button type="button" onClick={resetFilters}>
                Xóa lọc
              </button>
            )}
          </div>
        </div>
      )}

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
      ) : filteredReports.length === 0 ? (
        <div className="neon-history__state">
          <Search size={32} />
          <strong>Không tìm thấy báo cáo phù hợp</strong>
          <span>Thử đổi từ khóa, trạng thái hoặc chu kỳ báo cáo.</span>
          <button
            type="button"
            className="neon-history__clear"
            onClick={resetFilters}
          >
            Xóa bộ lọc
          </button>
        </div>
      ) : (
        <>
          <div className="neon-history__list">
            {paginatedReports.map((report, index) => (
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
                        {getTrendLabel(report.learningTrend)}
                      </span>
                      <span>
                        <SlidersHorizontal size={13} />
                        {getRangeLabel(report.range)}
                      </span>
                    </div>
                  </div>

                  <div className="neon-history__stats">
                    <NeonHistoryStat
                      label="Tiến độ"
                      value={`${report.overallProgress}%`}
                      color="#00f5ff"
                    />
                    <NeonHistoryStat
                      label="Giờ học"
                      value={`${report.studyStats.totalStudyHours}h`}
                      color="#00d4ff"
                    />
                    <NeonHistoryStat
                      label="Chuỗi"
                      value={`${report.studyStats.currentStreak} ngày`}
                      color="#ff6b35"
                    />
                    <NeonHistoryStat
                      label="Task"
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

          {filteredReports.length > REPORTS_PER_PAGE && (
            <div className="neon-history__pagination">
              <button
                type="button"
                onClick={withPaginationScroll(() =>
                  setCurrentPage((prev) => Math.max(prev - 1, 1))
                )}
                disabled={currentPage === 1}
              >
                Trang trước
              </button>
              <span>
                Trang {currentPage}/{totalPages}
              </span>
              <button
                type="button"
                onClick={withPaginationScroll(() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                )}
                disabled={currentPage === totalPages}
              >
                Trang sau
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default LearningReportHistory;
