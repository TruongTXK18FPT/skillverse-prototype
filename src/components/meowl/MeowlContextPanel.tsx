import { useMemo } from "react";
import {
  Lock,
  MessageSquare,
  Send,
  Sparkles,
  ShieldAlert,
  GraduationCap,
  BookOpen,
  Map,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import useMeowlContextChat from "../../hooks/useMeowlContextChat";
import {
  type MeowlContextMode,
  type MeowlNodeDossier,
} from "../../services/meowlContextService";
import styles from "./MeowlContextPanel.module.css";

export type { MeowlContextMode } from "../../services/meowlContextService";

type LocalizedText = {
  en: string;
  vi: string;
};

export interface MeowlContextPanelProps {
  mode: MeowlContextMode;
  title: string;
  subtitle: string;
  contextSummary?: string[];
  nodeDossier?: MeowlNodeDossier | null;
  suggestedPrompts?: string[];
  isPremiumLocked?: boolean;
  premiumLabel?: string | null;
  allowGeneralFaqWhenLocked?: boolean;
  suppressRoadmapCoachCopy?: boolean;
  hideRoadmapNodeBrief?: boolean;
  className?: string;
  theme?: "default" | "hud";
  density?: "default" | "compact";
  onClose?: () => void;
  closeLabel?: string;
}

const MODE_META: Record<
  MeowlContextMode,
  {
    icon: typeof Map;
    badge: LocalizedText;
    intro: LocalizedText;
    placeholder: LocalizedText;
    suggestions: LocalizedText[];
  }
> = {
  MODE_ROADMAP_OVERVIEW: {
    icon: Map,
    badge: { en: "Roadmap", vi: "Roadmap" },
    intro: {
      en: "I will explain this roadmap node, clarify why it matters, and suggest the next best move.",
      vi: "Mình sẽ giải thích node roadmap này, vì sao nó quan trọng, và gợi ý bước đi tiếp theo rõ ràng.",
    },
    placeholder: {
      en: "Ask about this roadmap node...",
      vi: "Hỏi về node roadmap này...",
    },
    suggestions: [
      {
        en: "What should I focus on first in this node?",
        vi: "Trong node này mình nên ưu tiên phần nào trước?",
      },
      {
        en: "Explain how this node connects to the rest of the roadmap.",
        vi: "Giải thích node này liên kết với phần còn lại của roadmap như thế nào.",
      },
    ],
  },
  MODE_COURSE_LEARNING: {
    icon: GraduationCap,
    badge: { en: "Course Tutor", vi: "Gia sư bài học" },
    intro: {
      en: "I will stay focused on the current lesson and help you understand the material without drifting away.",
      vi: "Mình sẽ bám sát bài học hiện tại và hỗ trợ bạn hiểu nội dung mà không lan man sang ngữ cảnh khác.",
    },
    placeholder: {
      en: "Ask about the current lesson...",
      vi: "Hỏi về bài học hiện tại...",
    },
    suggestions: [
      {
        en: "Explain the core idea of this lesson in simpler words.",
        vi: "Giải thích ý chính của bài này theo cách dễ hiểu hơn.",
      },
      {
        en: "Give me one practice question about this lesson.",
        vi: "Cho mình một câu luyện tập bám sát bài này.",
      },
    ],
  },
  MODE_FALLBACK_TEACHER: {
    icon: GraduationCap,
    badge: { en: "Fallback Teacher", vi: "Dạy thay" },
    intro: {
      en: "This node has no mapped course yet, so I can teach the topic directly step by step.",
      vi: "Node này chưa có khóa học tương ứng, nên mình sẽ dạy trực tiếp từng bước để bạn vẫn tiếp tục được.",
    },
    placeholder: {
      en: "Ask Meowl to teach this skill...",
      vi: "Yêu cầu Meowl dạy kỹ năng này...",
    },
    suggestions: [
      {
        en: "Teach me this node from zero with a mini lesson.",
        vi: "Dạy mình node này từ đầu bằng một mini lesson.",
      },
      {
        en: "Create a 30-minute practice plan for this node.",
        vi: "Lập cho mình plan luyện 30 phút cho node này.",
      },
    ],
  },
  MODE_EXAM_PROCTOR: {
    icon: ShieldAlert,
    badge: { en: "Proctor Mode", vi: "Chế độ giám thị" },
    intro: {
      en: "You are in quiz or assignment mode. I will not provide answers or hints that bypass assessment integrity.",
      vi: "Bạn đang ở chế độ quiz hoặc assignment. Mình sẽ không cung cấp đáp án hay gợi ý làm ảnh hưởng tính công bằng bài đánh giá.",
    },
    placeholder: {
      en: "Ask for rules, not answers...",
      vi: "Hỏi về quy tắc, không phải đáp án...",
    },
    suggestions: [
      {
        en: "Remind me how to stay calm and manage my time.",
        vi: "Nhắc mình cách giữ bình tĩnh và phân bổ thời gian.",
      },
      {
        en: "What should I do if I feel stuck on a question?",
        vi: "Nếu bị bí một câu thì mình nên xử lý thế nào?",
      },
    ],
  },
  MODE_SOCRATIC_READING: {
    icon: BookOpen,
    badge: { en: "Socratic Reading", vi: "Đọc gợi mở" },
    intro: {
      en: "I will coach your reading with questions and prompts instead of replacing the reading for you.",
      vi: "Mình sẽ đồng hành bằng câu hỏi gợi mở thay vì tóm tắt thay toàn bộ phần đọc cho bạn.",
    },
    placeholder: {
      en: "Share what you understand so far...",
      vi: "Hãy nói thử bạn đang hiểu tới đâu...",
    },
    suggestions: [
      {
        en: "Ask me a question that checks whether I understood this reading.",
        vi: "Hỏi mình một câu để kiểm tra xem mình đã hiểu bài đọc này chưa.",
      },
      {
        en: "Challenge me to explain this concept in my own words.",
        vi: "Thử thách mình diễn giải khái niệm này bằng lời của mình.",
      },
    ],
  },
  MODE_GENERAL_FAQ: {
    icon: MessageSquare,
    badge: { en: "FAQ", vi: "Hỏi đáp chung" },
    intro: {
      en: "I can help with basic SkillVerse questions and point you to the right page.",
      vi: "Mình có thể hỗ trợ các câu hỏi cơ bản về SkillVerse và dẫn bạn tới đúng trang cần thiết.",
    },
    placeholder: {
      en: "Ask about SkillVerse features...",
      vi: "Hỏi về tính năng SkillVerse...",
    },
    suggestions: [
      {
        en: "How do I upgrade to Premium?",
        vi: "Mình nâng cấp Premium như thế nào?",
      },
      {
        en: "Where can I continue my roadmap later?",
        vi: "Sau này mình mở lại roadmap ở đâu?",
      },
    ],
  },
};

const MeowlContextPanel = ({
  mode,
  title,
  subtitle,
  contextSummary = [],
  nodeDossier = null,
  suggestedPrompts,
  isPremiumLocked = false,
  premiumLabel,
  allowGeneralFaqWhenLocked = true,
  suppressRoadmapCoachCopy = false,
  hideRoadmapNodeBrief = false,
  className,
  theme = "default",
  density = "default",
  onClose,
  closeLabel,
}: MeowlContextPanelProps) => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const requestedModeMeta = MODE_META[mode];
  const {
    effectiveMode,
    handlePromptClick,
    handleSubmit,
    inputValue,
    isLoading,
    messages,
    setInputValue,
  } = useMeowlContextChat({
    mode,
    title,
    subtitle,
    contextSummary,
    nodeDossier,
    isPremiumLocked,
    allowGeneralFaqWhenLocked,
    fallbackAssistantMessage: "",
  });
  const modeMeta = MODE_META[effectiveMode];
  const Icon = modeMeta.icon;

  const isRoadmapNodeMode =
    effectiveMode === "MODE_ROADMAP_OVERVIEW" ||
    effectiveMode === "MODE_FALLBACK_TEACHER";

  const nodeBrief = useMemo(() => {
    if (!isRoadmapNodeMode) {
      return "";
    }

    const priorityText =
      nodeDossier?.whyThisMatters?.trim() ||
      nodeDossier?.learningObjectives?.find((item) => item?.trim())?.trim() ||
      contextSummary
        .find((item) => item?.trim())
        ?.replace(/^[^:]+:\s*/, "")
        .trim() ||
      "";

    if (!priorityText) {
      return language === "en"
        ? "Stay anchored to this node and finish one concrete next step before moving on."
        : "Bám sát node này và hoàn thành một bước hành động cụ thể trước khi chuyển tiếp.";
    }

    const compactText = priorityText.length > 180
      ? `${priorityText.slice(0, 180).trim()}...`
      : priorityText;
    return language === "en"
      ? `Node brief: ${compactText}`
      : `Brief node: ${compactText}`;
  }, [contextSummary, isRoadmapNodeMode, language, nodeDossier?.learningObjectives, nodeDossier?.whyThisMatters]);

  const promptLimit = isRoadmapNodeMode ? 2 : 3;

  const effectivePrompts = useMemo(() => {
    if (suggestedPrompts?.length) {
      return suggestedPrompts.slice(0, promptLimit);
    }
    return modeMeta.suggestions.slice(0, promptLimit).map((item) => item[language]);
  }, [language, modeMeta.suggestions, promptLimit, suggestedPrompts]);

  const emptyStateCopy = isRoadmapNodeMode
    ? suppressRoadmapCoachCopy
      ? language === "en"
        ? "Choose a prompt or ask a concrete question about this roadmap node."
        : "Chọn một gợi ý hoặc đặt câu hỏi cụ thể về node roadmap này."
      : modeMeta.intro[language]
    : language === "en"
      ? "Choose a prompt or ask Meowl about the current lesson."
      : "Chọn một gợi ý hoặc hỏi Meowl về nội dung bạn đang học.";

  const lockCopy = useMemo(() => {
    if (!isPremiumLocked) {
      return null;
    }

    const requestedLabel = requestedModeMeta.badge[language];
    const planLine = premiumLabel
      ? language === "en"
        ? `Current plan: ${premiumLabel}`
        : `Gói hiện tại: ${premiumLabel}`
      : language === "en"
      ? "Current plan: Free tier"
      : "Gói hiện tại: Free";

    return {
      title:
        language === "en"
          ? `${requestedLabel} requires Premium`
          : `${requestedLabel} cần Premium`,
      description:
        allowGeneralFaqWhenLocked
          ? language === "en"
            ? "Context-aware tutoring is locked on the current plan. You can still use basic FAQ mode or upgrade to unlock Meowl here."
            : "Chế độ trợ lý theo ngữ cảnh đang bị khóa ở gói hiện tại. Bạn vẫn có thể dùng FAQ cơ bản hoặc nâng cấp để mở Meowl tại đây."
          : language === "en"
          ? "This Meowl mode is locked on the current plan. Upgrade to continue."
          : "Chế độ Meowl này đang bị khóa ở gói hiện tại. Hãy nâng cấp để tiếp tục.",
      planLine,
    };
  }, [allowGeneralFaqWhenLocked, isPremiumLocked, language, premiumLabel, requestedModeMeta.badge]);

  return (
    <section
      className={[
        styles.panel,
        theme === "hud" ? styles.panelHud : styles.panelDefault,
        density === "compact" ? styles.panelCompact : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <header className={styles.header}>
        <div className={styles.headerMain}>
          <div className={styles.iconWrap}>
            <Icon size={18} />
          </div>
          <div>
            <div className={styles.badge}>
              <Sparkles size={14} />
              <span>{modeMeta.badge[language]}</span>
            </div>
            <h3 className={styles.title}>{title}</h3>
            <p className={styles.subtitle}>{subtitle}</p>
            {isRoadmapNodeMode && !suppressRoadmapCoachCopy && messages.length === 0 ? (
              <p className={styles.subtitle}>{modeMeta.intro[language]}</p>
            ) : null}
            {isRoadmapNodeMode && !suppressRoadmapCoachCopy && !hideRoadmapNodeBrief && nodeBrief ? (
              <p className={styles.nodeBrief}>{nodeBrief}</p>
            ) : null}
          </div>
        </div>
        {isPremiumLocked && (
          <div className={styles.lockTag}>
            <Lock size={14} />
            <span>{language === "en" ? "Premium" : "Premium"}</span>
          </div>
        )}
        {onClose && (
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label={closeLabel ?? (language === "en" ? "Close Meowl panel" : "Đóng bảng Meowl")}
            title={closeLabel ?? (language === "en" ? "Close panel" : "Ẩn bảng chat")}
          >
            <X size={16} />
          </button>
        )}
      </header>

      {lockCopy && (
        <div className={styles.lockCard}>
          <div className={styles.lockCardHeader}>
            <Lock size={16} />
            <strong>{lockCopy.title}</strong>
          </div>
          <p>{lockCopy.description}</p>
          <p className={styles.lockPlan}>{lockCopy.planLine}</p>
          <button
            type="button"
            className={styles.lockButton}
            onClick={() => navigate("/premium")}
          >
            {language === "en" ? "Upgrade plan" : "Nâng cấp gói"}
          </button>
        </div>
      )}

      <div className={styles.messages} aria-live="polite">
        {messages.map((message) => (
          <div
            key={message.id}
            className={[
              styles.message,
              message.role === "assistant" ? styles.assistant : styles.user,
            ].join(" ")}
          >
            <div className={styles.messageBubble}>{message.content}</div>
          </div>
        ))}

        {!messages.length && !isLoading && (
          <div className={styles.emptyConversation}>
            {emptyStateCopy}
          </div>
        )}

        {isLoading && (
          <div className={[styles.message, styles.assistant].join(" ")}>
            <div className={styles.messageBubble}>
              {language === "en" ? "Meowl is thinking..." : "Meowl đang suy nghĩ..."}
            </div>
          </div>
        )}

        {effectivePrompts.length > 0 && !isLoading && (
          <div className={styles.promptList}>
            {effectivePrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                className={styles.promptChip}
                onClick={() => handlePromptClick(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>
        )}
      </div>

      <form className={styles.composer} onSubmit={handleSubmit}>
        <textarea
          className={styles.textarea}
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          placeholder={modeMeta.placeholder[language]}
          rows={3}
          disabled={isLoading}
          aria-label={language === "en" ? "Message Meowl" : "Nhập tin nhắn cho Meowl"}
        />
        <button
          type="submit"
          className={styles.sendButton}
          disabled={!inputValue.trim() || isLoading}
        >
          <Send size={16} />
          <span>{language === "en" ? "Send" : "Gửi"}</span>
        </button>
      </form>
    </section>
  );
};

export default MeowlContextPanel;
