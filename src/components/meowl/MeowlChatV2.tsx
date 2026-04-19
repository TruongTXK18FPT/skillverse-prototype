import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
  memo,
} from "react";
import {
  X,
  Send,
  ExternalLink,
  Mic,
  Square,
  BarChart2,
  Trash2,
  ChevronUp,
  ChevronDown,
  Settings,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import MeowlKuruLoader from "../kuru-loader/MeowlKuruLoader";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import usePremiumAccess from "../../hooks/usePremiumAccess";
import "../../styles/MeowlChatV2.css";
import { guardUserInput, pickFallback } from "./MeowlGuard.ts";
import axiosInstance from "../../services/axiosInstance";
import meowlChatService, {
  MeowlOnboardingContextResponse,
  MeowlQuickAction,
  MeowlRoleMode,
  getMeowlChatPersistenceKey,
} from "../../services/meowlChatService";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { WavRecorder } from "../../shared/wavRecorder";
import { transcribeAudioViaBackend } from "../../shared/speechToText";
import { LearningReportModal } from "../learning-report";
import {
  type MeowlContextMode,
  buildMeowlContextEnvelope,
} from "../../services/meowlContextService";
import aiRoadmapService from "../../services/aiRoadmapService";
import { type RoadmapSessionSummary, type RoadmapNode } from "../../types/Roadmap";
import {
  resolveRoadmapWorkloadMinutes,
  inferRoadmapStudyPlanDeadline,
  resolvePreferredStudyDays,
  STUDY_WINDOW_PRESETS,
} from "../roadmap/roadmapStudyPlanPolicy";
import journeyService from "../../services/journeyService";

// Guest message limit
const GUEST_MESSAGE_LIMIT = 5;
const GUEST_SESSION_KEY = "meowl_guest_session";
const MEOWL_CHAT_PERSISTENCE_VERSION = 1;

// Context mode labels
const CONTEXT_MODE_LABELS: Record<MeowlContextMode, { en: string; vi: string }> = {
  MODE_ROADMAP_OVERVIEW: { en: "Roadmap", vi: "Roadmap" },
  MODE_COURSE_LEARNING: { en: "Course Tutor", vi: "Gia sư" },
  MODE_FALLBACK_TEACHER: { en: "Fallback Teacher", vi: "Dạy thay" },
  MODE_SOCRATIC_READING: { en: "Socratic", vi: "Gợi mở" },
  MODE_GENERAL_FAQ: { en: "FAQ", vi: "Hỏi đáp" },
};

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  actionType?: string;
  actionUrl?: string;
  actionLabel?: string;
}

interface GuestSession {
  messageCount: number;
  sessionId: string;
  createdAt: number;
}

interface PersistedMeowlMessage
  extends Omit<Message, "timestamp"> {
  timestamp: string;
}

interface PersistedMeowlChatState {
  version: number;
  sessionId: string;
  activeRole: MeowlRoleMode;
  availableRoleModes: MeowlRoleMode[];
  onboardingContext: MeowlOnboardingContextResponse | null;
  messages: PersistedMeowlMessage[];
  updatedAt: number;
}

interface RoleFallbackContent {
  welcome: string;
  nextBestAction: string;
  whatYouCanDo: string[];
  quickActions: MeowlQuickAction[];
  suggestedPrompts: string[];
}

interface MeowlChatV2Props {
  isOpen: boolean;
  onClose: () => void;
  onRequestLogin?: () => void;
  /** Context mode for the chat panel (default: MODE_GENERAL_FAQ) */
  panelMode?: MeowlContextMode;
  /** Theme for the inner panel content (default: "cyan") */
  panelTheme?: "cyan" | "pink" | "hud";
  /** Modes the user can switch between in settings (default: all except advanced protected modes) */
  panelAllowedModes?: MeowlContextMode[];
  /** Density variant (default: "default") */
  density?: "default" | "compact";
  /** Roadmap context — selected node info for auto-context in welcome message */
  roadmapContext?: {
    roadmapId: number;
    roadmapTitle: string;
    nodeTitle: string;
    nodeDescription?: string;
    learningObjectives?: string[];
    keyConcepts?: string[];
  } | null;
  /** Course context — selected lesson info for tutor mode */
  courseContext?: {
    courseTitle: string;
    modules?: {
      moduleId: number;
      moduleTitle: string;
      lessons?: {
        lessonId: number;
        lessonTitle: string;
        lessonType?: string;
      }[];
      quizzes?: {
        lessonId: number;
        lessonTitle: string;
        lessonType?: string;
      }[];
      assignments?: {
        lessonId: number;
        lessonTitle: string;
        lessonType?: string;
      }[];
    }[];
    activeModuleId?: number | null;
    activeLessonId?: number | null;
    activeLessonTitle?: string;
    activeLessonType?: string;
    activeLessonDescription?: string;
  } | null;
}

