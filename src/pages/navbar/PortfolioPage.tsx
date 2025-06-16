import React, { useState } from 'react';
import { Download, Edit, Share2, Eye, Star, Award, Briefcase, GraduationCap, User, Mail, Phone, MapPin, Globe, Github, Linkedin } from 'lucide-react';
import '../../styles/PortfolioPage.css';

const PortfolioPage = () => {
  const [activeTab, setActiveTab] = useState('portfolio');

  const userProfile = {
    name: 'John Anderson',
    title: 'Full-stack Developer & UI/UX Designer',
    email: 'john.anderson@email.com',
    phone: '+1 (555) 123-4567',
    location: 'New York, USA',
    website: 'www.johnanderson.dev',
    linkedin: 'linkedin.com/in/johnanderson',
    github: 'github.com/johnanderson',
    bio: 'Final year Computer Science student at New York University. Passionate about web development and user interface design. Experienced with React, Node.js, and modern technologies.',
    avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=200'
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

  return (
    <div className="sv-portfolio-container">
      <div className="sv-portfolio-content">
        {/* Header */}
        <div className="sv-portfolio-header">
          <h1 className="sv-portfolio-header__title">Portfolio & CV</h1>
          <p className="sv-portfolio-header__description">
            Create and manage your professional profile from completed courses and projects
          </p>
        </div>

        {/* Profile Preview Actions */}
        <div className="sv-portfolio-actions">
          <div className="sv-portfolio-actions__content">
            <div className="sv-portfolio-actions__info">
              <h2 className="sv-portfolio-actions__title">Your Profile</h2>
              <p className="sv-portfolio-actions__description">Automatically updated from your learning and work activities</p>
            </div>
            <div className="sv-portfolio-actions__buttons">
              <button className="sv-portfolio-btn sv-portfolio-btn--outline">
                <Eye />
                <span>Preview</span>
              </button>
              <button className="sv-portfolio-btn sv-portfolio-btn--outline">
                <Edit />
                <span>Edit</span>
              </button>
              <button className="sv-portfolio-btn sv-portfolio-btn--outline">
                <Share2 />
                <span>Share</span>
              </button>
              <button className="sv-portfolio-btn sv-portfolio-btn--primary">
                <Download />
                <span>Download CV</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="sv-portfolio-tabs">
          <nav className="sv-portfolio-tabs__nav">
            {[
              { id: 'portfolio', label: 'Portfolio', icon: Briefcase },
              { id: 'courses', label: 'Courses', icon: GraduationCap },
              { id: 'skills', label: 'Skills', icon: Award },
              { id: 'profile', label: 'Personal Info', icon: User }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`sv-portfolio-tab ${
                  activeTab === tab.id ? 'sv-portfolio-tab--active' : ''
                }`}
              >
                <tab.icon className="sv-portfolio-tab__icon" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>

          <div className="sv-portfolio-content">
            {/* Portfolio Tab */}
            {activeTab === 'portfolio' && (
              <div className="sv-portfolio-grid">
                {projects.map((project) => (
                  <div key={project.id} className="sv-portfolio-card">
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
                  </div>
                ))}
              </div>
            )}

            {/* Skills Tab */}
            {activeTab === 'skills' && (
              <div className="sv-skills-grid">
                {['Frontend', 'Backend', 'Design', 'Database', 'Programming'].map((category) => (
                  <div key={category} className="sv-skill-category">
                    <h3 className="sv-skill-category__title">{category}</h3>
                    <div className="sv-skill-list">
                      {skills
                        .filter(skill => skill.category === category)
                        .map((skill, index) => (
                          <div key={index} className="sv-skill-item">
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
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="sv-profile">
                <div className="sv-profile-header">
                  <img
                    src={userProfile.avatar}
                    alt={userProfile.name}
                    className="sv-profile-avatar"
                  />
                  <div className="sv-profile-info">
                    <h2 className="sv-profile-info__name">{userProfile.name}</h2>
                    <p className="sv-profile-info__title">{userProfile.title}</p>
                    <button className="sv-profile-info__change-avatar">Change avatar</button>
                  </div>
                </div>

                <div className="sv-profile-form">
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
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioPage;