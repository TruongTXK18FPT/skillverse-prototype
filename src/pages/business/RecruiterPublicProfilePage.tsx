import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Globe,
  Mail,
  MapPin,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import businessService from "../../services/businessService";
import userService from "../../services/userService";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../hooks/useToast";
import Toast from "../../components/shared/Toast";
import MeowlKuruLoader from "../../components/kuru-loader/MeowlKuruLoader";
import "./RecruiterPublicProfilePage.css";

interface RawBusinessProfile {
  id?: number;
  userId?: number;
  email?: string;
  businessEmail?: string;
  companyName?: string;
  companyWebsite?: string;
  companyAddress?: string;
  businessAddress?: string;
  companyDescription?: string;
  taxId?: string;
  taxCodeOrBusinessRegistrationNumber?: string;
  companyDocumentsUrl?: string;
  documentFileUrls?: string[];
  applicationStatus?: string;
  rejectionReason?: string;
  approvalDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface RawUserPublicProfile {
  id?: number;
  userId?: number;
  email?: string;
  fullName?: string;
  companyName?: string;
  bio?: string;
  address?: string;
  region?: string;
  avatarMediaUrl?: string;
  avatarUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface PublicCompanyProfile {
  recruiterId: number;
  companyName: string;
  companyWebsite?: string;
  companyAddress?: string;
  companyDescription?: string;
  legalCode?: string;
  companyDocumentsUrl?: string;
  applicationStatus?: string;
  rejectionReason?: string;
  statusUpdatedAt?: string;
  joinedDate?: string;
  email?: string;
  fullName?: string;
  avatarUrl?: string;
}

const pickText = (...values: Array<string | undefined>) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
};

const normalizeWebsiteUrl = (url?: string) => {
  if (!url) {
    return undefined;
  }

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  return `https://${url}`;
};

const formatDate = (value?: string) => {
  if (!value) {
    return "Chưa cập nhật";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Chưa cập nhật";
  }

  return parsed.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const getCompanyInitials = (value: string) => {
  return value
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const buildPublicCompanyProfile = (
  recruiterId: number,
  businessProfile?: RawBusinessProfile | null,
  userProfile?: RawUserPublicProfile | null,
): PublicCompanyProfile => {
  const companyName =
    pickText(
      businessProfile?.companyName,
      userProfile?.companyName,
      userProfile?.fullName,
    ) || "Công ty SkillVerse";

  const companyWebsite = normalizeWebsiteUrl(
    pickText(businessProfile?.companyWebsite),
  );

  const companyAddress = pickText(
    businessProfile?.companyAddress,
    businessProfile?.businessAddress,
    userProfile?.address,
    userProfile?.region,
  );

  const companyDocumentsUrl = pickText(
    businessProfile?.companyDocumentsUrl,
    businessProfile?.documentFileUrls?.[0],
  );

  return {
    recruiterId,
    companyName,
    companyWebsite,
    companyAddress,
    companyDescription: pickText(
      businessProfile?.companyDescription,
      userProfile?.bio,
    ),
    legalCode: pickText(
      businessProfile?.taxCodeOrBusinessRegistrationNumber,
      businessProfile?.taxId,
    ),
    companyDocumentsUrl,
    applicationStatus: businessProfile?.applicationStatus,
    rejectionReason: businessProfile?.rejectionReason,
    statusUpdatedAt: pickText(
      businessProfile?.approvalDate,
      businessProfile?.updatedAt,
      userProfile?.updatedAt,
    ),
    joinedDate: pickText(userProfile?.createdAt, businessProfile?.createdAt),
    email: pickText(
      businessProfile?.email,
      businessProfile?.businessEmail,
      userProfile?.email,
    ),
    fullName: pickText(userProfile?.fullName),
    avatarUrl: pickText(userProfile?.avatarMediaUrl, userProfile?.avatarUrl),
  };
};

const RecruiterPublicProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast, isVisible, hideToast, showError } = useToast();

  const recruiterId = useMemo(() => Number(id), [id]);
  const isOwnProfile = user?.id === recruiterId;

  const [profile, setProfile] = useState<PublicCompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!Number.isFinite(recruiterId) || recruiterId <= 0) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setLoading(true);
      setNotFound(false);

