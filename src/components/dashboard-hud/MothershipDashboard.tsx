import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Briefcase, Award, TrendingUp } from "lucide-react";
import CommanderWelcome from "./CommanderWelcome";
import SystemStatus from "./SystemStatus";
import StatUnit from "./StatUnit";
import ActiveModules from "./ActiveModules";
import FavoriteMentors from "./FavoriteMentors";
import AnalystTrack from "./AnalystTrack";
import SystemLimits from "./SystemLimits";
import MentorChatModal from "../mentorship-hud/MentorChatModal";
import { LearningReportHistory } from "../learning-report";
import { RoadmapSessionSummary } from "../../types/Roadmap";
import { FeatureLimitInfo } from "../../services/usageLimitService";
import {
  buildCourseLearningDestination,
  buildCourseLearningOrigin,
} from "../../utils/courseLearningNavigation";
import "./MothershipDashboard.css";
import "./hud-styles.module.css";

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

interface MothershipDashboardProps {
  userName?: string;
  userRoles?: string[];
  userLevel?: number;
  hasPremium?: boolean;
  taskSummary?: TaskSummary;
  translations?: any;
  enrolledCourses?: any[];
  favoriteMentors?: any[];
  roadmaps?: RoadmapSessionSummary[];
  userStats?: {
    totalCourses: number;
    totalHours: number;
    completedProjects: number;
    certificates: number;
  };
  cycleStats?: {
    enrolledCoursesCount: number;
    completedCoursesCount: number;
    completedProjectsCount?: number;
    certificatesCount?: number;
    totalHoursStudied: number;
    currentStreak?: number;
    longestStreak?: number;
    weeklyActivity?: boolean[];
  };
  usageLimits?: {
    CHATBOT_REQUESTS: number;
    ROADM_MAPS_LIMIT: number;
    COIN_MULTIPLIER: number;
  };
  featureUsage?: FeatureLimitInfo[];
  featureUsageLoading?: boolean;
  featureUsageError?: string | null;
  onJoinGroup?: (groupId: number, isMember: boolean) => void;
}

