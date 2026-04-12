import { CourseDetailDTO, CourseLevel, ModuleSummaryDTO } from "../../data/courseDTOs";
import { EnrollmentDetailDTO } from "../../data/enrollmentDTOs";
import {
  DifficultyLevel,
  RoadmapNode,
  RoadmapNodeAvailability,
} from "../../types/Roadmap";

export type LearningChannel =
  | "course_first"
  | "meowl_first"
  | "prerequisite_first";

export type CoverageLevel = "full" | "partial" | "none";

export type NodeCompletionMode =
  | "course_progress"
  | "study_plan_completion";

export type NodeCompletionSource = "primary_course" | "study_plan";

export type NodeLearningContext = {
  node: RoadmapNode;
  parentNode: RoadmapNode | null;
  childNodes: RoadmapNode[];
  primaryCourse: CourseDetailDTO | null;
  supportingCourses: CourseDetailDTO[];
  learningChannel: LearningChannel;
  coverageLevel: CoverageLevel;
  completionMode: NodeCompletionMode;
  completionSource: NodeCompletionSource;
  objectiveSummary: string;
  howToLearnSummary: string;
  completionCriteriaSummary: string;
  coverageSummary: string;
  resourceSummary: string;
  primaryCourseEnrollment: EnrollmentDetailDTO | null;
  primaryCourseProgressPercent: number | null;
  primaryCourseCompleted: boolean;
  hasContentGap: boolean;
  /** Phase 2: Modules suggested for this node, keyed by moduleId string. */
  suggestedModules: Record<string, ModuleSummaryDTO>;
  /** Ordered list of suggested modules matching the order in suggestedModuleIds. */
  suggestedModulesOrdered: ModuleSummaryDTO[];
};

type BuildNodeLearningContextParams = {
  node: RoadmapNode;
  availability: RoadmapNodeAvailability;
  parentNode?: RoadmapNode | null;
  childNodes?: RoadmapNode[];
  mappedCourses?: CourseDetailDTO[];
  enrollmentByCourseId?: Record<string, EnrollmentDetailDTO | null>;
  /** Phase 2: Modules mapped for the current node (from useRoadmapMappedModules). */
  mappedModules?: Record<string, ModuleSummaryDTO>;
};

const roundToNearestFive = (value: number): number =>
  Math.max(5, Math.round(value / 5) * 5);

const roundToNearestHalfHour = (hours: number): number =>
  Math.max(0.5, Math.round(hours * 2) / 2);

const formatHourValue = (hours: number): string => {
  const rounded = roundToNearestHalfHour(hours);
  return Number.isInteger(rounded) ? `${rounded}` : `${rounded.toFixed(1)}`;
};

const formatMinuteEstimate = (minutes: number): string => {
  const safeMinutes = Math.max(minutes, 10);
  const lower = roundToNearestFive(safeMinutes * 0.85);
  const upper = Math.max(lower + 10, roundToNearestFive(safeMinutes * 1.2));

  if (lower >= 60) {
    return `Khoảng ${formatHourValue(lower / 60)}-${formatHourValue(upper / 60)} giờ`;
  }

  if (upper >= 60) {
    return `Khoảng ${lower}-${upper} phút`;
  }

  return `Khoảng ${lower}-${upper} phút`;
};

const formatHourEstimate = (hours: number): string => {
  const safeHours = Math.max(hours, 0.5);
  const lower = Math.max(0.5, roundToNearestHalfHour(safeHours * 0.8));
  const upper = Math.max(lower + 0.5, roundToNearestHalfHour(safeHours * 1.15));
  return `Khoảng ${formatHourValue(lower)}-${formatHourValue(upper)} giờ`;
};

export const resolveRoadmapNodeTimeEstimate = (
  node: RoadmapNode,
  primaryCourse?: CourseDetailDTO | null,
): string => {
  if (node.estimatedTimeMinutes && node.estimatedTimeMinutes > 0) {
    return formatMinuteEstimate(node.estimatedTimeMinutes);
  }

  if (primaryCourse?.estimatedDurationHours && primaryCourse.estimatedDurationHours > 0) {
    return formatHourEstimate(primaryCourse.estimatedDurationHours);
  }

  const learningObjectivesCount = node.learningObjectives?.filter(Boolean).length ?? 0;
  const keyConceptsCount = node.keyConcepts?.filter(Boolean).length ?? 0;
  const practicalExercisesCount = node.practicalExercises?.filter(Boolean).length ?? 0;
  const successCriteriaCount = node.successCriteria?.filter(Boolean).length ?? 0;
  const weightedMinutes =
    learningObjectivesCount * 12 +
    keyConceptsCount * 8 +
    practicalExercisesCount * 20 +
    successCriteriaCount * 6;

  if (weightedMinutes >= 15) {
    return formatMinuteEstimate(weightedMinutes);
  }

  return "Ước tính sau khi tạo lộ trình học";
};

