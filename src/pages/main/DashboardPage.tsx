import { 
  TrendingUp, BookOpen, Briefcase, Award, Target, 
  Calendar, ChevronRight, BarChart2, Book, 
  FileText, Zap, Plus, Flame
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { RoadmapSection } from '../../components/roadmap';
import { learningRoadmapsData } from '../../data/roadmapsData';
import MeowlGuide from '../../components/MeowlGuide';
import '../../styles/DashboardPage.css';
import '../../styles/RoadmapStyles.css';

const DashboardPage = () => {
  const { translations } = useLanguage();

  const stats = [
    {
      title: translations.dashboard.completedCourses,
      value: '12',
      change: '+3 this month',
      icon: BookOpen,
      color: 'theme-blue',
      trend: 'up'
    },
    {
      title: translations.dashboard.activeCourses,
      value: '8',
      change: '+2 this week',
      icon: Briefcase,
      color: 'theme-green',
      trend: 'up'
    },
    {
      title: translations.dashboard.achievements,
      value: '15',
      change: '+5 this month',
      icon: Award,
      color: 'theme-purple',
      trend: 'up'
    },
    {
      title: translations.dashboard.learningProgress,
      value: '$1,250',
      change: '+$230 this month',
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

  return (
    <div className="sv-dashboard">
      <div className="sv-dashboard-container">
        {/* Welcome Section */}
        <div className="sv-dashboard-header">
          <div className="sv-dashboard-header__content">
            <div className="sv-dashboard-header__text">
              <h1 className="sv-dashboard-header__title">
                {translations.dashboard.welcomeBack}, InnoVibe Team!
              </h1>
              <p className="sv-dashboard-header__description">
                Track your learning progress and achieve your goals
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
          {/* ... rest of streak calendar ... */}
        </div>

        {/* Stats Grid */}
        <div className="sv-stats-grid">
          {stats.map((stat) => (
            <div key={stat.title} className="sv-stat-card hover-lift">
              <div className="sv-stat-card__header">
                <div className={`sv-stat-card__icon-wrapper ${stat.color}`}>
                  <stat.icon className="sv-stat-card__icon text-white" />
                </div>
                <div className="text-right">
                  <div className="sv-stat-card__value">{stat.value}</div>
                  <div className={`sv-stat-card__change ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.change}
                  </div>
                </div>
              </div>
              <div className="sv-stat-card__title">{stat.title}</div>
            </div>
          ))}
        </div>

        {/* Learning Roadmap Section */}
        <RoadmapSection roadmaps={learningRoadmapsData} />

        <div className="sv-dashboard-grid">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Current Courses */}
            <div className="glass-effect rounded-xl p-6">
              <div className="sv-section-header">
                <div className="sv-section-header__title">
                  <Book className="h-5 w-5 mr-2" />
                  <h2>{translations.dashboard.activeCourses}</h2>
                </div>
                <button className="sv-button sv-button--text">
                  {translations.common.viewAll}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </button>
              </div>
              {/* ... rest of courses grid ... */}
            </div>

            {/* Learning Goals */}
            <div className="glass-effect rounded-xl p-6">
              <div className="sv-section-header">
                <div className="sv-section-header__title">
                  <Target className="h-5 w-5 mr-2" />
                  <h2>{translations.dashboard.weeklyGoal}</h2>
                </div>
                <button className="sv-button sv-button--text">
                  Add
                  <Plus className="h-4 w-4 ml-1" />
                </button>
              </div>
              {/* ... rest of goals grid ... */}
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
              {/* ... rest of skills list ... */}
            </div>

            {/* Achievements */}
            <div className="sv-sidebar-section">
              <div className="sv-section-header">
                <div className="sv-section-header__title">
                  <Award className="sv-section-header__icon" />
                  <h2>{translations.dashboard.recentAchievements}</h2>
                </div>
              </div>
              {/* ... rest of achievements list ... */}
            </div>

            {/* Upcoming Deadlines */}
            <div className="sv-sidebar-section">
              <div className="sv-section-header">
                <div className="sv-section-header__title">
                  <Calendar className="sv-section-header__icon" />
                  <h2>{translations.dashboard.upcomingDeadlines}</h2>
                </div>
              </div>
              {/* ... rest of deadlines list ... */}
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