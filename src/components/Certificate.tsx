import { useState } from 'react';
import { 
  Download, Share2, ArrowLeft, Award, CheckCircle, Calendar, 
  Clock, Star, ExternalLink, QrCode, Globe,
  User, Building, Trophy, Zap, Target
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import '../styles/Certificate.css';

interface CertificateData {
  id: number;
  title: string;
  category: string;
  provider: string;
  completionDate: string;
  hours: number;
  level: string;
  badge: string;
  skills: string[];
  verified: boolean;
  description: string;
  learningOutcomes: string[];
  instructor: string;
  certificateId: string;
  credentialUrl: string;
  score: number;
  badge3D?: string;
  relatedCertificates: number[];
  nextRecommendations: string[];
}

const Certificate = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { theme } = useTheme();
  const [viewMode, setViewMode] = useState<'certificate' | 'details' | 'verify'>('certificate');

  // In a real app, you would fetch certificate data based on the ID
  const certificateId = parseInt(id || '1', 10);

  // Mock certificate data (in real app, this would be fetched based on ID)
  const certificateData: CertificateData = {
    id: certificateId,
    title: 'Advanced React Development',
    category: 'Technical',
    provider: 'SkillVerse Academy',
    completionDate: '2024-03-15',
    hours: 40,
    level: 'Advanced',
    badge: '🏆',
    skills: ['React.js', 'Redux', 'TypeScript', 'Testing', 'Performance Optimization', 'Hooks'],
    verified: true,
    description: 'Master advanced React concepts including performance optimization, custom hooks, context management, and testing strategies. Build production-ready applications with modern React practices.',
    learningOutcomes: [
      'Master React Hooks and custom hook development',
      'Implement advanced state management with Redux Toolkit',
      'Build type-safe applications with TypeScript',
      'Apply performance optimization techniques',
      'Write comprehensive unit and integration tests',
      'Deploy and monitor React applications in production'
    ],
    instructor: 'Dr. Sarah Chen',
    certificateId: 'SV-REACT-ADV-2024-001',
    credentialUrl: 'https://skillverse.vn/verify/SV-REACT-ADV-2024-001',
    score: 95,
    badge3D: '🎯',
    relatedCertificates: [2, 3],
    nextRecommendations: [
      'Full-Stack Development with Node.js',
      'React Native Mobile Development',
      'DevOps for React Applications'
    ]
  };

  const relatedCertificates = [
    {
      id: 2,
      title: 'UI/UX Design Fundamentals',
      badge: '🎨',
      level: 'Intermediate'
    },
    {
      id: 3,
      title: 'Leadership & Team Management',
      badge: '👥',
      level: 'Intermediate'
    }
  ];

  const handleDownloadCertificate = () => {
    // In real app, this would generate/download the certificate PDF
    window.print();
  };

  const handleShareCertificate = () => {
    const shareData = {
      title: `${certificateData.title} Certificate`,
      text: `I've completed ${certificateData.title} from ${certificateData.provider}!`,
      url: certificateData.credentialUrl
    };

    if (navigator.share) {
      navigator.share(shareData);
    } else {
      navigator.clipboard.writeText(certificateData.credentialUrl);
      console.log('Certificate URL copied to clipboard');
    }
  };

  const handleVerifyCertificate = () => {
    window.open(certificateData.credentialUrl, '_blank');
  };

  return (
    <motion.div 
      className={`certificate-container ${theme}`}
      data-theme={theme}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="certificate-header">
        <div className="certificate-header__left">
          <motion.button 
            className="cert-btn cert-btn--back"
            onClick={() => navigate('/portfolio')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft size={18} />
            Back to Portfolio
          </motion.button>
        </div>

        <div className="certificate-header__center">
          <h1 className="certificate-header__title">Certificate Details</h1>
          <p className="certificate-header__subtitle">View and share your certification</p>
        </div>

        <div className="certificate-header__right">
          <div className="certificate-actions">
            <motion.button 
              className="cert-btn cert-btn--outline"
              onClick={handleShareCertificate}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Share2 size={16} />
              Share
            </motion.button>
            <motion.button 
              className="cert-btn cert-btn--outline"
              onClick={handleVerifyCertificate}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <CheckCircle size={16} />
              Verify
            </motion.button>
            <motion.button 
              className="cert-btn cert-btn--primary"
              onClick={handleDownloadCertificate}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Download size={16} />
              Download
            </motion.button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="certificate-nav">
        <nav className="certificate-nav__tabs">
          <button 
            className={`certificate-nav__tab ${viewMode === 'certificate' ? 'active' : ''}`}
            onClick={() => setViewMode('certificate')}
          >
            <Award size={16} />
            Certificate
          </button>
          <button 
            className={`certificate-nav__tab ${viewMode === 'details' ? 'active' : ''}`}
            onClick={() => setViewMode('details')}
          >
            <Target size={16} />
            Details
          </button>
          <button 
            className={`certificate-nav__tab ${viewMode === 'verify' ? 'active' : ''}`}
            onClick={() => setViewMode('verify')}
          >
            <CheckCircle size={16} />
            Verification
          </button>
        </nav>
      </div>

      <div className="certificate-content">
        {/* Certificate View */}
        {viewMode === 'certificate' && (
          <motion.div 
            className="certificate-view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="certificate-document">
              <div className="certificate-doc-header">
                <div className="certificate-provider">
                  <Building size={20} />
                  <span>{certificateData.provider}</span>
                </div>
                <div className="certificate-verified">
                  {certificateData.verified && (
                    <>
                      <CheckCircle size={20} className="verified-icon" />
                      <span>Verified Certificate</span>
                    </>
                  )}
                </div>
              </div>

              <div className="certificate-main">
                <div className="certificate-badge-section">
                  <div className="certificate-main-badge">
                    {certificateData.badge3D || certificateData.badge}
                  </div>
                  <div className="certificate-level-badge">
                    {certificateData.level}
                  </div>
                </div>

                <div className="certificate-text">
                  <h1 className="certificate-title">Certificate of Completion</h1>
                  <p className="certificate-subtitle">This is to certify that</p>
                  <h2 className="certificate-recipient">Tran Xuan Truong</h2>
                  <p className="certificate-completion-text">has successfully completed the course</p>
                  <h3 className="certificate-course-title">{certificateData.title}</h3>
                  <p className="certificate-description">{certificateData.description}</p>

                  <div className="certificate-details-grid">
                    <div className="certificate-detail">
                      <Calendar size={16} />
                      <span>Completed: {new Date(certificateData.completionDate).toLocaleDateString()}</span>
                    </div>
                    <div className="certificate-detail">
                      <Clock size={16} />
                      <span>Duration: {certificateData.hours} hours</span>
                    </div>
                    <div className="certificate-detail">
                      <Star size={16} />
                      <span>Score: {certificateData.score}%</span>
                    </div>
                    <div className="certificate-detail">
                      <User size={16} />
                      <span>Instructor: {certificateData.instructor}</span>
                    </div>
                  </div>

                  <div className="certificate-skills-achieved">
                    <h4>Skills Achieved:</h4>
                    <div className="certificate-skills-tags">
                      {certificateData.skills.map((skill) => (
                        <span key={skill} className="certificate-skill-tag">{skill}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="certificate-footer">
                <div className="certificate-signature">
                  <div className="signature-line">
                    <div className="signature-placeholder"></div>
                    <p>Dr. Sarah Chen</p>
                    <p>Course Instructor</p>
                  </div>
                  <div className="signature-line">
                    <div className="signature-placeholder"></div>
                    <p>SkillVerse Academy</p>
                    <p>Certification Authority</p>
                  </div>
                </div>

                <div className="certificate-id">
                  <QrCode size={24} />
                  <div>
                    <p>Certificate ID: {certificateData.certificateId}</p>
                    <p>Verify at: skillverse.vn/verify</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Details View */}
        {viewMode === 'details' && (
          <motion.div 
            className="certificate-details-view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="details-grid">
              <div className="details-main">
                <div className="details-section">
                  <h3>Course Overview</h3>
                  <p>{certificateData.description}</p>
                </div>

                <div className="details-section">
                  <h3>Learning Outcomes</h3>
                  <ul className="learning-outcomes-list">
                    {certificateData.learningOutcomes.map((outcome) => (
                      <li key={outcome}>
                        <CheckCircle size={16} className="outcome-icon" />
                        {outcome}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="details-section">
                  <h3>Skills Developed</h3>
                  <div className="skills-grid">
                    {certificateData.skills.map((skill) => (
                      <div key={skill} className="skill-card">
                        <Zap size={16} />
                        <span>{skill}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="details-section">
                  <h3>Next Steps</h3>
                  <div className="recommendations">
                    {certificateData.nextRecommendations.map((rec) => (
                      <div key={rec} className="recommendation-item">
                        <Target size={16} />
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="details-sidebar">
                <div className="certificate-stats">
                  <h3>Certificate Statistics</h3>
                  <div className="stat-item">
                    <Calendar size={16} />
                    <div>
                      <span className="stat-label">Completion Date</span>
                      <span className="stat-value">{new Date(certificateData.completionDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="stat-item">
                    <Clock size={16} />
                    <div>
                      <span className="stat-label">Study Hours</span>
                      <span className="stat-value">{certificateData.hours} hours</span>
                    </div>
                  </div>
                  <div className="stat-item">
                    <Star size={16} />
                    <div>
                      <span className="stat-label">Final Score</span>
                      <span className="stat-value">{certificateData.score}%</span>
                    </div>
                  </div>
                  <div className="stat-item">
                    <Trophy size={16} />
                    <div>
                      <span className="stat-label">Level</span>
                      <span className="stat-value">{certificateData.level}</span>
                    </div>
                  </div>
                </div>

                <div className="related-certificates">
                  <h3>Related Certificates</h3>
                  {relatedCertificates.map((cert) => (
                    <div key={cert.id} className="related-cert-item">
                      <div className="related-cert-badge">{cert.badge}</div>
                      <div className="related-cert-info">
                        <h4>{cert.title}</h4>
                        <span className="related-cert-level">{cert.level}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="instructor-info">
                  <h3>Instructor</h3>
                  <div className="instructor-card">
                    <User size={24} />
                    <div>
                      <h4>{certificateData.instructor}</h4>
                      <p>Senior Software Engineer at Google</p>
                      <p>10+ years experience in React development</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Verification View */}
        {viewMode === 'verify' && (
          <motion.div 
            className="certificate-verify-view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="verify-content">
              <div className="verify-main">
                <div className="verify-status">
                  <CheckCircle size={48} className="verify-icon" />
                  <h2>Certificate Verified</h2>
                  <p>This certificate has been verified by SkillVerse Academy and is authentic.</p>
                </div>

                <div className="verify-details">
                  <h3>Verification Details</h3>
                  <div className="verify-grid">
                    <div className="verify-item">
                      <span className="verify-label">Certificate ID:</span>
                      <span className="verify-value">{certificateData.certificateId}</span>
                    </div>
                    <div className="verify-item">
                      <span className="verify-label">Issued To:</span>
                      <span className="verify-value">Tran Xuan Truong</span>
                    </div>
                    <div className="verify-item">
                      <span className="verify-label">Course:</span>
                      <span className="verify-value">{certificateData.title}</span>
                    </div>
                    <div className="verify-item">
                      <span className="verify-label">Provider:</span>
                      <span className="verify-value">{certificateData.provider}</span>
                    </div>
                    <div className="verify-item">
                      <span className="verify-label">Issue Date:</span>
                      <span className="verify-value">{new Date(certificateData.completionDate).toLocaleDateString()}</span>
                    </div>
                    <div className="verify-item">
                      <span className="verify-label">Verification URL:</span>
                      <a href={certificateData.credentialUrl} target="_blank" rel="noopener noreferrer" className="verify-link">
                        <Globe size={16} />
                        {certificateData.credentialUrl}
                      </a>
                    </div>
                  </div>
                </div>

                <div className="verify-actions">
                  <button className="cert-btn cert-btn--outline" onClick={handleVerifyCertificate}>
                    <ExternalLink size={16} />
                    Open Verification Page
                  </button>
                  <button className="cert-btn cert-btn--outline" onClick={() => navigator.clipboard.writeText(certificateData.credentialUrl)}>
                    <Share2 size={16} />
                    Copy Verification Link
                  </button>
                </div>
              </div>

              <div className="verify-qr">
                <div className="qr-section">
                  <h3>QR Code Verification</h3>
                  <div className="qr-placeholder">
                    <QrCode size={120} />
                  </div>
                  <p>Scan this QR code to verify the certificate instantly</p>
                </div>

                <div className="blockchain-verification">
                  <h3>Blockchain Verification</h3>
                  <div className="blockchain-status">
                    <CheckCircle size={20} className="blockchain-icon" />
                    <span>Secured on Blockchain</span>
                  </div>
                  <p>This certificate is immutably recorded on the blockchain for permanent verification.</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default Certificate;
