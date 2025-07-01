import { useState } from 'react';
import { 
  Download, Printer, Share2, Edit, Eye, EyeOff, 
  ArrowLeft, Mail, Phone, MapPin, Globe, Linkedin, 
  Award, Briefcase, GraduationCap, Star,
  User, FileText, Layout, Palette, Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import '../../styles/CV.css';

const CVPage = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('modern');
  const [showPreview, setShowPreview] = useState(true);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4, staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  // Mock CV data (in a real app, this would come from user profile/API)
  const cvData = {
    personalInfo: {
      name: 'Tran Xuan Truong',
      title: 'Full-stack Developer & UI/UX Designer',
      avatar: 'https://media.licdn.com/dms/image/v2/D5603AQHZv1brnCXkRQ/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1719832250061?e=1755734400&v=beta&t=SQ9q4CPeTzzA7HbLrtjGiJEEeLRgWCYF4BpiTiU6FJw',
      email: 'truongtranxuan41@gmail.com',
      phone: '0398648063',
      location: 'Ho Chi Minh City, Vietnam',
      linkedin: 'linkedin.com/in/tran-xuan-truong-ab00b7317',
      github: 'github.com/TruongTXK18FPT',
      website: 'truongtran.dev',
      summary: 'Passionate Computer Science student at FPT University with expertise in modern web technologies. Proven track record in delivering innovative solutions and exceptional user experiences. Seeking to leverage technical skills and creative problem-solving abilities in a challenging full-stack development role.'
    },
    experience: [
      {
        id: 1,
        title: 'Frontend Developer Intern',
        company: 'TechViet Solutions',
        period: 'Jun 2024 - Present',
        location: 'Ho Chi Minh City, Vietnam',
        achievements: [
          'Developed responsive web applications using React and TypeScript',
          'Improved application performance by 40% through code optimization',
          'Collaborated with design team to implement pixel-perfect UI components',
          'Mentored 2 junior developers in modern React best practices'
        ]
      },
      {
        id: 2,
        title: 'Freelance UI/UX Designer',
        company: 'Self-employed',
        period: 'Jan 2024 - Present',
        location: 'Remote',
        achievements: [
          'Designed and delivered 15+ web and mobile app interfaces',
          'Increased client conversion rates by average of 35%',
          'Specialized in e-commerce and SaaS application design',
          'Maintained 5-star rating across all freelance platforms'
        ]
      }
    ],
    education: [
      {
        id: 1,
        degree: 'Bachelor of Software Engineering',
        institution: 'FPT University',
        period: '2022 - 2026',
        location: 'Ho Chi Minh City, Vietnam',
        gpa: '3.0/4.0',
        highlights: [
          'Dean\'s List for 4 consecutive semesters',
          'President of Computer Science Student Association',
          'Led team in National Programming Contest (Top 10)'
        ]
      }
    ],
    skills: {
      technical: [
        { name: 'JavaScript/TypeScript', level: 90 },
        { name: 'React/Next.js', level: 88 },
        { name: 'Node.js/Express', level: 85 },
        { name: 'Python/Django', level: 80 },
        { name: 'UI/UX Design', level: 92 },
        { name: 'Figma/Adobe XD', level: 90 },
        { name: 'Git/GitHub', level: 85 },
        { name: 'AWS/Cloud Services', level: 75 }
      ],
      soft: [
        'Leadership & Team Management',
        'Problem Solving',
        'Communication',
        'Project Management',
        'Critical Thinking',
        'Adaptability'
      ]
    },
    projects: [
      {
        id: 1,
        name: 'SkillVerse Platform',
        description: 'Comprehensive learning management system with gamification',
        technologies: ['React', 'Node.js', 'MongoDB', 'AWS'],
        highlights: [
          '10,000+ active users',
          'Real-time collaboration features',
          'AI-powered learning recommendations'
        ]
      },
      {
        id: 2,
        name: 'E-commerce Redesign',
        description: 'Complete UI/UX overhaul for fashion e-commerce platform',
        technologies: ['Figma', 'React', 'Tailwind CSS'],
        highlights: [
          '35% increase in conversion rate',
          'Mobile-first responsive design',
          'Improved accessibility compliance'
        ]
      }
    ],
    certifications: [
      'AWS Certified Developer Associate',
      'Google UX Design Certificate',
      'Meta Frontend Developer Certificate',
      'Advanced React Development (SkillVerse)'
    ],
    languages: [
      { name: 'Vietnamese', level: 'Native' },
      { name: 'English', level: 'Professional Working Proficiency' },
      { name: 'Japanese', level: 'Elementary' }
    ]
  };

  const cvTemplates = [
    { id: 'modern', name: 'Modern', preview: '🎨', description: 'Clean and contemporary design' },
    { id: 'professional', name: 'Professional', preview: '💼', description: 'Traditional business format' },
    { id: 'creative', name: 'Creative', preview: '🌟', description: 'Bold and artistic layout' },
    { id: 'minimal', name: 'Minimal', preview: '⚪', description: 'Simple and elegant' }
  ];

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
  };

  const handleDownloadPDF = () => {
    // In a real app, this would generate and download a PDF
    console.log('Downloading CV as PDF...');
    // You could use libraries like jsPDF, Puppeteer, or a backend service
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    // In a real app, this would generate a shareable link
    const shareData = {
      title: `${cvData.personalInfo.name}'s CV`,
      text: `Check out ${cvData.personalInfo.name}'s professional CV`,
      url: window.location.href,
    };

    if (navigator.share) {
      navigator.share(shareData);
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('CV link copied to clipboard!');
    }
  };

  const handleSave = () => {
    // In a real app, this would save the CV data
    console.log('Saving CV...');
    setIsEditing(false);
  };

  return (
    <div className={`cv-container ${theme}`}>
      {/* Header with Controls */}
      <motion.div 
        className="cv-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="cv-header__left">
          <button 
            className="cv-btn cv-btn--ghost"
            onClick={() => navigate('/portfolio')}
          >
            <ArrowLeft size={20} />
            Back to Portfolio
          </button>
          <h1 className="cv-header__title">CV Builder</h1>
        </div>

        <div className="cv-header__right">
          <div className="cv-header__actions">
            <button 
              className="cv-btn cv-btn--outline"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? <EyeOff size={18} /> : <Eye size={18} />}
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </button>
            <button 
              className="cv-btn cv-btn--outline"
              onClick={() => setIsEditing(!isEditing)}
            >
              <Edit size={18} />
              {isEditing ? 'View Mode' : 'Edit Mode'}
            </button>
            <button 
              className="cv-btn cv-btn--outline"
              onClick={handlePrint}
            >
              <Printer size={18} />
              Print
            </button>
            <button 
              className="cv-btn cv-btn--outline"
              onClick={handleShare}
            >
              <Share2 size={18} />
              Share
            </button>
            <button 
              className="cv-btn cv-btn--primary"
              onClick={handleDownloadPDF}
            >
              <Download size={18} />
              Download PDF
            </button>
          </div>
        </div>
      </motion.div>

      <div className="cv-content">
        {/* Template Selector (shown when editing) */}
        <AnimatePresence>
          {isEditing && (
            <motion.div 
              className="cv-sidebar"
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3 }}
            >
              <div className="cv-sidebar__section">
                <h3 className="cv-sidebar__title">
                  <Layout size={20} />
                  Choose Template
                </h3>
                <div className="cv-templates">
                  {cvTemplates.map((template) => (
                    <motion.div
                      key={template.id}
                      className={`cv-template-card ${selectedTemplate === template.id ? 'active' : ''}`}
                      onClick={() => handleTemplateChange(template.id)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="cv-template-preview">{template.preview}</div>
                      <div className="cv-template-info">
                        <h4>{template.name}</h4>
                        <p>{template.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="cv-sidebar__section">
                <h3 className="cv-sidebar__title">
                  <Palette size={20} />
                  Customization
                </h3>
                <div className="cv-controls">
                  <div className="cv-control-group">
                    <label htmlFor="font-size-slider">Font Size</label>
                    <input 
                      id="font-size-slider"
                      type="range" 
                      min="12" 
                      max="16" 
                      defaultValue="14" 
                    />
                  </div>
                  <div className="cv-control-group">
                    <label htmlFor="color-scheme">Color Scheme</label>
                    <div id="color-scheme" className="cv-color-options">
                      <div className="cv-color-option cv-color--blue active"></div>
                      <div className="cv-color-option cv-color--green"></div>
                      <div className="cv-color-option cv-color--purple"></div>
                      <div className="cv-color-option cv-color--red"></div>
                    </div>
                  </div>
                </div>
              </div>

              {isEditing && (
                <button 
                  className="cv-btn cv-btn--primary cv-save-btn"
                  onClick={handleSave}
                >
                  <Save size={18} />
                  Save Changes
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* CV Preview */}
        <AnimatePresence>
          {showPreview && (
            <motion.div 
              className={`cv-preview ${selectedTemplate} ${isEditing ? 'with-sidebar' : ''}`}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <div className="cv-document">
                {/* Header Section */}
                <motion.header className="cv-section cv-header-section" variants={itemVariants}>
                  <div className="cv-personal-info">
                    <div className="cv-header-content">
                      <div className="cv-avatar-section">
                        <div className="cv-avatar">
                          <img 
                            src={cvData.personalInfo.avatar} 
                            alt={cvData.personalInfo.name}
                            className="cv-avatar-image"
                          />
                        </div>
                      </div>
                      
                      <div className="cv-name-section">
                        <h1 className="cv-name">{cvData.personalInfo.name}</h1>
                        <h2 className="cv-title">{cvData.personalInfo.title}</h2>
                      </div>
                    </div>
                    
                    <div className="cv-contact">
                      <div className="cv-contact-item">
                        <Mail size={16} />
                        <span>{cvData.personalInfo.email}</span>
                      </div>
                      <div className="cv-contact-item">
                        <Phone size={16} />
                        <span>{cvData.personalInfo.phone}</span>
                      </div>
                      <div className="cv-contact-item">
                        <MapPin size={16} />
                        <span>{cvData.personalInfo.location}</span>
                      </div>
                      <div className="cv-contact-item">
                        <Linkedin size={16} />
                        <span>{cvData.personalInfo.linkedin}</span>
                      </div>
                      <div className="cv-contact-item">
                        <Globe size={16} />
                        <span>{cvData.personalInfo.github}</span>
                      </div>
                      <div className="cv-contact-item">
                        <Globe size={16} />
                        <span>{cvData.personalInfo.website}</span>
                      </div>
                    </div>
                  </div>
                </motion.header>

                {/* Summary Section */}
                <motion.section className="cv-section" variants={itemVariants}>
                  <h3 className="cv-section-title">
                    <User size={20} />
                    Professional Summary
                  </h3>
                  <p className="cv-summary">{cvData.personalInfo.summary}</p>
                </motion.section>

                {/* Experience Section */}
                <motion.section className="cv-section" variants={itemVariants}>
                  <h3 className="cv-section-title">
                    <Briefcase size={20} />
                    Professional Experience
                  </h3>
                  {cvData.experience.map((exp) => (
                    <div key={exp.id} className="cv-experience-item">
                      <div className="cv-experience-header">
                        <div>
                          <h4 className="cv-job-title">{exp.title}</h4>
                          <p className="cv-company">{exp.company}</p>
                        </div>
                        <div className="cv-experience-meta">
                          <span className="cv-period">{exp.period}</span>
                          <span className="cv-location">{exp.location}</span>
                        </div>
                      </div>
                      <ul className="cv-achievements">
                        {exp.achievements.map((achievement) => (
                          <li key={achievement.substring(0, 20)}>{achievement}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </motion.section>

                {/* Education Section */}
                <motion.section className="cv-section" variants={itemVariants}>
                  <h3 className="cv-section-title">
                    <GraduationCap size={20} />
                    Education
                  </h3>
                  {cvData.education.map((edu) => (
                    <div key={edu.id} className="cv-education-item">
                      <div className="cv-education-header">
                        <div>
                          <h4 className="cv-degree">{edu.degree}</h4>
                          <p className="cv-institution">{edu.institution}</p>
                          <p className="cv-gpa">GPA: {edu.gpa}</p>
                        </div>
                        <div className="cv-education-meta">
                          <span className="cv-period">{edu.period}</span>
                          <span className="cv-location">{edu.location}</span>
                        </div>
                      </div>
                      <ul className="cv-education-highlights">
                        {edu.highlights.map((highlight) => (
                          <li key={highlight.substring(0, 20)}>{highlight}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </motion.section>

                {/* Skills Section */}
                <motion.section className="cv-section" variants={itemVariants}>
                  <h3 className="cv-section-title">
                    <Star size={20} />
                    Technical Skills
                  </h3>
                  <div className="cv-skills-grid">
                    {cvData.skills.technical.map((skill) => (
                      <div key={skill.name} className="cv-skill-item">
                        <div className="cv-skill-header">
                          <span className="cv-skill-name">{skill.name}</span>
                          <span className="cv-skill-level">{skill.level}%</span>
                        </div>
                        <div className="cv-skill-bar">
                          <div 
                            className="cv-skill-progress" 
                            style={{ width: `${skill.level}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="cv-soft-skills">
                    <h4>Core Competencies</h4>
                    <div className="cv-soft-skills-list">
                      {cvData.skills.soft.map((skill) => (
                        <span key={skill} className="cv-soft-skill-tag">{skill}</span>
                      ))}
                    </div>
                  </div>
                </motion.section>

                {/* Projects Section */}
                <motion.section className="cv-section" variants={itemVariants}>
                  <h3 className="cv-section-title">
                    <FileText size={20} />
                    Key Projects
                  </h3>
                  {cvData.projects.map((project) => (
                    <div key={project.id} className="cv-project-item">
                      <h4 className="cv-project-name">{project.name}</h4>
                      <p className="cv-project-description">{project.description}</p>
                      <div className="cv-project-technologies">
                        {project.technologies.map((tech) => (
                          <span key={tech} className="cv-tech-tag">{tech}</span>
                        ))}
                      </div>
                      <ul className="cv-project-highlights">
                        {project.highlights.map((highlight) => (
                          <li key={highlight.substring(0, 20)}>{highlight}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </motion.section>

                {/* Certifications Section */}
                <motion.section className="cv-section" variants={itemVariants}>
                  <h3 className="cv-section-title">
                    <Award size={20} />
                    Certifications
                  </h3>
                  <div className="cv-certifications">
                    {cvData.certifications.map((cert) => (
                      <div key={cert} className="cv-certification-item">
                        <Award size={16} />
                        <span>{cert}</span>
                      </div>
                    ))}
                  </div>
                </motion.section>

                {/* Languages Section */}
                <motion.section className="cv-section cv-section--last" variants={itemVariants}>
                  <h3 className="cv-section-title">
                    <Globe size={20} />
                    Languages
                  </h3>
                  <div className="cv-languages">
                    {cvData.languages.map((lang) => (
                      <div key={lang.name} className="cv-language-item">
                        <span className="cv-language-name">{lang.name}</span>
                        <span className="cv-language-level">{lang.level}</span>
                      </div>
                    ))}
                  </div>
                </motion.section>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CVPage;