const MothershipDashboard: React.FC<MothershipDashboardProps> = ({
  userName = "InnoVibe Team",
  userRoles = [],
  userLevel = 1,
  hasPremium = false,
  taskSummary = {
    criticalOverdue: 0,
    overdue: 0,
    pending: 0,
    upcomingTasks: [],
  },
  translations = {},
  enrolledCourses = [],
  favoriteMentors = [],
  roadmaps = [],
  userStats = {
    totalCourses: 0,
    totalHours: 0,
    completedProjects: 0,
    certificates: 0,
  },
  cycleStats,
  usageLimits,
  featureUsage,
  featureUsageLoading = false,
  featureUsageError = null,
  onJoinGroup,
}) => {
  const navigate = useNavigate();
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [selectedMentorForChat, setSelectedMentorForChat] = useState<any>(null);

  const handleOpenChat = (mentor: any) => {
    setSelectedMentorForChat(mentor);
    setChatModalOpen(true);
  };

  // Data mapping from old structure to new Sci-Fi theme
  const stats = [
    {
      value: userStats.totalCourses,
      label:
        translations?.dashboard?.stats?.coursesInProgress || "Modules Synced",
      change: cycleStats
        ? `+${cycleStats.enrolledCoursesCount} this cycle`
        : "+3 this cycle",
      trend: "up" as const,
      icon: BookOpen,
      color: "cyan" as const,
    },
    {
      value: userStats.completedProjects,
      label:
        translations?.dashboard?.stats?.projectsCompleted ||
        "Missions Complete",
      change: cycleStats?.completedProjectsCount
        ? `+${cycleStats.completedProjectsCount} this cycle`
        : "+0 this cycle",
      trend: "up" as const,
      icon: Briefcase,
      color: "green" as const,
    },
    {
      value: userStats.certificates,
      label:
        translations?.dashboard?.stats?.certificatesEarned || "Badges Unlocked",
      change: cycleStats?.certificatesCount
        ? `+${cycleStats.certificatesCount} this cycle`
        : "+0 this cycle",
      trend: "up" as const,
      icon: Award,
      color: "purple" as const,
    },
    {
      value: userStats.totalHours,
      label: translations?.dashboard?.stats?.totalHours || "Energy Units",
      change: cycleStats
        ? `+${cycleStats.totalHoursStudied} this cycle`
        : "+230 this cycle",
      trend: "up" as const,
      icon: TrendingUp,
      color: "orange" as const,
    },
  ];

  const learningStreak = {
    current: cycleStats?.currentStreak || 0,
    longest: cycleStats?.longestStreak || 0,
    thisWeek: cycleStats?.weeklyActivity || [
      false,
      false,
      false,
      false,
      false,
      false,
      false,
    ],
    weeklyGoal: 5,
  };

  // Use passed enrolledCourses if available, otherwise use fallback (or empty)
  const recentCourses = enrolledCourses.length > 0 ? enrolledCourses : [];

  const handleViewPlan = () => {
    navigate("/study-planner");
  };

  const handleOpenPlannerTask = (
    _task?: TaskSummary["upcomingTasks"][number],
  ) => {
    navigate("/study-planner");
  };

  const handleViewReport = () => {
    navigate("/learning-report");
  };

  const handleCourseClick = (courseId: number, courseTitle?: string) => {
    const courseLearningState = {
      courseId,
      courseTitle,
      origin: buildCourseLearningOrigin("/dashboard", {
        label: "bảng điều khiển",
      }),
    };

    navigate(buildCourseLearningDestination(courseLearningState), {
      state: courseLearningState,
    });
  };

  return (
    <div className="mothership-dashboard">
      <div className="mothership-dashboard__container">
        {/* Commander Welcome */}
        <CommanderWelcome
          userName={userName}
          subtitle="HỆ THỐNG ĐÃ SẴN SÀNG - BẠN MUỐN LÀM GÌ HÔM NAY?"
          userLevel={userLevel}
          onViewPlan={handleViewPlan}
          onTaskNavigate={handleOpenPlannerTask}
          onViewReport={handleViewReport}
          viewPlanText={
            translations?.dashboard?.viewStudyPlan || "Xem kế hoạch học tập"
          }
          hasRoadmap={roadmaps.length > 0}
          hasCourses={enrolledCourses.length > 0}
          hasPremium={hasPremium}
          taskSummary={taskSummary}
          roadmapCount={roadmaps.length}
          courseCount={enrolledCourses.length}
        />

        {/* <section className="mothership-dashboard__intro-board">
          <div className="mothership-dashboard__intro-panel">
            <div className="mothership-dashboard__intro-heading">
              <span className="mothership-dashboard__intro-eyebrow">
                <Sparkles size={14} />
                Bảng điều khiển Journey
              </span>
              <h2 className="mothership-dashboard__intro-title">
                Tiếp tục hành trình thông minh cùng Meowl
              </h2>
              <p className="mothership-dashboard__intro-subtitle">
                Theo dõi roadmap, học theo từng bước và xử lý task còn tồn đọng
                trong một màn hình duy nhất.
              </p>
            </div>

            <div className="mothership-dashboard__intro-metrics">
              <article className="mothership-dashboard__intro-metric">
                <Compass size={15} />
                <div>
                  <strong>{roadmaps.length}</strong>
                  <span>Roadmap đang có</span>
                </div>
              </article>
              <article className="mothership-dashboard__intro-metric">
                <BookOpen size={15} />
                <div>
                  <strong>{enrolledCourses.length}</strong>
                  <span>Khóa học đang học</span>
                </div>
              </article>
              <article className="mothership-dashboard__intro-metric">
                <Bot size={15} />
                <div>
                  <strong>{totalOverdueTasks}</strong>
                  <span>Task quá hạn cần xử lý</span>
                </div>
              </article>
            </div>

            <div className="mothership-dashboard__intro-actions">
              <button
                type="button"
                className="mothership-dashboard__intro-action mothership-dashboard__intro-action--primary"
                onClick={() => navigate("/journey")}
              >
                Mở Journey ngay
                <ArrowRight size={14} />
              </button>
              <button
                type="button"
                className="mothership-dashboard__intro-action mothership-dashboard__intro-action--ghost"
                onClick={() => navigate("/roadmap")}
              >
                Xem tất cả Roadmap
              </button>
            </div>
          </div>

          <div className="mothership-dashboard__intro-meowl-wrap" aria-hidden="true">
            <img
              src={meowlUser}
              alt=""
              className="mothership-dashboard__intro-meowl"
              loading="lazy"
            />
          </div>
        </section> */}

        {/* System Status (Learning Streak) */}
        <div id="learning-streak-section">
          <SystemStatus
            currentStreak={learningStreak.current}
            longestStreak={learningStreak.longest}
            weeklyGoal={learningStreak.weeklyGoal}
            thisWeek={learningStreak.thisWeek}
            streakLabel={translations?.dashboard?.streak || "System Uptime"}
            daysLabel={translations?.dashboard?.days || "Days"}
            currentStreakLabel={
              translations?.dashboard?.currentStreak || "Current Sync"
            }
            longestStreakLabel={
              translations?.dashboard?.longestStreak || "Max Uptime"
            }
            weeklyGoalLabel={
              translations?.dashboard?.weeklyGoal || "Weekly Target"
            }
          />
        </div>

        {/* Resource Monitor (Stats Grid) */}
        <div className="mothership-dashboard__stats-grid">
          {stats.map((stat, index) => (
            <StatUnit
              key={index}
              value={stat.value}
              label={stat.label}
              change={stat.change}
              trend={stat.trend}
              icon={stat.icon}
              color={stat.color}
              delay={0.1 + index * 0.05}
            />
          ))}
        </div>

        {/* Center Operations: Study Plan & Reports */}
        <section id="study-plan-section" className="mothership-dashboard__center-ops">
          {/* Analyst Track (Strategic Overview) */}
          <AnalystTrack roadmaps={roadmaps} />

          {/* Learning Report History Section */}
          <LearningReportHistory
            maxItems={5}
            showGenerateButton={true}
            title="Báo cáo học tập"
          />
        </section>

        {/* Usage Limits */}
        {(featureUsage || usageLimits) && (
          <SystemLimits
            usageLimits={usageLimits}
            featureUsage={featureUsage}
            isLoading={featureUsageLoading}
            error={featureUsageError}
            roleNames={userRoles}
          />
        )}

        {/* Active Simulations (Current Courses) */}
        <div id="modules-section">
          <ActiveModules
            courses={recentCourses}
            title="Khóa Học Đang Học"
            onCourseClick={handleCourseClick}
            continueLabel={translations?.dashboard?.continue || "Tiếp tục học"}
            onJoinGroup={onJoinGroup}
          />
        </div>

        {/* Favorite Mentors */}
        <div id="mentors-section">
          <FavoriteMentors 
            mentors={favoriteMentors} 
            onOpenChat={handleOpenChat}
          />
        </div>
      </div>

      {/* Mentor Chat Modal */}
      {selectedMentorForChat && (
        <MentorChatModal
          isOpen={chatModalOpen}
          onClose={() => setChatModalOpen(false)}
          mentorId={selectedMentorForChat.id.toString()}
          mentorName={`${selectedMentorForChat.firstName} ${selectedMentorForChat.lastName}`}
          mentorAvatar={selectedMentorForChat.avatar || ""}
        />
      )}
    </div>
  );
};

export default MothershipDashboard;
