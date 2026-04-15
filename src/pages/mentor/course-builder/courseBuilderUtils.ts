// ============================================================================
// Course Builder Utility Functions
// Extracted from CourseCreationPage.tsx — pure, stateless functions only.
// NO React hooks (useState, useEffect, useRef, useCallback) — NO side-effects.
// All functions are tree-shakable, composable helpers for the course-builder.
// ============================================================================

import { CourseLevel } from "../../../data/courseDTOs";
import { SubmissionType } from "../../../data/assignmentDTOs";
import { QuestionType } from "../../../data/quizDTOs";
import {
  AssignmentCriteriaDraft,
  LessonAttachmentDraft,
  LessonDraft,
  LessonKind,
  ModuleDraft,
  QuizOptionDraft,
  QuizQuestionDraft,
} from "./courseBuilderTypes";
import {
  AssignmentCriteriaItemErrors,
  AssignmentFieldErrors,
} from "./courseBuilderValidation";
import { CourseRevisionDTO } from "../../../services/courseService";
import { createId } from "./courseBuilderConstants";

// ============================================================================
// NORMALIZATION HELPERS
// ============================================================================

/** Normalize lesson attachments: fill in name/url from legacy fields, skip
 *  entries that have no mediaId, serverId, or url. */
export const normalizeLessonAttachments = (
  attachments?: LessonAttachmentDraft[],
): LessonAttachmentDraft[] => {
  const normalized: LessonAttachmentDraft[] = [];

  (attachments || []).forEach((attachment) => {
    const draftLike = attachment as LessonAttachmentDraft & {
      id?: string | number;
      title?: string;
      downloadUrl?: string;
    };

    const name = draftLike.name || draftLike.title;
    const url = draftLike.url || draftLike.downloadUrl;
    const serverId =
      draftLike.serverId ??
      (typeof draftLike.id === "number" ? draftLike.id : undefined);

    if (!serverId && !draftLike.mediaId && !(url && url.trim())) {
      return;
    }

    normalized.push({
      ...attachment,
      ...(serverId ? { serverId } : {}),
      name: name || "Attachment",
      url,
    });
  });

  return normalized;
};

/** Collapse consecutive whitespace and strip trailing whitespace from a
 *  snapshot text field. Returns null for empty/blank strings. */
export const normalizeSnapshotText = (value?: string | null): string | null => {
  if (value == null) return null;
  const collapsed = value.replace(/\s+/g, " ").trim();
  return collapsed.length > 0 ? collapsed : null;
};

// ============================================================================
// LOW-LEVEL TYPE PREDICATES
// ============================================================================

/** Safe hasOwnProperty check using Object.prototype.hasOwnProperty. */
export const hasOwnKey = (value: object, key: string): boolean =>
  Object.prototype.hasOwnProperty.call(value, key);

/** Type guard: true when value is a finite number. */
export const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

/** True when value is a boolean or null. */
export const isBooleanOrNull = (value: unknown): boolean =>
  typeof value === "boolean" || value === null;

// ============================================================================
// SNAPSHOT NORMALIZATION
// ============================================================================

/** Normalize a raw value into a valid LessonKind, or null if invalid. */
export const normalizeSnapshotLessonType = (
  value: unknown,
): LessonKind | null => {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (
    normalized === "reading" ||
    normalized === "video" ||
    normalized === "quiz" ||
    normalized === "assignment"
  ) {
    return normalized;
  }
  return null;
};

/** Normalize a raw value into a valid QuestionType, or null if invalid. */
export const normalizeSnapshotQuestionType = (
  value: unknown,
): QuestionType | null => {
  if (typeof value !== "string") return null;
  const upper = value.trim().toUpperCase();
  if (upper === QuestionType.MULTIPLE_CHOICE)
    return QuestionType.MULTIPLE_CHOICE;
  if (upper === QuestionType.TRUE_FALSE) return QuestionType.TRUE_FALSE;
  if (upper === QuestionType.SHORT_ANSWER) return QuestionType.SHORT_ANSWER;
  return null;
};

// ============================================================================
// REVISION CONTENT SNAPSHOT
// ============================================================================

/** Build a serializable content snapshot from draft modules.
 *  Used when creating/submitting a course revision so the BE can persist the
 *  full lesson structure (including nested questions and criteria). */
export const buildRevisionContentSnapshot = (modules: ModuleDraft[]) => ({
  snapshotVersion: 1,
  compatibility: {
    autoCompatibleOnly: true,
    level: "NON_BREAKING",
  },
  modules: modules.map((module, moduleIndex) => ({
    ...(typeof module.serverId === "number" && module.serverId > 0
      ? { id: module.serverId }
      : {}),
    orderIndex: moduleIndex,
    title: normalizeSnapshotText(module.title),
    description: normalizeSnapshotText(module.description),
    lessons: module.lessons.map((lesson, lessonIndex) => ({
      ...(typeof lesson.serverId === "number" && lesson.serverId > 0
        ? { id: lesson.serverId }
        : {}),
      orderIndex: lessonIndex,
      title: normalizeSnapshotText(lesson.title),
      type: lesson.type,
      durationMin: lesson.durationMin ?? null,
      contentText: normalizeSnapshotText(lesson.contentText),
      resourceUrl: normalizeSnapshotText(lesson.resourceUrl),
      youtubeUrl: normalizeSnapshotText(lesson.youtubeUrl),
      videoMediaId: lesson.videoMediaId ?? null,
      ...(lesson.passScore !== undefined
        ? { passScore: lesson.passScore }
        : {}),
      ...(lesson.quizMaxAttempts !== undefined
        ? { quizMaxAttempts: lesson.quizMaxAttempts }
        : {}),
      ...(lesson.quizTimeLimitMinutes !== undefined
        ? { quizTimeLimitMinutes: lesson.quizTimeLimitMinutes }
        : {}),
      ...(lesson.roundingIncrement !== undefined
        ? { roundingIncrement: lesson.roundingIncrement }
        : {}),
      ...(lesson.quizDescription !== undefined
        ? { quizDescription: normalizeSnapshotText(lesson.quizDescription) }
        : {}),
      ...(lesson.gradingMethod !== undefined
        ? { gradingMethod: normalizeSnapshotText(lesson.gradingMethod) }
        : {}),
      ...(lesson.cooldownHours !== undefined
        ? { cooldownHours: lesson.cooldownHours }
        : {}),
      ...(lesson.assignmentSubmissionType !== undefined
        ? { assignmentSubmissionType: lesson.assignmentSubmissionType }
        : {}),
      ...(lesson.assignmentDescription !== undefined
        ? {
            assignmentDescription: normalizeSnapshotText(
              lesson.assignmentDescription,
            ),
          }
        : {}),
      ...(lesson.assignmentMaxScore !== undefined
        ? { assignmentMaxScore: lesson.assignmentMaxScore }
        : {}),
      ...(lesson.assignmentPassingScore !== undefined
        ? { assignmentPassingScore: lesson.assignmentPassingScore }
        : {}),
      ...(lesson.type === "assignment"
        ? { isRequired: lesson.assignmentIsRequired ?? true }
        : lesson.assignmentIsRequired !== undefined
          ? { isRequired: lesson.assignmentIsRequired }
          : {}),
      ...(hasOwnKey(lesson, "questions")
        ? {
            questions: (lesson.questions || []).map(
              (question, questionIndex) => ({
                ...(typeof question.serverId === "number" &&
                question.serverId > 0
                  ? { id: question.serverId }
                  : {}),
                orderIndex: question.orderIndex ?? questionIndex,
                text: normalizeSnapshotText(question.text),
                type: question.type,
                score: question.score ?? null,
                options: (question.options || []).map(
                  (option, optionIndex) => ({
                    ...(typeof option.serverId === "number" &&
                    option.serverId > 0
                      ? { id: option.serverId }
                      : {}),
                    orderIndex: option.orderIndex ?? optionIndex,
                    text: normalizeSnapshotText(option.text),
                    correct: option.correct,
                  }),
                ),
              }),
            ),
          }
        : {}),
      ...(hasOwnKey(lesson, "assignmentCriteria")
        ? {
            assignmentCriteria: (lesson.assignmentCriteria || []).map(
              (criteria, criteriaIndex) => ({
                ...(typeof criteria.id === "number" && criteria.id > 0
                  ? { id: criteria.id }
                  : {}),
                orderIndex: criteria.orderIndex ?? criteriaIndex,
                name: normalizeSnapshotText(criteria.name),
                description: normalizeSnapshotText(criteria.description),
                maxPoints: criteria.maxPoints ?? null,
                // Keep rubric threshold aligned with criteria points when
                // passingPoints is not explicitly set.
                passingPoints:
                  criteria.passingPoints ?? criteria.maxPoints ?? null,
                isRequired: criteria.isRequired ?? null,
              }),
            ),
          }
        : {}),
      // Always include AI grading fields — even when false/null/empty, so BE knows the intent.
      // Default to false for aiGradingEnabled so BE doesn't skip grading accidentally.
      aiGradingEnabled: lesson.aiGradingEnabled ?? false,
      gradingStyle: lesson.gradingStyle || 'STANDARD',
      aiGradingPrompt: lesson.aiGradingPrompt ?? null,
      attachments: normalizeLessonAttachments(lesson.attachments).map(
        (attachment, attachmentIndex) => ({
          ...(typeof attachment.serverId === "number" && attachment.serverId > 0
            ? { id: attachment.serverId }
            : {}),
          orderIndex: attachmentIndex,
          name: normalizeSnapshotText(attachment.name),
          mediaId: attachment.mediaId ?? null,
          url: normalizeSnapshotText(attachment.url),
        }),
      ),
    })),
  })),
});

