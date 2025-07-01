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

                <div className="sv-projects-grid">
                  {projects.map((project, index) => (
                    <motion.div
                      key={project.id}
                      className="sv-project-card"
                      variants={itemVariants}
                      custom={index}
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="sv-project-image">
                        <img src={project.image} alt={project.title} />
                        <div className="sv-project-type">{project.type}</div>
                      </div>

                      <div className="sv-project-content">
                        <h3 className="sv-project-title">{project.title}</h3>
                        <p className="sv-project-client">{project.client}</p>
                        <p className="sv-project-description">{project.description}</p>

                        <div className="sv-project-meta">
                          <span>Duration: {project.duration}</span>
                          <span>Completed: {project.completionDate}</span>
                        </div>

                        <div className="sv-project-tools">
                          <h4>Tools Used:</h4>
                          <div className="sv-tools-list">
                            {project.tools.map((tool) => (
                              <span key={tool} className="sv-tool-tag">{tool}</span>
                            ))}
                          </div>
                        </div>

                        <div className="sv-project-outcomes">
                          <h4>Key Outcomes:</h4>
                          <ul>
                            {project.outcomes.map((outcome) => (
                              <li key={outcome}>{outcome}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="sv-project-rating">
                          <div className="sv-stars">
                            {Array.from({ length: 5 }, (_, i) => (
                              <Star
                                key={`rating-${project.id}-${i}`}
                                className={i < project.rating ? 'filled' : ''}
                                size={16}
                              />
                            ))}
                          </div>
                          <span className="sv-rating-text">Client Rating</span>
                        </div>

                        <div className="sv-project-feedback">
                          <blockquote>"{project.feedback}"</blockquote>
                        </div>

                        <div className="sv-project-attachments">
                          <h4>Attachments:</h4>
                          {project.attachments.map((attachment) => (
                            <button key={attachment} className="sv-attachment-link">
                              <FileText size={14} />
                              {attachment}
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  ))}
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

                <div className="sv-journey-timeline">
                  {learningJourney.map((phase) => (
                    <motion.div
                      key={phase.phase}
                      className={`sv-journey-phase sv-journey-phase--${phase.status}`}
                      variants={itemVariants}
                      custom={phase.phase}
                    >
                      <div className="sv-journey-marker">
                        {phase.status === 'completed' && <Award size={20} />}
                        {phase.status === 'current' && <Zap size={20} />}
                        {phase.status === 'upcoming' && <Target size={20} />}
                      </div>
                      
                      <div className="sv-journey-content">
                        <h3 className="sv-journey-title">{phase.phase}</h3>
                        <p className="sv-journey-period">{phase.period}</p>
                        <p className="sv-journey-courses">{phase.courses} courses</p>
                        
                        {phase.status === 'current' && (
                          <div className="sv-journey-progress">
                            <div className="sv-progress-bar">
                              <div className="sv-progress-fill" style={{ width: '65%' }}></div>
                            </div>
                            <span>65% Complete</span>
                          </div>
                        )}
                        
                        {phase.status === 'upcoming' && (
                          <button className="sv-btn sv-btn--outline sv-btn--sm">
                            View Recommendations
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Gamification Highlights */}
                <div className="sv-gamification-section">
                  <h3>Achievement Highlights</h3>
                  <div className="sv-achievements-grid">
                    {gamificationStats.achievements.map((achievement) => (
                      <div key={achievement.title} className="sv-achievement-card">
                        <div className="sv-achievement-icon">{achievement.icon}</div>
                        <h4>{achievement.title}</h4>
                        <p>{achievement.description}</p>
                      </div>
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

                <div className="sv-feedback-grid">
                  {mentorFeedback.map((feedback, index) => (
                    <motion.div
                      key={feedback.id}
                      className="sv-feedback-card"
                      variants={itemVariants}
                      custom={index}
                    >
                      <div className="sv-feedback-header">
                        <div className="sv-mentor-info">
                          <h4>{feedback.mentorName}</h4>
                          <p>{feedback.mentorTitle}</p>
                        </div>
                        {feedback.verified && (
                          <div className="sv-verified-badge">
                            <Award size={14} />
                            Verified
                          </div>
                        )}
                      </div>

                      <blockquote className="sv-feedback-content">
                        "{feedback.feedback}"
                      </blockquote>

                      <div className="sv-feedback-footer">
                        <span className="sv-endorsed-skill">
                          Endorsed: {feedback.skillEndorsed}
                        </span>
                        <span className="sv-feedback-date">{feedback.date}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Skills with Endorsements */}
                <div className="sv-endorsed-skills">
                  <h3>Skills with Endorsements</h3>
                  <div className="sv-skills-endorsement-grid">
                    {skills.map((skill) => (
                      <div key={skill.name} className="sv-skill-endorsement-card">
                        <h4>{skill.name}</h4>
                        <div className="sv-skill-bar">
                          <div 
                            className="sv-skill-progress" 
                            style={{ width: `${skill.level}%` }}
                          />
                        </div>
                        <p>{skill.endorsed} people endorsed this skill</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* CV Builder Section */}
            {activeSection === 'cv-builder' && (
              <div className="sv-section">
                <div className="sv-section-header">
                  <h2>Smart CV Builder</h2>
                  <p>Automatically generated CV using your SkillVerse data</p>
                </div>

                <div className="sv-cv-builder">
                  <div className="sv-cv-templates">
                    <h3>Choose Template</h3>
                    <div className="sv-template-grid">
                      {['Modern', 'Classic', 'Creative', 'ATS-Friendly'].map((template) => (
                        <div key={template} className="sv-template-card">
                          <div className="sv-template-preview">
                            <div className="sv-template-placeholder"></div>
                          </div>
                          <h4>{template}</h4>
                          <button className="sv-btn sv-btn--outline sv-btn--sm">
                            Select
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="sv-cv-sections">
                    <h3>CV Sections</h3>
                    <div className="sv-section-toggles">
                      {[
                        'Profile Summary',
                        'Skills',
                        'Education',
                        'Experience',
                        'Certifications',
                        'Projects',
                        'Languages'
                      ].map((section) => (
                        <label key={section} className="sv-toggle">
                          <input type="checkbox" defaultChecked />
                          <span className="sv-toggle-slider"></span>
                          {section}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="sv-cv-language">
                    <h3>Language</h3>
                    <div className="sv-language-toggle">
                      <button className="sv-btn sv-btn--outline">English</button>
                      <button className="sv-btn sv-btn--primary">Vietnamese</button>
                    </div>
                  </div>

                  <div className="sv-cv-actions">
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
                      Generate Link
                    </button>
                  </div>
                </div>

                {/* Privacy Controls */}
                <div className="sv-privacy-controls">
                  <h3>Share & Privacy Controls</h3>
                  <div className="sv-privacy-grid">
                    {Object.entries(privacySettings).map(([key, value]) => (
                      <label key={key} className="sv-privacy-toggle">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={() => togglePrivacySetting(key)}
                        />
                        <span className="sv-toggle-slider"></span>
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </label>
                    ))}
                  </div>

                  <div className="sv-share-options">
                    <button className="sv-btn sv-btn--outline">
                      <QrCode size={18} />
                      Generate QR Code
                    </button>
                    <button className="sv-btn sv-btn--outline">
                      <Globe size={18} />
                      Public Profile Link
                    </button>
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