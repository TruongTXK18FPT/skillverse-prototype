import React from 'react';
import RankCard from './RankCard';
import ClearanceHeader from './ClearanceHeader';
import { PremiumPlan, UserSubscriptionResponse } from '../../data/premiumDTOs';
import { UserProfileResponse } from '../../data/userDTOs';
import { WalletResponse } from '../../data/walletDTOs';
import './rank-styles.css';

// Import avatar frames
import silverAvatar from '../../assets/premium/silver_avatar.png';
import goldenAvatar from '../../assets/premium/golden_avatar.png';
import diamondAvatar from '../../assets/premium/diamond_avatar.png';

interface ClearanceLevelPageProps {
  premiumPlans: PremiumPlan[];
  currentSub: UserSubscriptionResponse | null;
  hasActive: boolean;
  processing: boolean;
  isAuthenticated: boolean;
  walletData: WalletResponse | null;
  userProfile: UserProfileResponse | null;
  fallbackAvatarUrl?: string;
  onUpgrade: (planName: string) => void;
  onWalletPayment: (planName: string) => void;
  onViewInvoice?: (sub: UserSubscriptionResponse) => void;
  onCancelAutoRenew?: () => void;
  onCancelSubscription?: () => void;
}

const ClearanceLevelPage: React.FC<ClearanceLevelPageProps> = ({
  premiumPlans,
  currentSub,
  hasActive,
  processing,
  isAuthenticated,
  walletData,
  userProfile,
  fallbackAvatarUrl,
  onUpgrade,
  onWalletPayment,
  onViewInvoice,
  onCancelAutoRenew,
  onCancelSubscription
}) => {

  const getTierFrame = (planType: string) => {
    switch (planType) {
      case 'STUDENT_PACK':
        return silverAvatar;
      case 'PREMIUM_BASIC':
        return goldenAvatar;
      case 'PREMIUM_PLUS':
        return diamondAvatar;
      default:
        return null;
    }
  };



  // We need to know if ANY plan is active to disable others if that's the logic
  // But usually upgrades are allowed.
  // The original code:
  // if (hasActive && currentSub && currentSub.status === 'ACTIVE') {
  //   const isFree = currentSub.plan.planType === 'FREE_TIER';
  //   if (!isFree) return; // Prevents handleUpgrade
  // }
  // And in render:
  // {plan.planType !== 'FREE_TIER' && ( hasActive ? ( <button disabled>... ) : ... )}
  // This suggests if you have Premium, ALL premium cards show "Active until...".
  // That's a bit weird UI, but I must preserve logic.
  // I will pass `hasActive` to RankCard and let it handle the "Active" state display based on that.
  
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
              opacity: Math.random() * 0.5 + 0.2
            }}
          />
        ))}
      </div>
      
      <div className="hall-content">
        <ClearanceHeader />

        <div className="hall-rank-grid">
          {premiumPlans.map((plan) => (
          <RankCard
            key={plan.id}
            plan={plan}
            isActive={hasActive}
            currentSub={currentSub}
            onUpgrade={onUpgrade}
            onWalletPayment={onWalletPayment}
            processing={processing}
            isAuthenticated={isAuthenticated}
            walletData={walletData}
            userProfile={userProfile}
            frameImage={getTierFrame(plan.planType)}
            fallbackAvatarUrl={fallbackAvatarUrl}
            onViewInvoice={onViewInvoice ? () => currentSub && onViewInvoice(currentSub) : undefined}
            onCancelAutoRenew={onCancelAutoRenew}
            onCancelSubscription={onCancelSubscription}
          />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ClearanceLevelPage;
