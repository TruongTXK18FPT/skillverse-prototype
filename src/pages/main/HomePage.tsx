import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, Briefcase, Award, Sparkles,
  Users, Star, Brain, Target,
  Code, Zap, Globe, ChevronRight,
  Map, Briefcase as Portfolio, Building, Power
} from 'lucide-react';
import MeowlGuide from '../../components/MeowlGuide';
import '../../styles/HomePage.css';

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

  const [currentSlide, setCurrentSlide] = useState(0);
  const [activatedStars, setActivatedStars] = useState<number[]>([]);
  const [isFabricating, setIsFabricating] = useState(false);
  const [hasFabricated, setHasFabricated] = useState(false);

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
  }, [theme]);

  // Intersection Observer for constellation effect
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.getAttribute('data-star-index') || '0');
            setActivatedStars((prev) => {
              if (!prev.includes(index)) {
                return [...prev, index];
              }
              return prev;
            });
          }
        });
      },
      {
        threshold: 0.5,
        rootMargin: '-100px'
      }
    );

    const stars = document.querySelectorAll('.constellation-star');
    stars.forEach((star) => observer.observe(star));

    return () => observer.disconnect();
  }, []);

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
      color: 'from-blue-500 to-cyan-500',
      position: 'left' // Lệch trái
    },
    {
      icon: Code,
      title: 'Học Tập Tương Tác',
      description: 'Học thông qua thực hành với các bài tập lập trình và dự án thực tế',
      color: 'from-green-500 to-emerald-500',
      position: 'right' // Lệch phải
    },
    {
      icon: Target,
      title: 'Hồ Sơ Thông Minh',
      description: 'Trình bày kỹ năng và dự án của bạn với hồ sơ năng động được hỗ trợ bởi AI',
      color: 'from-purple-500 to-pink-500',
      position: 'left' // Lệch trái
    },
    {
      icon: Zap,
      title: 'Phản Hồi Tức Thì',
      description: 'Nhận phản hồi thời gian thực về mã và dự án của bạn từ AI và chuyên gia',
      color: 'from-orange-500 to-red-500',
      position: 'right' // Lệch phải
    },
    {
      icon: Globe,
      title: 'Cộng Đồng Toàn Cầu',
      description: 'Kết nối với các chuyên gia và người học từ khắp nơi trên thế giới',
      color: 'from-yellow-500 to-amber-500',
      position: 'left' // Lệch trái
    },
    {
      icon: Award,
      title: 'Chứng Chỉ Được Công Nhận',
      description: 'Nhận chứng chỉ có giá trị công nhận kỹ năng của bạn và nâng cao hồ sơ của bạn',
      color: 'from-teal-500 to-cyan-500',
      position: 'right' // Lệch phải
    }
  ];

  const handleFabricatorClick = () => {
    if (!isFabricating && !hasFabricated) {
      setIsFabricating(true);
      // After 7 seconds (animation complete), set as completed
      setTimeout(() => {
        setHasFabricated(true);
      }, 7000);
    }
  };

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

      {/* Constellation Features Section */}
      <section className="constellation-section__galaxy-bg">
        <div className="constellation__galaxy-bg">
          <div className="section-container">
            <div className="section-header">
            <h2 className="section-title">
              Tại Sao Chọn Skillverse?
            </h2>
            <p className="section-description">
              Trải nghiệm tương lai của việc học tập với nền tảng được hỗ trợ bởi AI thích ứng với nhu cầu của bạn
            </p>
          </div>

          <div className="constellation-container">
            <svg className="constellation-lines" preserveAspectRatio="none">
              {features.map((feature, index) => {
                if (index < features.length - 1) {
                  const currentIsLeft = feature.position === 'left';
                  const nextIsLeft = features[index + 1].position === 'left';

                  // Calculate positions based on left/right alignment
                  const x1 = currentIsLeft ? '25%' : '75%';
                  const x2 = nextIsLeft ? '25%' : '75%';
                  const y1 = `${(index * 16.67) + 8}%`;
                  const y2 = `${((index + 1) * 16.67) + 8}%`;

                  return (
                    <line
                      key={index}
                      className={`constellation-line ${activatedStars.includes(index) && activatedStars.includes(index + 1) ? 'active' : ''}`}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="url(#lineGradient)"
                      strokeWidth="3"
                      strokeDasharray="8 4"
                    />
                  );
                }
                return null;
              })}
              <defs>
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgba(139, 92, 246, 0.8)" />
                  <stop offset="50%" stopColor="rgba(99, 102, 241, 0.8)" />
                  <stop offset="100%" stopColor="rgba(59, 130, 246, 0.8)" />
                </linearGradient>
              </defs>
            </svg>

            <div className="constellation-stars-container">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className={`constellation-star constellation-star-${feature.position} ${activatedStars.includes(index) ? 'active' : ''}`}
                  data-star-index={index}
                >
                  {/* Simple Sparkle Icon */}
                  <div className="constellation-star-icon-wrapper">
                    <div className="constellation-star-glow"></div>
                    <Sparkles size={64} className="constellation-star-icon" />
                  </div>

                  <div className="star-content">
                    <div className="star-content-header">
                      <feature.icon size={32} className="content-icon" />
                      <h3 className="star-title">{feature.title}</h3>
                    </div>
                    <p className="star-description">{feature.description}</p>
                  </div>
                
                </div>
              ))}
            </div>
          </div>
          </div>
        </div>
      </section>

      {/* Alien Fabricator Section */}
      <section className="fabricator-section">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">
              Con Đường Đến Thành Công
            </h2>
            <p className="section-description">
              Hành trình học tập cá nhân hóa được hỗ trợ bởi AI
            </p>
          </div>

          <div className="fabricator-container">
            <div className="fabricator-machine">
              {/* Main Fabricator Body */}
              <div className="fabricator-body">
                <div className="fabricator-top">
                  <div className="fabricator-panels">
                    <div className="panel panel-1"></div>
                    <div className="panel panel-2"></div>
                    <div className="panel panel-3"></div>
                  </div>
                  <div className="fabricator-lights">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className={`status-light ${isFabricating ? 'active' : ''}`} style={{ '--delay': `${i * 0.1}s` } as React.CSSProperties}></div>
                    ))}
                  </div>
                </div>

                {/* Center Control Panel */}
                <div className="fabricator-center">
                  <div className="fabricator-screen">
                    <div className="screen-scan-line"></div>
                    <div className="screen-text">
                      {isFabricating && !hasFabricated ? 'FABRICATING...' : (hasFabricated ? 'COMPLETE' : 'READY')}
                    </div>
                  </div>

                  <button
                    className={`fabricator-button ${isFabricating ? 'active' : ''} ${hasFabricated ? 'completed' : ''}`}
                    onClick={handleFabricatorClick}
                    disabled={isFabricating || hasFabricated}
                  >
                    <Power size={32} className="button-icon" />
                  </button>
                </div>

                {/* Fabrication Chamber */}
                <div className={`fabrication-chamber ${isFabricating ? 'active' : ''}`}>
                  <div className="chamber-glass">
                    <div className="glass-reflection"></div>
                  </div>

                  {isFabricating && (
                    <>
                      {/* Blue Welding Sparks */}
                      <div className="welding-sparks">
                        {[...Array(30)].map((_, i) => (
                          <div
                            key={i}
                            className="spark"
                            style={{
                              '--angle': `${Math.random() * 360}deg`,
                              '--distance': `${20 + Math.random() * 40}px`,
                              '--delay': `${Math.random() * 0.5}s`
                            } as React.CSSProperties}
                          ></div>
                        ))}
                      </div>

                      {/* Molecular Reconstruction Effect */}
                      <div className="molecular-field">
                        {[...Array(50)].map((_, i) => (
                          <div
                            key={i}
                            className="molecule"
                            style={{
                              '--x': `${Math.random() * 100}%`,
                              '--y': `${Math.random() * 100}%`,
                              '--delay': `${Math.random() * 2}s`
                            } as React.CSSProperties}
                          ></div>
                        ))}
                      </div>

                      {/* Energy Beams */}
                      <div className="energy-beams">
                        <div className="beam beam-1"></div>
                        <div className="beam beam-2"></div>
                        <div className="beam beam-3"></div>
                      </div>
                    </>
                  )}

                  {/* Output Energy Cubes */}
                  <div className="energy-cubes">
                    {slides.slice(0, 3).map((slide, index) => (
                      <Link
                        key={index}
                        to={slide.route}
                        className={`energy-cube ${isFabricating ? 'materializing' : ''} ${hasFabricated ? 'clickable' : ''}`}
                        style={{ '--index': index } as React.CSSProperties}
                      >
                        <div className="cube-glow"></div>
                        <div className="cube-core">
                          <div className="cube-face cube-front">
                            <slide.icon size={24} className="cube-icon" />
                          </div>
                          <div className="cube-face cube-back"></div>
                          <div className="cube-face cube-left"></div>
                          <div className="cube-face cube-right"></div>
                          <div className="cube-face cube-top"></div>
                          <div className="cube-face cube-bottom"></div>
                        </div>
                        <div className="cube-content">
                          <div className="cube-number">{index + 1}</div>
                          <h3 className="cube-title">{slide.title}</h3>
                          <p className="cube-description">{slide.description}</p>
                        </div>
                        {hasFabricated && (
                          <div className="cube-cta">
                            <ChevronRight size={20} className="cube-arrow" />
                          </div>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* Fabricator Base */}
              <div className="fabricator-base">
                <div className="base-vents">
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className="vent"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Meowl Guide */}
      <MeowlGuide currentPage="home" />
    </div>
  );
};

export default HomePage;