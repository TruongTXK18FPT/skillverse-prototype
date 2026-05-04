import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
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
  Map,
  MessageSquare
} from "lucide-react";
import {
  getPublicMentorVerifiedSkillDetails,
  MentorVerificationResponse,
  EvidenceResponse,
  EvidenceType,
} from "../../services/mentorVerificationService";
import {
  getPublicStudentVerifiedSkillDetails,
  StudentVerificationResponse,
} from "../../services/studentSkillVerificationService";
import {
  portfolioService,
  JourneyVerificationDetailResponse
} from "../../services/portfolioService";
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

// ── Markdown Link Renderer ───────────────────────────────────────────────────
const MarkdownLinkRender = (props: any) => {
  return (
    <a href={props.href} target="_blank" rel="noopener noreferrer">
      {props.children}
    </a>
  );
};

// ── Evidence card (Admin) ────────────────────────────────────────────────────

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

// ── Admin Verification Block ───────────────────────────────────────────────────

const AdminVerificationBlock: React.FC<{
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
          Xác thực bởi Admin
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
              Xác thực lúc:&nbsp;
              <strong>{formatDateTime(verification.reviewedAt)}</strong>
            </span>
          </div>
        )}
        {verification.reviewedByName && (
          <div className="svd-skill-block__timeline-item">
            <User size={13} />
            <span>
              Người xác nhận:&nbsp;
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
        <div className="svd-evidence-markdown">
           <ReactMarkdown components={{ a: MarkdownLinkRender }}>
              {verification.additionalNotes}
           </ReactMarkdown>
        </div>
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

// ── Journey Verification Block ─────────────────────────────────────────────────

const JourneyVerificationBlock: React.FC<{
  data: JourneyVerificationDetailResponse;
}> = ({ data }) => {
  return (
    <div className="svd-journey-view">
      {data.mentorId && (
        <div className="svd-journey-header">
          <div className="svd-journey-header-info">
            {data.mentorAvatarUrl ? (
              <img src={data.mentorAvatarUrl} alt={data.mentorName} className="svd-journey-mentor-avatar" />
            ) : (
              <div className="svd-page__mentor-avatar-placeholder" style={{ width: 48, height: 48 }}>
                <User size={24} />
              </div>
            )}
            <div className="svd-journey-mentor-details">
              <small>Mentor Đồng hành</small>
              <strong>{data.mentorName}</strong>
              {(data.mentorProfileSlug || data.mentorId) && (
                <a
                  href={data.mentorProfileSlug
                    ? `/portfolio/${data.mentorProfileSlug}`
                    : `/portfolio/user/${data.mentorId}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="svd-mentor-portfolio-btn"
                >
                  <ExternalLink size={13} />
                  Xem hồ sơ Mentor
                </a>
              )}
            </div>
          </div>
          <div className="svd-journey-verified-stamp">
            <CheckCircle2 size={18} />
            Đã duyệt bởi Mentor
          </div>
        </div>
      )}

      {/* Nodes Timeline */}
      {data.nodes && data.nodes.length > 0 && (
        <div className="svd-timeline">
          {data.nodes.map((node, index) => (
            <div key={node.nodeId || index} className="svd-timeline-item">
              <div className="svd-timeline-marker">
                <CheckCircle2 size={12} />
              </div>
              <div className="svd-timeline-content">
                <div className="svd-timeline-header">
                  <h3 className="svd-timeline-title">{node.nodeTitle}</h3>
                  <div className="svd-timeline-date">
                    <Clock size={12} />
                    {formatDate(node.verifiedAt || node.submittedAt)}
                  </div>
                </div>

                <div className="svd-evidence-markdown">
                  {node.submissionText && (
                    <ReactMarkdown components={{ a: MarkdownLinkRender }}>
                      {node.submissionText}
                    </ReactMarkdown>
                  )}
                  {node.evidenceUrl && (
                     <div style={{marginTop: '10px'}}>
                        <a href={node.evidenceUrl} target="_blank" rel="noopener noreferrer" className="svd-skill-block__link-chip svd-skill-block__link-chip--portfolio" style={{display: 'inline-flex'}}>
                          <ExternalLink size={14} /> Xem tệp đính kèm
                        </a>
                     </div>
                  )}
                </div>

                {node.mentorFeedback && (
                  <div className="svd-mentor-feedback">
                    <MessageSquare size={16} className="svd-mentor-feedback-icon" />
                    <div className="svd-mentor-feedback-content">
                      <h4>Nhận xét của Mentor</h4>
                      <p>{node.mentorFeedback}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Final Assessment */}
      {data.finalAssessment && (
        <div className="svd-final-assessment">
          <h3>
            <Award size={20} />
            Bài thi cuối khóa (Final Assessment)
          </h3>
          <div className="svd-evidence-markdown">
            {data.finalAssessment.submissionText && (
              <ReactMarkdown components={{ a: MarkdownLinkRender }}>
                {data.finalAssessment.submissionText}
              </ReactMarkdown>
            )}
            {data.finalAssessment.evidenceUrl && (
              <div style={{marginTop: '10px'}}>
                <a href={data.finalAssessment.evidenceUrl} target="_blank" rel="noopener noreferrer" className="svd-skill-block__link-chip svd-skill-block__link-chip--portfolio" style={{display: 'inline-flex'}}>
                  <ExternalLink size={14} /> Xem tệp đính kèm
                </a>
              </div>
            )}
          </div>
          {data.finalAssessment.feedback && (
            <div className="svd-mentor-feedback" style={{ marginTop: '1rem' }}>
              <MessageSquare size={16} className="svd-mentor-feedback-icon" />
              <div className="svd-mentor-feedback-content">
                <h4>Tổng kết từ Mentor</h4>
                <p>{data.finalAssessment.feedback}</p>
              </div>
            </div>
          )}
          {data.gateCompletionNote && (
            <div className="svd-skill-block__review-note" style={{ marginTop: '1rem', borderRadius: '8px' }}>
              <p className="svd-skill-block__review-note-label">
                <CheckCircle2 size={13} />
                Đánh giá Gate cuối
              </p>
              <p className="svd-skill-block__review-note-text">
                {data.gateCompletionNote}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};


// ── Main page ─────────────────────────────────────────────────────────────────

const SkillVerificationDetailPage: React.FC = () => {
  const { mentorId, userId, skillName } = useParams<{
    mentorId?: string;
    userId?: string;
    skillName: string;
  }>();
  const navigate = useNavigate();

  // Detect context: student or mentor
  // Mentor context is when `mentorId` is present in the route.
  const isStudentContext = !!userId && !mentorId;
  const targetId = mentorId || userId;

  const decodedSkill = skillName ? decodeURIComponent(skillName) : null;

  const [adminVerifications, setAdminVerifications] = useState<MentorVerificationResponse[]>([]);
  const [journeyVerification, setJourneyVerification] = useState<JourneyVerificationDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'journey' | 'admin'>(isStudentContext ? 'journey' : 'admin');

  const [ownerProfile, setOwnerProfile] = useState<{ name: string; avatar?: string } | null>(null);

  useEffect(() => {
    if (!targetId || !decodedSkill) return;

    const load = async () => {
      try {
        setLoading(true);

        // 1. Fetch Admin Verifications (independently, don't let failure block journey)
        let adminData: MentorVerificationResponse[] = [];
        try {
          if (isStudentContext) {
            const studentData = await getPublicStudentVerifiedSkillDetails(Number(targetId));
            adminData = (studentData || []).map((s: StudentVerificationResponse) => ({
              id: s.id,
              mentorId: s.userId,
              mentorName: s.userName,
              mentorEmail: s.userEmail,
              mentorAvatarUrl: s.userAvatarUrl,
              skillName: s.skillName,
              status: s.status,
              githubUrl: s.githubUrl,
              portfolioUrl: s.portfolioUrl,
              additionalNotes: s.additionalNotes,
              reviewNote: s.reviewNote,
              reviewedById: s.reviewedById,
              reviewedByName: s.reviewedByName,
              requestedAt: s.requestedAt,
              reviewedAt: s.reviewedAt,
              evidences: s.evidences,
            }));
          } else {
            adminData = await getPublicMentorVerifiedSkillDetails(Number(targetId));
          }
        } catch (e) {
          console.warn("Admin verification data not available:", e);
        }

        const filteredAdmin = adminData.filter(
          (v) => v.skillName.toLowerCase() === decodedSkill.toLowerCase()
        );
        setAdminVerifications(filteredAdmin);

        // 2. Fetch Journey Verification (Only for Student context)
        let journeyFound = false;
        if (isStudentContext) {
          try {
            // Try portfolio verified-skill-details first (has journeyId)
            const allVerifiedSkills = await portfolioService.getPublicVerifiedSkillDetails(Number(targetId));
            console.log("All verified skills from portfolio:", allVerifiedSkills);

            const matchedSkill = (allVerifiedSkills || []).find(
              (s) => s.skillName.toLowerCase() === decodedSkill.toLowerCase() && s.journeyId
            );
            console.log("Matched skill with journeyId:", matchedSkill);

            if (matchedSkill && matchedSkill.journeyId) {
              const jDetails = await portfolioService.getPublicJourneyVerificationDetails(matchedSkill.journeyId);
              console.log("Journey verification details:", jDetails);
              setJourneyVerification(jDetails);
              journeyFound = true;
            }
          } catch (e) {
            console.error("Failed to load journey details:", e);
          }
        }

        // 3. Fetch owner profile info
        try {
          const profile = await portfolioService.getPublicProfile(Number(targetId));
          if (profile && profile.fullName) {
            setOwnerProfile({
              name: profile.fullName,
              avatar: profile.basicAvatarUrl || profile.portfolioAvatarUrl,
            });
          } else {
             // Fallback: If admin verifications have user info, use that
            if (filteredAdmin.length > 0) {
              setOwnerProfile({
                name: filteredAdmin[0].mentorName,
                avatar: filteredAdmin[0].mentorAvatarUrl,
              });
            } else if (isStudentContext && journeyVerification) {
               // We don't have the student name in journeyVerification directly (it has mentor name)
               // but we can at least keep "Học viên" or what we found earlier.
            }
          }
        } catch (e) {
          console.warn("Public profile not found, using fallbacks");
          // Fallback: If admin verifications have user info, use that
          if (filteredAdmin.length > 0) {
            setOwnerProfile({
              name: filteredAdmin[0].mentorName,
              avatar: filteredAdmin[0].mentorAvatarUrl,
            });
          }
        }

        // Set default tab based on what's available and context
        if (isStudentContext) {
          if (journeyFound) {
            setActiveTab('journey');
          } else if (filteredAdmin.length > 0) {
            setActiveTab('admin');
          }
        } else {
          setActiveTab('admin');
        }

      } catch {
        setError("Không thể tải thông tin xác thực. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [targetId, decodedSkill, isStudentContext]);

  // Determine Owner Info
  const ownerName = ownerProfile?.name || (isStudentContext ? "Học viên" : "Mentor");
  const ownerAvatar = ownerProfile?.avatar;

  const hasData = journeyVerification !== null || adminVerifications.length > 0;

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
            {ownerAvatar ? (
              <img
                src={ownerAvatar}
                alt={ownerName}
                className="svd-page__mentor-avatar"
              />
            ) : (
              <div className="svd-page__mentor-avatar-placeholder">
                <User size={28} />
              </div>
            )}
            <div>
              <p className="svd-page__mentor-label">
                Hồ sơ xác thực kỹ năng của {isStudentContext ? "học viên" : "mentor"}
              </p>
              <h1 className="svd-page__mentor-name">{ownerName}</h1>
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
            {isStudentContext 
              ? "Chi tiết quá trình học tập và bằng chứng năng lực đã được xác thực."
              : "Tất cả bằng chứng dưới đây đã được ban quản trị xem xét và xác thực chuyên môn."}
          </p>
        </div>
      </div>

      {/* ── Tabs ── */}
      {!loading && !error && hasData && isStudentContext && (
        <div className="svd-tabs">
           {journeyVerification && (
             <button 
                className={`svd-tab-btn ${activeTab === 'journey' ? 'active' : ''}`}
                onClick={() => setActiveTab('journey')}
             >
                <Map size={16}/> Hành trình xác thực (Journey)
             </button>
           )}
           {adminVerifications.length > 0 && (
             <button 
                className={`svd-tab-btn ${activeTab === 'admin' ? 'active' : ''}`}
                onClick={() => setActiveTab('admin')}
             >
                <ShieldCheck size={16}/> Đánh giá bởi Admin
             </button>
           )}
        </div>
      )}

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

        {!loading && !error && !hasData && (
          <div className="svd-page__empty">
            <ShieldCheck size={40} />
            <p>Không tìm thấy thông tin xác thực cho kỹ năng này.</p>
          </div>
        )}

        {!loading && !error && hasData && (
          <>
            {activeTab === 'journey' && journeyVerification && (
               <JourneyVerificationBlock data={journeyVerification} />
            )}

            {activeTab === 'admin' && adminVerifications.length > 0 && (
               <div className="svd-page__verifications">
                 {adminVerifications.map((v) => (
                   <AdminVerificationBlock key={v.id} verification={v} />
                 ))}
               </div>
            )}
          </>
        )}

        {/* Verified timestamp footer */}
        {!loading && activeTab === 'admin' && adminVerifications.length > 0 && adminVerifications[0].reviewedAt && (
            <div className="svd-page__footer-note">
              <CheckCircle2 size={14} />
              <span>
                Thông tin này được xác thực lần cuối vào{" "}
                <strong>{formatDate(adminVerifications[0].reviewedAt)}</strong> bởi
                đội ngũ Admin.
              </span>
            </div>
        )}
        {!loading && activeTab === 'journey' && journeyVerification && journeyVerification.completedAt && (
            <div className="svd-page__footer-note" style={{ background: 'rgba(168, 85, 247, 0.07)', borderColor: 'rgba(168, 85, 247, 0.25)', color: '#d8b4fe' }}>
              <CheckCircle2 size={14} />
              <span>
                Hành trình này được hoàn thành và xác thực vào{" "}
                <strong>{formatDate(journeyVerification.completedAt)}</strong> bởi
                Mentor {journeyVerification.mentorName}.
              </span>
            </div>
        )}
      </div>
    </div>
  );
};

export default SkillVerificationDetailPage;
