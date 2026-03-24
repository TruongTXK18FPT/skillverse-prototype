import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "../../styles/PremiumPageCosmic.css";
import MeowGuide from "../../components/meowl/MeowlGuide";
import { premiumService } from "../../services/premiumService";
import { paymentService } from "../../services/paymentService";
import walletService from "../../services/walletService";
import userService from "../../services/userService";
import {
  PremiumPlan,
  CreateSubscriptionRequest,
  UserSubscriptionResponse,
} from "../../data/premiumDTOs";
import { CreatePaymentRequest } from "../../data/paymentDTOs";
import { WalletResponse } from "../../data/walletDTOs";
import { UserProfileResponse } from "../../data/userDTOs";
import WalletPaymentModal from "../../components/premium/WalletPaymentModal";
import CancelSubscriptionModal from "../../components/premium/CancelSubscriptionModal";
import CancelAutoRenewalModal from "../../components/premium/CancelAutoRenewalModal";
import { PremiumInvoice, useInvoice } from "../../components/invoice";
import ClearanceLevelPage from "../../components/premium-hud/ClearanceLevelPage";
import PremiumFAQ from "../../components/premium-hud/PremiumFAQ";
import parentService, { StudentDetail } from "../../services/parentService";
import { showAppInfo } from "../../context/ToastContext";

