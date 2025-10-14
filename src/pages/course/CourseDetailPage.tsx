import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Play, 
  Clock, 
  Users, 
  Star, 
  BookOpen, 
  CheckCircle,
  User,
  Linkedin,
  Github as GitHubIcon,
  Globe,
  DollarSign
} from 'lucide-react';
import { getCourse } from '../../services/courseService';
import { CourseDetailDTO } from '../../data/courseDTOs';
import { getMentorProfile, MentorProfile } from '../../services/mentorProfileService';
import { useToast } from '../../hooks/useToast';
import '../../styles/CourseDetailPage.css';

const CourseDetailPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { showError } = useToast();
  
  const [course, setCourse] = useState<CourseDetailDTO | null>(null);
  const [mentorProfile, setMentorProfile] = useState<MentorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'curriculum' | 'instructor'>('overview');

  useEffect(() => {
    if (courseId) {
      loadCourseDetails();
    }
  }, [courseId]);

  const loadCourseDetails = async () => {
    if (!courseId) return;
    
    setLoading(true);
    try {
      const courseData = await getCourse(parseInt(courseId));
      setCourse(courseData);
      
      // Load mentor profile
      if (courseData.author?.id) {
        try {
          const profile = await getMentorProfile(courseData.author.id);
          setMentorProfile(profile);
        } catch {
          console.log('Mentor profile not found');
        }
      }
    } catch (error) {
      console.error('Error loading course details:', error);
      showError('Error', 'Failed to load course details');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price?: number, currency?: string) => {
    if (!price || price === 0) return 'Miễn phí';
    return `${price.toLocaleString('vi-VN')} ${currency || 'VND'}`;
  };

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'beginner': return 'level-beginner';
      case 'intermediate': return 'level-intermediate';
      case 'advanced': return 'level-advanced';
      default: return 'level-beginner';
    }
  };

  if (loading) {
    return (
      <div className="course-detail-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading course details...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="course-detail-container">
        <div className="error-container">
          <h2>Course not found</h2>
          <p>The course you're looking for doesn't exist or has been removed.</p>
          <button onClick={() => navigate('/courses')} className="back-btn">
            <ArrowLeft size={16} />
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="course-detail-container">
      {/* Header */}
      <div className="course-header">
        <button onClick={() => navigate('/courses')} className="back-btn">
          <ArrowLeft size={16} />
          Back to Courses
        </button>
        
        <div className="course-hero">
          <div className="course-info">
            <div className="course-badges">
              <span className={`level-badge ${getLevelColor(course.level)}`}>
                {course.level}
              </span>
              <span className="status-badge">
                {course.status}
              </span>
            </div>
            
            <h1 className="course-title">{course.title}</h1>
            <p className="course-description">{course.description}</p>
            
            <div className="course-meta">
              <div className="meta-item">
                <Users size={16} />
                <span>{course.enrollmentCount} students</span>
              </div>
              <div className="meta-item">
                <BookOpen size={16} />
                <span>{course.modules?.length || 0} modules</span>
              </div>
              <div className="meta-item">
                <Clock size={16} />
                <span>4-6 weeks</span>
              </div>
              <div className="meta-item">
                <Star size={16} />
                <span>{course.averageRating?.toFixed(1) || '4.5'}</span>
              </div>
            </div>
          </div>
          
          <div className="course-preview">
            <div className="preview-card">
              {course.thumbnailUrl || course.thumbnail?.url ? (
                <img src={course.thumbnailUrl || (course.thumbnail?.url ?? '')} alt={course.title} className="preview-image" />
              ) : (
                <div className="preview-placeholder">
                  <BookOpen size={48} />
                </div>
              )}
              
              <div className="preview-overlay">
                <button className="preview-btn">
                  <Play size={20} />
                  Preview Course
                </button>
              </div>
            </div>
            
            <div className="pricing-section">
              <div className="price">
                <span className="price-amount">{formatPrice(course.price, course.currency)}</span>
                {course.price && course.price > 0 && (
                  <span className="price-period">/course</span>
                )}
              </div>
              
              <button className="enroll-btn">
                <DollarSign size={16} />
                Enroll Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="course-nav">
        <button 
          className={`nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`nav-tab ${activeTab === 'curriculum' ? 'active' : ''}`}
          onClick={() => setActiveTab('curriculum')}
        >
          Curriculum
        </button>
        <button 
          className={`nav-tab ${activeTab === 'instructor' ? 'active' : ''}`}
          onClick={() => setActiveTab('instructor')}
        >
          Instructor
        </button>
      </div>

      {/* Content */}
      <div className="course-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="overview-section">
              <h3>What you'll learn</h3>
              <ul className="learning-list">
                <li><CheckCircle size={16} /> Master the fundamentals</li>
                <li><CheckCircle size={16} /> Build real-world projects</li>
                <li><CheckCircle size={16} /> Get hands-on experience</li>
                <li><CheckCircle size={16} /> Receive a certificate</li>
              </ul>
            </div>
            
            <div className="overview-section">
              <h3>Course Description</h3>
              <p>{course.description}</p>
            </div>
            
            {course.modules && course.modules.length > 0 && (
              <div className="overview-section">
                <h3>Course Content</h3>
                <div className="modules-preview">
                  {course.modules.slice(0, 3).map((module, index) => (
                    <div key={module.id} className="module-preview">
                      <div className="module-number">{index + 1}</div>
                      <div className="module-info">
                        <h4>{module.title}</h4>
                        <p>{module.description}</p>
                      </div>
                    </div>
                  ))}
                  {course.modules.length > 3 && (
                    <div className="more-modules">
                      +{course.modules.length - 3} more modules
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'curriculum' && (
          <div className="curriculum-tab">
            <h3>Course Curriculum</h3>
            {course.modules && course.modules.length > 0 ? (
              <div className="modules-list">
                {course.modules.map((module, index) => (
                  <div key={module.id} className="module-item">
                    <div className="module-header">
                      <div className="module-number">{index + 1}</div>
                      <div className="module-info">
                        <h4>{module.title}</h4>
                        <p>{module.description}</p>
                      </div>
                    </div>
                    <div className="module-details">
                      <span className="module-lessons">5 lessons</span>
                      <span className="module-duration">2 hours</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>No modules available yet.</p>
            )}
          </div>
        )}

        {activeTab === 'instructor' && (
          <div className="instructor-tab">
            {course.author && (
              <div className="instructor-profile">
                <div className="instructor-header">
                  <div className="instructor-avatar">
                    {mentorProfile?.avatar ? (
                      <img src={mentorProfile.avatar} alt={course.author.firstName} />
                    ) : (
                      <User size={48} />
                    )}
                  </div>
                  <div className="instructor-info">
                    <h3>{course.author.firstName} {course.author.lastName}</h3>
                    <p className="instructor-title">{mentorProfile?.specialization || 'Course Instructor'}</p>
                    <div className="instructor-stats">
                      <div className="stat">
                        <Star size={16} />
                        <span>4.8 rating</span>
                      </div>
                      <div className="stat">
                        <Users size={16} />
                        <span>1,234 students</span>
                      </div>
                      <div className="stat">
                        <BookOpen size={16} />
                        <span>12 courses</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {mentorProfile?.bio && (
                  <div className="instructor-bio">
                    <h4>About the Instructor</h4>
                    <p>{mentorProfile.bio}</p>
                  </div>
                )}
                
                {mentorProfile?.skills && mentorProfile.skills.length > 0 && (
                  <div className="instructor-skills">
                    <h4>Skills</h4>
                    <div className="skills-list">
                      {mentorProfile.skills.map((skill: string) => (
                        <span key={skill} className="skill-tag">{skill}</span>
                      ))}
                    </div>
                  </div>
                )}
                
                {mentorProfile?.socialLinks && (
                  <div className="instructor-social">
                    <h4>Connect</h4>
                    <div className="social-links">
                      {mentorProfile.socialLinks.linkedin && (
                        <a href={mentorProfile.socialLinks.linkedin} target="_blank" rel="noopener noreferrer">
                          <Linkedin size={20} />
                        </a>
                      )}
                      {mentorProfile.socialLinks.github && (
                        <a href={mentorProfile.socialLinks.github} target="_blank" rel="noopener noreferrer">
                          <GitHubIcon size={20} />
                        </a>
                      )}
                      {mentorProfile.socialLinks.website && (
                        <a href={mentorProfile.socialLinks.website} target="_blank" rel="noopener noreferrer">
                          <Globe size={20} />
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseDetailPage;

