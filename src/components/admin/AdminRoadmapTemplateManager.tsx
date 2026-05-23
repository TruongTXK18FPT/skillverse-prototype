import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Archive,
  ArrowLeft,
  BookOpen,
  Calculator,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  Edit3,
  Eye,
  Loader2,
  Plus,
  RefreshCw,
  Rocket,
  Save,
  Search,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import { useAppToast } from "../../context/ToastContext";
import { careerTaxonomyService } from "../../services/careerTaxonomyService";
import { listCourses } from "../../services/courseService";
import roadmapTemplateService from "../../services/roadmapTemplateService";
import type { CourseSummaryDTO } from "../../data/courseDTOs";
import { CourseStatus } from "../../data/courseDTOs";
import type {
  Domain,
  JobPosition,
  JobPositionTrack,
  JobPositionTrackSkill,
} from "../../types/careerTaxonomy";
import type { RoadmapNodeSkillRequirement } from "../../types/Roadmap";
import { SkillLevel } from "../../types/Journey";
import type {
  RoadmapTemplateActivityRequest,
  RoadmapTemplateAllocationPreviewResponse,
  RoadmapTemplateCourseCandidateResponse,
  RoadmapTemplateCourseLinkPolicy,
  RoadmapTemplateNodeGroupRequest,
  RoadmapTemplateNodeGroupResponse,
  RoadmapTemplateNodeGroupSkillRequest,
  RoadmapTemplateRequest,
  RoadmapTemplateResponse,
  RoadmapTemplateSkillBlockRequest,
  RoadmapTemplateStatus,
  RoadmapTemplateValidationResponse,
} from "../../types/roadmapTemplate";
import { ROADMAP_EVIDENCE_AI_REVIEW_DEFAULTS, DEFAULT_AI_EVIDENCE_PROMPT } from "../../types/roadmapEvidenceReviewDefaults";
import { RubricListEditor } from "./RubricListEditor";
import "./AdminRoadmapTemplateManager.css";


type ViewMode = "library" | "builder";
type BuilderTab = "overview" | "allocation" | "grouping" | "activities" | "courses" | "preview";

type SkillBlockDraft = RoadmapTemplateSkillBlockRequest & {
  localId: string;
  selectedCourseIds: number[];
};

type NodeGroupDraft = RoadmapTemplateNodeGroupRequest & {
  localId: string;
};

type ModuleLessonDraft = {
  title: string;
  description: string;
  learningObjective: string;
  estimatedMinutes: number | null;
};

type ModuleExerciseDraft = {
  title: string;
  instruction: string;
  expectedOutput: string;
  rubric: string;
  required: boolean;
};

type CourseOption = {
  courseId: number;
  title?: string;
  level?: string;
  category?: string;
  enrollmentCount?: number;
  thumbnailUrl?: string;
};

type TemplateForm = {
  editingId?: number;
  title: string;
  description: string;
  domainId: string;
  jobPositionId: string;
  jobPositionTrackId: string;
  totalNodeCount: number;
  globalLearningGoal: string;
  outputStandard: string;
  assessmentPolicy: string;
  templateInstructions: string;
  constraintsJson: string;
  outputLanguage: string;
  exerciseRequirement: string;
  topicGenerationType: string;
  timeBudgetPolicy: string;
  aiEvidenceReviewEnabled: boolean;
  aiAutoPassEnabled: boolean;
  aiAutoPassMinScorePercent: number;
  aiAutoPassMinConfidence: number;
  aiManualReviewBelowConfidence: number;
  aiEvidencePrompt: string;
  finalAssignmentInstructions: string;
  finalAssignmentRubric: string;
  skillBlocks: SkillBlockDraft[];
  nodeGroups: NodeGroupDraft[];
};

const statusLabel: Record<RoadmapTemplateStatus, string> = {
  DRAFT: "Bản nháp",
  PUBLISHED: "Đã xuất bản",
  ARCHIVED: "Đã lưu trữ",
  SUBMITTED: "Đã gửi",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
};

const moduleBuilderTabs: Array<{ key: BuilderTab; label: string }> = [
  { key: "overview", label: "Thông tin" },
  { key: "allocation", label: "Ưu tiên kỹ năng" },
  { key: "grouping", label: "Gom kỹ năng vào module" },
  { key: "activities", label: "Nội dung module" },
  { key: "courses", label: "Khóa học & tài liệu" },
  { key: "preview", label: "Kiểm tra độ phủ" },
];

const exerciseRequirementOptions = [
  { value: "REQUIRED_EVERY_NODE", label: "Bắt buộc mỗi nút có bài tập và minh chứng" },
  { value: "REQUIRED_MAIN_NODE", label: "Bắt buộc ở nút chính, tùy chọn ở nút phụ" },
];

const topicGenerationTypeOptions = [
  { value: "LEVEL_BAND_AND_ASSESSMENT_GAP", label: "Theo cấp độ người học và khoảng thiếu kỹ năng" },
  { value: "GOAL_DRIVEN_JOB_READY", label: "Theo mục tiêu nghề nghiệp và sản phẩm nộp được" },
  { value: "FOUNDATION_FIRST", label: "Từ nền tảng đến thực hành" },
  { value: "REVIEW_AND_INTERVIEW", label: "Ôn tập, củng cố và phỏng vấn" },
  { value: "NEXT_LEVEL_COMPLEXITY", label: "Tăng dần độ khó để lên cấp độ tiếp theo" },
];

const timeBudgetPolicyOptions = [
  { value: "DIFFICULTY_AND_COMPLEXITY", label: "Tự tính theo độ khó và độ phức tạp của từng nút" },
  { value: "COMPACT_PRACTICE", label: "Ưu tiên ngắn gọn, nhiều bài thực hành nhỏ" },
  { value: "DEEP_PROJECT", label: "Ưu tiên project sâu, chấp nhận thời lượng dài hơn" },
];

const goalConstraintProfiles = [
  {
    value: "EXPLORE",
    label: "Khám phá trình độ hiện tại",
    nodeStyle: "chẩn đoán năng lực, nhận diện điểm mạnh/yếu, gợi ý hướng học tiếp",
    avoidByLevel: "Tránh project quá lớn khi người học chưa có nền tảng; ưu tiên bài kiểm tra và bài tập nhỏ.",
  },
  {
    value: "INTERNSHIP",
    label: "Chuẩn bị internship / fresher",
    nodeStyle: "job-ready, có sản phẩm nộp được, có minh chứng đưa vào hồ sơ",
    avoidByLevel: "Tránh kiến trúc quá nâng cao nếu người học ở mức nhập môn/cơ bản; ưu tiên nền tảng, quy trình làm việc và sản phẩm nhỏ.",
  },
  {
    value: "CAREER_CHANGE",
    label: "Chuyển ngành",
    nodeStyle: "cầu nối từ kinh nghiệm cũ sang kỹ năng mới, có bài tập chuyển đổi năng lực",
    avoidByLevel: "Tránh giả định người học đã biết thuật ngữ ngành mới; cần giải thích nền tảng trước khi vào công cụ chuyên sâu.",
  },
  {
    value: "FROM_SCRATCH",
    label: "Xây lộ trình học từ đầu",
    nodeStyle: "nền tảng trước, thực hành từng bước, tăng độ khó có kiểm soát",
    avoidByLevel: "Tránh nhảy thẳng vào framework, triển khai hoặc kiến trúc phức tạp khi chưa học khái niệm lõi.",
  },
  {
    value: "LEVEL_UP",
    label: "Tăng tốc lên cấp độ tiếp theo",
    nodeStyle: "bài toán thực tế khó hơn, tối ưu, thiết kế hệ thống và chất lượng sản phẩm",
    avoidByLevel: "Tránh lặp lại kiến thức quá cơ bản nếu assessment đã chứng minh người học nắm vững.",
  },
  {
    value: "REVIEW",
    label: "Ôn lại kiến thức",
    nodeStyle: "tóm tắt trọng tâm, luyện lỗi thường gặp, kiểm tra nhanh và phỏng vấn",
    avoidByLevel: "Tránh mở rộng scope sang chủ đề mới; ưu tiên củng cố, soát lỗ hổng và luyện phản xạ.",
  },
];

const emptyForm = (): TemplateForm => ({
  title: "",
  description: "",
  domainId: "",
  jobPositionId: "",
  jobPositionTrackId: "",
  totalNodeCount: 12,
  globalLearningGoal: "",
  outputStandard: "",
  assessmentPolicy:
    "Cá nhân hóa nút học theo cấp độ đánh giá, khoảng thiếu kỹ năng và điểm mạnh từ bài kiểm tra. Ưu tiên bài học có dải cấp độ phù hợp người học.",
  templateInstructions: "",
  constraintsJson: "",
  outputLanguage: "vi",
  exerciseRequirement: "REQUIRED_EVERY_NODE",
  topicGenerationType: "LEVEL_BAND_AND_ASSESSMENT_GAP",
  timeBudgetPolicy: "DIFFICULTY_AND_COMPLEXITY",
  aiEvidenceReviewEnabled: true,
  aiAutoPassEnabled: false,
  aiAutoPassMinScorePercent: ROADMAP_EVIDENCE_AI_REVIEW_DEFAULTS.AI_AUTO_PASS_MIN_SCORE_PERCENT,
  aiAutoPassMinConfidence: ROADMAP_EVIDENCE_AI_REVIEW_DEFAULTS.AI_AUTO_PASS_MIN_CONFIDENCE,
  aiManualReviewBelowConfidence: ROADMAP_EVIDENCE_AI_REVIEW_DEFAULTS.AI_MANUAL_REVIEW_BELOW_CONFIDENCE,
  aiEvidencePrompt: DEFAULT_AI_EVIDENCE_PROMPT,
  finalAssignmentInstructions: "",
  finalAssignmentRubric: "",
  skillBlocks: [],
  nodeGroups: [],
});

const getApiErrorMessage = (error: unknown, fallback: string) =>
  (error as { response?: { data?: { message?: string } } })?.response?.data
    ?.message || fallback;

const localizeTemplateMessage = (message: string) => {
  const normalized = message.toLowerCase();
  if (normalized.includes("sum of nodecountoverride")) {
    return "Tổng số nút ghi đè không được vượt quá tổng số nút học của mẫu.";
  }
  if (normalized.includes("every activity must define expectedoutput and rubric")) {
    return "Mỗi bài học phải có đầu ra mong đợi và tiêu chí đánh giá.";
  }
  if (normalized.includes("every activity must define minlevel")) {
    return "Mỗi bài học phải có cấp độ tối thiểu.";
  }
  if (normalized.includes("minlevel cannot be greater than maxlevel")) {
    return "Cấp độ tối thiểu không được lớn hơn cấp độ tối đa.";
  }
  if (normalized.includes("total node count")) {
    return "Tổng số nút học của mẫu chưa hợp lệ.";
  }
  if (normalized.includes("weight")) {
    return "Trọng số kỹ năng chưa hợp lệ.";
  }
  if (normalized.includes("skill") && normalized.includes("track")) {
    return "Kỹ năng phải thuộc nhánh lộ trình đã chọn.";
  }
  return message;
};

const readConstraintValue = (constraintsJson: string | undefined, key: string, fallback: string) => {
  if (!constraintsJson?.trim()) return fallback;
  try {
    const parsed = JSON.parse(constraintsJson) as Record<string, unknown>;
    const value = parsed[key];
    return typeof value === "string" && value.trim() ? value : fallback;
  } catch {
    return fallback;
  }
};

const buildStructuredConstraints = (form: TemplateForm) => ({
  language: form.outputLanguage,
  exerciseRequirement: form.exerciseRequirement,
  topicGenerationType: form.topicGenerationType,
  timeBudgetPolicy: form.timeBudgetPolicy,
  timeBudgetRule:
    "Không dùng số giờ cố định cấp template. Mỗi node tự tính estimatedHours theo độ khó, độ phức tạp, loại bài tập và độ sâu chủ đề.",
  requiredExerciseRule:
    "Mỗi node phải có bài tập, đầu ra mong đợi, minh chứng cần nộp và tiêu chí đánh giá.",
  goalProfiles: goalConstraintProfiles.map((profile) => ({
    goal: profile.value,
    label: profile.label,
    nodeStyle: profile.nodeStyle,
    avoidByLevel: profile.avoidByLevel,
  })),
});

