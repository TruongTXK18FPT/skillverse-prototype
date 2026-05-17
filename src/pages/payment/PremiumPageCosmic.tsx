import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "../../styles/PremiumPageCosmic.css";
import MeowGuide from "../../components/meowl/MeowlGuide";
import { premiumService } from "../../services/premiumService";
import walletService from "../../services/walletService";
import userService from "../../services/userService";
import studentVerifyService from "../../services/studentVerifyService";
import {
  PremiumPlan,
  SubscriptionCheckoutPreviewResponse,
  UserSubscriptionResponse,
} from "../../data/premiumDTOs";
import { WalletResponse } from "../../data/walletDTOs";
import { UserProfileResponse } from "../../data/userDTOs";
import WalletPaymentModal from "../../components/premium/WalletPaymentModal";
import CancelSubscriptionModal from "../../components/premium/CancelSubscriptionModal";
import CancellationLimitModal from "../../components/premium/CancellationLimitModal";
import CancelAutoRenewalModal from "../../components/premium/CancelAutoRenewalModal";
import EnableAutoRenewalModal from "../../components/premium/EnableAutoRenewalModal";
import LoginRequiredModal from "../../components/auth/LoginRequiredModal";
import { PremiumInvoice, useInvoice } from "../../components/invoice";
import ClearanceLevelPage from "../../components/premium-hud/ClearanceLevelPage";
import PremiumFAQ from "../../components/premium-hud/PremiumFAQ";
import { showAppInfo } from "../../context/ToastContext";

