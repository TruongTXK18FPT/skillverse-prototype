import React from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Heart, Star, ShieldCheck, Calendar, Globe } from "lucide-react";
import "./uplink-styles.css";

interface MasterProfileCardProps {
  id: string;
  name: string;
  title: string;
  rating: number;
  reviews: number;
  hourlyRate: number;
  roadmapMentoringPrice?: number;
  expertise: string[];
  languages: string[];
  availability: string;
  experience: string;
  bio: string;
  avatar: string;
  badges: string[];
  isFavorite: boolean;
  preChatEnabled?: boolean;
  verifiedSkills?: string[];
  onEstablishLink: () => void;
  onBookRoadmap?: () => void;
  onToggleFavorite?: () => void;
  onViewProfile?: () => void;
}

const MasterProfileCard: React.FC<MasterProfileCardProps> = ({
  id,
  name,
  title,
  rating,
  reviews,
  hourlyRate,
  roadmapMentoringPrice,
  expertise,
  languages,
  experience,
  bio,
  avatar,
  isFavorite,
  preChatEnabled = true,
  verifiedSkills = [],
  onEstablishLink,
  onBookRoadmap,
  onToggleFavorite,
  onViewProfile,
}) => {
  const navigate = useNavigate();
  const isOnline = preChatEnabled;
  const ratingNum = Number(rating) || 0;

  const renderStars = (value: number) => {
    return [1, 2, 3, 4, 5].map((star) => {
      const filled = value >= star;
      const halfFilled = !filled && value >= star - 0.5;
      return (
        <Star
          key={star}
          size={13}
          fill={filled || halfFilled ? "var(--uplink-primary)" : "none"}
          stroke="var(--uplink-primary)"
          style={{ opacity: filled || halfFilled ? 1 : 0.35 }}
        />
      );
    });
  };

  const handleVerifiedSkillClick = (skillName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/mentors/${id}/verified-skills/${encodeURIComponent(skillName)}`);
  };

  return (
    <div className="uplink-card">
      {/* ── Header ─────────────────────────────────────── */}
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
            aria-label="Yêu thích"
            style={{
              position: "absolute",
              top: "-5px",
              right: "-5px",
              zIndex: 10,
              background: "rgba(15, 23, 42, 0.85)",
              border: "1px solid var(--uplink-border)",
              borderRadius: "50%",
              padding: "5px",
              cursor: "pointer",
              color: isFavorite ? "#ef4444" : "var(--uplink-text-grey)",
            }}
          >
            <Heart size={14} fill={isFavorite ? "#ef4444" : "none"} />
          </button>
        </div>

        <div className="uplink-profile-info">
          {/* Star rating row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              marginBottom: "4px",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
              {renderStars(ratingNum)}
            </div>
            <span
              style={{
                color: "var(--uplink-primary)",
                fontSize: "0.85rem",
                fontWeight: 600,
              }}
            >
              {ratingNum.toFixed(1)}
            </span>
            <span
              style={{ fontSize: "0.72rem", color: "var(--uplink-text-grey)" }}
            >
              ({reviews} đánh giá)
            </span>
          </div>

          <h3
            className="uplink-mentor-name"
            onClick={onViewProfile}
            style={{ cursor: "pointer", marginBottom: "2px" }}
          >
            {name}
          </h3>
          <p className="uplink-mentor-title" style={{ marginBottom: 0 }}>
            {title}
          </p>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────── */}
      <div className="uplink-card-body">
        {/* Expertise chips */}
        <div
          className="uplink-expertise-grid"
          style={{ marginBottom: "0.6rem" }}
        >
          {expertise.slice(0, 4).map((skill, index) => (
            <span key={index} className="uplink-tech-chip">
              {skill}
            </span>
          ))}
          {expertise.length > 4 && (
            <span className="uplink-tech-chip" style={{ opacity: 0.6 }}>
              +{expertise.length - 4} khác
            </span>
          )}
        </div>

        {/* Verified skills section */}
        {verifiedSkills.length > 0 && (
          <div style={{ marginBottom: "0.75rem" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                marginBottom: "5px",
              }}
            >
              <ShieldCheck
                size={12}
                style={{ color: "#22c55e", flexShrink: 0 }}
              />
              <span
                style={{
                  fontSize: "0.68rem",
                  color: "#22c55e",
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                Kỹ năng đã xác thực
              </span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
              {verifiedSkills.map((skill, idx) => (
                <button
                  key={idx}
                  onClick={(e) => handleVerifiedSkillClick(skill, e)}
                  title={`Xem bằng chứng xác thực: ${skill}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    background: "rgba(34, 197, 94, 0.12)",
                    border: "1px solid rgba(34, 197, 94, 0.45)",
                    borderRadius: "6px",
                    padding: "3px 8px",
                    fontSize: "0.7rem",
                    color: "#4ade80",
                    cursor: "pointer",
                    fontWeight: 600,
                    transition: "all 0.18s ease",
                    letterSpacing: "0.02em",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "rgba(34, 197, 94, 0.25)";
                    (e.currentTarget as HTMLButtonElement).style.borderColor =
                      "rgba(34, 197, 94, 0.75)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "rgba(34, 197, 94, 0.12)";
                    (e.currentTarget as HTMLButtonElement).style.borderColor =
                      "rgba(34, 197, 94, 0.45)";
                  }}
                >
                  <ShieldCheck size={10} />
                  {skill}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Metrics */}
        <div className="uplink-metrics">
          <div className="uplink-metric-item">
            <span
              className="uplink-metric-label"
              style={{ display: "flex", alignItems: "center", gap: "4px" }}
            >
              <Calendar size={10} />
              Kinh nghiệm
            </span>
            <span className="uplink-metric-value">{experience}</span>
          </div>
          <div className="uplink-metric-item">
            <span
              className="uplink-metric-label"
              style={{ display: "flex", alignItems: "center", gap: "4px" }}
            >
              <Globe size={10} />
              Ngôn ngữ
            </span>
            <span className="uplink-metric-value">
              {languages.slice(0, 2).join(", ")}
            </span>
          </div>
        </div>

        {/* Bio */}
        <div
          style={{
            marginTop: "0.8rem",
            borderTop: "1px solid rgba(6, 182, 212, 0.1)",
            paddingTop: "0.65rem",
          }}
        >
          <p
            style={{
              fontSize: "0.78rem",
              color: "var(--uplink-text-grey)",
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            {bio.length > 110 ? `${bio.substring(0, 110)}…` : bio}
          </p>
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────── */}
      <div className="uplink-card-footer">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            marginBottom: "0.9rem",
            width: "100%",
          }}
        >
          <div
            className="uplink-price-section"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span className="uplink-price-label">Tư vấn 1 — 1 / giờ</span>
            <div className="uplink-price-value">
              {hourlyRate.toLocaleString("vi-VN")}&nbsp;
              <span style={{ fontSize: "0.68rem" }}>VND</span>
            </div>
          </div>
          {roadmapMentoringPrice ? (
            <div
              className="uplink-price-section"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span className="uplink-price-label" style={{ color: "#22d3ee" }}>
                Đồng hành Roadmap
              </span>
              <div className="uplink-price-value" style={{ color: "#22d3ee" }}>
                {roadmapMentoringPrice.toLocaleString("vi-VN")}&nbsp;
                <span style={{ fontSize: "0.68rem" }}>VND</span>
              </div>
            </div>
          ) : null}
        </div>

        <div
          className="uplink-action-group"
          style={{ display: "flex", gap: "8px", width: "100%" }}
        >
          <button
            className="uplink-message-btn"
            onClick={onViewProfile}
            title="Xem hồ sơ chi tiết"
            style={{ flex: "0 0 auto" }}
          >
            <Eye size={17} />
          </button>
          <div style={{ display: "flex", flex: 1, gap: "6px" }}>
            <button
              className="uplink-establish-btn"
              onClick={onEstablishLink}
              style={{
                flex: 1,
                padding: "9px 6px",
                fontSize: "0.78rem",
                fontWeight: 600,
              }}
            >
              Đặt lịch tư vấn
            </button>
            {roadmapMentoringPrice ? (
              <button
                className="uplink-establish-btn"
                onClick={onBookRoadmap}
                style={{
                  flex: 1,
                  padding: "9px 6px",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  background:
                    "linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)",
                  borderColor: "#06b6d4",
                  color: "#fff",
                }}
              >
                Đồng hành Roadmap
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MasterProfileCard;