// ============================================================================
// REVISION SNAPSHOT PAYLOAD TYPE
// ============================================================================

export type RevisionSnapshotPayload = ReturnType<
  typeof buildRevisionContentSnapshot
>;

// ============================================================================
// REVISION SNAPSHOT NORMALIZATION
// ============================================================================

/** Normalize a parsed snapshot payload so all required structural fields
 *  (orderIndex, attachments array) are present and properly typed. */
export const normalizeRevisionSnapshotPayload = (
  snapshot: RevisionSnapshotPayload,
): RevisionSnapshotPayload => {
  const normalizedModules = Array.isArray(snapshot.modules)
    ? snapshot.modules.map((module, moduleIndex) => ({
        ...module,
        orderIndex:
          typeof module.orderIndex === "number" ? module.orderIndex : moduleIndex,
        lessons: Array.isArray(module.lessons)
          ? module.lessons.map((lesson, lessonIndex) => {
              const lessonType = normalizeSnapshotLessonType(lesson.type);
              return {
                ...lesson,
                orderIndex:
                  typeof lesson.orderIndex === "number"
                    ? lesson.orderIndex
                    : lessonIndex,
                ...(lessonType === "assignment" &&
                !hasOwnKey(lesson, "isRequired")
                  ? { isRequired: true }
                  : {}),
                ...(hasOwnKey(lesson, "questions")
                  ? {
                      questions: Array.isArray(lesson.questions)
                        ? lesson.questions.map((question, questionIndex) => ({
                            ...question,
                            orderIndex:
                              typeof question.orderIndex === "number"
                                ? question.orderIndex
                                : questionIndex,
                            options: Array.isArray(question.options)
                              ? question.options.map((option, optionIndex) => ({
                                  ...option,
                                  orderIndex:
                                    typeof option.orderIndex === "number"
                                      ? option.orderIndex
                                      : optionIndex,
                                }))
                              : [],
                          }))
                        : [],
                    }
                  : {}),
                ...(hasOwnKey(lesson, "assignmentCriteria")
                  ? {
                      assignmentCriteria: Array.isArray(lesson.assignmentCriteria)
                        ? lesson.assignmentCriteria.map(
                            (criteria, criteriaIndex) => ({
                              ...criteria,
                              orderIndex:
                                typeof criteria.orderIndex === "number"
                                  ? criteria.orderIndex
                                  : criteriaIndex,
                            }),
                          )
                        : [],
                    }
                  : {}),
                attachments: Array.isArray(lesson.attachments)
                  ? lesson.attachments.map((attachment, attachmentIndex) => ({
                      ...attachment,
                      orderIndex:
                        typeof attachment.orderIndex === "number"
                          ? attachment.orderIndex
                          : attachmentIndex,
                      mediaId: Object.prototype.hasOwnProperty.call(
                        attachment,
                        "mediaId",
                      )
                        ? attachment.mediaId
                        : null,
                      url: Object.prototype.hasOwnProperty.call(
                        attachment,
                        "url",
                      )
                        ? attachment.url
                        : null,
                    }))
                  : [],
              };
            })
          : [],
      }))
    : [];

  return {
    ...snapshot,
    snapshotVersion: 1,
    compatibility: {
      autoCompatibleOnly: true,
      level: "NON_BREAKING",
    },
    modules: normalizedModules,
  };
};

// ============================================================================
// REVISION SNAPSHOT VALIDATION
// ============================================================================

/** Validate a snapshot payload. Returns a Vietnamese error message if
 *  invalid, or null if the snapshot is structurally valid. */
