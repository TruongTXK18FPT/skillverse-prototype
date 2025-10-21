import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, Briefcase, Award,
  Users, Star, Brain, Target,
  Code, Zap, Globe, ChevronRight,
  Map, Briefcase as Portfolio, Building
} from 'lucide-react';
import MeowlGuide from '../../components/MeowlGuide';
import '../../styles/HomePage.css'; // Import your CSS styles

// Slider images
import slide1 from '../../assets/slider-1.webp';
import slide2 from '../../assets/slider-2.webp';
import slide3 from '../../assets/slider-3.webp';
import slide4 from '../../assets/slider-4.webp';
import slide5 from '../../assets/slider-5.webp';


const HomePage = () => {
  const [theme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'light';
  });

  const [isVisible, setIsVisible] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      image: slide1,
      title: 'Bắt Đầu Hành Trình Của Bạn',
      description: 'Khám phá tiềm năng vô hạn với hướng dẫn AI cá nhân hóa',
      cta: 'Bắt đầu hành trình của bạn',
      route: '/chatbot',
      icon: Brain
    },
    {
      image: slide2,
      title: 'Lộ Trình Học Thông Minh',
      description: 'Tạo lộ trình học tập phù hợp với mục tiêu nghề nghiệp của bạn',
      cta: 'Tạo lộ trình học thông minh',
      route: '/roadmap',
      icon: Map
    },
    {
      image: slide3,
      title: 'Học Tập Không Giới Hạn',
      description: 'Truy cập hàng trăm khóa học chất lượng cao từ chuyên gia',
      cta: 'Bắt đầu học ngay',
      route: '/courses',
      icon: BookOpen
    },
    {
      image: slide4,
      title: 'Xây Dựng Portfolio Ấn Tượng',
      description: 'Tạo portfolio chuyên nghiệp để thu hút nhà tuyển dụng',
      cta: 'Tạo Portfolio của bạn',
      route: '/portfolio',
      icon: Portfolio
    },
    {
      image: slide5,
      title: 'Cơ Hội Việc Làm Đang Chờ Bạn',
      description: 'Kết nối với các nhà tuyển dụng hàng đầu và tìm công việc mơ ước',
      cta: 'Kết nối cơ hội việc làm',
      route: '/jobs',
      icon: Building
    }
  ];

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    setIsVisible(true);
  }, [theme]);

  // Stop auto-rolling animation by removing the interval

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const goToPrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

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
    <div className="homepage-container">
      {/* Hero Slider Section */}
      <section className="slider-hero-section">
        <div className="slider-container">
          {/* Slides */}
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`slider-slide ${index === currentSlide ? 'slider-slide-active' : ''}`}
            >
              <div className="slider-image-wrapper">
                <img 
                  src={slide.image} 
                  alt={slide.title}
                  className="slider-image"
                />
                <div className="slider-overlay"></div>
              </div>
              
              <div className="slider-content">
                <div className="slider-cosmic-dust"></div>
                <slide.icon className="slider-icon" size={48} />
                <h1 className="slider-title">{slide.title}</h1>
                <p className="slider-description">{slide.description}</p>
                <Link to={slide.route} className="slider-cta-button">
                  <span className="slider-button-text">{slide.cta}</span>
                  <ChevronRight className="slider-button-icon" size={20} />
                  <span className="slider-button-glow"></span>
                </Link>
              </div>
            </div>
          ))}

          {/* Navigation Arrows */}
          <button 
            className="slider-nav-button slider-nav-prev"
            onClick={goToPrevSlide}
            aria-label="Previous slide"
          >
            <ChevronRight size={32} />
          </button>
          <button 
            className="slider-nav-button slider-nav-next"
            onClick={goToNextSlide}
            aria-label="Next slide"
          >
            <ChevronRight size={32} />
          </button>

          {/* Dots Navigation */}
          <div className="slider-dots">
            {slides.map((_, index) => (
              <button
                key={index}
                className={`slider-dot ${index === currentSlide ? 'slider-dot-active' : ''}`}
                onClick={() => goToSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
              >
                <span className="slider-dot-inner"></span>
              </button>
            ))}
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
              <BookOpen size={20} />
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