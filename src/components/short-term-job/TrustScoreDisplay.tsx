import React, { useState, useEffect } from "react";
import { Star, Loader2 } from "lucide-react";
import shortTermJobService from "../../services/shortTermJobService";
import { TrustScore, TrustTier } from "../../types/ShortTermJob";
import MeowlKuruLoader from "../kuru-loader/MeowlKuruLoader";
import "../business-hud/short-term-fleet.css";

interface TrustScoreDisplayProps {
  userId: number;
  score?: TrustScore;
  showScore?: boolean;
  size?: "small" | "medium" | "large";
}

const TIER_CONFIG: Record<TrustTier, {
  label: string;
  bg: string;
  border: string;
  color: string;
  icon?: string;
}> = {
  [TrustTier.NEWCOMER]: {
    label: "Tân binh",
    bg: "rgba(148, 163, 184, 0.15)",
    border: "rgba(148, 163, 184, 0.3)",
    color: "#94a3b8",
  },
  [TrustTier.BASIC]: {
    label: "Cơ bản",
    bg: "rgba(59, 130, 246, 0.15)",
    border: "rgba(59, 130, 246, 0.3)",
    color: "#3b82f6",
  },
  [TrustTier.TRUSTED]: {
    label: "Đáng tin cậy",
    bg: "rgba(16, 185, 129, 0.15)",
    border: "rgba(16, 185, 129, 0.3)",
    color: "#10b981",
  },
  [TrustTier.ELITE]: {
    label: "Elite",
    bg: "linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(245, 158, 11, 0.15))",
    border: "rgba(251, 191, 36, 0.4)",
    color: "#fbbf24",
    icon: "star",
  },
};

const TrustScoreDisplay: React.FC<TrustScoreDisplayProps> = ({
  userId,
  score: propScore,
  showScore = false,
  size = "medium",
}) => {
  const [score, setScore] = useState<TrustScore | null>(propScore || null);
  const [isLoading, setIsLoading] = useState(!propScore);

  useEffect(() => {
    if (!propScore) {
      loadScore();
    }
  }, [userId]);

  const loadScore = async () => {
    setIsLoading(true);
    try {
      const s = await shortTermJobService.getTrustScore(userId);
      setScore(s);
    } catch {
      setScore(null);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.3rem",
          padding: size === "small" ? "0.15rem 0.4rem" : "0.2rem 0.6rem",
          borderRadius: "999px",
          fontSize: size === "small" ? "0.65rem" : size === "large" ? "0.88rem" : "0.75rem",
          fontWeight: 600,
          background: "rgba(148, 163, 184, 0.08)",
          border: "1px solid rgba(148, 163, 184, 0.15)",
          color: "#94a3b8",
        }}
      >
        <Loader2 size={10} className="stj-spin" />
      </span>
    );
  }

  if (!score) {
    return null;
  }

  const tierConfig = TIER_CONFIG[score.tier] || TIER_CONFIG[TrustTier.NEWCOMER];

  const sizeStyles = {
    small: { padding: "0.15rem 0.4rem", fontSize: "0.65rem" },
    medium: { padding: "0.2rem 0.6rem", fontSize: "0.75rem" },
    large: { padding: "0.3rem 0.8rem", fontSize: "0.88rem" },
  };

  const currentSize = sizeStyles[size];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.3rem",
        borderRadius: "999px",
        fontWeight: 700,
        letterSpacing: "0.03em",
        ...currentSize,
        background: tierConfig.bg,
        border: `1px solid ${tierConfig.border}`,
        color: tierConfig.color,
      }}
      title={`Trust Score: ${score.score}/100 · ${score.totalCompleted}/${score.totalJobs} jobs hoàn thành`}
    >
      {score.tier === TrustTier.ELITE && <Star size={size === "small" ? 9 : size === "large" ? 13 : 11} fill="currentColor" />}
      {showScore && (
        <span style={{ fontWeight: 800 }}>
          {Math.round(score.score)}
        </span>
      )}
      {tierConfig.label}
    </span>
  );
};

export default TrustScoreDisplay;
