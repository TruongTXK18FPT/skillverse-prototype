import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FileText,
  AlertTriangle,
  ChevronRight,
  Zap,
  AlertCircle,
  CheckCircle2,
  Target,
  Lightbulb,
  Clock,
  BarChart2,
  BookOpen,
  TrendingUp,
  Users,
  Briefcase,
  Calendar,
} from "lucide-react";
import "./CommanderWelcome.css";

interface TaskSummary {
  criticalOverdue: number;
  overdue: number;
  pending: number;
  upcomingTasks: Array<{
    taskId?: string;
    title: string;
    deadline: string;
    daysOverdue: number;
    estimatedMinutes?: number;
    roadmapSessionId?: number;
    nodeId?: string;
  }>;
}

interface CommanderWelcomeProps {
  userName?: string;
  subtitle?: string;
  userLevel?: number;
  onViewPlan?: () => void;
  onTaskNavigate?: (task?: TaskSummary["upcomingTasks"][number]) => void;
  onViewReport?: () => void;
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
  onTaskNavigate,
  onViewReport,
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
  roadmapCount = 0,
  courseCount = 0,
}) => {
  void _hasCourses;
  const navigate = useNavigate();

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 100; // Khoảng cách offset để không bị che bởi header
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  const totalOverdue = taskSummary.criticalOverdue + taskSummary.overdue;
  const totalTasks = totalOverdue + taskSummary.pending;
  const firstCriticalTask = taskSummary.upcomingTasks.find(
    (task) => task.daysOverdue > 30,
  );
  const firstOverdueTask = taskSummary.upcomingTasks.find(
    (task) => task.daysOverdue <= 30 && task.daysOverdue > 0,
  );

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

  // Generate smart suggestions based on task status
  const getSuggestions = () => {
    const suggestions: Array<{
      type: string;
      icon: React.ReactNode;
      message: string;
      actionKey:
        | "critical-task"
        | "overdue-task"
        | "pending-tasks"
        | "roadmap"
        | "planner";
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
          : `${taskSummary.criticalOverdue} công việc cần xử lý gấp!`,
        actionKey: "critical-task",
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
          : `Hoàn thành ${taskSummary.overdue} công việc quá hạn`,
        actionKey: "overdue-task",
      });
    }

    if (taskSummary.pending > 0) {
      suggestions.push({
        type: "info",
        icon: <Clock size={12} />,
        message: `${taskSummary.pending} công việc đang chờ - giữ tiến độ!`,
        actionKey: "pending-tasks",
      });
    }

    if (!hasRoadmap) {
      suggestions.push({
        type: "action",
        icon: <Lightbulb size={12} />,
        message: "Tạo roadmap để bắt đầu hành trình",
        actionKey: "roadmap",
      });
    }

    if (totalTasks === 0) {
      suggestions.push({
        type: "action",
        icon: <Target size={12} />,
        message: "Tạo task để bắt đầu hành trình",
        actionKey: "planner",
      });
    }

    if (suggestions.length === 0) {
      suggestions.push({
        type: "success",
        icon: <CheckCircle2 size={12} />,
        message: "Tuyệt vời! Đang hoàn thành tốt mục tiêu",
        actionKey: "planner",
      });
    }

    return suggestions.slice(0, 3); // Max 3 suggestions
  };

  const suggestions = getSuggestions();
  const handleTaskNavigate = (task?: TaskSummary["upcomingTasks"][number]) => {
    if (onTaskNavigate) {
      onTaskNavigate(task);
      return;
    }

    navigate("/study-planner");
  };

  const handleViewPlanClick = () => {
    if (onViewPlan) {
      onViewPlan();
      return;
    }

    navigate("/study-planner");
  };

  const handleSuggestionClick = (
    actionKey:
      | "critical-task"
      | "overdue-task"
      | "pending-tasks"
      | "roadmap"
      | "planner",
  ) => {
    if (actionKey === "critical-task") {
      handleTaskNavigate(firstCriticalTask);
      return;
    }

    if (actionKey === "overdue-task") {
      handleTaskNavigate(firstOverdueTask);
      return;
    }

    if (actionKey === "pending-tasks") {
      handleTaskNavigate();
      return;
    }

    if (actionKey === "roadmap") {
      navigate("/roadmap");
      return;
    }

    handleViewPlanClick();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      className={`commander-welcome commander-welcome--compact ${hasPremium ? "commander-welcome--premium" : ""}`}
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

          {/* Quick Jump Links */}
          <div className="commander-welcome__jump-links">
            <button
              onClick={() => scrollToSection("learning-streak-section")}
              className="commander-welcome__jump-btn"
              title="Xem tình trạng hệ thống"
            >
              <Zap size={14} />
              <span>Trạng thái hệ thống</span>
              <ChevronRight size={14} /> {/* Add arrow icon */}
            </button>
            <button
              onClick={() => scrollToSection("study-plan-section")}
              className="commander-welcome__jump-btn"
              title="Xem lộ trình học tập"
            >
              <TrendingUp size={14} />
              <span>Chiến lược học tập</span>
              <ChevronRight size={14} /> {/* Add arrow icon */}
            </button>
            <button
              onClick={() => scrollToSection("modules-section")}
              className="commander-welcome__jump-btn"
              title="Xem các khóa học"
            >
              <BookOpen size={14} />
              <span>Khóa học đang học</span>
              <ChevronRight size={14} /> {/* Add arrow icon */}
            </button>
            <button
              onClick={() => scrollToSection("mentors-section")}
              className="commander-welcome__jump-btn"
              title="Xem mentors yêu thích"
            >
              <Users size={14} />
              <span>Cố vấn yêu thích</span>
              <ChevronRight size={14} /> {/* Add arrow icon */}
            </button>
            <button
              onClick={() => navigate("/my-applications")}
              className="commander-welcome__jump-btn commander-welcome__jump-btn--applications"
              title="Đến trung tâm quản lý đơn ứng tuyển"
            >
              <Briefcase size={14} />
              <span>Trung tâm công việc của bạn</span>
              <ChevronRight size={14} />
            </button>
            <button
              onClick={() => navigate("/my-bookings")}
              className="commander-welcome__jump-btn commander-welcome__jump-btn--bookings"
              title="Đến lịch hẹn mentorship"
            >
              <Calendar size={14} />
              <span>Lịch hẹn mentorship</span>
              <ChevronRight size={14} />
            </button>
          </div>
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
                    role="button"
                    tabIndex={0}
                    onClick={() => handleTaskNavigate(firstCriticalTask)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        handleTaskNavigate(firstCriticalTask);
                      }
                    }}
                  >
                    <AlertTriangle size={11} />
                    <span>{taskSummary.criticalOverdue}</span>
                  </div>
                )}
                {taskSummary.overdue > 0 && (
                  <div
                    className="commander-welcome__mini-badge commander-welcome__mini-badge--overdue"
                    title="Quá hạn"
                    role="button"
                    tabIndex={0}
                    onClick={() => handleTaskNavigate(firstOverdueTask)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        handleTaskNavigate(firstOverdueTask);
                      }
                    }}
                  >
                    <AlertCircle size={11} />
                    <span>{taskSummary.overdue}</span>
                  </div>
                )}
                <div
                  className="commander-welcome__mini-badge commander-welcome__mini-badge--pending"
                  title="Đang chờ"
                  role="button"
                  tabIndex={0}
                  onClick={() => handleTaskNavigate()}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handleTaskNavigate();
                    }
                  }}
                >
                  <CheckCircle2 size={11} />
                  <span>{taskSummary.pending}</span>
                </div>
                <span className="commander-welcome__task-total">
                  {totalTasks} công việc
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

            {/* Premium Stats Row */}
            {hasPremium && (
              <div className="commander-welcome__premium-stats">
                <div className="commander-welcome__premium-stat-item">
                  <div className="commander-welcome__premium-stat-icon">
                    <BookOpen size={14} />
                  </div>
                  <div className="commander-welcome__premium-stat-info">
                    <span className="commander-welcome__premium-stat-label">
                      Mô-đun
                    </span>
                    <span className="commander-welcome__premium-stat-value">
                      {courseCount}
                    </span>
                  </div>
                </div>
                <div className="commander-welcome__premium-stat-item">
                  <div className="commander-welcome__premium-stat-icon">
                    <TrendingUp size={14} />
                  </div>
                  <div className="commander-welcome__premium-stat-info">
                    <span className="commander-welcome__premium-stat-label">
                      Lộ trình
                    </span>
                    <span className="commander-welcome__premium-stat-value">
                      {roadmapCount}
                    </span>
                  </div>
                </div>
                <div className="commander-welcome__premium-stat-item">
                  <div className="commander-welcome__premium-stat-icon commander-welcome__premium-stat-icon--highlight">
                    <Target size={14} />
                  </div>
                  <div className="commander-welcome__premium-stat-info">
                    <span className="commander-welcome__premium-stat-label">
                      Nhiệm vụ
                    </span>
                    <span className="commander-welcome__premium-stat-value">
                      {totalTasks}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Task List
            {topTasks.length > 0 && (
              <div className="commander-welcome__task-list">
                {topTasks.map((task, index) => (
                  <div
                    key={index}
                    className={`commander-welcome__task-item commander-welcome__task-item--${task.priority}`}
                    onClick={() => navigate("/roadmap")}
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
            )} */}

            {/* Suggestions */}
            <div className="commander-welcome__suggestions">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className={`commander-welcome__suggestion-item commander-welcome__suggestion-item--${suggestion.type}`}
                  onClick={() => handleSuggestionClick(suggestion.actionKey)}
                >
                  {suggestion.icon}
                  <span>{suggestion.message}</span>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="commander-welcome__cta-buttons">
              <button
                onClick={handleViewPlanClick}
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

              {/* Learning Report Button */}
              <button
                onClick={onViewReport}
                className="commander-welcome__report-cta"
              >
                <BarChart2 size={14} />
                <span>Báo cáo học tập</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
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
