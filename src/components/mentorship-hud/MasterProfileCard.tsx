import React from "react";
import { Eye, Heart, Star, ShieldCheck } from "lucide-react";
import "./uplink-styles.css";

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
  verifiedSkills?: string[];  // Skills đã được admin xác thực
  onEstablishLink: () => void;
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
  experience,
  bio,
  avatar,
  isFavorite,
  preChatEnabled = true,
  verifiedSkills = [],
  onEstablishLink,
  onToggleFavorite,
  onViewProfile,
}) => {
  const hasVerifiedSkills = verifiedSkills.length > 0;
  // Legacy mentor presence flag now only drives the online dot.
  const isOnline = preChatEnabled;

  return (
    <div className="uplink-card">
      <div className="uplink-card-header">
        <div
          className="uplink-avatar-container"
          onClick={onViewProfile}
          style={{ cursor: "pointer" }}
        >
          <div className="uplink-avatar-ring" />
          <img src={avatar} alt={name} className="uplink-avatar-img" />
          {isOnline && <div className="uplink-online-indicator" />}

          <button
            className={`uplink-favorite-btn ${isFavorite ? "active" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite?.();
            }}
            aria-label="Toggle favorite"
            style={{
              position: "absolute",
              top: "-5px",
              right: "-5px",
              zIndex: 10,
              background: "rgba(15, 23, 42, 0.8)",
              border: "1px solid var(--uplink-border)",
              borderRadius: "50%",
              padding: "4px",
              color: isFavorite ? "#ef4444" : "var(--uplink-text-grey)",
            }}
          >
            <Heart size={14} fill={isFavorite ? "#ef4444" : "none"} />
          </button>
        </div>

        <div className="uplink-profile-info">
          <div className="uplink-badge-row">
            <div className="uplink-rating">
              <Star
                size={12}
                fill="var(--uplink-primary)"
                stroke="var(--uplink-primary)"
              />
              <span
                style={{ color: "var(--uplink-primary)", marginLeft: "4px" }}
              >
                {(Number(rating) || 0).toFixed(1)}
              </span>
              <span
                style={{
                  fontSize: "0.65rem",
                  color: "var(--uplink-text-grey)",
                  marginLeft: "4px",
                }}
              >
                ({reviews})
              </span>
            </div>
            {hasVerifiedSkills && (
              <div
                className="uplink-verified-badge"
                title={`Đã xác thực: ${verifiedSkills.join(", ")}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  background: "rgba(34, 197, 94, 0.2)",
                  border: "1px solid rgba(34, 197, 94, 0.5)",
                  borderRadius: "4px",
                  padding: "2px 6px",
                  fontSize: "0.65rem",
                  color: "#22c55e",
                  marginLeft: "8px",
                }}
              >
                <ShieldCheck size={12} />
                <span>Đã xác thực</span>
              </div>
            )}
          </div>
          <h3
            className="uplink-mentor-name"
            onClick={onViewProfile}
            style={{ cursor: "pointer" }}
          >
            {name}
          </h3>
          <p className="uplink-mentor-title">{title}</p>
        </div>
      </div>

      <div className="uplink-card-body">
        <div className="uplink-expertise-grid">
          {expertise.slice(0, 4).map((skill, index) => (
            <span key={index} className="uplink-tech-chip">
              {skill.toUpperCase()}
            </span>
          ))}
          {expertise.length > 4 && (
            <span className="uplink-tech-chip" style={{ opacity: 0.6 }}>
              +{expertise.length - 4}
            </span>
          )}
        </div>

        <div className="uplink-metrics">
          <div className="uplink-metric-item">
            <span className="uplink-metric-label">KINH NGHIỆM</span>
            <span className="uplink-metric-value">
              {experience.toUpperCase()}
            </span>
          </div>
          <div className="uplink-metric-item">
            <span className="uplink-metric-label">NGÔN NGỮ</span>
            <span className="uplink-metric-value">
              {languages.slice(0, 2).join(", ").toUpperCase()}
            </span>
          </div>
        </div>

        <div
          className="uplink-bio"
          style={{
            marginTop: "1rem",
            borderTop: "1px solid rgba(6, 182, 212, 0.1)",
            paddingTop: "0.75rem",
          }}
        >
          <p
            style={{
              fontSize: "0.8rem",
              color: "var(--uplink-text-grey)",
              lineHeight: 1.4,
              margin: 0,
            }}
          >
            {bio.length > 100 ? `${bio.substring(0, 100)}...` : bio}
          </p>
        </div>
      </div>

      <div className="uplink-card-footer">
        <div className="uplink-price-section" style={{ marginBottom: "1rem" }}>
          <span className="uplink-price-label">ĐƠN GIÁ / GIỜ</span>
          <div className="uplink-price-value">
            {hourlyRate.toLocaleString("vi-VN")}{" "}
            <span style={{ fontSize: "0.7rem" }}>VND</span>
          </div>
        </div>

        <div className="uplink-action-group">
          <button
            className="uplink-message-btn"
            onClick={onViewProfile}
            title="Xem hồ sơ"
          >
            <Eye size={18} />
          </button>
          <button className="uplink-establish-btn" onClick={onEstablishLink}>
            Đặt lịch ngay
          </button>
        </div>
      </div>
    </div>
  );
};

export default MasterProfileCard;
