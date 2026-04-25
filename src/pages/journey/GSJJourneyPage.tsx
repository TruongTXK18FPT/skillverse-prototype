import {
  Children,
  cloneElement,
  isValidElement,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Map,
  Play,
  Pause,
  CheckCircle,
  Target,
  Brain,
  Award,
  BookOpen,
  Activity,
  Sparkles,
  X,
  RefreshCw,
  FileText,
  Lightbulb,
  Zap,
  ChevronRight,
  Rocket,
  Calendar,
  ArrowLeft,
  CircleCheckBig,
  CircleAlert,
  Trash2,
} from "lucide-react";
import journeyService from "../../services/journeyService";
import {
  getMentorsByVerifiedSkill,
  type MentorProfile,
} from "../../services/mentorProfileService";
import BookingModal from "../../components/mentorship-hud/BookingModal";
import {
  JourneySummaryResponse,
  JourneyDetailResponse,
  JourneyStatus,
  AssessmentTestResponse,
  TestResultResponse,
  SkillLevel,
  JourneyType,
  SUB_CATEGORIES,
  JOBS_BY_DOMAIN,
} from "../../types/Journey";
import GSJTestTaking from "./GSJTestTaking";
import MeowlGuide from "../../components/meowl/MeowlGuide";
import MeowlKuruLoader from "../../components/kuru-loader/MeowlKuruLoader";
import NodeVerificationGate from "../../components/journey/NodeVerificationGate";
import JourneyVerificationDossier from "../../components/journey/JourneyVerificationDossier";
import JourneyOutputAssessmentPanel from "../../components/journey/JourneyOutputAssessmentPanel";
import Toast from "../../components/shared/Toast";
import TicTacToeGame from "../../components/game/tic-tac-toe/TicTacToeGame";
import LoginRequiredModal from "../../components/auth/LoginRequiredModal";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../hooks/useToast";
import { getExpertDomainMeta } from "../../utils/expertFieldPresentation";
import { getDomainImage } from "../../utils/domainImageMap";
import technologyDomainImage from "../../assets/domain/Technology.png";
import designDomainImage from "../../assets/domain/Design.png";
import financeMarketingDomainImage from "../../assets/domain/Finance_Marketing.png";
import engineeringDomainImage from "../../assets/domain/Ky_thuat.png";
import healthcareDomainImage from "../../assets/domain/Healthcare.png";
import educationDomainImage from "../../assets/domain/Education.png";
import logisticsDomainImage from "../../assets/domain/Logistics.png";
import legalPublicAdministrationDomainImage from "../../assets/domain/Legal_Public Administration.png";
import artsEntertainmentDomainImage from "../../assets/domain/Arts&Entertainment.png";
import serviceHospitalityDomainImage from "../../assets/domain/Service_Hospitality.png";
import communityDomainImage from "../../assets/domain/Community.png";
import agricultureEnvironmentDomainImage from "../../assets/domain/Nongnghiep.png";
import meowlAcwyImage from "../../assets/meowl-skin/meowl-acwy.png";
import "./../../styles/GSJJourney.css";

const HERO_DOMAIN_SHOWCASE = [
  {
    key: "technology",
    title: "Công nghệ",
    description:
      "Đánh giá nền tảng lập trình, dữ liệu, an ninh mạng và tư duy xây dựng hệ thống số.",
    image: technologyDomainImage,
  },
  {
    key: "design",
    title: "Thiết kế",
    description:
      "Tập trung vào thẩm mỹ, trải nghiệm người dùng, nhận diện thương hiệu và sản phẩm số.",
    image: designDomainImage,
  },
  {
    key: "finance-marketing",
    title: "Tài chính & Marketing",
    description:
      "Phù hợp cho các vai trò kinh doanh, tài chính, tăng trưởng và hoạch định thị trường.",
    image: financeMarketingDomainImage,
  },
  {
    key: "engineering",
    title: "Kỹ thuật",
    description:
      "Bao quát kỹ thuật ứng dụng, vận hành, sản xuất và tối ưu quy trình trong môi trường công nghiệp.",
    image: engineeringDomainImage,
  },
  {
    key: "healthcare",
    title: "Y tế & Sức khỏe",
    description:
      "Mô phỏng bối cảnh chăm sóc sức khỏe, vận hành y tế và chuẩn năng lực chuyên môn đặc thù.",
    image: healthcareDomainImage,
  },
  {
    key: "education",
    title: "Giáo dục",
    description:
      "Đánh giá năng lực sư phạm, thiết kế học liệu, hướng dẫn và phát triển người học.",
    image: educationDomainImage,
  },
  {
    key: "logistics",
    title: "Logistics",
    description:
      "Tập trung vào chuỗi cung ứng, kho vận, điều phối và kiểm soát dòng hàng hóa.",
    image: logisticsDomainImage,
  },
  {
    key: "legal-public-administration",
    title: "Pháp lý & Hành chính công",
    description:
      "Phù hợp cho nghiệp vụ pháp lý, tuân thủ, hành chính và phục vụ công.",
    image: legalPublicAdministrationDomainImage,
  },
  {
    key: "arts-entertainment",
    title: "Nghệ thuật & Giải trí",
    description:
      "Khám phá năng lực sáng tạo nội dung, biểu đạt nghệ thuật và sản xuất truyền thông.",
    image: artsEntertainmentDomainImage,
  },
  {
    key: "service-hospitality",
    title: "Dịch vụ & Hospitality",
    description:
      "Đo lường tư duy dịch vụ, vận hành khách hàng và tiêu chuẩn trải nghiệm trong ngành dịch vụ.",
    image: serviceHospitalityDomainImage,
  },
  {
    key: "community",
    title: "Cộng đồng",
    description:
      "Dành cho công tác xã hội, phát triển cộng đồng và điều phối chương trình tác động.",
    image: communityDomainImage,
  },
  {
    key: "agriculture-environment",
    title: "Nông nghiệp & Môi trường",
    description:
      "Bao quát nông nghiệp, môi trường, phát triển bền vững và các mô hình ứng dụng thực tiễn.",
    image: agricultureEnvironmentDomainImage,
  },
];

const JOURNEYS_PER_PAGE = 6;
const JOURNEY_FETCH_BATCH_SIZE = 100;
const JOURNEY_ACTION_GAME_DELAY_MS = 8000;

type ScoreBandFrameworkItem = {
  key: string;
  label: string;
  range: string;
  recommendation: string;
  description: string;
};

type LevelFrameworkItem = {
  key: SkillLevel;
  range: string;
  description: string;
};

const SCORE_BAND_FRAMEWORK: ScoreBandFrameworkItem[] = [
  {
    key: "ZERO_BASE",
    label: "Nền tảng 0",
    range: "0-20%",
    recommendation: "FROM_ZERO",
    description:
      "Bắt đầu từ kiến thức cốt lõi, cần roadmap nhập môn theo từng bước.",
  },
  {
    key: "FOUNDATION",
    label: "Nền tảng",
    range: "21-45%",
    recommendation: "FOUNDATION",
    description:
      "Đã có nhận biết cơ bản, nên củng cố nền trước khi tăng độ khó.",
  },
  {
    key: "CORE",
    label: "Cốt lõi",
    range: "46-70%",
    recommendation: "STANDARD",
    description:
      "Đạt mức thực hành lõi, phù hợp lộ trình học tiêu chuẩn để bứt lên.",
  },
  {
    key: "ADVANCED",
    label: "Nâng cao",
    range: "71-85%",
    recommendation: "ADVANCED",
    description:
      "Năng lực khá tốt, nên tập trung bài toán thực chiến và mở rộng phạm vi.",
  },
  {
    key: "EXPERT",
    label: "Chuyên sâu",
    range: "86-100%",
    recommendation: "FAST_TRACK",
    description:
      "Năng lực mạnh, phù hợp lộ trình tăng tốc hoặc chuyên sâu theo mục tiêu cao hơn.",
  },
];

const LEVEL_FRAMEWORK: LevelFrameworkItem[] = [
  {
    key: SkillLevel.BEGINNER,
    range: "0-40%",
    description: "Cần xây nền tảng chắc trước khi vào bài tập nâng cao.",
  },
  {
    key: SkillLevel.INTERMEDIATE,
    range: "41-70%",
    description:
      "Có năng lực thực hành cơ bản, cần tăng độ ổn định và chiều sâu.",
  },
  {
    key: SkillLevel.ADVANCED,
    range: "71-85%",
    description:
      "Làm tốt phần lớn tình huống điển hình, sẵn sàng cho thử thách khó hơn.",
  },
  {
    key: SkillLevel.EXPERT,
    range: "86-100%",
    description:
      "Đủ vững để xử lý bài toán phức tạp, có thể tăng tốc theo chuyên môn hẹp.",
  },
];

type ViewMode = "list" | "detail" | "test" | "result";
type DeleteDialogState = {
  journeyId: number;
  journeyLabel: string;
  fromDetail?: boolean;
} | null;

type ActionMode =
  | "idle"
  | "opening-test"
  | "generating-test"
  | "loading-result"
  | "submitting-test"
  | "generating-roadmap"
  | "toggling-status"
  | "deleting-journey";

const getInitials = (value: string): string => {
  const words = value.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return "JV";
  }

  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
};

const GSJJourneyPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const autoOpenedJourneyIdRef = useRef<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [heroSlide, setHeroSlide] = useState(0);
  const [journeys, setJourneys] = useState<JourneySummaryResponse[]>([]);
  const [selectedJourney, setSelectedJourney] =
    useState<JourneyDetailResponse | null>(null);
  const [currentTest, setCurrentTest] = useState<AssessmentTestResponse | null>(
    null,
  );
  const [currentResult, setCurrentResult] = useState<TestResultResponse | null>(
    null,
  );
  const [showAllQuestionReviews, setShowAllQuestionReviews] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMode, setActionMode] = useState<ActionMode>("idle");
  const [showActionGame, setShowActionGame] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState<DeleteDialogState>(null);
  const [error, setError] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { toast, isVisible, showError, showSuccess, showWarning, hideToast } =
    useToast();

  // V3 Phase 1: Mentor suggestion by verified skill
  const [suggestedMentors, setSuggestedMentors] = useState<MentorProfile[]>([]);
  const [bookingMentor, setBookingMentor] = useState<MentorProfile | null>(
    null,
  );
  const [showMentorList, setShowMentorList] = useState(false);
  const [loadingMentors, setLoadingMentors] = useState(false);

  useEffect(() => {
    setShowAllQuestionReviews(false);
  }, [currentResult?.id]);

  useEffect(() => {
    setSuggestedMentors([]);
    setShowMentorList(false);
  }, [selectedJourney?.id]);

  // Load journeys on mount
  const loadJourneys = useCallback(async () => {
    try {
      setLoading(true);
      let page = 0;
      let totalPages = 1;
      const allJourneys: JourneySummaryResponse[] = [];

      do {
        const data = await journeyService.getUserJourneys(
          page,
          JOURNEY_FETCH_BATCH_SIZE,
        );
        allJourneys.push(...data.content);
        totalPages = Math.max(data.totalPages || 1, 1);
        page += 1;
      } while (page < totalPages);

      setJourneys(allJourneys);
      setError(null);
    } catch (err: any) {
      console.error("Failed to load journeys:", err);
      setError(err.message || "Failed to load journeys");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      void loadJourneys();
      return;
    }

    setJourneys([]);
    setSelectedJourney(null);
    setCurrentTest(null);
    setCurrentResult(null);
    setViewMode("list");
    setCurrentPage(1);
    setError(null);
    setLoading(false);
  }, [loadJourneys, user]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setHeroSlide((prev) => (prev + 1) % HERO_DOMAIN_SHOWCASE.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const totalPages = Math.max(
      1,
      Math.ceil(journeys.length / JOURNEYS_PER_PAGE),
    );
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, journeys.length]);

  const scrollToJourneysSection = useCallback(() => {
    document
      .getElementById("journeys-section")
      ?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const handleMyJourneysButtonClick = useCallback(() => {
    if (viewMode === "list") {
      scrollToJourneysSection();
      return;
    }

    if (viewMode === "test" || viewMode === "result") {
      setViewMode("detail");
      return;
    }

    setViewMode("list");
    window.setTimeout(() => {
      scrollToJourneysSection();
    }, 120);
  }, [scrollToJourneysSection, viewMode]);

  const shouldOfferActionGame =
    actionLoading &&
    (actionMode === "generating-test" ||
      actionMode === "submitting-test" ||
      actionMode === "generating-roadmap");

  useEffect(() => {
    if (!shouldOfferActionGame) {
      setShowActionGame(false);
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setShowActionGame(true);
    }, JOURNEY_ACTION_GAME_DELAY_MS);

    return () => window.clearTimeout(timeoutId);
  }, [shouldOfferActionGame]);

  const actionLoadingMessage =
    actionMode === "generating-test"
      ? "Meowl đang tạo bộ quiz phù hợp cho bạn..."
      : actionMode === "submitting-test"
        ? "Meowl đang chấm điểm và phân tích kết quả..."
        : actionMode === "generating-roadmap"
          ? "Meowl đang dựng roadmap cá nhân hóa..."
          : actionMode === "opening-test"
            ? "Meowl đang mở bài test gần nhất..."
            : actionMode === "loading-result"
              ? "Meowl đang tải kết quả quiz..."
              : actionMode === "toggling-status"
                ? "Meowl đang cập nhật trạng thái Journey..."
                : actionMode === "deleting-journey"
                  ? "Meowl đang xóa hành trình..."
                  : "Meowl đang chuẩn bị cho bạn đây...";

  // Select journey and load details
  const handleSelectJourney = useCallback(
    async (journeyId: number) => {
      try {
        setLoading(true);
        const selectedIndex = journeys.findIndex(
          (journey) => journey.id === journeyId,
        );
        if (selectedIndex >= 0) {
          setCurrentPage(Math.floor(selectedIndex / JOURNEYS_PER_PAGE) + 1);
        }
        const detail = await journeyService.getJourneyById(journeyId);
        setSelectedJourney(detail);
        setCurrentTest(null);
        setCurrentResult(null);
        setViewMode("detail");
        setError(null);
      } catch (err: any) {
        console.error("Failed to load journey details:", err);
        setError(err.message || "Failed to load journey details");
      } finally {
        setLoading(false);
      }
    },
    [journeys],
  );

  useEffect(() => {
    const routeState = location.state as { autoOpenJourneyId?: number } | null;
    const autoOpenJourneyId = routeState?.autoOpenJourneyId;

    if (
      !user ||
      !autoOpenJourneyId ||
      autoOpenedJourneyIdRef.current === autoOpenJourneyId
    ) {
      return;
    }

    autoOpenedJourneyIdRef.current = autoOpenJourneyId;
    void handleSelectJourney(autoOpenJourneyId);

    navigate(location.pathname, { replace: true, state: null });
  }, [handleSelectJourney, location.pathname, location.state, navigate, user]);

  // V3 Phase 3: Handle blockReason from JourneyCreatePage redirect
  useEffect(() => {
    const routeState = location.state as { blockReason?: string } | null;
    const blockReason = routeState?.blockReason;
    if (blockReason) {
      showWarning("Không thể tạo hành trình mới", blockReason);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate, showWarning]);

  // V3 Phase 3: Compute whether user has any active (non-terminal) journey
  const hasActiveJourney = journeys.some(
    (j) =>
      j.status !== JourneyStatus.COMPLETED &&
      j.status !== JourneyStatus.CANCELLED &&
      j.status !== JourneyStatus.COMPLETED_UNVERIFIED &&
      j.status !== JourneyStatus.COMPLETED_VERIFIED,
  );

  const handleCreateJourneyClick = useCallback(() => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    if (hasActiveJourney) {
      showWarning(
        "Không thể tạo hành trình mới",
        "Bạn đang có một hành trình chưa hoàn thành. Hãy hoàn thành hoặc xóa hành trình cũ trước khi tạo mới.",
      );
      return;
    }

    navigate("/journey/create");
  }, [navigate, user, hasActiveJourney, showWarning]);

  const syncSelectedJourneyTest = useCallback(
    (test: AssessmentTestResponse) => {
      setSelectedJourney((prev) => {
        if (!prev) {
          return prev;
        }

        return {
          ...prev,
          assessmentTestId: test.id,
          assessmentTestTitle: test.title,
          assessmentTestQuestionCount: test.totalQuestions,
          assessmentTestStatus: test.status,
        };
      });
    },
    [],
  );

  // Generate assessment test
  const handleGenerateTest = async () => {
    if (!selectedJourney) return;
    try {
      setActionLoading(true);
      setActionMode("generating-test");
      const result = await journeyService.generateAssessmentTest(
        selectedJourney.id,
      );
      setCurrentTest(result.test);
      setCurrentResult(null);
      setViewMode("test");
      syncSelectedJourneyTest(result.test);
      setError(null);
    } catch (err: any) {
      console.error("Failed to generate test:", err);
      setError(err.message || "Failed to generate assessment test");
    } finally {
      setActionLoading(false);
      setActionMode("idle");
    }
  };

  const handleStartAssessment = async () => {
    if (!selectedJourney) return;

    const existingTestId = selectedJourney.assessmentTestId;
    const existingTestStatus =
      selectedJourney.assessmentTestStatus?.toUpperCase() || "";
    const hasExistingUnfinishedTest =
      Boolean(existingTestId) && existingTestStatus !== "COMPLETED";

    try {
      setActionLoading(true);

      if (hasExistingUnfinishedTest && existingTestId) {
        setActionMode("opening-test");

        if (currentTest?.id === existingTestId) {
          setViewMode("test");
          setError(null);
          return;
        }

        const test = await journeyService.getAssessmentTest(
          selectedJourney.id,
          existingTestId,
        );
        setCurrentTest(test);
        setCurrentResult(null);
        setViewMode("test");
        setError(null);
        return;
      }

      setActionMode("generating-test");
      const result = await journeyService.generateAssessmentTest(
        selectedJourney.id,
      );
      setCurrentTest(result.test);
      setCurrentResult(null);
      setViewMode("test");
      syncSelectedJourneyTest(result.test);
      setError(null);
    } catch (err: any) {
      console.error("Failed to start assessment test:", err);
      setError(err.message || "Failed to open assessment test");
    } finally {
      setActionLoading(false);
      setActionMode("idle");
    }
  };

  const handleViewLatestResult = async () => {
    if (!selectedJourney) return;
    const latestResultId = selectedJourney.latestTestResult?.resultId;
    if (!latestResultId) {
      setError("Chưa có kết quả quiz để xem lại.");
      return;
    }

    try {
      setActionLoading(true);
      setActionMode("loading-result");
      if (!currentResult || currentResult.id !== latestResultId) {
        const result = await journeyService.getTestResult(
          selectedJourney.id,
          latestResultId,
        );
        setCurrentResult(result);
      }
      setViewMode("result");
      setError(null);
    } catch (err: any) {
      console.error("Failed to load latest test result:", err);
      setError(err.message || "Failed to load latest quiz result.");
    } finally {
      setActionLoading(false);
      setActionMode("idle");
    }
  };

  // Submit test
  const handleSubmitTest = async (
    answers: Record<number, string>,
    timeSpent: number,
  ) => {
    if (!selectedJourney || !currentTest) return;
    try {
      setActionLoading(true);
      setActionMode("submitting-test");
      const result = await journeyService.submitTest(selectedJourney.id, {
        testId: currentTest.id,
        answers,
        timeSpentSeconds: timeSpent,
      });
      setCurrentResult(result);
      setViewMode("result");
      const updated = await journeyService.getJourneyById(selectedJourney.id);
      setSelectedJourney(updated);
      setError(null);
    } catch (err: any) {
      console.error("Failed to submit test:", err);
      setError(err.message || "Failed to submit test");
    } finally {
      setActionLoading(false);
      setActionMode("idle");
    }
  };

  // Generate roadmap
  const handleGenerateRoadmap = async () => {
    if (!selectedJourney) return;
    try {
      setActionLoading(true);
      setActionMode("generating-roadmap");
      const generated = await journeyService.generateRoadmap(
        selectedJourney.id,
      );
      const updated = await journeyService.getJourneyById(selectedJourney.id);
      setSelectedJourney(updated);
      setError(null);

      const roadmapSessionId =
        generated.roadmapSessionId ?? updated.roadmapSessionId;
      if (roadmapSessionId) {
        navigate(`/roadmap/${roadmapSessionId}`, {
          state: { journeyId: selectedJourney.id },
        });
        return;
      }

      setError(
        "Đã tạo lộ trình nhưng chưa nhận được mã phiên roadmap. Vui lòng thử tải lại trang.",
      );
    } catch (err: any) {
      console.error("Failed to generate roadmap:", err);
      setError(err.message || "Failed to generate roadmap");
    } finally {
      setActionLoading(false);
      setActionMode("idle");
    }
  };

  // Pause/Resume journey
  const handleTogglePause = async () => {
    if (!selectedJourney) return;
    try {
      setActionLoading(true);
      setActionMode("toggling-status");
      let updated: JourneySummaryResponse;
      if (selectedJourney.status === JourneyStatus.PAUSED) {
        updated = await journeyService.resumeJourney(selectedJourney.id);
      } else {
        updated = await journeyService.pauseJourney(selectedJourney.id);
      }
      const detail = await journeyService.getJourneyById(updated.id);
      setSelectedJourney(detail);
      await loadJourneys();
      setError(null);
    } catch (err: any) {
      console.error("Failed to toggle pause:", err);
      setError(err.message || "Failed to update journey status");
    } finally {
      setActionLoading(false);
      setActionMode("idle");
    }
  };

  const handleCompleteJourney = useCallback(async () => {
    if (!selectedJourney) return;

    try {
      setActionLoading(true);
      setActionMode("toggling-status");

      const completedJourney = await journeyService.completeJourney(
        selectedJourney.id,
      );
      const detail = await journeyService.getJourneyById(completedJourney.id);
      setSelectedJourney(detail);
      await loadJourneys();
      setError(null);
      showSuccess(
        "Hoàn thành hành trình",
        "Journey đã được cập nhật trạng thái hoàn thành.",
      );
    } catch (err: any) {
      const statusCode =
        (err as { status?: number })?.status ??
        (err?.response?.status as number | undefined);
      const message: string =
        err?.response?.data?.message ||
        err?.message ||
        "Không thể hoàn thành hành trình";

      if (statusCode === 409) {
        showWarning(
          "Gate blocked",
          message || "Hành trình chưa đạt final verification gate.",
        );
        return;
      }

      if (statusCode === 500 && message.toLowerCase().includes("constraint")) {
        showError(
          "Lỗi hệ thống",
          "Cơ sở dữ liệu chưa được cập nhật. Vui lòng liên hệ admin để chạy patch SQL.",
        );
        return;
      }

      showError("Không thể hoàn thành hành trình", message);
    } finally {
      setActionLoading(false);
      setActionMode("idle");
    }
  }, [loadJourneys, selectedJourney, showError, showSuccess, showWarning]);

  const handleRequestVerification = useCallback(async () => {
    if (!selectedJourney) return;
    try {
      setActionLoading(true);
      setActionMode("toggling-status");
      const updated = await journeyService.requestVerification(
        selectedJourney.id,
      );
      const detail = await journeyService.getJourneyById(updated.id);
      setSelectedJourney(detail);
      await loadJourneys();
      showSuccess(
        "Yêu cầu đã gửi",
        "Hành trình đã chuyển sang trạng thái chờ xác thực mentor.",
      );
    } catch (err: any) {
      showError(
        "Không thể yêu cầu xác thực",
        err?.message || "Vui lòng thử lại.",
      );
    } finally {
      setActionLoading(false);
      setActionMode("idle");
    }
  }, [loadJourneys, selectedJourney, showError, showSuccess]);

  const handleDeleteJourney = useCallback(
    async (
      journeyId: number,
      options?: {
        event?: ReactMouseEvent<HTMLElement>;
        journeyLabel?: string;
        fromDetail?: boolean;
      },
    ) => {
      options?.event?.stopPropagation();
      setPendingDelete({
        journeyId,
        journeyLabel: options?.journeyLabel || "mục này",
        fromDetail: options?.fromDetail,
      });
    },
    [],
  );

  const confirmDeleteJourney = useCallback(async () => {
    if (!pendingDelete) {
      return;
    }

    try {
      setActionLoading(true);
      setActionMode("deleting-journey");
      await journeyService.deleteJourney(pendingDelete.journeyId);

      if (
        selectedJourney?.id === pendingDelete.journeyId ||
        pendingDelete.fromDetail
      ) {
        setSelectedJourney(null);
        setCurrentTest(null);
        setCurrentResult(null);
        setViewMode("list");
      }

      setPendingDelete(null);
      await loadJourneys();
      setError(null);
    } catch (err: any) {
      console.error("Failed to delete journey:", err);
      setError(err.message || "Không thể xóa hành trình");
    } finally {
      setActionLoading(false);
      setActionMode("idle");
    }
  }, [loadJourneys, pendingDelete, selectedJourney?.id]);

  const closeDeleteDialog = useCallback(() => {
    if (actionMode === "deleting-journey") {
      return;
    }
    setPendingDelete(null);
  }, [actionMode]);

  // Get domain label
  const getDomainLabel = (domain: string): string => {
    return getExpertDomainMeta(domain).label || domain;
  };

  // Get sub-category label
  const getSubCategoryLabel = (subCategory: string, domain: string): string => {
    const subCategories = SUB_CATEGORIES[domain] || [];
    const sub = subCategories.find((s) => s.value === subCategory);
    return sub?.label || subCategory;
  };

  const getJourneyScopeLabel = (
    journey: Partial<JourneyDetailResponse & JourneySummaryResponse> & {
      industry?: string;
      subCategory?: string;
      domain: string;
    },
  ): string => {
    if (journey.industry) {
      return journey.industry;
    }

    if (journey.subCategory) {
      return getSubCategoryLabel(journey.subCategory, journey.domain);
    }

    return "Chưa xác định lĩnh vực chi tiết";
  };

  const getJourneyMonogram = (domain: string): string =>
    getInitials(getDomainLabel(domain));

  const getJobRoleLabel = (jobRole?: string, domain?: string): string => {
    if (!jobRole) return "Vai trò chưa xác định";

    if (domain) {
      const roles = JOBS_BY_DOMAIN[domain] || [];
      const matched = roles.find((role) => role.value === jobRole);
      if (matched?.label) {
        return matched.label;
      }
    }

    return jobRole;
  };

  const isCompletedJourneyStatus = (status: JourneyStatus): boolean =>
    status === JourneyStatus.COMPLETED ||
    status === JourneyStatus.COMPLETED_UNVERIFIED ||
    status === JourneyStatus.COMPLETED_VERIFIED;

  // Get status label
  const getStatusLabel = (status: JourneyStatus): string => {
    const labels: Record<JourneyStatus, string> = {
      [JourneyStatus.NOT_STARTED]: "Chưa bắt đầu",
      [JourneyStatus.ASSESSMENT_PENDING]: "Chờ đánh giá",
      [JourneyStatus.TEST_IN_PROGRESS]: "Đang làm bài",
      [JourneyStatus.TEST_COMPLETED]: "Hoàn thành bài test",
      [JourneyStatus.EVALUATION_PENDING]: "Đang chấm điểm",
      [JourneyStatus.ROADMAP_GENERATING]: "Tạo lộ trình",
      [JourneyStatus.ROADMAP_READY]: "Lộ trình sẵn sàng",
      [JourneyStatus.STUDY_PLANS_READY]: "Kế hoạch sẵn sàng",
      [JourneyStatus.IN_PROGRESS]: "Đang học",
      [JourneyStatus.PAUSED]: "Tạm dừng",
      [JourneyStatus.COMPLETED]: "Hoàn thành",
      [JourneyStatus.COMPLETED_UNVERIFIED]: "Hoàn thành (chưa xác thực)",
      [JourneyStatus.AWAITING_VERIFICATION]: "Chờ xác thực",
      [JourneyStatus.COMPLETED_VERIFIED]: "Hoàn thành (đã xác thực)",
      [JourneyStatus.CANCELLED]: "Đã hủy",
    };
    return labels[status] || status;
  };

  // Get status color
  const getStatusColor = (status: JourneyStatus): string => {
    const colors: Record<JourneyStatus, string> = {
      [JourneyStatus.NOT_STARTED]: "pending",
      [JourneyStatus.ASSESSMENT_PENDING]: "pending",
      [JourneyStatus.TEST_IN_PROGRESS]: "active",
      [JourneyStatus.TEST_COMPLETED]: "active",
      [JourneyStatus.EVALUATION_PENDING]: "active",
      [JourneyStatus.ROADMAP_GENERATING]: "active",
      [JourneyStatus.ROADMAP_READY]: "active",
      [JourneyStatus.STUDY_PLANS_READY]: "active",
      [JourneyStatus.IN_PROGRESS]: "active",
      [JourneyStatus.PAUSED]: "paused",
      [JourneyStatus.COMPLETED]: "completed",
      [JourneyStatus.COMPLETED_UNVERIFIED]: "completed",
      [JourneyStatus.AWAITING_VERIFICATION]: "pending",
      [JourneyStatus.COMPLETED_VERIFIED]: "completed",
      [JourneyStatus.CANCELLED]: "cancelled",
    };
    return colors[status] || "pending";
  };

  // Get current step index from real journey artifacts (test/result/roadmap), not only status flag
  const getCurrentStepIndex = (journey: JourneyDetailResponse): number => {
    if (isCompletedJourneyStatus(journey.status)) {
      return 4;
    }

    const hasRoadmap = Boolean(journey.roadmapSessionId);
    const hasEvaluationResult = Boolean(journey.latestTestResult);
    const assessmentTestStatus =
      journey.assessmentTestStatus?.toUpperCase() || "";
    const hasAssessmentTest = Boolean(journey.assessmentTestId);
    const hasAssessmentInProgress =
      assessmentTestStatus === "PENDING" ||
      assessmentTestStatus === "IN_PROGRESS" ||
      journey.status === JourneyStatus.TEST_IN_PROGRESS;
    const hasAssessmentCompleted =
      !hasAssessmentInProgress &&
      (hasEvaluationResult || assessmentTestStatus === "COMPLETED");
    const progress = journey.progressPercentage || 0;

    if (
      journey.status === JourneyStatus.IN_PROGRESS ||
      journey.status === JourneyStatus.STUDY_PLANS_READY ||
      (journey.status === JourneyStatus.PAUSED &&
        hasRoadmap &&
        progress > 30) ||
      (hasRoadmap && progress > 30)
    ) {
      return 3;
    }

    if (
      hasRoadmap ||
      journey.status === JourneyStatus.ROADMAP_READY ||
      journey.status === JourneyStatus.ROADMAP_GENERATING ||
      (journey.status === JourneyStatus.PAUSED && hasRoadmap)
    ) {
      return 2;
    }

    if (hasAssessmentCompleted) {
      return 1;
    }

    if (
      hasAssessmentInProgress ||
      hasAssessmentTest ||
      journey.status === JourneyStatus.ASSESSMENT_PENDING ||
      journey.status === JourneyStatus.NOT_STARTED ||
      journey.status === JourneyStatus.TEST_COMPLETED ||
      journey.status === JourneyStatus.EVALUATION_PENDING
    ) {
      return 0;
    }

    return 0;
  };

  // Get journey type icon
  const getJourneyTypeIcon = (type: string) => {
    return type === JourneyType.CAREER ? (
      <Target size={14} />
    ) : (
      <Sparkles size={14} />
    );
  };

  const getSkillLevelLabel = (level?: SkillLevel): string => {
    if (!level) return "Chưa xác định";
    const labels: Record<SkillLevel, string> = {
      [SkillLevel.BEGINNER]: "Mới bắt đầu",
      [SkillLevel.ELEMENTARY]: "Sơ cấp",
      [SkillLevel.INTERMEDIATE]: "Trung cấp",
      [SkillLevel.ADVANCED]: "Nâng cao",
      [SkillLevel.EXPERT]: "Chuyên gia",
    };
    return labels[level] || level;
  };

  const getSkillLevelClass = (level: SkillLevel): string => {
    switch (level) {
      case SkillLevel.BEGINNER:
        return "beginner";
      case SkillLevel.ELEMENTARY:
      case SkillLevel.INTERMEDIATE:
        return "intermediate";
      case SkillLevel.ADVANCED:
      case SkillLevel.EXPERT:
      default:
        return "advanced";
    }
  };

  const resolveScoreBandByScore = (score: number): string => {
    if (score <= 20) return "ZERO_BASE";
    if (score <= 45) return "FOUNDATION";
    if (score <= 70) return "CORE";
    if (score <= 85) return "ADVANCED";
    return "EXPERT";
  };

  const resolveScoreBandFrameworkItem = (
    scoreBand: string,
    score: number,
  ): ScoreBandFrameworkItem => {
    const normalizedBand = (scoreBand || "").trim().toUpperCase();
    return (
      SCORE_BAND_FRAMEWORK.find((item) => item.key === normalizedBand) ||
      SCORE_BAND_FRAMEWORK.find(
        (item) => item.key === resolveScoreBandByScore(score),
      ) ||
      SCORE_BAND_FRAMEWORK[2]
    );
  };

  const resolveLevelFrameworkItem = (
    level: SkillLevel,
    score: number,
  ): LevelFrameworkItem => {
    return (
      LEVEL_FRAMEWORK.find((item) => item.key === level) ||
      (score <= 40
        ? LEVEL_FRAMEWORK[0]
        : score <= 70
          ? LEVEL_FRAMEWORK[1]
          : score <= 85
            ? LEVEL_FRAMEWORK[2]
            : LEVEL_FRAMEWORK[3])
    );
  };

  const formatDateTime = (value?: string): string => {
    if (!value) return "Chưa có dữ liệu";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Chưa có dữ liệu";
    return date.toLocaleString("vi-VN", {
      hour12: false,
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const normalizeMarkdownText = (
    input?: string,
    fallback = "Chưa có nội dung để hiển thị.",
  ): string => {
    let value = (input || "").replace(/\r\n/g, "\n").trim();
    if (!value) {
      return fallback;
    }

    // ── Phase 1: Collapse newlines inside inline spans (**, *, `) ──────────
    // These must be resolved BEFORE any bracket processing, otherwise newlines
    // break the opening/closing pair and leave unpaired markers behind.
    value = value.replace(/\*\*([\s\S]*?)\*\*/g, (match, inner) => {
      return `**${inner.replace(/\n/g, " ").replace(/\s+/g, " ").trim()}**`;
    });
    value = value.replace(/\*([\s\S]*?)\*/g, (match, inner) => {
      return `*${inner.replace(/\n/g, " ").replace(/\s+/g, " ").trim()}*`;
    });
    value = value.replace(/`([^`]+)`/g, (match, inner) => {
      return `\`${inner.replace(/\n/g, " ").replace(/\s+/g, " ").trim()}\``;
    });

    // ── Phase 2: Handle the {## Title=[- ...]} block notation ───────────────
    // The AI generates content like:
    //   {## Điểm mạnh nổi bật=[- **Lập kế hoạch (Q1, Q2)**: ..., - **Kiến thức nền tảng**: ...]}
    // The closing ]} may be on the same line or a different line — normalize whitespace
    // first so the regex always has a single-line string to work with.
    value = value
      .replace(/\n([^\n]*?)\]\s*\}/g, " $1]}") // move ]} to end of previous line
      .replace(/\[\s*\n\s*/g, "[") // join [ with next line
      .replace(/\n\s*\]/g, " ]"); // pull ] back if separated
    value = value.replace(
      /\{##\s*([^=[\]{}]+)=\[\s*[-*]\s*([\s\S]*?)\s*\]\}/g,
      (_match, title, rawItems) => {
        // Split by commas at the top level (not inside **bold** or *italic* spans)
        const lines = splitTopLevel(rawItems, ",")
          .map((s: string) => s.trim())
          .filter(Boolean);

        const itemsMarkdown = lines
          .map((item: string) => {
            // Strip leading list markers (already have [- or [*), just normalize whitespace
            const stripped = item.replace(/^[-*]\s*/, "").trim();
            // Recursively normalize any nested bracket notation inside the item
            return `- ${normalizeBracketNotation(stripped)}`;
          })
          .join("\n");

        return `## ${title.trim()}\n${itemsMarkdown}`;
      },
    );

    // Also handle {## Title=[- items} without closing bracket (trailing content left)
    value = value.replace(
      /\{##\s*([^=[\]{}]+)=\[\s*[-*]\s*([\s\S]*?)$/gm,
      (_match, title, rawItems) => {
        const lines = splitTopLevel(rawItems, ",")
          .map((s: string) => s.trim())
          .filter(Boolean);

        const itemsMarkdown = lines
          .map((item: string) => {
            const stripped = item.replace(/^[-*]\s*/, "").trim();
            return `- ${normalizeBracketNotation(stripped)}`;
          })
          .join("\n");

        return `## ${title.trim()}\n${itemsMarkdown}`;
      },
    );

    // ── Phase 3: Handle standalone {## Title} without list items ──────────
    value = value.replace(/\{##\s*([^}[\]]+)\}/g, "## $1");

    // ── Phase 4: Convert remaining bracket notation to standard markdown ────
    // [***text***] → **text**  (already collapsed in Phase 1, but catch any leftovers)
    // [*text*] → *text*
    // [## Heading] → ## Heading
    // [# Heading] → # Heading
    // [---] → ---
    value = value
      .replace(/\[\*{3,}\s*([\s\S]*?)\s*\*{3,}\]/g, "**$1**")
      .replace(/\[\*\s*([\s\S]*?)\s*\*\]/g, "*$1*")
      .replace(/\[#{1,6}\s+([^\]]+)\]/g, "## $1")
      .replace(/\[---\]/g, "---");

    // ── Phase 5: Strip orphaned outer curly braces {standalone text} ────────
    value = value.replace(/^\{([^}]+)\}$/gm, "$1");

    // ── Phase 6: Normalize list item lines ─────────────────────────────────
    return value
      .split("\n")
      .map((line) => {
        let cleaned = line.trim();

        // [- item] → - item  (bracket-wrapped list item)
        cleaned = cleaned.replace(/^\[\s*-\s*(.+?)\s*\]$/, "- $1");

        // Strip trailing ] from lines broken mid-sentence
        cleaned = cleaned.replace(/\[\s*\]\s*$/g, "");
        cleaned = cleaned.replace(/\s+\]\s*$/g, "");

        // Normalize • and + to -
        cleaned = cleaned.replace(/^[\s]*[+•][\s]+/, "- ");

        return cleaned;
      })
      .join("\n");
  };

  // Helper: split by delimiter only at the top level (respects nested brackets/spans)
  const splitTopLevel = (text: string, delimiter: string): string[] => {
    const result: string[] = [];
    let current = "";
    let depth = 0;
    let inSpan = false;
    let spanChar = "";
    let i = 0;

    while (i < text.length) {
      const ch = text[i];

      if (!inSpan && (ch === "*" || ch === "`")) {
        inSpan = true;
        spanChar = ch;
        current += ch;
        i++;
        continue;
      }

      if (inSpan && ch === spanChar) {
        inSpan = false;
        spanChar = "";
        current += ch;
        i++;
        continue;
      }

      if (!inSpan) {
        if (ch === "[" || ch === "{") depth++;
        if (ch === "]" || ch === "}") depth--;
        if (ch === delimiter && depth === 0) {
          result.push(current);
          current = "";
          i++;
          continue;
        }
      }

      current += ch;
      i++;
    }

    if (current.trim()) {
      result.push(current);
    }

    return result;
  };

  // Helper: recursively normalize bracket notation within a string (no list splitting)
  const normalizeBracketNotation = (text: string): string => {
    let result = text;

    // [*text*] → *text*
    result = result.replace(/\[\*\s*([\s\S]*?)\s*\*\]/g, "*$1*");
    // [## heading] → ## heading
    result = result.replace(/\[#{1,6}\s+([^\]]+)\]/g, "## $1");
    // Strip trailing bracket fragments
    result = result.replace(/\s+\]\s*$/g, "");

    return result;
  };

  const toMarkdownList = (items: string[], fallback: string): string => {
    const normalizedItems = items
      .map((item) => item.replace(/^\s*[-+•]\s+/, "").trim())
      .filter(Boolean)
      .map((item) => `- ${item}`);

    if (normalizedItems.length > 0) {
      return normalizedItems.join("\n");
    }

    return fallback ? `- ${fallback}` : "";
  };

  const splitInsightItems = (items: string[], fallback: string): string[] => {
    const lines = items
      .flatMap((item) => normalizeMarkdownText(item, "").split("\n"))
      .map((line) => line.replace(/^\s*[-+•]\s+/, "").trim())
      .filter(Boolean);

    return lines.length > 0 ? lines : [fallback];
  };

  const parseInsightLine = (
    line: string,
  ): { title: string; detail: string } => {
    const compact = line.replace(/\s+/g, " ").trim();
    const pair = compact.match(/^([^:]{2,80}):\s*(.+)$/);
    if (pair) {
      return {
        title: pair[1].trim(),
        detail: pair[2].trim(),
      };
    }

    return {
      title: "",
      detail: compact,
    };
  };

  const extractQuestionIdsFromText = (text: string): number[] => {
    const ids = new Set<number>();
    const explicitQ = text.matchAll(/\bQ(\d+)\b/gi);
    for (const match of explicitQ) {
      const id = Number(match[1]);
      if (Number.isFinite(id) && id > 0) {
        ids.add(id);
      }
    }
    return Array.from(ids);
  };

  const extractOptionKey = (value: string): string => {
    const match = value.trim().match(/^([A-D])(?:\s*[.):-]|\s+|$)/i);
    return match?.[1]?.toUpperCase() ?? "";
  };

  const toOptionLabel = (index: number): string =>
    String.fromCharCode(65 + index);

  const normalizeHighlightKeywords = (keywords: string[]): string[] =>
    Array.from(
      new Set(
        keywords
          .map((keyword) => keyword.trim())
          .filter((keyword) => keyword.length >= 2),
      ),
    ).sort((a, b) => b.length - a.length);

  const escapeRegExp = (value: string): string =>
    value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const highlightTextContent = (
    text: string,
    keywords: string[],
    keyPrefix: string,
  ): ReactNode => {
    if (!text || keywords.length === 0) {
      return text;
    }

    const matcher = new RegExp(
      `(${keywords.map(escapeRegExp).join("|")})`,
      "gi",
    );
    const parts = text.split(matcher);

    if (parts.length <= 1) {
      return text;
    }

    return parts.map((part, index) => {
      if (!part) {
        return null;
      }

      const matchedKeyword = keywords.find(
        (keyword) => keyword.toLowerCase() === part.toLowerCase(),
      );
      if (!matchedKeyword) {
        return part;
      }

      return (
        <mark key={`${keyPrefix}-${index}`} className="gsj-keyword-highlight">
          {part}
        </mark>
      );
    });
  };

  const highlightNodeTree = (
    node: ReactNode,
    keywords: string[],
    keyPrefix: string,
  ): ReactNode => {
    if (typeof node === "string") {
      return highlightTextContent(node, keywords, keyPrefix);
    }

    if (Array.isArray(node)) {
      return Children.map(node, (child, index) =>
        highlightNodeTree(child, keywords, `${keyPrefix}-${index}`),
      );
    }

    if (!isValidElement<{ children?: ReactNode }>(node)) {
      return node;
    }

    const element = node;
    if (element.type === "code" || element.type === "pre") {
      return element;
    }

    return cloneElement(element, {
      children: highlightNodeTree(
        element.props.children,
        keywords,
        `${keyPrefix}-child`,
      ),
    });
  };

  const renderHighlightedInlineText = (
    text: string,
    keywords: string[],
    keyPrefix: string,
  ) => (
    <>
      {highlightTextContent(
        text,
        normalizeHighlightKeywords(keywords),
        keyPrefix,
      )}
    </>
  );

  const renderMarkdownContent = (
    content: string,
    className?: string,
    highlightKeywords: string[] = [],
  ) => {
    const normalizedKeywords = normalizeHighlightKeywords(highlightKeywords);

    return (
      <div className={className ? `gsj-markdown ${className}` : "gsj-markdown"}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            a: ({ href, children }) => (
              <a href={href} target="_blank" rel="noopener noreferrer">
                {highlightNodeTree(
                  children,
                  normalizedKeywords,
                  "markdown-link",
                )}
              </a>
            ),
            p: ({ children }) => (
              <p>
                {highlightNodeTree(children, normalizedKeywords, "markdown-p")}
              </p>
            ),
            li: ({ children }) => (
              <li>
                {highlightNodeTree(children, normalizedKeywords, "markdown-li")}
              </li>
            ),
            blockquote: ({ children }) => (
              <blockquote>
                {highlightNodeTree(
                  children,
                  normalizedKeywords,
                  "markdown-blockquote",
                )}
              </blockquote>
            ),
            h1: ({ children }) => (
              <h1>
                {highlightNodeTree(children, normalizedKeywords, "markdown-h1")}
              </h1>
            ),
            h2: ({ children }) => (
              <h2>
                {highlightNodeTree(children, normalizedKeywords, "markdown-h2")}
              </h2>
            ),
            h3: ({ children }) => (
              <h3>
                {highlightNodeTree(children, normalizedKeywords, "markdown-h3")}
              </h3>
            ),
            td: ({ children }) => (
              <td>
                {highlightNodeTree(children, normalizedKeywords, "markdown-td")}
              </td>
            ),
            th: ({ children }) => (
              <th>
                {highlightNodeTree(children, normalizedKeywords, "markdown-th")}
              </th>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  };

  const activeJourneyStatuses: JourneyStatus[] = [
    JourneyStatus.ASSESSMENT_PENDING,
    JourneyStatus.TEST_IN_PROGRESS,
    JourneyStatus.TEST_COMPLETED,
    JourneyStatus.EVALUATION_PENDING,
    JourneyStatus.ROADMAP_GENERATING,
    JourneyStatus.ROADMAP_READY,
    JourneyStatus.STUDY_PLANS_READY,
    JourneyStatus.IN_PROGRESS,
  ];

  const assessmentJourneyStatuses: JourneyStatus[] = [
    JourneyStatus.ASSESSMENT_PENDING,
    JourneyStatus.TEST_IN_PROGRESS,
    JourneyStatus.TEST_COMPLETED,
    JourneyStatus.EVALUATION_PENDING,
  ];

  const totalJourneys = journeys.length;
  const totalJourneyPages = Math.max(
    1,
    Math.ceil(totalJourneys / JOURNEYS_PER_PAGE),
  );
  const paginatedJourneys = journeys.slice(
    (currentPage - 1) * JOURNEYS_PER_PAGE,
    currentPage * JOURNEYS_PER_PAGE,
  );
  const currentPageStart =
    totalJourneys === 0 ? 0 : (currentPage - 1) * JOURNEYS_PER_PAGE + 1;
  const currentPageEnd = Math.min(
    currentPage * JOURNEYS_PER_PAGE,
    totalJourneys,
  );
  const activeJourneys = journeys.filter((journey) =>
    activeJourneyStatuses.includes(journey.status),
  ).length;
  const pausedJourneys = journeys.filter(
    (journey) => journey.status === JourneyStatus.PAUSED,
  ).length;
  const completedJourneys = journeys.filter((journey) =>
    isCompletedJourneyStatus(journey.status),
  ).length;
  const assessmentJourneys = journeys.filter((journey) =>
    assessmentJourneyStatuses.includes(journey.status),
  ).length;

  const averageProgress =
    totalJourneys === 0
      ? 0
      : Math.round(
          journeys.reduce(
            (total, journey) => total + (journey.progressPercentage || 0),
            0,
          ) / totalJourneys,
        );

  const completionRate =
    totalJourneys === 0
      ? 0
      : Math.round((completedJourneys / totalJourneys) * 100);

  const domainFrequency = journeys.reduce<Record<string, number>>(
    (acc, journey) => {
      acc[journey.domain] = (acc[journey.domain] || 0) + 1;
      return acc;
    },
    {},
  );

  const dominantDomain = Object.entries(domainFrequency).sort(
    (a, b) => b[1] - a[1],
  )[0];
  const dominantDomainLabel = dominantDomain
    ? getDomainLabel(dominantDomain[0])
    : "Chưa có dữ liệu";

  const latestActivityAt = journeys
    .map(
      (journey) =>
        journey.lastActivityAt || journey.startedAt || journey.createdAt,
    )
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];

  const latestActivityLabel = latestActivityAt
    ? new Date(latestActivityAt).toLocaleDateString("vi-VN")
    : "Chưa có hoạt động";

  const selectedJourneyActivityAt = selectedJourney
    ? selectedJourney.lastActivityAt ||
      selectedJourney.startedAt ||
      selectedJourney.createdAt
    : null;

  const selectedJourneyActivityLabel = selectedJourneyActivityAt
    ? new Date(selectedJourneyActivityAt).toLocaleDateString("vi-VN")
    : "Chưa có hoạt động";

  const selectedJourneyProgress = selectedJourney?.progressPercentage ?? 0;
  const selectedJourneyHasResult =
    Boolean(selectedJourney?.latestTestResult) ||
    selectedJourney?.assessmentTestStatus?.toUpperCase() === "COMPLETED";
  const selectedJourneyHasTest = Boolean(selectedJourney?.assessmentTestId);
  const selectedJourneyHasRoadmap = Boolean(selectedJourney?.roadmapSessionId);
  // Roadmap đã hoàn thành: có roadmap và progress đạt 100%
  const selectedJourneyHasProgress =
    selectedJourneyHasRoadmap &&
    (selectedJourneyProgress > 0 ||
      selectedJourney?.status !== JourneyStatus.IN_PROGRESS);
  const selectedJourneyRoadmapCompleted =
    selectedJourneyHasRoadmap && selectedJourneyProgress >= 100;
  const selectedJourneyStepLabel = selectedJourney
    ? [
        "Đánh giá ban đầu",
        "Phân tích kỹ năng",
        "Lộ trình học tập",
        "Học & Thực hành",
        "Thành tựu",
      ][getCurrentStepIndex(selectedJourney)]
    : "";

  const overviewMetrics = [
    {
      key: "active",
      label: "Đang hoạt động",
      value: activeJourneys,
      colorClass: "gsj-overview__bar--active",
    },
    {
      key: "completed",
      label: "Hoàn thành",
      value: completedJourneys,
      colorClass: "gsj-overview__bar--completed",
    },
    {
      key: "paused",
      label: "Tạm dừng",
      value: pausedJourneys,
      colorClass: "gsj-overview__bar--paused",
    },
  ];

  const overviewSummaryItems = selectedJourney
    ? [
        {
          key: "selected-domain",
          label: "Lĩnh vực đang xem",
          value: getDomainLabel(selectedJourney.domain),
        },
        {
          key: "selected-last-activity",
          label: "Hoạt động gần nhất",
          value: selectedJourneyActivityLabel,
        },
      ]
    : [
        {
          key: "dominant-domain",
          label: "Lĩnh vực trọng tâm",
          value: dominantDomainLabel,
        },
        {
          key: "latest-activity",
          label: "Hoạt động gần nhất",
          value: latestActivityLabel,
        },
      ];

  const overviewRows = selectedJourney
    ? [
        {
          key: "selected-progress",
          label: "Tiến độ hành trình",
          displayValue: `${selectedJourneyProgress}%`,
          ratio: selectedJourneyProgress,
          colorClass: "gsj-overview__bar--active",
          caption: `Bước hiện tại: ${selectedJourneyStepLabel}`,
        },
        {
          key: "selected-assessment",
          label: "Đánh giá đầu vào",
          displayValue: selectedJourneyHasResult
            ? "Đã hoàn thành"
            : selectedJourneyHasTest
              ? "Đang làm bài"
              : "Chưa làm",
          ratio: selectedJourneyHasResult
            ? 100
            : selectedJourneyHasTest
              ? 50
              : 0,
          colorClass: selectedJourneyHasResult
            ? "gsj-overview__bar--completed"
            : "gsj-overview__bar--active",
          caption: selectedJourneyHasResult
            ? "Đã có kết quả đánh giá."
            : selectedJourneyHasTest
              ? "Đang có bài test chưa nộp."
              : "Chưa tạo/hoàn thành bài test.",
        },
        {
          key: "selected-roadmap",
          label: "Roadmap học tập",
          displayValue: selectedJourneyHasRoadmap ? "Sẵn sàng" : "Chưa tạo",
          ratio: selectedJourneyHasRoadmap ? 100 : 0,
          colorClass: selectedJourneyHasRoadmap
            ? "gsj-overview__bar--completed"
            : "gsj-overview__bar--neutral",
          caption: selectedJourneyHasRoadmap
            ? "Có thể mở roadmap ngay."
            : "Tạo roadmap sau khi có kết quả đánh giá.",
        },
      ]
    : overviewMetrics.map((item) => {
        const ratio =
          totalJourneys === 0
            ? 0
            : Math.round((item.value / totalJourneys) * 100);
        return {
          key: item.key,
          label: item.label,
          displayValue: `${item.value}`,
          ratio,
          colorClass: item.colorClass,
          caption: `${ratio}% trên tổng số hành trình`,
        };
      });

  const overviewNote = selectedJourney
    ? selectedJourneyHasResult
      ? "Journey này đã có kết quả đánh giá. Bạn có thể tạo hoặc mở roadmap để tiếp tục."
      : selectedJourneyHasTest
        ? "Journey này đang ở bước làm bài đánh giá. Hoàn thành bài test để mở khóa roadmap."
        : "Journey này chưa có dữ liệu đánh giá. Hãy bắt đầu bài test đầu vào."
    : totalJourneys === 0
      ? "Chưa có dữ liệu hành trình. Hãy tạo hành trình đầu tiên để bắt đầu."
      : `${assessmentJourneys} hành trình đang ở giai đoạn đánh giá năng lực.`;

  // Render steps
  const renderSteps = () => {
    const steps = [
      {
        icon: FileText,
        title: "Đánh giá ban đầu",
        description: "Hoàn thành bài test đầu vào",
      },
      {
        icon: Brain,
        title: "Phân tích kỹ năng",
        description: "AI phân tích trình độ của bạn",
      },
      {
        icon: Map,
        title: "Lộ trình học tập",
        description: "Lộ trình cá nhân hóa",
      },
      {
        icon: BookOpen,
        title: "Học & Thực hành",
        description: "Theo kế hoạch cá nhân",
      },
      { icon: Award, title: "Thành tựu", description: "Chinh phục mục tiêu" },
    ];

    const currentIndex = selectedJourney
      ? getCurrentStepIndex(selectedJourney)
      : 0;

    return (
      <div className="gsj-steps">
        {steps.map((step, index) => (
          <div
            key={index}
            className={`gsj-step ${index < currentIndex ? "gsj-step--completed" : ""} ${index === currentIndex ? "gsj-step--active" : ""}`}
          >
            <div className="gsj-step__icon">
              {index < currentIndex ? (
                <CheckCircle size={20} />
              ) : (
                <step.icon size={20} />
              )}
            </div>
            <div className="gsj-step__content">
              <div className="gsj-step__title">{step.title}</div>
              <div className="gsj-step__description">{step.description}</div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render hero section
  const renderHero = () => {
    const activeHeroDomain = HERO_DOMAIN_SHOWCASE[heroSlide];

    return (
      <div className="gsj-hero">
        <div className="gsj-hero__content">
          <div className="gsj-hero__badge">
            <Sparkles size={14} />
            Hành trình học tập cá nhân hóa
          </div>
          <h1 className="gsj-hero__title">
            Đánh giá năng lực &amp; lộ trình phát triển chuyên môn
          </h1>
          <p className="gsj-hero__description">
            Khám phá trình độ hiện tại qua bài đánh giá thông minh, nhận lộ
            trình học tập được cá nhân hoá phù hợp với mục tiêu nghề nghiệp và
            kỹ năng bạn đang theo đuổi.
          </p>
          <div className="gsj-hero__actions">
            <button
              className="gsj-btn gsj-btn--primary gsj-btn--lg"
              onClick={handleCreateJourneyClick}
            >
              <Rocket size={20} />
              Tạo hành trình mới
            </button>
            {user && (
              <button
                className="gsj-btn gsj-btn--secondary gsj-btn--lg"
                onClick={handleMyJourneysButtonClick}
              >
                {viewMode === "list" ? (
                  <Map size={20} />
                ) : (
                  <ArrowLeft size={20} />
                )}
                {viewMode === "list" ? "Xem hành trình của tôi" : "Quay lại"}
              </button>
            )}
          </div>
        </div>
        <div className="gsj-hero__visual">
          <div className="gsj-hero-media">
            <div className="gsj-hero-media__header">
              <span className="gsj-hero-media__eyebrow">
                12 hình minh họa lĩnh vực
              </span>
              <h2 className="gsj-hero-media__title">
                Kho lĩnh vực đang hỗ trợ trong Journey
              </h2>
              <p className="gsj-hero-media__subtitle">
                Mỗi hình đại diện cho một nhóm chuyên môn. Khi tạo Journey, hệ
                thống sẽ ghép đúng lĩnh vực để bài đánh giá và lộ trình hiển thị
                rõ ràng, không lặp ảnh.
              </p>
            </div>
            <article
              key={activeHeroDomain.key}
              className="gsj-hero-media__stage"
            >
              <div className="gsj-hero-media__slide-frame">
                <img
                  className="gsj-hero-media__slide-image"
                  src={activeHeroDomain.image}
                  alt={`${activeHeroDomain.title}. ${activeHeroDomain.description}`}
                />
                <div className="gsj-hero-media__slide-overlay">
                  <div className="gsj-hero-media__slide-badge">
                    Slide {heroSlide + 1}/12
                  </div>
                  <h3 className="gsj-hero-media__slide-title">
                    {activeHeroDomain.title}
                  </h3>
                  <p className="gsj-hero-media__slide-desc">
                    {activeHeroDomain.description}
                  </p>
                </div>
              </div>
              <div
                className="gsj-hero-media__pager"
                aria-label="Danh sĂ¡ch lÄ©nh vá»±c"
              >
                {HERO_DOMAIN_SHOWCASE.map((domain, index) => (
                  <button
                    key={domain.key}
                    type="button"
                    className={`gsj-hero-media__pager-dot${index === heroSlide ? " gsj-hero-media__pager-dot--active" : ""}`}
                    onClick={() => setHeroSlide(index)}
                    aria-label={`Hiá»ƒn thá»‹ lÄ©nh vá»±c ${domain.title}`}
                  >
                    <span className="gsj-hero-media__pager-name">
                      {domain.title}
                    </span>
                  </button>
                ))}
              </div>
            </article>
            <div className="gsj-hero-media__grid">
              {HERO_DOMAIN_SHOWCASE.map((domain) => (
                <article
                  key={domain.key}
                  className="gsj-hero-media__domain-card"
                >
                  <div className="gsj-hero-media__domain-image-wrap">
                    <img
                      className="gsj-hero-media__domain-image"
                      src={domain.image}
                      alt={`${domain.title}. ${domain.description}`}
                    />
                  </div>
                  <div className="gsj-hero-media__domain-body">
                    <h3 className="gsj-hero-media__domain-title">
                      {domain.title}
                    </h3>
                    <p className="gsj-hero-media__domain-desc">
                      {domain.description}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render journey list
  const renderJourneyListLegacy = () => (
    <div className="gsj-journeys-section" id="journeys-section">
      <div className="gsj-section-header">
        <div className="gsj-section-header__left">
          <h2 className="gsj-section-header__title">
            <Map size={22} />
            Hành trình của bạn
          </h2>
          <p className="gsj-section-header__subtitle">
            {totalJourneys > 0
              ? `Bạn đang theo dõi ${totalJourneys} hành trình, ${activeJourneys} hành trình đang hoạt động`
              : "Bắt đầu hành trình đầu tiên của bạn"}
          </p>
        </div>
        <button
          className="gsj-btn gsj-btn--primary"
          onClick={handleCreateJourneyClick}
        >
          <Zap size={16} />
          Tạo mới
        </button>
      </div>

      {loading ? (
        <div className="gsj-loading">
          <div className="gsj-spinner"></div>
          <div className="gsj-loading__text">Đang tải hành trình...</div>
        </div>
      ) : totalJourneys === 0 ? (
        <div className="gsj-empty-state">
          <div className="gsj-empty-state__visual">
            <div className="gsj-empty-state__icon">
              <Rocket size={48} />
            </div>
          </div>
          <h3 className="gsj-empty-state__title">Sẵn sàng bắt đầu?</h3>
          <p className="gsj-empty-state__description">
            Tạo hành trình học tập đầu tiên để khám phá tiềm năng của bạn. Chúng
            tôi sẽ giúp bạn đánh giá kỹ năng và tạo lộ trình phù hợp.
          </p>
          <button
            className="gsj-btn gsj-btn--primary gsj-btn--lg"
            onClick={handleCreateJourneyClick}
          >
            <Sparkles size={18} />
            Tạo hành trình đầu tiên
          </button>
        </div>
      ) : (
        <div className="gsj-journey-grid">
          {journeys.map((journey) => (
            <div
              key={journey.id}
              className="gsj-journey-card"
              onClick={() => handleSelectJourney(journey.id)}
            >
              <div className="gsj-journey-card__header">
                <div className="gsj-journey-card__domain">
                  {getDomainImage(journey.domain) ? (
                    <div className="gsj-journey-card__domain-img">
                      <img
                        src={getDomainImage(journey.domain)}
                        alt={getDomainLabel(journey.domain)}
                      />
                    </div>
                  ) : (
                    <span className="gsj-journey-card__icon">
                      {getJourneyMonogram(journey.domain)}
                    </span>
                  )}
                  <div className="gsj-journey-card__info">
                    <span className="gsj-journey-card__name">
                      {journey.skillName ||
                        (journey.skills && journey.skills.length > 0
                          ? journey.skills[0]
                          : journey.jobRole
                            ? getJobRoleLabel(journey.jobRole, journey.domain)
                            : getDomainLabel(journey.domain))}
                    </span>
                    <span className="gsj-journey-card__sub">
                      {journey.jobRole
                        ? getJobRoleLabel(journey.jobRole, journey.domain)
                        : "Hành trình kỹ năng"}
                    </span>
                    <span className="gsj-journey-card__domain-label">
                      {getDomainLabel(journey.domain)}
                    </span>
                  </div>
                </div>
              </div>

              {journey.goal && (
                <p className="gsj-journey-card__goal">{journey.goal}</p>
              )}

              {journey.type === "SKILL" &&
                journey.skills &&
                journey.skills.length > 0 && (
                  <div className="gsj-journey-card__skills">
                    {journey.skills.slice(0, 3).map((skill, idx) => (
                      <span key={idx} className="gsj-journey-card__skill-tag">
                        {skill}
                      </span>
                    ))}
                    {journey.skills.length > 3 && (
                      <span className="gsj-journey-card__skill-more">
                        +{journey.skills.length - 3}
                      </span>
                    )}
                  </div>
                )}

              <div className="gsj-journey-card__footer">
                <div className="gsj-journey-card__progress">
                  <div className="gsj-journey-card__progress-info">
                    <span>Tiến độ</span>
                    <span>{journey.progressPercentage}%</span>
                  </div>
                  <div className="gsj-journey-card__progress-bar">
                    <div
                      className="gsj-journey-card__progress-fill"
                      style={{ width: `${journey.progressPercentage}%` }}
                    ></div>
                  </div>
                </div>
                <div className="gsj-journey-card__meta">
                  <span
                    className={`gsj-journey-card__status gsj-journey-card__status--${getStatusColor(journey.status)}`}
                  >
                    {getStatusLabel(journey.status)}
                  </span>
                  {journey.currentLevel && (
                    <span className="gsj-journey-card__level">
                      <Brain size={12} />
                      {journey.currentLevel}
                    </span>
                  )}
                  {journey.startedAt && (
                    <span className="gsj-journey-card__date">
                      <Calendar size={12} />
                      {new Date(journey.startedAt).toLocaleDateString("vi-VN")}
                    </span>
                  )}
                </div>
              </div>

              <div className="gsj-journey-card__arrow">
                <ChevronRight size={20} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderJourneyList = () => (
    <div className="gsj-journeys-section" id="journeys-section">
      <div className="gsj-section-header">
        <div className="gsj-section-header__left">
          <h2 className="gsj-section-header__title">
            <Map size={22} />
            Hành trình của bạn
          </h2>
          <p className="gsj-section-header__subtitle">
            {totalJourneys > 0
              ? `Bạn đang theo dõi ${totalJourneys} hành trình, ${activeJourneys} hành trình đang hoạt động`
              : "Bắt đầu hành trình đầu tiên của bạn"}
          </p>
        </div>
        <div className="gsj-section-header__actions">
          {totalJourneys > 0 && (
            <span className="gsj-journey-pagination__summary">
              Hiển thị {currentPageStart}-{currentPageEnd} trên {totalJourneys}{" "}
              hành trình
            </span>
          )}
          <button
            className="gsj-btn gsj-btn--primary"
            onClick={handleCreateJourneyClick}
          >
            <Zap size={16} />
            Tạo mới
          </button>
        </div>
      </div>

      {loading ? (
        <div className="gsj-loading">
          <div className="gsj-spinner"></div>
          <div className="gsj-loading__text">Đang tải hành trình...</div>
        </div>
      ) : totalJourneys === 0 ? (
        <div className="gsj-empty-state">
          <div className="gsj-empty-state__visual">
            <div className="gsj-empty-state__icon">
              <Rocket size={48} />
            </div>
          </div>
          <h3 className="gsj-empty-state__title">Sẵn sàng bắt đầu?</h3>
          <p className="gsj-empty-state__description">
            Tạo hành trình học tập đầu tiên để khám phá tiềm năng của bạn. Chúng
            tôi sẽ giúp bạn đánh giá kỹ năng và tạo lộ trình phù hợp.
          </p>
          <button
            className="gsj-btn gsj-btn--primary gsj-btn--lg"
            onClick={handleCreateJourneyClick}
          >
            <Sparkles size={18} />
            Tạo hành trình đầu tiên
          </button>
        </div>
      ) : (
        <>
          <div className="gsj-journey-grid">
            {paginatedJourneys.map((journey) => {
              const journeyLabel = journey.jobRole
                ? getJobRoleLabel(journey.jobRole, journey.domain)
                : getDomainLabel(journey.domain);

              return (
                <div
                  key={journey.id}
                  className="gsj-journey-card"
                  onClick={() => handleSelectJourney(journey.id)}
                >
                  <div className="gsj-journey-card__header">
                    <div className="gsj-journey-card__domain">
                      {getDomainImage(journey.domain) ? (
                        <div className="gsj-journey-card__domain-img">
                          <img
                            src={getDomainImage(journey.domain)}
                            alt={getDomainLabel(journey.domain)}
                          />
                        </div>
                      ) : (
                        <span className="gsj-journey-card__icon">
                          {getJourneyMonogram(journey.domain)}
                        </span>
                      )}
                      <div className="gsj-journey-card__info">
                        <span className="gsj-journey-card__name">
                          {journey.skillName ||
                            (journey.skills && journey.skills.length > 0
                              ? journey.skills[0]
                              : journeyLabel)}
                        </span>
                        <span className="gsj-journey-card__sub">
                          {journeyLabel}
                        </span>
                        <span className="gsj-journey-card__domain-label">
                          {getDomainLabel(journey.domain)}
                        </span>
                      </div>
                    </div>
                    <div className="gsj-journey-card__header-actions">
                      <button
                        type="button"
                        className="gsj-journey-card__delete"
                        onClick={(event) => {
                          if (journey.hasActiveMentorBooking) {
                            showWarning(
                              "Không thể xóa",
                              "Hành trình đã được book mentor. Bạn cần hoàn thành lộ trình học và giải phóng tiền cho mentor trước.",
                            );
                            return;
                          }
                          handleDeleteJourney(journey.id, {
                            event,
                            journeyLabel: `"${journeyLabel}"`,
                          });
                        }}
                        disabled={actionLoading}
                        title={
                          journey.hasActiveMentorBooking
                            ? "Không thể xóa — đã book mentor"
                            : "Xóa hành trình"
                        }
                        aria-label={`Xóa hành trình ${journeyLabel}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {journey.goal && (
                    <p className="gsj-journey-card__goal">{journey.goal}</p>
                  )}

                  {journey.type === "SKILL" &&
                    journey.skills &&
                    journey.skills.length > 0 && (
                      <div className="gsj-journey-card__skills">
                        {journey.skills.slice(0, 3).map((skill, idx) => (
                          <span
                            key={idx}
                            className="gsj-journey-card__skill-tag"
                          >
                            {skill}
                          </span>
                        ))}
                        {journey.skills.length > 3 && (
                          <span className="gsj-journey-card__skill-more">
                            +{journey.skills.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                  <div className="gsj-journey-card__footer">
                    <div className="gsj-journey-card__progress">
                      <div className="gsj-journey-card__progress-info">
                        <span>Tiến độ</span>
                        <span>{journey.progressPercentage}%</span>
                      </div>
                      <div className="gsj-journey-card__progress-bar">
                        <div
                          className="gsj-journey-card__progress-fill"
                          style={{ width: `${journey.progressPercentage}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="gsj-journey-card__meta">
                      <span
                        className={`gsj-journey-card__status gsj-journey-card__status--${getStatusColor(journey.status)}`}
                      >
                        {getStatusLabel(journey.status)}
                      </span>
                      {journey.currentLevel && (
                        <span className="gsj-journey-card__level">
                          <Brain size={12} />
                          {journey.currentLevel}
                        </span>
                      )}
                      {journey.startedAt && (
                        <span className="gsj-journey-card__date">
                          <Calendar size={12} />
                          {new Date(journey.startedAt).toLocaleDateString(
                            "vi-VN",
                          )}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="gsj-journey-card__arrow">
                    <ChevronRight size={20} />
                  </div>
                </div>
              );
            })}
          </div>

          {totalJourneyPages > 1 && (
            <div className="gsj-pagination">
              <button
                type="button"
                className="gsj-btn gsj-btn--secondary gsj-pagination__nav"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ArrowLeft size={16} />
                Trước
              </button>

              <div className="gsj-pagination__pages">
                {Array.from(
                  { length: totalJourneyPages },
                  (_, index) => index + 1,
                ).map((pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    className={`gsj-pagination__page${pageNumber === currentPage ? " gsj-pagination__page--active" : ""}`}
                    onClick={() => setCurrentPage(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                ))}
              </div>

              <button
                type="button"
                className="gsj-btn gsj-btn--secondary gsj-pagination__nav"
                onClick={() =>
                  setCurrentPage((prev) =>
                    Math.min(totalJourneyPages, prev + 1),
                  )
                }
                disabled={currentPage === totalJourneyPages}
              >
                Sau
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );

  // Render detail view
  const renderDetailView = () => {
    if (!selectedJourney) return null;

    const assessmentStatus =
      selectedJourney.assessmentTestStatus?.toUpperCase() || "";
    const hasGeneratedTest = Boolean(selectedJourney.assessmentTestId);
    const hasTestInProgress =
      assessmentStatus === "PENDING" ||
      assessmentStatus === "IN_PROGRESS" ||
      selectedJourney.status === JourneyStatus.TEST_IN_PROGRESS;
    const hasAssessmentResult =
      !hasTestInProgress &&
      (Boolean(selectedJourney.latestTestResult) ||
        assessmentStatus === "COMPLETED");
    const primaryAssessmentLabel =
      hasGeneratedTest || hasTestInProgress
        ? "Vào làm bài đánh giá"
        : "Tạo và bắt đầu bài đánh giá";
    const primaryAssessmentLoadingLabel =
      actionMode === "opening-test"
        ? "Đang mở bài test..."
        : "Đang tạo bài test...";
    const latestResultId = selectedJourney.latestTestResult?.resultId;
    const assessmentAttemptCount =
      selectedJourney.assessmentAttemptCount ??
      (hasGeneratedTest || hasAssessmentResult ? 1 : 0);
    const maxAssessmentAttempts = selectedJourney.maxAssessmentAttempts ?? 2;
    const remainingAssessmentRetakes =
      selectedJourney.remainingAssessmentRetakes ??
      Math.max(0, maxAssessmentAttempts - assessmentAttemptCount);

    const canTakeTest =
      !hasAssessmentResult &&
      (selectedJourney.status === JourneyStatus.ASSESSMENT_PENDING ||
        selectedJourney.status === JourneyStatus.NOT_STARTED ||
        hasGeneratedTest ||
        hasTestInProgress);
    const canViewLatestResult = Boolean(latestResultId);
    const canRetakeQuiz =
      hasAssessmentResult &&
      !hasTestInProgress &&
      remainingAssessmentRetakes > 0;
    const canGenerateRoadmap =
      hasAssessmentResult && !selectedJourney.roadmapSessionId;
    const isPaused = selectedJourney.status === JourneyStatus.PAUSED;
    const roleTitle = getJobRoleLabel(
      selectedJourney.jobRole,
      selectedJourney.domain,
    );
    const scopeLabel = getJourneyScopeLabel(selectedJourney);
    const domainLabel = getDomainLabel(selectedJourney.domain);
    const latestAssessmentLabel = selectedJourney.latestTestResult?.evaluatedAt
      ? formatDateTime(selectedJourney.latestTestResult.evaluatedAt)
      : "Chưa có kết quả";

    return (
      <div className="gsj-detail">
        <div className="gsj-card">
          <div className="gsj-detail__header">
            <div className="gsj-detail__toolbar">
              <button
                className="gsj-detail__back-btn"
                onClick={() => {
                  setViewMode("list");
                  setCurrentTest(null);
                  setCurrentResult(null);
                }}
              >
                <ArrowLeft size={16} />
                Quay lại danh sách
              </button>
              <div className="gsj-detail__badge">
                <span className="gsj-chip gsj-chip--primary">
                  {getStatusLabel(selectedJourney.status)}
                </span>
              </div>
            </div>
            <div className="gsj-detail__domain">
              {getDomainImage(selectedJourney.domain) ? (
                <div className="gsj-detail__domain-img">
                  <img
                    src={getDomainImage(selectedJourney.domain)}
                    alt={domainLabel}
                  />
                </div>
              ) : (
                <span className="gsj-detail__domain-icon">
                  {getJourneyMonogram(selectedJourney.domain)}
                </span>
              )}
              <div className="gsj-detail__identity">
                <h2 className="gsj-detail__title">{roleTitle}</h2>
                <p className="gsj-detail__sub">{scopeLabel}</p>
                <p className="gsj-detail__domain-text">{domainLabel}</p>
              </div>
            </div>
            {selectedJourney.goal && (
              <p className="gsj-detail__goal">
                <Target size={14} />
                {selectedJourney.goal}
              </p>
            )}
            <div className="gsj-detail__meta">
              {selectedJourney.currentLevel && (
                <span className="gsj-chip">
                  <Brain size={14} />
                  {selectedJourney.currentLevel}
                </span>
              )}
            </div>
            <div className="gsj-detail__summary-grid">
              <article className="gsj-detail__summary-card">
                <span className="gsj-detail__summary-label">
                  Tiến độ hiện tại
                </span>
                <strong className="gsj-detail__summary-value">
                  {selectedJourney.progressPercentage || 0}%
                </strong>
                <span className="gsj-detail__summary-note">
                  Bước hiện tại: {selectedJourneyStepLabel}
                </span>
              </article>
              <article className="gsj-detail__summary-card">
                <span className="gsj-detail__summary-label">
                  Đánh giá gần nhất
                </span>
                <strong className="gsj-detail__summary-value">
                  {latestAssessmentLabel}
                </strong>
                <span className="gsj-detail__summary-note">
                  {hasAssessmentResult
                    ? "Đã có kết quả để xem lại."
                    : "Hoàn thành bài test để nhận phân tích."}
                </span>
              </article>
              <article className="gsj-detail__summary-card">
                <span className="gsj-detail__summary-label">
                  Roadmap học tập
                </span>
                <strong className="gsj-detail__summary-value">
                  {selectedJourney.roadmapSessionId ? "Sẵn sàng" : "Chưa tạo"}
                </strong>
                <span className="gsj-detail__summary-note">
                  {selectedJourney.roadmapSessionId
                    ? "Có thể mở và tiếp tục ngay."
                    : "Tạo roadmap sau khi có đánh giá."}
                </span>
              </article>
            </div>
          </div>
          {renderSteps()}
        </div>

        {/* Action Buttons */}
        <div className="gsj-card gsj-mt-24">
          <div className="gsj-card__body">
            <div className="gsj-assessment-meta gsj-mb-16">
              <div className="gsj-assessment-meta__item">
                <span className="gsj-assessment-meta__label">Lượt đã dùng</span>
                <span className="gsj-assessment-meta__value">
                  {assessmentAttemptCount}/{maxAssessmentAttempts}
                </span>
              </div>
              <div className="gsj-assessment-meta__item">
                <span className="gsj-assessment-meta__label">
                  Lượt tạo lại còn
                </span>
                <span className="gsj-assessment-meta__value">
                  {remainingAssessmentRetakes}
                </span>
              </div>
              <div className="gsj-assessment-meta__item">
                <span className="gsj-assessment-meta__label">
                  Kết quả gần nhất
                </span>
                <span className="gsj-assessment-meta__value">
                  {latestAssessmentLabel}
                </span>
              </div>
            </div>

            {selectedJourney.status === JourneyStatus.AWAITING_VERIFICATION && (
              <div className="gsj-mb-16">
                <div className="gsj-info-banner">
                  ⏳ Hành trình đang chờ mentor xác thực. Khi mentor đã PASS,
                  bạn có thể hoàn thành hành trình.
                </div>
                <JourneyOutputAssessmentPanel journeyId={selectedJourney.id} />
                <JourneyVerificationDossier
                  journeyId={selectedJourney.id}
                  journeyTitle={selectedJourney.goal}
                />
                <NodeVerificationGate
                  journeyId={selectedJourney.id}
                  onCompleteClick={handleCompleteJourney}
                />
              </div>
            )}

            {(selectedJourney.status === JourneyStatus.COMPLETED_VERIFIED ||
              selectedJourney.status ===
                JourneyStatus.COMPLETED_UNVERIFIED) && (
              <div className="gsj-mb-16">
                <JourneyVerificationDossier
                  journeyId={selectedJourney.id}
                  journeyTitle={selectedJourney.goal}
                />
              </div>
            )}

            {/* Mentor suggestion: button-triggered, lazy fetch */}

            {!isCompletedJourneyStatus(selectedJourney.status) &&
              selectedJourney.status !== JourneyStatus.AWAITING_VERIFICATION &&
              selectedJourneyHasProgress && (
                <div className="gsj-mb-16">

                  {!selectedJourney.finalVerificationRequired &&
                    selectedJourneyRoadmapCompleted && (
                      <button
                        className="gsj-btn gsj-btn--primary gsj-btn--full gsj-mt-12"
                        onClick={handleCompleteJourney}
                        disabled={actionLoading}
                      >
                        {actionLoading ? (
                          <>
                            <RefreshCw size={16} className="gsj-spin" />
                            Đang hoàn thành journey...
                          </>
                        ) : (
                          <>
                            <CheckCircle size={16} />
                            Hoàn thành journey
                          </>
                        )}
                      </button>
                    )}
                </div>
              )}

            {canTakeTest && (
              <button
                className="gsj-btn gsj-btn--primary gsj-btn--full gsj-mb-16"
                onClick={handleStartAssessment}
                disabled={actionLoading}
                title={
                  actionLoading
                    ? primaryAssessmentLoadingLabel
                    : primaryAssessmentLabel
                }
              >
                {actionLoading ? (
                  <>
                    <RefreshCw size={16} className="gsj-spin" />
                    Đang tạo bài test...
                  </>
                ) : (
                  <>
                    <Brain size={16} />
                    Bắt đầu làm bài đánh giá
                  </>
                )}
              </button>
            )}

            {canViewLatestResult && (
              <button
                className="gsj-btn gsj-btn--secondary gsj-btn--full gsj-mb-16"
                onClick={handleViewLatestResult}
                disabled={actionLoading}
              >
                <FileText size={16} />
                Xem lại kết quả quiz
              </button>
            )}

            {canRetakeQuiz && (
              <button
                className="gsj-btn gsj-btn--secondary gsj-btn--full gsj-mb-16"
                onClick={handleGenerateTest}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <>
                    <RefreshCw size={16} className="gsj-spin" />
                    Đang tạo bài quiz mới...
                  </>
                ) : (
                  <>
                    <RefreshCw size={16} />
                    Tạo lại quiz ({remainingAssessmentRetakes} lượt còn lại)
                  </>
                )}
              </button>
            )}

            {canGenerateRoadmap && (
              <button
                className="gsj-btn gsj-btn--primary gsj-btn--full gsj-mb-16"
                onClick={handleGenerateRoadmap}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <>
                    <RefreshCw size={16} className="gsj-spin" />
                    Đang tạo lộ trình...
                  </>
                ) : (
                  <>
                    <Map size={16} />
                    Tạo lộ trình học tập
                  </>
                )}
              </button>
            )}

            {(selectedJourney.status === JourneyStatus.IN_PROGRESS ||
              selectedJourney.status === JourneyStatus.ROADMAP_READY ||
              selectedJourney.status === JourneyStatus.STUDY_PLANS_READY ||
              selectedJourney.status === JourneyStatus.PAUSED) && (
              <button
                className="gsj-btn gsj-btn--secondary gsj-btn--full gsj-mb-16"
                onClick={handleTogglePause}
                disabled={actionLoading}
              >
                {isPaused ? (
                  <>
                    <Play size={16} />
                    Tiếp tục hành trình
                  </>
                ) : (
                  <>
                    <Pause size={16} />
                    Tạm dừng
                  </>
                )}
              </button>
            )}

            {selectedJourney.roadmapSessionId && (
              <button
                className="gsj-btn gsj-btn--secondary gsj-btn--full"
                onClick={() =>
                  navigate(`/roadmap/${selectedJourney.roadmapSessionId}`, {
                    state: { journeyId: selectedJourney.id },
                  })
                }
              >
                <Map size={16} />
                Xem lộ trình
              </button>
            )}

            <button
              className="gsj-btn gsj-btn--danger gsj-btn--full gsj-mt-16"
              onClick={() => {
                if (selectedJourney.hasActiveMentorBooking) {
                  showWarning(
                    "Không thể xóa",
                    "Hành trình đã được book mentor. Bạn cần hoàn thành lộ trình học và giải phóng tiền cho mentor trước.",
                  );
                  return;
                }
                handleDeleteJourney(selectedJourney.id, {
                  journeyLabel: `"${roleTitle}"`,
                  fromDetail: true,
                });
              }}
              disabled={
                actionLoading || !!selectedJourney.hasActiveMentorBooking
              }
              title={
                selectedJourney.hasActiveMentorBooking
                  ? "Không thể xóa — đã book mentor"
                  : "Xóa hành trình"
              }
            >
              <Trash2 size={16} />
              {selectedJourney.hasActiveMentorBooking
                ? "Đã book mentor — không thể xóa"
                : "Xóa hành trình"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render test taking view
  const renderTestView = () => (
    <GSJTestTaking
      test={currentTest!}
      onSubmit={handleSubmitTest}
      onBack={() => setViewMode("detail")}
      loading={actionLoading}
    />
  );

  // Render result view
  const renderResultViewLegacy = () => {
    if (!currentResult) return null;
    const cr = currentResult;
    const completionRate =
      cr.totalQuestions > 0
        ? Math.round((cr.answeredQuestions / cr.totalQuestions) * 100)
        : 0;
    const correctRate =
      cr.totalQuestions > 0
        ? Math.round((cr.correctAnswers / cr.totalQuestions) * 100)
        : 0;

    return (
      <div className="gsj-card">
        <div className="gsj-card__header">
          <h3 className="gsj-card__title">
            <Award size={20} />
            Kết quả đánh giá
          </h3>
        </div>
        <div className="gsj-card__body">
          {/* Score */}
          <div
            className={`gsj-result-score ${currentResult.passed ? "gsj-result-score--pass" : "gsj-result-score--fail"}`}
          >
            <div className="gsj-result-score__value">
              {currentResult.score}%
            </div>
            <div className="gsj-result-score__label">
              {currentResult.passed
                ? "Chúc mừng! Bạn đã pass!"
                : "Cần cố gắng thêm"}
            </div>
          </div>

          <div className="gsj-result-score__meta">
            <span className="gsj-result-chip">
              {getSkillLevelLabel(currentResult.evaluatedLevel)}
            </span>
            <span className="gsj-result-chip">
              {currentResult.scoreBandLabel}
            </span>
            <span className="gsj-result-chip">
              {currentResult.recommendationLabel}
            </span>
          </div>

          <div className="gsj-result-metrics">
            <div className="gsj-result-metric-card">
              <span className="gsj-result-metric-card__label">Đúng</span>
              <span className="gsj-result-metric-card__value">
                {currentResult.correctAnswers}/{currentResult.totalQuestions}
              </span>
            </div>
            <div className="gsj-result-metric-card">
              <span className="gsj-result-metric-card__label">Sai</span>
              <span className="gsj-result-metric-card__value">
                {currentResult.incorrectAnswers}
              </span>
            </div>
            <div className="gsj-result-metric-card">
              <span className="gsj-result-metric-card__label">Độ tin cậy</span>
              <span className="gsj-result-metric-card__value">
                {currentResult.assessmentConfidence}%
              </span>
            </div>
          </div>

          <div className="gsj-result-progress-block">
            <div className="gsj-result-progress-block__header">
              <span>Tiến độ trả lời</span>
              <span>{completionRate}%</span>
            </div>
            <div className="gsj-result-progress-block__track">
              <div
                className="gsj-result-progress-block__fill gsj-result-progress-block__fill--completion"
                style={{ width: `${completionRate}%` }}
              ></div>
            </div>
          </div>

          <div className="gsj-result-progress-block">
            <div className="gsj-result-progress-block__header">
              <span>Tỷ lệ chính xác</span>
              <span>{correctRate}%</span>
            </div>
            <div className="gsj-result-progress-block__track">
              <div
                className="gsj-result-progress-block__fill gsj-result-progress-block__fill--accuracy"
                style={{ width: `${correctRate}%` }}
              ></div>
            </div>
          </div>

          {currentResult.reassessmentRecommended && (
            <div className="gsj-result-alert">
              <Lightbulb size={16} />
              <span>
                Khuyến nghị làm lại bài đánh giá sau giai đoạn học đầu để tối ưu
                lộ trình.
              </span>
            </div>
          )}

          {/* Summary */}
          <div className="gsj-mb-24">
            <h4 className="gsj-text-primary gsj-mb-8">Tổng kết</h4>
            <p className="gsj-text-secondary">
              {currentResult.evaluationSummary}
            </p>
          </div>

          {/* Skill Analysis */}
          {currentResult.skillAnalysis.length > 0 && (
            <div className="gsj-skill-analysis">
              <h4 className="gsj-text-primary gsj-mb-16">Phân tích kỹ năng</h4>
              {currentResult.skillAnalysis.map((skill, index) => (
                <div key={index} className="gsj-skill-item">
                  <span className="gsj-skill-item__name">
                    {skill.skillName}
                  </span>
                  <span
                    className={`gsj-skill-item__level gsj-skill-item__level--${
                      skill.currentLevel === SkillLevel.BEGINNER
                        ? "beginner"
                        : skill.currentLevel === SkillLevel.ELEMENTARY
                          ? "intermediate"
                          : "advanced"
                    }`}
                  >
                    {skill.currentLevel}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Strengths & Weaknesses */}
          <div className="gsj-flex gsj-gap-16 gsj-mt-24">
            <div className="gsj-flex-1">
              <h4 className="gsj-text-success gsj-mb-8">Điểm mạnh</h4>
              <ul className="gsj-text-secondary">
                {(currentResult.overallStrengths.length > 0
                  ? currentResult.overallStrengths
                  : ["Chưa có nhóm nổi bật rõ rệt."]
                ).map((strength, i) => (
                  <li key={i} className="gsj-mb-8">
                    + {strength}
                  </li>
                ))}
              </ul>
            </div>
            <div className="gsj-flex-1">
              <h4 className="gsj-text-warning gsj-mb-8">Cần cải thiện</h4>
              <ul className="gsj-text-secondary">
                {(currentResult.overallWeaknesses.length > 0
                  ? currentResult.overallWeaknesses
                  : ["Chưa có dữ liệu cần cải thiện."]
                ).map((weakness, i) => (
                  <li key={i} className="gsj-mb-8">
                    - {weakness}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Actions */}
          <div className="gsj-flex gsj-gap-12 gsj-mt-24">
            <button
              className="gsj-btn gsj-btn--primary"
              onClick={handleGenerateRoadmap}
              disabled={actionLoading}
            >
              <Map size={16} />
              Tạo lộ trình
            </button>
            <button
              className="gsj-btn gsj-btn--secondary"
              onClick={() => setViewMode("detail")}
            >
              Quay lại
            </button>
          </div>
        </div>
      </div>
    );
  };

  void renderResultViewLegacy;

  const renderResultView = () => {
    if (!currentResult) return null;

    const correctRate =
      currentResult.totalQuestions > 0
        ? Math.round(
            (currentResult.correctAnswers / currentResult.totalQuestions) * 100,
          )
        : 0;

    const latestResultAt =
      selectedJourney?.latestTestResult?.evaluatedAt || currentResult.createdAt;
    const remainingRetakes = selectedJourney?.remainingAssessmentRetakes ?? 0;
    const hasRoadmap = Boolean(selectedJourney?.roadmapSessionId);
    const canRetakeQuiz =
      remainingRetakes > 0 &&
      selectedJourney?.assessmentTestStatus?.toUpperCase() !== "IN_PROGRESS";
    const activeScoreBandFramework = resolveScoreBandFrameworkItem(
      currentResult.scoreBand,
      currentResult.score,
    );
    const activeLevelFramework = resolveLevelFrameworkItem(
      currentResult.evaluatedLevel,
      currentResult.score,
    );

    const questionPreviewLimit = 10;
    const totalQuestionReviews = currentResult.questionReviews.length;
    const hasHiddenQuestionReviews =
      totalQuestionReviews > questionPreviewLimit;
    const visibleQuestionReviews = showAllQuestionReviews
      ? currentResult.questionReviews
      : currentResult.questionReviews.slice(0, questionPreviewLimit);

    return (
      <div className="gsj-card">
        <div className="gsj-card__header">
          <h3 className="gsj-card__title">
            <Award size={20} />
            Kết quả đánh giá
          </h3>
          <span className="gsj-result-header-time">
            {formatDateTime(latestResultAt)}
          </span>
        </div>

        <div className="gsj-card__body">
          {/* ── Hero Score ── */}
          <div
            className={`gsj-result-hero ${currentResult.passed ? "gsj-result-hero--pass" : "gsj-result-hero--fail"}`}
          >
            <div className="gsj-result-hero__score-wrap">
              <div className="gsj-result-hero__score">
                {currentResult.score}
                <span className="gsj-result-hero__pct">%</span>
              </div>
              <div className="gsj-result-hero__formula">
                {currentResult.correctAnswers}/{currentResult.totalQuestions}{" "}
                câu đúng
              </div>
            </div>
            <div className="gsj-result-hero__right">
              <div
                className={`gsj-result-hero__level-badge gsj-result-hero__level-badge--${getSkillLevelClass(currentResult.evaluatedLevel)}`}
              >
                {getSkillLevelLabel(currentResult.evaluatedLevel)}
              </div>
              <div className="gsj-result-hero__pills">
                <span className="gsj-result-pill">
                  {currentResult.scoreBandLabel}
                </span>
                <span className="gsj-result-pill">
                  {currentResult.recommendationLabel}
                </span>
              </div>
              <p className="gsj-result-hero__verdict">
                {currentResult.passed
                  ? "✓ Đạt ngưỡng đánh giá"
                  : "✗ Cần củng cố thêm kiến thức"}
              </p>
            </div>
          </div>

          {/* ── KPI Row ── */}
          <div className="gsj-result-kpi-grid">
            <div className="gsj-result-kpi-card gsj-result-kpi-card--correct">
              <div className="gsj-result-kpi-card__value">
                {currentResult.correctAnswers}
              </div>
              <div className="gsj-result-kpi-card__label">Câu đúng</div>
            </div>
            <div className="gsj-result-kpi-card gsj-result-kpi-card--wrong">
              <div className="gsj-result-kpi-card__value">
                {currentResult.incorrectAnswers}
              </div>
              <div className="gsj-result-kpi-card__label">Câu sai</div>
            </div>
            <div className="gsj-result-kpi-card">
              <div className="gsj-result-kpi-card__value">
                {currentResult.totalQuestions}
              </div>
              <div className="gsj-result-kpi-card__label">Tổng câu</div>
            </div>
          </div>

          {/* ── Accuracy bar ── */}
          <div className="gsj-result-acc-bar">
            <div className="gsj-result-acc-bar__head">
              <span>Tỷ lệ chính xác</span>
              <strong>{correctRate}%</strong>
            </div>
            <div className="gsj-result-acc-bar__track">
              <div
                className="gsj-result-acc-bar__fill"
                style={{ width: `${correctRate}%` }}
              />
            </div>
          </div>

          {/* ── Level Framework ── */}
          <section className="gsj-result-levels">
            <h4 className="gsj-result-levels__title">Thang mức năng lực</h4>
            <div className="gsj-result-levels__grid">
              {LEVEL_FRAMEWORK.map((item) => {
                const isActive = activeLevelFramework.key === item.key;
                return (
                  <div
                    key={item.key}
                    className={`gsj-result-level-row ${isActive ? "gsj-result-level-row--active" : ""}`}
                  >
                    <div className="gsj-result-level-row__dot" />
                    <div className="gsj-result-level-row__info">
                      <strong>{getSkillLevelLabel(item.key)}</strong>
                      <span>{item.range}</span>
                    </div>
                    {isActive && (
                      <span className="gsj-result-level-row__you">Bạn</span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── Skill breakdown (nếu có) ── */}
          {currentResult.skillAnalysis.length > 0 && (
            <section className="gsj-result-skills">
              <h4 className="gsj-result-skills__title">
                <Activity size={16} />
                Phân tích theo nhóm kỹ năng
              </h4>
              <div className="gsj-result-skills__grid">
                {currentResult.skillAnalysis.map((skill, index) => (
                  <div
                    key={`skill-${index}`}
                    className={`gsj-result-skill-chip ${skill.gap < 0 ? "gsj-result-skill-chip--weak" : "gsj-result-skill-chip--strong"}`}
                  >
                    <span className="gsj-result-skill-chip__name">
                      {skill.skillName}
                    </span>
                    <span className="gsj-result-skill-chip__level">
                      {getSkillLevelLabel(skill.currentLevel)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Quiz Review ── */}
          {currentResult.questionReviews.length > 0 && (
            <section className="gsj-result-quiz">
              <div className="gsj-result-quiz__header">
                <h4 className="gsj-result-quiz__title">
                  <BookOpen size={16} />
                  Chi tiết từng câu hỏi
                </h4>
                <span className="gsj-result-quiz__counter">
                  {visibleQuestionReviews.length}/{totalQuestionReviews}
                </span>
              </div>

              <div className="gsj-result-quiz__legend">
                <span>
                  <span className="gsj-rq-dot gsj-rq-dot--user" />
                  Bạn chọn
                </span>
                <span>
                  <span className="gsj-rq-dot gsj-rq-dot--correct" />
                  Đáp án đúng
                </span>
              </div>

              <div className="gsj-result-quiz__list">
                {visibleQuestionReviews.map((question, index) => {
                  const userKey = extractOptionKey(question.userAnswer);
                  const correctKey = extractOptionKey(question.correctAnswer);
                  return (
                    <article
                      key={`q-${question.questionId}-${index}`}
                      className={`gsj-rq-item ${question.isCorrect ? "gsj-rq-item--correct" : "gsj-rq-item--wrong"}`}
                    >
                      <div className="gsj-rq-item__head">
                        <div className="gsj-rq-item__meta">
                          <span className="gsj-rq-item__num">#{index + 1}</span>
                          {question.skillArea && (
                            <span className="gsj-rq-item__tag">
                              {question.skillArea}
                            </span>
                          )}
                          {question.difficulty && (
                            <span className="gsj-rq-item__tag">
                              {question.difficulty}
                            </span>
                          )}
                        </div>
                        <span
                          className={`gsj-rq-item__badge ${question.isCorrect ? "gsj-rq-item__badge--correct" : "gsj-rq-item__badge--wrong"}`}
                        >
                          {question.isCorrect ? (
                            <>
                              <CheckCircle size={12} />
                              Đúng
                            </>
                          ) : (
                            <>
                              <X size={12} />
                              Sai
                            </>
                          )}
                        </span>
                      </div>

                      <p className="gsj-rq-item__question">
                        {question.question}
                      </p>

                      {question.options.length > 0 && (
                        <div className="gsj-rq-item__options">
                          {question.options.map((option, oi) => {
                            const key = toOptionLabel(oi);
                            const isSelected = key === userKey;
                            const isCorrect = key === correctKey;
                            return (
                              <div
                                key={`opt-${question.questionId}-${key}`}
                                className={`gsj-rq-option${isCorrect ? " gsj-rq-option--correct" : ""}${isSelected && !isCorrect ? " gsj-rq-option--wrong-pick" : ""}${isSelected && isCorrect ? " gsj-rq-option--correct-pick" : ""}`}
                              >
                                <span className="gsj-rq-option__key">
                                  {key}
                                </span>
                                <span className="gsj-rq-option__text">
                                  {option}
                                </span>
                                <span className="gsj-rq-option__flags">
                                  {isSelected && (
                                    <span className="gsj-rq-flag gsj-rq-flag--user">
                                      <Target size={10} />
                                      Bạn chọn
                                    </span>
                                  )}
                                  {isCorrect && (
                                    <span className="gsj-rq-flag gsj-rq-flag--correct">
                                      <CheckCircle size={10} />
                                      Đáp án đúng
                                    </span>
                                  )}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {question.explanation && (
                        <details
                          className="gsj-rq-item__explain"
                          open={!question.isCorrect}
                        >
                          <summary>Giải thích</summary>
                          <div className="gsj-rq-item__explain-body">
                            {renderMarkdownContent(
                              normalizeMarkdownText(question.explanation, ""),
                              "gsj-rq-item__markdown",
                            )}
                          </div>
                        </details>
                      )}
                    </article>
                  );
                })}
              </div>

              {hasHiddenQuestionReviews && (
                <button
                  type="button"
                  className="gsj-btn gsj-btn--secondary gsj-result-review-toggle"
                  onClick={() => setShowAllQuestionReviews((prev) => !prev)}
                >
                  {showAllQuestionReviews
                    ? "Thu gọn"
                    : `Xem tất cả ${totalQuestionReviews} câu`}
                </button>
              )}
            </section>
          )}

          {/* ── Actions ── */}
          <div className="gsj-result-actions">
            {!hasRoadmap && (
              <button
                className="gsj-btn gsj-btn--primary"
                onClick={handleGenerateRoadmap}
                disabled={actionLoading}
              >
                <Map size={16} />
                {actionLoading
                  ? "Đang tạo lộ trình..."
                  : "Tạo lộ trình học tập"}
              </button>
            )}
            {hasRoadmap && selectedJourney?.roadmapSessionId && (
              <button
                className="gsj-btn gsj-btn--primary"
                onClick={() =>
                  navigate(`/roadmap/${selectedJourney.roadmapSessionId}`, {
                    state: { journeyId: selectedJourney.id },
                  })
                }
              >
                <Map size={16} />
                Xem lộ trình hiện tại
              </button>
            )}
            {canRetakeQuiz && (
              <button
                className="gsj-btn gsj-btn--secondary"
                onClick={handleGenerateTest}
                disabled={actionLoading}
              >
                <RefreshCw size={16} />
                Tạo lại quiz ({remainingRetakes} lượt)
              </button>
            )}
            <button
              className="gsj-btn gsj-btn--secondary"
              onClick={() => setViewMode("detail")}
            >
              Quay lại Journey
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="gsj-page">
      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        title="Đăng nhập để dùng Journey"
        message="Tạo hành trình, làm test đánh giá và theo dõi tiến trình phát triển sự nghiệp sau khi đăng nhập"
        feature="Journey"
      />

      {bookingMentor && selectedJourney && (
        <BookingModal
          isOpen={true}
          onClose={() => setBookingMentor(null)}
          mentorId={String(bookingMentor.id)}
          mentorName={`${bookingMentor.firstName ?? ""} ${bookingMentor.lastName ?? ""}`.trim()}
          hourlyRate={bookingMentor.hourlyRate ?? 0}
          journeyContext={{
            journeyId: selectedJourney.id,
            bookingType: "JOURNEY_MENTORING",
          }}
        />
      )}

      <div className="gsj-container">
        {/* Hero Section */}
        {renderHero()}

        {toast && (
          <Toast
            type={toast.type}
            title={toast.title}
            message={toast.message}
            isVisible={isVisible}
            onClose={hideToast}
            autoCloseDelay={toast.autoCloseDelay}
            showCountdown={toast.showCountdown}
            countdownText={toast.countdownText}
            useOverlay={toast.useOverlay}
            actionButton={toast.actionButton}
            secondaryActionButton={toast.secondaryActionButton}
          />
        )}

        {/* Action Loading Overlay */}
        {actionLoading && (
          <div
            className={`gsj-action-loading-overlay ${showActionGame ? "gsj-action-loading-overlay--split" : ""}`}
          >
            <div className="gsj-action-loading-overlay__shell">
              <div className="gsj-action-loading-overlay__loader">
                <MeowlKuruLoader
                  text={actionLoadingMessage}
                  layout="vertical"
                />

                {showActionGame && (
                  <p className="gsj-action-loading-overlay__hint">
                    Hệ thống đang xử lý sâu hơn bình thường. Chơi một ván caro
                    với Meowl trong lúc chờ nhé.
                  </p>
                )}
              </div>

              <aside
                className="gsj-action-loading-overlay__game"
                aria-hidden={!showActionGame}
              >
                {showActionGame && (
                  <>
                    <header className="gsj-action-loading-overlay__game-header">
                      <span className="gsj-action-loading-overlay__game-eyebrow">
                        MINI GAME KHI CHỜ
                      </span>
                      <h3>MEOWL TIC-TAC-TOE</h3>
                    </header>
                    <div className="gsj-action-loading-overlay__game-body">
                      <TicTacToeGame mode="embedded" />
                    </div>
                  </>
                )}
              </aside>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="gsj-alert gsj-alert--error gsj-mb-16">
            {error}
            <button onClick={() => setError(null)}>
              <X size={16} />
            </button>
          </div>
        )}

        {/* Main Content */}
        <div
          className={`gsj-content ${viewMode === "result" ? "gsj-content--result" : ""}`}
        >
          {viewMode === "list" && renderJourneyList()}
          {viewMode === "detail" && renderDetailView()}
          {viewMode === "test" && renderTestView()}
          {viewMode === "result" && renderResultView()}

          {/* Sidebar - Quick Actions */}
          {viewMode !== "result" && (
            <div className="gsj-sidebar">
              <div className="gsj-card">
                <div className="gsj-card__header">
                  <h3 className="gsj-card__title">
                    <Lightbulb size={20} />
                    Mẹo nhanh
                  </h3>
                </div>
                <div className="gsj-card__body">
                  <div className="gsj-tip">
                    <p className="gsj-text-secondary gsj-mb-0">
                      Làm bài đánh giá chân thực để nhận kết quả chính xác và lộ
                      trình phù hợp nhất với bạn.
                    </p>
                  </div>
                </div>
              </div>

              <div className="gsj-card gsj-mt-16">
                <div className="gsj-card__header">
                  <h3 className="gsj-card__title">
                    <Activity size={20} />
                    Tổng quan dữ liệu
                  </h3>
                </div>
                <div className="gsj-card__body">
                  <div className="gsj-overview">
                    <div className="gsj-overview__summary">
                      {overviewSummaryItems.map((summary) => (
                        <div
                          key={summary.key}
                          className="gsj-overview__summary-item"
                        >
                          <span className="gsj-overview__summary-label">
                            {summary.label}
                          </span>
                          <strong className="gsj-overview__summary-value">
                            {summary.value}
                          </strong>
                        </div>
                      ))}
                    </div>

                    <div className="gsj-overview__metrics">
                      {overviewRows.map((item) => (
                        <div key={item.key} className="gsj-overview__metric">
                          <div className="gsj-overview__metric-head">
                            <span>{item.label}</span>
                            <span>{item.displayValue}</span>
                          </div>
                          <div className="gsj-overview__bar-track">
                            <div
                              className={`gsj-overview__bar ${item.colorClass}`}
                              style={{ width: `${item.ratio}%` }}
                            ></div>
                          </div>
                          <div className="gsj-overview__metric-caption">
                            {item.caption}
                          </div>
                        </div>
                      ))}
                    </div>

                    <p className="gsj-overview__note">{overviewNote}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {pendingDelete && (
        <div
          className="gsj-delete-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="gsj-delete-modal-title"
          onClick={closeDeleteDialog}
        >
          <div
            className="gsj-delete-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="gsj-delete-modal__hero">
              <div className="gsj-delete-modal__icon">
                <img src={meowlAcwyImage} alt="Meowl xác nhận xóa" />
              </div>
              <div className="gsj-delete-modal__eyebrow">Xác nhận thao tác</div>
              <h3
                id="gsj-delete-modal-title"
                className="gsj-delete-modal__title"
              >
                Xóa hành trình này?
              </h3>
              <p className="gsj-delete-modal__subtitle">
                Dữ liệu bài đánh giá, kết quả, tiến độ và lộ trình (roadmap) đi
                kèm sẽ bị xóa vĩnh viễn.
              </p>
            </div>

            <div className="gsj-delete-modal__body">
              <div className="gsj-delete-modal__journey">
                <span className="gsj-delete-modal__label">
                  Đối tượng bị xóa
                </span>
                <strong className="gsj-delete-modal__journey-name">
                  {pendingDelete.journeyLabel}
                </strong>
              </div>
              <div
                className="gsj-delete-modal__note"
                style={{ color: "var(--gsj-accent-warning, #f59e0b)" }}
              >
                ⚠️ Xóa hành trình sẽ đồng thời xóa roadmap và toàn bộ study plan
                đi kèm.
              </div>
              <div className="gsj-delete-modal__note">
                Hành động này không thể hoàn tác. Bạn chỉ nên tiếp tục khi chắc
                chắn không cần dùng lại Journey này nữa.
              </div>
            </div>

            <div className="gsj-delete-modal__actions">
              <button
                type="button"
                className="gsj-btn gsj-btn--secondary"
                onClick={closeDeleteDialog}
                disabled={actionMode === "deleting-journey"}
              >
                Hủy
              </button>
              <button
                type="button"
                className="gsj-btn gsj-btn--danger"
                onClick={confirmDeleteJourney}
                disabled={actionMode === "deleting-journey"}
              >
                {actionMode === "deleting-journey" ? (
                  <>
                    <RefreshCw size={16} className="gsj-spin" />
                    Đang xóa...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Xác nhận xóa
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Meowl Guide */}
      <MeowlGuide currentPage="journey" />
    </div>
  );
};

export default GSJJourneyPage;
