// ============================================================================
// Course Builder Constants, Types & Helper Functions
// Extracted from CourseCreationPage.tsx — simple, stateless utilities only
// ============================================================================

import { FiFileText, FiPlay, FiHelpCircle, FiClipboard } from "react-icons/fi";
import { CourseLevel } from "../../../data/courseDTOs";
import { LessonKind, LessonAttachmentDraft, ModuleDraft } from "./courseBuilderTypes";

// ============================================================================
// TYPES
// ============================================================================

type ViewState =
  | { type: "course_info" }
  | { type: "module"; moduleId: string }
  | { type: "lesson"; moduleId: string; lessonId: string };

type BuilderFlowState = "submitted" | "revisionCreated" | "revisionSubmitted";

interface ConfirmDialogState {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
}

interface ReadingLinkDialogState {
  moduleId: string;
  lessonId: string;
  value: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const CATEGORIES = [
  "Development",
  "Business",
  "Design",
  "Marketing",
  "IT & Software",
  "Personal Development",
];

export const LANGUAGES = [
  { value: 'Vietnamese', label: 'Tiếng Việt' },
  { value: 'English', label: 'English' },
] as const;

export const LEVELS = [
  { value: CourseLevel.BEGINNER, label: "Cơ bản" },
  { value: CourseLevel.INTERMEDIATE, label: "Trung bình" },
  { value: CourseLevel.ADVANCED, label: "Nâng cao" },
];

export const LESSON_TYPES = [
  {
    value: "reading",
    label: "Bài đọc",
    icon: <FiFileText />,
    color: "#3b82f6",
  },
  { value: "video", label: "Video", icon: <FiPlay />, color: "#ef4444" },
  { value: "quiz", label: "Quiz", icon: <FiHelpCircle />, color: "#8b5cf6" },
  {
    value: "assignment",
    label: "Bài tập",
    icon: <FiClipboard />,
    color: "#f59e0b",
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/** Get display info (Icon, color, label) for a lesson type */
export const getLessonTypeMeta = (type: string) => {
  const found = LESSON_TYPES.find((t) => t.value === type);
  return {
    Icon:
      type === "video"
        ? FiPlay
        : type === "quiz"
          ? FiHelpCircle
          : type === "assignment"
            ? FiClipboard
            : FiFileText,
    color: found?.color || "#3b82f6",
    label: found?.label || "Bài đọc",
  };
};

export const createId = () =>
  Date.now().toString() + Math.random().toString(36).substr(2, 5);

export const COURSE_BUILDER_FLOW_PARAM = "flow";
export const COURSE_DRAFT_ORDER_DEBUG_KEY = "sv_debug_draft_order";

export const isCourseDraftOrderDebugEnabled = () =>
  typeof window !== "undefined" &&
  window.localStorage.getItem(COURSE_DRAFT_ORDER_DEBUG_KEY) === "1";

export const buildModuleOrderDebugSnapshot = (draftModules: ModuleDraft[]) =>
  draftModules.map((module, moduleIndex) => ({
    moduleIndex,
    moduleId: module.id,
    moduleServerId: module.serverId ?? null,
    moduleTitle: module.title,
    lessons: (module.lessons || []).map((lesson, lessonIndex) => ({
      lessonIndex,
      lessonId: lesson.id,
      lessonServerId: lesson.serverId ?? null,
      type: lesson.type,
      title: lesson.title,
      orderIndex: lesson.orderIndex ?? null,
    })),
  }));

export const logCourseDraftOrderDebug = (
  label: string,
  draftModules: ModuleDraft[],
) => {
  if (!isCourseDraftOrderDebugEnabled()) return;
  console.groupCollapsed(`[COURSE-ORDER-DEBUG] ${label}`);
  console.log(buildModuleOrderDebugSnapshot(draftModules));
  console.groupEnd();
};

export const parseBuilderFlowState = (
  params: URLSearchParams,
): BuilderFlowState | null => {
  const flow = params.get(COURSE_BUILDER_FLOW_PARAM);
  if (
    flow === "submitted" ||
    flow === "revisionCreated" ||
    flow === "revisionSubmitted"
  ) {
    return flow;
  }

  // Backward compatibility for old links generated with dedicated flags.
  if (params.get("submitted") === "1") return "submitted";
  if (params.get("revisionCreated") === "1") return "revisionCreated";
  if (params.get("revisionSubmitted") === "1") return "revisionSubmitted";

  return null;
};

export const buildCourseEditUrl = (
  courseId: string | number,
  options?: { revisionId?: number; flow?: BuilderFlowState },
) => {
  const params = new URLSearchParams();
  if (
    typeof options?.revisionId === "number" &&
    Number.isFinite(options.revisionId) &&
    options.revisionId > 0
  ) {
    params.set("revisionId", String(options.revisionId));
  }
  if (options?.flow) {
    params.set(COURSE_BUILDER_FLOW_PARAM, options.flow);
  }
  const query = params.toString();
  return query
    ? `/mentor/courses/${courseId}/edit?${query}`
    : `/mentor/courses/${courseId}/edit`;
};

// ============================================================================
// EXPORTS — re-export types so consumers only need this file
// ============================================================================

export type { ViewState, BuilderFlowState, ConfirmDialogState, ReadingLinkDialogState };