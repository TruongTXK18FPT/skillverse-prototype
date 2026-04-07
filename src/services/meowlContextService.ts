import {
  ChatMessage,
  MeowlChatRequest,
  MeowlRoleMode,
} from "./meowlChatService";

export type MeowlContextMode =
  | "MODE_ROADMAP_OVERVIEW"
  | "MODE_COURSE_LEARNING"
  | "MODE_FALLBACK_TEACHER"
  | "MODE_SOCRATIC_READING"
  | "MODE_GENERAL_FAQ";

type BuildMeowlContextEnvelopeOptions = {
  mode: MeowlContextMode;
  language: "vi" | "en";
  title: string;
  subtitle: string;
  contextSummary: string[];
  userMessage: string;
  nodeDossier?: MeowlNodeDossier | null;
  repairInstruction?: string | null;
};

type BuildMeowlContextRequestOptions = BuildMeowlContextEnvelopeOptions & {
  chatHistory?: ChatMessage[];
  isAuthenticated?: boolean;
  userId?: number | null;
};

export type MeowlNodeDossier = {
  nodeTitle: string;
  nodeRole?: string | null;
  phaseLabel?: string | null;
  whyThisMatters?: string | null;
  parentTitle?: string | null;
  childBranchTitles?: string[];
  learningObjectives?: string[];
  keyConcepts?: string[];
  successCriteria?: string[];
  courseStatus?: string | null;
  recommendedNextStep?: string | null;
};

const MODE_RULES: Record<MeowlContextMode, string[]> = {
  MODE_ROADMAP_OVERVIEW: [
    "Explain this specific roadmap node, not the whole roadmap.",
    "State why this node matters right now in the learner's current progression.",
    "Stay within the learner's current stage and avoid jumping too far ahead.",
    "Give exactly one concrete next action tied to the node.",
    "Do not include login reminders, premium upgrades, or platform navigation CTA in the answer.",
    "If the user asks platform questions, answer briefly then bring the focus back to this node.",
    "If the source content is thin, admit the gap and teach from the node title, objectives, and key concepts instead of hallucinating.",
  ],
  MODE_COURSE_LEARNING: [
    "Act as a lesson tutor focused on the current learning content only.",
    "Do not claim access to hidden video transcripts; if asked to summarize unseen video, politely refuse.",
  ],
  MODE_FALLBACK_TEACHER: [
    "Teach this specific roadmap node directly because there is no mapped course yet.",
    "Do not drift into platform FAQ or the whole roadmap unless explicitly asked.",
    "Stay within the learner's current stage and teach in a compact mini-lesson style.",
    "Mention why this node matters now and give exactly one concrete next action.",
    "Do not include login reminders, premium upgrades, or platform navigation CTA in the answer.",
    "If content is missing, say so clearly and teach from the node title, objectives, and key concepts instead of hallucinating.",
  ],
  MODE_SOCRATIC_READING: [
    "Do not replace the reading with a full summary.",
    "Use Socratic questions and ask the learner to explain ideas in their own words.",
  ],
  MODE_GENERAL_FAQ: [
    "Answer only general platform questions and premium/feature navigation questions.",
    "Do not provide protected lesson, syllabus, or assessment help.",
  ],
};

const sanitizeSessionSegment = (value: string): string => {
  const normalizedValue = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return normalizedValue || "panel";
};

const formatDossierList = (items?: string[], fallback?: string): string => {
  const normalized = (items ?? [])
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 5);

  if (normalized.length === 0) {
    return fallback ?? "None";
  }

  return normalized.join(" | ");
};

