import React, { useEffect, useState } from 'react';
import './briefing-styles.css';

interface Seminar {
  id: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  organizer: string;
  schedule: string;
  speakers: string;
  registration: string;
  tags: string;
  sponsors: string;
  backgroundImageUrl: string;
}

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
        const dateTimestamp = Number(seminar.date) * 1000;
        const seminarDate = new Date(dateTimestamp);
        const [hours, minutes] = seminar.startTime.split(':').map(Number);
        seminarDate.setHours(hours || 0, minutes || 0, 0, 0);

        const now = new Date();
        const diff = seminarDate.getTime() - now.getTime();

        if (diff <= 0) return 'ACTIVE';

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hrs = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (days > 0) {
          return `${days}D ${hrs.toString().padStart(2, '0')}H`;
        } else if (hrs > 0) {
          return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
        } else {
          return `${mins}M`;
        }
      } catch (error) {
        return 'STANDBY';
      }
    };

    setCountdown(calculateCountdown());
    const interval = setInterval(() => setCountdown(calculateCountdown()), 60000);
    return () => clearInterval(interval);
  }, [seminar.date, seminar.startTime]);

  // Extract category and sector
  const category = typeof seminar.tags === 'string'
    ? seminar.tags.split(',')[0]?.trim().toUpperCase() || 'INTEL'
    : 'INTEL';

  const sector = Math.floor(Math.random() * 9) + 1;

  return (
    <div className="briefing-row">
      {/* Left: Small Hologram Thumbnail */}
      <div className="briefing-row-thumb">
        <img
          src={seminar.backgroundImageUrl}
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
          <span className="briefing-meta-badge briefing-meta-sector">
            [SECTOR {sector}]
          </span>
          <span className="briefing-meta-divider">|</span>
          <span className="briefing-meta-badge briefing-meta-countdown">
            T-{countdown}
          </span>
          <span className="briefing-meta-divider">|</span>
          <span className="briefing-meta-badge briefing-meta-speaker">
            {seminar.speakers || seminar.organizer}
          </span>
          <span className="briefing-meta-divider">|</span>
          <span className="briefing-meta-badge briefing-meta-category">
            {category}
          </span>
        </div>
      </div>

      {/* Right: Compact Action Button */}
      <div className="briefing-row-action">
        <button
          className="briefing-row-btn"
          onClick={() => onAction(seminar.id)}
        >
          UPLINK →
        </button>
      </div>
    </div>
  );
};

export default BriefingRow;