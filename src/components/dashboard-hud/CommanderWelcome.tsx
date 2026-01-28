import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FileText,
  Crown,
  AlertTriangle,
  ChevronRight,
  Zap,
  AlertCircle,
  CheckCircle2,
  Target,
  Lightbulb,
  Clock,
} from "lucide-react";
import "./CommanderWelcome.css";

interface TaskSummary {
  criticalOverdue: number;
  overdue: number;
  pending: number;
  upcomingTasks: Array<{
    title: string;
    deadline: string;
    daysOverdue: number;
    estimatedMinutes?: number;
  }>;
}

interface CommanderWelcomeProps {
  userName?: string;
  subtitle?: string;
  userLevel?: number;
  onViewPlan?: () => void;
  viewPlanText?: string;
  hasRoadmap?: boolean;
  hasCourses?: boolean;
  hasPremium?: boolean;
  taskSummary?: TaskSummary;
  roadmapCount?: number;
  courseCount?: number;
}

const CommanderWelcome: React.FC<CommanderWelcomeProps> = ({
  userName = "Commander",
  subtitle = "COMMAND CENTER OPERATIONAL",
  userLevel = 1,
  onViewPlan,
  viewPlanText = "Xem kế hoạch học tập",
  hasRoadmap = false,
  hasCourses: _hasCourses = false,
  hasPremium = false,
  taskSummary = {
    criticalOverdue: 0,
    overdue: 0,
    pending: 0,
    upcomingTasks: [],
  },
}) => {
  // Keep _hasCourses for future use
  void _hasCourses;
  const navigate = useNavigate();

  const totalOverdue = taskSummary.criticalOverdue + taskSummary.overdue;
  const totalTasks = totalOverdue + taskSummary.pending;

  // Calculate total estimated time
  const totalEstimatedMinutes = taskSummary.upcomingTasks.reduce(
    (sum, task) => sum + (task.estimatedMinutes || 30),
    0,
  );

  // Format time (minutes to hours/days)
  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  };

  // Get top tasks to display (prioritized)
  const getTopTasks = () => {
    const tasks = taskSummary.upcomingTasks.slice(0, 5);
    return tasks.map((task) => ({
      ...task,
      priority:
        task.daysOverdue > 30
          ? "critical"
          : task.daysOverdue > 0
            ? "overdue"
            : "pending",
    }));
  };

  // Generate smart suggestions based on task status
  const getSuggestions = () => {
    const suggestions: Array<{
      type: string;
      icon: React.ReactNode;
      message: string;
    }> = [];

    if (taskSummary.criticalOverdue > 0) {
      const firstCritical = taskSummary.upcomingTasks.find(
        (t) => t.daysOverdue > 30,
      );
      suggestions.push({
        type: "critical",
        icon: <AlertTriangle size={12} />,
        message: firstCritical
          ? `Ưu tiên cao: "${firstCritical.title.substring(0, 25)}..."`
          : `${taskSummary.criticalOverdue} nhiệm vụ cần xử lý gấp!`,
      });
    }

    if (taskSummary.overdue > 0) {
      const firstOverdue = taskSummary.upcomingTasks.find(
        (t) => t.daysOverdue <= 30 && t.daysOverdue > 0,
      );
      suggestions.push({
        type: "warning",
        icon: <Target size={12} />,
        message: firstOverdue
          ? `Tiếp theo: "${firstOverdue.title.substring(0, 25)}..."`
          : `Hoàn thành ${taskSummary.overdue} nhiệm vụ quá hạn`,
      });
    }

    if (taskSummary.pending > 0) {
      suggestions.push({
        type: "info",
        icon: <Clock size={12} />,
        message: `${taskSummary.pending} nhiệm vụ pending - giữ tiến độ!`,
      });
    }

    if (!hasRoadmap) {
      suggestions.push({
        type: "action",
        icon: <Lightbulb size={12} />,
        message: "Tạo roadmap để bắt đầu hành trình",
      });
    }

    if (totalTasks === 0) {
      suggestions.push({
        type: "action",
        icon: <Target size={12} />,
        message: "Tạo task để bắt đầu hành trình",
      });
    }

    if (suggestions.length === 0) {
      suggestions.push({
        type: "success",
        icon: <CheckCircle2 size={12} />,
        message: "Tuyệt vời! Đang hoàn thành tốt mục tiêu",
      });
    }

    return suggestions.slice(0, 3); // Max 3 suggestions
  };

  const topTasks = getTopTasks();
  const suggestions = getSuggestions();

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      className="commander-welcome commander-welcome--compact"
    >
      <div className="commander-welcome__backdrop"></div>

      <div className="commander-welcome__content">
        {/* Left Section - User Info */}
        <div className="commander-welcome__left">
          <div className="commander-welcome__status">
            <div className="commander-welcome__status-dot"></div>
            <span className="commander-welcome__status-text">
              LEARNING SYSTEM ACTIVE
            </span>
          </div>

          <h1 className="commander-welcome__title">
            WELCOME BACK,{" "}
            <span className="commander-welcome__name">
              {userName.toUpperCase()}
            </span>
          </h1>

          <p className="commander-welcome__subtitle">{subtitle}</p>
        </div>

        {/* Center Section - Task Panel */}
        <div className="commander-welcome__center">
          <div className="commander-welcome__task-panel">
            {/* Task Panel Header */}
            <div className="commander-welcome__task-panel-header">
              <div className="commander-welcome__task-badges">
                {taskSummary.criticalOverdue > 0 && (
                  <div
                    className="commander-welcome__mini-badge commander-welcome__mini-badge--critical"
                    title="Quá hạn nghiêm trọng (>30 ngày)"
                  >
                    <AlertTriangle size={11} />
                    <span>{taskSummary.criticalOverdue}</span>
                  </div>
                )}
                {taskSummary.overdue > 0 && (
                  <div
                    className="commander-welcome__mini-badge commander-welcome__mini-badge--overdue"
                    title="Quá hạn"
                  >
                    <AlertCircle size={11} />
                    <span>{taskSummary.overdue}</span>
                  </div>
                )}
                <div
                  className="commander-welcome__mini-badge commander-welcome__mini-badge--pending"
                  title="Đang chờ"
                >
                  <CheckCircle2 size={11} />
                  <span>{taskSummary.pending}</span>
                </div>
                <span className="commander-welcome__task-total">
                  {totalTasks} tasks
                </span>
              </div>

              {/* Level Badge */}
              <div className="commander-welcome__level-badge">
                <Zap size={12} />
                <span>LV {userLevel}</span>
                <div className="commander-welcome__level-bar">
                  <div
                    className="commander-welcome__level-fill"
                    style={{ width: `${(userLevel % 10) * 10}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Task List */}
            {topTasks.length > 0 && (
              <div className="commander-welcome__task-list">
                {topTasks.map((task, index) => (
                  <div
                    key={index}
                    className={`commander-welcome__task-item commander-welcome__task-item--${task.priority}`}
                    onClick={() => navigate("/study-planner")}
                  >
                    <span className="commander-welcome__task-dot"></span>
                    <span className="commander-welcome__task-title">
                      {task.title.length > 30
                        ? task.title.substring(0, 30) + "..."
                        : task.title}
                    </span>
                    <div className="commander-welcome__task-meta">
                      {task.estimatedMinutes && (
                        <span className="commander-welcome__task-time">
                          <Clock size={10} />
                          {formatTime(task.estimatedMinutes)}
                        </span>
                      )}
                      <span className="commander-welcome__task-days">
                        {task.daysOverdue > 0
                          ? `-${task.daysOverdue}d`
                          : "pending"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Suggestions */}
            <div className="commander-welcome__suggestions">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className={`commander-welcome__suggestion-item commander-welcome__suggestion-item--${suggestion.type}`}
                  onClick={() => navigate("/study-planner")}
                >
                  {suggestion.icon}
                  <span>{suggestion.message}</span>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <button
              onClick={onViewPlan}
              className="commander-welcome__panel-cta"
            >
              <div className="commander-welcome__cta-content">
                <div className="commander-welcome__cta-main">
                  <FileText size={14} />
                  <span>{viewPlanText}</span>
                  {totalOverdue > 0 && (
                    <span className="commander-welcome__cta-badge">
                      {totalOverdue}
                    </span>
                  )}
                </div>
                {totalEstimatedMinutes > 0 && (
                  <div className="commander-welcome__cta-time">
                    <Clock size={11} />
                    <span>
                      ~{formatTime(totalEstimatedMinutes)} để hoàn thành
                    </span>
                  </div>
                )}
              </div>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Right Section - Premium */}
        <div className="commander-welcome__right">
          {!hasPremium && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="commander-welcome__premium-card"
              onClick={() => navigate("/premium")}
            >
              <Crown size={16} />
              <div className="commander-welcome__premium-info">
                <span className="commander-welcome__premium-title">
                  Premium
                </span>
                <span className="commander-welcome__premium-desc">
                  Nâng cấp ngay
                </span>
              </div>
              <ChevronRight size={14} />
            </motion.div>
          )}
        </div>
      </div>

      {/* Corner decorations */}
      <div className="commander-welcome__corner commander-welcome__corner--tl"></div>
      <div className="commander-welcome__corner commander-welcome__corner--tr"></div>
      <div className="commander-welcome__corner commander-welcome__corner--bl"></div>
      <div className="commander-welcome__corner commander-welcome__corner--br"></div>
    </motion.div>
  );
};

export default CommanderWelcome;
