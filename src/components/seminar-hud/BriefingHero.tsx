import React from 'react';
import './briefing-styles.css';

const BriefingHero: React.FC = () => {
  return (
    <div className="briefing-hero">
      {/* Scrolling Marquee at Top Border */}
      <div className="hero-marquee-top">
        <div className="hero-marquee-content">HỘI THẢO TRỰC TUYẾN... KIẾN THỨC CHIA SẺ... KẾT NỐI CHUYÊN GIA... HỌC HỏI MỖI NGÀY...</div>
      </div>

      {/* Radar Pulse Animation Background */}
      <div className="hero-radar-pulse"></div>

      {/* Main Content */}
      <div className="hero-content">
        {/* Title */}
        <h1 className="hero-title">BẢN TIN HỘI THẢO</h1>

        {/* Subtitle */}
        <p className="hero-subtitle">SỰ KIỆN TRỰC TUYẾN <br />KẾT NỐI ỔN ĐỊNH</p>
      </div>
    </div>
  );
};

export default BriefingHero;
