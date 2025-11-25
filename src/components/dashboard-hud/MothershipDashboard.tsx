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
}

const MothershipDashboard: React.FC<MothershipDashboardProps> = ({
  userName = 'InnoVibe Team',
  translations = {}
}) => {
  const navigate = useNavigate();

  // Data mapping from old structure to new Sci-Fi theme
  const stats = [
    {
      value: 12,
      label: translations?.dashboard?.stats?.coursesInProgress || 'Modules Synced',
      change: '+3 this cycle',
      trend: 'up' as const,
      icon: BookOpen,
      color: 'cyan' as const
    },
    {
      value: 8,
      label: translations?.dashboard?.stats?.projectsCompleted || 'Missions Complete',
      change: '+2 this cycle',
      trend: 'up' as const,
      icon: Briefcase,
      color: 'green' as const
    },
    {
      value: 15,
      label: translations?.dashboard?.stats?.certificatesEarned || 'Badges Unlocked',
      change: '+5 this cycle',
      trend: 'up' as const,
      icon: Award,
      color: 'purple' as const
    },
    {
      value: 1250,
      label: translations?.dashboard?.stats?.totalHours || 'Energy Units',
      change: '+230 this cycle',
      trend: 'up' as const,
      icon: TrendingUp,
      color: 'orange' as const
    }
  ];

  const learningStreak = {
    current: 15,
    longest: 30,
    thisWeek: [true, true, true, false, true, true, false],
    weeklyGoal: 5
  };

  const recentCourses = [
    {
      id: 1,
      title: 'Advanced React Patterns',
      progress: 75,
      totalLessons: 20,
      completedLessons: 15,
      instructor: 'John Smith',
      thumbnail: 'https://images.pexels.com/photos/11035471/pexels-photo-11035471.jpeg?auto=compress&cs=tinysrgb&w=200',
      lastAccessed: '2 hours ago',
      nextLesson: 'Custom Hooks Implementation',
      estimatedTime: '45 min'
    },
    {
      id: 2,
      title: 'UI/UX Design Principles',
      progress: 60,
      totalLessons: 16,
      completedLessons: 10,
      instructor: 'Sarah Johnson',
      thumbnail: 'https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=200',
      lastAccessed: '1 day ago',
      nextLesson: 'User Research Methods',
      estimatedTime: '30 min'
    },
    {
      id: 3,
      title: 'Digital Marketing Strategy',
      progress: 90,
      totalLessons: 12,
      completedLessons: 11,
      instructor: 'Michael Brown',
      thumbnail: 'https://images.pexels.com/photos/265087/pexels-photo-265087.jpeg?auto=compress&cs=tinysrgb&w=200',
      lastAccessed: '3 days ago',
      nextLesson: 'Campaign Analytics',
      estimatedTime: '60 min'
    }
  ];

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
