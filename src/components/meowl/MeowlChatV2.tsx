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
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { WavRecorder } from "../../shared/wavRecorder";
import { transcribeAudioViaBackend } from "../../shared/speechToText";
import { LearningReportModal } from "../learning-report";

// Guest message limit
const GUEST_MESSAGE_LIMIT = 5;
const GUEST_SESSION_KEY = "meowl_guest_session";

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

interface MeowlChatV2Props {
  isOpen: boolean;
  onClose: () => void;
  onRequestLogin?: () => void;
}

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
      const linkEl = target.closest(".meowl-link") as HTMLAnchorElement;
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

  // Voice recording
  const [recorder] = useState(() => new WavRecorder());
  const [isRecording, setIsRecording] = useState(false);
  const [previewText, setPreviewText] = useState<string>("");
  const [isPreviewing, setIsPreviewing] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);

  // Learning Report Modal
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Welcome messages - cute and comprehensive with full route guide
  const welcomeMessage = useMemo(
    () => ({
      en: `*Meow meow!* 🐱✨ **Welcome to SkillVerse!**

I'm **Meowl** - Your intelligent AI learning companion, here to guide you on your educational journey!

**🎯 How I Can Assist You:**
• 📚 **Concept Mastery** - Break down complex topics into digestible explanations
• 🗺️ **Personalized Roadmaps** - Design custom learning paths aligned with your goals
• 💼 **Career Navigation** - Strategic guidance for professional development
• 🎓 **Mentor Connections** - Link you with industry experts
• 📊 **Progress Analytics** - Monitor and optimize your learning metrics

**🚀 Platform Features - Click to Explore:**
• [📖 Course Library](/courses) - Comprehensive skill development programs
• [🎯 Learning Roadmap](/roadmap) - AI-generated personalized curriculum
• [📅 Study Planner](/study-planner) - Smart task & schedule management
• [💡 Career AI](/chatbot/general) - Professional development advisor
• [👨‍🏫 Expert Mentors](/mentors) - Connect with industry professionals
• [🌐 Community Hub](/community) - Collaborative learning network
• [🎨 Meowl Customization](/shop) - Personalize your AI companion

${!isAuthenticated ? "*🔐 Guest Mode: 5 complimentary messages • [Login](/login) for unlimited access & premium features*" : "*✨ Welcome back! Ready to continue your learning journey?*"}

**Ask me anything** - I'm here to help you succeed! 🚀`,
      vi: `*Meow meow!* 🐱✨ **Chào mừng đến với SkillVerse!**

Mình là **Meowl** - Trợ lý AI thông minh, đồng hành cùng bạn trên hành trình chinh phục tri thức!

**🎯 Mình Có Thể Hỗ Trợ Bạn:**
• 📚 **Làm Chủ Kiến Thức** - Phân tích khái niệm phức tạp thành kiến thức dễ hiểu
• 🗺️ **Lộ Trình Cá Nhân** - Thiết kế con đường học tập phù hợp với mục tiêu của bạn
• 💼 **Định Hướng Nghề Nghiệp** - Tư vấn chiến lược phát triển sự nghiệp
• 🎓 **Kết Nối Mentor** - Liên kết với các chuyên gia trong ngành
• 📊 **Phân Tích Tiến Độ** - Theo dõi và tối ưu hóa quá trình học tập

**🚀 Tính Năng Nền Tảng - Nhấn để Khám Phá:**
• [📖 Thư Viện Khóa Học](/courses) - Chương trình phát triển kỹ năng toàn diện
• [🎯 Lộ Trình Học Tập](/roadmap) - Chương trình học AI cá nhân hóa
• [📅 Kế Hoạch Học Tập](/study-planner) - Quản lý công việc & lịch trình thông minh
• [💡 AI Nghề Nghiệp](/chatbot/general) - Cố vấn phát triển chuyên nghiệp
• [👨‍🏫 Mentor Chuyên Gia](/mentors) - Kết nối với người trong ngành
• [🌐 Cộng Đồng](/community) - Mạng lưới học tập cộng tác
• [🎨 Tùy Chỉnh Meowl](/shop) - Cá nhân hóa trợ lý AI của bạn

${!isAuthenticated ? "*🔐 Chế độ Khách: 5 tin nhắn miễn phí • [Đăng nhập](/login) để truy cập không giới hạn & tính năng cao cấp*" : "*✨ Chào mừng trở lại! Sẵn sàng tiếp tục hành trình học tập?*"}

**Hỏi mình bất cứ điều gì** - Mình ở đây để giúp bạn thành công! 🚀`,
    }),
    [isAuthenticated],
  );

  const placeholderText = {
    en: "Ask me anything about learning...",
    vi: "Hỏi tôi bất cứ điều gì về học tập...",
  };

  // Listen for logout event to immediately clear messages
  useEffect(() => {
    const handleLogout = () => {
      // Reset to welcome message immediately
      const welcome: Message = {
        id: "welcome",
        role: "assistant",
        content: welcomeMessage[language],
        timestamp: new Date(),
      };
      setMessages([welcome]);
      createNewGuestSession();
    };

    window.addEventListener("meowl-logout", handleLogout);
    return () => window.removeEventListener("meowl-logout", handleLogout);
  }, [language, welcomeMessage]);

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

  // Initialize with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcome: Message = {
        id: "welcome",
        role: "assistant",
        content: welcomeMessage[language],
        timestamp: new Date(),
      };
      setMessages([welcome]);
    }
  }, [isOpen, language, messages.length, welcomeMessage]);

  // Load chat history for logged-in users
  useEffect(() => {
    if (isAuthenticated && user?.id && isOpen) {
      loadChatHistory();
    }
  }, [isAuthenticated, user?.id, isOpen]);

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
        const welcome: Message = {
          id: "welcome",
          role: "assistant",
          content: welcomeMessage[language],
          timestamp: new Date(),
        };
        setMessages([welcome, ...historyMessages]);
      }
    } catch (error) {
      console.error("Failed to load chat history:", error);
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
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

  const clearChatHistory = async () => {
    if (user?.id) {
      try {
        await axiosInstance.delete(`/v1/meowl/history/${user.id}`);
      } catch (error) {
        console.error("Failed to clear chat history:", error);
      }
    }
    // Reset to welcome message
    const welcome: Message = {
      id: "welcome",
      role: "assistant",
      content: welcomeMessage[language],
      timestamp: new Date(),
    };
    setMessages([welcome]);
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
        includeReminders: true,
        chatHistory: messages.slice(-10).map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
      });

      const data = response.data;

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
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
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

  if (!isOpen) return null;

  const guestMessagesRemaining = guestSession
    ? GUEST_MESSAGE_LIMIT - guestSession.messageCount
    : GUEST_MESSAGE_LIMIT;

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
              <h3>{language === "en" ? "Meowl Here!" : "Meowl Đây!"}</h3>
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
            <div className="message-wrapper assistant">
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


















