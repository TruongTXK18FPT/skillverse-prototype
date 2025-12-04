import React from 'react';
import { Check, Award, GraduationCap, Crown, Gem, Wallet } from 'lucide-react';
import { PremiumPlan, UserSubscriptionResponse } from '../../data/premiumDTOs';
import { UserProfileResponse } from '../../data/userDTOs';
import { WalletResponse } from '../../data/walletDTOs';
import './rank-styles.css';

// Import avatar frames directly here or pass them as props. 
// Since we want to encapsulate, let's accept them as props or import if they are static assets.
// Assuming they are passed as props for flexibility.

interface RankCardProps {
  plan: PremiumPlan;
  isActive: boolean;
  currentSub: UserSubscriptionResponse | null;
  onUpgrade: (planName: string) => void;
  onWalletPayment: (planName: string) => void;
  processing: boolean;
  isAuthenticated: boolean;
  walletData: WalletResponse | null;
  userProfile: UserProfileResponse | null;
  frameImage: string | null;
  fallbackAvatarUrl?: string;
  onViewInvoice?: () => void;
  onCancelAutoRenew?: () => void;
  onCancelSubscription?: () => void;
}

const RankCard: React.FC<RankCardProps> = ({
  plan,
  isActive,
  currentSub,
  onUpgrade,
  onWalletPayment,
  processing,
  isAuthenticated,
  walletData,
  userProfile,
  frameImage,
  fallbackAvatarUrl,
  onViewInvoice,
  onCancelAutoRenew,
  onCancelSubscription
}) => {
  
  const getTierClass = (planType: string) => {
    switch (planType) {
      case 'FREE_TIER': return 'hall-rank-bronze';
      case 'STUDENT_PACK': return 'hall-rank-silver';
      case 'PREMIUM_BASIC': return 'hall-rank-gold';
      case 'PREMIUM_PLUS': return 'hall-rank-diamond';
      default: return '';
    }
  };

  const getTierIcon = (planType: string) => {
    switch (planType) {
      case 'FREE_TIER': return Award;
      case 'STUDENT_PACK': return GraduationCap;
      case 'PREMIUM_BASIC': return Crown;
      case 'PREMIUM_PLUS': return Gem;
      default: return Award;
    }
  };

  const getTierBadge = (planType: string) => {
    switch (planType) {
      case 'FREE_TIER': return 'HỌC VIÊN';
      case 'STUDENT_PACK': return 'HỌC GIẢ';
      case 'PREMIUM_BASIC': return 'SĨ QUAN';
      case 'PREMIUM_PLUS': return 'CHỈ HUY';
      default: return 'KHÔNG XÁC ĐỊNH';
    }
  };

  const getOriginalName = (planType: string) => {
    switch (planType) {
      case 'FREE_TIER': return 'Miễn phí';
      case 'STUDENT_PACK': return 'Gói Sinh Viên';
      case 'PREMIUM_BASIC': return 'Kỹ Năng+';
      case 'PREMIUM_PLUS': return 'Cố Vấn Pro';
      default: return plan.displayName;
    }
  };

  const formatPrice = (price: string) => {
    const num = parseFloat(price);
    return num.toLocaleString('vi-VN');
  };

  const parseFeatures = (featuresString: string): string[] => {
    try {
      return JSON.parse(featuresString);
    } catch {
      return featuresString.split(',').map(f => f.trim());
    }
  };

  const IconComponent = getTierIcon(plan.planType);
  const tierClass = getTierClass(plan.planType);
  const features = parseFeatures(plan.features);
  const isFreeTier = plan.planType === 'FREE_TIER';

  return (
        <div className={`hall-rank-card ${tierClass} ${isActive ? 'active' : ''}`}>
      {plan.planType === 'STUDENT_PACK' && (
        <div className="hall-tag hall-tag-student">STUDENT</div>
      )}
      {plan.planType === 'PREMIUM_BASIC' && (
        <div className="hall-tag hall-tag-popular">POPULAR</div>
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
              <div className="hall-avatar-img" style={{ background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconComponent size={40} color="#fff" />
              </div>
            );
          })()}
          {frameImage && (
            <img 
              src={frameImage} 
              alt="Rank Frame" 
              className="hall-frame-img"
            />
          )}
        </div>
      </div>

      {/* Middle: Info */}
      <div className="hall-card-body">
        <div className="hall-rank-badge">
          {getTierBadge(plan.planType)}
        </div>
        <div className="hall-rank-name-original">
          {getOriginalName(plan.planType)}
        </div>
        
        <p className="hall-description">{plan.description}</p>
        
        <div className="hall-price">
          {formatPrice(plan.price)}
          <div className="hall-currency">VND</div>
        </div>
        <div className="hall-period">
          MỖI {plan.durationMonths > 120 ? '1' : plan.durationMonths} CHU KỲ{plan.durationMonths > 1 && plan.durationMonths <= 120 ? '' : ''}
        </div>

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
        {!isFreeTier && (
          isActive ? (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button className="hall-btn" disabled>
                CẤP ĐỘ HIỆN TẠI
              </button>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
                {onViewInvoice && (
                  <button 
                    onClick={onViewInvoice} 
                    className="hall-btn"
                    style={{ fontSize: '0.8rem', padding: '8px', opacity: 0.9 }}
                  >
                    Xem Hóa Đơn
                  </button>
                )}
                
                {currentSub?.autoRenew && onCancelAutoRenew && (
                  <button 
                    onClick={onCancelAutoRenew} 
                    className="hall-btn"
                    style={{ fontSize: '0.8rem', padding: '8px', opacity: 0.9 }}
                  >
                    Hủy Tự Động Gia Hạn
                  </button>
                )}
                
                {onCancelSubscription && (
                  <button 
                    onClick={onCancelSubscription} 
                    className="hall-btn"
                    style={{ fontSize: '0.8rem', padding: '8px', borderColor: '#ef4444', color: '#ef4444' }}
                  >
                    Hủy Đăng Ký
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
              {isAuthenticated && walletData ? (
                <>
                  <button 
                    className="hall-btn"
                    onClick={() => onWalletPayment(plan.name)}
                    disabled={processing}
                  >
                    <Wallet size={16} style={{ marginRight: '8px', verticalAlign: 'text-bottom' }} />
                    THANH TOÁN VÍ
                  </button>
                  <button 
                    className="hall-btn"
                    onClick={() => onUpgrade(plan.name)}
                    disabled={processing}
                    style={{ opacity: 0.8, fontSize: '0.8rem' }}
                  >
                    CỔNG THANH TOÁN NGOÀI
                  </button>
                </>
              ) : (
                <button 
                  className="hall-btn"
                  onClick={() => onUpgrade(plan.name)}
                  disabled={processing}
                >
                  {!isAuthenticated ? 'ĐĂNG NHẬP ĐỂ TRUY CẬP' : 'XÁC NHẬN NÂNG CẤP'}
                </button>
              )}
            </div>
          )
        )}
        
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
