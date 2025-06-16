import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, BookOpen, Briefcase, User, MessageSquare, Award, 
  TrendingUp, Users, Star, Sun, Moon, Sparkles, Brain, Target,
  Code, Zap, Globe
} from 'lucide-react';
import '../../styles/HomePage.css';

const HomePage = () => {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const features = [
    {
      icon: Brain,
      title: 'AI Career Advisor',
      description: 'Smart chatbot for personalized career guidance and skill recommendations',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Code,
      title: 'Micro Courses',
      description: 'Bite-sized, focused courses with practical skills you can apply immediately',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: Target,
      title: 'Smart Portfolio',
      description: 'Automatically build and showcase your skills, projects, and achievements',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Zap,
      title: 'Micro Jobs',
      description: 'Real-world projects to help you earn while you learn and gain experience',
      color: 'from-orange-500 to-red-500'
    }
  ];

  const stats = [
    { label: 'Active Learners', value: '10,000+', icon: Users },
    { label: 'Expert Courses', value: '500+', icon: BookOpen },
    { label: 'Projects Completed', value: '2,500+', icon: Briefcase },
    { label: 'Success Rate', value: '95%', icon: Star }
  ];

  return (
    <div>
      {/* Theme Switcher */}
      <button 
        onClick={toggleTheme} 
        className="theme-switcher"
        aria-label="Toggle theme"
      >
        <div className="theme-button">
          {theme === 'light' ? (
            <Moon className="w-6 h-6 text-gray-800" />
          ) : (
            <Sun className="w-6 h-6 text-yellow-400" />
          )}
        </div>
      </button>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1 className="hero-title">
            Learn • Practice • Succeed
          </h1>
          <p className="hero-description">
            Your all-in-one platform for career growth, combining AI-powered guidance,
            practical learning, and real-world opportunities
          </p>
          <div className="button-container">
            <Link to="/courses" className="primary-button">
              <Sparkles className="w-5 h-5" />
              <span>Start Learning</span>
            </Link>
            <Link to="/chatbot" className="secondary-button">
              <Brain className="w-5 h-5" />
              <span>Get Career Guidance</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">
              Why Choose Skillverse?
            </h2>
            <p className="section-description">
              An integrated ecosystem that combines guidance, learning, and practical experience
              to accelerate your career growth
            </p>
          </div>

          <div className="features-grid">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="feature-card"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <div className="feature-icon">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="section-container">
          <div className="stats-grid">
            {stats.map((stat, index) => (
              <div 
                key={index} 
                className="stat-item"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <div className="stat-icon-container">
                  <stat.icon className="stat-icon" />
                </div>
                <div className="stat-value floating">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="how-it-works">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">
              Your Journey to Success
            </h2>
            <p className="section-description">
              A simple yet powerful process to accelerate your career growth
            </p>
          </div>

          <div className="steps-grid">
            <div className="step-item">
              <div className="step-number">1</div>
              <h3 className="step-title">Discover Your Path</h3>
              <p className="feature-description">
                Get personalized career guidance from our AI advisor to find your perfect path
              </p>
            </div>

            <div className="step-item">
              <div className="step-number">2</div>
              <h3 className="step-title">Learn & Practice</h3>
              <p className="feature-description">
                Master in-demand skills through micro-courses and hands-on projects
              </p>
            </div>

            <div className="step-item">
              <div className="step-number">3</div>
              <h3 className="step-title">Build & Earn</h3>
              <p className="feature-description">
                Apply your skills to real projects and start building your career
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="section-container text-center">
          <h2 className="cta-title">
            Ready to Start Your Journey?
          </h2>
          <p className="cta-description">
            Join thousands of successful learners who have transformed their careers with Skillverse
          </p>
          <div className="button-container">
            <Link to="/dashboard" className="primary-button">
              <TrendingUp className="w-5 h-5" />
              <span>Get Started Free</span>
            </Link>
            <Link to="/courses" className="secondary-button">
              <BookOpen className="w-5 h-5" />
              <span>Browse Courses</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;