import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Rocket, Brain, Users, Briefcase, Zap, 
  BookOpen, Award, Wallet, Gamepad2, Map, MessageCircle,
  Sparkles, ChevronRight, Github, Linkedin, Globe
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Logo from '../../assets/brand/skillverse.png';
import EarthImage from '../../assets/award/earth.png';
import MeowlUser from '../../assets/space-role/meowl-user.png';
import MeowlMentor from '../../assets/space-role/meowl-mentor.png';
import MeowlBusiness from '../../assets/space-role/meowl-business.png';
import MeowlGuide from '../../components/meowl/MeowlGuide';
import './AboutPage.css';

const AboutPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [isGlobeHovered, setIsGlobeHovered] = useState(false);

  const features = [
    {
      icon: <Map size={28} />,
      title: 'AI Roadmap',
      titleVi: 'Lộ trình AI',
      description: 'Personalized learning paths that adapt to your goals and progress',
      descriptionVi: 'Lộ trình học tập cá nhân hóa, tự động cập nhật theo tiến trình',
      color: '#00d4ff'
    },
    {
      icon: <MessageCircle size={28} />,
      title: 'Meowl Assistant',
      titleVi: 'Trợ lý Meowl',
      description: 'AI chatbot for learning guidance and skill recommendations',
      descriptionVi: 'Chatbot AI hướng dẫn học tập, gợi ý kỹ năng cần luyện',
      color: '#f59e0b'
    },
    {
      icon: <BookOpen size={28} />,
      title: 'Micro Learning',
      titleVi: 'Học Micro',
      description: '5-15 minute lessons, practical content you can apply immediately',
      descriptionVi: 'Bài học 5-15 phút, nội dung thực dụng, áp dụng ngay',
      color: '#10b981'
    },
    {
      icon: <Users size={28} />,
      title: 'Mentorship 1:1',
      titleVi: 'Mentor 1:1',
      description: 'Connect with industry mentors for personalized guidance',
      descriptionVi: 'Kết nối với mentor ngành để được hướng dẫn cá nhân',
      color: '#6366f1'
    },
    {
      icon: <Wallet size={28} />,
      title: 'Skill Wallet',
      titleVi: 'Ví Kỹ năng',
      description: 'AI-powered digital portfolio showcasing your verified skills',
      descriptionVi: 'Portfolio số AI tự động tổng hợp dự án và đánh giá',
      color: '#ec4899'
    },
    {
      icon: <Briefcase size={28} />,
      title: 'Micro-job Market',
      titleVi: 'Việc làm Micro',
      description: 'Real freelance opportunities matched to your skills',
      descriptionVi: 'Cơ hội freelance thật, AI match theo kỹ năng',
      color: '#8b5cf6'
    },
    {
      icon: <Gamepad2 size={28} />,
      title: 'Gamification',
      titleVi: 'Game hóa',
      description: 'XP, badges, streaks, and rewards to keep you motivated',
      descriptionVi: 'XP, huy hiệu, streak, phần thưởng tạo động lực học',
      color: '#ef4444'
    },
    {
      icon: <Award size={28} />,
      title: 'Certificates',
      titleVi: 'Chứng chỉ',
      description: 'Earn verified certificates to showcase your achievements',
      descriptionVi: 'Nhận chứng chỉ xác thực để chứng minh năng lực',
      color: '#14b8a6'
    }
  ];

  const team = [
    {
      name: 'Trần Xuân Trường',
      role: 'Team Lead / Fullstack Developer',
      description: 'System architecture, React frontend, Spring Boot backend',
      avatar: 'https://res.cloudinary.com/djv7loilz/image/upload/v1764232186/eb0a438d-90e8-4fa0-87ea-c23e6b11fef2_toppw5.jpg',
      github: 'https://github.com/TruongTXK18FPT',
      linkedin: 'https://www.linkedin.com/in/tran-xuan-truong-ab00b7317/'
    },
    {
      name: 'Trần Phạm Bách Cát',
      role: 'Frontend Developer',
      description: 'UI/UX, responsive layout, web experience optimization',
      avatar: 'https://res.cloudinary.com/djv7loilz/image/upload/v1764232185/b584abe7-4f1c-41ac-914b-5a01e44f6831_ftbxph.png',
      github: 'https://github.com/Sendudu2311',
      linkedin: ''
    },
    {
      name: 'Trần Quang Duy',
      role: 'Frontend & Mobile Developer',
      description: 'Web interface & Flutter mobile app development',
      avatar: 'https://res.cloudinary.com/djv7loilz/image/upload/v1761150993/skillverse/portfolios/avatars/file_wcjene.jpg',
      github: 'https://github.com/TranDuy-eth',
      linkedin: ''
    },
    {
      name: 'Nguyễn Hoàng Phụng',
      role: 'Backend Developer',
      description: 'API, security, data models, AI integration',
      avatar: 'https://res.cloudinary.com/djv7loilz/image/upload/v1764232186/9e376556-15fc-4a7a-940b-2b4a37e332d1_qepd4i.png',
      github: 'https://github.com/9m0m',
      linkedin: ''
    }
  ];

  const stats = [
    { value: '3', label: 'Core Problems Solved', labelVi: 'Vấn đề cốt lõi' },
    { value: '8+', label: 'Key Features', labelVi: 'Tính năng chính' },
    { value: '4', label: 'User Groups', labelVi: 'Nhóm người dùng' },
    { value: '∞', label: 'Possibilities', labelVi: 'Khả năng' }
  ];

  return (
    <div className="about-page">
      {/* Animated Background */}
      <div className="about-bg-effects">
        <div className="about-grid-overlay"></div>
        <div className="about-glow-orb about-orb-1"></div>
        <div className="about-glow-orb about-orb-2"></div>
        <div className="about-glow-orb about-orb-3"></div>
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="about-particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${15 + Math.random() * 10}s`
            }}
          />
        ))}
      </div>

      {/* Hero Section */}
      <section className="about-hero">
        <motion.div
          className="about-hero-content"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="about-hero-logo-container">
            <img src={Logo} alt="SkillVerse" className="about-hero-logo" />
            <div className="about-logo-glow-ring"></div>
          </div>
          
          <motion.h1 
            className="about-hero-title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <span className="about-title-gradient">SKILLVERSE</span>
          </motion.h1>
          
          <motion.p 
            className="about-hero-tagline"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            Learn Fast.Fail Smart.Improve Constantsly
          </motion.p>
          
          <motion.p 
            className="about-hero-tagline-vi"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            Học nhanh – Luyện thật – Có việc thật
          </motion.p>

          <motion.div 
            className="about-hero-description"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <p>
              Nền tảng AI dành cho sinh viên và người trẻ. Kết hợp học kỹ năng, 
              mentor, portfolio và cơ hội micro-job trong một hành trình duy nhất.
            </p>
          </motion.div>

          <motion.div 
            className="about-hero-cta"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            <Link to={isAuthenticated ? "/chatbot" : "/register"} className="about-cta-button primary">
              <Rocket size={20} />
              <span>{isAuthenticated ? "Trò chuyện với AI" : "Bắt đầu ngay"}</span>
            </Link>
            <Link to="/courses" className="about-cta-button secondary">
              <BookOpen size={20} />
              <span>Khám phá khóa học</span>
            </Link>
          </motion.div>
        </motion.div>

        {/* Hologram Border */}
        <div className="about-hero-holo-border">
          <div className="about-holo-corner top-left"></div>
          <div className="about-holo-corner top-right"></div>
          <div className="about-holo-corner bottom-left"></div>
          <div className="about-holo-corner bottom-right"></div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="about-stats">
        <div className="about-stats-container">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              className="about-stat-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              viewport={{ once: true }}
            >
              <span className="about-stat-value">{stat.value}</span>
              <span className="about-stat-label">{stat.labelVi}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Core Solutions Section */}
      <section className="about-solutions">
        <motion.div
          className="about-section-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="about-section-title">
            <Sparkles className="about-section-icon" />
            Giải pháp cốt lõi
          </h2>
          <p className="about-section-subtitle">3 vấn đề lớn - 3 giải pháp đột phá</p>
        </motion.div>

        <div className="about-solutions-grid">
          <motion.div
            className="about-solution-card"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="about-solution-icon" style={{ background: 'linear-gradient(135deg, #00d4ff, #6366f1)' }}>
              <Brain size={32} />
            </div>
            <div className="about-solution-content">
              <h3>Thiếu định hướng nghề nghiệp</h3>
              <p className="about-solution-arrow">→</p>
              <p className="about-solution-answer">AI Roadmap cá nhân hóa</p>
            </div>
          </motion.div>

          <motion.div
            className="about-solution-card"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="about-solution-icon" style={{ background: 'linear-gradient(135deg, #10b981, #14b8a6)' }}>
              <Zap size={32} />
            </div>
            <div className="about-solution-content">
              <h3>Thiếu kỹ năng thực hành</h3>
              <p className="about-solution-arrow">→</p>
              <p className="about-solution-answer">Micro/Nano-course + Dự án thật</p>
            </div>
          </motion.div>

          <motion.div
            className="about-solution-card"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="about-solution-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)' }}>
              <Briefcase size={32} />
            </div>
            <div className="about-solution-content">
              <h3>Thiếu portfolio & cơ hội</h3>
              <p className="about-solution-arrow">→</p>
              <p className="about-solution-answer">Skill Wallet + Micro-job Marketplace</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="about-features">
        <motion.div
          className="about-section-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="about-section-title">
            <Award className="about-section-icon" />
            Tính năng chính
          </h2>
          <p className="about-section-subtitle">Hệ sinh thái học tập toàn diện</p>
        </motion.div>

        <div className="about-features-grid">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="about-feature-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05, duration: 0.4 }}
              whileHover={{ scale: 1.02, y: -5 }}
            >
              <div 
                className="about-feature-icon" 
                style={{ color: feature.color, borderColor: feature.color }}
              >
                {feature.icon}
              </div>
              <h3 className="about-feature-title">{feature.titleVi}</h3>
              <p className="about-feature-description">{feature.descriptionVi}</p>
              <div className="about-feature-glow" style={{ background: feature.color }}></div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Target Users Section */}
      <section className="about-users">
        <motion.div
          className="about-section-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="about-section-title">
            <Users className="about-section-icon" />
            Đối tượng người dùng
          </h2>
          <p className="about-section-subtitle">4 nhóm chính trong hệ sinh thái</p>
        </motion.div>

        <div className="about-users-grid">
          <motion.div 
            className="about-user-card learner"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <img src={MeowlUser} alt="Learner" className="about-user-meowl-img" />
            <h3>Learners</h3>
            <p>Sinh viên / Người chuyển ngành</p>
            <span className="about-user-need">Cần: Định hướng + Kỹ năng + Portfolio + Việc làm</span>
          </motion.div>

          <motion.div 
            className="about-user-card mentor"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <img src={MeowlMentor} alt="Mentor" className="about-user-meowl-img" />
            <h3>Mentors</h3>
            <p>Chuyên gia ngành</p>
            <span className="about-user-need">Muốn: Chia sẻ kiến thức, tạo thu nhập</span>
          </motion.div>

          <motion.div 
            className="about-user-card business"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <img src={MeowlBusiness} alt="Business" className="about-user-meowl-img" />
            <h3>SMEs / Startups</h3>
            <p>Doanh nghiệp vừa và nhỏ</p>
            <span className="about-user-need">Cần: Nhân sự trẻ, freelancer, thực tập sinh</span>
          </motion.div>

          <motion.div 
            className="about-user-card professional"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <img src={MeowlUser} alt="Professional" className="about-user-meowl-img" />
            <h3>Early Professionals</h3>
            <p>Junior 1-3 năm kinh nghiệm</p>
            <span className="about-user-need">Muốn: Reskill/Upskill nhanh</span>
          </motion.div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="about-vision">
        <motion.div
          className="about-vision-container"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <div className="about-vision-content">
            <h2 className="about-vision-title">🚀 Tầm nhìn dài hạn</h2>
            <ul className="about-vision-list">
              <li>
                <ChevronRight size={20} />
                <span>Trở thành nền tảng AI học tập & nghề nghiệp cho thế hệ trẻ Việt Nam</span>
              </li>
              <li>
                <ChevronRight size={20} />
                <span>Xây dựng hệ sinh thái kết nối Học – Luyện – Làm toàn diện</span>
              </li>
              <li>
                <ChevronRight size={20} />
                <span>Mở rộng sang Đông Nam Á: Thái Lan, Indonesia, Philippines</span>
              </li>
              <li>
                <ChevronRight size={20} />
                <span>Tạo ra thế hệ nhân lực trẻ tự tin, có kỹ năng và tư duy AI-first</span>
              </li>
            </ul>
          </div>
          <div 
            className="about-vision-decoration"
            onMouseEnter={() => setIsGlobeHovered(true)}
            onMouseLeave={() => setIsGlobeHovered(false)}
          >
            {isGlobeHovered ? (
              <img src={EarthImage} alt="Earth" className="about-vision-earth-img" />
            ) : (
              <Globe size={120} className="about-vision-globe" />
            )}
          </div>
        </motion.div>
      </section>

      {/* Team Section */}
      <section className="about-team">
        <motion.div
          className="about-section-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="about-section-title">
            <Users className="about-section-icon" />
            Đội ngũ phát triển
          </h2>
          <p className="about-section-subtitle">Capstone Project - Supervisor: Lại Đức Hùng</p>
        </motion.div>

        <div className="about-team-grid">
          {team.map((member, index) => (
            <motion.div
              key={index}
              className="about-team-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              whileHover={{ y: -10 }}
            >
              <div className="about-team-avatar">
                <img src={member.avatar} alt={member.name} className="about-team-avatar-img" />
              </div>
              <h3 className="about-team-name">{member.name}</h3>
              <p className="about-team-role">{member.role}</p>
              <p className="about-team-description">{member.description}</p>
              <div className="about-team-links">
                {member.github && (
                  <a href={member.github} target="_blank" rel="noopener noreferrer" className="about-team-link"><Github size={18} /></a>
                )}
                {member.linkedin && (
                  <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="about-team-link"><Linkedin size={18} /></a>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="about-cta">
        <motion.div
          className="about-cta-container"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <h2>Sẵn sàng bắt đầu hành trình?</h2>
          <p>Tham gia cùng hàng nghìn người học đang phát triển kỹ năng mỗi ngày</p>
          <div className="about-cta-buttons">
            <Link to={isAuthenticated ? "/chatbot" : "/register"} className="about-cta-button primary large">
              <Rocket size={24} />
              <span>{isAuthenticated ? "Trò chuyện với AI" : "Đăng ký miễn phí"}</span>
            </Link>
            <Link to="/premium" className="about-cta-button secondary large">
              <Sparkles size={24} />
              <span>Xem gói Premium</span>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer decoration */}
      <div className="about-footer-decoration">
        <div className="about-footer-line"></div>
        <span className="about-footer-text">SKILLVERSE © 2024 - Learn Smart. Practice Real. Work Confidently.</span>
        <div className="about-footer-line"></div>
      </div>

      {/* Meowl Guide */}
      <MeowlGuide currentPage="about" />
    </div>
  );
};

export default AboutPage;
