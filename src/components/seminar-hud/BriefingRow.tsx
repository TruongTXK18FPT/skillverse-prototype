import React, { useEffect, useState } from 'react';
import './briefing-styles.css';
import { Seminar } from '../../types/seminar';

interface BriefingRowProps {
  seminar: Seminar;
  onAction: (id: string) => void;
}

const BriefingRow: React.FC<BriefingRowProps> = ({ seminar, onAction }) => {
  const [countdown, setCountdown] = useState<string>('');

  // Calculate countdown
  useEffect(() => {
    const calculateCountdown = () => {
      try {
        let seminarDate: Date;
        
        // Handle ISO format (Backend)
        if (seminar.startTime) {
             seminarDate = new Date(seminar.startTime);
        } else {
             return 'CHỜ';
        }

        const now = new Date();
        const diff = seminarDate.getTime() - now.getTime();

        if (diff <= 0) return 'ĐANG DIỄN RA';

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hrs = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (days > 0) {
          return `${days}D ${hrs.toString().padStart(2, '0')}H`;
        } else if (hrs > 0) {
          return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
        } else {
          return `${mins}P`;
        }
      } catch (_error) {
        return 'CHỜ';
      }
    };

    setCountdown(calculateCountdown());
    const interval = setInterval(() => setCountdown(calculateCountdown()), 60000);
    return () => clearInterval(interval);
  }, [seminar.startTime]);

  // Extract category and sector
  // Note: BE currently doesn't support tags, defaulting to "HỘI THẢO"
  const category = 'HỘI THẢO'; 

  // Use seminar.id to generate stable sector number
  const sector = (seminar.id % 9) + 1;

  return (
    <div className="briefing-row">
      {/* Left: Small Hologram Thumbnail */}
      <div className="briefing-row-thumb">
        <img
          src={seminar.imageUrl || 'https://via.placeholder.com/150'}
          alt={seminar.title}
          className="briefing-row-img"
        />
        <div className="briefing-row-overlay"></div>
      </div>

      {/* Middle: Information Density */}
      <div className="briefing-row-content">
        <h3 className="briefing-row-title">{seminar.title}</h3>

        {/* Metadata Row */}
        <div className="briefing-row-meta">
          <span className="briefing-meta-badge briefing-meta-sector">[KHU VỰC {sector}]</span>
          <span className="briefing-meta-divider">|</span>
          <span className="briefing-meta-badge briefing-meta-countdown">T-{countdown}</span>
          <span className="briefing-meta-divider">|</span>
          <span className="briefing-meta-badge briefing-meta-speaker">
            {seminar.creatorName || 'Recruiter'}
          </span>
          <span className="briefing-meta-divider">|</span>
          <span className="briefing-meta-badge briefing-meta-category">
            {category}
          </span>
        </div>
      </div>

      {/* Right: Compact Action Button */}
      <div className="briefing-row-action">
        <button className="briefing-row-btn" onClick={() => onAction(String(seminar.id))}>XEM CHI TIẾT →</button>
      </div>
    </div>
  );
};

export default BriefingRow;
