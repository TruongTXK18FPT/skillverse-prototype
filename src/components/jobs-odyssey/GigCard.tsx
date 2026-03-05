import {
  Flame,
  TrendingUp,
  Clock,
  MapPin,
  ArrowRight,
  Zap,
  Users,
} from "lucide-react";
import { ShortTermJobResponse } from "../../types/ShortTermJob";

interface GigCardProps {
  job: ShortTermJobResponse;
  onClick: () => void;
}

const GigCard = ({ job, onClick }: GigCardProps) => {
  // Determine card rarity based on urgency  (mirrors FateCard's rarity approach)
  const getRarity = (): "emerald" | "amber" | "crimson" => {
    if (job.urgency === "VERY_URGENT" || job.urgency === "ASAP")
      return "crimson";
    if (job.urgency === "URGENT") return "amber";
    return "emerald";
  };

  const rarity = getRarity();

  // Format budget
  const formatBudget = (amount: number) => {
    const formatter = new Intl.NumberFormat("vi-VN", {
      maximumFractionDigits: 0,
      notation: "compact",
      compactDisplay: "short",
    });
    return formatter.format(amount);
  };

  // Deadline countdown
  const getDeadlineInfo = () => {
    if (!job.deadline) return { text: "Không rõ", urgent: false };
    const now = new Date();
    const deadline = new Date(job.deadline);
    const diffMs = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: "Đã hết hạn", urgent: true };
    if (diffDays === 0) return { text: "Hôm nay", urgent: true };
    if (diffDays === 1) return { text: "Còn 1 ngày", urgent: true };
    if (diffDays <= 3) return { text: `Còn ${diffDays} ngày`, urgent: true };
    if (diffDays <= 7) return { text: `Còn ${diffDays} ngày`, urgent: false };
    return {
      text: deadline.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
      }),
      urgent: false,
    };
  };

  // Company initials for faction ring
  const getCompanyInitials = () => {
    const name =
      job.recruiterInfo?.companyName || job.recruiterCompanyName || "XX";
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const deadline = getDeadlineInfo();
  const isUrgent = rarity === "crimson";

  const urgencyConfig: Record<
    string,
    { label: string; icon: React.ReactNode }
  > = {
    crimson: { label: "Rất gấp", icon: <Flame size={11} /> },
    amber: { label: "Ưu tiên", icon: <TrendingUp size={11} /> },
    emerald: { label: "Gig", icon: <Zap size={11} /> },
  };
  const cfg = urgencyConfig[rarity];

  return (
    <div className="odyssey-gig-wrapper" onClick={onClick}>
      <div className={`odyssey-gig odyssey-gig--${rarity}`}>
        {/* Badges */}
        {isUrgent && (
          <div className="odyssey-gig__badge odyssey-gig__badge--urgent">
            {cfg.icon} {cfg.label}
          </div>
        )}
        {!isUrgent && job.isRemote && (
          <div className="odyssey-gig__badge odyssey-gig__badge--remote">
            Remote
          </div>
        )}

        {/* Corner Indicators – same as FateCard */}
        <div className="odyssey-gig__corner odyssey-gig__corner--tl" />
        <div className="odyssey-gig__corner odyssey-gig__corner--br" />

        {/* Content wrapper */}
        <div className="odyssey-gig__content-wrapper">
          {/* Faction (Company) */}
          <div className="odyssey-gig__faction">
            <div className="odyssey-gig__faction-ring">
              {getCompanyInitials()}
            </div>
            <div className="odyssey-gig__company">
              {job.recruiterInfo?.companyName ||
                job.recruiterCompanyName ||
                "Công ty"}
            </div>
            <span className="odyssey-gig__type-tag">
              <Zap size={10} /> Ngắn hạn
            </span>
          </div>

          {/* Title */}
          <div className="odyssey-gig__content">
            <h3 className="odyssey-gig__title">{job.title}</h3>

            {/* Skills */}
            {job.requiredSkills?.length > 0 && (
              <div className="odyssey-gig__tags">
                {job.requiredSkills.slice(0, 4).map((skill, i) => (
                  <span key={i} className="odyssey-gig__tag">
                    {skill}
                  </span>
                ))}
                {job.requiredSkills.length > 4 && (
                  <span className="odyssey-gig__tag">
                    +{job.requiredSkills.length - 4}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Bounty (Budget) */}
          <div className="odyssey-gig__bounty">
            <div className="odyssey-gig__bounty-label">Ngân sách</div>
            <div className="odyssey-gig__bounty-amount">
              {formatBudget(job.budget)} ₫
              {job.isNegotiable && (
                <span className="odyssey-gig__negotiable"> · TL</span>
              )}
            </div>
          </div>

          {/* Meta + Footer */}
          <div className="odyssey-gig__footer">
            <div className="odyssey-gig__meta">
              <div className="odyssey-gig__meta-item">
                <Clock size={13} className="odyssey-gig__meta-icon" />
                {job.estimatedDuration || "N/A"}
              </div>
              <div className="odyssey-gig__meta-item">
                <MapPin size={13} className="odyssey-gig__meta-icon" />
                {job.isRemote ? "Remote" : job.location || "N/A"}
              </div>
              {job.maxApplicants && (
                <div className="odyssey-gig__meta-item">
                  <Users size={13} className="odyssey-gig__meta-icon" />
                  {job.applicantCount || 0}/{job.maxApplicants}
                </div>
              )}
              <div
                className={`odyssey-gig__meta-item${deadline.urgent ? " odyssey-gig__meta-item--warn" : ""}`}
              >
                <Clock size={13} className="odyssey-gig__meta-icon" />
                {deadline.text}
              </div>
            </div>

            <button
              className="odyssey-gig__btn"
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
            >
              <span>Xem chi tiết</span>
              <ArrowRight className="odyssey-gig__btn-icon" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GigCard;
