import React, { useEffect, useMemo, useState } from "react";
import RankCard from "./RankCard";
import ClearanceHeader from "./ClearanceHeader";
import { PremiumPlan, UserSubscriptionResponse } from "../../data/premiumDTOs";
import { UserProfileResponse } from "../../data/userDTOs";
import { WalletResponse } from "../../data/walletDTOs";
import "./rank-styles.css";

// Import avatar frames
import silverAvatar from "../../assets/premium/silver_avatar.png";
import goldenAvatar from "../../assets/premium/golden_avatar.png";
import diamondAvatar from "../../assets/premium/diamond_avatar.png";

interface ClearanceLevelPageProps {
  premiumPlans: PremiumPlan[];
  currentSub: UserSubscriptionResponse | null;
  activePlanId?: number | null;
  activePlanName?: string | null;
  processing: boolean;
  isAuthenticated: boolean;
  walletData: WalletResponse | null;
  userProfile: UserProfileResponse | null;
  fallbackAvatarUrl?: string;
  onWalletPayment: (planName: string) => void;
  onPlanPreview?: (planName: string) => void;
  onViewInvoice?: (sub: UserSubscriptionResponse) => void;
  onEnableAutoRenew?: () => void;
  onCancelAutoRenew?: () => void;
  onCancelSubscription?: () => void;
  targetLabel?: string;
}

const GRACE_WINDOW_HOURS = 72;

const ClearanceLevelPage: React.FC<ClearanceLevelPageProps> = ({
  premiumPlans,
  currentSub,
  activePlanId,
  activePlanName,
  processing,
  isAuthenticated,
  walletData,
  userProfile,
  fallbackAvatarUrl,
  onWalletPayment,
  onPlanPreview,
  onViewInvoice,
  onEnableAutoRenew,
  onCancelAutoRenew,
  onCancelSubscription,
  targetLabel = "NÂNG CẤP",
}) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  const getTierFrame = (planType: string, planName?: string) => {
    switch (planType) {
      case "STUDENT_PACK":
        return silverAvatar;
      case "PREMIUM_BASIC":
        return goldenAvatar;
      case "PREMIUM_PLUS":
        return diamondAvatar;
      case "RECRUITER_PRO":
        // Use different frames for different recruiter tiers
        if (planName?.includes("enterprise")) return diamondAvatar;
        if (planName?.includes("business") || planName?.includes("plus"))
          return goldenAvatar;
        return silverAvatar;
      default:
        return null;
    }
  };

  const isCurrentPlan = (plan: PremiumPlan) => {
    if (activePlanId != null) {
      return plan.id === activePlanId;
    }

    if (activePlanName) {
      return (
        plan.displayName === activePlanName ||
        plan.name === activePlanName
      );
    }

    return false;
  };

  const graceWindowInfo = useMemo(() => {
    const currentPlan = currentSub?.plan;
    if (!currentSub?.startDate || !currentPlan || currentPlan.planType === "FREE_TIER") {
      return null;
    }

    const graceEndsAt = new Date(currentSub.startDate).getTime() + GRACE_WINDOW_HOURS * 60 * 60 * 1000;
    const remainingMs = Math.max(0, graceEndsAt - now);

    return {
      endsAt: graceEndsAt,
      remainingMs,
      isActive: remainingMs > 0,
      currentPlan,
    };
  }, [currentSub, now]);

  return (
    <div className="hall-container">
      <div className="hall-god-ray"></div>
      <div className="hall-particles">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="hall-particle"
            style={{
              left: `${Math.random() * 100}%`,
              animationDuration: `${10 + Math.random() * 20}s`,
              animationDelay: `${Math.random() * 5}s`,
              opacity: Math.random() * 0.5 + 0.2,
            }}
          />
        ))}
      </div>

      <div className="hall-content">
        <ClearanceHeader />

        <div className="hall-rank-grid">
          {premiumPlans.map((plan) => {
            const planIsCurrent = isCurrentPlan(plan);

            return (
              <RankCard
                key={plan.id}
                plan={plan}
                isCurrentPlan={planIsCurrent}
                currentSub={currentSub}
                onWalletPayment={onWalletPayment}
                onPlanPreview={onPlanPreview}
                processing={processing}
                isAuthenticated={isAuthenticated}
                walletData={walletData}
                userProfile={userProfile}
                frameImage={getTierFrame(plan.planType, plan.name)}
                fallbackAvatarUrl={fallbackAvatarUrl}
                onViewInvoice={
                  onViewInvoice && planIsCurrent && currentSub
                    ? () => onViewInvoice(currentSub)
                    : undefined
                }
                onEnableAutoRenew={planIsCurrent ? onEnableAutoRenew : undefined}
                onCancelAutoRenew={planIsCurrent ? onCancelAutoRenew : undefined}
                onCancelSubscription={planIsCurrent ? onCancelSubscription : undefined}
                targetLabel={targetLabel}
                graceWindowInfo={graceWindowInfo}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ClearanceLevelPage;
