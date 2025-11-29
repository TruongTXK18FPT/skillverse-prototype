import React from 'react';
import './briefing-styles.css';

const BriefingHero: React.FC = () => {
  return (
    <div className="briefing-hero">
      {/* Scrolling Marquee at Top Border */}
      <div className="hero-marquee-top">
        <div className="hero-marquee-content">
          INCOMING INTEL... ENCRYPTED DATA STREAM... SECTOR 7 CLEAR... TRANSMISSION SECURE... STANDBY FOR BRIEFING...
        </div>
      </div>

      {/* Radar Pulse Animation Background */}
      <div className="hero-radar-pulse"></div>

      {/* Main Content */}
      <div className="hero-content">
        {/* Title */}
        <h1 className="hero-title">TACTICAL BRIEFINGS</h1>

        {/* Subtitle */}
        <p className="hero-subtitle">
          LIVE INTELLIGENCE OPERATIONS <br />
          SECURE TRANSMISSION CHANNEL ACTIVE
        </p>
      </div>
    </div>
  );
};

export default BriefingHero;