export const validateRevisionSnapshotPayload = (
  snapshot: RevisionSnapshotPayload,
): string | null => {
  if (!Array.isArray(snapshot.modules)) {
    return "Snapshot không hợp lệ: thiếu danh sách module.";
  }

  for (
    let moduleIndex = 0;
    moduleIndex < snapshot.modules.length;
    moduleIndex += 1
  ) {
    const module = snapshot.modules[moduleIndex];
    if (!Array.isArray(module.lessons)) {
      return `Snapshot không hợp lệ tại module #${moduleIndex + 1}: thiếu danh sách lessons.`;
    }

    for (
      let lessonIndex = 0;
      lessonIndex < module.lessons.length;
      lessonIndex += 1
    ) {
      const lesson = module.lessons[lessonIndex];
      const lessonType = normalizeSnapshotLessonType(lesson.type);
      if (!lessonType) {
        return `Snapshot không hợp lệ tại module #${moduleIndex + 1}, item #${lessonIndex + 1}: thiếu type.`;
      }
      if (
        typeof lesson.orderIndex !== "number" ||
        Number.isNaN(lesson.orderIndex)
      ) {
        return `Snapshot không hợp lệ tại module #${moduleIndex + 1}, item #${lessonIndex + 1}: orderIndex không hợp lệ.`;
      }

      if (lessonType === "quiz") {
        if (!hasOwnKey(lesson, "passScore")) {
          return `Snapshot không hợp lệ tại module #${moduleIndex + 1}, quiz #${lessonIndex + 1}: thiếu passScore (field thiếu khác với explicit null).`;
        }
        if (
          !isFiniteNumber(lesson.passScore) ||
          lesson.passScore < 0 ||
          lesson.passScore > 100
        ) {
          return `Snapshot không hợp lệ tại module #${moduleIndex + 1}, quiz #${lessonIndex + 1}: passScore phải trong khoảng 0-100.`;
        }

        if (!hasOwnKey(lesson, "questions")) {
          return `Snapshot không hợp lệ tại module #${moduleIndex + 1}, quiz #${lessonIndex + 1}: thiếu questions.`;
        }
        if (
          !Array.isArray(lesson.questions) ||
          lesson.questions.length === 0
        ) {
          return `Snapshot không hợp lệ tại module #${moduleIndex + 1}, quiz #${lessonIndex + 1}: questions phải là mảng và có ít nhất 1 câu.`;
        }

        for (
          let questionIndex = 0;
          questionIndex < lesson.questions.length;
          questionIndex += 1
        ) {
          const question = lesson.questions[questionIndex];
          if (typeof question !== "object" || question == null) {
            return `Snapshot không hợp lệ tại module #${moduleIndex + 1}, quiz #${lessonIndex + 1}, câu #${questionIndex + 1}: dữ liệu câu hỏi sai cấu trúc.`;
          }
          const questionType = normalizeSnapshotQuestionType(
            (question as Record<string, unknown>).type,
          );
          if (!questionType) {
            return `Snapshot không hợp lệ tại module #${moduleIndex + 1}, quiz #${lessonIndex + 1}, câu #${questionIndex + 1}: thiếu type hợp lệ.`;
          }
          if (
            !Array.isArray((question as Record<string, unknown>).options) ||
            ((question as Record<string, unknown>).options as unknown[]).length ===
              0
          ) {
            return `Snapshot không hợp lệ tại module #${moduleIndex + 1}, quiz #${lessonIndex + 1}, câu #${questionIndex + 1}: thiếu options.`;
          }
        }
      }

      if (lessonType === "assignment") {
        const assignmentRequiredValue = hasOwnKey(lesson, "isRequired")
          ? lesson.isRequired
          : true;
        if (!isBooleanOrNull(assignmentRequiredValue)) {
          return `Snapshot không hợp lệ tại module #${moduleIndex + 1}, assignment #${lessonIndex + 1}: isRequired phải là boolean hoặc null.`;
        }

        if (!hasOwnKey(lesson, "assignmentCriteria")) {
          return `Snapshot không hợp lệ tại module #${moduleIndex + 1}, assignment #${lessonIndex + 1}: thiếu rubric (assignmentCriteria).`;
        }
        if (
          !Array.isArray(lesson.assignmentCriteria) ||
          lesson.assignmentCriteria.length === 0
        ) {
          return `Snapshot không hợp lệ tại module #${moduleIndex + 1}, assignment #${lessonIndex + 1}: rubric phải có ít nhất 1 tiêu chí.`;
        }

        for (
          let criteriaIndex = 0;
          criteriaIndex < lesson.assignmentCriteria.length;
          criteriaIndex += 1
        ) {
          const criteria = lesson.assignmentCriteria[criteriaIndex];
          if (typeof criteria !== "object" || criteria == null) {
            return `Snapshot không hợp lệ tại module #${moduleIndex + 1}, assignment #${lessonIndex + 1}, rubric #${criteriaIndex + 1}: dữ liệu tiêu chí sai cấu trúc.`;
          }
          const criteriaRecord = criteria as Record<string, unknown>;
          const criteriaName =
            typeof criteriaRecord.name === "string"
              ? criteriaRecord.name.trim()
              : "";
          if (!criteriaName) {
            return `Snapshot không hợp lệ tại module #${moduleIndex + 1}, assignment #${lessonIndex + 1}, rubric #${criteriaIndex + 1}: thiếu tên tiêu chí.`;
          }
          if (
            !isFiniteNumber(criteriaRecord.maxPoints) ||
            criteriaRecord.maxPoints <= 0
          ) {
            return `Snapshot không hợp lệ tại module #${moduleIndex + 1}, assignment #${lessonIndex + 1}, rubric #${criteriaIndex + 1}: maxPoints phải > 0.`;
          }
          if (
            !hasOwnKey(criteriaRecord, "isRequired") ||
            !isBooleanOrNull(criteriaRecord.isRequired)
          ) {
            return `Snapshot không hợp lệ tại module #${moduleIndex + 1}, assignment #${lessonIndex + 1}, rubric #${criteriaIndex + 1}: isRequired phải là boolean hoặc null.`;
          }
        }
      }
    }
  }

  return null;
};

// ============================================================================
// COERCION HELPERS
// ============================================================================

/** Coerce a value to a positive finite number, or undefined. */
export const toPositiveNumberOrUndefined = (
  value: unknown,
): number | undefined => {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return undefined;
  }
  return value;
};

/** Coerce a value to a non-negative finite number, or undefined. */
export const toNonNegativeNumberOrUndefined = (
  value: unknown,
): number | undefined => {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return undefined;
  }
  return value;
};

/** Coerce a value to a positive integer ID (>0), or undefined.
 *  Accepts numbers or parseable decimal-int strings. */
export const toPositiveIntegerIdOrUndefined = (
  value: unknown,
): number | undefined => {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    return value;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }
    const parsed = Number.parseInt(trimmed, 10);
    if (Number.isInteger(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return undefined;
};

/** Coerce a value to a non-empty trimmed string, or undefined. */
export const toStringOrUndefined = (value: unknown): string | undefined => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  return undefined;
};

// ============================================================================
// TEXT / KEY NORMALIZATION
// ============================================================================

/** Normalize a value to a lowercase trimmed string key for comparison. */
export const normalizeKey = (value?: string): string =>
  (value || "").trim().toLowerCase();

/** Detect strings that look like numeric IDs (5+ consecutive digits).
 *  Used to prefer user-authored text over auto-generated placeholder values. */
export const isSuspiciousNumericText = (value?: string): boolean => {
  if (!value) return false;
  return /^\d{5,}$/.test(value.trim());
};

/** Pick the best available text: prefer the primary if it does not look like
 *  an auto-generated ID, otherwise fall back to the secondary. */
export const pickPreferredText = (
  primary?: string,
  fallback?: string,
): string | undefined => {
  if (primary && !isSuspiciousNumericText(primary)) {
    return primary;
  }
  if (fallback && !isSuspiciousNumericText(fallback)) {
    return fallback;
  }
  return primary || fallback;
};

// ============================================================================
// DEDUPLICATION
// ============================================================================

/** Build a content-based fingerprint for a lesson to detect near-duplicates
 *  when two drafts share the same content but have different IDs. */
export const buildLessonFingerprint = (lesson: LessonDraft): string => {
  const normalizedTitle = normalizeKey(lesson.title);
  const normalizedContent = normalizeKey(lesson.contentText);
  const normalizedResource = normalizeKey(lesson.resourceUrl);
  const normalizedYoutube = normalizeKey(lesson.youtubeUrl);
  const type = lesson.type || "reading";

  return [
    type,
    normalizedTitle,
    normalizedContent,
    normalizedResource,
    normalizedYoutube,
    lesson.passScore ?? "",
    lesson.assignmentSubmissionType ?? "",
    lesson.assignmentMaxScore ?? "",
    lesson.assignmentPassingScore ?? "",
  ].join("|");
};

