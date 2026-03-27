import React from "react";
import {
  Check,
  Award,
  GraduationCap,
  Crown,
  Gem,
  Wallet,
  Rocket,
  Star,
  Sparkles,
  Info,
} from "lucide-react";
import { PremiumPlan, UserSubscriptionResponse } from "../../data/premiumDTOs";
import { UserProfileResponse } from "../../data/userDTOs";
import { WalletResponse } from "../../data/walletDTOs";
import "./rank-styles.css";

// Import avatar frames directly here or pass them as props.
// Since we want to encapsulate, let's accept them as props or import if they are static assets.
// Assuming they are passed as props for flexibility.

interface RankCardProps {
  plan: PremiumPlan;
  isCurrentPlan: boolean;
  currentSub: UserSubscriptionResponse | null;
  onWalletPayment: (planName: string) => void;
  onPlanPreview?: (planName: string) => void;
  processing: boolean;
  isAuthenticated: boolean;
  walletData: WalletResponse | null;
  userProfile: UserProfileResponse | null;
  frameImage: string | null;
  fallbackAvatarUrl?: string;
  onViewInvoice?: () => void;
  onEnableAutoRenew?: () => void;
  onCancelAutoRenew?: () => void;
  onCancelSubscription?: () => void;
  targetLabel?: string;
  graceWindowInfo?: {
    endsAt: number;
    remainingMs: number;
    isActive: boolean;
    currentPlan: PremiumPlan;
  } | null;
}

