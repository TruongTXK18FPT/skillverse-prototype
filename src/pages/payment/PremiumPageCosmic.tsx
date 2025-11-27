import { useState, useEffect } from 'react';
import { 
  Crown, Check, Star, Wallet, ArrowRight, Zap, Bot, 
  Users, Shield, Sparkles, Rocket, Award, GraduationCap, Gem, XCircle, RefreshCw, FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/PremiumPageCosmic.css';
import MeowGuide from '../../components/MeowlGuide';
import { premiumService } from '../../services/premiumService';
import { paymentService } from '../../services/paymentService';
import walletService from '../../services/walletService';
import userService from '../../services/userService';
import { PremiumPlan, CreateSubscriptionRequest, UserSubscriptionResponse } from '../../data/premiumDTOs';
import { CreatePaymentRequest } from '../../data/paymentDTOs';
import { WalletResponse } from '../../data/walletDTOs';
import { UserProfileResponse } from '../../data/userDTOs';
import WalletPaymentModal from '../../components/premium/WalletPaymentModal';
import CancelSubscriptionModal from '../../components/premium/CancelSubscriptionModal';
import CancelAutoRenewalModal from '../../components/premium/CancelAutoRenewalModal';
import { PremiumInvoice, useInvoice } from '../../components/invoice';

// Import avatar frames
import silverAvatar from '../../assets/premium/silver_avatar.png';
import goldenAvatar from '../../assets/premium/golden_avatar.png';
import diamondAvatar from '../../assets/premium/diamond_avatar.png';

const PremiumPageCosmic = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [premiumPlans, setPremiumPlans] = useState<PremiumPlan[]>([]);
  const [processing, setProcessing] = useState(false);
  const [currentSub, setCurrentSub] = useState<UserSubscriptionResponse | null>(null);
  const [hasActive, setHasActive] = useState<boolean>(false);
  const [walletData, setWalletData] = useState<WalletResponse | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileResponse | null>(null);
  const [showWalletConfirm, setShowWalletConfirm] = useState(false);
  const [selectedPlanForWallet, setSelectedPlanForWallet] = useState<PremiumPlan | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showCancelAutoRenewalModal, setShowCancelAutoRenewalModal] = useState(false);
  
  // Invoice hook
  const { showInvoice, invoiceData, openInvoice, closeInvoice } = useInvoice();

  const userEmail = user?.email || '';
  const isStudentEligible = Boolean(userEmail && (userEmail.includes('.edu') || userEmail.includes('@university') || userEmail.includes('@student')));

  useEffect(() => {
    loadPremiumPlans();
    
    if (isAuthenticated) {
      loadCurrentSubscription();
      loadWalletData();
      loadUserProfile();
    }
  }, [isAuthenticated]);

  const loadPremiumPlans = async () => {
    try {
      const plans = await premiumService.getPremiumPlans();
      setPremiumPlans(plans);
    } catch (error) {
      console.error('Failed to load premium plans:', error);
    }
  };

  const loadCurrentSubscription = async () => {
    try {
      const active = await premiumService.checkPremiumStatus();
      setHasActive(active);
      if (active) {
        return premiumService.getCurrentSubscription()
          .then(setCurrentSub)
          .catch(() => setCurrentSub(null));
      }
      return Promise.resolve();
    } catch (error) {
      console.error('Failed to load current subscription:', error);
    }
  };

  const loadWalletData = async () => {
    try {
      const data = await walletService.getMyWallet();
      setWalletData(data);
    } catch (error) {
      console.error('Failed to load wallet:', error);
    }
  };

  const loadUserProfile = async () => {
    try {
      const profile = await userService.getMyProfile();
      setUserProfile(profile);
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  };

  const handleUpgrade = async (planName: string) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    if (processing) return;
    if (hasActive && currentSub && currentSub.status === 'ACTIVE') {
      const isFree = currentSub.plan.planType === 'FREE_TIER';
      if (!isFree) return;
    }
    
    try {
      setProcessing(true);
      
      const selectedPlan = premiumPlans.find(plan => plan.name === planName);
      if (!selectedPlan) {
        console.error('Plan not found:', planName);
        return;
      }

      const successUrl = `${window.location.origin}/payment/transactional`;
      const cancelUrl = `${window.location.origin}/payment/transactional?cancel=1`;
      
      const subscriptionRequest: CreateSubscriptionRequest = {
        planId: selectedPlan.id,
        paymentMethod: 'PAYOS',
        applyStudentDiscount: isStudentEligible,
        autoRenew: false,
        successUrl,
        cancelUrl
      };

      const subscription = await premiumService.createSubscription(subscriptionRequest);

      const metadata = JSON.stringify({
        subscriptionId: subscription.id,
        planId: selectedPlan.id
      });

      const paymentRequest: CreatePaymentRequest = {
        amount: selectedPlan.price,
        currency: 'VND',
        type: 'PREMIUM_SUBSCRIPTION',
        paymentMethod: 'PAYOS',
        description: selectedPlan.displayName,
        planId: selectedPlan.id,
        metadata,
        successUrl,
        cancelUrl
      };

      const payment = await paymentService.createPayment(paymentRequest);

      if (payment.checkoutUrl) {
        window.location.href = payment.checkoutUrl;
      } else {
        console.error('No checkout URL received from payment service');
      }

    } catch (error) {
      console.error('Failed to create payment:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleWalletPayment = (planName: string) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    const selectedPlan = premiumPlans.find(p => p.name === planName);
    if (!selectedPlan) return;
    
    setSelectedPlanForWallet(selectedPlan);
    setShowWalletConfirm(true);
  };

  const confirmWalletPayment = async () => {
    if (!selectedPlanForWallet) return;
    
    try {
      await premiumService.purchaseWithWallet(
        selectedPlanForWallet.id,
        isStudentEligible
      );
      
      // Reload wallet data after successful purchase
      await loadWalletData();
      await loadCurrentSubscription();
    } catch (error: any) {
      // Extract error message from response
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Thanh toán thất bại. Vui lòng thử lại.';
      throw new Error(errorMessage);
    }
  };

  const getTierClass = (planType: string) => {
    switch (planType) {
      case 'FREE_TIER':
        return 'cosmic-tier-card--bronze';
      case 'STUDENT_PACK':
        return 'cosmic-tier-card--silver';
      case 'PREMIUM_BASIC':
        return 'cosmic-tier-card--gold';
      case 'PREMIUM_PLUS':
        return 'cosmic-tier-card--diamond';
      default:
        return '';
    }
  };

  const getTierIcon = (planType: string) => {
    switch (planType) {
      case 'FREE_TIER':
        return Award;
      case 'STUDENT_PACK':
        return GraduationCap;
      case 'PREMIUM_BASIC':
        return Crown;
      case 'PREMIUM_PLUS':
        return Gem;
      default:
        return Award;
    }
  };

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

  const getTierBadge = (planType: string) => {
    switch (planType) {
      case 'FREE_TIER':
        return '🥉 Bronze Tier';
      case 'STUDENT_PACK':
        return '🥈 Silver Tier';
      case 'PREMIUM_BASIC':
        return '🥇 Gold Tier';
      case 'PREMIUM_PLUS':
        return '💎 Diamond Tier';
      default:
        return '';
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

  return (
    <div className="cosmic-premium-page">
      {/* Hero Section */}
      <section className="cosmic-premium-hero">
        <div className="cosmic-premium-hero__badge">
          <Crown size={24} />
          <span>SkillVerse Premium Galaxy</span>
        </div>
        <h1 className="cosmic-premium-hero__title">
          Nâng tầm sự nghiệp<br />với Premium
        </h1>
        <p className="cosmic-premium-hero__subtitle">
          Khám phá vũ trụ tri thức với các gói Premium được thiết kế riêng cho từng hành trình phát triển của bạn
        </p>
        <div className="cosmic-premium-hero__stats">
          <div className="cosmic-stat-item">
            <div className="cosmic-stat-number">10K+</div>
            <div className="cosmic-stat-label">Thành viên</div>
          </div>
          <div className="cosmic-stat-item">
            <div className="cosmic-stat-number">95%</div>
            <div className="cosmic-stat-label">Hài lòng</div>
          </div>
          <div className="cosmic-stat-item">
            <div className="cosmic-stat-number">3x</div>
            <div className="cosmic-stat-label">Tốc độ học</div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="cosmic-pricing-section">
        <div className="cosmic-section-header">
          <h2 className="cosmic-section-title">Chọn gói phù hợp với bạn</h2>
          <p className="cosmic-section-subtitle">
            Mỗi tier mang đến trải nghiệm độc đáo trong hành trình chinh phục tri thức
          </p>
        </div>

        <div className="cosmic-pricing-grid">
          {premiumPlans.map((plan) => (
            <div
              key={plan.id}
              className={`cosmic-tier-card ${getTierClass(plan.planType)}`}
            >
              {plan.planType === 'PREMIUM_BASIC' && (
                <div className="cosmic-tier-popular">
                  <Star size={16} fill="currentColor" />
                  <span>Phổ biến nhất</span>
                </div>
              )}

              <div className="cosmic-tier-icon-wrapper">
                {(() => {
                  const IconComponent = getTierIcon(plan.planType);
                  const frameImage = getTierFrame(plan.planType);
                  
                  return (
                    <>
                      {userProfile?.avatarMediaUrl ? (
                        <img 
                          src={userProfile.avatarMediaUrl} 
                          alt="User Avatar" 
                          className="cosmic-tier-user-avatar"
                        />
                      ) : (
                        <IconComponent size={64} className="cosmic-tier-icon" />
                      )}
                      {frameImage && (
                        <img 
                          src={frameImage} 
                          alt="Frame" 
                          className="cosmic-tier-frame"
                        />
                      )}
                    </>
                  );
                })()}
              </div>

              <div className="cosmic-tier-header">
                <div className="cosmic-tier-badge">
                  {getTierBadge(plan.planType)}
                </div>
                <h3 className="cosmic-tier-name">{plan.displayName}</h3>
              </div>

              <p className="cosmic-tier-description">{plan.description}</p>

              <div className="cosmic-tier-price">
                <span className="cosmic-price-amount">
                  {formatPrice(plan.price)}
                </span>
                <span className="cosmic-price-currency">₫</span>
                <span className="cosmic-price-period">
                  /{plan.durationMonths} tháng
                </span>
                {plan.planType === 'STUDENT_PACK' && (
                  <div className="cosmic-student-badge">
                    🎓 Dành cho sinh viên
                  </div>
                )}
              </div>

              <ul className="cosmic-tier-features">
                {parseFeatures(plan.features).map((feature, idx) => (
                  <li key={idx} className="cosmic-feature-item">
                    <Check size={20} className="cosmic-feature-check" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {plan.planType !== 'FREE_TIER' && (
                hasActive ? (
                  <button
                    className="cosmic-tier-button cosmic-tier-button--disabled"
                    disabled
                  >
                    Đang hoạt động đến{' '}
                    {currentSub ? new Date(currentSub.endDate).toLocaleDateString('vi-VN') : ''}
                  </button>
                ) : (
                  <div className="cosmic-tier-actions">
                    {isAuthenticated && walletData ? (
                      <>
                        <button
                          className="cosmic-tier-button cosmic-tier-button--wallet"
                          onClick={() => handleWalletPayment(plan.name)}
                          disabled={processing}
                        >
                          <Wallet size={20} />
                          Thanh toán bằng ví
                        </button>
                        <button
                          className="cosmic-tier-button cosmic-tier-button--payos"
                          onClick={() => handleUpgrade(plan.name)}
                          disabled={processing}
                        >
                          Thanh toán qua PayOS
                        </button>
                      </>
                    ) : (
                      <button 
                        className="cosmic-tier-button cosmic-tier-button--primary"
                        onClick={() => handleUpgrade(plan.name)}
                        disabled={processing}
                      >
                        {!isAuthenticated ? 'Đăng nhập để nâng cấp' : 'Nâng cấp ngay'}
                        <ArrowRight size={20} />
                      </button>
                    )}
                  </div>
                )
              )}

              {hasActive && currentSub && currentSub.status === 'ACTIVE' && (
                <div className="cosmic-active-note">
                  <div className="cosmic-subscription-info">
                    <div>
                      Gói của bạn đang hoạt động đến{' '}
                      <strong>{new Date(currentSub.endDate).toLocaleDateString('vi-VN')}</strong>
                    </div>
                    {currentSub.plan.planType !== 'FREE_TIER' && (
                      <div className="cosmic-auto-renewal-status">
                        {currentSub.autoRenew ? (
                          <span className="auto-renewal-badge auto-renewal-enabled">
                            <RefreshCw size={14} />
                            Gia hạn tự động: Bật
                          </span>
                        ) : (
                          <span className="auto-renewal-badge auto-renewal-disabled">
                            <XCircle size={14} />
                            Gia hạn tự động: Tắt
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  {currentSub.plan.planType !== 'FREE_TIER' && (
                    <div className="cosmic-subscription-actions">
                      <button
                        className="cosmic-view-invoice-btn"
                        onClick={() => openInvoice(
                          currentSub,
                          userProfile?.fullName || user?.fullName || 'Khách hàng',
                          userProfile?.email || user?.email || '',
                          userProfile?.id
                        )}
                      >
                        <FileText size={18} />
                        Xem hóa đơn
                      </button>
                      {currentSub.autoRenew && (
                        <button
                          className="cosmic-cancel-auto-renewal-btn"
                          onClick={() => setShowCancelAutoRenewalModal(true)}
                        >
                          <RefreshCw size={18} />
                          Hủy thanh toán tự động
                        </button>
                      )}
                      <button
                        className="cosmic-cancel-subscription-btn"
                        onClick={() => setShowCancelModal(true)}
                      >
                        <XCircle size={18} />
                        Hủy gói & hoàn tiền
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Features Showcase */}
      <section className="cosmic-features-showcase">
        <div className="cosmic-section-header">
          <h2 className="cosmic-section-title">Tính năng nổi bật</h2>
          <p className="cosmic-section-subtitle">
            Trải nghiệm học tập đỉnh cao với công nghệ AI tiên tiến
          </p>
        </div>

        <div className="cosmic-features-grid">
          <div className="cosmic-feature-card">
            <div className="cosmic-feature-icon">
              <Bot size={32} />
            </div>
            <h3 className="cosmic-feature-title">AI Coach cá nhân</h3>
            <p className="cosmic-feature-text">
              Trợ lý AI thông minh phân tích điểm mạnh, điểm yếu và đề xuất lộ trình học tập phù hợp
            </p>
          </div>

          <div className="cosmic-feature-card">
            <div className="cosmic-feature-icon">
              <Users size={32} />
            </div>
            <h3 className="cosmic-feature-title">Mentor 1:1</h3>
            <p className="cosmic-feature-text">
              Kết nối với các chuyên gia hàng đầu để được hướng dẫn trực tiếp và giải đáp thắc mắc
            </p>
          </div>

          <div className="cosmic-feature-card">
            <div className="cosmic-feature-icon">
              <Shield size={32} />
            </div>
            <h3 className="cosmic-feature-title">Chứng chỉ uy tín</h3>
            <p className="cosmic-feature-text">
              Nhận chứng chỉ được công nhận bởi các doanh nghiệp hàng đầu trong ngành
            </p>
          </div>

          <div className="cosmic-feature-card">
            <div className="cosmic-feature-icon">
              <Sparkles size={32} />
            </div>
            <h3 className="cosmic-feature-title">Nội dung độc quyền</h3>
            <p className="cosmic-feature-text">
              Truy cập không giới hạn vào thư viện khóa học premium và tài liệu chuyên sâu
            </p>
          </div>

          <div className="cosmic-feature-card">
            <div className="cosmic-feature-icon">
              <Zap size={32} />
            </div>
            <h3 className="cosmic-feature-title">Học tập tối ưu</h3>
            <p className="cosmic-feature-text">
              Công nghệ học thích ứng giúp bạn tiếp thu kiến thức nhanh hơn 3 lần
            </p>
          </div>

          <div className="cosmic-feature-card">
            <div className="cosmic-feature-icon">
              <Rocket size={32} />
            </div>
            <h3 className="cosmic-feature-title">Career Boost</h3>
            <p className="cosmic-feature-text">
              Hỗ trợ tìm việc với portfolio showcase và kết nối với nhà tuyển dụng
            </p>
          </div>
        </div>
      </section>

      {/* MeowGuide positioned at bottom right */}
      <div className="cosmic-meowl-container">
        <MeowGuide currentPage="upgrade" />
      </div>

      {/* Cancel Auto-Renewal Modal */}
      <CancelAutoRenewalModal
        isOpen={showCancelAutoRenewalModal}
        onClose={() => setShowCancelAutoRenewalModal(false)}
        subscription={currentSub}
        onSuccess={async () => {
          await loadCurrentSubscription();
        }}
      />

      {/* Cancel Subscription Modal */}
      <CancelSubscriptionModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        subscription={currentSub}
        onSuccess={async () => {
          await loadCurrentSubscription();
          await loadWalletData();
        }}
      />

      {/* Wallet Payment Modal */}
      {selectedPlanForWallet && walletData && (
        <WalletPaymentModal
          isOpen={showWalletConfirm}
          onClose={() => {
            setShowWalletConfirm(false);
            setSelectedPlanForWallet(null);
          }}
          planName={selectedPlanForWallet.displayName}
          planPrice={(() => {
            const basePrice = parseFloat(selectedPlanForWallet.price);
            if (isStudentEligible && selectedPlanForWallet.studentDiscountPercent) {
              const discount = parseFloat(selectedPlanForWallet.studentDiscountPercent);
              return basePrice * (1 - discount / 100);
            }
            return basePrice;
          })()}
          walletBalance={walletData.cashBalance}
          isStudentPrice={isStudentEligible}
          onConfirm={confirmWalletPayment}
        />
      )}

      {/* Invoice Modal */}
      {showInvoice && invoiceData && (
        <PremiumInvoice data={invoiceData} onClose={closeInvoice} />
      )}
    </div>
  );
};

export default PremiumPageCosmic;
