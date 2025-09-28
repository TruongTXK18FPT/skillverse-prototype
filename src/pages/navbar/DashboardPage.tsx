import { 
  TrendingUp, BookOpen, Briefcase, Award, Clock, Target, 
  Calendar, ChevronRight, BarChart2, Book, 
  Clock8, FileText, Zap, 
  Play, Plus, UserIcon, Flame
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import MeowlGuide from '../../components/MeowlGuide';
import '../../styles/DashboardPage.css';
import { useNavigate } from 'react-router-dom';
const DashboardPage = () => {
  const { translations } = useLanguage();
   const navigate = useNavigate();
  const stats = [
    {
      title: translations?.dashboard?.stats?.coursesInProgress || 'Courses in Progress',
      value: '12',
      change: '+3 this month',
      icon: BookOpen,
      color: 'theme-blue',
      trend: 'up'
    },
    {
      title: translations?.dashboard?.stats?.projectsCompleted || 'Projects Completed',
      value: '8',
      change: '+2 this week',
      icon: Briefcase,
      color: 'theme-green',
      trend: 'up'
    },
    {
      title: translations?.dashboard?.stats?.certificatesEarned || 'Certificates Earned',
      value: '15',
      change: '+5 this month',
      icon: Award,
      color: 'theme-purple',
      trend: 'up'
    },
    {
      title: translations?.dashboard?.stats?.totalHours || 'Total Learning Hours',
      value: '1,250',
      change: '+230 this month',
      icon: TrendingUp,
      color: 'theme-orange',
      trend: 'up'
    }
  ];

  const learningStreak = {
    current: 15,
    longest: 30,
    thisWeek: [true, true, true, false, true, true, false],
    weeklyGoal: 5
  };

  const skillProgress = [
    { name: 'React.js', progress: 75, category: 'Frontend' },
    { name: 'Node.js', progress: 60, category: 'Backend' },
    { name: 'UI/UX Design', progress: 85, category: 'Design' },
    { name: 'TypeScript', progress: 70, category: 'Programming' }
  ];

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

  const learningGoals = [
    { title: 'Complete React Course', deadline: '2024-04-15', progress: 75 },
    { title: 'Build Portfolio Project', deadline: '2024-04-30', progress: 40 },
    { title: 'Earn AWS Certification', deadline: '2024-05-15', progress: 25 }
  ];

  const achievements = [
    { 
      title: 'First Course Completed', 
      icon: '🎓', 
      date: '2024-01-15',
      points: 100,
      description: 'Completed your first course on the platform'
    },
    { 
      title: 'Top Performer', 
      icon: '🏆', 
      date: '2024-02-20',
      points: 250,
      description: 'Ranked in top 5% of students this month'
    },
    { 
      title: 'Perfect Rating', 
      icon: '⭐', 
      date: '2024-03-10',
      points: 150,
      description: 'Received 5-star rating on your project'
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
      task: 'Complete React Advanced Course', 
      date: '2024-04-05', 
      type: 'course',
      priority: 'high',
      timeLeft: '3 days'
    },
    { 
      task: 'Submit UI Design Project', 
      date: '2024-04-07', 
      type: 'project',
      priority: 'medium',
      timeLeft: '5 days'
    },
    { 
      task: 'Meeting with Client ABC', 
      date: '2024-04-10', 
      type: 'meeting',
      priority: 'low',
      timeLeft: '1 week'
    }
  ];

  return (
    <div className="sv-dashboard">
      <div className="sv-dashboard-container">
        {/* Welcome Section */}
        <div className="sv-dashboard-header">
          <div className="sv-dashboard-header__content">
            <div className="sv-dashboard-header__text">
              <h1 className="sv-dashboard-header__title">{translations.dashboard.welcomeBack}, InnoVibe Team!</h1>
              <p className="sv-dashboard-header__description">
                {translations.dashboard.learningProgress}
              </p>
            </div>
            <div className="sv-dashboard-header__actions">
              <button className="sv-button sv-button--primary">
                <FileText className="sv-button__icon" />
                {translations.dashboard.viewStudyPlan}
              </button>
              <button className="sv-button sv-button--primary">
                <Zap className="sv-button__icon" />
                {translations.dashboard.resumeLearning}
              </button>
            </div>
          </div>
        </div>

        {/* Learning Streak */}
        <div className="sv-streak-card glass-effect">
          <div className="sv-streak-card__header">
            <div>
              <h3 className="sv-streak-card__title">
                <div className="sv-streak-fire">
                  <div className="sv-streak-fire__glow"></div>
                  <Flame className="sv-streak-fire__icon" />
                </div>
                {translations.dashboard.streak}
                <div className="sv-streak-sparkle"></div>
                <div className="sv-streak-sparkle"></div>
                <div className="sv-streak-sparkle"></div>
                <div className="sv-streak-sparkle"></div>
              </h3>
              <p className="sv-streak-card__subtitle">
                {learningStreak.current} {translations.dashboard.days} {translations.dashboard.currentStreak}
              </p>
            </div>
            <div className="sv-streak-card__stats">
              <div className="sv-streak-stat">
                <span className="sv-streak-stat__label">{translations.dashboard.longestStreak}</span>
                <span className="sv-streak-stat__value">{learningStreak.longest} {translations.dashboard.days}</span>
              </div>
              <div className="sv-streak-stat">
                <span className="sv-streak-stat__label">{translations.dashboard.weeklyGoal}</span>
                <span className="sv-streak-stat__value">{learningStreak.weeklyGoal} {translations.dashboard.days}</span>
              </div>
            </div>
          </div>
          <div className="sv-streak-calendar">
            {learningStreak.thisWeek.map((day, index) => (
              <div key={index} className={`sv-streak-day ${day ? 'sv-streak-day--completed' : ''}`}>
                <div className="sv-streak-day__indicator"></div>
                <span className="sv-streak-day__label">
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'][index]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="sv-stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className="dashboard-sv-stat-card hover-lift">
              <div className="dashboard-sv-stat-card__header">
                <div className={`dashboard-sv-stat-card__icon-wrapper ${stat.color}`}>
                  <stat.icon className="dashboard-sv-stat-card__icon text-white" />
                </div>
                <div className="text-right">
                  <div className="dashboard-sv-stat-card__value">{stat.value}</div>
                  <div className={`dashboard-sv-stat-card__change ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.change}
                  </div>
                </div>
              </div>
              <div className="dashboard-sv-stat-card__title">{stat.title}</div>
            </div>
          ))}
        </div>

        <div className="sv-dashboard-grid">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Current Courses */}
            <div className="glass-effect rounded-xl p-6">
              <div className="sv-section-header">
                <div className="sv-section-header__title">
                  <Book className="h-5 w-5 mr-2" />
                  <h2>{translations.dashboard.sections.currentCourses}</h2>
                </div>
                <button className="sv-button sv-button--text">
                  {translations.common.viewAll}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </button>
              </div>
              <div className="sv-courses-grid">
                {recentCourses.map((course) => (
                  <div key={course.id} className="sv-course-card">
                    <div className="sv-course-card__media">
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="sv-course-card__image"
                      />
                      <div className="sv-course-card__overlay">
                        <button className="sv-button sv-button--icon">
                          <Play className="h-8 w-8" />
                        </button>
                      </div>
                    </div>
                    <div className="sv-course-card__content">
                      <h3 className="sv-course-card__title">{course.title}</h3>
                      <p className="sv-course-card__instructor">
                        <UserIcon className="h-4 w-4 mr-1" />
                        {course.instructor}
                      </p>
                      <div className="sv-course-card__meta">
                        <span className="sv-course-card__last-access">
                          <Clock8 className="h-4 w-4 mr-1" />
                          {course.lastAccessed}
                        </span>
                        <span className="sv-course-card__time">
                          <Clock className="h-4 w-4 mr-1" />
                          {course.estimatedTime}
                        </span>
                      </div>
                      <div className="sv-course-progress">
                        <div className="sv-course-progress__header">
                          <span className="sv-course-progress__text">Progress</span>
                          <span className="sv-course-progress__value">
                            {course.completedLessons}/{course.totalLessons}
                          </span>
                        </div>
                        <div className="sv-course-progress__bar">
                          <div
                            className="sv-course-progress__fill"
                            style={{ width: `${course.progress}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="sv-course-card__next">
                        <span className="sv-course-card__next-label">Next Lesson:</span>
                        <span className="sv-course-card__next-title">{course.nextLesson}</span>
                      </div>
                      <button className="sv-button sv-button--primary sv-button--block"
                        onClick={() => navigate('/course-learning')}>
                        <Play className="h-4 w-4 mr-2" />
                        Continue Learning
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Learning Goals */}
            <div className="glass-effect rounded-xl p-6">
              <div className="sv-section-header">
                <div className="sv-section-header__title">
                  <Target className="h-5 w-5 mr-2" />
                  <h2>{translations.dashboard.sections.learningGoals}</h2>
                </div>
                <button className="sv-button sv-button--text">
                  {translations.dashboard.goals.addGoal}
                  <Plus className="h-4 w-4 ml-1" />
                </button>
              </div>
              <div className="sv-goals-grid">
                {learningGoals.map((goal, index) => (
                  <div key={index} className="sv-goal-card">
                    <div className="sv-goal-card__header">
                      <h3 className="sv-goal-card__title">{goal.title}</h3>
                      <div className="sv-goal-card__deadline">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>{goal.deadline}</span>
                      </div>
                    </div>
                    <div className="sv-goal-progress">
                      <div className="sv-goal-progress__bar">
                        <div
                          className="sv-goal-progress__fill"
                          style={{ width: `${goal.progress}%` }}
                        ></div>
                      </div>
                      <span className="sv-goal-progress__value">{goal.progress}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div>
            {/* Skill Progress */}
            <div className="sv-sidebar-section">
              <div className="sv-section-header">
                <div className="sv-section-header__title">
                  <BarChart2 className="sv-section-header__icon" />
                  <h2>{translations.dashboard.skillProgress}</h2>
                </div>
              </div>
              <div className="sv-skills-list">
                {skillProgress.map((skill, index) => (
                  <div key={index} className="sv-skill-item">
                    <div className="sv-skill-item__header">
                      <div>
                        <h4 className="sv-skill-item__name">{skill.name}</h4>
                        <span className="sv-skill-item__category">{skill.category}</span>
                      </div>
                      <span className="sv-skill-item__value">{skill.progress}%</span>
                    </div>
                    <div className="sv-skill-progress">
                      <div
                        className="sv-skill-progress__fill"
                        style={{ width: `${skill.progress}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Achievements */}
            <div className="sv-sidebar-section">
              <div className="sv-section-header">
                <div className="sv-section-header__title">
                  <Award className="sv-section-header__icon" />
                  <h2>{translations.dashboard.recentAchievements}</h2>
                </div>
              </div>
              <div className="sv-achievements-list">
                {achievements.map((achievement, index) => (
                  <div key={index} className="sv-achievement-card">
                    <div className="sv-achievement-card__icon">
                      {achievement.icon}
                    </div>
                    <div className="sv-achievement-card__content">
                      <h4 className="sv-achievement-card__title">{achievement.title}</h4>
                      <p className="sv-achievement-card__description">{achievement.description}</p>
                      <div className="sv-achievement-card__meta">
                        <span className="sv-achievement-card__date">{achievement.date}</span>
                        <span className="sv-achievement-card__points">+{achievement.points} XP</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Deadlines */}
            <div className="sv-sidebar-section">
              <div className="sv-section-header">
                <div className="sv-section-header__title">
                  <Calendar className="sv-section-header__icon" />
                  <h2>Upcoming Deadlines</h2>
                </div>
              </div>
              <div className="sv-deadlines-list">
                {upcomingDeadlines.map((item, index) => (
                  <div key={index} className={`sv-deadline-card sv-deadline-card--${item.priority}`}>
                    <div className="sv-deadline-card__content">
                      <h4 className="sv-deadline-card__title">{item.task}</h4>
                      <div className="sv-deadline-card__meta">
                        <span className={`sv-deadline-card__priority sv-deadline-card__priority--${item.priority}`}>
                          {item.priority}
                        </span>
                        <span className="sv-deadline-card__time">
                          <Clock className="h-4 w-4 mr-1" />
                          {item.timeLeft} left
                        </span>
                      </div>
                    </div>
                    <div className="sv-deadline-card__type">
                      <span className={`sv-deadline-card__badge sv-deadline-card__badge--${item.type}`}>
                        {item.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Meowl Guide */}
      <MeowlGuide currentPage="dashboard" />
    </div>
  );
};

export default DashboardPage;