const RankCard: React.FC<RankCardProps> = ({
  plan,
  isCurrentPlan,
  currentSub,
  onWalletPayment,
  onPlanPreview,
  processing,
  isAuthenticated,
  walletData,
  userProfile,
  frameImage,
  fallbackAvatarUrl,
  onViewInvoice,
  onEnableAutoRenew,
  onCancelAutoRenew,
  onCancelSubscription,
  targetLabel,
  graceWindowInfo,
}) => {
  const getPlanUpgradeOrder = (planType: PremiumPlan["planType"]) => {
    switch (planType) {
      case "FREE_TIER":
        return 0;
      case "STUDENT_PACK":
        return 1;
      case "PREMIUM_BASIC":
        return 2;
      case "PREMIUM_PLUS":
        return 3;
      case "RECRUITER_PRO":
        return 100;
      default:
        return 0;
    }
  };

  const getTierClass = (planType: string) => {
    switch (planType) {
      case "FREE_TIER":
        return "hall-rank-bronze";
      case "STUDENT_PACK":
        return "hall-rank-silver";
      case "PREMIUM_BASIC":
        return "hall-rank-gold";
      case "PREMIUM_PLUS":
        return "hall-rank-diamond";
      case "RECRUITER_PRO":
        return getRecruiterTierClass(plan.name);
      default:
        return "";
    }
  };

  const getTierIcon = (planType: string) => {
    switch (planType) {
      case "FREE_TIER":
        return Award;
      case "STUDENT_PACK":
        return GraduationCap;
      case "PREMIUM_BASIC":
        return Crown;
      case "PREMIUM_PLUS":
        return Gem;
      case "RECRUITER_PRO":
        return getRecruiterTierIcon(plan.name);
      default:
        return Award;
    }
  };

  const getTierBadge = (planType: string) => {
    switch (planType) {
      case "FREE_TIER":
        return "MIỄN PHÍ";
      case "STUDENT_PACK":
        return "SINH VIÊN";
      case "PREMIUM_BASIC":
        return "CƠ BẢN";
      case "PREMIUM_PLUS":
        return "CHUYÊN GIA";
      case "RECRUITER_PRO":
        return getRecruiterBadge(plan.name);
      default:
        return plan.displayName?.toUpperCase() || "KHÔNG XÁC ĐỊNH";
    }
  };

  const getOriginalName = (planType: string) => {
    switch (planType) {
      case "FREE_TIER":
        return "Miễn phí";
      case "STUDENT_PACK":
        return "Gói Sinh Viên";
      case "PREMIUM_BASIC":
        return "Kỹ Năng+";
      case "PREMIUM_PLUS":
        return "Cố Vấn Pro";
      case "RECRUITER_PRO":
        return plan.displayName;
      default:
        return plan.displayName;
    }
  };

  const formatPrice = (price: string) => {
    const num = parseFloat(price);
    return num.toLocaleString("vi-VN");
  };

  const formatCountdown = (remainingMs: number) => {
    const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return [hours, minutes, seconds]
      .map((value) => String(value).padStart(2, "0"))
      .join(":");
  };

  const parseFeatures = (featuresString: string): string[] => {
    try {
      return JSON.parse(featuresString);
    } catch {
      return featuresString.split(",").map((f) => f.trim());
    }
  };

  // Helper functions for recruiter plan differentiation
  const getRecruiterTierClass = (name: string) => {
    if (name.includes("enterprise")) return "hall-rank-recruiter-enterprise";
    return "hall-rank-recruiter-business";
  };

  const getRecruiterTierIcon = (name: string) => {
    if (name.includes("enterprise")) return Crown;
    return Star;
  };

  const getRecruiterBadge = (name: string) => {
    if (name.includes("enterprise")) return "DOANH NGHIỆP";
    if (name.includes("plus")) return "NÂNG CAO";
    return "NHÀ TUYỂN DỤNG";
  };

  const IconComponent = getTierIcon(plan.planType);
  const tierClass = getTierClass(plan.planType);
  const features = parseFeatures(plan.features);
  const isFreeTier = plan.planType === "FREE_TIER";
  const currentPlanPrice = parseFloat(graceWindowInfo?.currentPlan.price ?? "0");
  const targetPlanPrice = parseFloat(plan.price);
  const currentPlanOrder = getPlanUpgradeOrder(graceWindowInfo?.currentPlan.planType ?? "FREE_TIER");
  const targetPlanOrder = getPlanUpgradeOrder(plan.planType);
  const isEligibleUpgradeTarget = Boolean(
    graceWindowInfo?.isActive &&
      !isCurrentPlan &&
      !isFreeTier &&
      (
        targetPlanOrder > currentPlanOrder ||
        (targetPlanOrder === currentPlanOrder && targetPlanPrice > currentPlanPrice)
      ),
  );
  const countdownLabel = graceWindowInfo?.isActive
    ? formatCountdown(graceWindowInfo.remainingMs)
    : null;
  const hasGraceWindowExpired = Boolean(
    isCurrentPlan && graceWindowInfo && !graceWindowInfo.isActive,
  );
  const graceHelpText = "72h được tính từ lúc mua gói hiện tại.";
  const scheduledChangePlan = isCurrentPlan ? currentSub?.scheduledChangePlan : null;
  const scheduledChangeEffectiveDate = isCurrentPlan
    ? currentSub?.scheduledChangeEffectiveDate
    : null;
  const scheduledChangeDateLabel = scheduledChangeEffectiveDate
    ? new Date(scheduledChangeEffectiveDate).toLocaleDateString("vi-VN")
    : null;
  const scheduledChangeAutoRenew = Boolean(
    isCurrentPlan && currentSub?.scheduledChangeAutoRenew,
  );
  const isScheduledTarget = Boolean(
    !isCurrentPlan &&
      currentSub?.scheduledChangePlan?.id &&
      currentSub.scheduledChangePlan.id === plan.id,
  );
  const autoRenewManagedAfterSwitch = Boolean(
    isCurrentPlan && scheduledChangePlan,
  );
  const effectiveAutoRenew = autoRenewManagedAfterSwitch
    ? scheduledChangeAutoRenew
    : Boolean(currentSub?.autoRenew);

  return (
    <div
      className={`hall-rank-card ${tierClass} ${isCurrentPlan ? "active" : ""}`}
    >
      {plan.planType === "STUDENT_PACK" && (
        <div className="hall-tag hall-tag-student">SINH VIÊN</div>
      )}
      {plan.planType === "PREMIUM_BASIC" && (
        <div className="hall-tag hall-tag-popular">PHỔ BIẾN</div>
      )}
      {/* Light Beam Effect */}
      <div className="hall-light-beam"></div>

      {/* Top: Floating Avatar Frame */}
      <div className="hall-card-top">
        <div className="hall-aura"></div>
        <div className="hall-avatar-container">
          {(() => {
            const avatarSrc = userProfile?.avatarMediaUrl || fallbackAvatarUrl;
            if (avatarSrc) {
              return (
                <img
                  src={avatarSrc}
                  alt="User Avatar"
                  className="hall-avatar-img"
                />
              );
            }
            return (
              <div
                className="hall-avatar-img"
                style={{
                  background: "#334155",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconComponent size={40} color="#fff" />
              </div>
            );
          })()}
          {frameImage && (
            <img src={frameImage} alt="Rank Frame" className="hall-frame-img" />
          )}
        </div>
      </div>

      {/* Middle: Info */}
      <div className="hall-card-body">
        <div className="hall-rank-badge">{getTierBadge(plan.planType)}</div>
        <div className="hall-rank-name-original">
          {getOriginalName(plan.planType)}
        </div>

        <p className="hall-description">{plan.description}</p>

        <div className="hall-price">
          {parseFloat(plan.price) === 0 ? "Miễn phí" : formatPrice(plan.price)}
          {parseFloat(plan.price) > 0 && (
            <div className="hall-currency">VND</div>
          )}
        </div>
        <div className="hall-period">
          {parseFloat(plan.price) > 0 &&
            (plan.durationMonths > 120
              ? "Vĩnh viễn"
              : plan.durationMonths === 1
                ? "/ tháng"
                : `/ ${plan.durationMonths} tháng`)}
        </div>

        {isScheduledTarget && scheduledChangeDateLabel && (
          <div className="hall-plan-badge-inline hall-plan-badge-inline--scheduled">
            <Wallet size={12} aria-hidden="true" />
            <span>Đã lên lịch từ {scheduledChangeDateLabel}</span>
          </div>
        )}

        {isCurrentPlan && graceWindowInfo?.isActive && countdownLabel && (
          <div className="hall-upgrade-window hall-upgrade-window--current">
            <div className="hall-upgrade-window__badge">
              <Sparkles size={12} aria-hidden="true" />
              <span>Thời gian giữ ưu đãi</span>
            </div>
            <div className="hall-upgrade-window__header">
              <Rocket size={14} aria-hidden="true" />
              <span>Bạn còn {countdownLabel}</span>
              <span
                className="hall-upgrade-window__help"
                title={graceHelpText}
                aria-label={graceHelpText}
              >
                <Info size={13} aria-hidden="true" />
              </span>
            </div>
            <p className="hall-upgrade-window__text">
              Đây là thời gian còn lại để bạn nâng lên gói cao hơn và vẫn được giảm trừ.
            </p>
          </div>
        )}

        {isEligibleUpgradeTarget && (
          <div className="hall-upgrade-window hall-upgrade-window--target">
            <div className="hall-upgrade-window__badge hall-upgrade-window__badge--target">
              <Sparkles size={12} aria-hidden="true" />
              <span>Giữ giảm trừ khi nâng cấp</span>
            </div>
            <p className="hall-upgrade-window__text">
              Nâng cấp gói này để được giảm trừ từ gói hiện tại.
            </p>
          </div>
        )}

        {hasGraceWindowExpired && (
          <div className="hall-upgrade-window hall-upgrade-window--expired">
            <div className="hall-upgrade-window__header">
              <Info size={14} aria-hidden="true" />
              <span>Ưu đãi nâng cấp đã kết thúc</span>
            </div>
            <p className="hall-upgrade-window__text">
              Nâng cấp sau thời điểm này sẽ tính theo chính sách hiện tại của gói.
            </p>
          </div>
        )}

        {scheduledChangePlan && scheduledChangeDateLabel && (
          <div className="hall-plan-status-line">
            <Info size={13} aria-hidden="true" />
            <span>
              Sắp chuyển gói từ {scheduledChangeDateLabel}
              {scheduledChangeAutoRenew ? " • Tự gia hạn bật" : ""}
            </span>
          </div>
        )}

        {/* Features */}
        <div className="hall-features">
          {features.map((feature, idx) => (
            <div key={idx} className="hall-feature-item">
              <div className="hall-feature-icon-wrapper">
                <Check size={10} className="hall-feature-icon" />
              </div>
              <span>{feature}</span>
            </div>
          ))}
        </div>

        {/* Action Button */}
        {!isFreeTier &&
          (isCurrentPlan ? (
            <div
              style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <button className="hall-btn" disabled>
                CẤP ĐỘ HIỆN TẠI
              </button>

              <div
                className="hall-current-plan-actions"
              >
                {onViewInvoice && (
                  <button
                    onClick={onViewInvoice}
                    className="hall-btn"
                    style={{ fontSize: "0.8rem", padding: "8px", opacity: 0.9 }}
                  >
                    Xem Hóa Đơn
                  </button>
                )}

                {effectiveAutoRenew && onCancelAutoRenew && (
                  <button
                    onClick={onCancelAutoRenew}
                    className="hall-btn hall-btn-autorenew hall-btn-autorenew--enabled"
                    style={{ fontSize: "0.8rem", padding: "8px", opacity: 0.95 }}
                  >
                    {autoRenewManagedAfterSwitch
                      ? "TỰ GIA HẠN SAU KHI CHUYỂN"
                      : "ĐANG BẬT TỰ ĐỘNG GIA HẠN"}
                  </button>
                )}

                {!effectiveAutoRenew && onEnableAutoRenew && (
                  <button
                    onClick={onEnableAutoRenew}
                    className="hall-btn hall-btn-autorenew hall-btn-autorenew--disabled"
                    style={{ fontSize: "0.8rem", padding: "8px", opacity: 0.95 }}
                  >
                    {autoRenewManagedAfterSwitch
                      ? "BẬT TỰ GIA HẠN SAU KHI CHUYỂN"
                      : "BẬT TỰ ĐỘNG GIA HẠN"}
                  </button>
                )}

                {onCancelSubscription && (
                  <button
                    onClick={onCancelSubscription}
                    className="hall-btn"
                    style={{
                      fontSize: "0.8rem",
                      padding: "8px",
                      borderColor: "#ef4444",
                      color: "#ef4444",
                    }}
                  >
                    Hủy Đăng Ký
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                width: "100%",
              }}
            >
              {isAuthenticated && walletData ? (
                <button
                  className="hall-btn"
                  onClick={() => onWalletPayment(plan.name)}
                  onMouseEnter={() => onPlanPreview?.(plan.name)}
                  onFocus={() => onPlanPreview?.(plan.name)}
                  disabled={processing || isScheduledTarget}
                >
                  <Wallet
                    size={16}
                    style={{
                      marginRight: "8px",
                      verticalAlign: "text-bottom",
                    }}
                  />
                  {isScheduledTarget
                    ? "ĐÃ LÊN LỊCH"
                    : targetLabel ? `${targetLabel} (VÍ)` : "THANH TOÁN VÍ"}
                </button>
              ) : (
                <button
                  className="hall-btn"
                  onClick={() => onWalletPayment(plan.name)}
                  disabled={processing || isScheduledTarget}
                >
                  {isScheduledTarget
                    ? "ĐÃ LÊN LỊCH"
                    : !isAuthenticated
                    ? "ĐĂNG NHẬP ĐỂ TRUY CẬP"
                    : targetLabel || "XÁC NHẬN NÂNG CẤP"}
                </button>
              )}
            </div>
          ))}

        {isFreeTier && (
          <button className="hall-btn" disabled style={{ opacity: 0.5 }}>
            TIÊU CHUẨN
          </button>
        )}
      </div>
    </div>
  );
};

export default RankCard;
