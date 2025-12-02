import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Briefcase, Award, TrendingUp } from 'lucide-react';
import CommanderWelcome from './CommanderWelcome';
import SystemStatus from './SystemStatus';
import StatUnit from './StatUnit';
import ActiveModules from './ActiveModules';
import MissionLog from './MissionLog';
import './MothershipDashboard.css';
import './hud-styles.module.css';

interface MothershipDashboardProps {
  userName?: string;
  translations?: any;
  enrolledCourses?: any[];
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
  featureUsage?: any[];
}

const MothershipDashboard: React.FC<MothershipDashboardProps> = ({
  userName = 'InnoVibe Team',
  translations = {},
  enrolledCourses = [],
  userStats = {
    totalCourses: 0,
    totalHours: 0,
    completedProjects: 0,
    certificates: 0
  },
  cycleStats,
  usageLimits,
  featureUsage
}) => {
  const navigate = useNavigate();

  // Data mapping from old structure to new Sci-Fi theme
  const stats = [
    {
      value: userStats.totalCourses,
      label: translations?.dashboard?.stats?.coursesInProgress || 'Modules Synced',
      change: cycleStats ? `+${cycleStats.enrolledCoursesCount} this cycle` : '+3 this cycle',
      trend: 'up' as const,
      icon: BookOpen,
      color: 'cyan' as const
    },
    {
      value: userStats.completedProjects,
      label: translations?.dashboard?.stats?.projectsCompleted || 'Missions Complete',
      change: cycleStats?.completedProjectsCount ? `+${cycleStats.completedProjectsCount} this cycle` : '+0 this cycle',
      trend: 'up' as const,
      icon: Briefcase,
      color: 'green' as const
    },
    {
      value: userStats.certificates,
      label: translations?.dashboard?.stats?.certificatesEarned || 'Badges Unlocked',
      change: cycleStats?.certificatesCount ? `+${cycleStats.certificatesCount} this cycle` : '+0 this cycle',
      trend: 'up' as const,
      icon: Award,
      color: 'purple' as const
    },
    {
      value: userStats.totalHours,
      label: translations?.dashboard?.stats?.totalHours || 'Energy Units',
      change: cycleStats ? `+${cycleStats.totalHoursStudied} this cycle` : '+230 this cycle',
      trend: 'up' as const,
      icon: TrendingUp,
      color: 'orange' as const
    }
  ];

  const learningStreak = {
    current: cycleStats?.currentStreak || 0,
    longest: cycleStats?.longestStreak || 0,
    thisWeek: cycleStats?.weeklyActivity || [false, false, false, false, false, false, false],
    weeklyGoal: 5
  };

  // Use passed enrolledCourses if available, otherwise use fallback (or empty)
  const recentCourses = enrolledCourses.length > 0 ? enrolledCourses : [];

  const achievements = [
    {
      title: 'First Module Completed',
      icon: '🎓',
      date: '2024-01-15',
      points: 100,
      description: 'Completed your first simulation module'
    },
    {
      title: 'Top Performer',
      icon: '🏆',
      date: '2024-02-20',
      points: 250,
      description: 'Ranked in top 5% of pilots this cycle'
    },
    {
      title: 'Perfect Rating',
      icon: '⭐',
      date: '2024-03-10',
      points: 150,
      description: 'Received 5-star rating on mission'
    },
    {
      title: 'Skill Master',
      icon: '💎',
      date: '2024-03-25',
      points: 300,
      description: 'Achieved advanced proficiency in React'
    }
  ];

  const upcomingDeadlines = [
    {
      task: 'Complete React Advanced Module',
      date: '2024-04-05',
      type: 'simulation',
      priority: 'high' as const,
      timeLeft: '3 days'
    },
    {
      task: 'Submit UI Design Mission',
      date: '2024-04-07',
      type: 'project',
      priority: 'medium' as const,
      timeLeft: '5 days'
    },
    {
      task: 'Sync with Commander ABC',
      date: '2024-04-10',
      type: 'meeting',
      priority: 'low' as const,
      timeLeft: '1 week'
    }
  ];

  const handleViewPlan = () => {
    // Navigate to study plan or show modal
    console.log('View Study Plan clicked');
  };

  const handleResumeLearning = () => {
    // Navigate to last accessed course
    console.log('Resume Learning clicked');
  };

  const handleCourseClick = (courseId: number) => {
    // Navigate to course detail
    console.log('Course clicked:', courseId);
  };

  return (
    <div className="mothership-dashboard">
      <div className="mothership-dashboard__container">
        {/* Commander Welcome */}
        <CommanderWelcome
          userName={userName}
          subtitle="COMMAND CENTER OPERATIONAL"
          onViewPlan={handleViewPlan}
          onResumeLearning={handleResumeLearning}
          viewPlanText={translations?.dashboard?.viewStudyPlan || 'View Study Plan'}
          resumeText={translations?.dashboard?.resumeLearning || 'Resume Learning'}
        />

        {/* System Status (Learning Streak) */}
        <SystemStatus
          currentStreak={learningStreak.current}
          longestStreak={learningStreak.longest}
          weeklyGoal={learningStreak.weeklyGoal}
          thisWeek={learningStreak.thisWeek}
          streakLabel={translations?.dashboard?.streak || 'System Uptime'}
          daysLabel={translations?.dashboard?.days || 'Days'}
          currentStreakLabel={translations?.dashboard?.currentStreak || 'Current Sync'}
          longestStreakLabel={translations?.dashboard?.longestStreak || 'Max Uptime'}
          weeklyGoalLabel={translations?.dashboard?.weeklyGoal || 'Weekly Target'}
        />

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

        {/* Usage Limits */}
        {(featureUsage || usageLimits) && (
          <div className="mothership-dashboard__usage-limits" style={{ marginTop: '20px', padding: '15px', background: 'rgba(0, 20, 40, 0.6)', border: '1px solid rgba(0, 255, 255, 0.2)', borderRadius: '8px' }}>
            <h3 style={{ color: '#00ffff', marginBottom: '10px', fontFamily: 'Orbitron, sans-serif', fontSize: '14px' }}>SYSTEM LIMITS</h3>
            <div style={{ display: 'flex', gap: '20px', color: '#a0c0ff', fontSize: '12px', flexWrap: 'wrap' }}>
               {featureUsage ? (
                 featureUsage.map((feature: any, idx: number) => (
                   <div key={idx}>
                     <span style={{ color: '#fff' }}>{feature.featureName}:</span>{' '}
                     {feature.isUnlimited ? 'Unlimited' : 
                      feature.bonusMultiplier ? `x${feature.bonusMultiplier}` :
                      feature.limit === null ? (feature.isEnabled ? 'Enabled' : 'Disabled') :
                      `${feature.currentUsage}/${feature.limit}`}
                   </div>
                 ))
               ) : (
                 <>
                   <div>
                     <span style={{ color: '#fff' }}>Chatbot Requests:</span> {usageLimits?.CHATBOT_REQUESTS}
                   </div>
                   <div>
                     <span style={{ color: '#fff' }}>Roadmaps:</span> {usageLimits?.ROADM_MAPS_LIMIT}
                   </div>
                   <div>
                     <span style={{ color: '#fff' }}>Coin Multiplier:</span> x{usageLimits?.COIN_MULTIPLIER}
                   </div>
                 </>
               )}
            </div>
          </div>
        )}

        {/* Active Simulations (Current Courses) */}
        <ActiveModules
          courses={recentCourses}
          title="Active Simulations"
          onCourseClick={handleCourseClick}
          continueLabel={translations?.dashboard?.continue || 'Continue'}
        />

        {/* Mission Log (Achievements + Deadlines) */}
        <MissionLog
          achievements={achievements}
          deadlines={upcomingDeadlines}
          achievementsTitle="Recent Achievements"
          deadlinesTitle="Proximity Alerts"
        />
      </div>
    </div>
  );
};

export default MothershipDashboard;
