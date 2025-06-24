import React, { useState, useEffect } from 'react';
import { Download, Edit, Share2, Eye, Star, Award, Briefcase, GraduationCap, User, Mail, Phone, MapPin, Globe, Github, Linkedin, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import '../../styles/PortfolioPage.css';

const PortfolioPage = () => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('overview');
  const [animationKey, setAnimationKey] = useState(0);
  const { translations } = useLanguage();

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.6,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setAnimationKey(prev => prev + 1);
  };

  const userProfile = {
    name: 'Tran Xuan Truong',
    title: 'Full-stack Developer & UI/UX Designer',
    email: 'truongtranxuan41@gmail.com',
    phone: '0398648063',
    location: 'Ho Chi Minh City, Vietnam',
    website: 'none',
    linkedin: 'linkedin.com/in/tran-xuan-truong-ab00b7317',
    github: 'https://github.com/TruongTXK18FPT',
    bio: 'Final year Computer Science student at FPT University. Passionate about web development and user interface design. Experienced with React, Node.js, and modern technologies.',
    avatar: 'https://media.licdn.com/dms/image/v2/D5603AQHZv1brnCXkRQ/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1719832250061?e=1755734400&v=beta&t=SQ9q4CPeTzzA7HbLrtjGiJEEeLRgWCYF4BpiTiU6FJw'
  };

  const completedCourses = [
    {
      id: 1,
      title: 'React.js Advanced',
      provider: 'Skillverse',
      completionDate: '2024-03-15',
      grade: 'A+',
      certificate: true,
      skills: ['React', 'Redux', 'TypeScript']
    },
    {
      id: 2,
      title: 'UI/UX Design Fundamentals',
      provider: 'Skillverse',
      completionDate: '2024-02-28',
      grade: 'A',
      certificate: true,
      skills: ['Figma', 'Design Thinking', 'Prototyping']
    },
    {
      id: 3,
      title: 'Node.js Backend Development',
      provider: 'Skillverse',
      completionDate: '2024-01-20',
      grade: 'A+',
      certificate: true,
      skills: ['Node.js', 'Express', 'MongoDB']
    }
  ];

  const projects = [
    {
      id: 1,
      title: 'E-commerce Website Redesign',
      client: 'Fashion Store ABC',
      type: 'Micro-job',
      completionDate: '2024-03-10',
      budget: '$250',
      rating: 5,
      description: 'Redesigned e-commerce website interface, increasing conversion rate by 35%',
      technologies: ['React', 'Tailwind CSS', 'Figma'],
      image: 'https://images.pexels.com/photos/34577/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      id: 2,
      title: 'Restaurant Management System',
      client: 'Local Restaurant Chain',
      type: 'Freelance',
      completionDate: '2024-02-15',
      budget: '$500',
      rating: 5,
      description: 'Developed restaurant management system with table booking and menu management features',
      technologies: ['Vue.js', 'Laravel', 'MySQL'],
      image: 'https://images.pexels.com/photos/2291367/pexels-photo-2291367.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      id: 3,
      title: 'Mobile App UI Design',
      client: 'Tech Startup XYZ',
      type: 'Micro-job',
      completionDate: '2024-01-30',
      budget: '$180',
      rating: 4,
      description: 'Designed mobile app interface for fintech startup',
      technologies: ['Figma', 'Adobe XD', 'Principle'],
      image: 'https://images.pexels.com/photos/147413/twitter-facebook-together-exchange-of-information-147413.jpeg?auto=compress&cs=tinysrgb&w=400'
    }
  ];

  const skills = [
    { name: 'React.js', level: 90, category: 'Frontend' },
    { name: 'Node.js', level: 85, category: 'Backend' },
    { name: 'TypeScript', level: 80, category: 'Programming' },
    { name: 'UI/UX Design', level: 75, category: 'Design' },
    { name: 'MongoDB', level: 70, category: 'Database' },
    { name: 'Figma', level: 85, category: 'Design' }
  ];

  const achievements = [
    {
      id: 1,
      title: 'Top Performer',
      description: 'Top 5% of students in March 2024',
      date: '2024-03-15',
      icon: Award,
      color: 'text-yellow-600 bg-yellow-100'
    },
    {
      id: 2,
      title: 'Perfect Rating',
      description: '20 projects completed with 5-star rating',
      date: '2024-02-28',
      icon: Star,
      color: 'text-purple-600 bg-purple-100'
    },
    {
      id: 3,
      title: 'Course Completion',
      description: 'Completed 15 professional courses',
      date: '2024-01-20',
      icon: GraduationCap,
      color: 'text-blue-600 bg-blue-100'
    }
  ];
  const stats = [
    {
      title: 'Completed Projects',
      value: '15',
      icon: 'projects'
    },
    {
      title: 'Skills Learned',
      value: '25',
      icon: 'skills'
    },
    {
      title: 'Certificates Earned',
      value: '8',
      icon: 'certificates'
    },
    {
      title: 'Courses Completed',
      value: '12',
      icon: 'courses'
    }
  ];

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'projects', label: 'Projects' },
    { id: 'skills', label: 'Skills' },
    { id: 'education', label: 'Education' },
    { id: 'experience', label: 'Experience' },
    { id: 'certificates', label: 'Certificates' }
  ];
  return (
    <motion.div 
      className={`sv-portfolio-container ${theme}`}
      data-theme={theme}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="sv-portfolio-content">
        {/* Header */}
        <motion.div 
          className="sv-portfolio-header"
          variants={itemVariants}
        >
          <h1 className="sv-portfolio-header__title">{translations.portfolio.title}</h1>
          <p className="sv-portfolio-header__description">{translations.portfolio.description}</p>
        </motion.div>

        {/* Profile Preview Actions */}
        <motion.div 
          className="sv-portfolio-actions"
          variants={itemVariants}
        >
          <div className="sv-portfolio-actions__content">
            <div className="sv-portfolio-actions__info">
              <h2 className="sv-portfolio-actions__title">Your Profile</h2>
              <p className="sv-portfolio-actions__description">Automatically updated from your learning and work activities</p>
            </div>
            <div className="sv-portfolio-actions__buttons">              <motion.button 
                className="sv-portfolio-btn sv-portfolio-btn--outline"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Eye />
                <span>View Profile</span>
                <ChevronRight size={16} />
              </motion.button>
              <motion.button 
                className="sv-portfolio-btn sv-portfolio-btn--outline"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Edit />
                <span>Edit Profile</span>
                <ChevronRight size={16} />
              </motion.button>
              <motion.button 
                className="sv-portfolio-btn sv-portfolio-btn--outline"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Share2 />
                <span>Share Profile</span>
                <ChevronRight size={16} />
              </motion.button>
              <motion.button 
                className="sv-portfolio-btn sv-portfolio-btn--primary"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Download />
                <span>Download CV</span>
                <ChevronRight size={16} />
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div 
          className="sv-portfolio-tabs"
          variants={itemVariants}
        >
          <nav className="sv-portfolio-tabs__nav">
            {tabs.map((tab) => (
              <motion.button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`sv-portfolio-tab ${
                  activeTab === tab.id ? 'sv-portfolio-tab--active' : ''
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span>{tab.label}</span>
              </motion.button>
            ))}
          </nav>

          <AnimatePresence mode="wait">
            <motion.div
              key={animationKey}
              className="sv-portfolio-content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Portfolio Tab */}
              {activeTab === 'projects' && (
                <motion.div 
                  className="sv-portfolio-grid"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {projects.map((project, index) => (
                    <motion.div
                      key={project.id}
                      className="sv-portfolio-card"
                      variants={itemVariants}
                      custom={index}
                      whileHover={{ 
                        scale: 1.02,
                        transition: { duration: 0.2 }
                      }}
                    >
                      <img
                        src={project.image}
                        alt={project.title}
                        className="sv-portfolio-card__image"
                      />
                      <div className="sv-portfolio-card__content">
                        <div className="sv-portfolio-card__header">
                          <div>
                            <h3 className="sv-portfolio-card__title">{project.title}</h3>
                            <p className="sv-portfolio-card__subtitle">{project.client}</p>
                          </div>
                          <div className="sv-portfolio-card__rating">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`sv-portfolio-card__star ${
                                  i < project.rating ? 'fill-current' : ''
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="sv-portfolio-card__description">{project.description}</p>
                        <div className="sv-portfolio-card__tags">
                          {project.technologies.map((tech, index) => (
                            <span key={index} className="sv-portfolio-card__tag">
                              {tech}
                            </span>
                          ))}
                        </div>
                        <div className="sv-portfolio-card__footer">
                          <span className="sv-portfolio-card__price">{project.budget}</span>
                          <span className="sv-portfolio-card__date">{project.completionDate}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {/* Skills Tab */}
              {activeTab === 'skills' && (
                <motion.div 
                  className="sv-skills-grid"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {['Frontend', 'Backend', 'Design', 'Database', 'Programming'].map((category, categoryIndex) => (
                    <motion.div 
                      key={category}
                      className="sv-skill-category"
                      variants={itemVariants}
                      custom={categoryIndex}
                    >
                      <h3 className="sv-skill-category__title">{category}</h3>
                      <div className="sv-skill-list">
                        {skills
                          .filter(skill => skill.category === category)
                          .map((skill, index) => (
                            <motion.div 
                              key={index}
                              className="sv-skill-item"
                              initial={{ width: 0 }}
                              animate={{ width: '100%' }}
                              transition={{ delay: index * 0.1 }}
                            >
                              <div className="sv-skill-item__header">
                                <span className="sv-skill-item__name">{skill.name}</span>
                                <span className="sv-skill-item__level">{skill.level}%</span>
                              </div>
                              <div className="sv-skill-item__bar">
                                <div
                                  className="sv-skill-item__progress"
                                  style={{ width: `${skill.level}%` }}
                                ></div>
                              </div>
                            </motion.div>
                          ))}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {/* Profile Tab */}
              {activeTab === 'education' && (
                <motion.div 
                  className="sv-profile"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <motion.div 
                    className="sv-profile-header"
                    variants={itemVariants}
                  >
                    <motion.img
                      src={userProfile.avatar}
                      alt={userProfile.name}
                      className="sv-profile-avatar"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                    />
                    <div className="sv-profile-info">
                      <h2 className="sv-profile-info__name">{userProfile.name}</h2>
                      <p className="sv-profile-info__title">{userProfile.title}</p>
                      <motion.button 
                        className="sv-profile-info__change-avatar"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Change avatar
                      </motion.button>
                    </div>
                  </motion.div>

                  <motion.div 
                    className="sv-profile-form"
                    variants={containerVariants}
                  >
                    <div className="sv-profile-field">
                      <label className="sv-profile-field__label">About Me</label>
                      <textarea
                        rows={4}
                        className="sv-profile-field__input"
                        defaultValue={userProfile.bio}
                      />
                    </div>

                    <div className="sv-profile-field">
                      <label className="sv-profile-field__label">Email</label>
                      <div className="sv-profile-field__input">
                        <Mail className="sv-profile-field__icon" />
                        <input
                          type="email"
                          className="sv-profile-field__text"
                          defaultValue={userProfile.email}
                        />
                      </div>
                    </div>

                    <div className="sv-profile-field">
                      <label className="sv-profile-field__label">Phone</label>
                      <div className="sv-profile-field__input">
                        <Phone className="sv-profile-field__icon" />
                        <input
                          type="tel"
                          className="sv-profile-field__text"
                          defaultValue={userProfile.phone}
                        />
                      </div>
                    </div>

                    <div className="sv-profile-field">
                      <label className="sv-profile-field__label">Location</label>
                      <div className="sv-profile-field__input">
                        <MapPin className="sv-profile-field__icon" />
                        <input
                          type="text"
                          className="sv-profile-field__text"
                          defaultValue={userProfile.location}
                        />
                      </div>
                    </div>

                    <div className="sv-profile-field">
                      <label className="sv-profile-field__label">Website</label>
                      <div className="sv-profile-field__input">
                        <Globe className="sv-profile-field__icon" />
                        <input
                          type="url"
                          className="sv-profile-field__text"
                          defaultValue={userProfile.website}
                        />
                      </div>
                    </div>

                    <div className="sv-profile-field">
                      <label className="sv-profile-field__label">LinkedIn</label>
                      <div className="sv-profile-field__input">
                        <Linkedin className="sv-profile-field__icon" />
                        <input
                          type="url"
                          className="sv-profile-field__text"
                          defaultValue={userProfile.linkedin}
                        />
                      </div>
                    </div>

                    <div className="sv-profile-field">
                      <label className="sv-profile-field__label">GitHub</label>
                      <div className="sv-profile-field__input">
                        <Github className="sv-profile-field__icon" />
                        <input
                          type="url"
                          className="sv-profile-field__text"
                          defaultValue={userProfile.github}
                        />
                      </div>
                    </div>

                    <div className="sv-profile-actions">
                      <button className="sv-portfolio-btn sv-portfolio-btn--outline">
                        Cancel
                      </button>
                      <button className="sv-portfolio-btn sv-portfolio-btn--primary">
                        Save Changes
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default PortfolioPage;