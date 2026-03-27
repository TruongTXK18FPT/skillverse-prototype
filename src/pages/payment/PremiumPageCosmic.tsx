import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "../../styles/PremiumPageCosmic.css";
import MeowGuide from "../../components/meowl/MeowlGuide";
import { premiumService } from "../../services/premiumService";
import walletService from "../../services/walletService";
import userService from "../../services/userService";
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
  const previewCacheRef = useRef<Map<string, SubscriptionCheckoutPreviewResponse>>(
    new Map(),
  );
  const previewInFlightRef = useRef<Map<string, Promise<SubscriptionCheckoutPreviewResponse | null>>>(
    new Map(),
  );

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
      const subscription = await premiumService.getCurrentSubscription();
      setCurrentSub(subscription);

      const isActivePremium = Boolean(
        subscription &&
          subscription.isActive &&
          subscription.status === "ACTIVE" &&
          subscription.plan?.planType !== "FREE_TIER",
      );

      setHasActive(isActivePremium);
    } catch (error) {
      console.error("Failed to load current subscription:", error);
      setCurrentSub(null);
      setHasActive(false);
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

    const cacheKey = `${selectedPlan.id}:${isStudentEligible}:${selectedStudentId ?? "self"}`;
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
        selectedStudentId || undefined,
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
    if (!isAuthenticated || selectedStudentId) return;

    void fetchCheckoutPreview(planName).catch((error) => {
      console.error("Failed to preload checkout preview:", error);
    });
  };

  const handleWalletPayment = (planName: string) => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    const selectedPlan = premiumPlans.find((p) => p.name === planName);
    if (!selectedPlan) return;

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

  const selectedStudent = selectedStudentId
    ? students.find((st) => st.id === selectedStudentId) || null
    : null;

  const selectedStudentActivePlanName =
    selectedStudent?.progress?.premiumPlan &&
    !selectedStudent.progress.premiumPlan.toLowerCase().includes("free")
      ? selectedStudent.progress.premiumPlan
      : null;

  const fallbackFreePlan =
    premiumPlans.find((plan) => plan.planType === "FREE_TIER") || null;

  const displayCurrentSub =
    !selectedStudentId && currentSub
      ? currentSub
      : !selectedStudentId && fallbackFreePlan
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

  const activePlanId = !selectedStudentId
    ? displayCurrentSub?.plan?.id || null
    : null;

  const activePlanName = selectedStudentId
    ? selectedStudentActivePlanName
    : displayCurrentSub?.plan?.displayName || displayCurrentSub?.plan?.name || null;

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
                  <span style={{ color: "#f59e0b", fontSize: "0.9rem" }}>
                    Tài khoản này đang có Premium. Hệ thống sẽ tự động tính giá
                    nâng cấp nếu bạn chọn gói cao hơn.
                  </span>
                );
              }
              return null;
            })()}
        </div>
      )}
      <ClearanceLevelPage
        premiumPlans={premiumPlans}
        currentSub={displayCurrentSub}
        activePlanId={activePlanId}
        activePlanName={activePlanName}
        processing={processing}
        isAuthenticated={isAuthenticated}
        walletData={walletData}
        userProfile={userProfile}
        fallbackAvatarUrl={user?.avatarUrl}
        onWalletPayment={handleWalletPayment}
        onPlanPreview={handlePlanPreview}
        onViewInvoice={!selectedStudentId ? handleViewInvoice : undefined}
        onEnableAutoRenew={
          !selectedStudentId ? () => setShowEnableAutoRenewalModal(true) : undefined
        }
        onCancelAutoRenew={
          !selectedStudentId ? () => setShowCancelAutoRenewalModal(true) : undefined
        }
        onCancelSubscription={
          !selectedStudentId ? handleOpenCancelSubscription : undefined
        }
        targetLabel={
          selectedStudentId
            ? selectedStudentActivePlanName
              ? "NÂNG CẤP CHO CON"
              : "MUA CHO CON"
            : hasActive
              ? "NÂNG CẤP NGAY"
              : "Mở Khóa Ngay"
        }
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
          currentSubscription={!selectedStudentId ? currentSub : null}
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