/** Deduplicate a list of draft lessons.
 *  - serverId duplicates are removed by serverId (first occurrence wins).
 *  - client-only (no serverId) duplicates are removed by fingerprint. */
export const dedupeDraftLessons = (lessons: LessonDraft[]): LessonDraft[] => {
  const seenServerIds = new Set<number>();
  const seenFingerprints = new Set<string>();

  return lessons.filter((lesson) => {
    if (typeof lesson.serverId === "number") {
      if (seenServerIds.has(lesson.serverId)) {
        return false;
      }
      seenServerIds.add(lesson.serverId);
      return true;
    }

    const fingerprint = buildLessonFingerprint(lesson);
    if (seenFingerprints.has(fingerprint)) {
      return false;
    }
    seenFingerprints.add(fingerprint);
    return true;
  });
};

// ============================================================================
// MODULE / LESSON MAPPING
// ============================================================================

/** Map raw course module data from an API response into ModuleDraft[].
 *  Handles legacy field names and type coercion for draft editing. */
export const mapCourseModulesToDraftModules = (
  courseModules: Array<Record<string, unknown>>,
): ModuleDraft[] =>
  courseModules.map((module) => {
    const moduleRecord = module as Record<string, unknown>;
    const moduleLessons = Array.isArray(moduleRecord.lessons)
      ? (moduleRecord.lessons as Array<Record<string, unknown>>)
      : [];

    return {
      id: String(moduleRecord.id ?? createId()),
      ...(typeof moduleRecord.id === "number"
        ? { serverId: moduleRecord.id }
        : {}),
      title: toStringOrUndefined(moduleRecord.title) || "",
      description: toStringOrUndefined(moduleRecord.description) || "",
      lessons: moduleLessons.map((rawLesson) => {
        const lessonId = rawLesson.id;
        const quizQuestions = Array.isArray(rawLesson.questions)
          ? (rawLesson.questions as QuizQuestionDraft[])
          : [];
        const assignmentCriteria = Array.isArray(rawLesson.assignmentCriteria)
          ? (rawLesson.assignmentCriteria as AssignmentCriteriaDraft[])
          : Array.isArray((rawLesson as Record<string, unknown>).criteria)
            ? ((rawLesson as Record<string, unknown>)
                .criteria as AssignmentCriteriaDraft[])
            : [];

        return {
          id: String(lessonId ?? createId()),
          ...(typeof lessonId === "number" ? { serverId: lessonId } : {}),
          title: toStringOrUndefined(rawLesson.title) || "",
          type: parseLessonKindFromSnapshot(rawLesson.type),
          durationMin: toPositiveNumberOrUndefined(rawLesson.durationSec)
            ? Math.round(Number(rawLesson.durationSec) / 60)
            : toPositiveNumberOrUndefined(rawLesson.durationMin),
          contentText: toStringOrUndefined(rawLesson.contentText),
          resourceUrl: toStringOrUndefined(rawLesson.resourceUrl),
          youtubeUrl:
            toStringOrUndefined(rawLesson.youtubeUrl) ||
            toStringOrUndefined(rawLesson.videoUrl),
          videoMediaId:
            typeof rawLesson.videoMediaId === "number"
              ? rawLesson.videoMediaId
              : undefined,
          passScore: toPositiveNumberOrUndefined(rawLesson.passScore),
          quizTimeLimitMinutes: toPositiveNumberOrUndefined(
            rawLesson.quizTimeLimitMinutes,
          ),
          quizMaxAttempts: toPositiveNumberOrUndefined(
            rawLesson.quizMaxAttempts,
          ),
          roundingIncrement: toPositiveNumberOrUndefined(
            rawLesson.roundingIncrement,
          ),
          quizDescription: toStringOrUndefined(rawLesson.quizDescription),
          gradingMethod: toStringOrUndefined(rawLesson.gradingMethod),
          cooldownHours: toPositiveNumberOrUndefined(rawLesson.cooldownHours),
          assignmentSubmissionType: parseSubmissionTypeFromSnapshot(
            rawLesson.assignmentSubmissionType ?? rawLesson.submissionType,
          ),
          assignmentDescription: toStringOrUndefined(
            rawLesson.assignmentDescription,
          ),
          assignmentMaxScore: toPositiveNumberOrUndefined(
            rawLesson.assignmentMaxScore,
          ),
          assignmentPassingScore: toPositiveNumberOrUndefined(
            rawLesson.assignmentPassingScore,
          ),
          assignmentIsRequired:
            typeof rawLesson.assignmentIsRequired === "boolean"
              ? rawLesson.assignmentIsRequired
              : typeof rawLesson.isRequired === "boolean"
                ? rawLesson.isRequired
                : undefined,
          questions: quizQuestions,
          assignmentCriteria,
          attachments: normalizeLessonAttachments(
            rawLesson.attachments as LessonAttachmentDraft[] | undefined,
          ),
          aiGradingEnabled:
            typeof rawLesson.aiGradingEnabled === "boolean"
              ? rawLesson.aiGradingEnabled
              : undefined,
          aiGradingPrompt: toStringOrUndefined(rawLesson.aiGradingPrompt),
          gradingStyle:
            rawLesson.gradingStyle === "STANDARD" ||
            rawLesson.gradingStyle === "STRICT" ||
            rawLesson.gradingStyle === "LENIENT"
              ? rawLesson.gradingStyle
              : undefined,
        };
      }),
    };
  });

// ============================================================================
// SNAPSHOT MERGING
// ============================================================================

/** Merge snapshot-derived modules with a fallback (e.g. baseline revision).
 *  Snapshot values take precedence; fallback enriches missing fields
 *  (contentText, attachments, criteria, questions). */