const buildNodeDossierSection = (
  language: "vi" | "en",
  nodeDossier?: MeowlNodeDossier | null,
): string[] => {
  if (!nodeDossier) {
    return [];
  }

  return [
    "node_dossier:",
    `- node_title: ${nodeDossier.nodeTitle}`,
    `- node_role: ${nodeDossier.nodeRole?.trim() || (language === "vi" ? "Chưa rõ" : "Unknown")}`,
    `- phase_label: ${nodeDossier.phaseLabel?.trim() || (language === "vi" ? "Chưa gắn phase" : "No phase label")}`,
    `- why_this_node_matters: ${nodeDossier.whyThisMatters?.trim() || (language === "vi" ? "Giữ đúng nhịp tiến trình hiện tại." : "Keeps the learner moving through the current progression.")}`,
    `- parent_node: ${nodeDossier.parentTitle?.trim() || (language === "vi" ? "Không có node cha rõ ràng" : "No clear parent node")}`,
    `- child_branches: ${formatDossierList(nodeDossier.childBranchTitles, language === "vi" ? "Chưa có nhánh con nổi bật" : "No notable child branches")}`,
    `- learning_objectives: ${formatDossierList(nodeDossier.learningObjectives, language === "vi" ? "Chưa có mục tiêu học tập chi tiết" : "No detailed learning objectives")}`,
    `- key_concepts: ${formatDossierList(nodeDossier.keyConcepts, language === "vi" ? "Chưa có khái niệm chính chi tiết" : "No detailed key concepts")}`,
    `- success_criteria: ${formatDossierList(nodeDossier.successCriteria, language === "vi" ? "Chưa có tiêu chí hoàn thành rõ ràng" : "No clear success criteria")}`,
    `- course_status: ${nodeDossier.courseStatus?.trim() || (language === "vi" ? "Chưa rõ" : "Unknown")}`,
    `- recommended_next_step: ${nodeDossier.recommendedNextStep?.trim() || (language === "vi" ? "Đề xuất bước tiếp theo dựa trên node hiện tại." : "Recommend the next step from the current node.")}`,
  ];
};

export const buildMeowlContextSessionId = (
  mode: MeowlContextMode,
  title: string,
  subtitle: string,
): string =>
  [
    "context",
    sanitizeSessionSegment(mode),
    sanitizeSessionSegment(title),
    sanitizeSessionSegment(subtitle),
  ].join("_");

export const buildMeowlContextEnvelope = ({
  mode,
  language,
  title,
  subtitle,
  contextSummary,
  userMessage,
  nodeDossier,
  repairInstruction,
}: BuildMeowlContextEnvelopeOptions): string => {
  const serializedSummary =
    contextSummary.length > 0
      ? contextSummary.map((item) => `- ${item}`).join("\n")
      : language === "vi"
      ? "- Chưa có ngữ cảnh bổ sung"
      : "- No extra context provided";

  return [
    "[SKILLVERSE_CONTEXT]",
    "protocol=skillverse-context/v2",
    `language=${language}`,
    `mode=${mode}`,
    `title=${title}`,
    `subtitle=${subtitle}`,
    "rules:",
    ...MODE_RULES[mode].map((rule) => `- ${rule}`),
    "context_summary:",
    serializedSummary,
    ...buildNodeDossierSection(language, nodeDossier),
    repairInstruction ? "repair_instruction:" : null,
    repairInstruction ? `- ${repairInstruction.trim()}` : null,
    "[END_SKILLVERSE_CONTEXT]",
    "",
    userMessage.trim(),
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n");
};

export const buildMeowlContextRequest = ({
  mode,
  language,
  title,
  subtitle,
  contextSummary,
  userMessage,
  nodeDossier,
  repairInstruction,
  chatHistory = [],
  isAuthenticated = false,
  userId = null,
}: BuildMeowlContextRequestOptions): MeowlChatRequest => {
  const normalizedMessage = userMessage.trim();
  const activeRole: MeowlRoleMode = isAuthenticated ? "LEARNER" : "GENERAL";
  const normalizedHistory = [...chatHistory, { role: "user", content: normalizedMessage }].slice(-6);

  return {
    message: buildMeowlContextEnvelope({
      mode,
      language,
      title,
      subtitle,
      contextSummary,
      userMessage: normalizedMessage,
      nodeDossier,
      repairInstruction,
    }),
    language,
    userId,
    activeRole,
    sessionId: buildMeowlContextSessionId(mode, title, subtitle),
    includeReminders: false,
    chatHistory: normalizedHistory,
  };
};
