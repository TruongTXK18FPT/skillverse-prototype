import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Crown,
  Zap,
  Briefcase,
  Clock,
  ArrowUpRight,
  RefreshCw,
  Star,
  Shield,
  Sparkles,
  TrendingUp,
  Gem,
  Rocket,
  CheckCircle,
  AlertTriangle,
  Infinity,
} from "lucide-react";
import recruiterSubscriptionService, {
  RecruiterSubscriptionInfoResponse,
} from "../../services/recruiterSubscriptionService";
import { premiumService } from "../../services/premiumService";
import "./subscription-widget.css";

const SubscriptionWidget: React.FC = () => {
  const [info, setInfo] = useState<RecruiterSubscriptionInfoResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  const fetchSubscription = async () => {
    try {
      setLoading(true);

      // 1) Try recruiter-specific endpoint (includes quota data)
      let data = null;
      try {
        data = await recruiterSubscriptionService.getSubscriptionInfo();
      } catch (e) {
        console.log(
          "Recruiter subscription endpoint failed, trying general premium",
        );
      }

      if (data?.hasSubscription) {
        setInfo(data);
        return;
      }

      // 2) Fallback: check general premium subscription
      try {
        const generalSub = await premiumService.getCurrentSubscription();
        if (generalSub && generalSub.status === "ACTIVE") {
          const planName = generalSub.plan?.name || "";
          const planType = generalSub.plan?.planType || "";
          const isEnterprise =
            planName.toLowerCase().includes("enterprise") ||
            planType === "PREMIUM_PLUS";

          // Determine quota based on plan type
          let jobPostingLimit = 0;
          let jobPostingUnlimited = isEnterprise;

          if (planType === "PREMIUM_PLUS") {
            jobPostingLimit = 30;
            jobPostingUnlimited = false;
          } else if (planType === "PREMIUM_BASIC") {
            jobPostingLimit = 10;
            jobPostingUnlimited = false;
          }

          setInfo({
            hasSubscription: true,
            planName,
            planDisplayName:
              generalSub.plan?.displayName || generalSub.plan?.name || "",
            planPrice: parseFloat(generalSub.plan?.price || "0"),
            durationMonths: generalSub.plan?.durationMonths || 1,
            startDate: generalSub.startDate,
            endDate: generalSub.endDate,
            daysRemaining: generalSub.daysRemaining ?? 0,
            autoRenew: generalSub.autoRenew,
            // Quota based on plan type
            jobPostingLimit,
            jobPostingUsed: 0,
            jobPostingRemaining: jobPostingLimit,
            jobPostingUnlimited,
            jobPostingResetInfo: isEnterprise
              ? "Không giới hạn"
              : "Reset hàng tháng",
            shortTermJobPostingLimit: isEnterprise ? 50 : 10,
            shortTermJobPostingUsed: 0,
            shortTermJobPostingRemaining: isEnterprise ? 50 : 10,
            shortTermJobPostingUnlimited: isEnterprise,
            shortTermJobPostingResetInfo: isEnterprise
              ? "Không giới hạn"
              : "Reset hàng tháng",
            jobBoostLimit: isEnterprise ? 5 : 1,
            jobBoostUsed: 0,
            jobBoostRemaining: isEnterprise ? 5 : 1,
            jobBoostResetInfo: "Reset hàng tháng",
            // Features — based on plan type
            canHighlightJobs: planType !== "FREE_TIER",
            canUseAICandidateSuggestion: isEnterprise,
            hasPremiumCompanyProfile: planType !== "FREE_TIER",
            hasAnalyticsDashboard: isEnterprise,
            hasCandidateDatabaseAccess: false,
            hasAutomatedOutreach: false,
            hasApiAccess: false,
            hasPrioritySupport: isEnterprise,
          });
          return;
        }
      } catch (e) {
        console.log("General premium endpoint also failed:", e);
      }

      // No active subscription from either endpoint - return free tier info
      setInfo({
        hasSubscription: false,
        planName: "free_tier",
        planDisplayName: "Gói Miễn Phí",
        planPrice: 0,
        durationMonths: 0,
        startDate: "",
        endDate: "",
        daysRemaining: 0,
        autoRenew: false,
        jobPostingLimit: 0,
        jobPostingUsed: 0,
        jobPostingRemaining: 0,
        jobPostingUnlimited: false,
        jobPostingResetInfo: "",
        shortTermJobPostingLimit: 0,
        shortTermJobPostingUsed: 0,
        shortTermJobPostingRemaining: 0,
        shortTermJobPostingUnlimited: false,
        shortTermJobPostingResetInfo: "",
        jobBoostLimit: 0,
        jobBoostUsed: 0,
        jobBoostRemaining: 0,
        jobBoostResetInfo: "",
        canHighlightJobs: false,
        canUseAICandidateSuggestion: false,
        hasPremiumCompanyProfile: false,
        hasAnalyticsDashboard: false,
        hasCandidateDatabaseAccess: false,
        hasAutomatedOutreach: false,
        hasApiAccess: false,
        hasPrioritySupport: false,
      });
    } catch (e) {
      console.error("Error fetching subscription:", e);
      setInfo(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, []);

  if (loading) {
    return (
      <div className="rcr-sub-panel rcr-sub-panel--loading">
        <RefreshCw size={20} className="rcr-sub-spinner" />
        <span>Đang tải gói dịch vụ...</span>
      </div>
    );
  }

  // No subscription — show upgrade CTA
  if (!info?.hasSubscription) {
    return (
      <div className="rcr-sub-panel rcr-sub-panel--free">
        <div className="rcr-sub-panel__glow" />
        <div className="rcr-sub-free-header">
          <div className="rcr-sub-free-icon">
            <Crown size={28} />
          </div>
          <div className="rcr-sub-free-info">
            <h3 className="rcr-sub-free-title">Recruiter Free</h3>
            <p className="rcr-sub-free-desc">
              Đăng tin dài hạn: 50.000₫ · Ngắn hạn: 30.000₫ / tin. Nâng cấp
              Premium để miễn phí!
            </p>
          </div>
        </div>
        <div className="rcr-sub-free-perks">
          <div className="rcr-sub-free-perk">
            <Star size={14} />
            <span>Đăng tin không giới hạn với gói Premium</span>
          </div>
          <div className="rcr-sub-free-perk">
            <Sparkles size={14} />
            <span>Highlight tin tuyển dụng nổi bật</span>
          </div>
          <div className="rcr-sub-free-perk">
            <Shield size={14} />
            <span>AI gợi ý ứng viên phù hợp</span>
          </div>
        </div>
        <Link to="/premium" className="rcr-sub-upgrade-btn">
          <Crown size={16} />
          Nâng Cấp Premium
          <ArrowUpRight size={14} />
        </Link>
      </div>
    );
  }

  // Active subscription — show plan details & quota
  const isEnterprise = info.planName?.toLowerCase().includes("enterprise");
  const planTier = isEnterprise ? "enterprise" : "plus";

  const ftPercent = info.jobPostingUnlimited
    ? 100
    : info.jobPostingLimit > 0
      ? Math.round((info.jobPostingUsed / info.jobPostingLimit) * 100)
      : 0;
  const stPercent = info.shortTermJobPostingUnlimited
    ? 100
    : info.shortTermJobPostingLimit > 0
      ? Math.round(
          (info.shortTermJobPostingUsed / info.shortTermJobPostingLimit) * 100,
        )
      : 0;
  const boostPercent =
    info.jobBoostLimit > 0
      ? Math.round((info.jobBoostUsed / info.jobBoostLimit) * 100)
      : 0;

  const getQuotaStatus = (used: number, limit: number, unlimited: boolean) => {
    if (unlimited) return "unlimited";
    const pct = limit > 0 ? (used / limit) * 100 : 0;
    if (pct >= 100) return "exhausted";
    if (pct >= 80) return "warning";
    return "healthy";
  };

  const ftStatus = getQuotaStatus(
    info.jobPostingUsed,
    info.jobPostingLimit,
    info.jobPostingUnlimited,
  );
  const stStatus = getQuotaStatus(
    info.shortTermJobPostingUsed,
    info.shortTermJobPostingLimit,
    info.shortTermJobPostingUnlimited,
  );

  return (
    <div className={`rcr-sub-panel rcr-sub-panel--${planTier}`}>
      {/* Decorative glow line */}
      <div className="rcr-sub-panel__glow" />

      {/* ===== Plan Header ===== */}
      <div className="rcr-sub-header">
        <div
          className={`rcr-sub-header__icon rcr-sub-header__icon--${planTier}`}
        >
          {isEnterprise ? <Crown size={24} /> : <Gem size={24} />}
        </div>
        <div className="rcr-sub-header__info">
          <div className="rcr-sub-header__row">
            <h3 className="rcr-sub-header__plan">
              {info.planDisplayName || info.planName}
            </h3>
            <span className={`rcr-sub-badge rcr-sub-badge--${planTier}`}>
              {isEnterprise ? "ENTERPRISE" : "PREMIUM"}
            </span>
          </div>
          <div className="rcr-sub-header__meta">
            <Clock size={12} />
            <span>
              Còn <strong>{info.daysRemaining}</strong> ngày
            </span>
            <span className="rcr-sub-header__dot">·</span>
            <span>
              Hết hạn {new Date(info.endDate).toLocaleDateString("vi-VN")}
            </span>
          </div>
        </div>
        <Link to="/premium" className="rcr-sub-manage-link" title="Quản lý gói">
          <ArrowUpRight size={16} />
        </Link>
      </div>

      {/* ===== Quota Section ===== */}
      <div className="rcr-sub-quotas">
        <div className="rcr-sub-quotas__title">
          <Rocket size={14} />
          <span>Quota Đăng Tin</span>
        </div>

        {/* Full-time Job Quota */}
        <div className={`rcr-sub-quota rcr-sub-quota--${ftStatus}`}>
          <div className="rcr-sub-quota__header">
            <div className="rcr-sub-quota__label">
              <Briefcase size={15} />
              <span>Tin Dài Hạn (Full-time)</span>
            </div>
            <div className="rcr-sub-quota__value">
              {info.jobPostingUnlimited ? (
                <span className="rcr-sub-quota__unlimited">
                  <Infinity size={14} /> Không giới hạn
                </span>
              ) : (
                <span className="rcr-sub-quota__count">
                  <strong>{info.jobPostingRemaining}</strong>
                  <span className="rcr-sub-quota__total">
                    / {info.jobPostingLimit}
                  </span>
                </span>
              )}
            </div>
          </div>
          {!info.jobPostingUnlimited && (
            <>
              <div className="rcr-sub-quota__bar">
                <div
                  className={`rcr-sub-quota__fill rcr-sub-quota__fill--blue`}
                  style={{ width: `${Math.min(ftPercent, 100)}%` }}
                />
              </div>
              <div className="rcr-sub-quota__footer">
                {ftStatus === "exhausted" ? (
                  <span className="rcr-sub-quota__alert">
                    <AlertTriangle size={11} /> Đã hết lượt — chờ reset
                  </span>
                ) : (
                  <span className="rcr-sub-quota__hint">
                    <CheckCircle size={11} /> Miễn phí khi đăng (tiết kiệm
                    50.000₫/tin)
                  </span>
                )}
                {info.jobPostingResetInfo && (
                  <span className="rcr-sub-quota__reset">
                    {info.jobPostingResetInfo}
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        {/* Short-term Job Quota */}
        <div className={`rcr-sub-quota rcr-sub-quota--${stStatus}`}>
          <div className="rcr-sub-quota__header">
            <div className="rcr-sub-quota__label">
              <Zap size={15} />
              <span>Tin Ngắn Hạn (Gig)</span>
            </div>
            <div className="rcr-sub-quota__value">
              {info.shortTermJobPostingUnlimited ? (
                <span className="rcr-sub-quota__unlimited">
                  <Infinity size={14} /> Không giới hạn
                </span>
              ) : (
                <span className="rcr-sub-quota__count">
                  <strong>{info.shortTermJobPostingRemaining}</strong>
                  <span className="rcr-sub-quota__total">
                    / {info.shortTermJobPostingLimit}
                  </span>
                </span>
              )}
            </div>
          </div>
          {!info.shortTermJobPostingUnlimited && (
            <>
              <div className="rcr-sub-quota__bar">
                <div
                  className={`rcr-sub-quota__fill rcr-sub-quota__fill--amber`}
                  style={{ width: `${Math.min(stPercent, 100)}%` }}
                />
              </div>
              <div className="rcr-sub-quota__footer">
                {stStatus === "exhausted" ? (
                  <span className="rcr-sub-quota__alert">
                    <AlertTriangle size={11} /> Đã hết lượt — chờ reset
                  </span>
                ) : (
                  <span className="rcr-sub-quota__hint">
                    <CheckCircle size={11} /> Miễn phí khi đăng (tiết kiệm
                    30.000₫/tin)
                  </span>
                )}
                {info.shortTermJobPostingResetInfo && (
                  <span className="rcr-sub-quota__reset">
                    {info.shortTermJobPostingResetInfo}
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        {/* Job Boost Quota */}
        {info.jobBoostLimit > 0 && (
          <div className="rcr-sub-quota">
            <div className="rcr-sub-quota__header">
              <div className="rcr-sub-quota__label">
                <TrendingUp size={15} />
                <span>Boost Tin Tuyển Dụng</span>
              </div>
              <div className="rcr-sub-quota__value">
                <span className="rcr-sub-quota__count">
                  <strong>{info.jobBoostRemaining}</strong>
                  <span className="rcr-sub-quota__total">
                    / {info.jobBoostLimit}
                  </span>
                </span>
              </div>
            </div>
            <div className="rcr-sub-quota__bar">
              <div
                className="rcr-sub-quota__fill rcr-sub-quota__fill--green"
                style={{ width: `${Math.min(boostPercent, 100)}%` }}
              />
            </div>
            <div className="rcr-sub-quota__footer">
              <span className="rcr-sub-quota__hint">
                <Sparkles size={11} /> Đẩy tin lên đầu trang tuyển dụng
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ===== Premium Features ===== */}
      <div className="rcr-sub-features">
        {info.canHighlightJobs && (
          <span className={`rcr-sub-ftag rcr-sub-ftag--${planTier}`}>
            <Sparkles size={11} /> Highlight Tin
          </span>
        )}
        {info.canUseAICandidateSuggestion && (
          <span className={`rcr-sub-ftag rcr-sub-ftag--${planTier}`}>
            <Star size={11} /> AI Gợi Ý
          </span>
        )}
        {info.hasAnalyticsDashboard && (
          <span className={`rcr-sub-ftag rcr-sub-ftag--${planTier}`}>
            <TrendingUp size={11} /> Analytics
          </span>
        )}
        {info.hasPrioritySupport && (
          <span className={`rcr-sub-ftag rcr-sub-ftag--${planTier}`}>
            <Shield size={11} /> Hỗ Trợ 24/7
          </span>
        )}
      </div>
    </div>
  );
};

export default SubscriptionWidget;