const toNumberOrNull = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const computeLocalAllocation = (
  blocks: SkillBlockDraft[],
  totalNodeCount: number,
) => {
  const total = Math.max(0, Number(totalNodeCount) || 0);
  const fixed = blocks.reduce(
    (sum, block) =>
      sum + (block.nodeCountOverride ? Number(block.nodeCountOverride) : 0),
    0,
  );
  const flexible = blocks.filter((block) => !block.nodeCountOverride);
  const totalWeight = flexible.reduce(
    (sum, block) => sum + Math.max(0, Number(block.weightPercent) || 0),
    0,
  );
  const remaining = Math.max(0, total - fixed);
  const shares = flexible.map((block) => {
    const raw =
      totalWeight > 0
        ? (remaining * Math.max(0, Number(block.weightPercent) || 0)) /
          totalWeight
        : 0;
    return { block, raw, base: Math.floor(raw), fraction: raw - Math.floor(raw) };
  });
  let assigned = shares.reduce((sum, item) => sum + item.base, fixed);
  const result = new Map<string, number>();
  blocks.forEach((block) =>
    result.set(
      block.localId,
      block.nodeCountOverride ? Number(block.nodeCountOverride) : 0,
    ),
  );
  shares.forEach((item) => result.set(item.block.localId, item.base));
  shares
    .sort((a, b) => b.fraction - a.fraction)
    .forEach((item) => {
      if (assigned < total) {
        result.set(item.block.localId, (result.get(item.block.localId) || 0) + 1);
        assigned += 1;
      }
    });
  return result;
};

const toCandidateCourseOption = (
  course: RoadmapTemplateCourseCandidateResponse,
): CourseOption => ({
  courseId: course.courseId,
  title: course.title,
  level: course.level,
  category: course.category,
  enrollmentCount: course.enrollmentCount,
  thumbnailUrl: course.thumbnailUrl,
});

const toSummaryCourseOption = (course: CourseSummaryDTO): CourseOption => ({
  courseId: course.id,
  title: course.title,
  level: course.level,
  category: course.category,
  enrollmentCount: course.enrollmentCount,
  thumbnailUrl: course.thumbnailUrl || course.thumbnail?.url,
});

const defaultActivity = (
  skillName: string,
  orderIndex = 1,
  skill?: JobPositionTrackSkill,
): RoadmapTemplateActivityRequest => ({
  title: `Lesson ${orderIndex}: Thực hành trọng tâm ${skillName}`,
  description: `Luyện tập quy trình chính và tạo minh chứng có thể đánh giá cho ${skillName}.`,
  exerciseType: "Dự án thực hành",
  expectedOutput: `Sản phẩm nhỏ chứng minh năng lực thực hành ${skillName}.`,
  rubric: `Sản phẩm hoàn chỉnh, giải thích rõ quyết định kỹ thuật và liên kết được với yêu cầu ${skillName}.`,
  difficulty: "trung bình",
  minLevel: SkillLevel.BEGINNER,
  maxLevel: SkillLevel.INTERMEDIATE,
  estimatedHours: 4,
  prerequisiteHint: "",
  aiPromptHint: "",
  skillRequirements: skill
    ? [{
        skillId: skill.skillId,
        skillName: skill.skillName,
        canonicalKey: skill.canonicalKey,
        requirementType: skill.requirementType === "REQUIRED" || skill.requirementType === "IMPORTANT"
          ? skill.requirementType
          : "NICE_TO_HAVE",
      }]
    : [],
  skillRequirementsJson: skill
    ? JSON.stringify([{
        skillId: skill.skillId,
        skillName: skill.skillName,
        canonicalKey: skill.canonicalKey,
        requirementType: skill.requirementType === "REQUIRED" || skill.requirementType === "IMPORTANT"
          ? skill.requirementType
          : "NICE_TO_HAVE",
      }])
    : "[]",
  orderIndex,
});

