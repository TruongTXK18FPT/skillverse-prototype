import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  Globe,
  MapPin,
  Briefcase,
  Star,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Clock,
  Users,
  ExternalLink,
} from "lucide-react";
import userService from "../../services/userService";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../hooks/useToast";
import Toast from "../../components/shared/Toast";
import MeowlKuruLoader from "../../components/kuru-loader/MeowlKuruLoader";
import "./RecruiterPublicProfilePage.css";

interface PublicRecruiterProfile {
  id: number;
  companyName?: string;
  companyWebsite?: string;
  companyAddress?: string;
  businessAddress?: string;
  taxCodeOrBusinessRegistrationNumber?: string;
  companyDocumentsUrl?: string;
  documentFileUrls?: string[];
  applicationStatus?: string;
  companyDescription?: string;
  totalJobsPosted?: number;
  activeJobs?: number;
  rating?: number;
  joinedDate?: string;
  // From user profile
  fullName?: string;
  email?: string;
  avatarUrl?: string;
}

const RecruiterPublicProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast, isVisible, hideToast, showError } = useToast();

  const [profile, setProfile] = useState<PublicRecruiterProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const isOwnProfile = user?.id === Number(id);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!id) return;
      setLoading(true);
      setNotFound(false);
      try {
        const data = await userService.getUserProfile(Number(id)) as PublicRecruiterProfile;
        setProfile(data);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  const getCompanyInitials = () => {
    const name = profile?.companyName || profile?.fullName || "SV";
    return name
      .split(" ")
      .map((p) => p[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusConfig = (status?: string) => {
    switch (status) {
      case "APPROVED":
        return { color: "#10b981", bg: "rgba(16,185,129,0.12)", label: "Đã xác minh", icon: <CheckCircle size={14} /> };
      case "REJECTED":
        return { color: "#ef4444", bg: "rgba(239,68,68,0.12)", label: "Bị từ chối", icon: <AlertTriangle size={14} /> };
      default:
        return { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", label: "Chờ xác minh", icon: <Clock size={14} /> };
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="rpp-loading">
        <MeowlKuruLoader size="medium" text="" />
        <p className="rpp-loading__text">Đang tải hồ sơ công ty...</p>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="rpp-page">
        <div className="rpp-back">
          <button className="rpp-back__btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} />
            <span>Quay lại</span>
          </button>
        </div>
        <div className="rpp-not-found">
          <Building2 size={48} style={{ opacity: 0.3 }} />
          <h2>Không tìm thấy hồ sơ công ty</h2>
          <p>Hồ sơ này không tồn tại hoặc đã bị xóa.</p>
          <Link to="/jobs" className="rpp-btn rpp-btn--primary">
            <Briefcase size={16} />
            Xem công việc
          </Link>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(profile.applicationStatus);

  return (
    <div className="rpp-page">
      {/* Back */}
      <div className="rpp-back">
        <button className="rpp-back__btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} />
          <span>Quay lại</span>
        </button>
        {isOwnProfile && (
          <button
            className="rpp-btn rpp-btn--outline rpp-btn--sm"
            onClick={() => navigate("/profile/business")}
          >
            Chỉnh sửa hồ sơ
          </button>
        )}
      </div>

      {/* Hero */}
      <div className="rpp-hero">
        <div className="rpp-hero__inner">
          <div className="rpp-hero__header">
            <div className="rpp-hero__avatar">{getCompanyInitials()}</div>
            <div className="rpp-hero__info">
              <h1 className="rpp-hero__name">
                {profile.companyName || profile.fullName || "Công ty SkillVerse"}
              </h1>
              <div className="rpp-hero__meta">
                {profile.applicationStatus && (
                  <span
                    className="rpp-status-badge"
                    style={{
                      color: statusConfig.color,
                      background: statusConfig.bg,
                      borderColor: statusConfig.color + "40",
                    }}
                  >
                    {statusConfig.icon}
                    {statusConfig.label}
                  </span>
                )}
                {profile.companyAddress || profile.businessAddress ? (
                  <span className="rpp-hero__meta-item">
                    <MapPin size={12} />
                    {profile.companyAddress || profile.businessAddress}
                  </span>
                ) : null}
                {profile.joinedDate && (
                  <span className="rpp-hero__meta-item">
                    <Calendar size={12} />
                    Tham gia {formatDate(profile.joinedDate)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="rpp-hero__stats">
            {profile.totalJobsPosted !== undefined && (
              <div className="rpp-hero__stat">
                <Briefcase size={18} />
                <div>
                  <div className="rpp-hero__stat-value">{profile.totalJobsPosted}</div>
                  <div className="rpp-hero__stat-label">Công việc đã đăng</div>
                </div>
              </div>
            )}
            {profile.activeJobs !== undefined && (
              <div className="rpp-hero__stat">
                <CheckCircle size={18} />
                <div>
                  <div className="rpp-hero__stat-value">{profile.activeJobs}</div>
                  <div className="rpp-hero__stat-label">Đang tuyển</div>
                </div>
              </div>
            )}
            {profile.rating !== undefined && (
              <div className="rpp-hero__stat">
                <Star size={18} />
                <div>
                  <div className="rpp-hero__stat-value">{profile.rating.toFixed(1)}</div>
                  <div className="rpp-hero__stat-label">Đánh giá</div>
                </div>
              </div>
            )}
          </div>

          {/* Website */}
          {profile.companyWebsite && (
            <a
              href={profile.companyWebsite}
              target="_blank"
              rel="noreferrer"
              className="rpp-hero__website"
            >
              <Globe size={14} />
              {profile.companyWebsite.replace(/^https?:\/\//, "")}
              <ExternalLink size={12} />
            </a>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="rpp-content">
        {/* Main */}
        <div className="rpp-main">
          {/* Company Info */}
          <section className="rpp-section">
            <h2 className="rpp-section__title">
              <Building2 size={16} />
              Giới thiệu công ty
            </h2>
            <div className="rpp-section__body">
              {profile.companyDescription ? (
                <p className="rpp-description">{profile.companyDescription}</p>
              ) : (
                <p className="rpp-description rpp-description--muted">
                  Chưa có mô tả giới thiệu công ty.
                </p>
              )}
            </div>
          </section>

          {/* Company Details */}
          <section className="rpp-section">
            <h2 className="rpp-section__title">
              <Building2 size={16} />
              Thông tin doanh nghiệp
            </h2>
            <div className="rpp-info-grid">
              {profile.companyName && (
                <div className="rpp-info-item">
                  <div className="rpp-info-item__label">
                    <Building2 size={12} />
                    Tên doanh nghiệp
                  </div>
                  <div className="rpp-info-item__value">{profile.companyName}</div>
                </div>
              )}
              {profile.taxCodeOrBusinessRegistrationNumber && (
                <div className="rpp-info-item">
                  <div className="rpp-info-item__label">
                    <CheckCircle size={12} />
                    Mã số thuế / ĐKKD
                  </div>
                  <div className="rpp-info-item__value rpp-info-item__value--mono">
                    {profile.taxCodeOrBusinessRegistrationNumber}
                  </div>
                </div>
              )}
              {(profile.companyAddress || profile.businessAddress) && (
                <div className="rpp-info-item">
                  <div className="rpp-info-item__label">
                    <MapPin size={12} />
                    Địa chỉ
                  </div>
                  <div className="rpp-info-item__value">
                    {profile.companyAddress || profile.businessAddress}
                  </div>
                </div>
              )}
              {profile.companyWebsite && (
                <div className="rpp-info-item">
                  <div className="rpp-info-item__label">
                    <Globe size={12} />
                    Website
                  </div>
                  <div className="rpp-info-item__value">
                    <a
                      href={profile.companyWebsite}
                      target="_blank"
                      rel="noreferrer"
                      className="rpp-link"
                    >
                      {profile.companyWebsite.replace(/^https?:\/\//, "")}
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              )}
              {profile.email && (
                <div className="rpp-info-item">
                  <div className="rpp-info-item__label">
                    <Users size={12} />
                    Email liên hệ
                  </div>
                  <div className="rpp-info-item__value rpp-info-item__value--mono">
                    {profile.email}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Documents */}
          {profile.companyDocumentsUrl && (
            <section className="rpp-section">
              <h2 className="rpp-section__title">
                <CheckCircle size={16} />
                Tài liệu pháp lý
              </h2>
              <div className="rpp-section__body">
                <a
                  href={profile.companyDocumentsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rpp-document-link"
                >
                  <CheckCircle size={14} />
                  Xem tài liệu đăng ký kinh doanh
                  <ExternalLink size={12} />
                </a>
              </div>
            </section>
          )}
        </div>

        {/* Sidebar CTA */}
        <div className="rpp-sidebar">
          <div className="rpp-sidebar__card">
            <h3 className="rpp-sidebar__title">Công việc đang tuyển</h3>
            <Link to="/jobs" className="rpp-btn rpp-btn--primary rpp-btn--full">
              <Briefcase size={16} />
              Xem tất cả công việc
            </Link>
          </div>
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
