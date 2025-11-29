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

interface BriefingCardProps {
  seminar: Seminar;
  onRegister: (id: string) => void;
}

const BriefingCard: React.FC<BriefingCardProps> = ({ seminar, onRegister }) => {
  const [countdown, setCountdown] = useState<string>('');

  // Calculate countdown
  useEffect(() => {
    const calculateCountdown = () => {
      try {
        // Parse Unix timestamp (seminar.date is in seconds)
        const dateTimestamp = Number(seminar.date) * 1000; // Convert to milliseconds
        const seminarDate = new Date(dateTimestamp);

        // Parse startTime (format: "14:00" or "14")
        const [hours, minutes] = seminar.startTime.split(':').map(Number);
        seminarDate.setHours(hours || 0, minutes || 0, 0, 0);

        const now = new Date();
        const diff = seminarDate.getTime() - now.getTime();

        if (diff <= 0) {
          return 'BRIEFING ACTIVE';
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hrs = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);

        if (days > 0) {
          return `T-MINUS ${days}D ${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
          return `T-MINUS ${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
      } catch (error) {
        return 'STANDBY';
      }
    };

    setCountdown(calculateCountdown());

    const interval = setInterval(() => {
      setCountdown(calculateCountdown());
    }, 1000);

    return () => clearInterval(interval);
  }, [seminar.date, seminar.startTime]);

  // Extract category from tags (first tag)
  const category = typeof seminar.tags === 'string'
    ? seminar.tags.split(',')[0]?.trim() || 'INTEL'
    : 'INTEL';

  // Format location as coordinates
  const formatLocation = (loc: string): string => {
    const sectorNumber = Math.floor(Math.random() * 9) + 1;
    return `SECTOR ${sectorNumber} // ${loc}`;
  };

  return (
    <div className="briefing-card">
      {/* Hologram Image with Category Badge */}
      <div className="briefing-holo-wrapper">
        <img
          src={seminar.backgroundImageUrl}
          alt={seminar.title}
          loading="lazy"
        />
        <div className="briefing-category-badge">{category.toUpperCase()}</div>
      </div>

      {/* Card Content */}
      <div className="briefing-card-content">
        <h3 className="briefing-card-title">{seminar.title}</h3>

        {/* Countdown Clock */}
        <div className="briefing-countdown">⚡ {countdown}</div>

        <p className="briefing-card-description">{seminar.description}</p>

        {/* Info Grid */}
        <div className="briefing-info-grid">
          <div className="briefing-info-item">
            <span className="briefing-info-icon">📍</span>
            <span className="briefing-info-label">Location:</span>
            <span className="briefing-info-value">{formatLocation(seminar.location)}</span>
          </div>

          <div className="briefing-info-item">
            <span className="briefing-info-icon">👤</span>
            <span className="briefing-info-label">Officer:</span>
            <span className="briefing-info-value">{seminar.speakers || seminar.organizer}</span>
          </div>

          <div className="briefing-info-item">
            <span className="briefing-info-icon">🕐</span>
            <span className="briefing-info-label">Duration:</span>
            <span className="briefing-info-value">{seminar.startTime} - {seminar.endTime}</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          className="briefing-uplink-btn"
          onClick={() => onRegister(seminar.id)}
        >
          ⚡ INITIALIZE UPLINK
        </button>
      </div>
    </div>
  );
};

export default BriefingCard;