import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import meowlChatService from "../services/meowlChatService";
import {
  buildMeowlContextRequest,
  MeowlContextMode,
  type MeowlNodeDossier,
} from "../services/meowlContextService";

export type MeowlPanelMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type UseMeowlContextChatOptions = {
  mode: MeowlContextMode;
  title: string;
  subtitle: string;
  contextSummary?: string[];
  nodeDossier?: MeowlNodeDossier | null;
  isPremiumLocked?: boolean;
  allowGeneralFaqWhenLocked?: boolean;
  fallbackAssistantMessage: string;
};

const createMessageId = (role: "user" | "assistant"): string =>
  `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const createAssistantMessage = (content: string): MeowlPanelMessage => ({
  id: createMessageId("assistant"),
  role: "assistant",
  content,
});

const createUserMessage = (content: string): MeowlPanelMessage => ({
  id: createMessageId("user"),
  role: "user",
  content,
});

const normalizeForMatch = (value?: string | null): string =>
  (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const collectNodeKeywords = (nodeDossier?: MeowlNodeDossier | null): string[] => {
  const candidates = [
    nodeDossier?.nodeTitle ?? "",
    ...(nodeDossier?.learningObjectives ?? []),
    ...(nodeDossier?.keyConcepts ?? []),
  ];

  const keywords = new Set<string>();
  candidates.forEach((item) => {
    const normalized = normalizeForMatch(item);
    if (!normalized) {
      return;
    }

    if (normalized.length >= 4) {
      keywords.add(normalized);
    }

    normalized.split(" ").forEach((token) => {
      if (token.length >= 4) {
        keywords.add(token);
      }
    });
  });

  return Array.from(keywords).slice(0, 10);
};

const responseHasMeaningfulKeyword = (
  content: string,
  nodeDossier?: MeowlNodeDossier | null,
): boolean => {
  const normalizedContent = normalizeForMatch(content);
  if (!normalizedContent || !nodeDossier) {
    return false;
  }

  const title = normalizeForMatch(nodeDossier.nodeTitle);
  if (title && normalizedContent.includes(title)) {
    return true;
  }

  return collectNodeKeywords(nodeDossier).some((keyword) => normalizedContent.includes(keyword));
};

const hasActionableStructure = (content: string, languageCode: "vi" | "en"): boolean => {
  const normalized = normalizeForMatch(content);
  if (!normalized) {
    return false;
  }

  const explanationHints =
    languageCode === "vi"
      ? ["la", "giup", "co nghia", "vi sao", "de", "duoc dung", "vi du", "buoc tiep theo"]
      : ["is", "means", "helps", "because", "for example", "next step", "practice", "use it"];
  const genericEncouragementOnly =
    languageCode === "vi"
      ? ["ban lam duoc", "co len", "tiep tuc", "rat tot", "hay co gang"]
      : ["you can do it", "keep going", "great job", "stay motivated", "good luck"];

  const hasExplanation = explanationHints.some((hint) => normalized.includes(hint));
  const genericHits = genericEncouragementOnly.filter((hint) => normalized.includes(hint)).length;

  return hasExplanation && genericHits < 2;
};

const hasNodeModePlatformDrift = (content: string): boolean => {
  const normalized = normalizeForMatch(content);
  if (!normalized) {
    return false;
  }

  const driftHints = [
    "dang nhap",
    "login",
    "sign in",
    "premium",
    "nang cap",
    "goi",
    "free tier",
    "career chat",
    "expert chat",
    "faq",
    "skillverse",
    "dashboard",
    "profile",
    "portfolio",
    "marketplace",
    "mentorship",
    "kham pha tinh nang",
    "truy cap tinh nang",
    "go toi trang",
  ];

  if (driftHints.some((hint) => normalized.includes(hint))) {
    return true;
  }

  return /(\/premium|\/login|\/dashboard|\/profile|\/chatbot|\/courses|\/portfolio|\/about)/i.test(content);
};

const isWeakNodeResponse = (
  content: string,
  languageCode: "vi" | "en",
  nodeDossier?: MeowlNodeDossier | null,
): boolean => {
  const trimmed = content.trim();
  if (!trimmed) {
    return true;
  }

  const minLength = languageCode === "vi" ? 280 : 220;
  const tooShort = trimmed.length < minLength;
  const missingNodeAnchor = nodeDossier ? !responseHasMeaningfulKeyword(trimmed, nodeDossier) : false;
  const genericOnly = !hasActionableStructure(trimmed, languageCode);
  const platformDrift = hasNodeModePlatformDrift(trimmed);

  return tooShort || missingNodeAnchor || genericOnly || platformDrift;
};

const buildRepairInstruction = (
  languageCode: "vi" | "en",
  nodeDossier?: MeowlNodeDossier | null,
): string =>
  languageCode === "vi"
    ? `Cau tra loi phai bam sat node hien tai${nodeDossier?.nodeTitle ? `: ${nodeDossier.nodeTitle}` : ""}. Hay day theo kieu mini-lesson, gom: node nay la gi, vi sao no quan trong luc nay, mot vi du cu the, va mot hanh dong tiep theo. Neu thieu du lieu, thua nhan dieu do va day dua tren tieu de node, muc tieu hoc tap, va key concepts.`
    : `The answer must stay anchored to the current node${nodeDossier?.nodeTitle ? `: ${nodeDossier.nodeTitle}` : ""}. Teach in a mini-lesson style and include: what this node is, why it matters now, one concrete example, and one next action. If data is missing, say so and teach from the node title, learning objectives, and key concepts.`;

const buildLocalFallbackResponse = (
  languageCode: "vi" | "en",
  nodeDossier: MeowlNodeDossier,
): string => {
  const objectives = (nodeDossier.learningObjectives ?? []).filter(Boolean).slice(0, 2);
  const concepts = (nodeDossier.keyConcepts ?? []).filter(Boolean).slice(0, 2);
  const success = (nodeDossier.successCriteria ?? []).filter(Boolean).slice(0, 2);
  const nextStep = nodeDossier.recommendedNextStep?.trim();
  const exampleFocus = concepts[0] ?? objectives[0] ?? nodeDossier.nodeTitle;

  if (languageCode === "vi") {
    const intro =
      objectives[0]
        ? `Node "${nodeDossier.nodeTitle}" tập trung vào ${objectives[0].replace(/\.$/, "")}.`
        : `Node "${nodeDossier.nodeTitle}" là phần bạn cần nắm trước khi đi tiếp trong lộ trình này.`;
    const why = nodeDossier.whyThisMatters?.trim()
      ? `Nó quan trọng lúc này vì ${nodeDossier.whyThisMatters.trim().replace(/\.$/, "")}.`
      : "Nó quan trọng lúc này vì đây là mắt xích giúp bạn nối phần đang học với bước tiếp theo.";
    const example = `Ví dụ nhanh: thử tự giải thích ${exampleFocus} bằng lời của bạn rồi áp dụng vào một tình huống nhỏ thay vì chỉ đọc lý thuyết.`;
    const steps = [
      objectives[0] ? `1. Học lại mục tiêu chính: ${objectives[0]}.` : `1. Viết lại ngắn gọn node này đang dạy điều gì.`,
      concepts[0] ? `2. Lấy một ví dụ cho khái niệm ${concepts[0]}.` : `2. Tạo một ví dụ nhỏ để kiểm tra bạn đã hiểu node này tới đâu.`,
      nextStep
        ? `3. Bước tiếp theo: ${nextStep.replace(/\.$/, "")}.`
        : success[0]
          ? `3. Chỉ chuyển tiếp khi bạn làm được tiêu chí này: ${success[0].replace(/\.$/, "")}.`
          : "3. Sau đó chọn một bài tập ngắn 10-15 phút bám sát node này.",
    ];

    return [intro, why, example, steps.join("\n")].join("\n\n");
  }

  const intro =
    objectives[0]
      ? `The node "${nodeDossier.nodeTitle}" is mainly about ${objectives[0].replace(/\.$/, "")}.`
      : `The node "${nodeDossier.nodeTitle}" is a focused step you need before moving deeper into this roadmap.`;
  const why = nodeDossier.whyThisMatters?.trim()
    ? `It matters now because ${nodeDossier.whyThisMatters.trim().replace(/\.$/, "")}.`
    : "It matters now because it connects your current stage to the next useful skill step.";
  const example = `Quick example: explain ${exampleFocus} in your own words, then apply it in one small scenario instead of only reading definitions.`;
  const steps = [
    objectives[0] ? `1. Re-state the main objective: ${objectives[0]}.` : "1. Write one sentence about what this node is teaching.",
    concepts[0] ? `2. Build one small example around ${concepts[0]}.` : "2. Create one tiny example that proves you understand the node.",
    nextStep
      ? `3. Next action: ${nextStep.replace(/\.$/, "")}.`
      : success[0]
        ? `3. Move on only after you can do this: ${success[0].replace(/\.$/, "")}.`
        : "3. Finish with one focused 10-15 minute practice task on this node.",
  ];

  return [intro, why, example, steps.join("\n")].join("\n\n");
};

export const useMeowlContextChat = ({
  mode,
  title,
  subtitle,
  contextSummary = [],
  nodeDossier = null,
  isPremiumLocked = false,
  allowGeneralFaqWhenLocked = true,
  fallbackAssistantMessage,
}: UseMeowlContextChatOptions) => {
  const { user, isAuthenticated } = useAuth();
  const { language } = useLanguage();
  const [messages, setMessages] = useState<MeowlPanelMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const languageCode = language === "en" ? "en" : "vi";
  const effectiveMode: MeowlContextMode =
    isPremiumLocked && allowGeneralFaqWhenLocked ? "MODE_GENERAL_FAQ" : mode;

  const contextSignature = useMemo(
    () =>
      JSON.stringify({
        effectiveMode,
        title,
        subtitle,
        contextSummary,
        nodeDossier,
        isPremiumLocked,
      }),
    [contextSummary, effectiveMode, isPremiumLocked, nodeDossier, subtitle, title],
  );

  useEffect(() => {
    setMessages([]);
    setInputValue("");
    setIsLoading(false);
  }, [contextSignature]);

  const handlePromptClick = useCallback((prompt: string) => {
    setInputValue(prompt);
  }, []);

  const handleSubmit = useCallback(
    async (event?: FormEvent<HTMLFormElement>) => {
      event?.preventDefault();

      const trimmed = inputValue.trim();
      if (!trimmed || isLoading) {
        return;
      }

      const userMessage = createUserMessage(trimmed);
      setMessages((previous) => [...previous, userMessage]);
      setInputValue("");
      setIsLoading(true);

      try {
        const requestBase = {
          mode: effectiveMode,
          language: languageCode,
          title,
          subtitle,
          contextSummary,
          nodeDossier,
          userMessage: trimmed,
          chatHistory: messages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
          isAuthenticated,
          userId: user?.id ?? null,
        } as const;

        const response = await meowlChatService.sendMessage(
          buildMeowlContextRequest(requestBase),
        );

        let assistantContent = response.message || fallbackAssistantMessage;
        const shouldGuardNodeAnswer =
          nodeDossier &&
          (effectiveMode === "MODE_ROADMAP_OVERVIEW" ||
            effectiveMode === "MODE_FALLBACK_TEACHER");

        if (
          shouldGuardNodeAnswer &&
          isWeakNodeResponse(assistantContent, languageCode, nodeDossier)
        ) {
          const retryResponse = await meowlChatService.sendMessage(
            buildMeowlContextRequest({
              ...requestBase,
              repairInstruction: buildRepairInstruction(languageCode, nodeDossier),
            }),
          );

          const repairedContent = retryResponse.message || assistantContent;
          assistantContent = isWeakNodeResponse(repairedContent, languageCode, nodeDossier) && nodeDossier
            ? buildLocalFallbackResponse(languageCode, nodeDossier)
            : repairedContent;
        }

        setMessages((previous) => [
          ...previous,
          createAssistantMessage(assistantContent),
        ]);
      } catch {
        const shouldUseNodeFallback =
          nodeDossier &&
          (effectiveMode === "MODE_ROADMAP_OVERVIEW" ||
            effectiveMode === "MODE_FALLBACK_TEACHER");
        setMessages((previous) => [
          ...previous,
          createAssistantMessage(
            shouldUseNodeFallback && nodeDossier
              ? buildLocalFallbackResponse(languageCode, nodeDossier)
              : languageCode === "en"
                ? "I couldn't connect right now. Please try again in a moment."
                : "Mình chưa kết nối được lúc này. Bạn thử lại sau một chút nhé.",
          ),
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [
      contextSummary,
      effectiveMode,
      fallbackAssistantMessage,
      inputValue,
      isAuthenticated,
      isLoading,
      languageCode,
      messages,
      nodeDossier,
      subtitle,
      title,
      user?.id,
    ],
  );

  return {
    effectiveMode,
    handlePromptClick,
    handleSubmit,
    inputValue,
    isLoading,
    languageCode,
    messages,
    setInputValue,
  };
};

export default useMeowlContextChat;
