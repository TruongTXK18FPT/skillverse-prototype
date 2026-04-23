import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ShieldCheck,
  Github,
  Globe,
  FileText,
  Award,
  Briefcase,
  Calendar,
  Clock,
  CheckCircle2,
  User,
  ExternalLink,
  Image as ImageIcon,
  AlertCircle,
  LucideIcon,
} from "lucide-react";
import {
  getPublicMentorVerifiedSkillDetails,
  MentorVerificationResponse,
  EvidenceResponse,
  EvidenceType,
} from "../../services/mentorVerificationService";
import "./SkillVerificationDetailPage.css";

const EVIDENCE_META: Record<EvidenceType, { label: string; icon: LucideIcon }> =
  {
    CERTIFICATE: { label: "Chứng chỉ", icon: Award },
    GITHUB: { label: "GitHub Repository", icon: Github },
    PORTFOLIO_LINK: { label: "Portfolio / Website", icon: Globe },
    WORK_EXPERIENCE: { label: "Kinh nghiệm làm việc", icon: Briefcase },
  };

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("vi-VN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

// ── Evidence card ──────────────────────────────────────────────────────────────

const EvidenceCard: React.FC<{ evidence: EvidenceResponse; index: number }> = ({
  evidence,
  index,
}) => {
  const [imgError, setImgError] = useState(false);
  const meta = EVIDENCE_META[evidence.evidenceType] ?? {
    label: evidence.evidenceType,
    icon: FileText,
  };
  const Icon = meta.icon;

  return (
    <div className="svd-evidence-card">
      <div className="svd-evidence-card__header">
        <div className="svd-evidence-card__type-badge">
          <Icon size={14} />
          <span>{meta.label}</span>
        </div>
        <span className="svd-evidence-card__index">#{index + 1}</span>
      </div>

      {/* Certificate image */}
      {evidence.evidenceType === "CERTIFICATE" &&
        evidence.certificateImageUrl &&
        !imgError && (
          <div className="svd-evidence-card__image-wrapper">
            <img
              src={evidence.certificateImageUrl}
              alt={evidence.certificateTitle ?? "Chứng chỉ"}
              className="svd-evidence-card__image"
              onError={() => setImgError(true)}
            />
          </div>
        )}
      {evidence.evidenceType === "CERTIFICATE" &&
        evidence.certificateImageUrl &&
        imgError && (
          <div className="svd-evidence-card__image-placeholder">
            <ImageIcon size={28} />
            <span>Không tải được ảnh</span>
          </div>
        )}

      <div className="svd-evidence-card__body">
        {evidence.certificateTitle && (
          <p className="svd-evidence-card__cert-title">
            {evidence.certificateTitle}
          </p>
        )}
        {evidence.issuingOrganization && (
          <p className="svd-evidence-card__org">
            <Award size={12} />
            {evidence.issuingOrganization}
          </p>
        )}
        {evidence.description && (
          <p className="svd-evidence-card__description">
            {evidence.description}
          </p>
        )}
        {evidence.evidenceUrl && (
          <a
            href={evidence.evidenceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="svd-evidence-card__link"
          >
            <ExternalLink size={13} />
            Xem bằng chứng
          </a>
        )}
      </div>
    </div>
  );
};

// ── Skill verification block ───────────────────────────────────────────────────

const SkillVerificationBlock: React.FC<{
  verification: MentorVerificationResponse;
}> = ({ verification }) => (
  <div className="svd-skill-block">
    <div className="svd-skill-block__header">
      <div className="svd-skill-block__name-row">
        <ShieldCheck size={20} className="svd-skill-block__shield" />
        <h2 className="svd-skill-block__skill-name">
          {verification.skillName}
        </h2>
        <span className="svd-skill-block__approved-badge">
          <CheckCircle2 size={13} />
          Đã xác thực
        </span>
      </div>

      <div className="svd-skill-block__timeline">
        <div className="svd-skill-block__timeline-item">
          <Calendar size={13} />
          <span>
            Nộp hồ sơ:&nbsp;
            <strong>{formatDateTime(verification.requestedAt)}</strong>
          </span>
        </div>
        {verification.reviewedAt && (
          <div className="svd-skill-block__timeline-item">
            <Clock size={13} />
            <span>
              Admin xác thực:&nbsp;
              <strong>{formatDateTime(verification.reviewedAt)}</strong>
            </span>
          </div>
        )}
        {verification.reviewedByName && (
          <div className="svd-skill-block__timeline-item">
            <User size={13} />
            <span>
              Xác thực bởi:&nbsp;
              <strong>{verification.reviewedByName}</strong>
            </span>
          </div>
        )}
      </div>
    </div>

    {/* Links submitted */}
    {(verification.githubUrl || verification.portfolioUrl) && (
      <div className="svd-skill-block__links">
        {verification.githubUrl && (
          <a
            href={verification.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="svd-skill-block__link-chip svd-skill-block__link-chip--github"
          >
            <Github size={14} />
            GitHub Profile / Repository
          </a>
        )}
        {verification.portfolioUrl && (
          <a
            href={verification.portfolioUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="svd-skill-block__link-chip svd-skill-block__link-chip--portfolio"
          >
            <Globe size={14} />
            Portfolio Website
          </a>
        )}
      </div>
    )}

    {/* Additional notes */}
    {verification.additionalNotes && (
      <div className="svd-skill-block__notes">
        <p className="svd-skill-block__notes-label">
          <FileText size={13} />
          Mô tả kinh nghiệm
        </p>
        <p className="svd-skill-block__notes-text">
          {verification.additionalNotes}
        </p>
      </div>
    )}

    {/* Admin review note */}
    {verification.reviewNote && (
      <div className="svd-skill-block__review-note">
        <p className="svd-skill-block__review-note-label">
          <CheckCircle2 size={13} />
          Nhận xét của Admin
        </p>
        <p className="svd-skill-block__review-note-text">
          {verification.reviewNote}
        </p>
      </div>
    )}

    {/* Evidences */}
    <div className="svd-skill-block__evidence-section">
      <h3 className="svd-skill-block__evidence-title">
        Bằng chứng đã nộp ({verification.evidences?.length ?? 0})
      </h3>
      {verification.evidences && verification.evidences.length > 0 ? (
        <div className="svd-skill-block__evidence-grid">
          {verification.evidences.map((ev, idx) => (
            <EvidenceCard key={ev.id} evidence={ev} index={idx} />
          ))}
        </div>
      ) : (
        <p className="svd-skill-block__no-evidence">
          Không có bằng chứng đính kèm.
        </p>
      )}
    </div>
  </div>
);

// ── Main page ─────────────────────────────────────────────────────────────────

const SkillVerificationDetailPage: React.FC = () => {
  const { mentorId, skillName } = useParams<{
    mentorId: string;
    skillName: string;
  }>();
  const navigate = useNavigate();

  const [verifications, setVerifications] = useState<
    MentorVerificationResponse[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const decodedSkill = skillName ? decodeURIComponent(skillName) : null;

  useEffect(() => {
    if (!mentorId) return;

    const load = async () => {
      try {
        setLoading(true);
        const data = await getPublicMentorVerifiedSkillDetails(
          Number(mentorId),
        );
        // Filter to the specific skill if provided
        const filtered = decodedSkill
          ? data.filter(
              (v) => v.skillName.toLowerCase() === decodedSkill.toLowerCase(),
            )
          : data;
        setVerifications(filtered);
      } catch {
        setError("Không thể tải thông tin xác thực. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [mentorId, decodedSkill]);

  const mentorName = verifications[0]?.mentorName ?? "Mentor";
  const mentorAvatar = verifications[0]?.mentorAvatarUrl;

  return (
    <div className="svd-page">
      {/* ── Page header ── */}
      <div className="svd-page__hero">
        <div className="svd-page__hero-inner">
          <button
            className="svd-page__back-btn"
            onClick={() => navigate(-1)}
            aria-label="Quay lại"
          >
            <ArrowLeft size={18} />
            Quay lại
          </button>

          <div className="svd-page__mentor-identity">
            {mentorAvatar ? (
              <img
                src={mentorAvatar}
                alt={mentorName}
                className="svd-page__mentor-avatar"
              />
            ) : (
              <div className="svd-page__mentor-avatar-placeholder">
                <User size={28} />
              </div>
            )}
            <div>
              <p className="svd-page__mentor-label">
                Hồ sơ xác thực kỹ năng của
              </p>
              <h1 className="svd-page__mentor-name">{mentorName}</h1>
            </div>
          </div>

          {decodedSkill && (
            <div className="svd-page__skill-focus">
              <ShieldCheck size={16} />
              <span>
                Kỹ năng:&nbsp;<strong>{decodedSkill}</strong>
              </span>
            </div>
          )}

          <p className="svd-page__hero-sub">
            Tất cả bằng chứng dưới đây đã được ban quản trị SkillVerse xem xét
            và xác thực.
          </p>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="svd-page__content">
        {loading && (
          <div className="svd-page__loading">
            <div className="svd-page__spinner" />
            <p>Đang tải thông tin xác thực…</p>
          </div>
        )}

        {!loading && error && (
          <div className="svd-page__error">
            <AlertCircle size={20} />
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && verifications.length === 0 && (
          <div className="svd-page__empty">
            <ShieldCheck size={40} />
            <p>Không tìm thấy thông tin xác thực cho kỹ năng này.</p>
          </div>
        )}

        {!loading && !error && verifications.length > 0 && (
          <div className="svd-page__verifications">
            {verifications.map((v) => (
              <SkillVerificationBlock key={v.id} verification={v} />
            ))}
          </div>
        )}

        {/* Verified timestamp footer */}
        {!loading &&
          verifications.length > 0 &&
          verifications[0].reviewedAt && (
            <div className="svd-page__footer-note">
              <CheckCircle2 size={14} />
              <span>
                Thông tin này được xác thực lần cuối vào{" "}
                <strong>{formatDate(verifications[0].reviewedAt)}</strong> bởi
                đội ngũ SkillVerse.
              </span>
            </div>
          )}
      </div>
    </div>
  );
};

export default SkillVerificationDetailPage;