const createMeowlSessionId = () =>
  `meowl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const createWelcomeMessage = (content: string): Message => ({
  id: "welcome",
  role: "assistant",
  content,
  timestamp: new Date(),
});

const normalizePersistedMessages = (
  persistedMessages: PersistedMeowlMessage[] | undefined,
  welcomeContent: string,
): Message[] => {
  const restoredMessages = Array.isArray(persistedMessages)
    ? persistedMessages
      .filter(
        (message) =>
          message &&
          (message.role === "user" || message.role === "assistant") &&
          typeof message.content === "string",
      )
      .map((message) => ({
        ...message,
        timestamp: new Date(message.timestamp),
      }))
    : [];

  if (restoredMessages.length === 0) {
    return [createWelcomeMessage(welcomeContent)];
  }

  if (restoredMessages[0]?.id === "welcome") {
    return restoredMessages;
  }

  return [createWelcomeMessage(welcomeContent), ...restoredMessages];
};

// Memoized markdown components for better performance
const markdownComponents = {
  a: ({ href, children }: any) => (
    <a
      href={href}
      className="meowl-chat-v2-link"
      onClick={(e) => e.preventDefault()}
      data-href={href}
    >
      {children}
    </a>
  ),
  p: ({ children }: any) => <p className="meowl-chat-v2-msg-p">{children}</p>,
  ul: ({ children }: any) => <ul className="meowl-chat-v2-msg-list">{children}</ul>,
  ol: ({ children }: any) => <ol className="meowl-chat-v2-msg-list ordered">{children}</ol>,
  code: ({ children, className }: any) => {
    const isInline = !className;
    return isInline ? (
      <code className="meowl-chat-v2-inline-code">{children}</code>
    ) : (
      <code className="meowl-chat-v2-block-code">{children}</code>
    );
  },
  strong: ({ children }: any) => (
    <strong className="meowl-chat-v2-text-bold">{children}</strong>
  ),
  em: ({ children }: any) => <em className="meowl-chat-v2-text-italic">{children}</em>,
  li: ({ children }: any) => <li className="meowl-chat-v2-msg-li">{children}</li>,
};

// Memoized Message Item for performance
interface MessageItemProps {
  message: Message;
  onActionClick: (url: string) => void;
}

const MessageItem = memo(({ message, onActionClick }: MessageItemProps) => {
  // Handle click on links
  const handleLinkClick = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      const linkEl = target.closest(".meowl-chat-v2-link") as HTMLAnchorElement;
      if (linkEl) {
        const href = linkEl.dataset.href;
        if (href) {
          e.preventDefault();
          e.stopPropagation();
          onActionClick(href);
        }
      }
    },
    [onActionClick],
  );

  return (
    <div className={`meowl-chat-v2-message-wrapper ${message.role}`}>
      {message.role === "assistant" && (
        <div className="meowl-chat-v2-message-avatar">
          <img src="/images/meowl_bg_clear.png" alt="Meowl" loading="lazy" />
        </div>
      )}
      <div className="meowl-chat-v2-message-content">
        <div className="meowl-chat-v2-message-bubble" onClick={handleLinkClick}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={markdownComponents}
          >
            {message.content}
          </ReactMarkdown>
        </div>
        {/* Action Button */}
        {message.actionType === "NAVIGATE" && message.actionUrl && (
          <button
            className="meowl-chat-v2-action-btn"
            onClick={() => onActionClick(message.actionUrl!)}
          >
            <Sparkles size={14} />
            <span>{message.actionLabel || "Click here"}</span>
            <ExternalLink size={14} />
          </button>
        )}
        <span className="meowl-chat-v2-message-time">
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
});

MessageItem.displayName = "MessageItem";

const MeowlChatV2: React.FC<MeowlChatV2Props> = ({
  isOpen,
  onClose,
  onRequestLogin,
  panelMode: initialPanelMode = "MODE_GENERAL_FAQ",
  panelTheme = "cyan",
  panelAllowedModes,
  density = "default",
  roadmapContext,
  courseContext,
}) => {
  const { language } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const { hasStudentTierAccess, hasMentorProAccess } = usePremiumAccess();
  const navigate = useNavigate();

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Study plan intent state
  const [studyPlanIntent, setStudyPlanIntent] = useState<{
    nodeId: string;
    roadmapSessionId: number;
    suggestedParams: {
      deadline: string;
      intensity: "light" | "balanced" | "intensive";
      studyWindow: "morning" | "afternoon" | "evening" | "flexible";
      selectedDays: string[];
    };
  } | null>(null);

  // UI preferences
  const [theme, setTheme] = useState<"cyan" | "pink">(() => {
    const saved = localStorage.getItem("meowl_theme");
    return saved === "cyan" || saved === "pink" ? saved : "cyan";
  });
  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem("meowl_font_size");
    return saved ? parseInt(saved) : 14;
  });
  const [showSettings, setShowSettings] = useState(false);

  // Guest session management
  const [guestSession, setGuestSession] = useState<GuestSession | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // Study plan intent detection helpers
  const STUDY_PLAN_PATTERNS_VI = [
    /tạo.*study\s*plan/i,
    /lập.*kế\s*hoạch.*học/i,
    /giúp.*tạo.*plan/i,
    /tạo.*plan.*cho.*node/i,
    /lên\s*lịch.*học/i,
    /lịch\s*học.*cho.*node/i,
    /sắp\s*xếp.*lịch.*học/i,
    /plan\s*học/i,
    /kế\s*hoạch\s*học\s*tập/i,
    /cho\s*mình.*kế\s*hoạch/i,
    /giúp\s*mình.*tạo\s*plan/i,
    /tạo\s*lịch/i,
    /lập\s*kế\s*hoạch/i,
  ];
  const STUDY_PLAN_PATTERNS_EN = [
    /create.*study\s*plan/i,
    /make.*a\s*plan/i,
    /make.*plan.*for/i,
    /schedule.*for.*node/i,
    /study\s*schedule/i,
    /help.*create.*plan/i,
    /build.*plan.*for/i,
    /plan.*study/i,
  ];

  const detectStudyPlanIntent = (
    userMessage: string,
    nodeDossier: ReturnType<typeof roadmapNodeDossier>,
    roadmapSessionId: number | null,
  ): ReturnType<typeof setStudyPlanIntent> extends (v: infer T) => void ? T : never | null => {
    if (!nodeDossier || !roadmapSessionId) return null;

    const normalized = userMessage.toLowerCase().replace(/\s+/g, " ").trim();
    const patterns = language === "vi" ? STUDY_PLAN_PATTERNS_VI : STUDY_PLAN_PATTERNS_EN;
    const matched = patterns.some((p) => p.test(normalized));
    if (!matched) return null;

    // Rule-based params generation (reuse roadmapStudyPlanPolicy)
    const node: import("../../types/Roadmap").RoadmapNode = {
      id: nodeDossier.nodeTitle,
      title: nodeDossier.nodeTitle,
      type: "MAIN",
      nodeStatus: "AVAILABLE",
      children: [],
      suggestedCourseIds: [],
      learningObjectives: nodeDossier.learningObjectives,
      keyConcepts: nodeDossier.keyConcepts,
      successCriteria: nodeDossier.successCriteria,
      description: nodeDossier.whyThisMatters ?? undefined,
      estimatedTimeMinutes: undefined,
    };
    const workloadMinutes = resolveRoadmapWorkloadMinutes(node, null);
    const intensity: "light" | "balanced" | "intensive" =
      workloadMinutes <= 180 ? "light" : workloadMinutes <= 600 ? "balanced" : "intensive";
    const durationMinutes = intensity === "light" ? 60 : intensity === "balanced" ? 90 : 120;
    const maxSessionsPerDay = intensity === "light" ? 1 : intensity === "balanced" ? 2 : 3;
    const suggestedDays = resolvePreferredStudyDays([], "flexible");
    const suggestedDeadline = inferRoadmapStudyPlanDeadline({
      startDate: new Date().toISOString().slice(0, 10),
      intensity,
      preferredDays: suggestedDays,
      workloadMinutes,
      durationMinutes,
      maxSessionsPerDay,
    });

    return {
      nodeId: selectedNodeId as string,  // Use actual node ID, not title, to avoid mismatch
      roadmapSessionId,
      suggestedParams: {
        deadline: suggestedDeadline,
        intensity,
        studyWindow: "flexible" as const,
        selectedDays: suggestedDays,
      },
    };
  };

  // Quick-create study plan: call API directly with default params, respond in chat
  const handleQuickCreateStudyPlan = async (intent: NonNullable<ReturnType<typeof detectStudyPlanIntent>>) => {
    const calendarUrl = `/study-planner?view=calendar&roadmapSessionId=${intent.roadmapSessionId}`;
    const nodeTitle = roadmapNodeDossier?.nodeTitle ?? intent.nodeId;
    const intensityLabel =
      intent.suggestedParams.intensity === "balanced"
        ? "Cân bằng (90 phút/phiên)"
        : intent.suggestedParams.intensity === "light"
        ? "Nhẹ nhàng (60 phút/phiên)"
        : "Tăng tốc (120 phút/phiên)";

    try {
      await journeyService.createStudyPlanForRoadmapNode(
        intent.roadmapSessionId,
        intent.nodeId,
        {
          intensityLevel: intent.suggestedParams.intensity,
          studyPreference: intent.suggestedParams.studyWindow,
          preferredDays: intent.suggestedParams.selectedDays,
          startDate: new Date().toISOString().slice(0, 10),
          deadline: intent.suggestedParams.deadline,
        },
      );
      const quickCreateResponse: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content:
          language === "vi"
            ? `Đã tạo study plan cho node **"${nodeTitle}"** với cấu hình:\n- Cường độ: ${intensityLabel}\n- Khung giờ: Linh hoạt\n- Phạm vi: Chỉ node này\n\n[Xem lịch học ngay](${calendarUrl})`
            : `Created study plan for node **"${nodeTitle}"** with:\n- Intensity: ${intensityLabel}\n- Time window: Flexible\n- Scope: This node only\n\n[View study schedule](${calendarUrl})`,
        timestamp: new Date(),
        actionType: "NAVIGATE",
        actionUrl: calendarUrl,
        actionLabel: language === "vi" ? "Xem lịch học" : "View schedule",
      };
      setMessages((prev) => [...prev, quickCreateResponse]);
    } catch (apiError) {
      console.warn("Quick-create study plan failed:", apiError);
      const fallbackResponse: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content:
          language === "vi"
            ? `Mình không thể tạo study plan cho node **"${nodeTitle}"** lúc này. Bạn có thể bấm nút "Tạo kế hoạch AI" trên node để thử lại nhé. 🐱`
            : `I couldn't create a study plan for node **"${nodeTitle}"** right now. You can click "Create AI Plan" on the node to try again. 🐱`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, fallbackResponse]);
    }
  };

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const welcomeMessageRef = useRef("");

  // Voice recording
  const [recorder] = useState(() => new WavRecorder());
  const [isRecording, setIsRecording] = useState(false);
  const [previewText, setPreviewText] = useState<string>("");
  const [isPreviewing, setIsPreviewing] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);

  // Learning Report Modal
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const [meowlSessionId, setMeowlSessionId] = useState(() => createMeowlSessionId());
  const [onboardingContext, setOnboardingContext] =
    useState<MeowlOnboardingContextResponse | null>(null);
  const [activeRole, setActiveRole] = useState<MeowlRoleMode>("GENERAL");
  const [availableRoleModes, setAvailableRoleModes] = useState<MeowlRoleMode[]>([
    "GENERAL",
  ]);
  const [onboardingLoading, setOnboardingLoading] = useState(false);
  const [hasHydratedChatState, setHasHydratedChatState] = useState(false);
  const [restoredFromPersistence, setRestoredFromPersistence] = useState(false);
  const [hydratedChatKey, setHydratedChatKey] = useState<string | null>(null);

  // Context mode state
  const allContextModes: MeowlContextMode[] = [
    "MODE_GENERAL_FAQ",
    "MODE_ROADMAP_OVERVIEW",
    "MODE_COURSE_LEARNING",
    "MODE_FALLBACK_TEACHER",
    "MODE_SOCRATIC_READING",
  ];
  const mentorProRequiredModes: MeowlContextMode[] = [
    "MODE_ROADMAP_OVERVIEW",
    "MODE_COURSE_LEARNING",
  ];
  const [contextMode, setContextMode] = useState<MeowlContextMode>(initialPanelMode);
  const effectiveAllowedModes = useMemo<MeowlContextMode[]>(() => {
    const defaultModes = allContextModes.filter(
      (mode) =>
        mode !== "MODE_SOCRATIC_READING" && mode !== "MODE_FALLBACK_TEACHER",
    );
    const baseModes =
      panelAllowedModes && panelAllowedModes.length > 0
        ? panelAllowedModes
        : defaultModes;
    const tierFilteredModes = hasMentorProAccess
      ? baseModes
      : baseModes.filter(
          (mode) => !mentorProRequiredModes.includes(mode),
        );
    const dedupedModes = Array.from(new Set(tierFilteredModes));
    return dedupedModes.length > 0 ? dedupedModes : ["MODE_GENERAL_FAQ"];
  }, [hasMentorProAccess, panelAllowedModes]);

  // Reset context mode when initialPanelMode changes
  useEffect(() => {
    const nextMode = effectiveAllowedModes.includes(initialPanelMode)
      ? initialPanelMode
      : effectiveAllowedModes[0] ?? "MODE_GENERAL_FAQ";
    setContextMode(nextMode);
  }, [effectiveAllowedModes, initialPanelMode]);

  useEffect(() => {
    if (effectiveAllowedModes.includes(contextMode)) {
      return;
    }
    setContextMode(effectiveAllowedModes[0] ?? "MODE_GENERAL_FAQ");
  }, [contextMode, effectiveAllowedModes]);

  // Roadmap selector state (for MODE_ROADMAP_OVERVIEW)
  const [roadmapList, setRoadmapList] = useState<RoadmapSessionSummary[]>([]);
  const [selectedRoadmapId, setSelectedRoadmapId] = useState<number | null>(null);
  const [selectedRoadmap, setSelectedRoadmap] = useState<{
    sessionId: number;
    title: string;
    nodes: RoadmapNode[];
  } | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [roadmapLoading, setRoadmapLoading] = useState(false);
  // Track if user has explicitly selected a node (via event) — used to prevent auto-select from overriding
  const userHasSelectedNodeRef = useRef(false);

  // Course selector state (for MODE_COURSE_LEARNING)
  const [selectedCourseModuleId, setSelectedCourseModuleId] = useState<number | null>(null);
  const [selectedCourseLessonId, setSelectedCourseLessonId] = useState<number | null>(null);
  const [selectedContentType, setSelectedContentType] = useState<"lesson" | "quiz" | "assignment">("lesson");

  // Check if in roadmap mode
  const isRoadmapMode =
    contextMode === "MODE_ROADMAP_OVERVIEW" ||
    contextMode === "MODE_FALLBACK_TEACHER";

  // Check if in course tutor mode
  const isCourseMode = contextMode === "MODE_COURSE_LEARNING";

  // Fetch roadmap list when opening in roadmap mode
  useEffect(() => {
    if (!isOpen || !isRoadmapMode) return;
    if (roadmapList.length > 0) return; // Already loaded

    const fetchRoadmaps = async () => {
      setRoadmapLoading(true);
      try {
        const summaries = await aiRoadmapService.getUserRoadmaps();
        setRoadmapList(summaries);
        // Auto-select first active roadmap
        const active = summaries.find(
          (r) => r.status === "ACTIVE" || r.status === "active"
        );
        if (active) {
          setSelectedRoadmapId(active.sessionId);
        }
      } catch (err) {
        console.error("Failed to load roadmaps for Meowl:", err);
      } finally {
        setRoadmapLoading(false);
      }
    };

    void fetchRoadmaps();
  }, [isOpen, isRoadmapMode, roadmapList.length]);

  // Fetch roadmap details (nodes) when roadmap is selected
  useEffect(() => {
    if (!selectedRoadmapId) {
      setSelectedRoadmap(null);
      setSelectedNodeId(null);
      userHasSelectedNodeRef.current = false;
      return;
    }

    const fetchRoadmapDetail = async () => {
      // Reset user-selection flag when loading a new roadmap
      // This ensures auto-select runs for the new roadmap even if user had selected a node in a previous roadmap
      userHasSelectedNodeRef.current = false;
      const currentRoadmapId = selectedRoadmapId;
      try {
        const detail = await aiRoadmapService.getRoadmapById(selectedRoadmapId);
        // Ignore result if roadmap changed while fetching (stale callback)
        if (currentRoadmapId !== selectedRoadmapId) return;
        setSelectedRoadmap({
          sessionId: detail.sessionId,
          title: detail.metadata?.title || detail.overview?.purpose || "Untitled Roadmap",
          nodes: detail.roadmap,
        });
        // Auto-select first non-completed node — only as fallback if user has not explicitly selected a node
        if (userHasSelectedNodeRef.current) return;
        const firstActive = detail.roadmap.find(
          (n) => n.nodeStatus !== "COMPLETED"
        );
        if (firstActive) {
          setSelectedNodeId(firstActive.id);
        }
      } catch (err) {
        console.error("Failed to load roadmap detail:", err);
      }
    };

    void fetchRoadmapDetail();
  }, [selectedRoadmapId]);

  // Auto-select course context when chat opens
  useEffect(() => {
    if (!isOpen || !isCourseMode || !courseContext) return;

    // Auto-select module from courseContext
    if (courseContext.activeModuleId) {
      setSelectedCourseModuleId(courseContext.activeModuleId);
    } else if (courseContext.modules?.length) {
      setSelectedCourseModuleId(courseContext.modules[0].moduleId);
    }

    // Auto-select lesson from courseContext
    if (courseContext.activeLessonId) {
      setSelectedCourseLessonId(courseContext.activeLessonId);
    }

    // Auto-select content type based on lesson type
    const lessonType = courseContext.activeLessonType?.toUpperCase();
    if (lessonType === "QUIZ") {
      setSelectedContentType("quiz");
    } else if (lessonType === "ASSIGNMENT") {
      setSelectedContentType("assignment");
    } else {
      setSelectedContentType("lesson");
    }
  }, [isOpen, isCourseMode, courseContext]);

  // Listen for external node selection events (dispatched by RoadmapDetailPage)
  useEffect(() => {
    const handleNodeSelect = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (!detail) return;
      const { roadmapId, nodeId, roadmapTitle } = detail as {
        roadmapId?: number;
        nodeId?: string;
        roadmapTitle?: string;
      };
      // Open chat if not already open (parent may have passed roadmapContext instead)
      // but we can still sync the internal state
      if (roadmapId) {
        // Check if roadmap is already in our list
        const existing = roadmapList.find((r) => r.sessionId === roadmapId);
        if (existing) {
          setSelectedRoadmapId(roadmapId);
          if (nodeId) {
            userHasSelectedNodeRef.current = true;
            setSelectedNodeId(nodeId);
          }
        } else {
          // Roadmap not in list yet — trigger a refetch
          setSelectedRoadmapId(roadmapId);
          // Fetch the roadmap detail directly since it's not in the list
          aiRoadmapService.getRoadmapById(roadmapId).then((detail) => {
            const title = roadmapTitle || detail.metadata?.title || detail.overview?.purpose || "Roadmap";
            setSelectedRoadmap({
              sessionId: detail.sessionId,
              title,
              nodes: detail.roadmap,
            });
            if (nodeId) {
              userHasSelectedNodeRef.current = true;
              setSelectedNodeId(nodeId);
            }
          }).catch((err) => {
            console.error("Failed to load roadmap detail from event:", err);
          });
        }
      }
    };

    window.addEventListener("meowl-node-select", handleNodeSelect);
    return () => window.removeEventListener("meowl-node-select", handleNodeSelect);
  }, [roadmapList]);

  // Merge external roadmapContext with internal selector state
  const activeRoadmapContext = useMemo(() => {
    // Priority 1: Use internal state (set by meowl-node-select event or auto-select fallback)
    // This ensures user-clicked node always takes precedence over parent prop
    if (selectedRoadmap && selectedNodeId) {
      const node = selectedRoadmap.nodes.find((n) => n.id === selectedNodeId);
      if (node) {
        return {
          roadmapTitle: selectedRoadmap.title,
          nodeTitle: node.title,
          nodeDescription: node.description || undefined,
          learningObjectives: node.learningObjectives?.filter(Boolean) || [],
          keyConcepts: node.keyConcepts?.filter(Boolean) || [],
        };
      }
    }
    // Priority 2: Fall back to parent prop (for initial load when parent selectedNode is set)
    if (roadmapContext) {
      return roadmapContext;
    }
    return null;
  }, [selectedRoadmap, selectedNodeId, roadmapContext]);

  // MeowlNodeDossier computed from selected roadmap+node (for context envelope)
  const roadmapNodeDossier = useMemo(() => {
    if (!activeRoadmapContext || !selectedRoadmap || !selectedNodeId) return null;
    const node = selectedRoadmap.nodes.find((n) => n.id === selectedNodeId);
    if (!node) return null;
    const parentNode = node.parentId
      ? selectedRoadmap.nodes.find((n) => n.id === node.parentId)
      : null;
    const childNodes = selectedRoadmap.nodes.filter((n) => node.children.includes(n.id));
    return {
      nodeTitle: node.title,
      nodeRole: node.type === "MAIN" ? "Mục tiêu chính" : "Mục tiêu phụ",
      phaseLabel: null as string | null,
      whyThisMatters: node.description || null,
      parentTitle: parentNode?.title || null,
      childBranchTitles: childNodes.map((n) => n.title),
      learningObjectives: node.learningObjectives?.filter(Boolean) || [],
      keyConcepts: node.keyConcepts?.filter(Boolean) || [],
      successCriteria: node.successCriteria?.filter(Boolean) || [],
      courseStatus: null as string | null,
      recommendedNextStep: null as string | null,
    };
  }, [activeRoadmapContext, selectedRoadmap, selectedNodeId]);

  // Context summary for context envelope
  const roadmapContextSummary = useMemo(() => {
    const items: string[] = [];
    if (activeRoadmapContext) {
      items.push(`Roadmap: ${activeRoadmapContext.roadmapTitle || "Learning roadmap"}`);
      items.push(`Node: ${activeRoadmapContext.nodeTitle || "Current node"}`);
      if (activeRoadmapContext.nodeDescription) {
        items.push(`Mô tả: ${activeRoadmapContext.nodeDescription}`);
      }
    }
    return items;
  }, [activeRoadmapContext]);

  // Course context welcome message (for MODE_COURSE_LEARNING)
  const courseWelcomeContent = useMemo(() => {
    if (!courseContext || !isCourseMode) return null;
    const isVi = language === "vi";

    const activeModuleId = selectedCourseModuleId ?? courseContext.activeModuleId;
    const activeLessonId = selectedCourseLessonId ?? courseContext.activeLessonId;
    const courseTitle = courseContext.courseTitle;
    const activeModule = courseContext.modules?.find((m) => m.moduleId === activeModuleId);

    // Look up lesson, quiz, or assignment title based on selected content type
    const lookupTitle = (): string => {
      if (!activeLessonId || !activeModule) return courseContext.activeLessonTitle ?? "";
      if (selectedContentType === "quiz") {
        return activeModule.quizzes?.find((q) => q.lessonId === activeLessonId)?.lessonTitle ?? "";
      }
      if (selectedContentType === "assignment") {
        return activeModule.assignments?.find((a) => a.lessonId === activeLessonId)?.lessonTitle ?? "";
      }
      return activeModule.lessons?.find((l) => l.lessonId === activeLessonId)?.lessonTitle ?? "";
    };
    const activeLessonTitle = activeLessonId ? lookupTitle() : (courseContext.activeLessonTitle ?? "");
    const activeLessonType = selectedContentType === "quiz" ? "QUIZ" : selectedContentType === "assignment" ? "ASSIGNMENT" : (selectedCourseLessonId ? activeModule?.lessons?.find((l) => l.lessonId === activeLessonId)?.lessonType : courseContext.activeLessonType);
    const activeLessonDescription = courseContext.activeLessonDescription;

    const intro = isVi
      ? `Chào bạn! Mình đang ở chế độ Gia sư khóa học nè. Khóa học: **${courseTitle}**.`
      : `Hey there! Meowl is in Course Tutor mode. Course: **${courseTitle}**.`;

    const contextLines: string[] = [];
    if (activeModule?.moduleTitle) {
      contextLines.push(isVi ? `Chương hiện tại: **${activeModule.moduleTitle}**` : `Current chapter: **${activeModule.moduleTitle}**`);
    }
    if (activeLessonTitle) {
      const typeLabel = isVi
        ? (selectedContentType === "quiz" ? "Bài kiểm tra" : selectedContentType === "assignment" ? "Bài tập" : "Bài học")
        : (selectedContentType === "quiz" ? "Quiz" : selectedContentType === "assignment" ? "Assignment" : "Lesson");
      contextLines.push(isVi ? `${typeLabel} hiện tại: **${activeLessonTitle}**` : `Current ${typeLabel}: **${activeLessonTitle}**`);
    }
    if (activeLessonDescription) {
      contextLines.push(`*${activeLessonDescription}*`);
    }

    const nextAction = isVi
      ? `Chọn một nội dung hoặc hỏi mình về bài đang học nhé!`
      : `Pick a content item or ask me about what you're learning!`;

    const suggestedPromptsArr = isVi
      ? [
        `Giải thích bài \`${activeLessonTitle || "này"}\` theo cách dễ hiểu nhất.`,
        "Cho mình một câu hỏi luyện tập bám sát nội dung này.",
        `Tóm tắt những điểm chính của \`${activeLessonTitle || "phần này"}\`.`,
      ]
      : [
        `Explain \`${activeLessonTitle || "this lesson"}\` in the simplest way possible.`,
        "Give me a practice question about this content.",
        `Summarize the key points of \`${activeLessonTitle || "this lesson"}\`.`,
      ];

    return {
      intro,
      contextLines,
      nextAction,
      suggestedPrompts: suggestedPromptsArr,
    };
  }, [courseContext, isCourseMode, language, selectedContentType, selectedCourseModuleId, selectedCourseLessonId]);

  // Course context summary for context envelope
  const courseContextSummary = useMemo(() => {
    const items: string[] = [];
    if (!courseContext) return items;
    items.push(`Khóa học: ${courseContext.courseTitle}`);
    const activeModuleId = selectedCourseModuleId ?? courseContext.activeModuleId;
    const activeLessonId = selectedCourseLessonId ?? courseContext.activeLessonId;
    if (activeModuleId) {
      const mod = courseContext.modules?.find((m) => m.moduleId === activeModuleId);
      if (mod) items.push(`Chương: ${mod.moduleTitle}`);
      if (activeLessonId) {
        const lesson = mod?.lessons?.find((l) => l.lessonId === activeLessonId);
        const quiz = mod?.quizzes?.find((q) => q.lessonId === activeLessonId);
        const assign = mod?.assignments?.find((a) => a.lessonId === activeLessonId);
        if (quiz) items.push(`Bài kiểm tra: ${quiz.lessonTitle}`);
        else if (assign) items.push(`Bài tập: ${assign.lessonTitle}`);
        else if (lesson) items.push(`Bài học: ${lesson.lessonTitle}`);
      }
    }
    return items;
  }, [courseContext, selectedCourseModuleId, selectedCourseLessonId]);

  const accountRoleModes = useMemo<MeowlRoleMode[]>(() => {
    if (!isAuthenticated || !user?.roles?.length) return ["GENERAL"];
    const roles = new Set<MeowlRoleMode>();
    user.roles.forEach((role) => {
      const normalized = String(role).toUpperCase();
      if (normalized === "RECRUITER") roles.add("RECRUITER");
      if (normalized === "MENTOR") roles.add("MENTOR");
      if (normalized === "USER") roles.add("LEARNER");
    });
    if (roles.size === 0) roles.add("LEARNER");
    return Array.from(roles);
  }, [isAuthenticated, user?.roles]);

  const persistedChatKey = useMemo(
    () =>
      isAuthenticated && user?.id ? getMeowlChatPersistenceKey(user.id) : null,
    [isAuthenticated, user?.id],
  );

  useEffect(() => {
    if (!isAuthenticated) {
      setActiveRole("GENERAL");
      setAvailableRoleModes(["GENERAL"]);
      setOnboardingContext(null);
      return;
    }

    setAvailableRoleModes(accountRoleModes);
    if (!accountRoleModes.includes(activeRole)) {
      setActiveRole(accountRoleModes[0] || "LEARNER");
    }
  }, [activeRole, accountRoleModes, isAuthenticated]);

  const roleLabels = useMemo(
    () => ({
      LEARNER: language === "en" ? "Learner" : "Learner",
      MENTOR: language === "en" ? "Mentor" : "Mentor",
      RECRUITER: language === "en" ? "Recruiter" : "Recruiter",
      GENERAL: language === "en" ? "General" : "Tổng quát",
    }),
    [language],
  );

  const getRoleFallbackContent = useCallback(
    (role: MeowlRoleMode): RoleFallbackContent => {
      const isEn = language === "en";
      switch (role) {
        case "RECRUITER":
          return {
            welcome: isEn
              ? "Recruiter mode enabled. I will guide you through the recruiter mega-menu only: Jobs and Community."
              : "Chào bạn, Meowl đang ở chế độ Recruiter Assistant nè. Mình sẽ chỉ hướng dẫn theo mega-menu của recruiter: Việc Làm và Cộng Đồng.",
            nextBestAction: isEn
              ? "Open Jobs to review your hiring pipeline."
              : "Mở Việc Làm để rà lại pipeline tuyển dụng hiện tại.",
            whatYouCanDo: isEn
              ? [
                "Guide recruiter hiring flow through Jobs",
                "Suggest applicant and shortlist actions",
                "Recommend Community when broader outreach is needed",
              ]
              : [
                "Hướng dẫn flow tuyển dụng của recruiter qua mục Việc Làm",
                "Gợi ý cách review applicants và shortlist",
                "Đề xuất dùng Cộng Đồng khi cần mở rộng kết nối",
              ],
            quickActions: isEn
              ? [
                {
                  id: "jobs",
                  label: "Jobs",
                  description: "Search and manage job postings",
                  actionType: "NAVIGATE",
                  actionValue: "/jobs",
                },
                {
                  id: "community",
                  label: "Community",
                  description: "Join the active learning community",
                  actionType: "NAVIGATE",
                  actionValue: "/community",
                },
              ]
              : [
                {
                  id: "jobs",
                  label: "Việc Làm",
                  description: "Tìm kiếm và quản lý tin tuyển dụng",
                  actionType: "NAVIGATE",
                  actionValue: "/jobs",
                },
                {
                  id: "community",
                  label: "Cộng Đồng",
                  description: "Tham gia cộng đồng học tập sôi động",
                  actionType: "NAVIGATE",
                  actionValue: "/community",
                },
              ],
            suggestedPrompts: isEn
              ? [
                "In Recruiter mode, should I start from Jobs or Community?",
                "Guide me to use Jobs for postings, applicants, and shortlist flow.",
                "Summarize the current hiring features available on SkillVerse.",
              ]
              : [
                "Trong role Recruiter, tôi nên bắt đầu từ Việc Làm hay Cộng Đồng?",
                "Hướng dẫn tôi dùng Việc Làm để theo dõi job, applicants và shortlist.",
                "Tôi muốn hiểu nhanh các tính năng tuyển dụng hiện có của SkillVerse.",
              ],
          };
        case "MENTOR":
          return {
            welcome: isEn
              ? "Mentor mode enabled. I will guide you through the mentor mega-menu: Courses, Community, Mentorship, Profile, and AI Assistant."
              : "Chào mentor, Meowl đang ở chế độ Mentor Assistant nè. Mình sẽ chỉ hướng dẫn theo mega-menu của mentor: Khóa Học, Cộng Đồng, Cố Vấn, Hồ Sơ và Trợ Lý AI.",
            nextBestAction: isEn
              ? "Open Courses or Mentorship based on what you want to operate next."
              : "Mở Khóa Học hoặc Cố Vấn tùy theo bước vận hành bạn muốn làm tiếp.",
            whatYouCanDo: isEn
              ? [
                "Guide course preparation and publish flow",
                "Suggest mentoring availability and booking steps",
                "Point you to the right mentor mega-menu route",
              ]
              : [
                "Hướng dẫn chuẩn bị course và flow publish",
                "Gợi ý setup availability và booking mentoring",
                "Dẫn bạn đến đúng route trong mega-menu của mentor",
              ],
            quickActions: isEn
              ? [
                {
                  id: "courses",
                  label: "Courses",
                  description: "Manage your course content",
                  actionType: "NAVIGATE",
                  actionValue: "/courses",
                },
                {
                  id: "mentorship",
                  label: "Mentorship",
                  description: "Manage mentoring profile and schedule",
                  actionType: "NAVIGATE",
                  actionValue: "/mentorship",
                },
                {
                  id: "profile-mentor",
                  label: "Profile",
                  description: "Manage your mentor profile",
                  actionType: "NAVIGATE",
                  actionValue: "/profile/mentor",
                },
                {
                  id: "chatbot",
                  label: "AI Assistant",
                  description: "Get support from Meowl",
                  actionType: "NAVIGATE",
                  actionValue: "/chatbot",
                },
              ]
              : [
                {
                  id: "courses",
                  label: "Khóa Học",
                  description: "Quản lý nội dung khóa học của bạn",
                  actionType: "NAVIGATE",
                  actionValue: "/courses",
                },
                {
                  id: "mentorship",
                  label: "Cố Vấn",
                  description: "Quản lý hồ sơ và lịch mentoring",
                  actionType: "NAVIGATE",
                  actionValue: "/mentorship",
                },
                {
                  id: "profile-mentor",
                  label: "Hồ Sơ",
                  description: "Quản lý hồ sơ mentor của bạn",
                  actionType: "NAVIGATE",
                  actionValue: "/profile/mentor",
                },
                {
                  id: "chatbot",
                  label: "Trợ Lý AI",
                  description: "Nhận hỗ trợ từ trợ lý AI",
                  actionType: "NAVIGATE",
                  actionValue: "/chatbot",
                },
              ],
            suggestedPrompts: isEn
              ? [
                "In Mentor mode, should I start from Courses or Mentorship?",
                "Guide me to use Courses to prepare my first course.",
                "I want to open mentoring availability. How should I use Mentorship?",
              ]
              : [
                "Trong role Mentor, tôi nên bắt đầu từ Khóa Học hay Cố Vấn?",
                "Hướng dẫn tôi dùng Khóa Học để chuẩn bị course đầu tiên.",
                "Tôi muốn mở lịch mentoring, nên đi từ Cố Vấn như thế nào?",
              ],
          };
        case "LEARNER":
          return {
            welcome: isEn
              ? "Learner mode enabled. I will guide you through the learner mega-menu: Journey, Dashboard, Roadmap, Study Planner, Courses, Mentorship, Portfolio, Jobs, and Meowl Shop."
              : "Chào bạn, Meowl đang ở chế độ Learner Assistant nè. Mình sẽ chỉ hướng dẫn theo mega-menu của learner: Hành Trình, Dashboard, Roadmap, Kế Hoạch AI, Khóa Học, Cố Vấn, Portfolio, Việc Làm và Meowl Shop.",
            nextBestAction: isEn
              ? "Open Journey if you are starting fresh, or Roadmap if you already have an active learning path."
              : "Mở Hành Trình nếu bạn đang bắt đầu, hoặc mở Roadmap nếu đã có lộ trình học đang chạy.",
            whatYouCanDo: isEn
              ? [
                "Guide step by step from Journey into Roadmap",
                "Explain how to use Dashboard, Study Planner, Courses, and Mentorship together",
                "Point you to the right learner mega-menu route for portfolio or jobs",
              ]
              : [
                "Hướng dẫn từng bước từ Hành Trình sang Roadmap",
                "Giải thích cách dùng Dashboard, Kế Hoạch AI, Khóa Học và Cố Vấn cùng nhau",
                "Dẫn bạn đến đúng route learner cho portfolio hoặc việc làm",
              ],
            quickActions: isEn
              ? [
                {
                  id: "journey",
                  label: "Journey",
                  description: "Start or continue your learning journey",
                  actionType: "NAVIGATE",
                  actionValue: "/journey",
                },
                {
                  id: "dashboard",
                  label: "Dashboard",
                  description: "Track learning progress and achievements",
                  actionType: "NAVIGATE",
                  actionValue: "/dashboard",
                },
                {
                  id: "roadmap",
                  label: "Learning Roadmap",
                  description: "Explore your skill roadmap",
                  actionType: "NAVIGATE",
                  actionValue: "/roadmap",
                },
                {
                  id: "chatbot",
                  label: "AI Assistant",
                  description: "Get support from Meowl",
                  actionType: "NAVIGATE",
                  actionValue: "/chatbot",
                },
              ]
              : [
                {
                  id: "journey",
                  label: "Hành Trình",
                  description: "Bắt đầu hoặc tiếp tục hành trình học tập",
                  actionType: "NAVIGATE",
                  actionValue: "/journey",
                },
                {
                  id: "dashboard",
                  label: "Bảng Điều Khiển",
                  description: "Theo dõi tiến độ học tập và thành tích",
                  actionType: "NAVIGATE",
                  actionValue: "/dashboard",
                },
                {
                  id: "roadmap",
                  label: "Lộ Trình Học Tập",
                  description: "Khám phá lộ trình học tập và kỹ năng",
                  actionType: "NAVIGATE",
                  actionValue: "/roadmap",
                },
                {
                  id: "chatbot",
                  label: "Trợ Lý AI",
                  description: "Nhận hỗ trợ từ trợ lý AI",
                  actionType: "NAVIGATE",
                  actionValue: "/chatbot",
                },
              ],
            suggestedPrompts: isEn
              ? [
                "Guide me to start from Journey and Learning Roadmap.",
                "What order should I use Dashboard, Roadmap, and Study Planner?",
                "How should I move from learning into portfolio and jobs through the mega-menu?",
              ]
              : [
                "Hướng dẫn tôi bắt đầu từ Hành Trình và Lộ Trình Học Tập.",
                "Tôi nên dùng Dashboard, Roadmap và Kế Hoạch AI theo thứ tự nào?",
                "Tôi muốn chuyển từ học sang portfolio và việc làm thì nên đi trong mega-menu ra sao?",
              ],
          };
        default:
          return {
            welcome: isEn
              ? "Meowl here. I can guide you around SkillVerse and point you to the next useful action."
              : "Xin chào bạn, Meowl đây nè! Mình có thể hướng dẫn bạn dùng SkillVerse ngắn gọn và luôn chốt bước tiếp theo rõ ràng.",
            nextBestAction: isEn
              ? "Sign in to unlock role-aware guidance."
              : "Đăng nhập để Meowl hỗ trợ theo đúng vai trò nhé.",
            whatYouCanDo: isEn
              ? [
                "Quick product walkthrough",
                "Starter learning guidance",
                "Direct links to key pages",
              ]
              : [
                "Giới thiệu nhanh các tính năng chính của SkillVerse",
                "Gợi ý cách bắt đầu học hoặc định hướng phù hợp",
                "Dẫn bạn đến đúng trang bằng CTA cụ thể",
              ],
            quickActions: isEn
              ? [
                {
                  id: "login",
                  label: "Sign in",
                  description: "Use full role-aware assistant",
                  actionType: "NAVIGATE",
                  actionValue: "/login",
                },
                {
                  id: "courses",
                  label: "Explore courses",
                  description: "Open course catalog",
                  actionType: "NAVIGATE",
                  actionValue: "/courses",
                },
              ]
              : [
                {
                  id: "login",
                  label: "Đăng nhập",
                  description: "Dùng trợ lý theo vai trò",
                  actionType: "NAVIGATE",
                  actionValue: "/login",
                },
                {
                  id: "courses",
                  label: "Khám phá khóa học",
                  description: "Mở thư viện khóa học",
                  actionType: "NAVIGATE",
                  actionValue: "/courses",
                },
              ],
            suggestedPrompts: isEn
              ? [
                "Give me a quick SkillVerse walkthrough.",
                "What should I do first as a new user?",
              ]
              : [
                "Giới thiệu nhanh SkillVerse cho người mới.",
                "Tôi nên bắt đầu từ đâu trên SkillVerse?",
              ],
          };
      }
    },
    [language],
  );

  const effectiveRole: MeowlRoleMode = onboardingContext?.activeRole || activeRole;
  const fallbackContent = getRoleFallbackContent(effectiveRole);

  // Roadmap context welcome message
  const roadmapWelcomeContent = useMemo(() => {
    if (!activeRoadmapContext || !isRoadmapMode) return null;
    const isVi = language === "vi";
    const nodeTitle = activeRoadmapContext.nodeTitle || (isVi ? "nút hiện tại" : "current node");
    const roadmapTitle = activeRoadmapContext.roadmapTitle || (isVi ? "Lộ trình học tập" : "Learning roadmap");

    const objectives = activeRoadmapContext.learningObjectives?.slice(0, 3) || [];
    const concepts = activeRoadmapContext.keyConcepts?.slice(0, 3) || [];

    const intro = isVi
      ? `Chào bạn! Mình đang ở chế độ Roadmap Guide nè. Lộ trình hiện tại: **${roadmapTitle}**.\n\nMình đang focus vào node: **${nodeTitle}**.`
      : `Hey there! Meowl is in Roadmap Guide mode. Current roadmap: **${roadmapTitle}**.\n\nCurrently focused on: **${nodeTitle}**.`;

    const contextSection = (() => {
      const lines: string[] = [];
      if (activeRoadmapContext.nodeDescription) {
        lines.push(activeRoadmapContext.nodeDescription);
      }
      if (objectives.length > 0) {
        lines.push(isVi ? "**Mục tiêu học tập:**" : "**Learning Objectives:**");
        objectives.forEach((obj) => lines.push(`- ${obj}`));
      }
      if (concepts.length > 0) {
        lines.push(isVi ? "**Khái niệm trọng tâm:**" : "**Key Concepts:**");
        concepts.forEach((c) => lines.push(`- ${c}`));
      }
      return lines.length > 0 ? lines.join("\n") : null;
    })();

    const nextAction = isVi
      ? `Bấm vào node **${nodeTitle}** trên lộ trình để xem chi tiết, hoặc hỏi mình về node này nhé!`
      : `Tap the **${nodeTitle}** node on the roadmap to view details, or ask me anything about it!`;

    const suggestedPromptsArr = isVi
      ? [
        `Node "${nodeTitle}" quan trọng như thế nào trong roadmap?`,
        `Mình nên bắt đầu với "${nodeTitle}" như thế nào?`,
        `Kết nối "${nodeTitle}" với các node khác trong roadmap ra sao?`,
      ]
      : [
        `Why is the "${nodeTitle}" node important in this roadmap?`,
        `How should I start with "${nodeTitle}"?`,
        `How does "${nodeTitle}" connect to other nodes in the roadmap?`,
      ];

    return {
      intro,
      contextSection,
      nextAction,
      suggestedPrompts: suggestedPromptsArr,
    };
  }, [activeRoadmapContext, isRoadmapMode, language]);

  const useBackendText = Boolean(onboardingContext);
  const baseWelcomeMessage =
    useBackendText && onboardingContext?.welcomeMessage
      ? onboardingContext.welcomeMessage
      : fallbackContent.welcome;
  const nextBestActionText =
    useBackendText && onboardingContext?.nextBestAction
      ? onboardingContext.nextBestAction
      : fallbackContent.nextBestAction;
  const quickActions =
    useBackendText && onboardingContext?.quickActions?.length
      ? onboardingContext.quickActions
      : fallbackContent.quickActions;
  const suggestedPrompts =
    useBackendText && onboardingContext?.suggestedPrompts?.length
      ? onboardingContext.suggestedPrompts
      : fallbackContent.suggestedPrompts;

  const welcomeMessageText = useMemo(() => {
    // Roadmap context mode
    if (roadmapWelcomeContent) {
      const { intro, contextSection, nextAction, suggestedPrompts: rcPrompts } = roadmapWelcomeContent;
      const promptTitle = language === "en" ? "Try asking" : "Gợi ý câu hỏi";
      const suggestedPromptSection = rcPrompts
        .slice(0, 3)
        .map((prompt) => `- ${prompt}`)
        .join("\n");

      const parts: string[] = [intro];
      if (contextSection) {
        parts.push("", contextSection);
      }
      parts.push("", nextAction, "", `**${promptTitle}:**`, suggestedPromptSection);
      return parts.join("\n");
    }

    // Course tutor context mode
    if (courseWelcomeContent) {
      const { intro, contextLines, nextAction, suggestedPrompts: cwPrompts } = courseWelcomeContent;
      const promptTitle = language === "en" ? "Try asking" : "Gợi ý câu hỏi";
      const suggestedPromptSection = cwPrompts
        .slice(0, 3)
        .map((prompt) => `- ${prompt}`)
        .join("\n");

      const parts: string[] = [intro];
      if (contextLines.length > 0) {
        parts.push("", ...contextLines);
      }
      parts.push("", nextAction, "", `**${promptTitle}:**`, suggestedPromptSection);
      return parts.join("\n");
    }

    // Default: role-based welcome
    const quickActionSection = quickActions
      .slice(0, 3)
      .map((action) => {
        if (action.actionType === "NAVIGATE" && action.actionValue?.startsWith("/")) {
          return `- [${action.label}](${action.actionValue})`;
        }
        if (action.description) {
          return `- ${action.label}: ${action.description}`;
        }
        return `- ${action.label}`;
      })
      .join("\n");

    const suggestedPromptSection = suggestedPrompts
      .slice(0, 2)
      .map((prompt) => `- ${prompt}`)
      .join("\n");

    const nextActionTitle = language === "en" ? "Next best action" : "Bước tiếp theo";
    const quickActionTitle = language === "en" ? "Quick actions" : "Hành động nhanh";
    const promptTitle = language === "en" ? "Try asking" : "Gợi ý câu hỏi";

    return [
      baseWelcomeMessage,
      "",
      `**${nextActionTitle}:** ${nextBestActionText}`,
      "",
      `**${quickActionTitle}:**`,
      quickActionSection,
      "",
      `**${promptTitle}:**`,
      suggestedPromptSection,
    ].join("\n");
  }, [
    baseWelcomeMessage,
    effectiveRole,
    language,
    nextBestActionText,
    quickActions,
    suggestedPrompts,
    useBackendText,
    roadmapWelcomeContent,
  ]);

  useEffect(() => {
    welcomeMessageRef.current = welcomeMessageText;
  }, [welcomeMessageText]);

  const placeholderText = useMemo(
    () => ({
      en:
        effectiveRole === "RECRUITER"
          ? "Ask about jobs or applicants..."
          : effectiveRole === "MENTOR"
            ? "Ask about course or booking..."
            : effectiveRole === "LEARNER"
              ? "Ask about entry test or roadmap..."
              : "Ask anything...",
      vi:
        effectiveRole === "RECRUITER"
          ? "Hỏi về job hoặc ứng viên..."
          : effectiveRole === "MENTOR"
            ? "Hỏi về course hoặc booking..."
            : effectiveRole === "LEARNER"
              ? "Hỏi về test đầu vào hoặc roadmap..."
              : "Bạn muốn hỏi gì?",
    }),
    [effectiveRole],
  );

  const inputPromptChips = useMemo(() => {
    const chips = new Set<string>();
    // Add roadmap context prompts when in roadmap mode
    if (roadmapWelcomeContent) {
      roadmapWelcomeContent.suggestedPrompts.forEach((prompt) => chips.add(prompt));
    }
    suggestedPrompts.forEach((prompt) => {
      const normalized = prompt.trim();
      if (normalized) chips.add(normalized);
    });
    quickActions
      .filter((action) => action.actionType === "PROMPT")
      .forEach((action) => {
        const prompt = action.actionValue?.trim();
        if (prompt) chips.add(prompt);
      });
    return Array.from(chips).slice(0, 4);
  }, [quickActions, suggestedPrompts, activeRoadmapContext]);

  const resetConversation = useCallback(
    (welcomeText: string) => {
      setMessages([createWelcomeMessage(welcomeText)]);
      setMeowlSessionId(createMeowlSessionId());
    },
    [],
  );

  useEffect(() => {
    if (!isOpen) return;

    if (!persistedChatKey) {
      setRestoredFromPersistence(false);
      setHasHydratedChatState(true);
      setHydratedChatKey(null);
      return;
    }

    try {
      const storedState = localStorage.getItem(persistedChatKey);
      if (!storedState) {
        setMessages([]);
        setRestoredFromPersistence(false);
        setMeowlSessionId(createMeowlSessionId());
        setHasHydratedChatState(true);
        setHydratedChatKey(persistedChatKey);
        return;
      }

      const parsedState = JSON.parse(storedState) as PersistedMeowlChatState;
      const persistedMessages = normalizePersistedMessages(
        parsedState.messages,
        welcomeMessageRef.current,
      );

      setMessages(persistedMessages);
      setMeowlSessionId(parsedState.sessionId || createMeowlSessionId());
      setActiveRole(parsedState.activeRole || "GENERAL");
      setAvailableRoleModes(
        parsedState.availableRoleModes?.length
          ? parsedState.availableRoleModes
          : accountRoleModes,
      );
      setOnboardingContext(parsedState.onboardingContext || null);
      setRestoredFromPersistence(true);
      setHydratedChatKey(persistedChatKey);
    } catch (error) {
      console.warn("Failed to restore persisted Meowl chat state:", error);
      localStorage.removeItem(persistedChatKey);
      setMessages([]);
      setRestoredFromPersistence(false);
      setMeowlSessionId(createMeowlSessionId());
      setHydratedChatKey(persistedChatKey);
    } finally {
      setHasHydratedChatState(true);
    }
  }, [
    accountRoleModes,
    isOpen,
    persistedChatKey,
  ]);

  useEffect(() => {
    if (
      !persistedChatKey ||
      !hasHydratedChatState ||
      hydratedChatKey !== persistedChatKey ||
      !isOpen
    ) {
      return;
    }

    const persistedState: PersistedMeowlChatState = {
      version: MEOWL_CHAT_PERSISTENCE_VERSION,
      sessionId: meowlSessionId,
      activeRole,
      availableRoleModes,
      onboardingContext,
      messages: messages.map((message) => ({
        ...message,
        timestamp: message.timestamp.toISOString(),
      })),
      updatedAt: Date.now(),
    };

    localStorage.setItem(persistedChatKey, JSON.stringify(persistedState));
  }, [
    activeRole,
    availableRoleModes,
    hasHydratedChatState,
    hydratedChatKey,
    isOpen,
    meowlSessionId,
    messages,
    onboardingContext,
    persistedChatKey,
  ]);

  // Listen for logout event to immediately clear messages
  useEffect(() => {
    const handleLogout = () => {
      if (persistedChatKey) {
        localStorage.removeItem(persistedChatKey);
      }
      setHydratedChatKey(null);
      setHasHydratedChatState(false);
      setRestoredFromPersistence(false);
      setOnboardingContext(null);
      resetConversation(welcomeMessageText);
      createNewGuestSession();
    };

    window.addEventListener("meowl-logout", handleLogout);
    return () => window.removeEventListener("meowl-logout", handleLogout);
  }, [persistedChatKey, resetConversation, welcomeMessageText]);

  // Initialize guest session
  useEffect(() => {
    if (!isAuthenticated) {
      const stored = sessionStorage.getItem(GUEST_SESSION_KEY);
      if (stored) {
        try {
          const session = JSON.parse(stored) as GuestSession;
          // Check if session is still valid (within 1 hour)
          if (Date.now() - session.createdAt < 3600000) {
            setGuestSession(session);
          } else {
            // Session expired, create new one
            createNewGuestSession();
          }
        } catch {
          createNewGuestSession();
        }
      } else {
        createNewGuestSession();
      }
    } else {
      // User is logged in, clear guest session
      sessionStorage.removeItem(GUEST_SESSION_KEY);
      setGuestSession(null);
    }
  }, [isAuthenticated]);

  const createNewGuestSession = () => {
    const newSession: GuestSession = {
      messageCount: 0,
      sessionId: `guest_${Date.now()}`,
      createdAt: Date.now(),
    };
    sessionStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(newSession));
    setGuestSession(newSession);
  };

  // Save preferences
  useEffect(() => {
    localStorage.setItem("meowl_theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("meowl_font_size", fontSize.toString());
  }, [fontSize]);

  const fetchOnboardingContext = useCallback(
    async (roleOverride?: MeowlRoleMode) => {
      if (!isAuthenticated || !user?.id) return;
      setOnboardingLoading(true);
      try {
        const response = await meowlChatService.getOnboardingContext(
          user.id,
          language === "vi" ? "vi" : "en",
          roleOverride || activeRole,
        );

        if (response) {
          setOnboardingContext(response);
          setAvailableRoleModes(
            response.availableRoles?.length
              ? response.availableRoles
              : accountRoleModes,
          );
          if (response.activeRole && response.activeRole !== activeRole) {
            setActiveRole(response.activeRole);
          }
          if (!response.onboardingSeen) {
            void meowlChatService.markOnboardingSeen(
              user.id,
              response.activeRole || activeRole,
            );
          }
        }
      } catch (error) {
        console.error("Failed to fetch Meowl onboarding context:", error);
      } finally {
        setOnboardingLoading(false);
      }
    },
    [accountRoleModes, activeRole, isAuthenticated, language, user?.id],
  );

  useEffect(() => {
    if (isAuthenticated && user?.id && isOpen) {
      void fetchOnboardingContext();
    }
  }, [fetchOnboardingContext, isAuthenticated, isOpen, user?.id]);

  // Initialize with welcome message
  useEffect(() => {
    if (!isOpen || !hasHydratedChatState) return;
    if (isAuthenticated && user?.id && !restoredFromPersistence) return;
    if (messages.length === 0) {
      setMessages([createWelcomeMessage(welcomeMessageText)]);
    }
  }, [
    hasHydratedChatState,
    isAuthenticated,
    isOpen,
    messages.length,
    restoredFromPersistence,
    user?.id,
    welcomeMessageText,
  ]);

  useEffect(() => {
    if (!isOpen || !hasHydratedChatState) return;
    setMessages((prev) => {
      if (prev.length === 0) return prev;
      if (prev[0].id !== "welcome") return prev;
      if (prev[0].content === welcomeMessageText) return prev;
      return [
        {
          ...prev[0],
          content: welcomeMessageText,
          timestamp: new Date(),
        },
        ...prev.slice(1),
      ];
    });
  }, [hasHydratedChatState, isOpen, welcomeMessageText]);

  // Load chat history for logged-in users
  useEffect(() => {
    if (
      isAuthenticated &&
      user?.id &&
      isOpen &&
      hasHydratedChatState &&
      !restoredFromPersistence
    ) {
      void loadChatHistory();
    }
  }, [
    hasHydratedChatState,
    isAuthenticated,
    isOpen,
    restoredFromPersistence,
    user?.id,
  ]);

  const loadChatHistory = async () => {
    if (!user?.id) return;
    try {
      const response = await axiosInstance.get(`/v1/meowl/history/${user.id}`);
      if (response.data && response.data.length > 0) {
        const historyMessages: Message[] = response.data.map(
          (msg: any, index: number) => ({
            id: `history_${index}`,
            role: msg.role,
            content: msg.content,
            timestamp: new Date(),
          }),
        );
        // Add welcome message at the beginning if not present
        setMessages([createWelcomeMessage(welcomeMessageText), ...historyMessages]);
      } else {
        setMessages([createWelcomeMessage(welcomeMessageText)]);
      }
    } catch (error) {
      console.error("Failed to load chat history:", error);
      setMessages((prev) =>
        prev.length > 0 ? prev : [createWelcomeMessage(welcomeMessageText)],
      );
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    if (messages.length === 1 && messages[0]?.id === "welcome") {
      messagesContainerRef.current?.scrollTo({ top: 0, behavior: "auto" });
      return;
    }
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Check guest message limit
  const checkGuestLimit = useCallback(() => {
    if (isAuthenticated) return true;

    if (guestSession && guestSession.messageCount >= GUEST_MESSAGE_LIMIT) {
      setShowLoginPrompt(true);
      return false;
    }
    return true;
  }, [isAuthenticated, guestSession]);

  // Increment guest message count
  const incrementGuestCount = useCallback(() => {
    if (!isAuthenticated && guestSession) {
      const updatedSession = {
        ...guestSession,
        messageCount: guestSession.messageCount + 1,
      };
      sessionStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(updatedSession));
      setGuestSession(updatedSession);

      // Check if reached limit after this message
      if (updatedSession.messageCount >= GUEST_MESSAGE_LIMIT) {
        setTimeout(() => setShowLoginPrompt(true), 1500);
      }
    }
  }, [isAuthenticated, guestSession]);

  const handleActionClick = (url: string) => {
    onClose();
    navigate(url);
  };

  const handleRoleModeChange = (role: MeowlRoleMode) => {
    if (role === activeRole) return;
    setActiveRole(role);
    if (isAuthenticated && user?.id) {
      void fetchOnboardingContext(role);
    } else {
      setOnboardingContext(null);
    }
  };

  const clearChatHistory = async () => {
    if (user?.id) {
      try {
        await axiosInstance.delete(`/v1/meowl/history/${user.id}`);
      } catch (error) {
        console.error("Failed to clear chat history:", error);
      }
    }
    if (persistedChatKey) {
      localStorage.removeItem(persistedChatKey);
    }
    setRestoredFromPersistence(false);
    resetConversation(welcomeMessageText);
  };

  const sendMessage = async (overrideText?: string) => {
    const content = (overrideText ?? inputValue).trim();
    if (!content || isLoading) return;

    // Check guest limit before sending
    if (!checkGuestLimit()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
    };

    // Easter egg
    const normalized = userMessage.content
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
    if (/^con jv[!?.,]*$/.test(normalized)) {
      const eggResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "con mẹ mày",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage, eggResponse]);
      setInputValue("");
      incrementGuestCount();
      return;
    }

    // Guard check
    const guard = guardUserInput(userMessage.content);
    if (!guard.allow) {
      const fallback: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: pickFallback(guard.reason, language === "vi" ? "vi" : "en"),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage, fallback]);
      setInputValue("");
      incrementGuestCount();
      return;
    }

    setMessages((prev) => [...prev, userMessage]);
    if (!overrideText) setInputValue("");
    setIsLoading(true);

    try {
      // Build message: use context envelope for context-aware modes, plain for general FAQ
      const isContextAware = contextMode !== "MODE_GENERAL_FAQ";
      const lang: "vi" | "en" = language === "vi" ? "vi" : "en";

      const apiPayload = isContextAware
        ? buildMeowlContextEnvelope({
          mode: contextMode,
          language: lang,
          title: isCourseMode
            ? (courseContext?.activeLessonTitle || courseContext?.courseTitle || (language === "vi" ? "Bài học" : "Lesson"))
            : (activeRoadmapContext?.nodeTitle || (language === "vi" ? "Roadmap" : "Roadmap")),
          subtitle: isCourseMode
            ? (courseContext?.courseTitle || (language === "vi" ? "Khóa học" : "Course"))
            : (activeRoadmapContext?.roadmapTitle || (language === "vi" ? "Lộ trình học tập" : "Learning Roadmap")),
          contextSummary: isCourseMode ? courseContextSummary : roadmapContextSummary,
          userMessage: userMessage.content,
          nodeDossier: isCourseMode ? null : roadmapNodeDossier,
          repairInstruction: null,
        })
        : userMessage.content;

      // Quick-create study plan: detect intent BEFORE calling AI.
      // If detected, skip AI and call API directly for faster response.
      const quickIntent =
        (contextMode === "MODE_ROADMAP_OVERVIEW" || contextMode === "MODE_FALLBACK_TEACHER")
          ? detectStudyPlanIntent(userMessage.content, roadmapNodeDossier, selectedRoadmapId)
          : null;

      if (quickIntent) {
        if (!hasStudentTierAccess) {
          const lockedResponse: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content:
              language === "vi"
                ? 'Tính năng tạo Study Plan từ roadmap node yêu cầu gói Bạc (Sinh viên) trở lên. Bạn có thể tiếp tục chat ở chế độ thường nhé. 🐱'
                : "Creating Study Plan from a roadmap node requires Student tier or above. You can keep chatting in normal mode. 🐱",
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, lockedResponse]);
          incrementGuestCount();
          return;
        }

        await handleQuickCreateStudyPlan(quickIntent);
        incrementGuestCount();
        return;
      }

      const response = await axiosInstance.post("/v1/meowl/chat", {
        message: apiPayload,
        language: lang,
        userId: user?.id || null,
        activeRole: isAuthenticated ? "LEARNER" : "GENERAL",
        sessionId: meowlSessionId,
        includeReminders: !isContextAware,
        chatHistory: messages.slice(-10).map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
      });

      const data = response.data;
      if (data.activeRole && data.activeRole !== activeRole) {
        setActiveRole(data.activeRole);
      }
      if (data.nextBestAction) {
        setOnboardingContext((prev) =>
          prev
            ? {
              ...prev,
              nextBestAction: data.nextBestAction,
              activeRole: data.activeRole || prev.activeRole,
            }
            : prev,
        );
      }

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message || data.originalMessage || "...",
        timestamp: new Date(),
        actionType: data.actionType,
        actionUrl: data.actionUrl,
        actionLabel: data.actionLabel,
      };

      setMessages((prev) => [...prev, aiResponse]);
      incrementGuestCount();

      // Still detect study plan intent for action card as secondary option
      if (
        (contextMode === "MODE_ROADMAP_OVERVIEW" || contextMode === "MODE_FALLBACK_TEACHER") &&
        userMessage.content
      ) {
        const intent = detectStudyPlanIntent(
          userMessage.content,
          roadmapNodeDossier,
          selectedRoadmapId,
        );
        if (intent && hasStudentTierAccess) {
          setStudyPlanIntent(intent);
        } else {
          setStudyPlanIntent(null);
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          language === "en"
            ? "Sorry, I'm having trouble connecting right now. Please try again later. 🐱"
            : "Xin lỗi, tôi đang gặp sự cố kết nối. Vui lòng thử lại sau. 🐱",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Voice recording handlers
  const startRecording = async () => {
    if (!checkGuestLimit()) return;

    try {
      await recorder.start();
      setIsRecording(true);

      const SR: any =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      if (SR) {
        try {
          const recog = new SR();
          recognitionRef.current = recog;
          recog.lang = language === "vi" ? "vi-VN" : "en-US";
          recog.continuous = true;
          recog.interimResults = true;
          setPreviewText("");
          recog.onresult = (event: any) => {
            let interim = "";
            let final = "";
            for (let i = event.resultIndex; i < event.results.length; i++) {
              const transcript = event.results[i][0]?.transcript || "";
              if (event.results[i].isFinal) final += transcript + " ";
              else interim += transcript + " ";
            }
            setPreviewText(final || interim);
          };
          recog.onerror = (err: any) => {
            console.warn("SpeechRecognition error:", err);
          };
          recog.onend = () => {
            setIsPreviewing(false);
          };
          recog.start();
          setIsPreviewing(true);
        } catch (err) {
          console.warn("Unable to start SpeechRecognition:", err);
          setIsPreviewing(false);
        }
      }
    } catch (err) {
      console.error("Unable to start recording:", err);
    }
  };

  const stopRecording = async () => {
    try {
      if (recognitionRef.current) {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      setIsPreviewing(false);

      const result = await recorder.stop();
      setIsRecording(false);

      if (result.audioBlob) {
        try {
          const stt = await transcribeAudioViaBackend(result.audioBlob);
          const text = stt?.text?.trim() || "";
          if (text) {
            setInputValue(text);
            await sendMessage(text);
          } else if (previewText.trim()) {
            const fallbackText = previewText.trim();
            setInputValue(fallbackText);
            await sendMessage(fallbackText);
          }
        } catch (e) {
          console.error("STT backend error:", e);
          if (previewText.trim()) {
            const fallbackText = previewText.trim();
            setInputValue(fallbackText);
            await sendMessage(fallbackText);
          }
        }
      }
    } catch (err) {
      console.error("Unable to stop recording:", err);
      setIsRecording(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    // Auto-resize
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 84) + "px";
  };

  // Scroll navigation
  const scrollToTop = () => {
    messagesContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleLoginClick = () => {
    setShowLoginPrompt(false);
    onClose();
    if (onRequestLogin) {
      onRequestLogin();
    } else {
      navigate("/login");
    }
  };

  const applySuggestedPrompt = useCallback((prompt: string) => {
    setInputValue(prompt);
    requestAnimationFrame(() => {
      const textarea = inputRef.current;
      if (!textarea) return;
      textarea.focus();
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 84) + "px";
    });
  }, []);

  if (!isOpen) return null;

  const guestMessagesRemaining = guestSession
    ? GUEST_MESSAGE_LIMIT - guestSession.messageCount
    : GUEST_MESSAGE_LIMIT;
  const shouldShowRoleSwitcher =
    isAuthenticated &&
    (onboardingContext?.roleSwitchEnabled ?? availableRoleModes.length > 1) &&
    availableRoleModes.length > 1;

  return (
    <div
      className={`meowl-chat-v2-overlay ${theme}`}
    >
      <div
        className={`${panelTheme === "hud" ? "meowl-panel meowl-panel--hud" : "meowl-chat-v2-container"} ${density === "compact" && panelTheme === "hud" ? "meowl-panel--compact" : ""}`}
        style={panelTheme !== "hud" ? { fontSize: `${fontSize}px` } : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={panelTheme === "hud" ? "meowl-panel__header" : "meowl-chat-v2-header"}>
          {panelTheme === "hud" ? (
            <>
              <div className="meowl-panel__header-main">
                <div className="meowl-panel__icon-wrap">
                  <Sparkles size={18} />
                </div>
                <div>
                  <div className="meowl-panel__badge">
                    <Sparkles size={14} />
                    <span>{CONTEXT_MODE_LABELS[contextMode][language]}</span>
                  </div>
                  <h3 className="meowl-panel__title">
                    {language === "en" ? "Meowl Here!" : "Meowl đây nè!"}
                  </h3>
                  <p className="meowl-panel__subtitle">
                    {language === "en" ? "Your learning assistant" : "Trợ lý học tập của bạn"}
                  </p>
                </div>
              </div>
              <button
                className="meowl-panel__close-btn"
                onClick={onClose}
                title={language === "en" ? "Close" : "Đóng"}
              >
                <X size={16} />
              </button>
            </>
          ) : (
            <>
              <div className="meowl-chat-v2-header-left">
                <img
                  src="/images/meowl_bg_clear.png"
                  alt="Meowl"
                  className="meowl-chat-v2-header-avatar"
                />
                <div className="meowl-chat-v2-header-info">
                  <h3>{language === "en" ? "Meowl Here!" : "Meowl đây nè!"}</h3>
                  {contextMode !== "MODE_GENERAL_FAQ" && (
                    <span className="meowl-chat-v2-mode-badge">
                      {CONTEXT_MODE_LABELS[contextMode][language]}
                    </span>
                  )}
                  <span className="meowl-chat-v2-status-online">
                    {language === "en" ? "Online" : "Trực tuyến"}
                  </span>
                </div>
              </div>
              <div className="meowl-chat-v2-header-actions">
                <button
                  className="meowl-chat-v2-header-btn"
                  onClick={() => setShowSettings(!showSettings)}
                  title={language === "en" ? "Settings" : "Cài đặt"}
                >
                  <Settings size={18} />
                </button>
                <button
                  className="meowl-chat-v2-header-btn"
                  onClick={scrollToTop}
                  title={language === "en" ? "Scroll to top" : "Lên đầu"}
                >
                  <ChevronUp size={18} />
                </button>
                <button
                  className="meowl-chat-v2-header-btn"
                  onClick={scrollToBottom}
                  title={language === "en" ? "Scroll to bottom" : "Xuống cuối"}
                >
                  <ChevronDown size={18} />
                </button>
                {isAuthenticated && (
                  <button
                    className="meowl-chat-v2-header-btn danger"
                    onClick={clearChatHistory}
                    title={language === "en" ? "Clear history" : "Xóa lịch sử"}
                  >
                    <Trash2 size={18} />
                  </button>
                )}
                <button className="meowl-chat-v2-header-btn close" onClick={onClose}>
                  <X size={20} />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="meowl-chat-v2-settings-panel">
            <div className="meowl-chat-v2-setting-item">
              <span>{language === "en" ? "Theme" : "Giao diện"}</span>
              <div className="meowl-chat-v2-theme-selector">
                <button
                  className={`meowl-chat-v2-theme-btn cyan ${theme === "cyan" ? "active" : ""}`}
                  onClick={() => setTheme("cyan")}
                  title={
                    language === "en" ? "Cyan (Default)" : "Xanh (Mặc định)"
                  }
                />
                <button
                  className={`meowl-chat-v2-theme-btn pink ${theme === "pink" ? "active" : ""}`}
                  onClick={() => setTheme("pink")}
                  title={language === "en" ? "Pink/Sakura" : "Hồng/Sakura"}
                />
              </div>
            </div>
            <div className="meowl-chat-v2-setting-item">
              <span>{language === "en" ? "Font Size" : "Cỡ chữ"}</span>
              <div className="meowl-chat-v2-font-size-controls">
                <button
                  onClick={() => setFontSize(Math.max(12, fontSize - 1))}
                  disabled={fontSize <= 12}
                >
                  A-
                </button>
                <span>{fontSize}px</span>
                <button
                  onClick={() => setFontSize(Math.min(20, fontSize + 1))}
                  disabled={fontSize >= 20}
                >
                  A+
                </button>
              </div>
            </div>
            {effectiveAllowedModes.length > 1 && (
              <>
                <div className="meowl-chat-v2-setting-item">
                  <span>{language === "en" ? "Chat Mode" : "Chế độ chat"}</span>
                  <div className="meowl-chat-v2-mode-switcher">
                    {effectiveAllowedModes.map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        className={`meowl-chat-v2-mode-btn ${contextMode === mode ? "meowl-chat-v2-mode-btn--active" : ""}`}
                        onClick={() => setContextMode(mode)}
                      >
                        {CONTEXT_MODE_LABELS[mode][language]}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Roadmap + Node selector for roadmap mode */}
            {isRoadmapMode && (
              <>
                <div className="meowl-chat-v2-setting-item">
                  <span>{language === "en" ? "Roadmap" : "Lộ trình"}</span>
                  <select
                    className="meowl-chat-v2-selector-select"
                    value={selectedRoadmapId ?? ""}
                    onChange={(e) => setSelectedRoadmapId(Number(e.target.value) || null)}
                  >
                    <option value="">
                      {roadmapLoading
                        ? (language === "en" ? "Loading..." : "Đang tải...")
                        : (language === "en" ? "-- Select roadmap --" : "-- Chọn lộ trình --")}
                    </option>
                    {roadmapList.map((r) => (
                      <option key={r.sessionId} value={r.sessionId}>
                        {r.title} ({r.progressPercentage}%)
                      </option>
                    ))}
                  </select>
                </div>
                {selectedRoadmap && (
                  <div className="meowl-chat-v2-setting-item">
                    <span>{language === "en" ? "Node" : "Node"}</span>
                    <select
                      className="meowl-chat-v2-selector-select"
                      value={selectedNodeId ?? ""}
                      onChange={(e) => setSelectedNodeId(e.target.value || null)}
                    >
                      <option value="">
                        {language === "en" ? "-- Select node --" : "-- Chọn node --"}
                      </option>
                      {selectedRoadmap.nodes.map((n) => (
                        <option key={n.id} value={n.id}>
                          {n.nodeStatus === "COMPLETED" ? "✓ " : ""}{n.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            )}

            {/* Course module + content selectors for course tutor mode */}
            {isCourseMode && courseContext && courseContext.modules && (
              <>
                <div className="meowl-chat-v2-setting-item">
                  <span>{language === "en" ? "Module" : "Chương"}</span>
                  <select
                    className="meowl-chat-v2-selector-select"
                    value={selectedCourseModuleId ?? courseContext.activeModuleId ?? ""}
                    onChange={(e) => {
                      const modId = Number(e.target.value) || null;
                      setSelectedCourseModuleId(modId);
                      setSelectedCourseLessonId(null);
                    }}
                  >
                    <option value="">
                      {language === "en" ? "-- Select module --" : "-- Chọn chương --"}
                    </option>
                    {courseContext.modules.map((mod) => (
                      <option key={mod.moduleId} value={mod.moduleId}>
                        {mod.moduleTitle}
                      </option>
                    ))}
                  </select>
                </div>
                {selectedCourseModuleId && (() => {
                  const mod = courseContext.modules?.find((m) => m.moduleId === selectedCourseModuleId);
                  if (!mod) return null;

                  const lessons = mod.lessons ?? [];
                  const quizzes = mod.quizzes ?? [];
                  const assignments = mod.assignments ?? [];
                  const allItems = [...lessons, ...quizzes, ...assignments];

                  return (
                    <>
                      {/* Content type tabs */}
                      <div className="meowl-chat-v2-course-content-tabs">
                        <button
                          type="button"
                          className={`meowl-chat-v2-course-tab ${selectedContentType === "lesson" ? "active" : ""}`}
                          onClick={() => { setSelectedContentType("lesson"); setSelectedCourseLessonId(null); }}
                        >
                          {language === "en" ? "Lessons" : "Bài học"}
                          {lessons.length > 0 && <span className="tab-count">{lessons.length}</span>}
                        </button>
                        <button
                          type="button"
                          className={`meowl-chat-v2-course-tab ${selectedContentType === "quiz" ? "active" : ""}`}
                          onClick={() => { setSelectedContentType("quiz"); setSelectedCourseLessonId(null); }}
                        >
                          {language === "en" ? "Quizzes" : "Kiểm tra"}
                          {quizzes.length > 0 && <span className="tab-count">{quizzes.length}</span>}
                        </button>
                        <button
                          type="button"
                          className={`meowl-chat-v2-course-tab ${selectedContentType === "assignment" ? "active" : ""}`}
                          onClick={() => { setSelectedContentType("assignment"); setSelectedCourseLessonId(null); }}
                        >
                          {language === "en" ? "Tasks" : "Bài tập"}
                          {assignments.length > 0 && <span className="tab-count">{assignments.length}</span>}
                        </button>
                      </div>

                      {/* Content items list */}
                      <div className="meowl-chat-v2-course-items">
                        {selectedContentType === "lesson" && lessons.length > 0 && lessons.map((l) => (
                          <button
                            key={l.lessonId}
                            type="button"
                            className={`meowl-chat-v2-course-item ${selectedCourseLessonId === l.lessonId ? "active" : ""}`}
                            onClick={() => setSelectedCourseLessonId(l.lessonId)}
                          >
                            {language === "en" ? "📄" : "📄"} {l.lessonTitle}
                          </button>
                        ))}
                        {selectedContentType === "quiz" && quizzes.length > 0 && quizzes.map((q) => (
                          <button
                            key={q.lessonId}
                            type="button"
                            className={`meowl-chat-v2-course-item quiz ${selectedCourseLessonId === q.lessonId ? "active" : ""}`}
                            onClick={() => setSelectedCourseLessonId(q.lessonId)}
                          >
                            {language === "en" ? "📝" : "📝"} {q.lessonTitle}
                          </button>
                        ))}
                        {selectedContentType === "assignment" && assignments.length > 0 && assignments.map((a) => (
                          <button
                            key={a.lessonId}
                            type="button"
                            className={`meowl-chat-v2-course-item assignment ${selectedCourseLessonId === a.lessonId ? "active" : ""}`}
                            onClick={() => setSelectedCourseLessonId(a.lessonId)}
                          >
                            {language === "en" ? "📋" : "📋"} {a.lessonTitle}
                          </button>
                        ))}
                        {selectedContentType === "lesson" && lessons.length === 0 && (
                          <div className="meowl-chat-v2-course-empty">
                            {language === "en" ? "No lessons in this module" : "Chương này chưa có bài học"}
                          </div>
                        )}
                        {selectedContentType === "quiz" && quizzes.length === 0 && (
                          <div className="meowl-chat-v2-course-empty">
                            {language === "en" ? "No quizzes in this module" : "Chương này chưa có bài kiểm tra"}
                          </div>
                        )}
                        {selectedContentType === "assignment" && assignments.length === 0 && (
                          <div className="meowl-chat-v2-course-empty">
                            {language === "en" ? "No assignments in this module" : "Chương này chưa có bài tập"}
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}
              </>
            )}
          </div>
        )}

        {/* Guest message counter */}
        {!isAuthenticated && guestSession && (
          <div className="meowl-chat-v2-guest-counter">
            <MessageSquare size={14} />
            <span>
              {language === "en"
                ? `${guestMessagesRemaining} free messages remaining`
                : `Còn ${guestMessagesRemaining} tin nhắn miễn phí`}
            </span>
          </div>
        )}

        {/* Role switcher */}
        {shouldShowRoleSwitcher && (
          <div className="meowl-chat-v2-role-switcher">
            {availableRoleModes.map((roleMode) => (
              <button
                key={roleMode}
                type="button"
                className={`meowl-chat-v2-role-btn ${effectiveRole === roleMode ? "active" : ""}`}
                onClick={() => handleRoleModeChange(roleMode)}
                disabled={onboardingLoading}
              >
                {roleLabels[roleMode]}
              </button>
            ))}
          </div>
        )}

        {/* Messages Container */}
        {panelTheme === "hud" ? (
          <div className="meowl-panel__messages" ref={messagesContainerRef}>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`meowl-panel__message ${message.role === "assistant" ? "meowl-panel__message--assistant" : "meowl-panel__message--user"}`}
              >
                <div className="meowl-panel__message-bubble">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="meowl-panel__message meowl-panel__message--assistant">
                <div className="meowl-panel__message-bubble">
                  <MeowlKuruLoader size="tiny" text="" />
                  <span>
                    {language === "en" ? "Meowl is thinking..." : "Meowl đang suy nghĩ..."}
                  </span>
                </div>
              </div>
            )}
            {!messages.length && !isLoading && (
              <div className="meowl-panel__empty-conversation">
                {language === "en"
                  ? "Ask Meowl anything about this context..."
                  : "Hỏi Meowl bất cứ điều gì về ngữ cảnh này..."}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="meowl-chat-v2-messages" ref={messagesContainerRef}>
            {messages.map((message) => (
              <MessageItem
                key={message.id}
                message={message}
                onActionClick={handleActionClick}
              />
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="meowl-chat-v2-message-wrapper assistant">
                <div className="meowl-chat-v2-message-avatar">
                  <img src="/images/meowl_bg_clear.png" alt="Meowl" />
                </div>
                <div className="meowl-chat-v2-message-content">
                  <div className="meowl-chat-v2-message-bubble loading">
                    <MeowlKuruLoader size="tiny" text="" />
                    <span>
                      {language === "en"
                        ? "Meowl is thinking..."
                        : "Meowl đang suy nghĩ..."}
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Input Container */}
        <div className={panelTheme === "hud" ? "meowl-panel__composer" : "meowl-chat-v2-input"}>
          {/* Preview text */}
          {isPreviewing && (
            <div className="meowl-chat-v2-voice-preview">
              {language === "en" ? "Preview:" : "Xem trước:"}{" "}
              {previewText ||
                (language === "en" ? "Listening..." : "Đang nghe...")}
            </div>
          )}

          {inputPromptChips.length > 0 && (
            <div className={panelTheme === "hud" ? "meowl-panel__prompt-list" : "meowl-chat-v2-suggested-inputs"}>
              {inputPromptChips.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  className={panelTheme === "hud" ? "meowl-panel__prompt-chip" : "meowl-chat-v2-suggested-input-btn"}
                  onClick={() => applySuggestedPrompt(prompt)}
                  disabled={isLoading}
                  title={prompt}
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          <div className={panelTheme === "hud" ? "" : "meowl-chat-v2-input-wrapper"}>
            {/* Voice button */}
            {panelTheme !== "hud" && (
              <button
                className={`meowl-chat-v2-input-btn voice ${isRecording ? "recording" : ""}`}
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isLoading}
                title={
                  isRecording
                    ? language === "en"
                      ? "Stop"
                      : "Dừng"
                    : language === "en"
                      ? "Voice"
                      : "Ghi âm"
                }
              >
                {isRecording ? <Square size={18} /> : <Mic size={18} />}
              </button>
            )}

            {/* Text input */}
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              placeholder={placeholderText[language]}
              className={panelTheme === "hud" ? "meowl-panel__textarea" : "meowl-chat-v2-chat-textarea"}
              disabled={isLoading}
              rows={1}
            />

            {/* Send button */}
            <button
              className={panelTheme === "hud" ? "meowl-panel__send-btn" : "meowl-chat-v2-input-btn send"}
              onClick={() => sendMessage()}
              disabled={!inputValue.trim() || isLoading}
            >
              <Send size={16} />
              {panelTheme === "hud" && (
                <span>{language === "en" ? "Send" : "Gửi"}</span>
              )}
            </button>
          </div>
        </div>

        {/* Study Plan Intent Action Card */}
        {studyPlanIntent && hasStudentTierAccess && (
          <div
            className={
              panelTheme === "hud"
                ? "meowl-chat-v2-study-plan-action meowl-panel__study-plan-action"
                : "meowl-chat-v2-study-plan-action"
            }
          >
            <div className="meowl-study-plan-action__preview">
              <Sparkles size={14} />
              <span>
                {language === "vi"
                  ? `Mình nhận thấy bạn muốn tạo study plan cho node "${studyPlanIntent.nodeId}". Mình đã gợi ý sẵn deadline, cường độ và lịch học phù hợp dựa trên khối lượng node này.`
                  : `I noticed you want to create a study plan for node "${studyPlanIntent.nodeId}". I've pre-filled deadline, intensity, and schedule based on this node's workload.`}
              </span>
            </div>
            <button
              type="button"
              className="meowl-study-plan-action__btn"
              onClick={() => {
                window.dispatchEvent(
                  new CustomEvent("meowl-study-plan-intent", {
                    detail: studyPlanIntent,
                  }),
                );
                setStudyPlanIntent(null);
              }}
            >
              <Sparkles size={14} />
              <span>{language === "vi" ? "Mở tạo Study Plan" : "Open Create Study Plan"}</span>
            </button>
          </div>
        )}

        {/* Login Prompt Modal */}
        {showLoginPrompt && (
          <div className="meowl-chat-v2-login-prompt-overlay">
            <div className="meowl-chat-v2-login-prompt-modal">
              <div className="meowl-chat-v2-prompt-content">
                <img
                  src="/images/meowl_bg_clear.png"
                  alt="Meowl"
                  className="meowl-chat-v2-prompt-avatar"
                />
                <h3>
                  {language === "en"
                    ? "You've used all your free messages! 🐱"
                    : "Bạn đã dùng hết tin nhắn miễn phí! 🐱"}
                </h3>
                <p>
                  {language === "en"
                    ? "Login or create an account to continue chatting with Meowl and unlock unlimited conversations!"
                    : "Đăng nhập hoặc tạo tài khoản để tiếp tục chat với Meowl và mở khóa cuộc trò chuyện không giới hạn!"}
                </p>
                <div className="meowl-chat-v2-prompt-actions">
                  <button className="meowl-chat-v2-btn-login" onClick={handleLoginClick}>
                    {language === "en"
                      ? "Login / Sign Up"
                      : "Đăng nhập / Đăng ký"}
                  </button>
                  <button
                    className="meowl-chat-v2-btn-close"
                    onClick={() => setShowLoginPrompt(false)}
                  >
                    {language === "en" ? "Maybe Later" : "Để sau"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Learning Report Modal */}
      <LearningReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        meowlSkin={true}
      />
    </div>
  );
};

export default MeowlChatV2;






















