import { useState, useEffect } from 'react';
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
import ClearanceLevelPage from '../../components/premium-hud/ClearanceLevelPage';

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

  const handleViewInvoice = (sub: UserSubscriptionResponse) => {
    openInvoice(
      sub,
      userProfile?.fullName || user?.fullName || 'Khách hàng',
      userProfile?.email || user?.email || '',
      userProfile?.id
    );
  };

  return (
    <div className="cosmic-premium-page">
      <ClearanceLevelPage 
        premiumPlans={premiumPlans}
        currentSub={currentSub}
        hasActive={hasActive}
        processing={processing}
        isAuthenticated={isAuthenticated}
        walletData={walletData}
        userProfile={userProfile}
        fallbackAvatarUrl={user?.avatarUrl}
        onUpgrade={handleUpgrade}
        onWalletPayment={handleWalletPayment}
        onViewInvoice={handleViewInvoice}
        onCancelAutoRenew={() => setShowCancelAutoRenewalModal(true)}
        onCancelSubscription={() => setShowCancelModal(true)}
      />

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

/* Old implementation preserved in git history */
/*
import { 
  Crown, Check, Star, Wallet, ArrowRight, Zap, Bot, 
  Users, Shield, Sparkles, Rocket, Award, GraduationCap, Gem, XCircle, RefreshCw, FileText
} from 'lucide-react';
// ... (rest of imports)
// Import avatar frames
import silverAvatar from '../../assets/premium/silver_avatar.png';
import goldenAvatar from '../../assets/premium/golden_avatar.png';
import diamondAvatar from '../../assets/premium/diamond_avatar.png';

// ... (rest of old code)
*/
