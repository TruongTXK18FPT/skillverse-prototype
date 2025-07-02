import { useState } from 'react';
import { 
  Download, Edit, Share2, Eye, Star, Award, Briefcase,
  Mail, MapPin, Globe, Linkedin,
  Trophy, Target, FileText, QrCode, Zap, TrendingUp,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import '../../styles/PortfolioPage.css';

const PortfolioPage = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('overview');
  const [privacySettings, setPrivacySettings] = useState({
    showProfile: true,
    showCertificates: true,
    showProjects: true,
    showMentorFeedback: true,
    showGamification: true
  });

  // Animation variants - optimized for faster transitions
  const containerVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.3,
        when: "beforeChildren",
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.2 }
    }
  };

  const sectionVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.2
      }
    },
    exit: { 
      opacity: 0,
      transition: { 
        duration: 0.1
      }
    }
  };

  // Handle section change with proper state management
  const handleSectionChange = (section: string) => {
    if (section !== activeSection) {
      setActiveSection(section);
    }
  };

  // Mock data for the portfolio
  const userProfile = {
    name: 'Tran Xuan Truong',
    title: 'Full-stack Developer & UI/UX Designer',
    bio: 'Passionate Computer Science student at FPT University with a strong foundation in web development and user interface design. Experienced with modern technologies including React, Node.js, and cloud platforms. Seeking opportunities to apply my skills in innovative projects and contribute to meaningful solutions.',
    careerGoals: 'Aspiring to become a senior full-stack developer with expertise in scalable web applications and user-centered design.',
    email: 'truongtranxuan41@gmail.com',
    phone: '0398648063',
    location: 'Ho Chi Minh City, Vietnam',
    linkedin: 'linkedin.com/in/tran-xuan-truong-ab00b7317',
    github: 'https://github.com/TruongTXK18FPT',
    avatar: 'https://media.licdn.com/dms/image/v2/D5603AQHZv1brnCXkRQ/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1719832250061?e=1755734400&v=beta&t=SQ9q4CPeTzzA7HbLrtjGiJEEeLRgWCYF4BpiTiU6FJw',
    videoIntro: null,
    languages: ['Vietnamese (Native)', 'English (Professional)']
  };

  const certificates = [
    {
      id: 1,
      title: 'Advanced React Development',
      category: 'Technical',
      provider: 'SkillVerse',
      completionDate: '2024-03-15',
      hours: 40,
      level: 'Advanced',
      badge: '🏆',
      skills: ['React', 'Redux', 'TypeScript', 'Testing'],
      verified: true
    },
    {
      id: 2,
      title: 'UI/UX Design Fundamentals',
      category: 'Design',
      provider: 'SkillVerse',
      completionDate: '2024-02-28',
      hours: 32,
      level: 'Intermediate',
      badge: '🎨',
      skills: ['Figma', 'Design Thinking', 'Prototyping', 'User Research'],
      verified: true
    },
    {
      id: 3,
      title: 'Leadership & Team Management',
      category: 'Soft Skills',
      provider: 'SkillVerse',
      completionDate: '2024-01-20',
      hours: 24,
      level: 'Intermediate',
      badge: '👥',
      skills: ['Leadership', 'Communication', 'Team Building', 'Conflict Resolution'],
      verified: true
    },
    {
      id: 4,
      title: 'Digital Marketing Strategy',
      category: 'Business',
      provider: 'SkillVerse',
      completionDate: '2024-01-10',
      hours: 28,
      level: 'Beginner',
      badge: '📈',
      skills: ['SEO', 'Social Media', 'Content Marketing', 'Analytics'],
      verified: true
    }
  ];

  const projects = [
    {
      id: 1,
      title: 'E-commerce Platform Redesign',
      description: 'Complete UI/UX redesign of an e-commerce platform, resulting in 35% increase in conversion rate and improved user satisfaction.',
      client: 'Fashion Store ABC',
      type: 'Micro-job',
      duration: '3 weeks',
      completionDate: '2024-03-10',
      tools: ['React', 'Tailwind CSS', 'Figma', 'Adobe XD'],
      outcomes: ['35% increase in conversion rate', 'Reduced bounce rate by 25%', 'Improved mobile responsiveness'],
      rating: 5,
      feedback: 'Outstanding work! Truong delivered exceptional results and exceeded our expectations.',
      attachments: ['mockup.pdf', 'user-flow.png'],
      image: 'https://images.pexels.com/photos/34577/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      id: 2,
      title: 'Restaurant Management System',
      description: 'Developed a comprehensive restaurant management system with table booking, menu management, and order tracking features.',
      client: 'Local Restaurant Chain',
      type: 'Freelance Project',
      duration: '6 weeks',
      completionDate: '2024-02-15',
      tools: ['Vue.js', 'Laravel', 'MySQL', 'Stripe API'],
      outcomes: ['Streamlined operations', 'Reduced manual errors by 80%', 'Improved customer experience'],
      rating: 5,
      feedback: 'Professional, reliable, and delivered a robust solution that transformed our operations.',
      attachments: ['demo-video.mp4', 'technical-docs.pdf'],
      image: 'https://images.pexels.com/photos/2291367/pexels-photo-2291367.jpeg?auto=compress&cs=tinysrgb&w=400'
    }
  ];

  const mentorFeedback = [
    {
      id: 1,
      mentorName: 'Dr. Sarah Chen',
      mentorTitle: 'Senior Software Engineer at Google',
      feedback: 'Truong demonstrates exceptional problem-solving skills and attention to detail. His code quality and documentation are consistently excellent.',
      skillEndorsed: 'React Development',
      date: '2024-03-20',
      verified: true
    },
    {
      id: 2,
      mentorName: 'Mark Johnson',
      mentorTitle: 'UX Design Lead at Adobe',
      feedback: 'Outstanding design thinking and user empathy. Truong has a natural talent for creating intuitive user experiences.',
      skillEndorsed: 'UI/UX Design',
      date: '2024-02-25',
      verified: true
    }
  ];

  const learningJourney = [
    { phase: 'Foundation', period: '2023-Q1', status: 'completed', courses: 3 },
    { phase: 'Specialization', period: '2023-Q2-Q4', status: 'completed', courses: 8 },
    { phase: 'Advanced Skills', period: '2024-Q1-Q2', status: 'completed', courses: 5 },
    { phase: 'Professional Practice', period: '2024-Q3', status: 'current', courses: 2 },
    { phase: 'Industry Expertise', period: '2024-Q4', status: 'upcoming', courses: 4 }
  ];

  const gamificationStats = {
    streak: 45,
    totalBadges: 12,
    leaderboardRank: 8,
    totalPoints: 2850,
    achievements: [
      { title: 'Early Bird', description: 'Completed 30 courses', icon: '🌅' },
      { title: 'Code Master', description: 'Perfect scores in 10 coding challenges', icon: '💻' },
      { title: 'Team Player', description: 'Top contributor in 5 group projects', icon: '🤝' }
    ]
  };

  const skills = [
    { name: 'React.js', level: 92, category: 'Technical', endorsed: 5 },
    { name: 'Node.js', level: 87, category: 'Technical', endorsed: 3 },
    { name: 'TypeScript', level: 85, category: 'Technical', endorsed: 4 },
    { name: 'UI/UX Design', level: 78, category: 'Design', endorsed: 6 },
    { name: 'Leadership', level: 75, category: 'Soft Skills', endorsed: 3 },
    { name: 'Project Management', level: 70, category: 'Business', endorsed: 2 }
  ];

  const handleExportCV = () => {
    // CV export logic would go here
    console.log('Exporting CV...');
  };

  const handlePreviewCV = () => {
    // Navigate to CV page
    navigate('/cv');
  };

  const handleSharePortfolio = () => {
    // Share logic would go here
    console.log('Sharing portfolio...');
  };

  const handleViewCertificate = (certificateId: number) => {
    // Navigate to certificate detail page
    navigate(`/certificate/${certificateId}`);
  };

  const togglePrivacySetting = (setting: string) => {
    setPrivacySettings(prev => ({
      ...prev,
      [setting]: !prev[setting as keyof typeof prev]
    }));
  };

  return (
    <motion.div 
      className={`sv-portfolio-container ${theme}`}
      data-theme={theme}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header Section */}
      <motion.div className="sv-portfolio-header" variants={itemVariants}>
        <div className="sv-portfolio-header__content">
          <h1 className="sv-portfolio-header__title">My Professional Portfolio</h1>
          <p className="sv-portfolio-header__subtitle">Showcase your learning journey and professional achievements</p>
        </div>
        
        <div className="sv-portfolio-header__actions">
          <motion.button 
            className="sv-btn sv-btn--outline"
            onClick={handlePreviewCV}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Eye size={18} />
            Preview CV
          </motion.button>
          <motion.button 
            className="sv-btn sv-btn--outline"
            onClick={handleSharePortfolio}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Share2 size={18} />
            Share Portfolio
          </motion.button>
          <motion.button 
            className="sv-btn sv-btn--primary"
            onClick={handleExportCV}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Download size={18} />
            Export CV
          </motion.button>
        </div>
      </motion.div>

      {/* Navigation Tabs */}
      <motion.div className="sv-portfolio-nav" variants={itemVariants}>
        <nav className="sv-portfolio-nav__tabs">
          {[
            { id: 'overview', label: 'Overview', icon: Eye },
            { id: 'certificates', label: 'Certificates', icon: Award },
            { id: 'projects', label: 'Projects', icon: Briefcase },
            { id: 'journey', label: 'Learning Journey', icon: TrendingUp },
            { id: 'feedback', label: 'Endorsements', icon: Users },
            { id: 'cv-builder', label: 'CV Builder', icon: FileText }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <motion.button
                key={tab.id}
                onClick={() => handleSectionChange(tab.id)}
                className={`sv-portfolio-nav__tab ${
                  activeSection === tab.id ? 'sv-portfolio-nav__tab--active' : ''
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
              </motion.button>
            );
          })}
        </nav>
      </motion.div>

      {/* Content Area */}
      <div className="sv-portfolio-content">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeSection}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={sectionVariants}
            style={{ position: 'relative', width: '100%' }}
          >
            {/* Profile Overview Section */}
            {activeSection === 'overview' && (
              <motion.div 
                className="sv-section"
                initial="hidden"
                animate="visible"
                variants={containerVariants}
              >
                <div className="sv-profile-overview">
                  {/* Profile Header */}
                  <motion.div className="sv-profile-card" variants={itemVariants}>
                    <div className="sv-profile-card__header">
                      <div className="sv-profile-avatar">
                        <img 
                          src={userProfile.avatar} 
                          alt={userProfile.name}
                          loading="eager"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                        <button className="sv-profile-avatar__edit">
                          <Edit size={16} />
                        </button>
                      </div>
                      
                      <div className="sv-profile-info">
                        <h2 className="sv-profile-info__name">{userProfile.name}</h2>
                        <p className="sv-profile-info__title">{userProfile.title}</p>
                        <p className="sv-profile-info__location">
                          <MapPin size={14} />
                          {userProfile.location}
                        </p>
                        
                        <div className="sv-profile-contact">
                          <a href={`mailto:${userProfile.email}`} className="sv-contact-link">
                            <Mail size={16} />
                          </a>
                          <a href={userProfile.linkedin} className="sv-contact-link">
                            <Linkedin size={16} />
                          </a>
                          <a href={userProfile.github} className="sv-contact-link">
                            <Globe size={16} />
                          </a>
                        </div>
                      </div>

                      <div className="sv-profile-actions">
                        <button className="sv-btn sv-btn--outline sv-btn--sm">
                          {userProfile.videoIntro ? 'Update Video' : 'Add Video Intro'}
                        </button>
                      </div>
                    </div>

                    <div className="sv-profile-card__content">
                      <div className="sv-profile-section">
                        <h3>About Me</h3>
                        <p>{userProfile.bio}</p>
                      </div>

                      <div className="sv-profile-section">
                        <h3>Career Goals</h3>
                        <p>{userProfile.careerGoals}</p>
                      </div>

                      <div className="sv-profile-section">
                        <h3>Languages</h3>
                        <div className="sv-tags">
                          {userProfile.languages.map((lang) => (
                            <span key={lang} className="sv-tag">{lang}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Quick Stats */}
                  <motion.div className="sv-stats-grid" variants={containerVariants}>
                    <div className="sv-stat-card">
                      <div className="sv-stat-card__icon">
                        <Award />
                      </div>
                      <div className="sv-stat-card__content">
                        <h3>{certificates.length}</h3>
                        <p>Certificates Earned</p>
                      </div>
                    </div>
                    <div className="sv-stat-card">
                      <div className="sv-stat-card__icon">
                        <Briefcase />
                      </div>
                      <div className="sv-stat-card__content">
                        <h3>{projects.length}</h3>
                        <p>Projects Completed</p>
                      </div>
                    </div>
                    <div className="sv-stat-card">
                      <div className="sv-stat-card__icon">
                        <Zap />
                      </div>
                      <div className="sv-stat-card__content">
                        <h3>{gamificationStats.streak}</h3>
                        <p>Day Learning Streak</p>
                      </div>
                    </div>
                    <div className="sv-stat-card">
                      <div className="sv-stat-card__icon">
                        <Trophy />
                      </div>
                      <div className="sv-stat-card__content">
                        <h3>#{gamificationStats.leaderboardRank}</h3>
                        <p>Leaderboard Rank</p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Skills Preview */}
                  <motion.div className="sv-skills-preview" variants={itemVariants}>
                    <h3>Top Skills</h3>
                    <div className="sv-skills-list">
                      {skills.slice(0, 6).map((skill) => (
                        <div key={skill.name} className="sv-skill-item">
                          <div className="sv-skill-header">
                            <span className="sv-skill-name">{skill.name}</span>
                            <span className="sv-skill-level">{skill.level}%</span>
                          </div>
                          <div className="sv-skill-bar">
                            <div 
                              className="sv-skill-progress" 
                              style={{ width: `${skill.level}%` }}
                            />
                          </div>
                          <div className="sv-skill-endorsements">
                            {skill.endorsed} endorsements
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* Certificates Section */}
            {activeSection === 'certificates' && (
              <div className="sv-section">
                <div className="sv-section-header">
                  <h2>Skill Wallet & Certificates</h2>
                  <p>Digital certificates earned from completed courses</p>
                </div>

                <div className="sv-certificate-categories">
                  {['All', 'Technical', 'Design', 'Soft Skills', 'Business'].map((category) => (
                    <button key={category} className="sv-filter-btn">
                      {category}
                    </button>
                  ))}
                </div>

                <div className="sv-certificates-grid">
                  {certificates.map((cert, index) => (
                    <motion.div
                      key={cert.id}
                      className="sv-certificate-card"
                      variants={itemVariants}
                      custom={index}
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="sv-certificate-header">
                        <div className="sv-certificate-badge">
                          <span className="sv-badge-emoji">{cert.badge}</span>
                          <span className="sv-badge-level">{cert.level}</span>
                        </div>
                        {cert.verified && (
                          <div className="sv-verified-badge">
                            <Award size={16} />
                            Verified
                          </div>
                        )}
                      </div>

                      <div className="sv-certificate-content">
                        <h3 className="sv-certificate-title">{cert.title}</h3>
                        <p className="sv-certificate-provider">{cert.provider}</p>
                        
                        <div className="sv-certificate-meta">
                          <span>{cert.hours} hours</span>
                          <span>{cert.completionDate}</span>
                        </div>

                        <div className="sv-certificate-skills">
                          {cert.skills.map((skill) => (
                            <span key={skill} className="sv-skill-tag">{skill}</span>
                          ))}
                        </div>
                      </div>

                      <div className="sv-certificate-actions">
                        <button 
                          className="sv-btn sv-btn--primary sv-btn--sm"
                          onClick={() => handleViewCertificate(cert.id)}
                        >
                          <Eye size={14} />
                          View Certificate
                        </button>
                        <button className="sv-btn sv-btn--outline sv-btn--sm">
                          <Download size={14} />
                          Download
                        </button>
                        <button className="sv-btn sv-btn--outline sv-btn--sm">
                          <Share2 size={14} />
                          Share
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Projects Section */}
            {activeSection === 'projects' && (
              <div className="sv-section">
                <div className="sv-section-header">
                  <h2>Project & Micro-Job Showcase</h2>
                  <p>Completed projects and professional work experiences</p>
                </div>

                {/* Project Filters */}
                <div className="sv-project-filters">
                  <div className="sv-filter-tabs">
                    {['All Projects', 'Micro-jobs', 'Freelance', 'Personal'].map((filter) => (
                      <button key={filter} className="sv-filter-tab sv-filter-tab--active">
                        {filter}
                      </button>
                    ))}
                  </div>
                  <div className="sv-project-stats">
                    <span className="sv-project-count">{projects.length} Projects</span>
                    <span className="sv-project-rating">
                      <Star size={14} className="sv-star-filled" />
                      4.9 Average Rating
                    </span>
                  </div>
                </div>

                <div className="sv-projects-showcase">
                  {projects.map((project, index) => (
                    <motion.div
                      key={project.id}
                      className="sv-project-showcase-card"
                      variants={itemVariants}
                      custom={index}
                      whileHover={{ y: -8 }}
                    >
                      <div className="sv-project-showcase-image">
                        <img src={project.image} alt={project.title} />
                        <div className="sv-project-showcase-overlay">
                          <div className="sv-project-showcase-actions">
                            <button className="sv-action-btn">
                              <Eye size={16} />
                            </button>
                            <button className="sv-action-btn">
                              <Share2 size={16} />
                            </button>
                          </div>
                        </div>
                        <div className="sv-project-showcase-type">{project.type}</div>
                      </div>

                      <div className="sv-project-showcase-content">
                        <div className="sv-project-showcase-header">
                          <div className="sv-project-showcase-info">
                            <h3 className="sv-project-showcase-title">{project.title}</h3>
                            <p className="sv-project-showcase-client">
                              <Briefcase size={14} />
                              {project.client}
                            </p>
                          </div>
                          <div className="sv-project-showcase-rating">
                            <div className="sv-rating-stars">
                              {Array.from({ length: 5 }, (_, i) => (
                                <Star
                                  key={`rating-${project.id}-${i}`}
                                  className={i < project.rating ? 'sv-star-filled' : 'sv-star-empty'}
                                  size={12}
                                />
                              ))}
                            </div>
                            <span className="sv-rating-value">{project.rating}.0</span>
                          </div>
                        </div>

                        <p className="sv-project-showcase-description">{project.description}</p>

                        <div className="sv-project-showcase-tech">
                          {project.tools.slice(0, 4).map((tool) => (
                            <span key={tool} className="sv-tech-badge">{tool}</span>
                          ))}
                          {project.tools.length > 4 && (
                            <span className="sv-tech-more">+{project.tools.length - 4}</span>
                          )}
                        </div>

                        <div className="sv-project-showcase-outcomes">
                          <h4>Key Results</h4>
                          <div className="sv-outcomes-list">
                            {project.outcomes.slice(0, 2).map((outcome, idx) => (
                              <div key={idx} className="sv-outcome-item">
                                <div className="sv-outcome-icon">✓</div>
                                <span>{outcome}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="sv-project-showcase-meta">
                          <div className="sv-project-showcase-duration">
                            <span>Duration: {project.duration}</span>
                          </div>
                          <div className="sv-project-showcase-date">
                            <span>Completed: {project.completionDate}</span>
                          </div>
                        </div>

                        <div className="sv-project-showcase-feedback">
                          <blockquote>"{project.feedback.slice(0, 80)}..."</blockquote>
                        </div>

                        <div className="sv-project-showcase-footer">
                          <div className="sv-project-attachments-count">
                            <FileText size={14} />
                            <span>{project.attachments.length} attachments</span>
                          </div>
                          <button className="sv-btn sv-btn--outline sv-btn--sm">
                            View Details
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Add Project CTA */}
                <div className="sv-add-project-cta">
                  <h3>Want to add more projects?</h3>
                  <p>Upload completed work to showcase your skills and attract more opportunities</p>
                  <button className="sv-btn sv-btn--primary">
                    <FileText size={18} />
                    Add New Project
                  </button>
                </div>
              </div>
            )}

            {/* Learning Journey Section */}
            {activeSection === 'journey' && (
              <div className="sv-section">
                <div className="sv-section-header">
                  <h2>Personalized Learning Journey</h2>
                  <p>Your progress timeline and AI-recommended next steps</p>
                </div>

                {/* Journey Overview Stats */}
                <div className="sv-journey-overview">
                  <div className="sv-journey-stats">
                    <div className="sv-journey-stat">
                      <div className="sv-journey-stat-icon">
                        <Trophy size={24} />
                      </div>
                      <div className="sv-journey-stat-content">
                        <h3>18</h3>
                        <p>Courses Completed</p>
                      </div>
                    </div>
                    <div className="sv-journey-stat">
                      <div className="sv-journey-stat-icon">
                        <Zap size={24} />
                      </div>
                      <div className="sv-journey-stat-content">
                        <h3>320</h3>
                        <p>Learning Hours</p>
                      </div>
                    </div>
                    <div className="sv-journey-stat">
                      <div className="sv-journey-stat-icon">
                        <Target size={24} />
                      </div>
                      <div className="sv-journey-stat-content">
                        <h3>4</h3>
                        <p>Active Goals</p>
                      </div>
                    </div>
                    <div className="sv-journey-stat">
                      <div className="sv-journey-stat-icon">
                        <Award size={24} />
                      </div>
                      <div className="sv-journey-stat-content">
                        <h3>12</h3>
                        <p>Achievements</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Learning Path Timeline */}
                <div className="sv-learning-path">
                  <h3>Learning Path Progress</h3>
                  <div className="sv-learning-timeline">
                    {learningJourney.map((phase, index) => (
                      <motion.div
                        key={phase.phase}
                        className={`sv-learning-phase sv-learning-phase--${phase.status}`}
                        variants={itemVariants}
                        custom={index}
                      >
                        <div className="sv-learning-phase-connector">
                          {index < learningJourney.length - 1 && (
                            <div className="sv-phase-line" />
                          )}
                        </div>
                        
                        <div className="sv-learning-phase-marker">
                          <div className="sv-phase-icon">
                            {phase.status === 'completed' && <Award size={20} />}
                            {phase.status === 'current' && <Zap size={20} />}
                            {phase.status === 'upcoming' && <Target size={20} />}
                          </div>
                          <div className="sv-phase-status-badge">
                            {phase.status === 'completed' && 'Completed'}
                            {phase.status === 'current' && 'In Progress'}
                            {phase.status === 'upcoming' && 'Upcoming'}
                          </div>
                        </div>
                        
                        <div className="sv-learning-phase-content">
                          <div className="sv-phase-header">
                            <h4 className="sv-phase-title">{phase.phase}</h4>
                            <span className="sv-phase-period">{phase.period}</span>
                          </div>
                          
                          <div className="sv-phase-details">
                            <div className="sv-phase-courses">
                              <span className="sv-course-count">{phase.courses}</span>
                              <span>courses</span>
                            </div>
                            
                            {phase.status === 'current' && (
                              <div className="sv-phase-progress">
                                <div className="sv-progress-info">
                                  <span>Progress</span>
                                  <span>65%</span>
                                </div>
                                <div className="sv-progress-track">
                                  <div className="sv-progress-fill" style={{ width: '65%' }}></div>
                                </div>
                              </div>
                            )}
                            
                            {phase.status === 'completed' && (
                              <div className="sv-phase-completion">
                                <div className="sv-completion-badge">
                                  <Award size={16} />
                                  <span>Completed</span>
                                </div>
                              </div>
                            )}
                            
                            {phase.status === 'upcoming' && (
                              <div className="sv-phase-actions">
                                <button className="sv-btn sv-btn--outline sv-btn--sm">
                                  <Eye size={14} />
                                  View Recommendations
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* AI Recommendations */}
                <div className="sv-ai-recommendations">
                  <div className="sv-recommendations-header">
                    <h3>AI-Powered Recommendations</h3>
                    <p>Based on your learning patterns and career goals</p>
                  </div>
                  
                  <div className="sv-recommendations-grid">
                    <div className="sv-recommendation-card">
                      <div className="sv-recommendation-icon">🤖</div>
                      <h4>Next Skill to Master</h4>
                      <p>Advanced React Patterns</p>
                      <div className="sv-recommendation-match">
                        <span>95% match</span>
                      </div>
                    </div>
                    <div className="sv-recommendation-card">
                      <div className="sv-recommendation-icon">🎯</div>
                      <h4>Career Path Suggestion</h4>
                      <p>Full-Stack Team Lead</p>
                      <div className="sv-recommendation-match">
                        <span>87% match</span>
                      </div>
                    </div>
                    <div className="sv-recommendation-card">
                      <div className="sv-recommendation-icon">📈</div>
                      <h4>Trending Technology</h4>
                      <p>Next.js & Server Components</p>
                      <div className="sv-recommendation-match">
                        <span>92% match</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Achievement Highlights */}
                <div className="sv-achievement-highlights">
                  <h3>Recent Achievements</h3>
                  <div className="sv-achievements-showcase">
                    {gamificationStats.achievements.map((achievement, index) => (
                      <motion.div 
                        key={achievement.title} 
                        className="sv-achievement-showcase-card"
                        variants={itemVariants}
                        custom={index}
                      >
                        <div className="sv-achievement-showcase-icon">{achievement.icon}</div>
                        <div className="sv-achievement-showcase-content">
                          <h4>{achievement.title}</h4>
                          <p>{achievement.description}</p>
                          <div className="sv-achievement-date">Earned 2 days ago</div>
                        </div>
                        <div className="sv-achievement-showcase-badge">
                          <Award size={16} />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Mentor Feedback Section */}
            {activeSection === 'feedback' && (
              <div className="sv-section">
                <div className="sv-section-header">
                  <h2>Mentor Feedback & Endorsements</h2>
                  <p>Verified comments and endorsements from mentors and clients</p>
                </div>

                {/* Endorsements Overview */}
                <div className="sv-endorsements-overview">
                  <div className="sv-endorsement-stats">
                    <div className="sv-endorsement-stat">
                      <div className="sv-stat-number">24</div>
                      <div className="sv-stat-label">Total Endorsements</div>
                    </div>
                    <div className="sv-endorsement-stat">
                      <div className="sv-stat-number">4.9</div>
                      <div className="sv-stat-label">Average Rating</div>
                    </div>
                    <div className="sv-endorsement-stat">
                      <div className="sv-stat-number">8</div>
                      <div className="sv-stat-label">Verified Mentors</div>
                    </div>
                  </div>
                </div>

                {/* Mentor Testimonials */}
                <div className="sv-mentor-testimonials">
                  <h3>Mentor Testimonials</h3>
                  <div className="sv-testimonials-grid">
                    {mentorFeedback.map((feedback, index) => (
                      <motion.div
                        key={feedback.id}
                        className="sv-testimonial-card"
                        variants={itemVariants}
                        custom={index}
                      >
                        <div className="sv-testimonial-header">
                          <div className="sv-mentor-avatar">
                            <div className="sv-avatar-placeholder">
                              {feedback.mentorName.split(' ').map(n => n[0]).join('')}
                            </div>
                          </div>
                          <div className="sv-mentor-details">
                            <h4 className="sv-mentor-name">{feedback.mentorName}</h4>
                            <p className="sv-mentor-title">{feedback.mentorTitle}</p>
                            <div className="sv-mentor-badges">
                              {feedback.verified && (
                                <div className="sv-verified-mentor-badge">
                                  <Award size={12} />
                                  <span>Verified Mentor</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="sv-testimonial-rating">
                            <div className="sv-rating-stars">
                              {Array.from({ length: 5 }, (_, i) => (
                                <Star key={i} className="sv-star-filled" size={14} />
                              ))}
                            </div>
                          </div>
                        </div>

                        <blockquote className="sv-testimonial-content">
                          "{feedback.feedback}"
                        </blockquote>

                        <div className="sv-testimonial-footer">
                          <div className="sv-endorsed-skill-tag">
                            <span>Endorsed: {feedback.skillEndorsed}</span>
                          </div>
                          <div className="sv-testimonial-date">{feedback.date}</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Skills Endorsement Breakdown */}
                <div className="sv-skills-endorsements">
                  <h3>Skills with Endorsements</h3>
                  <div className="sv-skills-endorsement-list">
                    {skills.map((skill, index) => (
                      <motion.div 
                        key={skill.name} 
                        className="sv-skill-endorsement-item"
                        variants={itemVariants}
                        custom={index}
                      >
                        <div className="sv-skill-endorsement-header">
                          <div className="sv-skill-info">
                            <h4 className="sv-skill-name">{skill.name}</h4>
                            <div className="sv-skill-category-badge">{skill.category}</div>
                          </div>
                          <div className="sv-skill-endorsement-count">
                            <span className="sv-endorsement-number">{skill.endorsed}</span>
                            <span className="sv-endorsement-text">endorsements</span>
                          </div>
                        </div>
                        
                        <div className="sv-skill-proficiency">
                          <div className="sv-proficiency-bar">
                            <div 
                              className="sv-proficiency-fill" 
                              style={{ width: `${skill.level}%` }}
                            />
                          </div>
                          <div className="sv-proficiency-details">
                            <span className="sv-proficiency-level">{skill.level}% Proficiency</span>
                            <span className="sv-proficiency-status">
                              {skill.level >= 90 ? 'Expert' : skill.level >= 70 ? 'Advanced' : 'Intermediate'}
                            </span>
                          </div>
                        </div>

                        <div className="sv-skill-endorsers">
                          <div className="sv-endorser-avatars">
                            {Array.from({ length: Math.min(skill.endorsed, 3) }, (_, i) => (
                              <div key={i} className="sv-endorser-avatar">
                                <span>{String.fromCharCode(65 + i)}</span>
                              </div>
                            ))}
                            {skill.endorsed > 3 && (
                              <div className="sv-more-endorsers">
                                +{skill.endorsed - 3}
                              </div>
                            )}
                          </div>
                          <button className="sv-btn sv-btn--outline sv-btn--sm">
                            View All Endorsers
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Request Endorsement */}
                <div className="sv-endorsement-request">
                  <div className="sv-request-header">
                    <h3>Request an Endorsement</h3>
                    <p>Ask mentors, colleagues, or clients to endorse your skills</p>
                  </div>
                  
                  <div className="sv-request-actions">
                    <button className="sv-btn sv-btn--primary">
                      <Mail size={18} />
                      Send Endorsement Request
                    </button>
                    <button className="sv-btn sv-btn--outline">
                      <Share2 size={18} />
                      Share Endorsement Link
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* CV Builder Section */}
            {activeSection === 'cv-builder' && (
              <div className="sv-section">
                <div className="sv-section-header">
                  <h2>Smart CV Builder</h2>
                  <p>AI-powered CV generation using your SkillVerse portfolio data</p>
                </div>

                {/* CV Builder Layout */}
                <div className="sv-cv-builder-layout">
                  {/* Left Panel - CV Customization */}
                  <div className="sv-cv-builder-panel">
                    {/* Template Selection */}
                    <div className="sv-cv-builder-section">
                      <h3>Choose Template</h3>
                      <div className="sv-cv-templates-grid">
                        {[
                          { name: 'Modern', preview: '📄', description: 'Clean and contemporary design' },
                          { name: 'Classic', preview: '📋', description: 'Traditional professional layout' },
                          { name: 'Creative', preview: '🎨', description: 'Eye-catching design for creative roles' },
                          { name: 'ATS-Friendly', preview: '🤖', description: 'Optimized for applicant tracking systems' }
                        ].map((template, index) => (
                          <div key={template.name} className={`sv-cv-template-option ${index === 0 ? 'sv-template-selected' : ''}`}>
                            <div className="sv-template-preview-icon">{template.preview}</div>
                            <div className="sv-template-info">
                              <h4>{template.name}</h4>
                              <p>{template.description}</p>
                            </div>
                            <div className="sv-template-selector">
                              <input type="radio" name="template" defaultChecked={index === 0} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Section Configuration */}
                    <div className="sv-cv-builder-section">
                      <h3>CV Sections</h3>
                      <div className="sv-cv-sections-config">
                        {[
                          { name: 'Profile Summary', included: true, required: true },
                          { name: 'Skills', included: true, required: false },
                          { name: 'Experience', included: true, required: false },
                          { name: 'Education', included: true, required: false },
                          { name: 'Certifications', included: true, required: false },
                          { name: 'Projects', included: true, required: false },
                          { name: 'Languages', included: false, required: false },
                          { name: 'Achievements', included: false, required: false }
                        ].map((section) => (
                          <div key={section.name} className="sv-cv-section-toggle">
                            <label className="sv-section-toggle-label">
                              <div className="sv-toggle-switch">
                                <input 
                                  type="checkbox" 
                                  defaultChecked={section.included}
                                  disabled={section.required}
                                />
                                <span className="sv-toggle-slider"></span>
                              </div>
                              <div className="sv-section-info">
                                <span className="sv-section-name">{section.name}</span>
                                {section.required && <span className="sv-required-badge">Required</span>}
                              </div>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Language & Customization */}
                    <div className="sv-cv-builder-section">
                      <h3>Customization</h3>
                      
                      <div className="sv-cv-customization">
                        <div className="sv-customization-option">
                          <label>Language</label>
                          <div className="sv-language-selector">
                            <button className="sv-language-btn sv-language-active">English</button>
                            <button className="sv-language-btn">Vietnamese</button>
                          </div>
                        </div>

                        <div className="sv-customization-option">
                          <label>Color Scheme</label>
                          <div className="sv-color-palette">
                            {['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'].map((color) => (
                              <div 
                                key={color} 
                                className="sv-color-option"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                        </div>

                        <div className="sv-customization-option">
                          <label>Font Style</label>
                          <select className="sv-font-selector">
                            <option>Professional (Inter)</option>
                            <option>Classic (Times New Roman)</option>
                            <option>Modern (Roboto)</option>
                            <option>Elegant (Playfair Display)</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* AI Optimization */}
                    <div className="sv-cv-builder-section">
                      <h3>AI Optimization</h3>
                      <div className="sv-ai-optimization">
                        <div className="sv-optimization-feature">
                          <div className="sv-feature-icon">🤖</div>
                          <div className="sv-feature-content">
                            <h4>Job-Specific Optimization</h4>
                            <p>Tailor your CV for specific job descriptions</p>
                            <button className="sv-btn sv-btn--outline sv-btn--sm">
                              Upload Job Description
                            </button>
                          </div>
                        </div>
                        
                        <div className="sv-optimization-feature">
                          <div className="sv-feature-icon">📊</div>
                          <div className="sv-feature-content">
                            <h4>ATS Score Analysis</h4>
                            <p>Get a score for applicant tracking systems</p>
                            <button className="sv-btn sv-btn--outline sv-btn--sm">
                              Analyze CV
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Panel - CV Preview */}
                  <div className="sv-cv-preview-panel">
                    <div className="sv-cv-preview-header">
                      <h3>CV Preview</h3>
                      <div className="sv-preview-actions">
                        <button className="sv-btn sv-btn--outline sv-btn--sm">
                          <Eye size={16} />
                          Full Screen
                        </button>
                      </div>
                    </div>
                    
                    <div className="sv-cv-preview-container">
                      <div className="sv-cv-preview-document">
                        {/* CV Preview Content */}
                        <div className="sv-cv-preview-content">
                          <div className="sv-cv-preview-header-section">
                            <h1>Tran Xuan Truong</h1>
                            <p>Full-stack Developer & UI/UX Designer</p>
                            <div className="sv-cv-preview-contact">
                              <span>truongtranxuan41@gmail.com</span>
                              <span>Ho Chi Minh City, Vietnam</span>
                            </div>
                          </div>
                          
                          <div className="sv-cv-preview-section">
                            <h3>Professional Summary</h3>
                            <p>Passionate Computer Science student with strong foundation in web development...</p>
                          </div>
                          
                          <div className="sv-cv-preview-section">
                            <h3>Skills</h3>
                            <div className="sv-cv-preview-skills">
                              <span>React.js</span>
                              <span>Node.js</span>
                              <span>TypeScript</span>
                              <span>UI/UX Design</span>
                            </div>
                          </div>
                          
                          <div className="sv-cv-preview-section">
                            <h3>Experience</h3>
                            <div className="sv-cv-preview-experience">
                              <h4>E-commerce Platform Redesign</h4>
                              <p>Fashion Store ABC • 2024</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="sv-cv-builder-actions">
                  <div className="sv-cv-main-actions">
                    <button className="sv-btn sv-btn--outline">
                      <Eye size={18} />
                      Preview CV
                    </button>
                    <button className="sv-btn sv-btn--primary">
                      <Download size={18} />
                      Download PDF
                    </button>
                    <button className="sv-btn sv-btn--outline">
                      <Share2 size={18} />
                      Generate Shareable Link
                    </button>
                  </div>
                </div>

                {/* Privacy & Sharing Controls */}
                <div className="sv-privacy-sharing">
                  <div className="sv-privacy-section">
                    <h3>Privacy & Sharing Controls</h3>
                    <div className="sv-privacy-options">
                      {Object.entries(privacySettings).map(([key, value]) => (
                        <div key={key} className="sv-privacy-option">
                          <label className="sv-privacy-toggle-label">
                            <div className="sv-privacy-toggle-switch">
                              <input
                                type="checkbox"
                                checked={value}
                                onChange={() => togglePrivacySetting(key)}
                              />
                              <span className="sv-privacy-toggle-slider"></span>
                            </div>
                            <div className="sv-privacy-option-info">
                              <span>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                              <small>Control visibility of this section in your public profile</small>
                            </div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="sv-sharing-options">
                    <h4>Share Your Portfolio</h4>
                    <div className="sv-share-buttons">
                      <button className="sv-btn sv-btn--outline">
                        <QrCode size={18} />
                        Generate QR Code
                      </button>
                      <button className="sv-btn sv-btn--outline">
                        <Globe size={18} />
                        Public Profile Link
                      </button>
                      <button className="sv-btn sv-btn--outline">
                        <Mail size={18} />
                        Email Portfolio
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Fallback for any invalid section */}
            {!['overview', 'certificates', 'projects', 'journey', 'feedback', 'cv-builder'].includes(activeSection) && (
              <div className="sv-section">
                <div className="sv-section-header">
                  <h2>Section Not Found</h2>
                  <p>The requested section could not be found. Please select a valid section from the navigation.</p>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default PortfolioPage;