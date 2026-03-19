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

// Guest message limit
const GUEST_MESSAGE_LIMIT = 5;
const GUEST_SESSION_KEY = "meowl_guest_session";
const MEOWL_CHAT_PERSISTENCE_VERSION = 1;

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
}) => {
  const { language } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
              ? "Recruiter mode enabled. I will guide profile, job posting, applicants, and shortlist actions."
              : "Chào bạn, Meowl đang ở chế độ Recruiter Assistant nè. Mình sẽ hỗ trợ bạn theo từng bước: hồ sơ, đăng job, xử lý applicants và shortlist.",
            nextBestAction: isEn
              ? "Create or review your active job postings in Business dashboard."
              : "Mở Business dashboard để tạo job mới hoặc rà soát các job đang tuyển nhé.",
            whatYouCanDo: isEn
              ? [
                  "Guide recruiter profile and job flow",
                  "Suggest applicant review sequence",
                  "Provide clear next hiring action",
                  "Explain recruiter premium benefits and when to upgrade",
                ]
              : [
                  "Hướng dẫn tối ưu hồ sơ recruiter và flow đăng job",
                  "Gợi ý thứ tự xử lý applicants để shortlist nhanh",
                  "Đề xuất bước tuyển dụng tiếp theo theo trạng thái thực tế",
                  "Giải thích quyền lợi Premium cho recruiter và thời điểm nên nâng cấp",
                ],
            quickActions: isEn
              ? [
                  {
                    id: "recruiter-profile",
                    label: "Recruiter profile",
                    description: "Open recruiter/business profile",
                    actionType: "NAVIGATE",
                    actionValue: "/profile/business",
                  },
                  {
                    id: "business-dashboard",
                    label: "Business dashboard",
                    description: "Create and manage job postings",
                    actionType: "NAVIGATE",
                    actionValue: "/business",
                  },
                  {
                    id: "jobs",
                    label: "Job board",
                    description: "Open jobs list",
                    actionType: "NAVIGATE",
                    actionValue: "/jobs",
                  },
                  {
                    id: "recruiter-premium",
                    label: "Recruiter premium",
                    description: "View recruiter premium benefits",
                    actionType: "NAVIGATE",
                    actionValue: "/business/premium",
                  },
                ]
              : [
                  {
                    id: "recruiter-profile",
                    label: "Hồ sơ Recruiter",
                    description: "Mở hồ sơ business",
                    actionType: "NAVIGATE",
                    actionValue: "/profile/business",
                  },
                  {
                    id: "business-dashboard",
                    label: "Business dashboard",
                    description: "Tạo và quản lý job posting",
                    actionType: "NAVIGATE",
                    actionValue: "/business",
                  },
                  {
                    id: "jobs",
                    label: "Danh sách Jobs",
                    description: "Mở danh sách job đang có",
                    actionType: "NAVIGATE",
                    actionValue: "/jobs",
                  },
                  {
                    id: "recruiter-premium",
                    label: "Premium Recruiter",
                    description: "Xem quyền lợi gói recruiter",
                    actionType: "NAVIGATE",
                    actionValue: "/business/premium",
                  },
                ],
            suggestedPrompts: isEn
              ? [
                  "Guide me to post my first job on SkillVerse.",
                  "How should I review applicants and shortlist quickly?",
                  "What premium recruiter benefits can improve hiring speed?",
                ]
              : [
                  "Hướng dẫn tôi đăng job đầu tiên trên SkillVerse.",
                  "Tôi nên review applicants và shortlist nhanh theo cách nào?",
                  "Quyền lợi Premium Recruiter giúp tôi tuyển nhanh hơn như thế nào?",
                ],
          };
        case "MENTOR":
          return {
            welcome: isEn
              ? "Mentor mode enabled. I can onboard you on profile, course publishing, and booking setup."
              : "Chào mentor, Meowl đang ở chế độ Mentor Assistant nè. Mình sẽ đồng hành từ profile đến course, publish và booking.",
            nextBestAction: isEn
              ? "Create or publish your first mentor course."
              : "Bắt đầu bằng việc tạo hoặc publish course đầu tiên nhé.",
            whatYouCanDo: isEn
              ? [
                  "Course creation to publish guidance",
                  "Availability and booking setup",
                  "Mentor operations checklist",
                ]
              : [
                  "Hướng dẫn flow từ tạo course đến publish",
                  "Gợi ý setup availability và booking rõ ràng",
                  "Đưa checklist vận hành mentor theo bối cảnh hiện tại",
                ],
            quickActions: isEn
              ? [
                  {
                    id: "mentor-profile",
                    label: "Mentor profile",
                    description: "Open profile setup",
                    actionType: "NAVIGATE",
                    actionValue: "/profile/mentor",
                  },
                  {
                    id: "create-course",
                    label: "Create course",
                    description: "Open mentor course builder",
                    actionType: "NAVIGATE",
                    actionValue: "/mentor/courses/create",
                  },
                  {
                    id: "mentor-dashboard",
                    label: "Mentor dashboard",
                    description: "Manage courses and sessions",
                    actionType: "NAVIGATE",
                    actionValue: "/mentor",
                  },
                ]
              : [
                  {
                    id: "mentor-profile",
                    label: "Hồ sơ Mentor",
                    description: "Mở trang profile mentor",
                    actionType: "NAVIGATE",
                    actionValue: "/profile/mentor",
                  },
                  {
                    id: "create-course",
                    label: "Tạo Course",
                    description: "Mở course builder của mentor",
                    actionType: "NAVIGATE",
                    actionValue: "/mentor/courses/create",
                  },
                  {
                    id: "mentor-dashboard",
                    label: "Mentor dashboard",
                    description: "Quản lý course và session",
                    actionType: "NAVIGATE",
                    actionValue: "/mentor",
                  },
                ],
            suggestedPrompts: isEn
              ? [
                  "What sequence should I follow from draft to publish?",
                  "I have courses but no bookings. What is next?",
                ]
              : [
                  "Tôi nên đi theo trình tự nào từ draft đến publish course?",
                  "Tôi đã có course nhưng chưa có booking, nên làm gì tiếp?",
                ],
          };
        case "LEARNER":
          return {
            welcome: isEn
              ? "Learner mode enabled. I will guide you from entry assessment to roadmap, courses, and mentor booking."
              : "Chào bạn, Meowl đang ở chế độ Learner Assistant nè. Mình sẽ hướng dẫn bạn từ test đầu vào đến roadmap, khóa học và mentor.",
            nextBestAction: isEn
              ? "Start your entry assessment in Guided Journey."
              : "Bắt đầu bài test đầu vào trong Guided Journey để có roadmap cá nhân hóa nhé.",
            whatYouCanDo: isEn
              ? [
                  "Step-by-step entry test guidance",
                  "Assessment result interpretation",
                  "Roadmap and course next actions",
                  "Explain learner premium benefits for roadmap and expert support",
                ]
              : [
                  "Hướng dẫn từng bước làm test đầu vào thật rõ ràng",
                  "Giải thích kết quả assessment theo cách dễ hiểu",
                  "Gợi ý roadmap, course và mentor theo bước tiếp theo phù hợp",
                  "Giải thích quyền lợi Premium cho learner theo mục tiêu hiện tại",
                ],
            quickActions: isEn
              ? [
                  {
                    id: "entry-test",
                    label: "Start entry test",
                    description: "Create assessment flow",
                    actionType: "NAVIGATE",
                    actionValue: "/journey/create",
                  },
                  {
                    id: "journey",
                    label: "Continue journey",
                    description: "Open current assessment progress",
                    actionType: "NAVIGATE",
                    actionValue: "/journey",
                  },
                  {
                    id: "roadmap",
                    label: "View roadmap",
                    description: "Go to learning roadmap",
                    actionType: "NAVIGATE",
                    actionValue: "/roadmap",
                  },
                  {
                    id: "learner-premium",
                    label: "Premium benefits",
                    description: "Open learner premium page",
                    actionType: "NAVIGATE",
                    actionValue: "/premium",
                  },
                ]
              : [
                  {
                    id: "entry-test",
                    label: "Tạo test đầu vào",
                    description: "Bắt đầu flow đánh giá",
                    actionType: "NAVIGATE",
                    actionValue: "/journey/create",
                  },
                  {
                    id: "journey",
                    label: "Tiếp tục Journey",
                    description: "Mở tiến độ assessment hiện tại",
                    actionType: "NAVIGATE",
                    actionValue: "/journey",
                  },
                  {
                    id: "roadmap",
                    label: "Xem Roadmap",
                    description: "Đi đến lộ trình học",
                    actionType: "NAVIGATE",
                    actionValue: "/roadmap",
                  },
                  {
                    id: "learner-premium",
                    label: "Quyền lợi Premium",
                    description: "Xem gói premium cho learner",
                    actionType: "NAVIGATE",
                    actionValue: "/premium",
                  },
                ],
            suggestedPrompts: isEn
              ? [
                  "Guide me step by step to complete the entry test.",
                  "What should I do right after finishing assessment?",
                  "What learner premium benefits help me learn faster?",
                ]
              : [
                  "Hướng dẫn tôi từng bước hoàn thành test đầu vào.",
                  "Sau khi làm xong assessment tôi nên làm gì tiếp?",
                  "Gói Premium cho learner hỗ trợ roadmap và mentor ra sao?",
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

  const useBackendText = language === "en";
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
  }, [quickActions, suggestedPrompts]);

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
      const response = await axiosInstance.post("/v1/meowl/chat", {
        message: userMessage.content,
        language: language === "vi" ? "vi" : "en",
        userId: user?.id || null,
        activeRole,
        sessionId: meowlSessionId,
        includeReminders: true,
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
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="meowl-chat-v2-container"
        style={{ fontSize: `${fontSize}px` }}
      >
        {/* Header */}
        <div className="meowl-chat-v2-header">
          <div className="meowl-chat-v2-header-left">
            <img
              src="/images/meowl_bg_clear.png"
              alt="Meowl"
              className="meowl-chat-v2-header-avatar"
            />
            <div className="meowl-chat-v2-header-info">
              <h3>{language === "en" ? "Meowl Here!" : "Meowl đây nè!"}</h3>
              <span className="meowl-chat-v2-status-online">
                {language === "en" ? "Online" : "Trực tuyến"}
              </span>
            </div>
          </div>
          <div className="meowl-chat-v2-header-actions">
            {/* Settings button */}
            <button
              className="meowl-chat-v2-header-btn"
              onClick={() => setShowSettings(!showSettings)}
              title={language === "en" ? "Settings" : "Cài đặt"}
            >
              <Settings size={18} />
            </button>
            {/* Learning Report (logged in only) */}
            {isAuthenticated && (
              <button
                className="meowl-chat-v2-header-btn report"
                onClick={() => setIsReportModalOpen(true)}
                title={
                  language === "en" ? "Learning Report" : "Báo cáo học tập"
                }
              >
                <BarChart2 size={18} />
              </button>
            )}
            {/* History navigation */}
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
            {/* Clear history (logged in only) */}
            {isAuthenticated && (
              <button
                className="meowl-chat-v2-header-btn danger"
                onClick={clearChatHistory}
                title={language === "en" ? "Clear history" : "Xóa lịch sử"}
              >
                <Trash2 size={18} />
              </button>
            )}
            {/* Close button */}
            <button className="meowl-chat-v2-header-btn close" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
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

        {/* Input Container */}
        <div className="meowl-chat-v2-input">
          {/* Preview text */}
          {isPreviewing && (
            <div className="meowl-chat-v2-voice-preview">
              {language === "en" ? "Preview:" : "Xem trước:"}{" "}
              {previewText ||
                (language === "en" ? "Listening..." : "Đang nghe...")}
            </div>
          )}

          {inputPromptChips.length > 0 && (
            <div className="meowl-chat-v2-suggested-inputs">
              {inputPromptChips.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  className="meowl-chat-v2-suggested-input-btn"
                  onClick={() => applySuggestedPrompt(prompt)}
                  disabled={isLoading}
                  title={prompt}
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          <div className="meowl-chat-v2-input-wrapper">
            {/* Voice button */}
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

            {/* Text input */}
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              placeholder={placeholderText[language]}
              className="meowl-chat-v2-chat-textarea"
              disabled={isLoading}
              rows={1}
            />

            {/* Send button */}
            <button
              className="meowl-chat-v2-input-btn send"
              onClick={() => sendMessage()}
              disabled={!inputValue.trim() || isLoading}
            >
              <Send size={18} />
            </button>
          </div>
        </div>

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





















