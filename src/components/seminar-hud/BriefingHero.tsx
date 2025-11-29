import React from 'react';
import './briefing-styles.css';

const BriefingHero: React.FC = () => {
  return (
    <div className="briefing-hero">
      {/* Scrolling Marquee at Top Border */}
      <div className="hero-marquee-top">
        <div className="hero-marquee-content">DỮ LIỆU ĐẾN... DÒNG TRUYỀN MÃ HÓA... KHU VỰC 7 AN TOÀN... KÊNH TRUYỀN BẢO MẬT HOẠT ĐỘNG... CHUẨN BỊ HỌP...</div>
      </div>

      {/* Radar Pulse Animation Background */}
      <div className="hero-radar-pulse"></div>

      {/* Main Content */}
      <div className="hero-content">
        {/* Title */}
        <h1 className="hero-title">BẢN TIN HỘI THẢO</h1>

        {/* Subtitle */}
        <p className="hero-subtitle">VẬN HÀNH THÔNG TIN TRỰC TUYẾN <br />KÊNH TRUYỀN BẢO MẬT ĐANG HOẠT ĐỘNG</p>
      </div>
    </div>
  );
};

export default BriefingHero;