export const mergeSnapshotModulesWithFallback = (
  snapshotModules: ModuleDraft[],
  fallbackModules: ModuleDraft[],
): ModuleDraft[] => {
  if (snapshotModules.length === 0) {
    return fallbackModules;
  }

  const fallbackByModuleId = new Map<number, ModuleDraft>();
  const fallbackByModuleTitle = new Map<string, ModuleDraft>();

  fallbackModules.forEach((module) => {
    if (module.serverId) {
      fallbackByModuleId.set(module.serverId, module);
    }
    fallbackByModuleTitle.set(normalizeKey(module.title), module);
  });

  const merged: ModuleDraft[] = snapshotModules.map((snapshotModule) => {
    const fallbackModule =
      (snapshotModule.serverId
        ? fallbackByModuleId.get(snapshotModule.serverId)
        : undefined) ||
      fallbackByModuleTitle.get(normalizeKey(snapshotModule.title));

    if (!fallbackModule) {
      return snapshotModule;
    }

    const fallbackByLessonId = new Map<number, { lesson: LessonDraft; index: number }>();
    const fallbackByTypeAndOrder = new Map<string, { lesson: LessonDraft; index: number }>();

    fallbackModule.lessons.forEach((lesson, index) => {
      if (lesson.serverId) {
        fallbackByLessonId.set(lesson.serverId, { lesson, index });
      }
      fallbackByTypeAndOrder.set(`${lesson.type}:${index}`, { lesson, index });
    });

    const mergedLessons = snapshotModule.lessons.map(
      (snapshotLesson, index) => {
        const fallbackMatch =
          (snapshotLesson.serverId
            ? fallbackByLessonId.get(snapshotLesson.serverId)
            : undefined) ||
          fallbackByTypeAndOrder.get(`${snapshotLesson.type}:${index}`);

        const fallbackLesson = fallbackMatch?.lesson;

        if (!fallbackLesson) {
          return snapshotLesson;
        }

        return {
          ...fallbackLesson,
          ...snapshotLesson,
          contentText: pickPreferredText(
            snapshotLesson.contentText,
            fallbackLesson.contentText,
          ),
          resourceUrl: snapshotLesson.resourceUrl || fallbackLesson.resourceUrl,
          youtubeUrl: snapshotLesson.youtubeUrl || fallbackLesson.youtubeUrl,
          videoMediaId:
            snapshotLesson.videoMediaId ?? fallbackLesson.videoMediaId,
          questions:
            snapshotLesson.questions && snapshotLesson.questions.length > 0
              ? snapshotLesson.questions
              : fallbackLesson.questions,
          assignmentCriteria:
            snapshotLesson.assignmentCriteria &&
            snapshotLesson.assignmentCriteria.length > 0
              ? snapshotLesson.assignmentCriteria
              : fallbackLesson.assignmentCriteria,
          attachments:
            snapshotLesson.attachments && snapshotLesson.attachments.length > 0
              ? snapshotLesson.attachments
              : fallbackLesson.attachments,
        };
      },
    );

    return {
      ...snapshotModule,
      ...fallbackModule,
      description:
        pickPreferredText(
          snapshotModule.description,
          fallbackModule.description,
        ) || "",
      // Snapshot is authoritative in revision mode:
      // do not append unmatched fallback lessons.
      lessons: dedupeDraftLessons(mergedLessons),
    };
  });

  return merged;
};

// ============================================================================
// PARSING HELPERS
// ============================================================================

/** Parse a raw snapshot value into a QuestionType (default: MULTIPLE_CHOICE). */
export const parseQuestionTypeFromSnapshot = (value: unknown): QuestionType => {
  if (typeof value === "string") {
    const upper = value.toUpperCase();
    if (upper === QuestionType.TRUE_FALSE) return QuestionType.TRUE_FALSE;
    if (upper === QuestionType.SHORT_ANSWER) return QuestionType.SHORT_ANSWER;
    if (upper === QuestionType.MULTIPLE_CHOICE)
      return QuestionType.MULTIPLE_CHOICE;
  }
  return QuestionType.MULTIPLE_CHOICE;
};

/** Parse a raw snapshot value into a LessonKind (default: "reading"). */
export const parseLessonKindFromSnapshot = (value: unknown): LessonKind => {
  if (typeof value !== "string") return "reading";
  const normalized = value.toLowerCase();
  if (
    normalized === "video" ||
    normalized === "quiz" ||
    normalized === "assignment" ||
    normalized === "reading"
  ) {
    return normalized;
  }
  return "reading";
};

/** Parse a raw snapshot value into a SubmissionType (default: TEXT). */
export const parseSubmissionTypeFromSnapshot = (
  value: unknown,
): SubmissionType => {
  if (typeof value === "string") {
    const upper = value.toUpperCase();
    if (upper === SubmissionType.FILE) return SubmissionType.FILE;
    if (upper === SubmissionType.TEXT) return SubmissionType.TEXT;
    if (upper === SubmissionType.LINK) return SubmissionType.LINK;
  }
  return SubmissionType.TEXT;
};

// ============================================================================
// REVISION SNAPSHOT PARSING
// ============================================================================

/** Parse a JSON content-snapshot string into ModuleDraft[].
 *  Handles legacy field names (quizzes, assignments, items) and normalizes
 *  all lesson sub-structures (questions, criteria, attachments). */