const parseActivitySkillRequirements = (
  activity: RoadmapTemplateActivityRequest,
): RoadmapNodeSkillRequirement[] => {
  if (Array.isArray(activity.skillRequirements)) {
    return activity.skillRequirements;
  }
  if (!activity.skillRequirementsJson) {
    return [];
  }
  try {
    const parsed = JSON.parse(activity.skillRequirementsJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const readJsonArray = <T,>(value: string | undefined, fallback: T[]): T[] => {
  if (!value?.trim()) return fallback;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed as T[] : fallback;
  } catch {
    return fallback;
  }
};

const serializeModuleLessons = (lessons: ModuleLessonDraft[]) =>
  JSON.stringify(
    lessons
      .map((lesson) => ({
        title: lesson.title.trim(),
        description: lesson.description.trim(),
        learningObjective: lesson.learningObjective.trim(),
        estimatedMinutes: lesson.estimatedMinutes ?? null,
      }))
      .filter((lesson) => lesson.title || lesson.description || lesson.learningObjective),
  );

const serializeModuleExercises = (exercises: ModuleExerciseDraft[]) =>
  JSON.stringify(
    exercises
      .map((exercise) => ({
        title: exercise.title.trim(),
        instruction: exercise.instruction.trim(),
        expectedOutput: exercise.expectedOutput.trim(),
        rubric: exercise.rubric.trim(),
        required: exercise.required,
      }))
      .filter((exercise) =>
        exercise.title || exercise.instruction || exercise.expectedOutput || exercise.rubric,
      ),
  );

const getModuleLessons = (group: NodeGroupDraft): ModuleLessonDraft[] =>
  readJsonArray<Partial<ModuleLessonDraft>>(group.lessonsJson, []).map((lesson, index) => ({
    title: lesson.title || `Bài học ${index + 1}`,
    description: lesson.description || "",
    learningObjective: lesson.learningObjective || "",
    estimatedMinutes: typeof lesson.estimatedMinutes === "number" ? lesson.estimatedMinutes : null,
  }));

const getModuleExercises = (group: NodeGroupDraft): ModuleExerciseDraft[] =>
  readJsonArray<Partial<ModuleExerciseDraft>>(group.exercisesJson, []).map((exercise, index) => ({
    title: exercise.title || `Bài tập ${index + 1}`,
    instruction: exercise.instruction || "",
    expectedOutput: exercise.expectedOutput || "",
    rubric: exercise.rubric || "",
    required: exercise.required !== false,
  }));

const defaultModuleLesson = (orderIndex: number, moduleTitle = "module"): ModuleLessonDraft => ({
  title: `Bài học ${orderIndex}`,
  description: `Nội dung hướng dẫn chính của ${moduleTitle}.`,
  learningObjective: "Người học hiểu và áp dụng được các kỹ năng trong module.",
  estimatedMinutes: 60,
});

const defaultModuleExercise = (orderIndex: number, moduleTitle = "module"): ModuleExerciseDraft => ({
  title: `Bài tập ${orderIndex}`,
  instruction: `Thực hành tích hợp các kỹ năng trong ${moduleTitle}.`,
  expectedOutput: "Sản phẩm hoặc minh chứng học tập có thể đánh giá.",
  rubric: "Hoàn thành đúng yêu cầu, giải thích được cách làm và liên kết được với kỹ năng trong module.",
  required: true,
});

const makeNodeGroupSkill = (
  skill: JobPositionTrackSkill | RoadmapTemplateNodeGroupResponse["skills"][number],
  orderIndex = 1,
): RoadmapTemplateNodeGroupSkillRequest => ({
  id: "id" in skill ? skill.id : undefined,
  skillId: skill.skillId,
  skillNameSnapshot: "skillName" in skill
    ? skill.skillName
    : skill.skillNameSnapshot || skill.skillName,
  skillCanonicalKeySnapshot: "canonicalKey" in skill
    ? skill.canonicalKey
    : skill.skillCanonicalKeySnapshot || skill.canonicalKey,
  requirementType: skill.requirementType === "REQUIRED" || skill.requirementType === "IMPORTANT"
    ? skill.requirementType
    : "NICE_TO_HAVE",
  weightInNode: "weightInNode" in skill ? skill.weightInNode ?? null : null,
  orderIndex,
});

const makeNodeGroupFromResponse = (
  group: RoadmapTemplateNodeGroupResponse,
  orderIndex: number,
): NodeGroupDraft => ({
  localId: `node-group-${group.id || orderIndex}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  id: group.id,
  nodeKey: group.nodeKey || `module-${orderIndex}`,
  title: group.title || `Module ${orderIndex}`,
  description: group.description || "",
  learningObjectives: group.learningObjectives || "",
  lessonsJson: group.lessonsJson || serializeModuleLessons([defaultModuleLesson(1, group.title || `Module ${orderIndex}`)]),
  exercisesJson: group.exercisesJson || serializeModuleExercises([defaultModuleExercise(1, group.title || `Module ${orderIndex}`)]),
  completionCriteria: group.completionCriteria || group.rubric || "",
  expectedOutput: group.expectedOutput || "",
  rubric: group.rubric || "",
  difficulty: group.difficulty || "medium",
  estimatedHours: group.estimatedHours ?? 4,
  aiPromptHint: group.aiPromptHint || "",
  orderIndex: group.orderIndex ?? orderIndex,
  skills: (group.skills || []).map((skill, index) => makeNodeGroupSkill(skill, index + 1)),
});

const defaultNodeGroup = (orderIndex: number): NodeGroupDraft => ({
  localId: `node-group-new-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  nodeKey: `module-${orderIndex}`,
  title: `Module ${orderIndex}`,
  description: "",
  learningObjectives: "",
  lessonsJson: serializeModuleLessons([defaultModuleLesson(1, `Module ${orderIndex}`)]),
  exercisesJson: serializeModuleExercises([defaultModuleExercise(1, `Module ${orderIndex}`)]),
  completionCriteria: "",
  expectedOutput: "",
  rubric: "",
  difficulty: "medium",
  estimatedHours: 4,
  aiPromptHint: "",
  orderIndex,
  skills: [],
});

const buildSkillBlockFromTrackSkill = (
  skill: JobPositionTrackSkill,
  weight: number,
): SkillBlockDraft => ({
  localId: `${skill.skillId}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  skillId: skill.skillId,
  skillNameSnapshot: skill.skillName,
  skillCanonicalKeySnapshot: skill.canonicalKey,
  weightPercent: weight,
  minNodes: 1,
  maxNodes: null,
  nodeCountOverride: null,
  learningGoals: `Hiểu và áp dụng ${skill.skillName} trong tình huống sẵn sàng cho công việc.`,
  requiredTopics: "",
  activityInstructions: "",
  exerciseTypes: "Dự án thực hành; Trắc nghiệm; Bài code lab",
  successCriteria: `Người học giải thích được quyết định và nộp minh chứng cho ${skill.skillName}.`,
  ragQueryHint: skill.skillName,
  courseLinkPolicy: "AUTO_HYBRID",
  autoCourseLimit: 2,
  ragEnabled: true,
  activities: [defaultActivity(skill.skillName, 1, skill)],
  selectedCourseIds: [],
});

const skillRequirementMultiplier = (requirementType?: JobPositionTrackSkill["requirementType"]) => {
  if (requirementType === "IMPORTANT") return 2;
  if (requirementType === "NICE_TO_HAVE") return 1;
  return 3;
};

const normalizeTrackSkillWeight = (weight?: number | null) => {
  const value = Number(weight);
  return Number.isFinite(value) && value > 0 ? value : 1;
};

const calculateTrackSkillWeightPercents = (skills: JobPositionTrackSkill[]) => {
  const items = skills.map((skill) => ({
    skill,
    effectiveWeight: normalizeTrackSkillWeight(skill.weight) * skillRequirementMultiplier(skill.requirementType),
  }));
  const totalEffectiveWeight = items.reduce((sum, item) => sum + item.effectiveWeight, 0);
  if (totalEffectiveWeight <= 0) return new Map<number, number>();

  const result = new Map<number, number>();
  let roundedTotal = 0;
  items.forEach((item) => {
    const percent = Math.round((item.effectiveWeight / totalEffectiveWeight) * 10000) / 100;
    result.set(item.skill.skillId, percent);
    roundedTotal += percent;
  });

  const delta = Math.round((100 - roundedTotal) * 100) / 100;
  if (Math.abs(delta) >= 0.01) {
    const target = [...items].sort((a, b) => {
      if (b.effectiveWeight !== a.effectiveWeight) return b.effectiveWeight - a.effectiveWeight;
      return a.skill.sortOrder - b.skill.sortOrder;
    })[0];
    if (target) {
      const current = result.get(target.skill.skillId) || 0;
      result.set(target.skill.skillId, Math.round((current + delta) * 100) / 100);
    }
  }

  return result;
};

const applyTrackSkillPriorityToBlocks = (
  currentBlocks: SkillBlockDraft[],
  trackSkills: JobPositionTrackSkill[],
) => {
  const percentBySkill = calculateTrackSkillWeightPercents(trackSkills);
  const existingBySkill = new Map(currentBlocks.map((block) => [block.skillId, block]));
  return trackSkills.map((skill) => {
    const existing = existingBySkill.get(skill.skillId);
    const weightPercent = percentBySkill.get(skill.skillId) ?? 0;
    if (existing) {
      return {
        ...existing,
        skillNameSnapshot: existing.skillNameSnapshot || skill.skillName,
        skillCanonicalKeySnapshot: existing.skillCanonicalKeySnapshot || skill.canonicalKey,
        weightPercent,
        minNodes: existing.minNodes ?? (skill.requirementType === "REQUIRED" ? 1 : 0),
      };
    }
    return {
      ...buildSkillBlockFromTrackSkill(skill, weightPercent),
      minNodes: skill.requirementType === "REQUIRED" ? 1 : 0,
    };
  });
};

const normalizeBlock = (
  block: RoadmapTemplateSkillBlockRequest,
  courses: RoadmapTemplateResponse["courses"] = [],
): SkillBlockDraft => ({
  ...block,
  localId: `block-${block.id || block.skillId}-${Math.random().toString(16).slice(2)}`,
  minNodes: block.minNodes ?? null,
  maxNodes: block.maxNodes ?? null,
  nodeCountOverride: block.nodeCountOverride ?? null,
  autoCourseLimit: block.autoCourseLimit ?? 2,
  courseLinkPolicy: block.courseLinkPolicy || "AUTO_HYBRID",
  ragEnabled: block.ragEnabled ?? true,
  activities: (block.activities || []).map((activity, index) => ({
    ...activity,
    skillRequirements: parseActivitySkillRequirements(activity),
    skillRequirementsJson: JSON.stringify(parseActivitySkillRequirements(activity)),
    minLevel: activity.minLevel ?? SkillLevel.BEGINNER,
    maxLevel: activity.maxLevel ?? null,
    orderIndex: activity.orderIndex || index + 1,
  })),
  selectedCourseIds: courses
    .filter((course) => course.skillId === block.skillId)
    .map((course) => course.courseId)
    .filter((courseId): courseId is number => Number.isFinite(courseId)),
});

const AdminRoadmapTemplateManager = () => {
  const { showSuccess, showError } = useAppToast();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>("library");
  const [activeTab, setActiveTab] = useState<BuilderTab>("overview");
  const [templates, setTemplates] = useState<RoadmapTemplateResponse[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [jobPositions, setJobPositions] = useState<JobPosition[]>([]);
  const [tracks, setTracks] = useState<JobPositionTrack[]>([]);
  const [trackSkills, setTrackSkills] = useState<JobPositionTrackSkill[]>([]);
  const [form, setForm] = useState<TemplateForm>(emptyForm);
  const [activeSkillBlockId, setActiveSkillBlockId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<RoadmapTemplateStatus | "">("");
  const [domainFilter, setDomainFilter] = useState("");
  const [jobPositionFilter, setJobPositionFilter] = useState("");
  const [trackFilter, setTrackFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState<number | null>(null);
  const [calculatingSkillPriority, setCalculatingSkillPriority] = useState(false);
  const [validation, setValidation] = useState<RoadmapTemplateValidationResponse | null>(null);
  const [backendPreview, setBackendPreview] =
    useState<RoadmapTemplateAllocationPreviewResponse | null>(null);
  const [courseCandidates, setCourseCandidates] = useState<
    Record<number, RoadmapTemplateCourseCandidateResponse[]>
  >({});
  const [courseSearchQuery, setCourseSearchQuery] = useState<Record<number, string>>({});
  const [courseSearchResults, setCourseSearchResults] = useState<
    Record<number, CourseOption[]>
  >({});
  const [searchingCourseSkillId, setSearchingCourseSkillId] = useState<number | null>(null);

  const domainNameById = useMemo(
    () => new Map(domains.map((domain) => [domain.id, domain.name])),
    [domains],
  );

  const stats = useMemo(
    () => ({
      total: templates.length,
      published: templates.filter((template) => template.status === "PUBLISHED").length,
      draft: templates.filter((template) => template.status === "DRAFT").length,
      archived: templates.filter((template) => template.status === "ARCHIVED").length,
    }),
    [templates],
  );

  const filteredTemplates = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return templates.filter((template) => {
      const matchesQuery =
        !normalizedQuery ||
        template.title.toLowerCase().includes(normalizedQuery) ||
        String(template.jobPositionTrackId || "").includes(normalizedQuery);
      const matchesStatus = !statusFilter || template.status === statusFilter;
      const matchesDomain = !domainFilter || String(template.domainId || "") === domainFilter;
      const matchesJobPosition =
        !jobPositionFilter || String(template.jobPositionId || "") === jobPositionFilter;
      const matchesTrack = !trackFilter || String(template.jobPositionTrackId || "") === trackFilter;
      return matchesQuery && matchesStatus && matchesDomain && matchesJobPosition && matchesTrack;
    });
  }, [domainFilter, jobPositionFilter, query, statusFilter, templates, trackFilter]);

  const localAllocation = useMemo(
    () => computeLocalAllocation(form.skillBlocks, form.totalNodeCount),
    [form.skillBlocks, form.totalNodeCount],
  );

  const visibleSkillBlocks = useMemo(() => {
    if (!activeSkillBlockId) return form.skillBlocks;
    const selected = form.skillBlocks.find((block) => block.localId === activeSkillBlockId);
    return selected ? [selected] : form.skillBlocks;
  }, [activeSkillBlockId, form.skillBlocks]);

  const getAllocatedNodes = useCallback(
    (block: SkillBlockDraft) =>
      backendPreview?.items?.find((item) => item.skillId === block.skillId)?.allocatedNodes ??
      localAllocation.get(block.localId) ??
      0,
    [backendPreview, localAllocation],
  );

  const courseOptionsBySkill = useMemo(() => {
    const result: Record<number, CourseOption[]> = {};
    form.skillBlocks.forEach((block) => {
      const merged = new Map<number, CourseOption>();
      (courseCandidates[block.skillId] || [])
        .map(toCandidateCourseOption)
        .forEach((course) => merged.set(course.courseId, course));
      (courseSearchResults[block.skillId] || []).forEach((course) =>
        merged.set(course.courseId, course),
      );
      block.selectedCourseIds.forEach((courseId) => {
        if (!merged.has(courseId)) {
          merged.set(courseId, { courseId, title: `Khóa học #${courseId}` });
        }
      });
      result[block.skillId] = Array.from(merged.values());
    });
    return result;
  }, [courseCandidates, courseSearchResults, form.skillBlocks]);

  const moduleItems = useMemo(
    () => form.nodeGroups
      .slice()
      .sort((a, b) => Number(a.orderIndex || 0) - Number(b.orderIndex || 0))
      .map((group, groupIndex) => ({
        group,
        groupIndex,
        activity: {
          title: group.title,
          description: group.description,
          expectedOutput: group.expectedOutput,
          rubric: group.rubric,
          difficulty: group.difficulty,
          estimatedHours: group.estimatedHours,
          aiPromptHint: group.aiPromptHint,
          skillRequirements: group.skills.map((skill) => ({
            skillId: skill.skillId,
            skillName: skill.skillNameSnapshot,
            canonicalKey: skill.skillCanonicalKeySnapshot,
            requirementType: skill.requirementType === "REQUIRED" || skill.requirementType === "IMPORTANT"
              ? skill.requirementType
              : "NICE_TO_HAVE",
          })),
          orderIndex: group.orderIndex,
        } as RoadmapTemplateActivityRequest,
        skills: group.skills.map((skill) => ({
          skillId: skill.skillId,
          skillName: skill.skillNameSnapshot,
          canonicalKey: skill.skillCanonicalKeySnapshot,
          requirementType: skill.requirementType === "REQUIRED" || skill.requirementType === "IMPORTANT"
            ? skill.requirementType
            : "NICE_TO_HAVE",
        })),
      })),
    [form.nodeGroups],
  );

  const assignedSkillIds = useMemo(() => new Set(
    moduleItems.flatMap((item) => item.skills.map((skill) => skill.skillId).filter(Boolean) as number[]),
  ), [moduleItems]);

  const coverageWarnings = useMemo(() => {
    const warnings: string[] = [];
    moduleItems.forEach((item) => {
      if (item.skills.length === 1 && !item.activity.title.toLowerCase().includes("testing basics")) {
        warnings.push(`${item.activity.title}: module chỉ có 1 skill, nên gom thêm skill liên quan.`);
      }
      if (item.skills.length > 7) {
        warnings.push(`${item.activity.title}: module có quá 7 skills, nên tách node.`);
      }
    });
    trackSkills.forEach((skill) => {
      if (skill.requirementType === "NICE_TO_HAVE" && !assignedSkillIds.has(skill.skillId)) {
        warnings.push(`${skill.skillName}: nice-to-have chưa được cover, có thể bỏ nếu roadmap quá dài.`);
      }
    });
    const singleSkillCount = moduleItems.filter((item) => item.skills.length === 1).length;
    if (moduleItems.length >= 3 && singleSkillCount >= Math.ceil(moduleItems.length * 0.7)) {
      warnings.push("Roadmap đang giống checklist skill. Hãy gom skill liên quan thành module học thực tế.");
    }
    if (validation?.warnings?.length) warnings.push(...validation.warnings);
    return Array.from(new Set(warnings));
  }, [assignedSkillIds, moduleItems, trackSkills, validation]);

  const shouldShowSkillSelector = activeTab === "activities" || activeTab === "courses";

  const readinessErrors = useMemo(() => {
    const errors: string[] = [];
    if (!form.title.trim()) errors.push("Cần nhập tên mẫu lộ trình.");
    if (!form.domainId || !form.jobPositionId || !form.jobPositionTrackId) {
      errors.push("Cần chọn lĩnh vực, vị trí công việc và nhánh lộ trình.");
    }
    if (!form.totalNodeCount || form.totalNodeCount < 1) {
      errors.push("Tổng số nút học phải lớn hơn 0.");
    }
    if (!form.outputLanguage) errors.push("Cần chọn ngôn ngữ đầu ra.");
    if (!form.exerciseRequirement) errors.push("Cần chọn chính sách bài tập bắt buộc.");
    if (!form.topicGenerationType) errors.push("Cần chọn kiểu sinh chủ đề.");
    if (!form.timeBudgetPolicy) errors.push("Cần chọn chính sách thời lượng nút học.");
    if (form.skillBlocks.length === 0) errors.push("Cần có ít nhất một khối kỹ năng.");
    if (moduleItems.length !== Number(form.totalNodeCount || 0)) {
      errors.push(`Số module phải bằng tổng số node: cần ${form.totalNodeCount}, hiện có ${moduleItems.length}.`);
    }
    trackSkills.forEach((skill) => {
      if (skill.requirementType === "REQUIRED" && !assignedSkillIds.has(skill.skillId)) {
        errors.push(`Required skill chưa được cover: ${skill.skillName}.`);
      }
    });
    moduleItems.forEach((item) => {
      if (item.skills.length === 0) {
        errors.push(`${item.activity.title || "Module"} cần có ít nhất một skill.`);
      }
      if (item.skills.length > 7) {
        errors.push(`${item.activity.title || "Module"} có quá nhiều skill, cần tách node.`);
      }
    });
    form.skillBlocks.forEach((block) => {
      if (!block.weightPercent || block.weightPercent <= 0) {
        errors.push(`${block.skillNameSnapshot || "Kỹ năng"} cần có trọng số lớn hơn 0.`);
      }
    });
    form.nodeGroups.forEach((group) => {
      if (!group.title.trim()) errors.push("Module cần có tên.");
      if (!group.expectedOutput?.trim()) errors.push(`${group.title || "Module"} cần có đầu ra mong đợi.`);
      if (!group.completionCriteria?.trim()) errors.push(`${group.title || "Module"} cần có tiêu chí hoàn thành.`);
      if (group.skills.length === 0) errors.push(`${group.title || "Module"} cần có ít nhất một skill.`);
    });
    if (backendPreview?.errors?.length) {
      errors.push(...backendPreview.errors.map(localizeTemplateMessage));
    }
    if (validation?.errors?.length) {
      errors.push(...validation.errors.map(localizeTemplateMessage));
    }
    return Array.from(new Set(errors));
  }, [assignedSkillIds, backendPreview, form, moduleItems, trackSkills, validation]);

  const buildPayload = useCallback((): RoadmapTemplateRequest => {
    const domainId = toNumberOrNull(form.domainId);
    const jobPositionId = toNumberOrNull(form.jobPositionId);
    const jobPositionTrackId = toNumberOrNull(form.jobPositionTrackId);
    if (!domainId || !jobPositionId || !jobPositionTrackId) {
      throw new Error("Vui lòng chọn lĩnh vực, vị trí công việc và nhánh lộ trình.");
    }
    return {
      domainId,
      jobPositionId,
      jobPositionTrackId,
      title: form.title.trim(),
      description: form.description.trim(),
      totalNodeCount: Number(form.totalNodeCount) || 0,
      generationMode: "TEMPLATE_AI_GUIDED",
      globalLearningGoal: form.globalLearningGoal.trim(),
      outputStandard: form.outputStandard.trim(),
      assessmentPolicy: form.assessmentPolicy.trim(),
      templateInstructions: form.templateInstructions.trim(),
      constraintsJson: JSON.stringify(buildStructuredConstraints(form), null, 2),
      aiEvidenceReviewEnabled: form.aiEvidenceReviewEnabled,
      aiAutoPassEnabled: form.aiAutoPassEnabled,
      aiAutoPassMinScorePercent: form.aiAutoPassMinScorePercent,
      aiAutoPassMinConfidence: form.aiAutoPassMinConfidence,
      aiManualReviewBelowConfidence: form.aiManualReviewBelowConfidence,
      aiEvidencePrompt: form.aiEvidencePrompt,
      finalAssignmentInstructions: form.finalAssignmentInstructions,
      finalAssignmentRubric: form.finalAssignmentRubric,
      nodes: [],
      courses: form.skillBlocks.flatMap((block) =>
        block.selectedCourseIds.map((courseId, index) => ({
          courseId,
          skillId: block.skillId,
          displayOrder: index + 1,
          required: false,
        })),
      ),
      skillBlocks: form.skillBlocks.map((block) => ({
        id: block.id,
        skillId: block.skillId,
        skillNameSnapshot: block.skillNameSnapshot,
        skillCanonicalKeySnapshot: block.skillCanonicalKeySnapshot,
        weightPercent: Number(block.weightPercent) || 0,
        minNodes: block.minNodes ?? null,
        maxNodes: block.maxNodes ?? null,
        nodeCountOverride: block.nodeCountOverride ?? null,
        learningGoals: block.learningGoals?.trim(),
        requiredTopics: block.requiredTopics?.trim(),
        activityInstructions: block.activityInstructions?.trim(),
        exerciseTypes: block.exerciseTypes?.trim(),
        successCriteria: block.successCriteria?.trim(),
        ragQueryHint: block.ragQueryHint?.trim(),
        courseLinkPolicy: block.courseLinkPolicy,
        autoCourseLimit: block.autoCourseLimit ?? 2,
        ragEnabled: block.ragEnabled,
        activities: block.activities.map((activity, index) => ({
          id: activity.id,
          title: activity.title.trim(),
          description: activity.description?.trim(),
          exerciseType: activity.exerciseType?.trim(),
          expectedOutput: activity.expectedOutput?.trim(),
          rubric: activity.rubric?.trim(),
          difficulty: activity.difficulty || "trung bình",
          minLevel: activity.minLevel ?? SkillLevel.BEGINNER,
          maxLevel: activity.maxLevel ?? null,
          estimatedHours: activity.estimatedHours ?? null,
          prerequisiteHint: activity.prerequisiteHint?.trim(),
          aiPromptHint: activity.aiPromptHint?.trim(),
          skillRequirementsJson: JSON.stringify(parseActivitySkillRequirements(activity)),
          orderIndex: index + 1,
        })),
      })),
      nodeGroups: form.nodeGroups.map((group, index) => ({
        id: group.id,
        nodeKey: group.nodeKey || `module-${index + 1}`,
        title: group.title.trim(),
        description: group.description?.trim(),
        learningObjectives: group.learningObjectives?.trim(),
        lessonsJson: group.lessonsJson || "[]",
        exercisesJson: group.exercisesJson || "[]",
        completionCriteria: group.completionCriteria?.trim(),
        expectedOutput: group.expectedOutput?.trim(),
        rubric: group.rubric?.trim(),
        difficulty: group.difficulty || "medium",
        estimatedHours: group.estimatedHours ?? null,
        aiPromptHint: group.aiPromptHint?.trim(),
        orderIndex: index + 1,
        skills: group.skills.map((skill, skillIndex) => ({
          id: skill.id,
          skillId: skill.skillId,
          skillNameSnapshot: skill.skillNameSnapshot,
          skillCanonicalKeySnapshot: skill.skillCanonicalKeySnapshot,
          requirementType: skill.requirementType,
          weightInNode: skill.weightInNode ?? null,
          orderIndex: skillIndex + 1,
        })),
      })),
    };
  }, [form]);

  const loadTemplates = useCallback(async () => {
    try {
      const data = await roadmapTemplateService.listAdminTemplates();
      setTemplates(data);
    } catch (error) {
      showError("Không thể tải mẫu lộ trình", getApiErrorMessage(error, "Vui lòng kiểm tra quyền quản trị."));
    }
  }, [showError]);

  useEffect(() => {
    const loadInitial = async () => {
      setLoading(true);
      try {
        const [domainData, templateData] = await Promise.all([
          careerTaxonomyService.getDomains(),
          roadmapTemplateService.listAdminTemplates(),
        ]);
        setDomains(domainData);
        setTemplates(templateData);
      } catch (error) {
        showError("Không thể tải dữ liệu quản trị", getApiErrorMessage(error, "Vui lòng thử lại."));
      } finally {
        setLoading(false);
      }
    };
    void loadInitial();
  }, [showError]);

  useEffect(() => {
    const domainId = toNumberOrNull(form.domainId);
    setJobPositions([]);
    setTracks([]);
    setTrackSkills([]);
    if (!domainId) return;
    void careerTaxonomyService.getJobPositions(domainId).then(setJobPositions).catch(() => {
      showError("Không thể tải vị trí công việc", "Vui lòng thử lại.");
    });
  }, [form.domainId, showError]);

  useEffect(() => {
    const jobPositionId = toNumberOrNull(form.jobPositionId);
    setTracks([]);
    setTrackSkills([]);
    if (!jobPositionId) return;
    void careerTaxonomyService.getTracks(jobPositionId).then(setTracks).catch(() => {
      showError("Không thể tải nhánh lộ trình", "Vui lòng thử lại.");
    });
  }, [form.jobPositionId, showError]);

  useEffect(() => {
    const trackId = toNumberOrNull(form.jobPositionTrackId);
    setTrackSkills([]);
    if (!trackId) return;
    void careerTaxonomyService
      .getTrackSkills(trackId)
      .then((skills) => {
        const sorted = [...skills].sort((a, b) => a.sortOrder - b.sortOrder);
        setTrackSkills(sorted);
        setForm((current) => {
          if (current.editingId || current.skillBlocks.length > 0) return current;
          return {
            ...current,
            skillBlocks: applyTrackSkillPriorityToBlocks([], sorted),
            nodeGroups: [],
          };
        });
      })
      .catch(() => showError("Không thể tải kỹ năng của nhánh", "Vui lòng thử lại."));
  }, [form.jobPositionTrackId, showError]);

  useEffect(() => {
    setActiveSkillBlockId((current) => {
      if (current && form.skillBlocks.some((block) => block.localId === current)) {
        return current;
      }
      return form.skillBlocks[0]?.localId ?? null;
    });
  }, [form.skillBlocks]);

  const openLibrary = () => {
    setViewMode("library");
    setActiveTab("overview");
    setValidation(null);
    setBackendPreview(null);
    setActiveSkillBlockId(null);
  };

  const openCreate = () => {
    setForm(emptyForm());
    setValidation(null);
    setBackendPreview(null);
    setCourseCandidates({});
    setCourseSearchQuery({});
    setCourseSearchResults({});
    setActiveSkillBlockId(null);
    setActiveTab("overview");
    setViewMode("builder");
  };

  const openEdit = (template: RoadmapTemplateResponse) => {
    setValidation(null);
    setBackendPreview(template.allocationPreview || null);
    setCourseCandidates({});
    setCourseSearchQuery({});
    setCourseSearchResults({});
    setForm({
      editingId: template.id,
      title: template.title,
      description: template.description || "",
      domainId: String(template.domainId || ""),
      jobPositionId: String(template.jobPositionId || ""),
      jobPositionTrackId: String(template.jobPositionTrackId || ""),
      totalNodeCount: template.totalNodeCount || Math.max(template.nodes?.length || 0, 12),
      globalLearningGoal: template.globalLearningGoal || "",
      outputStandard: template.outputStandard || "",
      assessmentPolicy: template.assessmentPolicy || emptyForm().assessmentPolicy,
      templateInstructions: template.templateInstructions || "",
      constraintsJson: template.constraintsJson || "",
      outputLanguage: readConstraintValue(template.constraintsJson, "language", "vi"),
      exerciseRequirement: readConstraintValue(
        template.constraintsJson,
        "exerciseRequirement",
        "REQUIRED_EVERY_NODE",
      ),
      topicGenerationType: readConstraintValue(
        template.constraintsJson,
        "topicGenerationType",
        "LEVEL_BAND_AND_ASSESSMENT_GAP",
      ),
      timeBudgetPolicy: readConstraintValue(
        template.constraintsJson,
        "timeBudgetPolicy",
        "DIFFICULTY_AND_COMPLEXITY",
      ),
      aiEvidenceReviewEnabled: template.aiEvidenceReviewEnabled ?? false,
      aiAutoPassEnabled: template.aiAutoPassEnabled ?? false,
      aiAutoPassMinScorePercent: template.aiAutoPassMinScorePercent ?? ROADMAP_EVIDENCE_AI_REVIEW_DEFAULTS.AI_AUTO_PASS_MIN_SCORE_PERCENT,
      aiAutoPassMinConfidence: template.aiAutoPassMinConfidence ?? ROADMAP_EVIDENCE_AI_REVIEW_DEFAULTS.AI_AUTO_PASS_MIN_CONFIDENCE,
      aiManualReviewBelowConfidence: template.aiManualReviewBelowConfidence ?? ROADMAP_EVIDENCE_AI_REVIEW_DEFAULTS.AI_MANUAL_REVIEW_BELOW_CONFIDENCE,
      aiEvidencePrompt: template.aiEvidencePrompt || "",
      finalAssignmentInstructions: template.finalAssignmentInstructions || "",
      finalAssignmentRubric: template.finalAssignmentRubric || "",
      skillBlocks: (template.skillBlocks || []).map((block) =>
        normalizeBlock(block, template.courses),
      ),
      nodeGroups: (template.nodeGroups || []).map((group, index) =>
        makeNodeGroupFromResponse(group, index + 1),
      ),
    });
    setActiveTab("overview");
    setViewMode("builder");
  };

  const openPreview = (template: RoadmapTemplateResponse) => {
    openEdit(template);
    setActiveTab("preview");
  };

  const openDuplicate = (template: RoadmapTemplateResponse) => {
    openEdit(template);
    setForm((current) => ({
      ...current,
      editingId: undefined,
      title: `${template.title} - Bản sao`,
      skillBlocks: current.skillBlocks.map((block) => ({
        ...block,
        id: undefined,
        localId: `copy-${block.skillId}-${Math.random().toString(16).slice(2)}`,
        activities: block.activities.map((activity, index) => ({
          ...activity,
          id: undefined,
          orderIndex: index + 1,
        })),
      })),
    }));
  };

  const updateBlock = (localId: string, patch: Partial<SkillBlockDraft>) => {
    setForm((current) => ({
      ...current,
      skillBlocks: current.skillBlocks.map((block) =>
        block.localId === localId ? { ...block, ...patch } : block,
      ),
    }));
  };

  const addSkillBlock = () => {
    const nextSkill = trackSkills.find(
      (skill) => !form.skillBlocks.some((block) => block.skillId === skill.skillId),
    );
    if (!nextSkill) {
      showError("Không còn kỹ năng khả dụng", "Tất cả kỹ năng của nhánh đã có trong mẫu này.");
      return;
    }
    setForm((current) => ({
      ...current,
      skillBlocks: [...current.skillBlocks, buildSkillBlockFromTrackSkill(nextSkill, 10)],
    }));
  };

  const removeSkillBlock = (localId: string) => {
    setForm((current) => ({
      ...current,
      skillBlocks: current.skillBlocks.filter((block) => block.localId !== localId),
    }));
  };

  const calculateSkillPriority = async () => {
    if (!toNumberOrNull(form.jobPositionTrackId)) {
      showError("Chưa chọn nhánh lộ trình", "Hãy chọn job position track trước khi tính % kỹ năng.");
      return;
    }
    if (trackSkills.length === 0) {
      showError("Chưa có kỹ năng trong nhánh", "Hãy cấu hình track skills trước khi tính % ưu tiên.");
      return;
    }
    setCalculatingSkillPriority(true);
    const nextBlocks = applyTrackSkillPriorityToBlocks(form.skillBlocks, trackSkills);
    setForm((current) => ({
      ...current,
      skillBlocks: applyTrackSkillPriorityToBlocks(current.skillBlocks, trackSkills),
    }));
    setActiveSkillBlockId(nextBlocks[0]?.localId ?? null);
    setValidation(null);
    try {
      const preview = await roadmapTemplateService.previewAllocation({
        ...buildPayload(),
        skillBlocks: nextBlocks.map((block) => ({
          id: block.id,
          skillId: block.skillId,
          skillNameSnapshot: block.skillNameSnapshot,
          skillCanonicalKeySnapshot: block.skillCanonicalKeySnapshot,
          weightPercent: Number(block.weightPercent) || 0,
          minNodes: block.minNodes ?? null,
          maxNodes: block.maxNodes ?? null,
          nodeCountOverride: block.nodeCountOverride ?? null,
          learningGoals: block.learningGoals?.trim(),
          requiredTopics: block.requiredTopics?.trim(),
          activityInstructions: block.activityInstructions?.trim(),
          exerciseTypes: block.exerciseTypes?.trim(),
          successCriteria: block.successCriteria?.trim(),
          ragQueryHint: block.ragQueryHint?.trim(),
          courseLinkPolicy: block.courseLinkPolicy,
          autoCourseLimit: block.autoCourseLimit ?? 2,
          ragEnabled: block.ragEnabled,
          activities: block.activities.map((activity, index) => ({
            id: activity.id,
            title: activity.title.trim(),
            description: activity.description?.trim(),
            exerciseType: activity.exerciseType?.trim(),
            expectedOutput: activity.expectedOutput?.trim(),
            rubric: activity.rubric?.trim(),
            difficulty: activity.difficulty || "trung bình",
            minLevel: activity.minLevel ?? SkillLevel.BEGINNER,
            maxLevel: activity.maxLevel ?? null,
            estimatedHours: activity.estimatedHours ?? null,
            prerequisiteHint: activity.prerequisiteHint?.trim(),
            aiPromptHint: activity.aiPromptHint?.trim(),
            skillRequirementsJson: JSON.stringify(parseActivitySkillRequirements(activity)),
            orderIndex: index + 1,
          })),
        })),
      });
      setBackendPreview(preview);
      showSuccess("Đã tính % ưu tiên kỹ năng", "Tỷ lệ đã được chuẩn hóa theo requirement type và trọng số của track.");
    } catch (error) {
      setBackendPreview(null);
      showError("Đã tính local nhưng chưa xem được preview", getApiErrorMessage(error, "Có thể cần điền đủ thông tin tổng quan trước."));
    } finally {
      setCalculatingSkillPriority(false);
    }
  };

  const saveTemplate = async () => {
    setSaving(true);
    try {
      const payload = buildPayload();
      let saved: RoadmapTemplateResponse;
      if (form.editingId) {
        saved = await roadmapTemplateService.updateTemplate(form.editingId, payload);
        showSuccess("Đã cập nhật mẫu", "Các thay đổi đã được lưu.");
      } else {
        saved = await roadmapTemplateService.createTemplate(payload);
        showSuccess("Đã tạo mẫu", "Mẫu mới đã được lưu dưới dạng bản nháp.");
      }
      setForm((current) => ({ ...current, editingId: saved.id }));
      await loadTemplates();
      return saved;
    } catch (error) {
      showError(
        "Không thể lưu mẫu",
        error instanceof Error ? error.message : getApiErrorMessage(error, "Vui lòng thử lại."),
      );
      return null;
    } finally {
      setSaving(false);
    }
  };

  const runPreview = async () => {
    try {
      const preview = await roadmapTemplateService.previewAllocation(buildPayload());
      setBackendPreview(preview);
      showSuccess("Đã làm mới coverage preview", `Coverage target hiện là ${preview.allocatedNodeCount} node.`);
    } catch (error) {
      showError("Không thể xem trước phân bổ", getApiErrorMessage(error, "Vui lòng kiểm tra các trường bắt buộc."));
    }
  };

  const runValidation = async () => {
    try {
      const response = await roadmapTemplateService.validateTemplate(buildPayload());
      setValidation(response);
      setBackendPreview(response.allocation || null);
      if (response.valid) {
        showSuccess("Mẫu đã sẵn sàng", "Máy chủ đã kiểm tra hợp lệ.");
      } else {
        showError("Mẫu còn lỗi kiểm tra", `Phát hiện ${response.errors.length} vấn đề.`);
      }
    } catch (error) {
      showError("Không thể kiểm tra mẫu", getApiErrorMessage(error, "Vui lòng kiểm tra các trường bắt buộc."));
    }
  };

  const publishTemplate = async (templateId?: number) => {
    let id = templateId || form.editingId;
    if (!id) {
      const saved = await saveTemplate();
      id = saved?.id;
    }
    if (!id) return;
    setActionId(id);
    try {
      await roadmapTemplateService.publishTemplate(id);
      showSuccess("Đã xuất bản mẫu", "Lộ trình của người học có thể sử dụng mẫu này.");
      await loadTemplates();
      if (viewMode === "builder") openLibrary();
    } catch (error) {
      showError("Không thể xuất bản", getApiErrorMessage(error, "Vui lòng kiểm tra phân bổ, bài học, đầu ra, tiêu chí đánh giá và dải cấp độ."));
    } finally {
      setActionId(null);
    }
  };

  const archiveTemplate = async (template: RoadmapTemplateResponse) => {
    setActionId(template.id);
    try {
      await roadmapTemplateService.archiveTemplate(template.id);
      showSuccess("Đã lưu trữ mẫu", "Mẫu này sẽ không còn được dùng để sinh lộ trình mới.");
      await loadTemplates();
    } catch (error) {
      showError("Không thể lưu trữ", getApiErrorMessage(error, "Vui lòng thử lại."));
    } finally {
      setActionId(null);
    }
  };

  const loadCourseCandidates = async (block: SkillBlockDraft) => {
    try {
      const candidates = await roadmapTemplateService.getCourseCandidates(
        block.skillId,
        block.courseLinkPolicy || "AUTO_HYBRID",
        block.autoCourseLimit || 5,
      );
      setCourseCandidates((current) => ({ ...current, [block.skillId]: candidates }));
    } catch (error) {
      showError("Không thể tải khóa học gợi ý", getApiErrorMessage(error, "Vui lòng thử lại."));
    }
  };

  const searchPublicCourses = async (block: SkillBlockDraft) => {
    const search = courseSearchQuery[block.skillId]?.trim();
    setSearchingCourseSkillId(block.skillId);
    try {
      const response = await listCourses(
        0,
        20,
        undefined,
        CourseStatus.PUBLIC,
        search,
        "createdAt",
        "desc",
      );
      setCourseSearchResults((current) => ({
        ...current,
        [block.skillId]: response.content.map(toSummaryCourseOption),
      }));
    } catch (error) {
      showError("Không thể tìm khóa học", getApiErrorMessage(error, "Vui lòng thử lại."));
    } finally {
      setSearchingCourseSkillId(null);
    }
  };

  const toggleSelectedCourse = (block: SkillBlockDraft, courseId: number) => {
    updateBlock(block.localId, {
      selectedCourseIds: block.selectedCourseIds.includes(courseId)
        ? block.selectedCourseIds.filter((id) => id !== courseId)
        : [...block.selectedCourseIds, courseId],
    });
  };

  const applyNodeGroups = (groups: RoadmapTemplateNodeGroupResponse[]) => {
    setForm((current) => {
      const nodeGroups = groups.map((group, index) => makeNodeGroupFromResponse(group, index + 1));
      return { ...current, nodeGroups };
    });
  };

  const runAutoGroup = async () => {
    const trackId = toNumberOrNull(form.jobPositionTrackId);
    if (!trackId) {
      showError("Chưa chọn track", "Cần chọn nhánh lộ trình trước khi auto-group.");
      return;
    }
    try {
      const groups = await roadmapTemplateService.autoGroup({
        jobPositionTrackId: trackId,
        totalNodeCount: Number(form.totalNodeCount) || 1,
        skillBlocks: buildPayload().skillBlocks || [],
      });
      applyNodeGroups(groups);
      showSuccess("Đã auto-group skill", `Đã tạo ${groups.length} module học từ skill pool.`);
    } catch (error) {
      showError("Không thể auto-group skill", getApiErrorMessage(error, "Vui lòng kiểm tra skill pool và track."));
    }
  };

  const toggleModuleSkill = (
    groupLocalId: string,
    skill: JobPositionTrackSkill,
  ) => {
    setForm((current) => ({
      ...current,
      nodeGroups: current.nodeGroups.map((group) => {
        if (group.localId !== groupLocalId) return group;
        const exists = group.skills.some((item) => item.skillId === skill.skillId);
        const next = exists
          ? group.skills.filter((item) => item.skillId !== skill.skillId)
          : [...group.skills, makeNodeGroupSkill(skill, group.skills.length + 1)];
        return {
          ...group,
          skills: next.map((item, index) => ({ ...item, orderIndex: index + 1 })),
        };
      }),
    }));
  };

  const updateNodeGroup = (localId: string, patch: Partial<NodeGroupDraft>) => {
    setForm((current) => ({
      ...current,
      nodeGroups: current.nodeGroups.map((group) =>
        group.localId === localId ? { ...group, ...patch } : group,
      ),
    }));
  };

  const updateModuleLesson = (group: NodeGroupDraft, lessonIndex: number, patch: Partial<ModuleLessonDraft>) => {
    const lessons = getModuleLessons(group).map((lesson, index) =>
      index === lessonIndex ? { ...lesson, ...patch } : lesson,
    );
    updateNodeGroup(group.localId, { lessonsJson: serializeModuleLessons(lessons) });
  };

  const addModuleLesson = (group: NodeGroupDraft) => {
    const lessons = getModuleLessons(group);
    updateNodeGroup(group.localId, {
      lessonsJson: serializeModuleLessons([
        ...lessons,
        defaultModuleLesson(lessons.length + 1, group.title || "module"),
      ]),
    });
  };

  const removeModuleLesson = (group: NodeGroupDraft, lessonIndex: number) => {
    const lessons = getModuleLessons(group).filter((_, index) => index !== lessonIndex);
    updateNodeGroup(group.localId, { lessonsJson: serializeModuleLessons(lessons) });
  };

  const updateModuleExercise = (
    group: NodeGroupDraft,
    exerciseIndex: number,
    patch: Partial<ModuleExerciseDraft>,
  ) => {
    const exercises = getModuleExercises(group).map((exercise, index) =>
      index === exerciseIndex ? { ...exercise, ...patch } : exercise,
    );
    updateNodeGroup(group.localId, { exercisesJson: serializeModuleExercises(exercises) });
  };

  const addModuleExercise = (group: NodeGroupDraft) => {
    const exercises = getModuleExercises(group);
    updateNodeGroup(group.localId, {
      exercisesJson: serializeModuleExercises([
        ...exercises,
        defaultModuleExercise(exercises.length + 1, group.title || "module"),
      ]),
    });
  };

  const removeModuleExercise = (group: NodeGroupDraft, exerciseIndex: number) => {
    const exercises = getModuleExercises(group).filter((_, index) => index !== exerciseIndex);
    updateNodeGroup(group.localId, { exercisesJson: serializeModuleExercises(exercises) });
  };

  const addNodeGroup = () => {
    setForm((current) => ({
      ...current,
      nodeGroups: [...current.nodeGroups, defaultNodeGroup(current.nodeGroups.length + 1)],
    }));
  };

  const removeNodeGroup = (localId: string) => {
    setForm((current) => ({
      ...current,
      nodeGroups: current.nodeGroups
        .filter((group) => group.localId !== localId)
        .map((group, index) => ({ ...group, orderIndex: index + 1, nodeKey: group.nodeKey || `module-${index + 1}` })),
    }));
  };

  const renderLibrary = () => (
    <div className="artm-library">
      <header className="artm-library-hero">
        <div>
          <span>Tài nguyên AI / Mẫu lộ trình V3</span>
          <h1>Kho mẫu lộ trình</h1>
          <p>Quản lý mẫu chuẩn theo nhánh công việc. Trình tạo được tách riêng để biểu mẫu rộng, sạch và đủ chi tiết.</p>
        </div>
        <div className="artm-header-actions">
          <button type="button" onClick={() => void loadTemplates()}>
            <RefreshCw size={16} /> Làm mới
          </button>
          <button type="button" className="artm-primary" onClick={openCreate}>
            <Plus size={16} /> Tạo mẫu
          </button>
        </div>
      </header>

      <section className="artm-library-stats">
        <div className="artm-stat"><span>Tổng mẫu</span><strong>{stats.total}</strong></div>
        <div className="artm-stat"><span>Đã xuất bản</span><strong>{stats.published}</strong></div>
        <div className="artm-stat"><span>Bản nháp</span><strong>{stats.draft}</strong></div>
        <div className="artm-stat"><span>Đã lưu trữ</span><strong>{stats.archived}</strong></div>
      </section>

      <section className="artm-library-toolbar">
        <label className="artm-search">
          <Search size={16} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm theo tên mẫu hoặc mã nhánh" />
        </label>
        <select value={domainFilter} onChange={(e) => setDomainFilter(e.target.value)}>
          <option value="">Tất cả lĩnh vực</option>
          {domains.map((domain) => <option key={domain.id} value={domain.id}>{domain.name}</option>)}
        </select>
        <input value={jobPositionFilter} onChange={(e) => setJobPositionFilter(e.target.value)} placeholder="Mã vị trí công việc" />
        <input value={trackFilter} onChange={(e) => setTrackFilter(e.target.value)} placeholder="Mã nhánh lộ trình" />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as RoadmapTemplateStatus | "")}>
          <option value="">Tất cả trạng thái</option>
          {Object.keys(statusLabel).map((status) => (
            <option key={status} value={status}>{statusLabel[status as RoadmapTemplateStatus]}</option>
          ))}
        </select>
      </section>

      <section className="artm-template-grid">
        {loading ? (
          <div className="artm-empty">Đang tải mẫu lộ trình...</div>
        ) : filteredTemplates.length === 0 ? (
          <div className="artm-empty">Chưa có mẫu lộ trình phù hợp.</div>
        ) : filteredTemplates.map((template) => {
          const activityCount = (template.skillBlocks || []).reduce(
            (sum, block) => sum + (block.activities?.length || 0),
            0,
          );
          const issueCount = template.allocationPreview?.errors?.length || 0;
          return (
            <article className="artm-template-card" key={template.id}>
              <div>
                <span className={`artm-status artm-status--${template.status.toLowerCase()}`}>
                  {statusLabel[template.status]}
                </span>
                <small>Nhánh #{template.jobPositionTrackId}</small>
              </div>
              <h3>{template.title}</h3>
              <p>{domainNameById.get(template.domainId || 0) || "Chưa có lĩnh vực"} | {template.totalNodeCount || template.nodes.length} nút học</p>
              <div className="artm-template-metrics">
                <span>{template.skillBlocks?.length || 0} kỹ năng</span>
                <span>{activityCount} bài học</span>
                <span className={issueCount ? "artm-chip-warn" : "artm-chip-ok"}>
                  {issueCount ? `${issueCount} lỗi` : "Sẵn sàng"}
                </span>
              </div>
              <div className="artm-card-actions">
                <button type="button" onClick={() => openEdit(template)}><Edit3 size={15} /> Sửa</button>
                <button type="button" onClick={() => openDuplicate(template)}><Copy size={15} /> Nhân bản</button>
                <button type="button" onClick={() => openPreview(template)}><Eye size={15} /> Xem trước</button>
                <button
                  type="button"
                  onClick={() => void publishTemplate(template.id)}
                  disabled={actionId === template.id || template.status === "PUBLISHED"}
                >
                  <Rocket size={15} /> Xuất bản
                </button>
                <button
                  type="button"
                  onClick={() => void archiveTemplate(template)}
                  disabled={actionId === template.id || template.status === "ARCHIVED"}
                >
                  <Archive size={15} /> Lưu trữ
                </button>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );

  const renderOverview = () => (
    <div className="artm-panel-grid">
      <label className="artm-wide">
        <span>Tên mẫu</span>
        <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Lộ trình Java Spring Boot phía máy chủ đầy đủ" />
      </label>
      <label>
        <span>Tổng số nút học</span>
        <input type="number" min={1} max={80} value={form.totalNodeCount} onChange={(e) => setForm({ ...form, totalNodeCount: Number(e.target.value) })} />
      </label>
      <label>
        <span>Lĩnh vực</span>
        <select value={form.domainId} onChange={(e) => setForm({ ...form, domainId: e.target.value, jobPositionId: "", jobPositionTrackId: "", skillBlocks: [], nodeGroups: [] })}>
          <option value="">Chọn lĩnh vực</option>
          {domains.map((domain) => <option key={domain.id} value={domain.id}>{domain.name}</option>)}
        </select>
      </label>
      <label>
        <span>Vị trí công việc</span>
        <select value={form.jobPositionId} onChange={(e) => setForm({ ...form, jobPositionId: e.target.value, jobPositionTrackId: "", skillBlocks: [], nodeGroups: [] })}>
          <option value="">Chọn vị trí công việc</option>
          {jobPositions.map((position) => <option key={position.id} value={position.id}>{position.name}</option>)}
        </select>
      </label>
      <label>
        <span>Nhánh lộ trình</span>
        <select value={form.jobPositionTrackId} onChange={(e) => setForm({ ...form, jobPositionTrackId: e.target.value, skillBlocks: [], nodeGroups: [] })}>
          <option value="">Chọn nhánh lộ trình</option>
          {tracks.map((track) => <option key={track.id} value={track.id}>{track.name}</option>)}
        </select>
      </label>
      <label className="artm-wide">
        <span>Đầu ra học tập / mục tiêu tổng</span>
        <textarea rows={3} value={form.globalLearningGoal} onChange={(e) => setForm({ ...form, globalLearningGoal: e.target.value })} placeholder="Sau lộ trình, người học có thể xây dựng REST API Spring Boot, hiểu monolith/microservice, kiểm thử, đóng gói Docker và triển khai." />
      </label>
      <label className="artm-wide">
        <span>Tiêu chuẩn đầu ra</span>
        <textarea rows={3} value={form.outputStandard} onChange={(e) => setForm({ ...form, outputStandard: e.target.value })} placeholder="Minh chứng cần có mã nguồn, tài liệu API, kết quả kiểm thử, sản phẩm Docker và phần giải thích." />
      </label>
      <label className="artm-wide">
        <span>Chính sách cá nhân hóa theo bài đánh giá</span>
        <textarea rows={3} value={form.assessmentPolicy} onChange={(e) => setForm({ ...form, assessmentPolicy: e.target.value })} />
      </label>
      <label className="artm-wide">
        <span>Hướng dẫn sinh nội dung từ mẫu</span>
        <textarea rows={3} value={form.templateInstructions} onChange={(e) => setForm({ ...form, templateInstructions: e.target.value })} />
      </label>
      <section className="artm-wide artm-constraint-builder">
        <div className="artm-section-head">
          <div>
            <h3>Ràng buộc sinh lộ trình</h3>
            <p>Admin chọn bằng form, hệ thống tự đóng gói dữ liệu chuẩn cho backend. Bài tập là bắt buộc; thời lượng từng nút phụ thuộc độ khó và độ phức tạp của node.</p>
          </div>
        </div>
        <div className="artm-panel-grid artm-panel-grid--tight">
          <label>
            <span>Bài tập bắt buộc</span>
            <select value={form.exerciseRequirement} onChange={(e) => setForm({ ...form, exerciseRequirement: e.target.value })}>
              {exerciseRequirementOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label>
            <span>Kiểu sinh chủ đề</span>
            <select value={form.topicGenerationType} onChange={(e) => setForm({ ...form, topicGenerationType: e.target.value })}>
              {topicGenerationTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label>
            <span>Thời lượng nút học</span>
            <select value={form.timeBudgetPolicy} onChange={(e) => setForm({ ...form, timeBudgetPolicy: e.target.value })}>
              {timeBudgetPolicyOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
        </div>
      </section>
      <section className="artm-wide artm-constraint-builder">
        <div className="artm-section-head">
          <div>
            <h3>Đánh giá Final & AI Review</h3>
            <p>Thiết lập đề bài cuối lộ trình (bắt buộc) và cấu hình kiểm duyệt tự động bằng AI.</p>
          </div>
        </div>

        {/* Thiết lập bài nộp cuối lộ trình luôn hiển thị độc lập */}
        <div className="artm-ai-final-stack">
          <label className="artm-wide">
            <span>Hướng dẫn bài Final Assignment</span>
            <textarea rows={3} value={form.finalAssignmentInstructions} onChange={(e) => setForm({ ...form, finalAssignmentInstructions: e.target.value })} placeholder="Đề bài, yêu cầu cho phần output assessment..." />
          </label>
          <div className="artm-wide">
            <RubricListEditor value={form.finalAssignmentRubric} onChange={(val) => setForm({ ...form, finalAssignmentRubric: val })} label="Rubric đánh giá Final Assignment (N Rubrics)" />
          </div>
        </div>

        <div className="artm-panel-grid artm-panel-grid--tight artm-ai-section-divider">
          <label className="artm-wide artm-ai-toggle-row">
            <input type="checkbox" checked={form.aiEvidenceReviewEnabled} onChange={(e) => setForm({ ...form, aiEvidenceReviewEnabled: e.target.checked })} />
            <span className="artm-ai-toggle-label">Chấm tự động bằng AI</span>
          </label>
          <p className="artm-ai-toggle-copy">
            Nếu tắt, các bài nộp của học viên không có mentor sẽ tự động chuyển vào hàng chờ để Admin đánh giá thủ công.
          </p>
        </div>
        
        {form.aiEvidenceReviewEnabled && (
          <>
            <div className="artm-panel-grid artm-panel-grid--tight artm-ai-field-spacer">
              <label className="artm-wide artm-ai-toggle-row">
                <input type="checkbox" checked={form.aiAutoPassEnabled} onChange={(e) => setForm({ ...form, aiAutoPassEnabled: e.target.checked })} />
                <span className="artm-ai-toggle-label">Cho phép AI tự động xác nhận qua bài (Auto Pass) nếu đạt ngưỡng</span>
              </label>
            </div>
            
            <div className="artm-panel-grid artm-panel-grid--tight artm-ai-field-spacer">
              <label>
                <span>% Điểm tối thiểu (Auto Pass)</span>
                <input type="number" min={0} max={100} value={form.aiAutoPassMinScorePercent} onChange={(e) => setForm({ ...form, aiAutoPassMinScorePercent: Number(e.target.value) })} />
              </label>
              <label>
                <span>Confidence tối thiểu (Auto Pass)</span>
                <input type="number" min={0} max={1} step={0.01} value={form.aiAutoPassMinConfidence} onChange={(e) => setForm({ ...form, aiAutoPassMinConfidence: Number(e.target.value) })} />
              </label>
              <label>
                <span>Confidence dưới ngưỡng này vào Admin Queue</span>
                <input type="number" min={0} max={1} step={0.01} value={form.aiManualReviewBelowConfidence} onChange={(e) => setForm({ ...form, aiManualReviewBelowConfidence: Number(e.target.value) })} />
              </label>
            </div>
            
            <label className="artm-wide artm-ai-field-spacer">
              <span>Prompt hệ thống AI Review (Evidence)</span>
              <textarea rows={3} value={form.aiEvidencePrompt} onChange={(e) => setForm({ ...form, aiEvidencePrompt: e.target.value })} placeholder="Hướng dẫn AI cách chấm điểm node evidence..." />
            </label>
          </>
        )}
      </section>
      <label className="artm-wide">
        <span>Mô tả</span>
        <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </label>
    </div>
  );

  const renderAllocation = () => {
    const totalWeight = form.skillBlocks.reduce((sum, block) => sum + (Number(block.weightPercent) || 0), 0);
    return (
      <div className="artm-table-panel">
        <div className="artm-section-head">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3>Ưu tiên kỹ năng</h3>
              <span className={Math.abs(totalWeight - 100) > 0.01 ? "artm-chip-warn" : "artm-chip-ok"}>
                Tổng: {totalWeight.toFixed(2).replace(/\.00$/, '')}%
              </span>
            </div>
            <p>{trackSkills.length} kỹ năng trong nhánh đã chọn. Trọng số và độ phủ tối thiểu/tối đa chỉ dùng để ưu tiên, không ép mỗi skill sinh node riêng.</p>
          </div>
          <div className="artm-section-actions">
            <button type="button" onClick={() => void calculateSkillPriority()} disabled={calculatingSkillPriority || trackSkills.length === 0}>
              {calculatingSkillPriority ? <Loader2 size={16} className="artm-spin" /> : <Calculator size={16} />}
              Tính % nhanh
            </button>
            <button type="button" onClick={addSkillBlock}><Plus size={16} /> Thêm kỹ năng</button>
          </div>
        </div>
      <div className="artm-allocation-list">
        {form.skillBlocks.map((block) => (
          <article className={`artm-allocation-row ${activeSkillBlockId === block.localId ? "artm-allocation-row--active" : ""}`} key={block.localId}>
            <div>
              <strong>{block.skillNameSnapshot}</strong>
              <span>{block.skillCanonicalKeySnapshot || `kỹ năng:${block.skillId}`}</span>
            </div>
            <label><span>Trọng số %</span><input type="number" min={0} value={block.weightPercent} onChange={(e) => updateBlock(block.localId, { weightPercent: Number(e.target.value) })} /></label>
            <label><span>Độ phủ tối thiểu</span><input type="number" min={0} value={block.minNodes ?? ""} onChange={(e) => updateBlock(block.localId, { minNodes: e.target.value ? Number(e.target.value) : null })} /></label>
            <label><span>Độ phủ tối đa</span><input type="number" min={0} value={block.maxNodes ?? ""} onChange={(e) => updateBlock(block.localId, { maxNodes: e.target.value ? Number(e.target.value) : null })} /></label>
            <label><span>Ghi đè độ phủ</span><input type="number" min={0} value={block.nodeCountOverride ?? ""} onChange={(e) => updateBlock(block.localId, { nodeCountOverride: e.target.value ? Number(e.target.value) : null })} /></label>
            <button type="button" className="artm-node-chip" onClick={() => setActiveSkillBlockId(block.localId)}>Đã gán vào {getAllocatedNodes(block)} module</button>
            <button type="button" title="Xóa kỹ năng" onClick={() => removeSkillBlock(block.localId)}><Trash2 size={16} /></button>
          </article>
        ))}
      </div>
    </div>
    );
  };

  const renderGrouping = () => {
    const unassignedSkills = trackSkills.filter((skill) => !assignedSkillIds.has(skill.skillId));
    return (
      <div className="artm-publish-grid">
        <section className="artm-table-panel">
          <div className="artm-section-head">
            <div>
              <h3>Skill chưa gán</h3>
              <p>Skill pool chỉ là nguồn kỹ năng. Hãy gán skill vào module học, không tạo 1 skill = 1 node.</p>
            </div>
            <button type="button" onClick={() => void runAutoGroup()}><RefreshCw size={16} /> Tự gom module</button>
          </div>
          <div className="artm-preview-list">
            {unassignedSkills.length === 0 ? (
              <div className="artm-ready"><CheckCircle2 size={18} /> Tất cả skill đã được gán vào module.</div>
            ) : unassignedSkills.map((skill) => (
              <div className="artm-preview-row" key={skill.skillId}>
                <span>{skill.skillName}</span>
                <strong>{skill.requirementType}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="artm-table-panel">
          <div className="artm-section-head">
            <div>
              <h3>Module học của lộ trình</h3>
              <p>{moduleItems.length} module. Mỗi module nên có 2-5 kỹ năng liên quan.</p>
            </div>
            <button
              type="button"
              onClick={addNodeGroup}
            >
              <Plus size={16} /> Thêm module
            </button>
          </div>
          <div className="artm-skill-stack">
            {moduleItems.map((item, moduleIndex) => (
              <article className="artm-activity-card" key={item.group.localId}>
                <div className="artm-activity-head">
                  <div>
                    <strong>Node {moduleIndex + 1}: {item.group.title}</strong>
                    <span>Đang chứa {item.skills.length} kỹ năng</span>
                  </div>
                  <button type="button" title="Xóa module" onClick={() => removeNodeGroup(item.group.localId)}>
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="artm-panel-grid">
                  <label className="artm-wide"><span>Tên module</span><input value={item.group.title} onChange={(e) => updateNodeGroup(item.group.localId, { title: e.target.value })} /></label>
                  <label className="artm-wide"><span>Mô tả</span><textarea rows={2} value={item.group.description || ""} onChange={(e) => updateNodeGroup(item.group.localId, { description: e.target.value })} /></label>
                  <label><span>Độ khó</span><input value={item.group.difficulty || "medium"} onChange={(e) => updateNodeGroup(item.group.localId, { difficulty: e.target.value })} /></label>
                  <label><span>Giờ học</span><input type="number" min={0} value={item.group.estimatedHours ?? ""} onChange={(e) => updateNodeGroup(item.group.localId, { estimatedHours: e.target.value ? Number(e.target.value) : null })} /></label>
                </div>
                <div className="artm-panel-grid">
                  {trackSkills.map((skill) => {
                    const checked = item.skills.some((moduleSkill) => moduleSkill.skillId === skill.skillId);
                    return (
                      <label key={skill.skillId}>
                        <span>{skill.skillName}</span>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleModuleSkill(item.group.localId, skill)}
                        />
                      </label>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    );
  };

  const renderNodeGroupActivities = () => (
    <div className="artm-skill-stack">
      {form.nodeGroups.length === 0 ? (
        <section className="artm-table-panel">
          <div className="artm-ready"><AlertTriangle size={18} /> Chưa có module. Hãy auto-group hoặc thêm module ở tab gom kỹ năng.</div>
        </section>
      ) : form.nodeGroups.map((group, index) => {
        const lessons = getModuleLessons(group);
        const exercises = getModuleExercises(group);
        return (
          <section className="artm-skill-card" key={group.localId}>
            <div className="artm-section-head">
              <div>
                <h3>Module {index + 1}: {group.title}</h3>
                <p>Bài học, bài tập và tiêu chí hoàn thành thuộc module này, không thuộc từng skill riêng lẻ.</p>
              </div>
              <button type="button" onClick={() => setActiveTab("grouping")}>Chỉnh kỹ năng</button>
            </div>
            <div className="artm-course-selected-strip">
              {group.skills.map((skill) => (
                <span key={skill.skillId}>{skill.skillNameSnapshot || `Skill ${skill.skillId}`} · {skill.requirementType || "REQUIRED"}</span>
              ))}
            </div>
            <div className="artm-activity-form">
              <label className="artm-wide"><span>Tên module</span><input value={group.title} onChange={(e) => updateNodeGroup(group.localId, { title: e.target.value })} /></label>
              <label className="artm-wide"><span>Mô tả module</span><textarea rows={2} value={group.description || ""} onChange={(e) => updateNodeGroup(group.localId, { description: e.target.value })} /></label>
              <label className="artm-wide"><span>Mục tiêu học tập tổng quát</span><textarea rows={3} value={group.learningObjectives || ""} onChange={(e) => updateNodeGroup(group.localId, { learningObjectives: e.target.value })} /></label>
              <label><span>Độ khó</span><input value={group.difficulty || "medium"} onChange={(e) => updateNodeGroup(group.localId, { difficulty: e.target.value })} /></label>
              <label><span>Số giờ học ước tính</span><input type="number" min={0} value={group.estimatedHours ?? ""} onChange={(e) => updateNodeGroup(group.localId, { estimatedHours: e.target.value ? Number(e.target.value) : null })} /></label>
            </div>
            <div className="artm-module-editor">
              <div className="artm-section-head">
                <div>
                  <h4>Bài học trong module</h4>
                  <p>Nhập từng bài học cụ thể để dạy phối hợp các kỹ năng đã gán vào module.</p>
                </div>
                <button type="button" onClick={() => addModuleLesson(group)}><Plus size={16} /> Thêm bài học</button>
              </div>
              {lessons.length === 0 ? (
                <div className="artm-ready"><AlertTriangle size={16} /> Chưa có bài học. Hãy thêm ít nhất một bài học cho module.</div>
              ) : lessons.map((lesson, lessonIndex) => (
                <article className="artm-activity-card" key={`${group.localId}-lesson-${lessonIndex}`}>
                  <div className="artm-activity-head">
                    <div>
                      <strong>Bài học {lessonIndex + 1}</strong>
                      <span>{lesson.title || "Chưa đặt tên"}</span>
                    </div>
                    <button type="button" title="Xóa bài học" onClick={() => removeModuleLesson(group, lessonIndex)}><Trash2 size={16} /></button>
                  </div>
                  <div className="artm-activity-form">
                    <label className="artm-wide"><span>Tên bài học</span><input value={lesson.title} onChange={(e) => updateModuleLesson(group, lessonIndex, { title: e.target.value })} /></label>
                    <label className="artm-wide"><span>Nội dung bài học</span><textarea rows={2} value={lesson.description} onChange={(e) => updateModuleLesson(group, lessonIndex, { description: e.target.value })} /></label>
                    <label className="artm-wide"><span>Mục tiêu của bài học</span><textarea rows={2} value={lesson.learningObjective} onChange={(e) => updateModuleLesson(group, lessonIndex, { learningObjective: e.target.value })} /></label>
                    <label><span>Thời lượng phút</span><input type="number" min={0} value={lesson.estimatedMinutes ?? ""} onChange={(e) => updateModuleLesson(group, lessonIndex, { estimatedMinutes: e.target.value ? Number(e.target.value) : null })} /></label>
                  </div>
                </article>
              ))}
            </div>
            <div className="artm-module-editor">
              <div className="artm-section-head">
                <div>
                  <h4>Bài tập bắt buộc</h4>
                  <p>Bài tập phải yêu cầu người học vận dụng nhiều skill trong module, không kiểm tra từng skill rời rạc.</p>
                </div>
                <button type="button" onClick={() => addModuleExercise(group)}><Plus size={16} /> Thêm bài tập</button>
              </div>
              {exercises.length === 0 ? (
                <div className="artm-ready"><AlertTriangle size={16} /> Chưa có bài tập. Module cần bài tập hoặc minh chứng để đánh giá.</div>
              ) : exercises.map((exercise, exerciseIndex) => (
                <article className="artm-activity-card" key={`${group.localId}-exercise-${exerciseIndex}`}>
                  <div className="artm-activity-head">
                    <div>
                      <strong>Bài tập {exerciseIndex + 1}</strong>
                      <span>{exercise.title || "Chưa đặt tên"}</span>
                    </div>
                    <button type="button" title="Xóa bài tập" onClick={() => removeModuleExercise(group, exerciseIndex)}><Trash2 size={16} /></button>
                  </div>
                  <div className="artm-activity-form">
                    <label className="artm-wide"><span>Tên bài tập</span><input value={exercise.title} onChange={(e) => updateModuleExercise(group, exerciseIndex, { title: e.target.value })} /></label>
                    <label className="artm-wide"><span>Yêu cầu thực hiện</span><textarea rows={2} value={exercise.instruction} onChange={(e) => updateModuleExercise(group, exerciseIndex, { instruction: e.target.value })} /></label>
                    <label className="artm-wide"><span>Đầu ra cần nộp</span><textarea rows={2} value={exercise.expectedOutput} onChange={(e) => updateModuleExercise(group, exerciseIndex, { expectedOutput: e.target.value })} /></label>
                    <div className="artm-wide"><RubricListEditor value={exercise.rubric} onChange={(val) => updateModuleExercise(group, exerciseIndex, { rubric: val })} label="Rubric chấm điểm (N Rubrics)" /></div>
                    <label><span>Bắt buộc</span><select value={exercise.required ? "true" : "false"} onChange={(e) => updateModuleExercise(group, exerciseIndex, { required: e.target.value === "true" })}>
                      <option value="true">Bắt buộc</option>
                      <option value="false">Khuyến nghị</option>
                    </select></label>
                  </div>
                </article>
              ))}
            </div>
            <div className="artm-activity-form">
              <label className="artm-wide"><span>Đầu ra mong đợi của module</span><textarea rows={3} value={group.expectedOutput || ""} onChange={(e) => updateNodeGroup(group.localId, { expectedOutput: e.target.value })} /></label>
              <label className="artm-wide"><span>Tiêu chí hoàn thành module</span><textarea rows={3} value={group.completionCriteria || ""} onChange={(e) => updateNodeGroup(group.localId, { completionCriteria: e.target.value })} /></label>
              <div className="artm-wide"><RubricListEditor value={group.rubric || ""} onChange={(val) => updateNodeGroup(group.localId, { rubric: val })} label="Rubric tổng của module (N Rubrics)" /></div>
              <label className="artm-wide"><span>Gợi ý cho AI khi sinh nội dung</span><textarea rows={2} value={group.aiPromptHint || ""} onChange={(e) => updateNodeGroup(group.localId, { aiPromptHint: e.target.value })} /></label>
            </div>
          </section>
        );
      })}
    </div>
  );
  const renderCourses = () => (
    <div className="artm-skill-stack">
      {visibleSkillBlocks.map((block) => (
        <section className="artm-skill-card" key={block.localId}>
          <div className="artm-section-head">
            <div>
              <h3>{block.skillNameSnapshot}</h3>
              <p>Chọn khóa học PUBLIC thật trong hệ thống cho skill này. Course được lưu theo skill và đưa vào suggested_course_ids khi sinh roadmap.</p>
            </div>
            <button type="button" onClick={() => void loadCourseCandidates(block)}><BookOpen size={16} /> Xem khóa học gợi ý</button>
          </div>
          <div className="artm-panel-grid">
            <label><span>Chính sách gắn khóa học</span><select value={block.courseLinkPolicy} onChange={(e) => updateBlock(block.localId, { courseLinkPolicy: e.target.value as RoadmapTemplateCourseLinkPolicy })}>
              <option value="MANUAL_ONLY">Chỉ chọn thủ công</option>
              <option value="AUTO_NEWEST">Tự động lấy khóa mới nhất</option>
              <option value="AUTO_POPULAR">Tự động lấy khóa nhiều học viên</option>
              <option value="AUTO_HYBRID">Kết hợp tự động và thủ công</option>
            </select></label>
            <label><span>Giới hạn khóa tự động</span><input type="number" min={1} max={10} value={block.autoCourseLimit ?? 2} onChange={(e) => updateBlock(block.localId, { autoCourseLimit: Number(e.target.value) })} /></label>
            <label><span>Quyền dùng tài liệu nội bộ</span><select value={block.ragEnabled ? "true" : "false"} onChange={(e) => updateBlock(block.localId, { ragEnabled: e.target.value === "true" })}>
              <option value="true">Cho phép khi chạy AI nội bộ</option>
              <option value="false">Không cho phép</option>
            </select></label>
            <label className="artm-wide"><span>Gợi ý truy vấn tài liệu</span><textarea rows={2} value={block.ragQueryHint || ""} onChange={(e) => updateBlock(block.localId, { ragQueryHint: e.target.value })} /></label>
          </div>
          <div className="artm-course-search">
            <label>
              <span>Tìm khóa học PUBLIC</span>
              <input
                value={courseSearchQuery[block.skillId] || ""}
                onChange={(e) =>
                  setCourseSearchQuery((current) => ({
                    ...current,
                    [block.skillId]: e.target.value,
                  }))
                }
                placeholder="Nhập tên khóa học"
              />
            </label>
            <button type="button" onClick={() => void searchPublicCourses(block)} disabled={searchingCourseSkillId === block.skillId}>
              {searchingCourseSkillId === block.skillId ? <Loader2 className="artm-spin" size={16} /> : <Search size={16} />}
              Tìm
            </button>
          </div>
          <div className="artm-course-selected-strip">
            {block.selectedCourseIds.length === 0 ? (
              <span>Chưa chọn khóa học thủ công cho skill này.</span>
            ) : block.selectedCourseIds.map((courseId) => {
              const course = courseOptionsBySkill[block.skillId]?.find((item) => item.courseId === courseId);
              return (
                <button type="button" key={courseId} onClick={() => toggleSelectedCourse(block, courseId)}>
                  #{courseId} {course?.title || "Khóa học"} <Trash2 size={14} />
                </button>
              );
            })}
          </div>
          <div className="artm-course-grid">
            {(courseOptionsBySkill[block.skillId] || []).map((course) => {
              const selected = block.selectedCourseIds.includes(course.courseId);
              return (
                <article
                  className={`artm-course-card ${selected ? "artm-course-card--selected" : ""}`}
                  key={course.courseId}
                >
                  <button
                    type="button"
                    className="artm-course-card__select"
                    onClick={() => toggleSelectedCourse(block, course.courseId)}
                  >
                    <div className="artm-course-card__avatar">
                      {course.thumbnailUrl ? (
                        <img src={course.thumbnailUrl} alt="" />
                      ) : (
                        <span>{(course.title || "K").trim().charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="artm-course-card__copy">
                      <strong>#{course.courseId} {course.title}</strong>
                      <span>{course.level || "Chưa có cấp độ"} | {course.category || "Chưa có danh mục"}</span>
                      <small>{course.enrollmentCount || 0} học viên</small>
                    </div>
                  </button>
                  <div className="artm-course-card__actions">
                    <button type="button" onClick={() => toggleSelectedCourse(block, course.courseId)}>
                      {selected ? "Bỏ chọn" : "Chọn"}
                    </button>
                    <button type="button" onClick={() => navigate(`/admin/courses/${course.courseId}/preview`)}>
                      <Eye size={14} /> Chi tiết
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );

  const renderPreview = () => (
    <div className="artm-publish-grid">
      <section className="artm-table-panel">
        <div className="artm-section-head">
          <div>
            <h3>Coverage target</h3>
            <p>{backendPreview ? "Kết quả từ máy chủ" : "Tính nhanh tại trình duyệt"}</p>
          </div>
          <button type="button" onClick={() => void runPreview()}><SlidersHorizontal size={16} /> Xem trước từ máy chủ</button>
        </div>
        <div className="artm-preview-list">
          {form.skillBlocks.map((block) => {
            const backendItem = backendPreview?.items?.find((item) => item.skillId === block.skillId);
            return (
              <div className="artm-preview-row" key={block.localId}>
                <span>{block.skillNameSnapshot}</span>
                <strong>Đã gán vào {backendItem?.allocatedNodes ?? getAllocatedNodes(block)} module</strong>
              </div>
            );
          })}
        </div>
      </section>
      <section className="artm-table-panel">
        <div className="artm-section-head">
          <div>
            <h3>Kiểm tra hợp lệ</h3>
            <p>{readinessErrors.length === 0 ? "Sẵn sàng lưu và xuất bản" : `${readinessErrors.length} vấn đề`}</p>
          </div>
          <button type="button" onClick={() => void runValidation()}><ClipboardCheck size={16} /> Kiểm tra</button>
        </div>
        <div className="artm-error-list">
          {coverageWarnings.map((warning) => <div key={warning}>{warning}</div>)}
          {readinessErrors.length === 0 ? (
            <div className="artm-ready"><CheckCircle2 size={18} /> Cấu trúc mẫu đã sẵn sàng.</div>
          ) : readinessErrors.map((error) => <div key={error}>{error}</div>)}
        </div>
      </section>
    </div>
  );

  const renderBuilder = () => (
    <div className="artm-builder">
      <header className="artm-builder-topbar">
        <div>
          <button type="button" className="artm-ghost" onClick={openLibrary}><ArrowLeft size={16} /> Kho mẫu</button>
          <span>Mẫu lộ trình / Trình tạo</span>
          <h1>{form.editingId ? "Chỉnh sửa mẫu lộ trình" : "Tạo mẫu lộ trình"}</h1>
          <p>Mẫu là khung năng lực. Mục tiêu, nhóm người học và cấp độ cá nhân hóa sẽ lấy từ hành trình và bài đánh giá khi sinh lộ trình.</p>
        </div>
        <div className="artm-header-actions">
          <button type="button" onClick={() => void runValidation()}><ClipboardCheck size={16} /> Kiểm tra</button>
          <button type="button" onClick={() => void saveTemplate()} disabled={saving}>
            {saving ? <Loader2 className="artm-spin" size={16} /> : <Save size={16} />} Lưu nháp
          </button>
          <button type="button" className="artm-primary" onClick={() => void publishTemplate()} disabled={saving || Boolean(actionId)}>
            <Rocket size={16} /> Xuất bản
          </button>
        </div>
      </header>

      <section className={`artm-builder-shell ${shouldShowSkillSelector ? "" : "artm-builder-shell--single"}`}>
        <main className="artm-builder-main">
          <nav className="artm-tabs">
            {moduleBuilderTabs.map((tab) => (
              <button key={tab.key} type="button" className={activeTab === tab.key ? "active" : ""} onClick={() => setActiveTab(tab.key)}>
                {tab.label}
              </button>
            ))}
          </nav>
          <section className="artm-workspace">
            {activeTab === "overview" && renderOverview()}
            {activeTab === "allocation" && renderAllocation()}
            {activeTab === "grouping" && renderGrouping()}
            {activeTab === "activities" && renderNodeGroupActivities()}
            {activeTab === "courses" && renderCourses()}
            {activeTab === "preview" && renderPreview()}
          </section>
        </main>
        {shouldShowSkillSelector && <aside className="artm-inspector artm-inspector--builder">
          <h2>Chọn kỹ năng</h2>
          <button
            type="button"
            className={`artm-skill-filter ${!activeSkillBlockId ? "artm-skill-filter--active" : ""}`}
            onClick={() => setActiveSkillBlockId(null)}
          >
            <span>Tất cả kỹ năng</span>
            <strong>{form.skillBlocks.reduce((sum, block) => sum + getAllocatedNodes(block), 0)} node</strong>
          </button>
          <div className="artm-skill-filter-list">
            {form.skillBlocks.map((block) => {
              const allocatedNodes = getAllocatedNodes(block);
              const delta = block.activities.length - allocatedNodes;
              const status =
                delta === 0
                  ? "Đủ lesson"
                  : delta < 0
                    ? `Thiếu ${Math.abs(delta)}`
                    : `Thừa ${delta}`;
              return (
                <button
                  type="button"
                  key={block.localId}
                  className={`artm-skill-filter ${activeSkillBlockId === block.localId ? "artm-skill-filter--active" : ""} ${delta === 0 ? "artm-skill-filter--ok" : "artm-skill-filter--warn"}`}
                  onClick={() => setActiveSkillBlockId(block.localId)}
                >
                  <span>{block.skillNameSnapshot}</span>
                  <strong>{allocatedNodes} node / {block.activities.length} lesson</strong>
                  <small>{status}</small>
                </button>
              );
            })}
          </div>
          <div className="artm-inspector-list">
            {readinessErrors.length === 0 ? (
              <div className="artm-ready"><CheckCircle2 size={18} /> Không có lỗi kiểm tra nhanh.</div>
            ) : readinessErrors.slice(0, 10).map((error) => <div key={error}>{error}</div>)}
          </div>
        </aside>}
      </section>
    </div>
  );

  return (
    <div className={`admin-roadmap-template-studio artm-mode-${viewMode}`}>
      {viewMode === "library" ? renderLibrary() : renderBuilder()}
    </div>
  );
};

export default AdminRoadmapTemplateManager;