const PremiumPageCosmic = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [premiumPlans, setPremiumPlans] = useState<PremiumPlan[]>([]);

  const roles = (user?.roles || []).map((role) => String(role).toUpperCase());
  const isParent = roles.includes("PARENT");

  const [students, setStudents] = useState<StudentDetail[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(
    location.state?.forStudent || null,
  );

  const [processing, setProcessing] = useState(false);
  const [currentSub, setCurrentSub] = useState<UserSubscriptionResponse | null>(
    null,
  );
  const [hasActive, setHasActive] = useState<boolean>(false);
  const [walletData, setWalletData] = useState<WalletResponse | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileResponse | null>(
    null,
  );
  const [showWalletConfirm, setShowWalletConfirm] = useState(false);
  const [selectedPlanForWallet, setSelectedPlanForWallet] =
    useState<PremiumPlan | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showCancelAutoRenewalModal, setShowCancelAutoRenewalModal] =
    useState(false);

  // Invoice hook
  const { showInvoice, invoiceData, openInvoice, closeInvoice } = useInvoice();

  const userEmail = user?.email || "";
  const isStudentEligible = Boolean(
    userEmail &&
    (userEmail.includes(".edu") ||
      userEmail.includes("@university") ||
      userEmail.includes("@student")),
  );

  useEffect(() => {
    loadPremiumPlans();

    if (isAuthenticated) {
      loadCurrentSubscription();
      loadWalletData();
      loadUserProfile();

      if (isParent) {
        loadStudents();
      }
    }
  }, [isAuthenticated, isParent, user]);

  const loadStudents = async () => {
    try {
      const dashboard = await parentService.getDashboard();
      setStudents(dashboard.students);
      // If forStudent was passed, ensure it's valid
      if (location.state?.forStudent) {
        const exists = dashboard.students.find(
          (s) => s.id === location.state.forStudent,
        );
        if (exists) setSelectedStudentId(exists.id);
      }
    } catch (error) {
      console.error("Failed to load students", error);
    }
  };

  const loadPremiumPlans = async () => {
    try {
      const plans = await premiumService.getPremiumPlans(true);
      setPremiumPlans(plans);
    } catch (error) {
      console.error("Failed to load premium plans:", error);
    }
  };

  const loadCurrentSubscription = async () => {
    try {
      const active = await premiumService.checkPremiumStatus();
      setHasActive(active);
      if (active) {
        return premiumService
          .getCurrentSubscription()
          .then(setCurrentSub)
          .catch(() => setCurrentSub(null));
      }
      return Promise.resolve();
    } catch (error) {
      console.error("Failed to load current subscription:", error);
    }
  };

  const loadWalletData = async () => {
    try {
      const data = await walletService.getMyWallet();
      setWalletData(data);
    } catch (error) {
      console.error("Failed to load wallet:", error);
    }
  };

  const loadUserProfile = async () => {
    try {
      const profile = await userService.getMyProfile();
      setUserProfile(profile);
    } catch (error) {
      console.error("Failed to load user profile:", error);
    }
  };

  const handleUpgrade = async (planName: string) => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (selectedStudentId) {
      const s = students.find((st) => st.id === selectedStudentId);
      // Check if student has premium (assuming 'Free' or null means no premium)
      // Adjust logic based on actual plan names from backend
      if (
        s?.progress?.premiumPlan &&
        !s.progress.premiumPlan.toLowerCase().includes("free")
      ) {
        showAppInfo(
          "Đã có Premium",
          `Tài khoản ${s.firstName} đã có gói Premium (${s.progress.premiumPlan}).`,
        );
        return;
      }
    }

    if (processing) return;
    if (hasActive && currentSub && currentSub.status === "ACTIVE") {
      const isFree = currentSub.plan.planType === "FREE_TIER";
      if (!isFree) return;
    }

    try {
      setProcessing(true);

      const selectedPlan = premiumPlans.find((plan) => plan.name === planName);
      if (!selectedPlan) {
        console.error("Plan not found:", planName);
        return;
      }

      const successUrl = `${window.location.origin}/payment/transactional`;
      const cancelUrl = `${window.location.origin}/payment/transactional?cancel=1`;

      const subscriptionRequest: CreateSubscriptionRequest = {
        planId: selectedPlan.id,
        paymentMethod: "PAYOS",
        applyStudentDiscount: isStudentEligible,
        autoRenew: false,
        successUrl,
        cancelUrl,
        targetUserId: selectedStudentId || undefined,
      };

      const subscription =
        await premiumService.createSubscription(subscriptionRequest);

      const metadata = JSON.stringify({
        subscriptionId: subscription.id,
        planId: selectedPlan.id,
      });

      const paymentRequest: CreatePaymentRequest = {
        amount: selectedPlan.price,
        currency: "VND",
        type: "PREMIUM_SUBSCRIPTION",
        paymentMethod: "PAYOS",
        description: selectedPlan.displayName,
        planId: selectedPlan.id,
        metadata,
        successUrl,
        cancelUrl,
      };

      const payment = await paymentService.createPayment(paymentRequest);

      if (payment.checkoutUrl) {
        window.location.href = payment.checkoutUrl;
      } else {
        console.error("No checkout URL received from payment service");
      }
    } catch (error) {
      console.error("Failed to create payment:", error);
    } finally {
      setProcessing(false);
    }
  };

  const handleWalletPayment = (planName: string) => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    const selectedPlan = premiumPlans.find((p) => p.name === planName);
    if (!selectedPlan) return;

    setSelectedPlanForWallet(selectedPlan);
    setShowWalletConfirm(true);
  };

  const confirmWalletPayment = async () => {
    if (!selectedPlanForWallet) return;

    try {
      await premiumService.purchaseWithWallet(
        selectedPlanForWallet.id,
        isStudentEligible,
        selectedStudentId || undefined,
      );

      // Reload wallet data after successful purchase
      await loadWalletData();
      await loadCurrentSubscription();

      // Reload students to refresh their premium status
      if (isParent) {
        await loadStudents();
      }
    } catch (error: any) {
      // Extract error message from response
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Thanh toán thất bại. Vui lòng thử lại.";
      throw new Error(errorMessage);
    }
  };

  const handleViewInvoice = (sub: UserSubscriptionResponse) => {
    openInvoice(
      sub,
      userProfile?.fullName || user?.fullName || "Khách hàng",
      userProfile?.email || user?.email || "",
      userProfile?.id,
    );
  };

  return (
    <div className="cosmic-premium-page">
      {isParent && (
        <div
          style={{
            background: "rgba(20, 20, 30, 0.9)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            padding: "1rem",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "1rem",
            position: "sticky",
            top: 0,
            zIndex: 100,
            backdropFilter: "blur(10px)",
          }}
        >
          <span style={{ color: "#cbd5e1" }}>Mua gói cho:</span>
          <select
            value={selectedStudentId || ""}
            onChange={(e) =>
              setSelectedStudentId(Number(e.target.value) || null)
            }
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "8px",
              background: "#1e293b",
              color: "white",
              border: "1px solid #475569",
              outline: "none",
            }}
          >
            <option value="">Chính tôi ({user.fullName})</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                Con: {s.firstName} {s.lastName}{" "}
                {s.progress?.premiumPlan && s.progress.premiumPlan !== "Free"
                  ? "(Đã có Premium)"
                  : ""}
              </option>
            ))}
          </select>
          {selectedStudentId &&
            (() => {
              const s = students.find((st) => st.id === selectedStudentId);
              if (
                s?.progress?.premiumPlan &&
                s.progress.premiumPlan !== "Free"
              ) {
                return (
                  <span style={{ color: "#ef4444", fontSize: "0.9rem" }}>
                    ⚠️ Tài khoản này đã có gói Premium. Không thể nâng cấp thêm.
                  </span>
                );
              }
              return null;
            })()}
        </div>
      )}
      <ClearanceLevelPage
        premiumPlans={premiumPlans}
        currentSub={currentSub}
        hasActive={
          selectedStudentId
            ? (() => {
                const s = students.find((st) => st.id === selectedStudentId);
                return !!(
                  s?.progress?.premiumPlan && s.progress.premiumPlan !== "Free"
                );
              })()
            : hasActive
        }
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
        targetLabel={selectedStudentId ? "MUA CHO CON" : "Mở Khóa Ngay"}
      />

      {/* FAQ Section */}
      <PremiumFAQ />
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
            if (
              isStudentEligible &&
              selectedPlanForWallet.studentDiscountPercent
            ) {
              const discount = parseFloat(
                selectedPlanForWallet.studentDiscountPercent,
              );
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