export const parseModulesFromRevisionSnapshot = (
  contentSnapshotJson?: string,
): ModuleDraft[] => {
  if (!contentSnapshotJson) return [];

  try {
    const parsed = JSON.parse(contentSnapshotJson) as {
      modules?: Array<Record<string, unknown>>;
    };

    if (!Array.isArray(parsed.modules)) {
      return [];
    }

    return parsed.modules.map((module, moduleIndex) => {
      const moduleId = `snapshot-module-${moduleIndex}-${createId()}`;
      const moduleServerId = toPositiveIntegerIdOrUndefined(module.id);
      const baseLessons = Array.isArray(module.lessons) ? module.lessons : [];
      const legacyItems = Array.isArray(module.items) ? module.items : [];
      const legacyQuizzes = Array.isArray(module.quizzes)
        ? module.quizzes.map((quizRaw) => ({
            ...(quizRaw as Record<string, unknown>),
            type: "quiz",
            quizDescription:
              toStringOrUndefined(
                (quizRaw as Record<string, unknown>).quizDescription,
              ) ||
              toStringOrUndefined(
                (quizRaw as Record<string, unknown>).description,
              ),
            quizTimeLimitMinutes:
              toPositiveNumberOrUndefined(
                (quizRaw as Record<string, unknown>).quizTimeLimitMinutes,
              ) ??
              toPositiveNumberOrUndefined(
                (quizRaw as Record<string, unknown>).timeLimitMinutes,
              ),
            quizMaxAttempts:
              toPositiveNumberOrUndefined(
                (quizRaw as Record<string, unknown>).quizMaxAttempts,
              ) ??
              toPositiveNumberOrUndefined(
                (quizRaw as Record<string, unknown>).maxAttempts,
              ),
          }))
        : [];
      const legacyAssignments = Array.isArray(module.assignments)
        ? module.assignments.map((assignmentRaw) => ({
            ...(assignmentRaw as Record<string, unknown>),
            type: "assignment",
            assignmentDescription:
              toStringOrUndefined(
                (assignmentRaw as Record<string, unknown>)
                  .assignmentDescription,
              ) ||
              toStringOrUndefined(
                (assignmentRaw as Record<string, unknown>).description,
              ),
            assignmentSubmissionType:
              (assignmentRaw as Record<string, unknown>)
                .assignmentSubmissionType ??
              (assignmentRaw as Record<string, unknown>).submissionType,
            assignmentMaxScore:
              toPositiveNumberOrUndefined(
                (assignmentRaw as Record<string, unknown>).assignmentMaxScore,
              ) ??
              toPositiveNumberOrUndefined(
                (assignmentRaw as Record<string, unknown>).maxScore,
              ),
            assignmentPassingScore:
              toPositiveNumberOrUndefined(
                (assignmentRaw as Record<string, unknown>)
                  .assignmentPassingScore,
              ) ??
              toPositiveNumberOrUndefined(
                (assignmentRaw as Record<string, unknown>).passingScore,
              ),
            assignmentCriteria:
              (assignmentRaw as Record<string, unknown>).assignmentCriteria ??
              (assignmentRaw as Record<string, unknown>).criteria,
          }))
        : [];

      // Some older snapshots may contain both `lessons` and legacy
      // `quizzes/assignments/items` arrays. Merge all sources so the
      // revision editor does not silently drop quiz/assignment items.
      const combinedLessonSources = [
        ...baseLessons,
        ...legacyItems,
        ...legacyQuizzes,
        ...legacyAssignments,
      ].filter(
        (lesson): lesson is Record<string, unknown> =>
          typeof lesson === "object" && lesson != null,
      );

      const seenSnapshotItemKeys = new Set<string>();
      const lessonsSource = combinedLessonSources.filter(
        (lesson, lessonIndex) => {
          const type = parseLessonKindFromSnapshot(lesson.type);
          const id = toPositiveIntegerIdOrUndefined(lesson.id);
          const orderIndex =
            toPositiveNumberOrUndefined(lesson.orderIndex) ?? lessonIndex;
          const title = normalizeKey(toStringOrUndefined(lesson.title) || "");
          const dedupeKey = id
            ? `${type}:${id}`
            : `${type}:${orderIndex}:${title}`;

          if (seenSnapshotItemKeys.has(dedupeKey)) {
            return false;
          }
          seenSnapshotItemKeys.add(dedupeKey);
          return true;
        },
      );

      const lessons = lessonsSource.sort((a, b) => {
        const left = toPositiveNumberOrUndefined(a.orderIndex) ?? 0;
        const right = toPositiveNumberOrUndefined(b.orderIndex) ?? 0;
        return left - right;
      });

      return {
        id: moduleId,
        ...(moduleServerId ? { serverId: moduleServerId } : {}),
        title:
          typeof module.title === "string"
            ? module.title
            : `Module ${moduleIndex + 1}`,
        description:
          typeof module.description === "string" ? module.description : "",
        lessons: dedupeDraftLessons(
          lessons.map((lessonRaw, lessonIndex) => {
            const lessonId = `snapshot-lesson-${moduleIndex}-${lessonIndex}-${createId()}`;
            const lessonServerId = toPositiveIntegerIdOrUndefined(
              lessonRaw.id,
            );
            const questionsRaw = Array.isArray(lessonRaw.questions)
              ? lessonRaw.questions
              : [];
            const criteriaRaw = Array.isArray(lessonRaw.assignmentCriteria)
              ? lessonRaw.assignmentCriteria
              : Array.isArray((lessonRaw as Record<string, unknown>).criteria)
                ? ((lessonRaw as Record<string, unknown>)
                    .criteria as unknown[])
                : [];
            const attachmentsRaw = Array.isArray(lessonRaw.attachments)
              ? lessonRaw.attachments
              : [];

            const questions: QuizQuestionDraft[] = questionsRaw.map(
              (questionRaw, questionIndex) => {
                const optionsRaw = Array.isArray(questionRaw.options)
                  ? questionRaw.options
                  : [];
                const questionServerId = toPositiveIntegerIdOrUndefined(
                  questionRaw.id,
                );
                return {
                  id: `snapshot-q-${moduleIndex}-${lessonIndex}-${questionIndex}-${createId()}`,
                  ...(questionServerId ? { serverId: questionServerId } : {}),
                  text:
                    typeof questionRaw.text === "string"
                      ? questionRaw.text
                      : "",
                  type: parseQuestionTypeFromSnapshot(questionRaw.type),
                  score: toPositiveNumberOrUndefined(questionRaw.score) ?? 1,
                  orderIndex:
                    toPositiveNumberOrUndefined(questionRaw.orderIndex) ??
                    questionIndex,
                  options: optionsRaw.map(
                    (
                      optionRaw: Record<string, unknown>,
                      optionIndex: number,
                    ) => {
                      const optionServerId = toPositiveIntegerIdOrUndefined(
                        optionRaw.id,
                      );
                      return {
                        id: `snapshot-opt-${moduleIndex}-${lessonIndex}-${questionIndex}-${optionIndex}-${createId()}`,
                        ...(optionServerId ? { serverId: optionServerId } : {}),
                        text:
                          typeof optionRaw.text === "string"
                            ? optionRaw.text
                            : "",
                        correct: Boolean(optionRaw.correct),
                        orderIndex:
                          toPositiveNumberOrUndefined(optionRaw.orderIndex) ??
                          optionIndex,
                      };
                    },
                  ),
                };
              },
            );

            const assignmentCriteria: AssignmentCriteriaDraft[] =
              criteriaRaw.map((criteriaRawItem, criteriaIndex) => {
                const criteriaId = toPositiveIntegerIdOrUndefined(
                  criteriaRawItem.id,
                );
                // Handle both JSON number (30) and JSON string ("30") from BE
                const rawMaxPoints = criteriaRawItem.maxPoints;
                const maxPoints =
                  toPositiveNumberOrUndefined(
                    typeof rawMaxPoints === 'number' ? rawMaxPoints
                      : typeof rawMaxPoints === 'string' ? Number(rawMaxPoints)
                      : undefined,
                  ) ?? 0;
                return {
                  clientId: `snapshot-criteria-${moduleIndex}-${lessonIndex}-${criteriaIndex}-${createId()}`,
                  ...(criteriaId ? { id: criteriaId } : {}),
                  name:
                    typeof criteriaRawItem.name === "string"
                      ? criteriaRawItem.name
                      : "",
                  description:
                    typeof criteriaRawItem.description === "string"
                      ? criteriaRawItem.description
                      : "",
                  maxPoints,
                  passingPoints:
                    toNonNegativeNumberOrUndefined(
                      criteriaRawItem.passingPoints,
                    ) ?? maxPoints,
                  orderIndex:
                    toPositiveNumberOrUndefined(criteriaRawItem.orderIndex) ??
                    criteriaIndex,
                  isRequired:
                    typeof criteriaRawItem.isRequired === "boolean"
                      ? criteriaRawItem.isRequired
                      : true,
                };
              });

            const attachments = normalizeLessonAttachments(
              attachmentsRaw.map((attachmentRaw, attachmentIndex) => {
                const attachmentServerId = toPositiveIntegerIdOrUndefined(
                  attachmentRaw.id,
                );
                return {
                  id: `snapshot-attachment-${moduleIndex}-${lessonIndex}-${attachmentIndex}-${createId()}`,
                  name:
                    typeof attachmentRaw.name === "string"
                      ? attachmentRaw.name
                      : "Attachment",
                  url:
                    typeof attachmentRaw.url === "string"
                      ? attachmentRaw.url
                      : undefined,
                  mediaId:
                    typeof attachmentRaw.mediaId === "number"
                      ? attachmentRaw.mediaId
                      : undefined,
                  ...(attachmentServerId
                    ? { serverId: attachmentServerId }
                    : {}),
                };
              }),
            );

            return {
              id: lessonId,
              ...(lessonServerId ? { serverId: lessonServerId } : {}),
              title:
                typeof lessonRaw.title === "string"
                  ? lessonRaw.title
                  : `Bài học ${lessonIndex + 1}`,
              type: parseLessonKindFromSnapshot(lessonRaw.type),
              durationMin: toPositiveNumberOrUndefined(lessonRaw.durationMin),
              contentText:
                toStringOrUndefined(lessonRaw.contentText) ||
                toStringOrUndefined(lessonRaw.content) ||
                toStringOrUndefined(lessonRaw.description) ||
                "",
              resourceUrl: toStringOrUndefined(lessonRaw.resourceUrl),
              youtubeUrl:
                toStringOrUndefined(lessonRaw.youtubeUrl) ||
                toStringOrUndefined(lessonRaw.videoUrl),
              videoMediaId:
                typeof lessonRaw.videoMediaId === "number"
                  ? lessonRaw.videoMediaId
                  : undefined,
              passScore: toPositiveNumberOrUndefined(lessonRaw.passScore),
              quizMaxAttempts: toPositiveNumberOrUndefined(
                lessonRaw.quizMaxAttempts,
              ),
              quizTimeLimitMinutes: toPositiveNumberOrUndefined(
                lessonRaw.quizTimeLimitMinutes,
              ),
              roundingIncrement: toPositiveNumberOrUndefined(
                lessonRaw.roundingIncrement,
              ),
              quizDescription:
                typeof lessonRaw.quizDescription === "string"
                  ? lessonRaw.quizDescription
                  : undefined,
              gradingMethod:
                typeof lessonRaw.gradingMethod === "string"
                  ? lessonRaw.gradingMethod
                  : undefined,
              cooldownHours: toPositiveNumberOrUndefined(
                lessonRaw.cooldownHours,
              ),
              assignmentSubmissionType: parseSubmissionTypeFromSnapshot(
                lessonRaw.assignmentSubmissionType ?? lessonRaw.submissionType,
              ),
              assignmentDescription:
                toStringOrUndefined(lessonRaw.assignmentDescription) ||
                toStringOrUndefined(lessonRaw.description),
              assignmentMaxScore:
                toPositiveNumberOrUndefined(lessonRaw.assignmentMaxScore) ??
                toPositiveNumberOrUndefined(lessonRaw.maxScore),
              assignmentPassingScore:
                toPositiveNumberOrUndefined(lessonRaw.assignmentPassingScore) ??
                toPositiveNumberOrUndefined(lessonRaw.passingScore),
              assignmentIsRequired:
                typeof lessonRaw.isRequired === "boolean"
                  ? lessonRaw.isRequired
                  : typeof lessonRaw.required === "boolean"
                    ? lessonRaw.required
                    : undefined,
              questions,
              assignmentCriteria,
              attachments,
              // AI Grading fields — added to snapshot by BE,
              // map them here for revision editor.
              aiGradingEnabled:
                typeof lessonRaw.aiGradingEnabled === "boolean"
                  ? lessonRaw.aiGradingEnabled
                  : false,
              gradingStyle:
                lessonRaw.gradingStyle === "STANDARD" ||
                lessonRaw.gradingStyle === "STRICT" ||
                lessonRaw.gradingStyle === "LENIENT"
                  ? lessonRaw.gradingStyle
                  : "STANDARD",
              aiGradingPrompt:
                typeof lessonRaw.aiGradingPrompt === "string"
                  ? lessonRaw.aiGradingPrompt
                  : "",
            };
          }),
        ),
      };
    });
  } catch (error) {
    console.error("Failed to parse revision content snapshot:", error);
    return [];
  }
};

