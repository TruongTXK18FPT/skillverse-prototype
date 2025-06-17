import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, BookOpen, Briefcase, User, MessageSquare, Award, 
  TrendingUp, Users, Star, Sun, Moon, Sparkles, Brain, Target,
  Code, Zap, Globe, ChevronRight
} from 'lucide-react';
import '../../styles/HomePage.css'; // Import your CSS styles

const FlyingSparkles = () => (
  <div className="flying-icon">
    <Sparkles size={32} />
    <div className="flying-sparkle"></div>
    <div className="flying-sparkle"></div>
    <div className="flying-sparkle"></div>
  </div>
);

const HomePage = () => {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'light';
  });

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    setIsVisible(true);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const features = [
    {
      icon: Brain,
      title: 'AI Career Advisor',
      description: 'Get personalized career guidance and skill recommendations powered by advanced AI',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Code,
      title: 'Interactive Learning',
      description: 'Learn by doing with hands-on coding exercises and real-world projects',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: Target,
      title: 'Smart Portfolio',
      description: 'Showcase your skills and projects with an AI-powered dynamic portfolio',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Zap,
      title: 'Instant Feedback',
      description: 'Get real-time feedback on your code and projects from AI and experts',
      color: 'from-orange-500 to-red-500'
    }
  ];

  const stats = [
    { 
      label: 'Active Learners', 
      value: '10,000+', 
      icon: Users,
      description: 'Growing community'
    },
    { 
      label: 'Expert Courses', 
      value: '500+', 
      icon: BookOpen,
      description: 'Curated content'
    },
    { 
      label: 'Projects Completed', 
      value: '2,500+', 
      icon: Briefcase,
      description: 'Real-world experience'
    },
    { 
      label: 'Success Rate', 
      value: '95%', 
      icon: Star,
      description: 'Career advancement'
    }
  ];

  return (
    <div className={`homepage-container ${isVisible ? 'visible' : ''}`}>
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1 className="hero-title">
            <FlyingSparkles />
            Transform Your Career with AI
          </h1>
          <p className="hero-description">
            Unlock your potential with our AI-powered learning platform. Get personalized guidance,
            master in-demand skills, and accelerate your career growth.
          </p>
          <div className="button-container">
            <Link to="/courses" className="primary-button">
              <Sparkles size={20} />
              <span>Start Learning</span>
              <ChevronRight size={16} />
            </Link>
            <Link to="/chatbot" className="secondary-button">
              <Brain size={20} />
              <span>AI Career Guide</span>
              <ChevronRight size={16} />
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
              Experience the future of learning with our AI-powered platform that adapts to your needs
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
                  <feature.icon size={24} />
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
                  <stat.icon size={24} className="stat-icon" />
                </div>
                <div className="stat-info">
                  <div className="stat-value floating">{stat.value}</div>
                  <div className="stat-label">{stat.label}</div>
                  <div className="stat-description">{stat.description}</div>
                </div>
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
              Your Path to Success
            </h2>
            <p className="section-description">
              A personalized learning journey powered by AI
            </p>
          </div>

          <div className="steps-grid">
            {[
              {
                number: 1,
                title: "Discover Your Path",
                description: "Get AI-powered career guidance tailored to your goals",
                icon: Brain
              },
              {
                number: 2,
                title: "Learn & Practice",
                description: "Master skills with interactive courses and projects",
                icon: Code
              },
              {
                number: 3,
                title: "Track Progress",
                description: "Monitor your growth with AI-powered insights",
                icon: Target
              }
            ].map((step, index) => (
              <div 
                key={index} 
                className="step-item"
                style={{ animationDelay: `${index * 0.3}s` }}
              >
                <div className="step-number">{step.number}</div>
                <step.icon size={24} className="step-icon" />
                <h3 className="step-title">{step.title}</h3>
                <p className="feature-description">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="section-container text-center">
          <h2 className="cta-title">
            Ready to Transform Your Career?
          </h2>
          <p className="cta-description">
            Join thousands of successful learners who have accelerated their careers with Skillverse
          </p>
          <div className="button-container">
            <Link to="/dashboard" className="primary-button">
              <Sparkles size={20} />
              <span>Get Started Free</span>
              <ChevronRight size={16} />
            </Link>
            <Link to="/courses" className="secondary-button">
              <BookOpen size={20} />
              <span>Explore Courses</span>
              <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;