import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, Briefcase, Award,
  Users, Star, Sparkles, Brain, Target,
  Code, Zap, Globe, ChevronRight
} from 'lucide-react';
import MeowlGuide from '../../components/MeowlGuide';
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
  const [theme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'light';
  });

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    setIsVisible(true);
  }, [theme]);

  const features = [
    {
      icon: Brain,
      title: 'Cố Vấn Nghề Nghiệp AI',
      description: 'Nhận hướng dẫn nghề nghiệp cá nhân và đề xuất kỹ năng được hỗ trợ bởi AI tiên tiến',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Code,
      title: 'Học Tập Tương Tác',
      description: 'Học thông qua thực hành với các bài tập lập trình và dự án thực tế',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: Target,
      title: 'Hồ Sơ Thông Minh',
      description: 'Trình bày kỹ năng và dự án của bạn với hồ sơ năng động được hỗ trợ bởi AI',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Zap,
      title: 'Phản Hồi Tức Thì',
      description: 'Nhận phản hồi thời gian thực về mã và dự án của bạn từ AI và chuyên gia',
      color: 'from-orange-500 to-red-500'
    },
    {
      icon: Globe,
      title: 'Cộng Đồng Toàn Cầu',
      description: 'Kết nối với các chuyên gia và người học từ khắp nơi trên thế giới',
      color: 'from-yellow-500 to-amber-500'
    },
    {
      icon: Award,
      title: 'Chứng Chỉ Được Công Nhận',
      description: 'Nhận chứng chỉ có giá trị công nhận kỹ năng của bạn và nâng cao hồ sơ của bạn',
      color: 'from-teal-500 to-cyan-500'
    }

  ];

  const stats = [
    {
      label: 'Người Học Tích Cực',
      value: '10,000+',
      icon: Users,
      description: 'Cộng đồng đang phát triển'
    },
    {
      label: 'Khóa Học Chuyên Môn',
      value: '500+',
      icon: BookOpen,
      description: 'Nội dung được tuyển chọn'
    },
    {
      label: 'Dự Án Hoàn Thành',
      value: '2,500+',
      icon: Briefcase,
      description: 'Kinh nghiệm thực tế'
    },
    {
      label: 'Tỷ Lệ Thành Công',
      value: '95%',
      icon: Star,
      description: 'Phát triển nghề nghiệp'
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
            Mở Khoá Tương Lai Với AI
          </h1>
          <p className="hero-description">
            Không chỉ học – mà còn bứt phá! SkillVerse mang đến hành trình học tập cá nhân hoá,
            giúp bạn làm chủ kỹ năng hot nhất và tạo lợi thế vượt trội trong sự nghiệp.
          </p>
          <div className="button-container">
            <Link to="/courses" className="primary-button">
              <Sparkles size={20} />
              <span>Bắt Đầu Học</span>
              <ChevronRight size={16} />
            </Link>
            <Link to="/chatbot" className="secondary-button">
              <Brain size={20} />
              <span>Tư Vấn Nghề Nghiệp AI</span>
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
              Tại Sao Chọn Skillverse?
            </h2>
            <p className="section-description">
              Trải nghiệm tương lai của việc học tập với nền tảng được hỗ trợ bởi AI thích ứng với nhu cầu của bạn
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
                className="home-stat-item"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <div className="home-stat-icon-container">
                  <stat.icon size={24} className="home-stat-icon" />
                </div>
                <div className="home-stat-info">
                  <div className="home-stat-value floating">{stat.value}</div>
                  <div className="home-stat-label">{stat.label}</div>
                  <div className="home-stat-description">{stat.description}</div>
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
              Con Đường Đến Thành Công
            </h2>
            <p className="section-description">
              Hành trình học tập cá nhân hóa được hỗ trợ bởi AI
            </p>
          </div>

          <div className="steps-grid">
            {[
              {
                number: 1,
                title: "Khám Phá Lộ Trình",
                description: "Nhận hướng dẫn nghề nghiệp từ AI phù hợp với mục tiêu của bạn",
                icon: Brain
              },
              {
                number: 2,
                title: "Học & Thực Hành",
                description: "Làm chủ kỹ năng với các khóa học tương tác và dự án thực tế",
                icon: Code
              },
              {
                number: 3,
                title: "Theo Dõi Tiến Độ",
                description: "Giám sát sự phát triển của bạn với thông tin chi tiết từ AI",
                icon: Target
              }
            ].map((step, index) => (
              <div
                key={index}
                className="step-item"
                style={{ animationDelay: `${index * 0.3}s` }}
              >
                <div className="step-number">{step.number}</div>
                <step.icon size={24} className="home-stat-icon" />
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
            Sẵn Sàng Thay Đổi Sự Nghiệp?
          </h2>
          <p className="cta-description">
            Tham gia cùng hàng nghìn học viên thành công đã thúc đẩy sự nghiệp của họ với Skillverse
          </p>
          <div className="button-container">
            <Link to="/dashboard" className="primary-button">
              <Sparkles size={20} />
              <span>Bắt Đầu Miễn Phí</span>
              <ChevronRight size={16} />
            </Link>
            <Link to="/courses" className="secondary-button">
              <BookOpen size={20} />
              <span>Khám Phá Khóa Học</span>
              <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Meowl Guide */}
      <MeowlGuide currentPage="home" />
    </div>
  );
};

export default HomePage;