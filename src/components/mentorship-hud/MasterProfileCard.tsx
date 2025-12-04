import React from 'react';
import {
  Heart,
  MessageCircle,
  Award,
  Briefcase,
  DollarSign,
  ChevronRight,
  Globe,
  Clock,
  Eye
} from 'lucide-react';
import './uplink-styles.css';

interface MasterProfileCardProps {
  id: string;
  name: string;
  title: string;
  rating: number;
  reviews: number;
  hourlyRate: number;
  expertise: string[];
  languages: string[];
  availability: string;
  experience: string;
  bio: string;
  avatar: string;
  badges: string[];
  isFavorite: boolean;
  preChatEnabled?: boolean;
  onEstablishLink: () => void;
  onMessage?: () => void;
  onToggleFavorite?: () => void;
  onViewProfile?: () => void;
}

const MasterProfileCard: React.FC<MasterProfileCardProps> = ({
  name,
  title,
  rating,
  reviews,
  hourlyRate,
  expertise,
  languages,
  availability,
  experience,
  bio,
  avatar,
  badges,
  isFavorite,
  preChatEnabled = true,
  onEstablishLink,
  onMessage,
  onToggleFavorite,
  onViewProfile
}) => {
  // Convert rating (0-5) to signal bars (0-5)
  const signalStrength = Math.round(rating);

  // Determine online status based on preChatEnabled
  const isOnline = preChatEnabled;

  return (
    <div className="uplink-card">
      {/* Tech Brackets - Decorative Corner Borders */}
      <div className="uplink-tech-bracket top-right"></div>
      <div className="uplink-tech-bracket bottom-left"></div>

      {/* Avatar Section with Tech Ring */}
      <div className="uplink-avatar-section" onClick={onViewProfile} style={{ cursor: 'pointer' }}>
        <div className="uplink-avatar-wrapper">
          {/* Rotating Dashed Ring */}
          <div className="uplink-avatar-ring"></div>

          {/* Avatar Image */}
          <img
            src={avatar}
            alt={name}
            className="uplink-avatar-img"
          />

          {/* Status LED */}
          <div className={`uplink-status-led ${isOnline ? 'online' : 'offline'}`}></div>
        </div>

        {/* Favorite Button */}
        <button
          className={`uplink-favorite-btn ${isFavorite ? 'active' : ''}`}
          onClick={onToggleFavorite}
          aria-label="Toggle favorite"
        >
          <Heart size={18} />
        </button>
      </div>

      {/* Master Info */}
      <div className="uplink-card-info">
        <h3 className="uplink-master-name" onClick={onViewProfile} style={{ cursor: 'pointer' }}>{name}</h3>
        <p className="uplink-master-title">{title}</p>

        {/* Signal Strength (Rating) */}
        <div className="uplink-signal-strength">
          <div className="uplink-signal-bars">
            {[1, 2, 3, 4, 5].map((bar) => (
              <div
                key={bar}
                className={`uplink-signal-bar ${bar <= signalStrength ? 'active' : ''}`}
              ></div>
            ))}
          </div>
          <span className="uplink-signal-value">
            {(Number(rating) || 0).toFixed(1)} ({reviews} reviews)
          </span>
        </div>

        {/* Badges */}
        {badges.length > 0 && (
          <div className="uplink-badges">
            {badges.slice(0, 3).map((badge, index) => (
              <span key={index} className="uplink-badge">
                <Award size={12} />
                {badge}
              </span>
            ))}
          </div>
        )}

        {/* Expertise Modules */}
        <div className="uplink-expertise-modules">
          <div className="uplink-expertise-label">Chuyên môn</div>
          <div className="uplink-expertise-tags">
            {expertise.slice(0, 4).map((skill, index) => (
              <span key={index} className="uplink-expertise-tag">
                {skill}
              </span>
            ))}
            {expertise.length > 4 && (
              <span className="uplink-expertise-tag">+{expertise.length - 4} nữa</span>
            )}
          </div>
        </div>

        {/* Bio */}
        <div className="uplink-bio">
          <p className="uplink-bio-text">
            {bio.length > 120 ? `${bio.substring(0, 120)}...` : bio}
          </p>
        </div>

        {/* Metrics Row */}
        <div className="uplink-metrics-row">
          <div className="uplink-metric">
            <Briefcase className="uplink-metric-icon" size={16} />
            <span className="uplink-metric-value">{experience}</span>
          </div>
          <div className="uplink-metric">
            <DollarSign className="uplink-metric-icon" size={16} />
            <span className="uplink-metric-value price">{hourlyRate.toLocaleString('vi-VN')} VND/giờ</span>
          </div>
          <div className="uplink-metric">
            <Globe className="uplink-metric-icon" size={16} />
            <span className="uplink-metric-value">
              {languages.slice(0, 2).join(', ')}
            </span>
          </div>
          <div className="uplink-metric">
            <Clock className="uplink-metric-icon" size={16} />
            <span className="uplink-metric-value">{availability}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="uplink-actions">
        <button 
          className="uplink-establish-btn" 
          onClick={onEstablishLink}
          disabled={!preChatEnabled}
          style={{ opacity: preChatEnabled ? 1 : 0.5, cursor: preChatEnabled ? 'pointer' : 'not-allowed' }}
        >
          {preChatEnabled ? 'Đặt lịch' : 'Tạm dừng'}
          <ChevronRight size={18} />
        </button>
        
        <button
          className="uplink-message-btn"
          onClick={onViewProfile}
          aria-label="View Profile"
          title="Xem chi tiết hồ sơ"
        >
          <Eye size={18} />
        </button>

        <button
          className="uplink-message-btn"
          onClick={onMessage}
          aria-label="Send message"
        >
          <MessageCircle size={18} />
        </button>
      </div>
    </div>
  );
};

export default MasterProfileCard;
