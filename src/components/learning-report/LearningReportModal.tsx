import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpenCheck,
  Clock3,
  Download,
  ExternalLink,
  Flame,
  GraduationCap,
  Save,
  Target,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  ComposedChart,
  Bar,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import learningReportService, {
  ReportRange,
  StudentLearningReportResponse,
  isValidReportId,
  parseReportId,
} from "../../services/learningReportService";
import { downloadLearningReportPDF } from "./PDFGenerator";
import "./LearningReportModal.css";

interface LearningReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  meowlSkin?: boolean;
  initialReport?: StudentLearningReportResponse | null;
  initialReportId?: number | null;
}

const LearningReportModal: React.FC<LearningReportModalProps> = ({
  isOpen,
  onClose,
  initialReport = null,
  initialReportId = null,
}) => {
  const navigate = useNavigate();
  const [range, setRange] = useState<ReportRange>("30d");
  const [report, setReport] = useState<StudentLearningReportResponse | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const loadReport = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (initialReport) {
          setReport(initialReport);
          return;
        }

        if (isValidReportId(initialReportId)) {
          const snapshotId = parseReportId(initialReportId);
          const [snapshot, timeline] = await Promise.all([
            learningReportService.getReportById(snapshotId),
            learningReportService.getTimeline(range, snapshotId),
          ]);

          setReport({
            ...snapshot,
            range,
            timeline: timeline.timeline,
          });
          return;
        }

        const liveSummary = await learningReportService.getSummary(range);
        setReport(liveSummary);
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? err.message
            : "Không thể tải learning report.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadReport();
  }, [initialReport, initialReportId, isOpen, range]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const snapshot = await learningReportService.createSnapshot(range);
      setReport(snapshot);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = async () => {
    if (!report) return;
    setIsDownloading(true);
    try {
      await downloadLearningReportPDF(report, {
        filename: learningReportService.formatReportFileName(report),
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleOpenFull = () => {
    if (report?.reportId && report.snapshot) {
      navigate(`/learning-report?id=${report.reportId}`);
    } else {
      navigate("/learning-report");
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="lr-modal-lite__overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="lr-modal-lite__container"
          initial={{ opacity: 0, y: 18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 18, scale: 0.96 }}
          onClick={(event) => event.stopPropagation()}
        >
          <header className="lr-modal-lite__header">
            <div>
              <div className="lr-modal-lite__eyebrow">
                {report?.snapshot ? "Snapshot" : "Live Report"}
              </div>
              <h3>Learning Report</h3>
            </div>
            <button className="lr-modal-lite__close" onClick={onClose}>
              <X size={18} />
            </button>
          </header>

          <div className="lr-modal-lite__range">
            {(["7d", "30d", "90d"] as ReportRange[]).map((item) => (
              <button
                key={item}
                className={
                  range === item
                    ? "lr-modal-lite__range-btn is-active"
                    : "lr-modal-lite__range-btn"
                }
                onClick={() => setRange(item)}
              >
                {item}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="lr-modal-lite__state">Đang tải report...</div>
          ) : error ? (
            <div className="lr-modal-lite__state lr-modal-lite__state--error">
              {error}
            </div>
          ) : report ? (
            <>
              <div className="lr-modal-lite__stats">
                <div>
                  <Target size={16} />
                  <strong>{report.overallProgress}%</strong>
                  <span>Overall</span>
                </div>
                <div>
                  <Clock3 size={16} />
                  <strong>{report.studyStats.totalStudyHours}h</strong>
                  <span>Study</span>
                </div>
                <div>
                  <Flame size={16} />
                  <strong>{report.studyStats.currentStreak}</strong>
                  <span>Streak</span>
                </div>
                <div>
                  <BookOpenCheck size={16} />
                  <strong>{report.roadmapStats.completedMissions}</strong>
                  <span>Missions</span>
                </div>
                <div>
                  <GraduationCap size={16} />
                  <strong>{report.courseStats.activeCourses}</strong>
                  <span>Courses</span>
                </div>
              </div>

              <div className="lr-modal-lite__chart">
                <ResponsiveContainer width="100%" height={220}>
                  <ComposedChart data={report.timeline}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#d7e2ea" />
                    <XAxis dataKey="bucketLabel" tick={{ fill: "#476074" }} />
                    <YAxis yAxisId="left" allowDecimals={false} />
                    <YAxis yAxisId="right" orientation="right" allowDecimals={false} />
                    <Tooltip />
                    <Bar
                      yAxisId="left"
                      dataKey="studyMinutes"
                      fill="#14b8a6"
                      radius={[8, 8, 0, 0]}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="missionsCompleted"
                      stroke="#f97316"
                      strokeWidth={3}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              <div className="lr-modal-lite__tips">
                {report.overview.recommendations.map((item, index) => (
                  <div key={`${item}-${index}`} className="lr-modal-lite__tip">
                    <span>{index + 1}</span>
                    <p>{item}</p>
                  </div>
                ))}
              </div>
            </>
          ) : null}

          <footer className="lr-modal-lite__footer">
            <button onClick={handleOpenFull}>
              <ExternalLink size={16} />
              <span>Mở full page</span>
            </button>
            <button onClick={() => void handleDownload()} disabled={isDownloading}>
              <Download size={16} />
              <span>{isDownloading ? "Đang tải" : "Tải PDF"}</span>
            </button>
            <button onClick={() => void handleSave()} disabled={isSaving}>
              <Save size={16} />
              <span>{isSaving ? "Đang lưu" : "Lưu snapshot"}</span>
            </button>
          </footer>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default LearningReportModal;