// ============================================================================
// CHANGE DETECTION
// ============================================================================

/** Information about what changed in a module or lesson. */
export type ChangeInfo = {
  isNew: boolean;
  changedFields: string[];
};

/** Strip HTML tags and normalize whitespace for content comparison. */
export const normalizeComparableContent = (value?: string): string =>
  normalizeKey((value || "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " "));

/** Normalize a list of strings: lowercase, trimmed, non-empty. */
export const normalizeStringList = (items?: string[]): string[] =>
  (items || [])
    .map((item) => normalizeKey(item))
    .filter((item) => item.length > 0);

/** Parse a JSON-encoded string array from a revision DTO field, or []. */
export const parseJsonStringArray = (raw?: string): string[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
};

/** Check if two string arrays contain the same elements ignoring order. */
export const arraysEqualIgnoringOrder = (
  left: string[],
  right: string[],
): boolean => {
  if (left.length !== right.length) {
    return false;
  }
  const sortedLeft = [...left].sort();
  const sortedRight = [...right].sort();
  return sortedLeft.every((item, index) => item === sortedRight[index]);
};

/** Find the best-matching baseline module for a draft module.
 *  Priority: serverId match > positional match > title match. */
export const findMatchingModule = (
  baselineModules: ModuleDraft[],
  module: ModuleDraft,
  moduleIndex: number,
): ModuleDraft | undefined => {
  if (typeof module.serverId === "number") {
    const byId = baselineModules.find(
      (candidate) => candidate.serverId === module.serverId,
    );
    if (byId) return byId;
  }
  if (baselineModules[moduleIndex]) {
    return baselineModules[moduleIndex];
  }
  return baselineModules.find(
    (candidate) =>
      normalizeKey(candidate.title) === normalizeKey(module.title),
  );
};

/** Find the best-matching baseline lesson for a draft lesson.
 *  Priority: serverId match > positional match > type+title match. */
export const findMatchingLesson = (
  baselineLessons: LessonDraft[],
  lesson: LessonDraft,
  lessonIndex: number,
): LessonDraft | undefined => {
  if (typeof lesson.serverId === "number") {
    const byId = baselineLessons.find(
      (candidate) => candidate.serverId === lesson.serverId,
    );
    if (byId) return byId;
  }
  if (baselineLessons[lessonIndex]) {
    return baselineLessons[lessonIndex];
  }
  return baselineLessons.find(
    (candidate) =>
      candidate.type === lesson.type &&
      normalizeKey(candidate.title) === normalizeKey(lesson.title),
  );
};

/** Determine which fields changed in a module compared to its baseline. */
export const getModuleChangeInfo = (
  module: ModuleDraft,
  moduleIndex: number,
  baselineModules: ModuleDraft[],
): { info: ChangeInfo; baselineModule?: ModuleDraft } => {
  const baselineModule = findMatchingModule(
    baselineModules,
    module,
    moduleIndex,
  );
  if (!baselineModule) {
    return {
      info: {
        isNew: true,
        changedFields: ["Module mới"],
      },
    };
  }

  const changedFields: string[] = [];
  if (normalizeKey(module.title) !== normalizeKey(baselineModule.title)) {
    changedFields.push("Tên module");
  }
  if (
    normalizeComparableContent(module.description) !==
    normalizeComparableContent(baselineModule.description)
  ) {
    changedFields.push("Mô tả module");
  }
  if ((module.lessons?.length || 0) !== (baselineModule.lessons?.length || 0)) {
    changedFields.push("Số lượng bài học");
  }

  return {
    info: {
      isNew: false,
      changedFields,
    },
    baselineModule,
  };
};

/** Determine which fields changed in a lesson compared to its baseline.
 *  Examines type-specific fields (quiz, assignment) separately. */
export const getLessonChangeInfo = (
  lesson: LessonDraft,
  lessonIndex: number,
  baselineLessons: LessonDraft[],
): ChangeInfo => {
  const baselineLesson = findMatchingLesson(
    baselineLessons,
    lesson,
    lessonIndex,
  );
  if (!baselineLesson) {
    return {
      isNew: true,
      changedFields: ["Bài học mới"],
    };
  }

  const changedFields: string[] = [];
  if (lesson.type !== baselineLesson.type) {
    changedFields.push("Loại bài học");
  }
  if (normalizeKey(lesson.title) !== normalizeKey(baselineLesson.title)) {
    changedFields.push("Tiêu đề");
  }

  if (lesson.type === "reading" || lesson.type === "video") {
    if (
      normalizeComparableContent(lesson.contentText) !==
      normalizeComparableContent(baselineLesson.contentText)
    ) {
      changedFields.push("Nội dung");
    }
    if (
      normalizeKey(lesson.resourceUrl) !==
      normalizeKey(baselineLesson.resourceUrl)
    ) {
      changedFields.push("Tài liệu");
    }
    if (
      normalizeKey(lesson.youtubeUrl) !==
      normalizeKey(baselineLesson.youtubeUrl)
    ) {
      changedFields.push("Video URL");
    }
  }

  if (lesson.type === "quiz") {
    if (
      normalizeComparableContent(lesson.quizDescription) !==
      normalizeComparableContent(baselineLesson.quizDescription)
    ) {
      changedFields.push("Mô tả quiz");
    }
    if ((lesson.passScore ?? null) !== (baselineLesson.passScore ?? null)) {
      changedFields.push("Điểm đạt");
    }
    if (
      (lesson.quizMaxAttempts ?? null) !==
      (baselineLesson.quizMaxAttempts ?? null)
    ) {
      changedFields.push("Số lần làm");
    }
    if (
      (lesson.quizTimeLimitMinutes ?? null) !==
      (baselineLesson.quizTimeLimitMinutes ?? null)
    ) {
      changedFields.push("Thời gian làm");
    }
    if (
      (lesson.questions?.length || 0) !==
      (baselineLesson.questions?.length || 0)
    ) {
      changedFields.push("Số câu hỏi");
    }
  }

  if (lesson.type === "assignment") {
    if (
      normalizeComparableContent(lesson.assignmentDescription) !==
      normalizeComparableContent(baselineLesson.assignmentDescription)
    ) {
      changedFields.push("Mô tả bài tập");
    }
    if (
      (lesson.assignmentSubmissionType || "") !==
      (baselineLesson.assignmentSubmissionType || "")
    ) {
      changedFields.push("Hình thức nộp");
    }
    if (
      (lesson.assignmentMaxScore ?? null) !==
      (baselineLesson.assignmentMaxScore ?? null)
    ) {
      changedFields.push("Điểm tối đa");
    }
    if (
      (lesson.assignmentPassingScore ?? null) !==
      (baselineLesson.assignmentPassingScore ?? null)
    ) {
      changedFields.push("Điểm đạt");
    }
    if (
      (lesson.assignmentCriteria?.length || 0) !==
      (baselineLesson.assignmentCriteria?.length || 0)
    ) {
      changedFields.push("Tiêu chí chấm");
    }
  }

  return {
    isNew: false,
    changedFields,
  };
};

/** Compare current course info fields against a baseline revision DTO
 *  and return a list of field names that differ. */
export const getCourseInfoChangedFields = (
  courseForm: {
    title?: string;
    summary?: string;
    description?: string;
    category?: string;
    level?: string;
    price?: number;
    estimatedDuration?: number;
  },
  learningObjectives: string[],
  requirements: string[],
  baselineRevision: CourseRevisionDTO | null,
): string[] => {
  if (!baselineRevision) return [];

  const changedFields: string[] = [];

  if (normalizeKey(courseForm.title) !== normalizeKey(baselineRevision.title)) {
    changedFields.push("Tên khóa học");
  }
  if (
    normalizeComparableContent(courseForm.summary) !==
    normalizeComparableContent(baselineRevision.shortDescription)
  ) {
    changedFields.push("Mô tả ngắn");
  }
  if (
    normalizeComparableContent(courseForm.description) !==
    normalizeComparableContent(baselineRevision.description)
  ) {
    changedFields.push("Mô tả chi tiết");
  }
  if (
    normalizeKey(courseForm.category) !==
    normalizeKey(baselineRevision.category)
  ) {
    changedFields.push("Danh mục");
  }
  if (normalizeKey(courseForm.level) !== normalizeKey(baselineRevision.level)) {
    changedFields.push("Độ khó");
  }
  if ((courseForm.price ?? null) !== (baselineRevision.price ?? null)) {
    changedFields.push("Giá");
  }
  if (
    (courseForm.estimatedDuration ?? null) !==
    (baselineRevision.estimatedDurationHours ?? null)
  ) {
    changedFields.push("Thời lượng");
  }

  const baselineObjectives = normalizeStringList(
    parseJsonStringArray(baselineRevision.learningObjectivesJson),
  );
  const baselineRequirements = normalizeStringList(
    parseJsonStringArray(baselineRevision.requirementsJson),
  );
  const currentObjectives = normalizeStringList(learningObjectives);
  const currentRequirements = normalizeStringList(requirements);

  if (!arraysEqualIgnoringOrder(currentObjectives, baselineObjectives)) {
    changedFields.push("Mục tiêu khóa học");
  }
  if (!arraysEqualIgnoringOrder(currentRequirements, baselineRequirements)) {
    changedFields.push("Yêu cầu đầu vào");
  }

  return changedFields;
};

// ============================================================================
// DISPLAY FORMATTING
// ============================================================================

/** Map a revision status string to a Vietnamese display label. */
export const formatRevisionStatusLabel = (status?: string | null): string => {
  switch (status) {
    case "DRAFT":
      return "Bản nháp";
    case "PENDING":
      return "Chờ duyệt";
    case "APPROVED":
      return "Đã duyệt";
    case "REJECTED":
      return "Bị từ chối";
    default:
      return status || "N/A";
  }
};

/** Map a revision status string to a semantic tone key for UI styling. */
export const getRevisionStatusTone = (
  status?: string | null,
): "draft" | "pending" | "approved" | "rejected" | "neutral" => {
  switch (status) {
    case "DRAFT":
      return "draft";
    case "PENDING":
      return "pending";
    case "APPROVED":
      return "approved";
    case "REJECTED":
      return "rejected";
    default:
      return "neutral";
  }
};

/** Format a date string as a Vietnamese locale datetime, or "—" if falsy. */
export const formatRevisionDate = (date?: string | null): string =>
  date ? new Date(date).toLocaleString("vi-VN") : "—";

// ============================================================================
// READ-ONLY STYLES INJECTION
// ============================================================================

/** ID of the injected <style> tag for read-only overlay styles. */
export const READ_ONLY_STYLE_ID = "cb-readonly-styles";

/** Inject a single <style> tag that makes all form controls inside
 *  .cb-readonly non-interactive and semi-transparent.
 *  Guards against SSR (typeof document === "undefined") and duplicate
 *  injection (checks for existing style element by ID). */
export const ensureReadOnlyStyles = (): void => {
  if (
    typeof document === "undefined" ||
    document.getElementById(READ_ONLY_STYLE_ID)
  )
    return;
  const style = document.createElement("style");
  style.id = READ_ONLY_STYLE_ID;
  style.textContent = `
    .cb-readonly .cb-input,
    .cb-readonly .cb-textarea,
    .cb-readonly .cb-select,
    .cb-readonly input[type="text"],
    .cb-readonly input[type="number"],
    .cb-readonly input[type="url"],
    .cb-readonly textarea,
    .cb-readonly select {
      pointer-events: none !important;
      opacity: 0.6 !important;
      background: var(--cb-bg-secondary, #1a1a2e) !important;
      cursor: not-allowed !important;
    }
    .cb-readonly .cb-input-group button,
    .cb-readonly .cb-button--ghost,
    .cb-readonly .cb-add-item-btn,
    .cb-readonly .cb-icon-btn {
      pointer-events: none !important;
      opacity: 0.4 !important;
      cursor: not-allowed !important;
    }
  `;
  document.head.appendChild(style);
};