const PremiumPageCosmic = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [premiumPlans, setPremiumPlans] = useState<PremiumPlan[]>([]);

  const roles = (user?.roles || []).map((role) => String(role).toUpperCase());
  const isBusinessRole =
    roles.includes("RECRUITER") || roles.includes("BUSINESS");

  const [processing] = useState(false);
  const [currentSub, setCurrentSub] = useState<UserSubscriptionResponse | null>(
    null,
  );
  const [hasActive, setHasActive] = useState<boolean>(false);
  const [studentVerificationApproved, setStudentVerificationApproved] =
    useState(false);
  const [isCheckingStudentVerification, setIsCheckingStudentVerification] =
    useState(false);
  const [walletData, setWalletData] = useState<WalletResponse | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileResponse | null>(
    null,
  );
  const [showWalletConfirm, setShowWalletConfirm] = useState(false);
  const [selectedPlanForWallet, setSelectedPlanForWallet] =
    useState<PremiumPlan | null>(null);
  const [walletCheckoutPreview, setWalletCheckoutPreview] =
    useState<SubscriptionCheckoutPreviewResponse | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showCancellationLimitModal, setShowCancellationLimitModal] =
    useState(false);
  const [cancellationLimitMessage, setCancellationLimitMessage] = useState("");
  const [showEnableAutoRenewalModal, setShowEnableAutoRenewalModal] =
    useState(false);
  const [showCancelAutoRenewalModal, setShowCancelAutoRenewalModal] =
    useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const previewCacheRef = useRef<
    Map<string, SubscriptionCheckoutPreviewResponse>
  >(new Map());
  const previewInFlightRef = useRef<
    Map<string, Promise<SubscriptionCheckoutPreviewResponse | null>>
  >(new Map());

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
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!isAuthenticated || isBusinessRole) {
      setStudentVerificationApproved(false);
      return;
    }

    void loadStudentVerificationEligibility();
  }, [isAuthenticated, isBusinessRole, user?.id]);

  // [Nghiep vu] Frontend canh bao som trang thai xac thuc de chan thanh toan Student Pack truoc khi goi API mua.
  const loadStudentVerificationEligibility = async () => {
    setIsCheckingStudentVerification(true);

    try {
      const eligibility = await studentVerifyService.getEligibility();
      setStudentVerificationApproved(
        Boolean(eligibility.approved && eligibility.canBuyStudentPremium),
      );
    } catch (error) {
      console.error("Failed to check student verification eligibility:", error);
      setStudentVerificationApproved(false);
    } finally {
      setIsCheckingStudentVerification(false);
    }
  };

  // [Nghiep vu] Dieu huong user sang man hinh xac thuc ngay tai diem bi chan mua Student Pack.
  const handleOpenStudentVerification = () => {
    navigate("/student-verification", { state: { from: "/premium" } });
  };


  const loadPremiumPlans = async () => {
    try {
      const plans = await premiumService.getPremiumPlans(true);
      setPremiumPlans(plans);
    } catch (error) {
      console.error("Failed to load premium plans:", error);
    }
  };

  const applyCurrentSubscription = (
    subscription: UserSubscriptionResponse | null,
  ) => {
    setCurrentSub(subscription);

    const isActivePremium = Boolean(
      subscription &&
      subscription.isActive &&
      subscription.status === "ACTIVE" &&
      subscription.plan?.planType !== "FREE_TIER",
    );

    setHasActive(isActivePremium);
  };

  const loadCurrentSubscription = async () => {
    try {
      const subscription = await premiumService.getCurrentSubscription();
      applyCurrentSubscription(subscription);
    } catch (error) {
      console.error("Failed to load current subscription:", error);
      applyCurrentSubscription(null);
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

  const fetchCheckoutPreview = async (planName: string) => {
    const selectedPlan = premiumPlans.find((p) => p.name === planName);
    if (!selectedPlan) return null;

    const cacheKey = `${selectedPlan.id}:${isStudentEligible}:self`;
    const cachedPreview = previewCacheRef.current.get(cacheKey);
    if (cachedPreview) {
      return cachedPreview;
    }

    const pendingPreview = previewInFlightRef.current.get(cacheKey);
    if (pendingPreview) {
      return pendingPreview;
    }

    const request = premiumService
      .getCheckoutPreview(
        selectedPlan.id,
        isStudentEligible,
      )
      .then((preview) => {
        previewCacheRef.current.set(cacheKey, preview);
        previewInFlightRef.current.delete(cacheKey);
        return preview;
      })
      .catch((error) => {
        previewInFlightRef.current.delete(cacheKey);
        throw error;
      });

    previewInFlightRef.current.set(cacheKey, request);
    return request;
  };

  const handlePlanPreview = (planName: string) => {
    if (!isAuthenticated) return;

    void fetchCheckoutPreview(planName).catch((error) => {
      console.error("Failed to preload checkout preview:", error);
    });
  };

  const handleLoginRequired = () => {
    setShowLoginModal(true);
  };

  const handleWalletPayment = (planName: string) => {
    if (!isAuthenticated) {
      handleLoginRequired();
      return;
    }

    const selectedPlan = premiumPlans.find((p) => p.name === planName);
    if (!selectedPlan) return;

    if (selectedPlan.planType === "STUDENT_PACK") {
      if (isCheckingStudentVerification) {
        showAppInfo(
          "Đang kiểm tra xác thực",
          "Vui lòng chờ hệ thống cập nhật trạng thái xác thực sinh viên.",
        );
        return;
      }

      if (!studentVerificationApproved) {
        showAppInfo(
          "Cần xác thực sinh viên",
          "Bạn cần hoàn tất xác thực sinh viên trước khi thanh toán Student Pack.",
        );
        handleOpenStudentVerification();
        return;
      }
    }

    void (async () => {
      try {
        const checkoutPreview = await fetchCheckoutPreview(planName);
        if (!checkoutPreview) return;

        if (!checkoutPreview.eligible) {
          showAppInfo("Chưa thể tiếp tục", checkoutPreview.message);
          return;
        }

        setWalletCheckoutPreview(checkoutPreview);
        setSelectedPlanForWallet(selectedPlan);
        setShowWalletConfirm(true);
      } catch (error) {
        console.error("Failed to load checkout preview:", error);
      }
    })();
  };

  const confirmWalletPayment = async () => {
    if (!selectedPlanForWallet) return;

    try {
      const subscription = await premiumService.purchaseWithWallet(
        selectedPlanForWallet.id,
        isStudentEligible,
      );

      applyCurrentSubscription(subscription);
      previewCacheRef.current.clear();
      await Promise.all([
        loadWalletData(),
        loadPremiumPlans(),
      ]);
    } catch (error: any) {
      // Extract error message from response
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Thanh toán bằng ví thất bại. Vui lòng thử lại.";
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


  const fallbackFreePlan =
    premiumPlans.find((plan) => plan.planType === "FREE_TIER") || null;

  const visiblePremiumPlans = useMemo(
    () =>
      isBusinessRole
        ? premiumPlans.filter((plan) => plan.planType !== "FREE_TIER")
        : premiumPlans,
    [premiumPlans, isBusinessRole],
  );

  const displayCurrentSub =
    currentSub
      ? currentSub
      : fallbackFreePlan
        ? ({
            id: 0,
            userId: user?.id || 0,
            userName: user?.fullName,
            userEmail: user?.email,
            userAvatarUrl: user?.avatarUrl,
            plan: fallbackFreePlan,
            startDate: new Date(0).toISOString(),
            endDate: new Date("2999-12-31T00:00:00.000Z").toISOString(),
            isActive: true,
            status: "ACTIVE" as const,
            isStudentSubscription: false,
            autoRenew: false,
            daysRemaining: undefined,
            currentlyActive: true,
            cancellationReason: undefined,
            cancelledAt: undefined,
            createdAt: new Date(0).toISOString(),
            updatedAt: new Date(0).toISOString(),
          } satisfies UserSubscriptionResponse)
        : null;

  const activePlanId = displayCurrentSub?.plan?.id || null;

  const activePlanName =
    displayCurrentSub?.plan?.displayName ||
    displayCurrentSub?.plan?.name ||
    null;

  const isCancellationLimitMessage = (message?: string) =>
    !!message &&
    (message.includes("1 lần/tháng") ||
      message.includes("hủy gói Premium trong tháng này"));

  const handleOpenCancelSubscription = async () => {
    try {
      const result = await premiumService.checkRefundEligibility();

      if (isCancellationLimitMessage(result.message)) {
        setCancellationLimitMessage(result.message);
        setShowCancellationLimitModal(true);
        setShowCancelModal(false);
        return;
      }

      setShowCancelModal(true);
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Không thể kiểm tra điều kiện hủy gói";

      if (isCancellationLimitMessage(message) || message.includes("giới hạn")) {
        setCancellationLimitMessage(message);
        setShowCancellationLimitModal(true);
        setShowCancelModal(false);
      } else {
        showAppInfo("Chưa thể tiếp tục", message);
      }
    }
  };

  return (
    <div className="cosmic-premium-page">
      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        title="Đăng nhập để mua Premium"
        message="Bạn cần đăng nhập để tiếp tục thanh toán gói Premium"
        feature="Premium Subscription"
      />

      <ClearanceLevelPage
        premiumPlans={visiblePremiumPlans}
        currentSub={displayCurrentSub}
        activePlanId={activePlanId}
        activePlanName={activePlanName}
        processing={processing}
        isAuthenticated={isAuthenticated}
        walletData={walletData}
        userProfile={userProfile}
        fallbackAvatarUrl={user?.avatarUrl}
        onWalletPayment={handleWalletPayment}
        onRequireLogin={handleLoginRequired}
        onPlanPreview={handlePlanPreview}
        onViewInvoice={handleViewInvoice}
        onEnableAutoRenew={() => setShowEnableAutoRenewalModal(true)}
        onCancelAutoRenew={() => setShowCancelAutoRenewalModal(true)}
        onCancelSubscription={handleOpenCancelSubscription}
        needsStudentVerification={
          isAuthenticated &&
          !isBusinessRole &&
          !studentVerificationApproved
        }
        onStudentVerify={handleOpenStudentVerification}
        targetLabel={hasActive ? "NÂNG CẤP NGAY" : "Mở Khóa Ngay"}
      />

      {/* FAQ Section */}
      <PremiumFAQ />
      {/* MeowGuide positioned at bottom right */}
      <div className="cosmic-meowl-container">
        <MeowGuide currentPage="upgrade" />
      </div>

      {/* Cancel Auto-Renewal Modal */}
      <EnableAutoRenewalModal
        isOpen={showEnableAutoRenewalModal}
        onClose={() => setShowEnableAutoRenewalModal(false)}
        subscription={currentSub}
        walletBalance={walletData?.cashBalance}
        onSuccess={async () => {
          await loadCurrentSubscription();
          await loadWalletData();
        }}
      />

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
        onBlockedByLimit={(message) => {
          setShowCancelModal(false);
          setCancellationLimitMessage(message);
          setShowCancellationLimitModal(true);
        }}
        onSuccess={async () => {
          await loadCurrentSubscription();
          await loadWalletData();
        }}
      />

      <CancellationLimitModal
        isOpen={showCancellationLimitModal}
        onClose={() => setShowCancellationLimitModal(false)}
        message={cancellationLimitMessage}
      />

      {/* Wallet Payment Modal */}
      {selectedPlanForWallet && walletData && (
        <WalletPaymentModal
          isOpen={showWalletConfirm}
          onClose={() => {
            setShowWalletConfirm(false);
            setSelectedPlanForWallet(null);
            setWalletCheckoutPreview(null);
          }}
          planName={selectedPlanForWallet.displayName}
          planPrice={Number(walletCheckoutPreview?.amountDue ?? 0)}
          walletBalance={walletData.cashBalance}
          isStudentPrice={isStudentEligible}
          checkoutPreview={walletCheckoutPreview}
          currentSubscription={currentSub}
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