      try {
        const [businessResult, userResult] = await Promise.allSettled([
          businessService.getBusinessProfile(recruiterId),
          userService.getUserProfile(recruiterId),
        ]);

        const businessData =
          businessResult.status === "fulfilled"
            ? (businessResult.value as RawBusinessProfile)
            : null;
        const userData =
          userResult.status === "fulfilled"
            ? (userResult.value as RawUserPublicProfile)
            : null;

        if (!businessData && !userData) {
          setNotFound(true);
          return;
        }

        const mergedProfile = buildPublicCompanyProfile(
          recruiterId,
          businessData,
          userData,
        );
        setProfile(mergedProfile);
      } catch {
        setNotFound(true);
        showError("Không thể tải hồ sơ", "Vui lòng thử lại sau ít phút.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [recruiterId, showError]);

  if (loading) {
    return (
      <div className="ncpub-loading-wrap">
        <MeowlKuruLoader size="medium" text="" />
        <p className="ncpub-loading-text">Đang đồng bộ hồ sơ công ty...</p>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="ncpub-page">
        <div className="ncpub-shell">
          <div className="ncpub-topbar">
            <button className="ncpub-back-btn" onClick={() => navigate(-1)}>
              <ArrowLeft size={16} />
              Quay lại
            </button>
          </div>
          <section className="ncpub-not-found-panel">
            <Building2 size={52} />
            <h1>Không tìm thấy hồ sơ công ty</h1>
            <p>
              Có thể doanh nghiệp chưa hoàn thành hồ sơ hoặc liên kết không còn
              hợp lệ.
            </p>
            <Link to="/jobs" className="ncpub-btn ncpub-btn--primary">
              <BriefcaseBusiness size={14} />
              Quay lại trang việc làm
            </Link>
          </section>
        </div>
      </div>
    );
  }

  const normalizedWebsite = normalizeWebsiteUrl(profile.companyWebsite);
  const websiteLabel = normalizedWebsite?.replace(/^https?:\/\//i, "");

  const statusTone =
    profile.applicationStatus === "APPROVED"
      ? "verified"
      : profile.applicationStatus === "REJECTED"
        ? "rejected"
        : "pending";

  const statusLabel =
    statusTone === "verified"
      ? "Đã xác minh"
      : statusTone === "rejected"
        ? "Hồ sơ bị từ chối"
        : "Đang chờ xác minh";

  return (
    <div className="ncpub-page">
      <div className="ncpub-tech-grid" aria-hidden="true" />

      <div className="ncpub-shell">
        <div className="ncpub-topbar">
          <button className="ncpub-back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} />
            Quay lại
          </button>

          {isOwnProfile && (
            <button
              className="ncpub-btn ncpub-btn--ghost"
              onClick={() => navigate("/profile/business")}
            >
              Chỉnh sửa hồ sơ
            </button>
          )}
        </div>

        <section className="ncpub-hero-panel">
          <div className="ncpub-hero-main">
            <div className="ncpub-avatar-frame">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.companyName}
                  className="ncpub-avatar-img"
                />
              ) : (
                <span className="ncpub-avatar-fallback">
                  {getCompanyInitials(profile.companyName)}
                </span>
              )}
            </div>

            <div className="ncpub-hero-copy">
              <p className="ncpub-kicker">Neon Tech Company Profile</p>
              <h1>{profile.companyName}</h1>
              <p className="ncpub-hero-description">
                {profile.companyDescription ||
                  "Doanh nghiệp chưa cập nhật mô tả chi tiết. Bạn có thể xem thông tin pháp lý và kênh liên hệ bên dưới."}
              </p>

              <div className="ncpub-meta-row">
                <span
                  className={`ncpub-status-pill ncpub-status-pill--${statusTone}`}
                >
                  {statusTone === "verified" ? (
                    <CheckCircle2 size={13} />
                  ) : statusTone === "rejected" ? (
                    <AlertTriangle size={13} />
                  ) : (
                    <Clock3 size={13} />
                  )}
                  {statusLabel}
                </span>

                {profile.companyAddress && (
                  <span className="ncpub-meta-chip">
                    <MapPin size={13} />
                    {profile.companyAddress}
                  </span>
                )}

                <span className="ncpub-meta-chip">
                  <ShieldCheck size={13} />
                  Tham gia {formatDate(profile.joinedDate)}
                </span>
              </div>
            </div>
          </div>

          <div className="ncpub-hero-actions">
            {normalizedWebsite && (
              <a
                href={normalizedWebsite}
                target="_blank"
                rel="noreferrer"
                className="ncpub-btn ncpub-btn--link"
              >
                <Globe size={14} />
                {websiteLabel}
                <ExternalLink size={12} />
              </a>
            )}
            <Link to="/jobs" className="ncpub-btn ncpub-btn--primary">
              <BriefcaseBusiness size={14} />
              Xem việc làm của SkillVerse
            </Link>
          </div>
        </section>

        <div className="ncpub-content-grid">
          <section className="ncpub-panel">
            <h2>Thông tin doanh nghiệp</h2>
            <div className="ncpub-info-grid">
              <article className="ncpub-info-card">
                <p className="ncpub-info-label">
                  <Building2 size={12} />
                  Tên doanh nghiệp
                </p>
                <p className="ncpub-info-value">{profile.companyName}</p>
              </article>

              <article className="ncpub-info-card">
                <p className="ncpub-info-label">
                  <ShieldCheck size={12} />
                  Mã số thuế / ĐKKD
                </p>
                <p className="ncpub-info-value ncpub-info-value--mono">
                  {profile.legalCode || "Chưa cập nhật"}
                </p>
              </article>

              <article className="ncpub-info-card">
                <p className="ncpub-info-label">
                  <MapPin size={12} />
                  Địa chỉ
                </p>
                <p className="ncpub-info-value">
                  {profile.companyAddress || "Chưa cập nhật"}
                </p>
              </article>

              <article className="ncpub-info-card">
                <p className="ncpub-info-label">
                  <Mail size={12} />
                  Email liên hệ
                </p>
                <p className="ncpub-info-value ncpub-info-value--mono">
                  {profile.email || "Chưa cập nhật"}
                </p>
              </article>
            </div>

          </section>

          <aside className="ncpub-side-stack">
            <section className="ncpub-panel ncpub-panel--compact">
              <h3>Trạng thái hồ sơ</h3>
              <p
                className={`ncpub-status-line ncpub-status-line--${statusTone}`}
              >
                {statusTone === "verified" ? (
                  <CheckCircle2 size={14} />
                ) : statusTone === "rejected" ? (
                  <AlertTriangle size={14} />
                ) : (
                  <Clock3 size={14} />
                )}
                {statusLabel}
              </p>
              <p className="ncpub-side-note">
                Cập nhật lần gần nhất: {formatDate(profile.statusUpdatedAt)}
              </p>
              {statusTone === "rejected" && profile.rejectionReason && (
                <div className="ncpub-warning-box">
                  {profile.rejectionReason}
                </div>
              )}
            </section>

            <section className="ncpub-panel ncpub-panel--compact">
              <h3>Đầu mối liên hệ</h3>
              <p className="ncpub-contact-row">
                <UserRound size={14} />
                {profile.fullName || "Đại diện doanh nghiệp"}
              </p>
              <p className="ncpub-contact-row">
                <Mail size={14} />
                {profile.email || "Chưa cập nhật"}
              </p>
            </section>
          </aside>
        </div>
      </div>

      {toast && (
        <Toast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          isVisible={isVisible}
          onClose={hideToast}
          autoCloseDelay={toast.autoCloseDelay}
          showCountdown={toast.showCountdown}
        />
      )}
    </div>
  );
};

export default RecruiterPublicProfilePage;
