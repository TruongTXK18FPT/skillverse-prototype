import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, Briefcase, Award,
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

// Infinity Stones
import spaceStone from '../../assets/infinity-stones/space_stone.png';
import mindStone from '../../assets/infinity-stones/mind-stone.png';
import realityStone from '../../assets/infinity-stones/reality_stone.png';
import powerStone from '../../assets/infinity-stones/power_stone.png';
import timeStone from '../../assets/infinity-stones/time_stone.png';
import soulStone from '../../assets/infinity-stones/soul_stone.png';


const HomePage = () => {
  const [theme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'light';
  });

  const [currentSlide, setCurrentSlide] = useState(0);
  const [activatedStars, setActivatedStars] = useState<number[]>([]);
  const [isFabricating, setIsFabricating] = useState(false);
  const [hasFabricated, setHasFabricated] = useState(false);

  const constellationContainerRef = useRef<HTMLDivElement>(null);

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

  // Intersection Observer (Giữ nguyên)
  useEffect(() => {
    if (typeof window === 'undefined') return;

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
        threshold: 0.3,
        rootMargin: '-50px'
      }
    );

    const stones = document.querySelectorAll('.infinity-stone-item');
    stones.forEach((stone) => observer.observe(stone));

    return () => observer.disconnect();
  }, []); 

  const infinityStones = [
    {
      icon: Brain,
      title: 'Cố Vấn Nghề Nghiệp AI',
      description: 'Nhận hướng dẫn nghề nghiệp cá nhân và đề xuất kỹ năng được hỗ trợ bởi AI tiên tiến',
      stone: mindStone,
      stoneName: 'Mind Stone',
      glowColor: '#ffd43b',
      position: 'left'
    },
    {
      icon: Code,
      title: 'Học Tập Tương Tác',
      description: 'Học thông qua thực hành với các bài tập lập trình và dự án thực tế',
      stone: powerStone,
      stoneName: 'Power Stone',
      glowColor: '#a855f7',
      position: 'right'
    },
    {
      icon: Target,
      title: 'Hồ Sơ Thông Minh',
      description: 'Trình bày kỹ năng và dự án của bạn với hồ sơ năng động được hỗ trợ bởi AI',
      stone: soulStone,
      stoneName: 'Soul Stone',
      glowColor: '#ff922b',
      position: 'left'
    },
    {
      icon: Zap,
      title: 'Phản Hồi Tức Thì',
      description: 'Nhận phản hồi thời gian thực về mã và dự án của bạn từ AI và chuyên gia',
      stone: timeStone,
      stoneName: 'Time Stone',
      glowColor: '#51cf66',
      position: 'right'
    },
    {
      icon: Globe,
      title: 'Cộng Đồng Toàn Cầu',
      description: 'Kết nối với các chuyên gia và người học từ khắp nơi trên thế giới',
      stone: spaceStone,
      stoneName: 'Space Stone',
      glowColor: '#4dabf7',
      position: 'left'
    },
    {
      icon: Award,
      title: 'Chứng Chỉ Được Công Nhận',
      description: 'Nhận chứng chỉ có giá trị công nhận kỹ năng của bạn và nâng cao hồ sơ của bạn',
      stone: realityStone,
      stoneName: 'Reality Stone',
      glowColor: '#ff6b6b',
      position: 'right'
    }
  ];

  // --- BẮT ĐẦU KHỐI CODE ĐƯỢC CẬP NHẬT ---
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Định nghĩa hàm vẽ (giờ nó làm cả 2 việc)
    const connectStonesAndUpdate = () => {
      const container = constellationContainerRef.current;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();

      infinityStones.forEach((_, index) => {
        if (index === infinityStones.length - 1) return;

        const stone1 = document.getElementById(`stone-wrapper-${index}`);
        const stone2 = document.getElementById(`stone-wrapper-${index + 1}`);
        const line = document.getElementById(`line-connector-${index}`);

        if (!stone1 || !stone2 || !line) return;

        // --- PHẦN 1: TÍNH TOÁN HÌNH HỌC (như cũ) ---
        const rect1 = stone1.getBoundingClientRect();
        const rect2 = stone2.getBoundingClientRect();

        const x1 = rect1.left + rect1.width / 2 - containerRect.left;
        const y1 = rect1.top + rect1.height / 2 - containerRect.top;
        const x2 = rect2.left + rect2.width / 2 - containerRect.left;
        const y2 = rect2.top + rect2.height / 2 - containerRect.top;

        const deltaX = x2 - x1;
        const deltaY = y2 - y1;
        const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const angle = Math.atan2(deltaY, deltaX);

        line.style.left = `${x1}px`;
        line.style.top = `${y1}px`;
        line.style.width = `${length}px`;
        line.style.transform = `rotate(${angle}rad)`;

        // --- PHẦN 2: QUYẾT ĐỊNH HIỂN THỊ (Logic mới) ---
        // Kiểm tra state `activatedStars`
        const bothAreActive = activatedStars.includes(index) && activatedStars.includes(index + 1);
        
        // Tự thêm/xóa class thay vì để JSX làm
        // Điều này đảm bảo hình học và hiển thị LUÔN đồng bộ
        if (bothAreActive) {
          line.classList.add('both-stones-active');
        } else {
          line.classList.remove('both-stones-active');
        }
      });
    };

    // 2. Kích hoạt hàm này BẤT CỨ KHI NÀO state 'activatedStars' thay đổi
    // Đây là trình kích hoạt chính (main trigger) để BẬT đường sét
    connectStonesAndUpdate();

    // 3. Chạy hàm khi resize cửa sổ (để cập nhật hình học)
    window.addEventListener('resize', connectStonesAndUpdate);

    // 4. Lắng nghe sự kiện KẾT THÚC ANIMATION (để cập nhật hình học)
    // Điều này khắc phục "snap" khi viên đá bay vào
    const container = constellationContainerRef.current;
    const handleTransitionEnd = (event: TransitionEvent) => {
      if ((event.target as HTMLElement).classList.contains('infinity-stone-item')) {
        connectStonesAndUpdate();
      }
    };
    container?.addEventListener('transitionend', handleTransitionEnd);

    // 5. Dọn dẹp
    return () => {
      window.removeEventListener('resize', connectStonesAndUpdate);
      container?.removeEventListener('transitionend', handleTransitionEnd);
    };

  }, [infinityStones, activatedStars]); // <-- QUAN TRỌNG: Thêm `activatedStars` vào đây
  // --- KẾT THÚC KHỐI CODE ĐƯỢC CẬP NHẬT ---


  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const goToPrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const handleFabricatorClick = () => {
    if (!isFabricating && !hasFabricated) {
      setIsFabricating(true);
      setTimeout(() => {
        setHasFabricated(true);
      }, 7000);
    }
  };

  return (
    <div className="homepage-container">
      {/* Hero Slider Section (Giữ nguyên) */}
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

          {/* Gắn ref vào đây (Giữ nguyên) */}
          <div className="constellation-container" ref={constellationContainerRef}>
              
              {/* PHẦN 1: RENDER CÁC VIÊN ĐÁ (Giữ nguyên) */}
              <div className="infinity-stones-grid">
                {infinityStones.map((stone, index) => (
                  <div
                    key={index}
                    className={`infinity-stone-item ${activatedStars.includes(index) ? 'active' : ''}`}
                    data-star-index={index}
                    style={{ '--stone-glow-color': stone.glowColor } as React.CSSProperties}
                  >
                    <div className="stone-image-wrapper" id={`stone-wrapper-${index}`}>
                      <div className="stone-glow" style={{ backgroundColor: stone.glowColor }}></div>
                      <img
                        src={stone.stone}
                        alt={stone.stoneName}
                        className="infinity-stone-image"
                      />
                    </div>

                    <div className="stone-content">
                      <div className="stone-content-header">
                        <stone.icon size={32} className="stone-content-icon" style={{ color: stone.glowColor }} />
                        <h3 className="stone-title">{stone.title}</h3>
                      </div>
                      <p className="stone-description">{stone.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* PHẦN 2: RENDER CÁC ĐƯỜNG SÉT - ĐÃ SỬA LỖI LOGIC CLASSNAME */}
              {infinityStones.slice(0, -1).map((stone, index) => {
                const nextStone = infinityStones[index + 1];
                // XÓA BỎ: const bothActive = ...

                return (
                  <div
                    key={`line-${index}`}
                    id={`line-connector-${index}`}
                    className="connector-wrapper" // <-- CHỈ CÒN CLASS GỐC
                    style={{
                      '--connector-color-1': stone.glowColor,
                      '--connector-color-2': nextStone.glowColor,
                    } as React.CSSProperties}
                  >
                    <svg
                      className="lightning-connector"
                      viewBox="0 0 100 80"
                      xmlns="http://www.w3.org/2000/svg"
                      preserveAspectRatio="none"
                    >
                      <defs>
                        {/* Radial gradient cho collision point - theo hướng của đường sét */}
                        <radialGradient id={`collision-gradient-${index}`}>
                          <stop offset="0%" stopColor="white" stopOpacity="1" />
                          <stop offset="30%" stopColor="white" stopOpacity="0.9" />
                          <stop offset="60%" stopColor="var(--connector-color-1)" stopOpacity="0.7" />
                          <stop offset="80%" stopColor="var(--connector-color-2)" stopOpacity="0.5" />
                          <stop offset="100%" stopColor="var(--connector-color-2)" stopOpacity="0.2" />
                        </radialGradient>
                      </defs>

                      {/* Đường sét từ đá 1 (màu đá 1) - Nửa đầu */}
                      <path
                        className="lightning-bolt lightning-main"
                        d="M 0 40 L 8 35 L 15 42 L 22 38 L 30 45 L 38 37 L 45 43 L 50 40"
                        stroke="var(--connector-color-1)"
                        strokeWidth="3"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="bevel"
                      />

                      {/* Đường sét từ đá 2 (màu đá 2) - Nửa sau */}
                      <path
                        className="lightning-bolt lightning-main"
                        d="M 50 40 L 55 37 L 62 42 L 70 35 L 78 42 L 85 38 L 92 43 L 100 40"
                        stroke="var(--connector-color-2)"
                        strokeWidth="3"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="bevel"
                      />

                      {/* Secondary bolt 1 phía trên - Nửa đầu (đá 1) */}
                      <path
                        className="lightning-bolt lightning-side"
                        d="M 0 28 L 10 25 L 18 30 L 28 26 L 35 32 L 42 28 L 50 30"
                        stroke="var(--connector-color-1)"
                        strokeWidth="2"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="bevel"
                        opacity="0.7"
                      />

                      {/* Secondary bolt 1 phía trên - Nửa sau (đá 2) */}
                      <path
                        className="lightning-bolt lightning-side"
                        d="M 50 30 L 58 26 L 65 31 L 72 27 L 82 30 L 90 26 L 100 28"
                        stroke="var(--connector-color-2)"
                        strokeWidth="2"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="bevel"
                        opacity="0.7"
                      />

                      {/* Secondary bolt 2 phía dưới - Nửa đầu (đá 1) */}
                      <path
                        className="lightning-bolt lightning-side"
                        d="M 0 52 L 10 55 L 18 50 L 28 54 L 35 48 L 42 52 L 50 50"
                        stroke="var(--connector-color-1)"
                        strokeWidth="2"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="bevel"
                        opacity="0.7"
                      />

                      {/* Secondary bolt 2 phía dưới - Nửa sau (đá 2) */}
                      <path
                        className="lightning-bolt lightning-side"
                        d="M 50 50 L 58 54 L 65 49 L 72 53 L 82 50 L 90 54 L 100 52"
                        stroke="var(--connector-color-2)"
                        strokeWidth="2"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="bevel"
                        opacity="0.7"
                      />

                      {/* Extra energy bolt 1 - Nửa đầu (đá 1) */}
                      <path
                        className="lightning-bolt lightning-side"
                        d="M 0 20 L 12 18 L 25 22 L 35 19 L 50 21"
                        stroke="var(--connector-color-1)"
                        strokeWidth="1.5"
                        fill="none"
                        strokeLinecap="round"
                        opacity="0.5"
                      />

                      {/* Extra energy bolt 1 - Nửa sau (đá 2) */}
                      <path
                        className="lightning-bolt lightning-side"
                        d="M 50 21 L 65 19 L 75 22 L 88 18 L 100 20"
                        stroke="var(--connector-color-2)"
                        strokeWidth="1.5"
                        fill="none"
                        strokeLinecap="round"
                        opacity="0.5"
                      />

                      {/* Extra energy bolt 2 - Nửa đầu (đá 1) */}
                      <path
                        className="lightning-bolt lightning-side"
                        d="M 0 60 L 12 62 L 25 58 L 35 61 L 50 59"
                        stroke="var(--connector-color-1)"
                        strokeWidth="1.5"
                        fill="none"
                        strokeLinecap="round"
                        opacity="0.5"
                      />

                      {/* Extra energy bolt 2 - Nửa sau (đá 2) */}
                      <path
                        className="lightning-bolt lightning-side"
                        d="M 50 59 L 65 61 L 75 58 L 88 62 L 100 60"
                        stroke="var(--connector-color-2)"
                        strokeWidth="1.5"
                        fill="none"
                        strokeLinecap="round"
                        opacity="0.5"
                      />

                      {/* Collision point với gradient radial */}
                      <circle
                        className="collision-glow"
                        cx="50" cy="40" r="12"
                        fill={`url(#collision-gradient-${index})`}
                        opacity="0.95"
                      />
                      <circle
                        className="collision-glow-outer"
                        cx="50" cy="40" r="20"
                        fill={`url(#collision-gradient-${index})`}
                        opacity="0.6"
                      />
                      <circle
                        cx="50" cy="40" r="28" fill="none"
                        stroke="white" strokeWidth="1.5" opacity="0.4"
                        className="collision-ring"
                      />
                    </svg>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Alien Fabricator Section (Giữ nguyên) */}
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

      {/* Meowl Guide (Giữ nguyên) */}
      <MeowlGuide currentPage="home" />
    </div>
  );
};

export default HomePage;