const normalizeText = (value?: string | null): string =>
  (value ?? "")
    .replace(/[*`#>_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const normalizeDifficulty = (
  difficulty?: string | null,
): DifficultyLevel | null => {
  const value = (difficulty ?? "").trim().toLowerCase();
  if (!value) {
    return null;
  }
  if (
    value.includes("beginner") ||
    value.includes("easy") ||
    value.includes("foundation") ||
    value.includes("basic") ||
    value === DifficultyLevel.BEGINNER
  ) {
    return DifficultyLevel.BEGINNER;
  }
  if (
    value.includes("advanced") ||
    value.includes("hard") ||
    value.includes("expert") ||
    value === DifficultyLevel.ADVANCED
  ) {
    return DifficultyLevel.ADVANCED;
  }
  if (
    value.includes("intermediate") ||
    value.includes("medium") ||
    value === DifficultyLevel.INTERMEDIATE
  ) {
    return DifficultyLevel.INTERMEDIATE;
  }
  return null;
};

const difficultyToCourseRank = (
  difficulty?: string | null,
): number | null => {
  const normalized = normalizeDifficulty(difficulty);
  if (normalized === DifficultyLevel.BEGINNER) {
    return 0;
  }
  if (normalized === DifficultyLevel.INTERMEDIATE) {
    return 1;
  }
  if (normalized === DifficultyLevel.ADVANCED) {
    return 2;
  }
  return null;
};

const courseLevelRank = (level?: CourseLevel | string | null): number | null => {
  switch (level) {
    case CourseLevel.BEGINNER:
      return 0;
    case CourseLevel.INTERMEDIATE:
      return 1;
    case CourseLevel.ADVANCED:
      return 2;
    default:
      return null;
  }
};

const hasLearningContent = (node: RoadmapNode): boolean =>
  (node.learningObjectives?.length ?? 0) > 0 ||
  (node.keyConcepts?.length ?? 0) > 0 ||
  (node.practicalExercises?.length ?? 0) > 0 ||
  normalizeText(node.description).length > 0;

const resolvePrimaryAndSupportingCourses = (
  node: RoadmapNode,
  courses: CourseDetailDTO[],
): {
  primaryCourse: CourseDetailDTO | null;
  supportingCourses: CourseDetailDTO[];
} => {
  if (courses.length === 0) {
    return {
      primaryCourse: null,
      supportingCourses: [],
    };
  }

  const targetRank = difficultyToCourseRank(node.difficulty);
  if (targetRank === null) {
    return {
      primaryCourse: courses[0] ?? null,
      supportingCourses: courses.slice(1),
    };
  }

  const rankedCourses = courses
    .map((course, index) => ({
      course,
      index,
      distance:
        courseLevelRank(course.level) === null
          ? Number.MAX_SAFE_INTEGER
          : Math.abs((courseLevelRank(course.level) ?? 0) - targetRank),
    }))
    .sort((left, right) => {
      if (left.distance !== right.distance) {
        return left.distance - right.distance;
      }
      return left.index - right.index;
    });

  const primaryCourse = rankedCourses[0]?.course ?? null;
  const supportingCourses = rankedCourses
    .slice(1)
    .map((item) => item.course);

  return {
    primaryCourse,
    supportingCourses,
  };
};

const buildObjectiveSummary = (node: RoadmapNode): string => {
  const objective = normalizeText(node.learningObjectives?.[0]);
  if (objective) {
    return objective;
  }

  const concept = normalizeText(node.keyConcepts?.[0]);
  if (concept) {
    return `Nắm vững ${concept}.`;
  }

  const description = normalizeText(node.description);
  if (description) {
    return description.length > 140
      ? `${description.slice(0, 140).trim()}...`
      : description;
  }

  return `Hoàn thành ${node.title} theo đúng nhịp của roadmap.`;
};

const buildCoverageSummary = (
  coverageLevel: CoverageLevel,
  primaryCourse: CourseDetailDTO | null,
): string => {
  if (coverageLevel === "full" && primaryCourse) {
    return `Đã có khóa học chính phù hợp cho node này.`;
  }
  if (coverageLevel === "partial") {
    return "Chưa có khóa học chính, nhưng node vẫn đủ nội dung để học với Meowl và thực hành.";
  }
  return "Node này còn thiếu học liệu hệ thống, nên cần fallback bằng Meowl và kế hoạch học cá nhân.";
};

export const buildNodeLearningContext = ({
  node,
  availability,
  parentNode = null,
  childNodes = [],
  mappedCourses = [],
  enrollmentByCourseId = {},
  mappedModules = {},
}: BuildNodeLearningContextParams): NodeLearningContext => {
  const { primaryCourse, supportingCourses } = resolvePrimaryAndSupportingCourses(
    node,
    mappedCourses,
  );

  const primaryCourseEnrollment = primaryCourse
    ? enrollmentByCourseId[String(primaryCourse.id)] ?? null
    : null;
  const primaryCourseProgressPercent =
    primaryCourseEnrollment?.progressPercent ?? null;
  const primaryCourseCompleted = Boolean(primaryCourseEnrollment?.completed);
  const contentAvailable = hasLearningContent(node);

  let learningChannel: LearningChannel;
  if (primaryCourse) {
    learningChannel = "course_first";
  } else if (availability === RoadmapNodeAvailability.LOCKED) {
    learningChannel = "prerequisite_first";
  } else {
    learningChannel = "meowl_first";
  }

  const coverageLevel: CoverageLevel = primaryCourse
    ? "full"
    : contentAvailable
      ? "partial"
      : "none";

  const completionMode: NodeCompletionMode = primaryCourse
    ? "course_progress"
    : "study_plan_completion";
  const completionSource: NodeCompletionSource = primaryCourse
    ? "primary_course"
    : "study_plan";

  const objectiveSummary = buildObjectiveSummary(node);
  const coverageSummary = buildCoverageSummary(coverageLevel, primaryCourse);

  let howToLearnSummary = "Học với Meowl theo mục tiêu của node này rồi cập nhật kế hoạch học để giữ nhịp tiến độ.";
  if (learningChannel === "course_first" && primaryCourse) {
    howToLearnSummary = `Học khóa học chính trước, dùng Meowl để hỏi nhanh khi cần và bám sát mục tiêu của node.`;
  } else if (learningChannel === "prerequisite_first") {
    howToLearnSummary = "Hoàn thành node cha hoặc prerequisite trước khi tạo kế hoạch học cho node này.";
  }

  const completionCriteriaSummary = primaryCourse
    ? primaryCourseEnrollment
      ? `Hoàn tất khóa học chính${primaryCourseProgressPercent !== null ? ` (${primaryCourseProgressPercent}% hiện tại)` : ""}.`
      : "Hoàn tất khóa học chính được gắn cho node này."
    : "Hoàn tất kế hoạch học được tạo cho node này.";

  const resourceSummary = primaryCourse
    ? supportingCourses.length > 0
      ? "Khóa học chính + khóa học bổ trợ"
      : "Khóa học chính"
    : coverageLevel === "none"
      ? "Meowl fallback"
      : "Meowl + nội dung node";

  // Phase 2: Build ordered suggested modules list preserving suggestedModuleIds order
  const suggestedModulesOrdered =
    (node.suggestedModuleIds ?? [])
      .map((id) => mappedModules[String(id)])
      .filter((m): m is ModuleSummaryDTO => Boolean(m));

  return {
    node,
    parentNode,
    childNodes,
    primaryCourse,
    supportingCourses,
    learningChannel,
    coverageLevel,
    completionMode,
    completionSource,
    objectiveSummary,
    howToLearnSummary,
    completionCriteriaSummary,
    coverageSummary,
    resourceSummary,
    primaryCourseEnrollment,
    primaryCourseProgressPercent,
    primaryCourseCompleted,
    hasContentGap: coverageLevel === "none",
    suggestedModules: mappedModules,
    suggestedModulesOrdered,
  };
};
