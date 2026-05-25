import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Archive,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  Edit3,
  Eye,
  Loader2,
  Lock,
  Plus,
  RefreshCw,
  Rocket,
  Save,
  Search,
  Trash2,
  X,
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
import { PinnedDocSelectModal } from "./ai-knowledge/PinnedDocSelectModal";
import { getAdminAiKnowledgeDocumentDetail } from "../../services/aiKnowledgeService";
import "./AdminRoadmapTemplateManager.css";


type ViewMode = "library" | "builder";
type BuilderTab = "overview" | "allocation" | "grouping" | "activities" | "courses" | "finalAssessment" | "preview";

type BuilderStep = {
  key: BuilderTab;
  title: string;
  description: string;
};

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

const moduleBuilderTabs: BuilderStep[] = [
  { key: "overview", title: "Thông tin cơ bản", description: "Tên mẫu, định hướng lộ trình học tập và chính sách sinh học liệu" },
  { key: "allocation", title: "Phân bổ Trọng số Năng lực", description: "Cấu hình tỷ trọng kỹ năng và phân bổ số Node cần bao phủ" },
  { key: "grouping", title: "Cấu trúc Node & Kỹ năng", description: "Thiết kế các Node học tập tích hợp và ánh xạ kỹ năng chuẩn đầu ra" },
  { key: "activities", title: "Nội dung Node Chi tiết", description: "Thiết kế bài học thành phần, nhiệm vụ thực hành và tiêu chí nghiệm thu" },
  { key: "courses", title: "Học liệu & Khóa học liên kết", description: "Liên kết khóa học tiêu chuẩn, cấu hình RAG và tài liệu ghim" },
  { key: "finalAssessment", title: "Đánh giá Năng lực Tổng hợp", description: "Xây dựng đề án tốt nghiệp lộ trình và AI chấm minh chứng tự động" },
  { key: "preview", title: "Thẩm định & Xuất bản", description: "Rà soát mức độ hoàn thiện lộ trình đào tạo và phê duyệt xuất bản" },
];

const exerciseRequirementOptions = [
  { value: "REQUIRED_EVERY_NODE", label: "Bắt buộc mỗi Node có dự án thực hành & minh chứng đánh giá" },
  { value: "REQUIRED_MAIN_NODE", label: "Chỉ bắt buộc tại các Node năng lực cốt lõi" },
];

const topicGenerationTypeOptions = [
  { value: "LEVEL_BAND_AND_ASSESSMENT_GAP", label: "Tối ưu hóa theo Cấp độ năng lực & Khoảng trống kỹ năng chuẩn chẩn đoán" },
  { value: "GOAL_DRIVEN_JOB_READY", label: "Theo Mục tiêu nghề nghiệp & Bộ sản phẩm đầu ra hoàn chỉnh" },
  { value: "FOUNDATION_FIRST", label: "Nâng cao tuần tự từ Khái niệm nền tảng đến Thực chiến chuyên sâu" },
  { value: "REVIEW_AND_INTERVIEW", label: "Hệ thống hóa kiến thức tổng hợp & Luyện phản xạ phỏng vấn tuyển dụng" },
  { value: "NEXT_LEVEL_COMPLEXITY", label: "Tăng dần độ phức tạp kỹ thuật để nâng cấp trình độ chuyên môn" },
];

const timeBudgetPolicyOptions = [
  { value: "DIFFICULTY_AND_COMPLEXITY", label: "Tự động phân bổ thời lượng theo độ khó & độ phức tạp của bài học" },
  { value: "COMPACT_PRACTICE", label: "Tối ưu hóa thời lượng, tập trung bài tập thực tế nhỏ gọn" },
  { value: "DEEP_PROJECT", label: "Tập trung vào Đề án lớn, chấp nhận thời gian học sâu rộng" },
];

const requirementTypeLabels: Record<string, string> = {
  REQUIRED: "Bắt buộc",
  IMPORTANT: "Quan trọng",
  NICE_TO_HAVE: "Nên có",
};

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
  if (normalized.includes("node group has only one skill")) {
    const label = message.includes(":") ? message.split(":").slice(1).join(":").trim() : "";
    return label
      ? `${label}: node chỉ có 1 kỹ năng, nên gắn thêm kỹ năng liên quan.`
      : "Có node chỉ có 1 kỹ năng, nên gắn thêm kỹ năng liên quan.";
  }
  if (normalized.includes("consider grouping related skills")) {
    return "Nên gắn các kỹ năng liên quan vào cùng một node học thực tế.";
  }
  if (normalized.includes("skill") && normalized.includes("not assigned")) {
    return "Có kỹ năng chưa được gắn vào node học.";
  }
  if (normalized.includes("allocated") && normalized.includes("0")) {
    return "Có kỹ năng chưa được gắn vào node học.";
  }
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

const getSuggestionTargetStep = (message: string): BuilderTab => {
  const normalized = message.toLowerCase();
  if (
    normalized.includes("node") ||
    normalized.includes("kỹ năng liên quan") ||
    normalized.includes("chưa được gắn") ||
    normalized.includes("checklist")
  ) {
    return "grouping";
  }
  if (normalized.includes("bài học") || normalized.includes("bài tập") || normalized.includes("tiêu chí chấm điểm của node")) {
    return "activities";
  }
  if (normalized.includes("bài đánh giá cuối") || normalized.includes("ai chấm")) {
    return "finalAssessment";
  }
  return "preview";
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
        required: true,
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

const defaultModuleLesson = (orderIndex: number, moduleTitle = "node học"): ModuleLessonDraft => ({
  title: `Bài học ${orderIndex}`,
  description: `Nội dung hướng dẫn chính của ${moduleTitle}.`,
  learningObjective: "Người học hiểu và áp dụng được các kỹ năng trong node học.",
  estimatedMinutes: 60,
});

const defaultModuleExercise = (orderIndex: number, moduleTitle = "node học"): ModuleExerciseDraft => ({
  title: `Bài tập ${orderIndex}`,
  instruction: `Thực hành tích hợp các kỹ năng trong ${moduleTitle}.`,
  expectedOutput: "Sản phẩm hoặc minh chứng học tập có thể đánh giá.",
  rubric: "Hoàn thành đúng yêu cầu, giải thích được cách làm và liên kết được với kỹ năng trong node học.",
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
  nodeKey: group.nodeKey || `node-${orderIndex}`,
  title: group.title || `Node học ${orderIndex}`,
  description: group.description || "",
  learningObjectives: group.learningObjectives || "",
  lessonsJson: group.lessonsJson || serializeModuleLessons([defaultModuleLesson(1, group.title || `Node học ${orderIndex}`)]),
  exercisesJson: group.exercisesJson || serializeModuleExercises([defaultModuleExercise(1, group.title || `Node học ${orderIndex}`)]),
  completionCriteria: group.completionCriteria || group.rubric || "",
  expectedOutput: group.expectedOutput || "",
  rubric: group.rubric || "",
  difficulty: group.difficulty || "medium",
  estimatedHours: group.estimatedHours ?? 4,
  aiPromptHint: group.aiPromptHint || "",
  orderIndex: group.orderIndex ?? orderIndex,
  skills: (group.skills || []).map((skill, index) => makeNodeGroupSkill(skill, index + 1)),
  pinnedDocumentIds: group.pinnedDocumentIds || null,
});

const defaultNodeGroup = (orderIndex: number): NodeGroupDraft => ({
  localId: `node-group-new-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  nodeKey: `node-${orderIndex}`,
  title: `Node học ${orderIndex}`,
  description: "",
  learningObjectives: "",
  lessonsJson: serializeModuleLessons([defaultModuleLesson(1, `Node học ${orderIndex}`)]),
  exercisesJson: serializeModuleExercises([defaultModuleExercise(1, `Node học ${orderIndex}`)]),
  completionCriteria: "",
  expectedOutput: "",
  rubric: "",
  difficulty: "medium",
  estimatedHours: 4,
  aiPromptHint: "",
  orderIndex,
  skills: [],
  pinnedDocumentIds: null,
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
  minNodes: null,
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
        weightPercent: Number(existing.weightPercent) || weightPercent,
        minNodes: existing.minNodes ?? null,
      };
    }
    return buildSkillBlockFromTrackSkill(skill, weightPercent);
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
  nodeCountOverride: null,
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
  const [activeNodeGroupId, setActiveNodeGroupId] = useState<string | null>(null);
  const [highlightNodeGroupId, setHighlightNodeGroupId] = useState<string | null>(null);
  const [stepErrors, setStepErrors] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<RoadmapTemplateStatus | "">("");
  const [domainFilter, setDomainFilter] = useState("");
  const [jobPositionFilter, setJobPositionFilter] = useState("");
  const [trackFilter, setTrackFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState<number | null>(null);
  const [autoGrouping, setAutoGrouping] = useState(false);
  const [nodeSuggestionCount, setNodeSuggestionCount] = useState(0);
  const [showTrackSkillRedirect, setShowTrackSkillRedirect] = useState(false);
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

  // States for Pinned Documents Selection
  const [pinnedDocModalOpen, setPinnedDocModalOpen] = useState(false);
  const [pinnedDocModalNodeLocalId, setPinnedDocModalNodeLocalId] = useState<string | null>(null);
  const [documentNamesCache, setDocumentNamesCache] = useState<Record<number, string>>({});

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

  const computedNodeCount = form.nodeGroups.length;

  const actualNodeAllocation = useMemo(() => {
    const result = new Map<number, number>();
    form.nodeGroups.forEach((group) => {
      const countedInGroup = new Set<number>();
      group.skills.forEach((skill) => {
        if (!skill.skillId || countedInGroup.has(skill.skillId)) return;
        countedInGroup.add(skill.skillId);
        result.set(skill.skillId, (result.get(skill.skillId) || 0) + 1);
      });
    });
    return result;
  }, [form.nodeGroups]);

  const nodeWeightsAndPercentages = useMemo(() => {
    if (form.nodeGroups.length === 0) return { weights: new Map<string, number>(), percentages: new Map<string, number>() };

    const getRequirementFactor = (difficulty: string, type: string) => {
      const diff = (difficulty || "medium").trim().toLowerCase();
      const req = type || "REQUIRED";
      
      if (diff === "advanced") {
        if (req === "REQUIRED") return 1.5;
        if (req === "IMPORTANT") return 0.8;
        return 0.3;
      } else if (diff === "beginner") {
        if (req === "REQUIRED") return 1.0;
        if (req === "IMPORTANT") return 0.8;
        return 0.5;
      } else {
        // medium / intermediate
        if (req === "REQUIRED") return 1.2;
        if (req === "IMPORTANT") return 0.7;
        return 0.4;
      }
    };

    const skillBlockMap = new Map(form.skillBlocks.map(b => [b.skillId, b]));
    
    // 1. Calculate raw weight for each node group
    const rawWeights = form.nodeGroups.map(group => {
      if (group.skills.length === 0) {
        return { localId: group.localId, rawWeight: 1.0 }; // Baseline for empty node
      }
      
      let sum = 0;
      group.skills.forEach(s => {
        const block = skillBlockMap.get(s.skillId);
        const globalWeight = block?.weightPercent || 10.0;
        const factor = getRequirementFactor(group.difficulty || "medium", s.requirementType || "REQUIRED");
        sum += globalWeight * factor;
      });
      
      return { localId: group.localId, rawWeight: Math.max(0.1, sum) };
    });

    const totalRawWeight = rawWeights.reduce((sum, item) => sum + item.rawWeight, 0);
    
    const weightsMap = new Map<string, number>();
    const percentagesMap = new Map<string, number>();
    
    if (totalRawWeight <= 0) {
      const equalShare = 100 / form.nodeGroups.length;
      form.nodeGroups.forEach(g => {
        weightsMap.set(g.localId, 1.0);
        percentagesMap.set(g.localId, equalShare);
      });
    } else {
      let sumPercentages = 0;
      const sortedRawWeights = [...rawWeights].sort((a, b) => b.rawWeight - a.rawWeight);
      
      rawWeights.forEach(item => {
        const percent = Math.round((item.rawWeight / totalRawWeight) * 10000) / 100;
        weightsMap.set(item.localId, item.rawWeight);
        percentagesMap.set(item.localId, percent);
        sumPercentages += percent;
      });

      // Rounding delta correction
      const delta = Math.round((100 - sumPercentages) * 100) / 100;
      if (Math.abs(delta) >= 0.01 && sortedRawWeights.length > 0) {
        const maxItem = sortedRawWeights[0];
        const currentVal = percentagesMap.get(maxItem.localId) || 0;
        percentagesMap.set(maxItem.localId, Math.round((currentVal + delta) * 100) / 100);
      }
    }

    return { weights: weightsMap, percentages: percentagesMap };
  }, [form.nodeGroups, form.skillBlocks]);

  const getAllocatedNodes = useCallback(
    (block: SkillBlockDraft) => actualNodeAllocation.get(block.skillId) ?? 0,
    [actualNodeAllocation],
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

  const activeNodeGroup = useMemo(() => {
    const selected = form.nodeGroups.find((group) => group.localId === activeNodeGroupId);
    return selected || form.nodeGroups[0] || null;
  }, [activeNodeGroupId, form.nodeGroups]);

  const assignedSkillIds = useMemo(() => new Set(
    moduleItems.flatMap((item) => item.skills.map((skill) => skill.skillId).filter(Boolean) as number[]),
  ), [moduleItems]);

  const coverageWarnings = useMemo(() => {
    const warnings: string[] = [];
    moduleItems.forEach((item) => {
      if (item.skills.length === 1 && !item.activity.title.toLowerCase().includes("testing basics")) {
        warnings.push(`${item.activity.title}: node chỉ có 1 kỹ năng, nên gắn thêm kỹ năng liên quan.`);
      }
      if (item.skills.length > 7) {
        warnings.push(`${item.activity.title}: node có quá 7 kỹ năng, nên tách nhỏ hơn.`);
      }
    });
    trackSkills.forEach((skill) => {
      if (skill.requirementType === "NICE_TO_HAVE" && !assignedSkillIds.has(skill.skillId)) {
        warnings.push(`${skill.skillName}: kỹ năng khuyến nghị chưa được gắn, có thể bỏ nếu lộ trình quá dài.`);
      }
    });
    const singleSkillCount = moduleItems.filter((item) => item.skills.length === 1).length;
    if (moduleItems.length >= 3 && singleSkillCount >= Math.ceil(moduleItems.length * 0.7)) {
      warnings.push("Lộ trình đang giống checklist kỹ năng. Hãy gắn các kỹ năng liên quan vào cùng một node học thực tế.");
    }
    if (validation?.warnings?.length) warnings.push(...validation.warnings.map(localizeTemplateMessage));
    return Array.from(new Set(warnings));
  }, [assignedSkillIds, moduleItems, trackSkills, validation]);

  const shouldShowSkillSelector = false;

  const getStepValidationErrors = useCallback((step: BuilderTab) => {
    const errors: string[] = [];
    if (step === "overview") {
      if (!form.title.trim()) errors.push("Cần nhập tên mẫu lộ trình.");
      if (!form.domainId) errors.push("Cần chọn lĩnh vực.");
      if (!form.jobPositionId) errors.push("Cần chọn vị trí công việc.");
      if (!form.jobPositionTrackId) errors.push("Cần chọn nhánh lộ trình.");
      if (!form.outputLanguage) errors.push("Cần chọn ngôn ngữ đầu ra.");
      if (!form.exerciseRequirement) errors.push("Cần chọn chính sách bài tập bắt buộc.");
      if (!form.topicGenerationType) errors.push("Cần chọn cách AI chọn chủ đề học.");
      if (!form.timeBudgetPolicy) errors.push("Cần chọn cách ước tính thời lượng.");
    }
    if (step === "allocation") {
      if (form.skillBlocks.length === 0) errors.push("Cần có ít nhất một kỹ năng ưu tiên.");
    }
    if (step === "grouping") {
      if (form.nodeGroups.length === 0) errors.push("Cần tạo ít nhất một node học.");
      const unassignedSkills = form.skillBlocks.filter((block) => !assignedSkillIds.has(block.skillId));
      if (unassignedSkills.length > 0) {
        errors.push(`Còn ${unassignedSkills.length} kỹ năng chưa được gắn vào node học.`);
      }
      form.nodeGroups.forEach((group, index) => {
        const label = group.title?.trim() || `Node học ${index + 1}`;
        if (!group.title.trim()) errors.push(`Node học ${index + 1} cần có tên.`);
        if (group.skills.length === 0) errors.push(`${label} cần có ít nhất một kỹ năng.`);
        if (group.skills.length > 7) errors.push(`${label} có quá nhiều kỹ năng, cần tách node.`);
      });
    }
    if (step === "activities") {
      if (form.nodeGroups.length === 0) errors.push("Cần tạo node học trước khi chỉnh nội dung.");
      form.nodeGroups.forEach((group, index) => {
        const label = group.title?.trim() || `Node học ${index + 1}`;
        const lessons = getModuleLessons(group);
        const exercises = getModuleExercises(group);
        if (!group.title.trim()) errors.push(`${label} cần có tên.`);
        if (!group.learningObjectives?.trim()) errors.push(`${label} cần có mục tiêu học tập.`);
        if (lessons.length === 0) errors.push(`${label} cần có ít nhất một bài học.`);
        lessons.forEach((lesson, lessonIndex) => {
          if (!lesson.title.trim()) errors.push(`${label}: bài học ${lessonIndex + 1} cần có tên.`);
          if (!lesson.description.trim()) errors.push(`${label}: bài học ${lessonIndex + 1} cần có nội dung.`);
          if (!lesson.learningObjective.trim()) errors.push(`${label}: bài học ${lessonIndex + 1} cần có mục tiêu.`);
        });
        if (exercises.length === 0) errors.push(`${label} cần có ít nhất một bài tập hoặc minh chứng.`);
        exercises.forEach((exercise, exerciseIndex) => {
          if (!exercise.title.trim()) errors.push(`${label}: bài tập ${exerciseIndex + 1} cần có tên.`);
          if (!exercise.instruction.trim()) errors.push(`${label}: bài tập ${exerciseIndex + 1} cần có yêu cầu thực hiện.`);
          if (!exercise.expectedOutput.trim()) errors.push(`${label}: bài tập ${exerciseIndex + 1} cần có đầu ra cần nộp.`);
          if (!exercise.rubric.trim()) errors.push(`${label}: bài tập ${exerciseIndex + 1} cần có tiêu chí chấm điểm.`);
        });
        if (!group.expectedOutput?.trim()) errors.push(`${label} cần có đầu ra mong đợi.`);
        if (!group.completionCriteria?.trim()) errors.push(`${label} cần có tiêu chí hoàn thành.`);
        if (!group.rubric?.trim()) errors.push(`${label} cần có tiêu chí chấm điểm của node.`);
      });
    }
    if (step === "finalAssessment") {
      if (!form.finalAssignmentInstructions.trim()) errors.push("Cần nhập hướng dẫn bài đánh giá cuối lộ trình.");
      if (!form.finalAssignmentRubric.trim()) errors.push("Cần có tiêu chí chấm bài đánh giá cuối lộ trình.");
    }
    return Array.from(new Set(errors));
  }, [assignedSkillIds, form]);

  const readinessErrors = useMemo(() => {
    const errors = moduleBuilderTabs
      .filter((step) => step.key !== "courses" && step.key !== "preview")
      .flatMap((step) => getStepValidationErrors(step.key));
    if (backendPreview?.errors?.length) {
      errors.push(...backendPreview.errors.map(localizeTemplateMessage));
    }
    if (validation?.errors?.length) {
      errors.push(...validation.errors.map(localizeTemplateMessage));
    }
    return Array.from(new Set(errors));
  }, [backendPreview, getStepValidationErrors, validation]);

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
      totalNodeCount: computedNodeCount,
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
        nodeCountOverride: null,
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
        nodeKey: group.nodeKey || `node-${index + 1}`,
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
        pinnedDocumentIds: group.pinnedDocumentIds || null,
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
  }, [computedNodeCount, form]);

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
          const trackSkillIds = new Set(sorted.map((skill) => skill.skillId));
          const existingTrackBlocks = current.skillBlocks.filter((block) => trackSkillIds.has(block.skillId));
          return {
            ...current,
            skillBlocks: applyTrackSkillPriorityToBlocks(existingTrackBlocks, sorted),
            nodeGroups: current.nodeGroups.map((group) => ({
              ...group,
              skills: group.skills.filter((skill) => skill.skillId && trackSkillIds.has(skill.skillId)),
            })),
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

  useEffect(() => {
    setActiveNodeGroupId((current) => {
      if (current && form.nodeGroups.some((group) => group.localId === current)) {
        return current;
      }
      return form.nodeGroups[0]?.localId ?? null;
    });
  }, [form.nodeGroups]);

  // Prefetch document titles for any pinned document IDs that are missing from cache
  useEffect(() => {
    const allPinnedIds = Array.from(
      new Set(
        form.nodeGroups.flatMap((group) => {
          if (!group.pinnedDocumentIds) return [];
          try {
            const parsed = JSON.parse(group.pinnedDocumentIds);
            return Array.isArray(parsed) ? parsed.map(Number) : [];
          } catch {
            return [];
          }
        })
      )
    );

    const missingIds = allPinnedIds.filter((id) => !documentNamesCache[id]);

    if (missingIds.length === 0) return;

    missingIds.forEach((id) => {
      void getAdminAiKnowledgeDocumentDetail(id)
        .then((doc) => {
          if (doc && doc.title) {
            setDocumentNamesCache((prev) => ({
              ...prev,
              [id]: doc.title,
            }));
          }
        })
        .catch((err) => {
          console.error(`Failed to fetch title for document #${id}`, err);
          // Prevent infinite refetches by writing a placeholder in cache
          setDocumentNamesCache((prev) => ({
            ...prev,
            [id]: `Tài liệu #${id}`,
          }));
        });
    });
  }, [form.nodeGroups, documentNamesCache]);

  const parsePinnedDocIds = (jsonStr: string | undefined | null): number[] => {
    if (!jsonStr || !jsonStr.trim()) return [];
    try {
      const parsed = JSON.parse(jsonStr);
      return Array.isArray(parsed) ? parsed.map(Number) : [];
    } catch {
      return [];
    }
  };

  const serializePinnedDocIds = (ids: number[]): string | null => {
    return ids.length > 0 ? JSON.stringify(ids) : null;
  };

  const handleOpenPinnedDocSelect = (group: NodeGroupDraft) => {
    setPinnedDocModalNodeLocalId(group.localId);
    setPinnedDocModalOpen(true);
  };

  const handleApplyPinnedDocs = (ids: number[], docMap?: Record<number, string>) => {
    if (!pinnedDocModalNodeLocalId) return;
    
    // Update name cache
    if (docMap) {
      setDocumentNamesCache((prev) => ({
        ...prev,
        ...docMap,
      }));
    }

    clearServerChecks();
    setForm((current) => ({
      ...current,
      nodeGroups: current.nodeGroups.map((group) => {
        if (group.localId !== pinnedDocModalNodeLocalId) return group;
        return {
          ...group,
          pinnedDocumentIds: serializePinnedDocIds(ids),
        };
      }),
    }));
  };

  const handleUnpinDocument = (groupLocalId: string, docId: number) => {
    clearServerChecks();
    setForm((current) => ({
      ...current,
      nodeGroups: current.nodeGroups.map((group) => {
        if (group.localId !== groupLocalId) return group;
        const currentIds = parsePinnedDocIds(group.pinnedDocumentIds);
        const nextIds = currentIds.filter((id) => id !== docId);
        return {
          ...group,
          pinnedDocumentIds: serializePinnedDocIds(nextIds),
        };
      }),
    }));
  };

  const openLibrary = () => {
    setViewMode("library");
    setActiveTab("overview");
    setStepErrors([]);
    setValidation(null);
    setBackendPreview(null);
    setActiveSkillBlockId(null);
    setActiveNodeGroupId(null);
    setHighlightNodeGroupId(null);
    setNodeSuggestionCount(0);
  };

  const openCreate = () => {
    setForm(emptyForm());
    setValidation(null);
    setBackendPreview(null);
    setCourseCandidates({});
    setCourseSearchQuery({});
    setCourseSearchResults({});
    setActiveSkillBlockId(null);
    setActiveNodeGroupId(null);
    setHighlightNodeGroupId(null);
    setNodeSuggestionCount(0);
    setStepErrors([]);
    setActiveTab("overview");
    setViewMode("builder");
  };

  const openEdit = (template: RoadmapTemplateResponse) => {
    setValidation(null);
    setBackendPreview(template.allocationPreview || null);
    setCourseCandidates({});
    setCourseSearchQuery({});
    setCourseSearchResults({});
    setStepErrors([]);
    setHighlightNodeGroupId(null);
    setNodeSuggestionCount(template.nodeGroups?.length || template.totalNodeCount || Math.max(template.nodes?.length || 0, 0));
    setForm({
      editingId: template.id,
      title: template.title,
      description: template.description || "",
      domainId: String(template.domainId || ""),
      jobPositionId: String(template.jobPositionId || ""),
      jobPositionTrackId: String(template.jobPositionTrackId || ""),
      totalNodeCount: template.nodeGroups?.length || template.totalNodeCount || Math.max(template.nodes?.length || 0, 0),
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
      nodeGroups: current.nodeGroups.map((group, index) => ({
        ...group,
        id: undefined,
        localId: `copy-node-${index + 1}-${Math.random().toString(16).slice(2)}`,
        skills: group.skills.map((skill) => ({ ...skill, id: undefined })),
      })),
    }));
  };

  const clearServerChecks = () => {
    setValidation(null);
    setBackendPreview(null);
  };

  const updateBlock = (localId: string, patch: Partial<SkillBlockDraft>) => {
    clearServerChecks();
    setForm((current) => ({
      ...current,
      skillBlocks: current.skillBlocks.map((block) =>
        block.localId === localId ? { ...block, ...patch } : block,
      ),
    }));
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
    if (!templateId && viewMode === "builder" && readinessErrors.length > 0) {
      setActiveTab("preview");
      setStepErrors(readinessErrors);
      showError("Chưa thể xuất bản", readinessErrors[0]);
      return;
    }
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
    clearServerChecks();
    setForm((current) => {
      const nodeGroups = groups.map((group, index) => makeNodeGroupFromResponse(group, index + 1));
      return { ...current, nodeGroups };
    });
    setNodeSuggestionCount(groups.length);
  };

  const runAutoGroup = async () => {
    const trackId = toNumberOrNull(form.jobPositionTrackId);
    if (!trackId) {
      showError("Chưa chọn track", "Cần chọn nhánh lộ trình trước khi auto-group.");
      return;
    }
    setAutoGrouping(true);
    try {
      const totalNodeCount = Math.max(nodeSuggestionCount || computedNodeCount || form.skillBlocks.length || 1, 1);
      const groups = await roadmapTemplateService.autoGroup({
        jobPositionTrackId: trackId,
        totalNodeCount,
        skillBlocks: buildPayload().skillBlocks || [],
      });
      applyNodeGroups(groups);
      showSuccess("Đã gợi ý node học", `Đã tạo ${groups.length} node học từ danh sách kỹ năng.`);
    } catch (error) {
      showError("Không thể gợi ý node học", getApiErrorMessage(error, "Vui lòng kiểm tra danh sách kỹ năng và nhánh lộ trình."));
    } finally {
      setAutoGrouping(false);
    }
  };

  const toggleModuleSkill = (
    groupLocalId: string,
    skill: JobPositionTrackSkill,
  ) => {
    clearServerChecks();
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
    clearServerChecks();
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
        defaultModuleLesson(lessons.length + 1, group.title || "node học"),
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
    const extraUpdates: Partial<NodeGroupDraft> = {
      exercisesJson: serializeModuleExercises(exercises),
    };
    if (exerciseIndex === 0) {
      if (patch.expectedOutput !== undefined) {
        extraUpdates.expectedOutput = patch.expectedOutput;
      }
      if (patch.rubric !== undefined) {
        extraUpdates.rubric = patch.rubric;
        extraUpdates.completionCriteria = patch.rubric;
      }
    }
    updateNodeGroup(group.localId, extraUpdates);
  };

  const addModuleExercise = (group: NodeGroupDraft) => {
    const exercises = getModuleExercises(group);
    updateNodeGroup(group.localId, {
      exercisesJson: serializeModuleExercises([
        ...exercises,
        defaultModuleExercise(exercises.length + 1, group.title || "node học"),
      ]),
    });
  };

  const removeModuleExercise = (group: NodeGroupDraft, exerciseIndex: number) => {
    const exercises = getModuleExercises(group).filter((_, index) => index !== exerciseIndex);
    updateNodeGroup(group.localId, { exercisesJson: serializeModuleExercises(exercises) });
  };

  const addNodeGroup = () => {
    clearServerChecks();
    setForm((current) => ({
      ...current,
      nodeGroups: [...current.nodeGroups, defaultNodeGroup(current.nodeGroups.length + 1)],
    }));
    setNodeSuggestionCount((current) => current + 1 || computedNodeCount + 1);
  };

  const removeNodeGroup = (localId: string) => {
    clearServerChecks();
    setForm((current) => ({
      ...current,
      nodeGroups: current.nodeGroups
        .filter((group) => group.localId !== localId)
        .map((group, index) => ({ ...group, orderIndex: index + 1, nodeKey: group.nodeKey || `node-${index + 1}` })),
    }));
    setNodeSuggestionCount((current) => Math.max((current || computedNodeCount) - 1, 0));
  };

  const focusFirstStepField = (step: BuilderTab) => {
    window.setTimeout(() => {
      const candidates = Array.from(document.querySelectorAll<HTMLElement>(
        `[data-step="${step}"] [data-required-field]`,
      ));
      const target = candidates.find((element) => {
        if (element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement) {
          return !element.value || (element instanceof HTMLInputElement && element.type === "number" && Number(element.value) <= 0);
        }
        const nested = element.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("input, select, textarea");
        return nested ? !nested.value : true;
      }) || candidates[0];
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
      if (target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement) {
        target.focus();
      } else {
        target?.querySelector<HTMLElement>("input, select, textarea, button")?.focus();
      }
    }, 50);
  };

  const canOpenStep = (step: BuilderTab) => {
    const targetIndex = moduleBuilderTabs.findIndex((item) => item.key === step);
    return moduleBuilderTabs
      .slice(0, Math.max(targetIndex, 0))
      .every((item) => item.key === "courses" || getStepValidationErrors(item.key).length === 0);
  };

  const goToStep = (step: BuilderTab) => {
    if (autoGrouping) {
      showError("Đang gợi ý node học", "Vui lòng chờ AI hoàn tất trước khi chuyển bước.");
      return;
    }
    if (step === activeTab) return;
    if (!canOpenStep(step)) {
      const firstBlocked = moduleBuilderTabs.find(
        (item) => item.key !== "courses" && getStepValidationErrors(item.key).length > 0,
      );
      const errors = firstBlocked ? getStepValidationErrors(firstBlocked.key) : [];
      if (firstBlocked) {
        setActiveTab(firstBlocked.key);
        setStepErrors(errors);
        focusFirstStepField(firstBlocked.key);
        showError("Chưa thể qua bước tiếp theo", errors[0] || "Hãy hoàn thiện bước hiện tại.");
      }
      return;
    }
    setActiveTab(step);
    setStepErrors([]);
  };

  const getSuggestionNodeGroupId = (message: string) => {
    const label = message.split(":")[0]?.trim().toLowerCase();
    if (!label) return null;
    const target = moduleItems.find((item) => {
      const title = item.group.title?.trim().toLowerCase();
      const activityTitle = item.activity.title?.trim().toLowerCase();
      return title === label || activityTitle === label;
    });
    return target?.group.localId || null;
  };

  const goToSuggestionTarget = (message: string) => {
    const targetStep = getSuggestionTargetStep(message);
    const nodeGroupId = targetStep === "grouping" ? getSuggestionNodeGroupId(message) : null;
    if (targetStep !== "preview") {
      goToStep(targetStep);
    }
    if (!nodeGroupId) return;
    setActiveNodeGroupId(nodeGroupId);
    setHighlightNodeGroupId(nodeGroupId);
    window.setTimeout(() => {
      document
        .querySelector<HTMLElement>(`[data-node-group-id="${nodeGroupId}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 120);
    window.setTimeout(() => {
      setHighlightNodeGroupId((current) => (current === nodeGroupId ? null : current));
    }, 2200);
  };

  const goNextStep = () => {
    if (autoGrouping) {
      showError("Đang gợi ý node học", "Vui lòng chờ AI hoàn tất trước khi chuyển bước.");
      return;
    }
    const currentErrors = getStepValidationErrors(activeTab);
    if (activeTab !== "courses" && currentErrors.length > 0) {
      setStepErrors(currentErrors);
      focusFirstStepField(activeTab);
      showError("Cần hoàn thiện bước này", currentErrors[0]);
      return;
    }
    const currentIndex = moduleBuilderTabs.findIndex((item) => item.key === activeTab);
    const nextStep = moduleBuilderTabs[currentIndex + 1];
    if (nextStep) {
      setActiveTab(nextStep.key);
      setStepErrors([]);
    }
  };

  const goPreviousStep = () => {
    if (autoGrouping) {
      showError("Đang gợi ý node học", "Vui lòng chờ AI hoàn tất trước khi chuyển bước.");
      return;
    }
    const currentIndex = moduleBuilderTabs.findIndex((item) => item.key === activeTab);
    const previousStep = moduleBuilderTabs[currentIndex - 1];
    if (previousStep) {
      setActiveTab(previousStep.key);
      setStepErrors([]);
    }
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
    <div className="artm-panel-grid" data-step="overview">
      <label className="artm-wide">
        <span>Tên mẫu</span>
        <input data-required-field value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Lộ trình Java Spring Boot phía máy chủ đầy đủ" />
      </label>
      <label>
        <span>Lĩnh vực</span>
        <select data-required-field value={form.domainId} onChange={(e) => setForm({ ...form, domainId: e.target.value, jobPositionId: "", jobPositionTrackId: "", skillBlocks: [], nodeGroups: [] })}>
          <option value="">Chọn lĩnh vực</option>
          {domains.map((domain) => <option key={domain.id} value={domain.id}>{domain.name}</option>)}
        </select>
      </label>
      <label>
        <span>Vị trí công việc</span>
        <select data-required-field value={form.jobPositionId} onChange={(e) => setForm({ ...form, jobPositionId: e.target.value, jobPositionTrackId: "", skillBlocks: [], nodeGroups: [] })}>
          <option value="">Chọn vị trí công việc</option>
          {jobPositions.map((position) => <option key={position.id} value={position.id}>{position.name}</option>)}
        </select>
      </label>
      <label>
        <span>Nhánh lộ trình</span>
        <select data-required-field value={form.jobPositionTrackId} onChange={(e) => setForm({ ...form, jobPositionTrackId: e.target.value, skillBlocks: [], nodeGroups: [] })}>
          <option value="">Chọn nhánh lộ trình</option>
          {tracks.map((track) => <option key={track.id} value={track.id}>{track.name}</option>)}
        </select>
      </label>
      <div className="artm-wide artm-derived-node-count">
        <span>Số node học sẽ tự tính ở bước 3</span>
        <strong>{computedNodeCount} node học</strong>
      </div>
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
        <div className="artm-panel-grid artm-panel-grid--tight artm-route-constraints">

          <label className="artm-wide">
            <span>Cách AI chọn chủ đề học</span>
            <select value={form.topicGenerationType} onChange={(e) => setForm({ ...form, topicGenerationType: e.target.value })}>
              {topicGenerationTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label className="artm-wide">
            <span>Cách ước tính thời lượng</span>
            <select value={form.timeBudgetPolicy} onChange={(e) => setForm({ ...form, timeBudgetPolicy: e.target.value })}>
              {timeBudgetPolicyOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
        </div>
      </section>
      <label className="artm-wide">
        <span>Mô tả</span>
        <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </label>
    </div>
  );

  const renderAllocation = () => {
    const totalWeight = form.skillBlocks.reduce((sum, block) => sum + (Number(block.weightPercent) || 0), 0);
    const trackSkillBySkillId = new Map(trackSkills.map((skill) => [skill.skillId, skill]));
    return (
      <div className="artm-table-panel" data-step="allocation">
        <div className="artm-section-head">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3>Định chuẩn Tỷ trọng Năng lực</h3>
              <span className={Math.abs(totalWeight - 100) > 0.01 ? "artm-chip-warn" : "artm-chip-ok"}>
                Tổng: {totalWeight.toFixed(2).replace(/\.00$/, '')}%
              </span>
            </div>
            <p>{trackSkills.length} kỹ năng trong nhánh chuyên môn đã chọn. Trọng số năng lực được định chuẩn tự động từ Khung nghề nghiệp gốc; tại mẫu này Admin thiết lập số lượng Node tối thiểu/tối đa cần bao phủ kỹ năng.</p>
          </div>
          <div className="artm-section-actions">
            <button type="button" onClick={() => setShowTrackSkillRedirect(true)}><Edit3 size={16} /> Hiệu chỉnh Khung kỹ năng</button>
          </div>
        </div>
      <div className="artm-allocation-list">
        {form.skillBlocks.map((block) => {
          const trackSkill = trackSkillBySkillId.get(block.skillId);
          const requirementType = trackSkill?.requirementType || "NICE_TO_HAVE";
          const isRequired = requirementType === "REQUIRED";
          return (
            <article className={`artm-allocation-row ${activeSkillBlockId === block.localId ? "artm-allocation-row--active" : ""}`} key={block.localId}>
              <div>
                <div className="artm-allocation-skill-title">
                  <strong>{block.skillNameSnapshot}</strong>
                  <span className={`artm-requirement-tag artm-requirement-tag--${requirementType.toLowerCase()}`}>
                    {requirementTypeLabels[requirementType] || requirementType}
                  </span>
                </div>
                <span>{block.skillCanonicalKeySnapshot || `kỹ năng:${block.skillId}`}</span>
              </div>
              <label><span>Trọng số định chuẩn</span><input type="number" min={0} value={block.weightPercent} disabled readOnly /></label>
              <label>
                <span>Số Node tối thiểu</span>
                <input
                  type="number"
                  min={isRequired ? 1 : 0}
                  value={block.minNodes ?? ""}
                  onChange={(e) => {
                    if (!e.target.value) {
                      updateBlock(block.localId, { minNodes: null });
                      return;
                    }
                    const nextValue = Number(e.target.value);
                    updateBlock(block.localId, { minNodes: isRequired ? Math.max(1, nextValue) : Math.max(0, nextValue) });
                  }}
                />
              </label>
              <label><span>Số Node tối đa</span><input type="number" min={0} value={block.maxNodes ?? ""} onChange={(e) => updateBlock(block.localId, { maxNodes: e.target.value ? Number(e.target.value) : null })} /></label>
              <div className="artm-node-chip">
                <span>Đã phân bổ</span>
                <strong>{getAllocatedNodes(block)} Node</strong>
              </div>
            </article>
          );
        })}
      </div>
    </div>
    );
  };

  const renderGrouping = () => {
    const unassignedSkills = form.skillBlocks.filter((block) => !assignedSkillIds.has(block.skillId));
    const suggestedNodeCount = nodeSuggestionCount || computedNodeCount || form.skillBlocks.length || 1;
    return (
      <div className="artm-grouping-flow" data-step="grouping">
        <section className="artm-table-panel artm-node-definition-panel">
          <div className="artm-section-head">
            <div>
              <h3>Thiết lập cấu trúc Node</h3>
              <p>Xác định số lượng Node học tập mong muốn và sử dụng AI để tự động tối ưu hóa việc phân nhóm kỹ năng tích hợp.</p>
            </div>
            <button type="button" onClick={() => void runAutoGroup()} disabled={autoGrouping || form.skillBlocks.length === 0}>
              {autoGrouping ? <Loader2 size={16} className="artm-spin" /> : <RefreshCw size={16} />}
              {autoGrouping ? "Đang xử lý..." : "AI gợi ý lập Node"}
            </button>
          </div>
          <div className="artm-node-definition-controls">
            <label>
              <span>Số lượng Node dự kiến</span>
              <input
                type="number"
                min={1}
                max={80}
                value={suggestedNodeCount}
                disabled={autoGrouping}
                onChange={(e) => setNodeSuggestionCount(Math.max(Number(e.target.value) || 1, 1))}
              />
            </label>
            <div className="artm-derived-node-count">
              <span>Số Node hiện tại</span>
              <strong>{computedNodeCount} Node học tập</strong>
            </div>
          </div>
          {autoGrouping && (
            <div className="artm-ai-loading">
              <Loader2 size={18} className="artm-spin" />
              Hệ thống AI đang lập cấu trúc Node học tập và phân bổ kỹ năng chuẩn đầu ra. Vui lòng không thao tác trong quá trình xử lý...
            </div>
          )}
        </section>

        <section className="artm-table-panel">
          <div className="artm-section-head">
            <div>
              <h3>Node học tập của lộ trình</h3>
              <p>{moduleItems.length} Node tích hợp kỹ năng chuẩn đầu ra.</p>
            </div>
            <button
              type="button"
              data-required-field
              onClick={addNodeGroup}
              disabled={autoGrouping}
            >
              <Plus size={16} /> Thêm Node học tập
            </button>
          </div>
          {unassignedSkills.length > 0 ? (
            <div data-required-field className="artm-warning-note">
              <AlertTriangle size={18} />
              <div>
                <strong>Còn {unassignedSkills.length} kỹ năng chuẩn đầu ra chưa được phân bổ vào các Node học tập.</strong>
                <span>{unassignedSkills.map((skill) => skill.skillNameSnapshot).join(", ")}</span>
              </div>
            </div>
          ) : (
            <div className="artm-ready"><CheckCircle2 size={18} /> Tất cả kỹ năng chuẩn đầu ra đã được phân bổ đầy đủ vào các Node học tập.</div>
          )}
          <div className="artm-skill-stack">
            {moduleItems.map((item, moduleIndex) => {
              const pinnedDocIds = parsePinnedDocIds(item.group.pinnedDocumentIds);
              return (
                <article
                  className={`artm-activity-card ${highlightNodeGroupId === item.group.localId ? "artm-activity-card--highlight" : ""}`}
                  data-node-group-id={item.group.localId}
                  key={item.group.localId}
                >
                  <div className="artm-activity-head">
                    <div>
                      <strong>Node học tập {moduleIndex + 1}: {item.group.title || "Chưa đặt tên"}</strong>
                      <div style={{ display: "flex", gap: "10px", alignItems: "center", marginTop: "4px", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "12px", color: "#a0aec0" }}>Tích hợp {item.skills.length} kỹ năng chuẩn đầu ra</span>
                        <span style={{ background: "rgba(109, 233, 255, 0.1)", border: "1px solid rgba(109, 233, 255, 0.3)", padding: "2px 8px", borderRadius: "999px", fontSize: "12px", color: "#6de9ff", fontWeight: 700 }}>
                          Weight thô: {(nodeWeightsAndPercentages.weights.get(item.group.localId) || 0).toFixed(1)}
                        </span>
                        <span style={{ background: "rgba(34, 197, 94, 0.1)", border: "1px solid rgba(34, 197, 94, 0.3)", padding: "2px 8px", borderRadius: "999px", fontSize: "12px", color: "#22c55e", fontWeight: 700 }}>
                          Chiếm: {(nodeWeightsAndPercentages.percentages.get(item.group.localId) || 0).toFixed(2).replace(/\.00$/, '')}%
                        </span>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <button
                        type="button"
                        className="artm-pinned-doc-btn"
                        title="Ràng buộc tài liệu chuyên môn"
                        onClick={() => handleOpenPinnedDocSelect(item.group)}
                        disabled={autoGrouping}
                      >
                        📌 Ràng buộc tài liệu
                      </button>
                      <button type="button" className="artm-danger-btn-trash" title="Xóa Node học tập" onClick={() => removeNodeGroup(item.group.localId)} disabled={autoGrouping}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="artm-panel-grid">
                    <label className="artm-wide"><span>Tên Node học tập</span><input data-required-field value={item.group.title} disabled={autoGrouping} onChange={(e) => updateNodeGroup(item.group.localId, { title: e.target.value })} /></label>
                    <label className="artm-wide"><span>Mô tả Node</span><textarea rows={2} value={item.group.description || ""} disabled={autoGrouping} onChange={(e) => updateNodeGroup(item.group.localId, { description: e.target.value })} /></label>
                    <label>
                      <span>Độ khó</span>
                      <select
                        value={item.group.difficulty || "medium"}
                        disabled={autoGrouping}
                        onChange={(e) => updateNodeGroup(item.group.localId, { difficulty: e.target.value })}
                        style={{ background: "#061322", color: "#6de9ff", border: "1px solid #1e3a5f", borderRadius: "8px", height: "42px", padding: "0 12px", width: "100%", outline: "none", cursor: "pointer" }}
                      >
                        <option value="beginner">Cơ bản (Beginner)</option>
                        <option value="medium">Trung bình (Medium)</option>
                        <option value="advanced">Nâng cao (Advanced)</option>
                      </select>
                    </label>
                    <label><span>Thời lượng học ước tính (Giờ)</span><input type="number" min={0} value={item.group.estimatedHours ?? ""} disabled={autoGrouping} onChange={(e) => updateNodeGroup(item.group.localId, { estimatedHours: e.target.value ? Number(e.target.value) : null })} /></label>
                  </div>
                  {pinnedDocIds.length > 0 && (
                    <div className="artm-pinned-docs-section">
                      <span>
                        📌 Tài liệu chuyên môn đã ràng buộc ({pinnedDocIds.length}):
                      </span>
                      <div className="artm-pinned-docs-list">
                        {pinnedDocIds.map((docId) => {
                          const title = documentNamesCache[docId] || `Đang tải tài liệu #${docId}...`;
                          return (
                            <div key={docId} className="artm-pinned-doc-chip">
                              <span>{title}</span>
                              <button
                                type="button"
                                className="artm-unpin-btn"
                                onClick={() => handleUnpinDocument(item.group.localId, docId)}
                                title="Hủy ràng buộc"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <div className="artm-panel-grid">
                    {trackSkills.map((skill) => {
                      const checked = item.skills.some((moduleSkill) => moduleSkill.skillId === skill.skillId);
                      return (
                        <label key={skill.skillId}>
                          <span>{skill.skillName}</span>
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={autoGrouping}
                            onChange={() => toggleModuleSkill(item.group.localId, skill)}
                          />
                        </label>
                      );
                    })}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    );
  };

  const renderNodeGroupActivities = () => {
    if (form.nodeGroups.length === 0) {
      return (
        <section className="artm-table-panel" data-step="activities">
          <div className="artm-ready"><AlertTriangle size={18} /> Chưa có node học. Hãy tạo node ở bước "Node học & kỹ năng".</div>
        </section>
      );
    }

    const currentGroup = activeNodeGroup || form.nodeGroups[0];
    const currentIndex = form.nodeGroups.findIndex((group) => group.localId === currentGroup.localId);
    const lessons = getModuleLessons(currentGroup);
    const exercises = getModuleExercises(currentGroup);
    const getNodeStatus = (group: NodeGroupDraft) => {
      const nodeLessons = getModuleLessons(group);
      const nodeExercises = getModuleExercises(group);
      const missing = [
        !group.learningObjectives?.trim(),
        nodeLessons.length === 0,
        nodeExercises.length === 0,
        !group.expectedOutput?.trim(),
        !group.completionCriteria?.trim(),
        !group.rubric?.trim(),
      ].filter(Boolean).length;
      return missing === 0 ? "Đủ nội dung" : `Thiếu ${missing}`;
    };

    return (
      <div className="artm-node-split" data-step="activities">
        <aside className="artm-node-list">
          <div className="artm-section-head">
            <div>
              <h3>Danh sách node học</h3>
              <p>Chọn một node để chỉnh nội dung chi tiết.</p>
            </div>
          </div>
          <div className="artm-node-list__items">
            {form.nodeGroups.map((group, index) => (
              <button
                type="button"
                key={group.localId}
                className={`artm-node-list__item ${group.localId === currentGroup.localId ? "artm-node-list__item--active" : ""}`}
                onClick={() => setActiveNodeGroupId(group.localId)}
              >
                <div>
                  <strong>Node {index + 1}</strong>
                  <span>{group.title || "Chưa đặt tên"}</span>
                </div>
                <small>{getNodeStatus(group)}</small>
              </button>
            ))}
          </div>
        </aside>

        <section className="artm-skill-card artm-node-editor">
          <div className="artm-section-head">
            <div>
              <h3>Node học {currentIndex + 1}: {currentGroup.title || "Chưa đặt tên"}</h3>
              <p>Bài học, bài tập và tiêu chí hoàn thành thuộc node này, không thuộc từng kỹ năng riêng lẻ.</p>
            </div>
            <button type="button" onClick={() => goToStep("grouping")}>Chỉnh kỹ năng</button>
          </div>
            <div className="artm-course-selected-strip">
              {currentGroup.skills.map((skill) => (
                <span key={skill.skillId}>{skill.skillNameSnapshot || `Skill ${skill.skillId}`} · {skill.requirementType || "REQUIRED"}</span>
              ))}
            </div>
            <div className="artm-activity-form">
              <label className="artm-wide"><span>Tên node học</span><input data-required-field value={currentGroup.title} onChange={(e) => updateNodeGroup(currentGroup.localId, { title: e.target.value })} /></label>
              <label className="artm-wide"><span>Mô tả node học</span><textarea rows={2} value={currentGroup.description || ""} onChange={(e) => updateNodeGroup(currentGroup.localId, { description: e.target.value })} /></label>
              <label className="artm-wide"><span>Mục tiêu học tập</span><textarea data-required-field rows={3} value={currentGroup.learningObjectives || ""} onChange={(e) => updateNodeGroup(currentGroup.localId, { learningObjectives: e.target.value })} /></label>
              <label><span>Độ khó</span><input value={currentGroup.difficulty || "medium"} onChange={(e) => updateNodeGroup(currentGroup.localId, { difficulty: e.target.value })} /></label>
              <label><span>Số giờ học ước tính</span><input type="number" min={0} value={currentGroup.estimatedHours ?? ""} onChange={(e) => updateNodeGroup(currentGroup.localId, { estimatedHours: e.target.value ? Number(e.target.value) : null })} /></label>
            </div>
            <div className="artm-module-editor">
              <div className="artm-section-head">
                <div>
                  <h4>Bài học trong node</h4>
                  <p>Nhập từng bài học cụ thể để dạy phối hợp các kỹ năng đã gán vào node.</p>
                </div>
                <button type="button" onClick={() => addModuleLesson(currentGroup)}><Plus size={16} /> Thêm bài học</button>
              </div>
              {lessons.length === 0 ? (
                <div data-required-field className="artm-ready"><AlertTriangle size={16} /> Chưa có bài học. Hãy thêm ít nhất một bài học cho node.</div>
              ) : lessons.map((lesson, lessonIndex) => (
                <article className="artm-activity-card" key={`${currentGroup.localId}-lesson-${lessonIndex}`}>
                  <div className="artm-activity-head">
                    <div>
                      <strong>Bài học {lessonIndex + 1}</strong>
                      <span>{lesson.title || "Chưa đặt tên"}</span>
                    </div>
                    <button type="button" title="Xóa bài học" onClick={() => removeModuleLesson(currentGroup, lessonIndex)}><Trash2 size={16} /></button>
                  </div>
                  <div className="artm-activity-form">
                    <label className="artm-wide"><span>Tên bài học</span><input data-required-field value={lesson.title} onChange={(e) => updateModuleLesson(currentGroup, lessonIndex, { title: e.target.value })} /></label>
                    <label className="artm-wide"><span>Nội dung bài học</span><textarea data-required-field rows={2} value={lesson.description} onChange={(e) => updateModuleLesson(currentGroup, lessonIndex, { description: e.target.value })} /></label>
                    <label className="artm-wide"><span>Mục tiêu của bài học</span><textarea data-required-field rows={2} value={lesson.learningObjective} onChange={(e) => updateModuleLesson(currentGroup, lessonIndex, { learningObjective: e.target.value })} /></label>
                    <label><span>Thời lượng phút</span><input type="number" min={0} value={lesson.estimatedMinutes ?? ""} onChange={(e) => updateModuleLesson(currentGroup, lessonIndex, { estimatedMinutes: e.target.value ? Number(e.target.value) : null })} /></label>
                  </div>
                </article>
              ))}
            </div>
            <div className="artm-module-editor">
              <div className="artm-section-head">
                <div>
                  <h4>Bài tập bắt buộc</h4>
                  <p>Bài tập nên yêu cầu người học vận dụng nhiều kỹ năng trong node, không kiểm tra từng kỹ năng rời rạc.</p>
                </div>
                <button type="button" onClick={() => addModuleExercise(currentGroup)}><Plus size={16} /> Thêm bài tập</button>
              </div>
              {exercises.length === 0 ? (
                <div data-required-field className="artm-ready"><AlertTriangle size={16} /> Chưa có bài tập. Node cần bài tập hoặc minh chứng để đánh giá.</div>
              ) : exercises.map((exercise, exerciseIndex) => (
                <article className="artm-activity-card" key={`${currentGroup.localId}-exercise-${exerciseIndex}`}>
                  <div className="artm-activity-head">
                    <div>
                      <strong>Bài tập {exerciseIndex + 1}</strong>
                      <span>{exercise.title || "Chưa đặt tên"}</span>
                    </div>
                    <button type="button" title="Xóa bài tập" onClick={() => removeModuleExercise(currentGroup, exerciseIndex)}><Trash2 size={16} /></button>
                  </div>
                  <div className="artm-activity-form">
                    <label className="artm-wide"><span>Tên bài tập</span><input data-required-field value={exercise.title} onChange={(e) => updateModuleExercise(currentGroup, exerciseIndex, { title: e.target.value })} /></label>
                    <label className="artm-wide"><span>Yêu cầu thực hiện</span><textarea data-required-field rows={2} value={exercise.instruction} onChange={(e) => updateModuleExercise(currentGroup, exerciseIndex, { instruction: e.target.value })} /></label>
                    <label className="artm-wide"><span>Đầu ra cần nộp</span><textarea data-required-field rows={2} value={exercise.expectedOutput} onChange={(e) => updateModuleExercise(currentGroup, exerciseIndex, { expectedOutput: e.target.value })} /></label>
                    <div data-required-field className="artm-wide"><RubricListEditor value={exercise.rubric} onChange={(val) => updateModuleExercise(currentGroup, exerciseIndex, { rubric: val })} label="Tiêu chí chấm bài tập" /></div>

                  </div>
                </article>
              ))}
            </div>
            <div className="artm-activity-form">
              <label className="artm-wide"><span>Gợi ý cho AI khi sinh nội dung</span><textarea rows={2} value={currentGroup.aiPromptHint || ""} onChange={(e) => updateNodeGroup(currentGroup.localId, { aiPromptHint: e.target.value })} /></label>
            </div>
          </section>
      </div>
    );
  };

  const renderCourses = () => {
    const currentBlock =
      form.skillBlocks.find((block) => block.localId === activeSkillBlockId) ||
      form.skillBlocks[0] ||
      null;

    if (!currentBlock) {
      return (
        <section className="artm-table-panel" data-step="courses">
          <div className="artm-ready artm-optional-note">
            <CheckCircle2 size={18} /> Bước này là tùy chọn. Chưa có kỹ năng để gắn khóa học hoặc tài liệu.
          </div>
        </section>
      );
    }

    return (
      <div className="artm-course-split" data-step="courses">
        <aside className="artm-node-list artm-course-skill-list">
          <div className="artm-section-head">
            <div>
              <h3>Kỹ năng ưu tiên</h3>
              <p>Chọn kỹ năng để cấu hình khóa học và RAG.</p>
            </div>
          </div>
          <div className="artm-node-list__items">
            {form.skillBlocks.map((block) => (
              <button
                type="button"
                key={block.localId}
                className={`artm-node-list__item ${block.localId === currentBlock.localId ? "artm-node-list__item--active" : ""}`}
                onClick={() => setActiveSkillBlockId(block.localId)}
              >
                <div>
                  <strong>{block.skillNameSnapshot}</strong>
                  <span>{getAllocatedNodes(block)} node</span>
                </div>
                <small>{block.selectedCourseIds.length} khóa thủ công · RAG {block.ragEnabled ? "bật" : "tắt"}</small>
              </button>
            ))}
          </div>
        </aside>

        <section className="artm-skill-card artm-course-editor">
          <div className="artm-ready artm-optional-note">
            <CheckCircle2 size={18} /> Bước này là tùy chọn. Nếu không chọn thủ công, hệ thống vẫn tự gợi ý khóa học và dùng tài liệu nội bộ theo RAG khi được bật.
          </div>
          <div className="artm-section-head">
            <div>
              <h3>{currentBlock.skillNameSnapshot}</h3>
              <p>Gắn khóa học và cấu hình tài liệu nội bộ cho kỹ năng này. Nếu bỏ trống, AI vẫn tự lấy tài liệu theo từ khóa RAG.</p>
            </div>
            <button type="button" onClick={() => void loadCourseCandidates(currentBlock)}><BookOpen size={16} /> Xem khóa học gợi ý</button>
          </div>
          <div className="artm-panel-grid">
            <label><span>Cách gợi ý khóa học</span><select value={currentBlock.courseLinkPolicy} onChange={(e) => updateBlock(currentBlock.localId, { courseLinkPolicy: e.target.value as RoadmapTemplateCourseLinkPolicy })}>
              <option value="MANUAL_ONLY">Chỉ chọn thủ công</option>
              <option value="AUTO_NEWEST">Tự động lấy khóa mới nhất</option>
              <option value="AUTO_POPULAR">Tự động lấy khóa nhiều học viên</option>
              <option value="AUTO_HYBRID">Kết hợp tự động và thủ công</option>
            </select></label>
            <label><span>Giới hạn khóa tự động</span><input type="number" min={1} max={10} value={currentBlock.autoCourseLimit ?? 2} onChange={(e) => updateBlock(currentBlock.localId, { autoCourseLimit: Number(e.target.value) })} /></label>
            <label><span>Cho AI dùng tài liệu nội bộ cho kỹ năng này</span><select value={currentBlock.ragEnabled ? "true" : "false"} onChange={(e) => updateBlock(currentBlock.localId, { ragEnabled: e.target.value === "true" })}>
              <option value="true">Cho phép</option>
              <option value="false">Không cho phép</option>
            </select></label>
            <label className="artm-wide"><span>Từ khóa tìm tài liệu nội bộ</span><textarea rows={2} value={currentBlock.ragQueryHint || ""} onChange={(e) => updateBlock(currentBlock.localId, { ragQueryHint: e.target.value })} /></label>
          </div>
          <div className="artm-course-search">
            <label>
              <span>Tìm khóa học PUBLIC</span>
              <input
                value={courseSearchQuery[currentBlock.skillId] || ""}
                onChange={(e) =>
                  setCourseSearchQuery((current) => ({
                    ...current,
                    [currentBlock.skillId]: e.target.value,
                  }))
                }
                placeholder="Nhập tên khóa học"
              />
            </label>
            <button type="button" onClick={() => void searchPublicCourses(currentBlock)} disabled={searchingCourseSkillId === currentBlock.skillId}>
              {searchingCourseSkillId === currentBlock.skillId ? <Loader2 className="artm-spin" size={16} /> : <Search size={16} />}
              Tìm
            </button>
          </div>
          <div className="artm-course-selected-strip">
            {currentBlock.selectedCourseIds.length === 0 ? (
              <span>Chưa chọn khóa học thủ công cho skill này.</span>
            ) : currentBlock.selectedCourseIds.map((courseId) => {
              const course = courseOptionsBySkill[currentBlock.skillId]?.find((item) => item.courseId === courseId);
              return (
                <button type="button" key={courseId} onClick={() => toggleSelectedCourse(currentBlock, courseId)}>
                  #{courseId} {course?.title || "Khóa học"} <Trash2 size={14} />
                </button>
              );
            })}
          </div>
          <div className="artm-course-grid">
            {(courseOptionsBySkill[currentBlock.skillId] || []).map((course) => {
              const selected = currentBlock.selectedCourseIds.includes(course.courseId);
              return (
                <article
                  className={`artm-course-card ${selected ? "artm-course-card--selected" : ""}`}
                  key={course.courseId}
                >
                  <button
                    type="button"
                    className="artm-course-card__select"
                    onClick={() => toggleSelectedCourse(currentBlock, course.courseId)}
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
                    <button type="button" onClick={() => toggleSelectedCourse(currentBlock, course.courseId)}>
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
      </div>
    );
  };

  const renderFinalAssessment = () => (
    <div className="artm-final-assessment" data-step="finalAssessment">
      <section className="artm-final-card artm-final-card--assignment">
        <div className="artm-section-head">
          <div>
            <h3>Bài đánh giá cuối lộ trình</h3>
            <p>Đề bài cuối cần mô tả rõ sản phẩm người học phải nộp, dữ liệu đầu vào và tiêu chuẩn hoàn thành.</p>
          </div>
        </div>

        <label className="artm-final-field">
          <span>Hướng dẫn bài đánh giá cuối lộ trình</span>
          <textarea
            data-required-field
            rows={6}
            value={form.finalAssignmentInstructions}
            onChange={(e) => setForm({ ...form, finalAssignmentInstructions: e.target.value })}
            placeholder="Ví dụ: Xây dựng REST API quản lý sản phẩm, có CRUD, validation, test, tài liệu API và hướng dẫn chạy."
          />
        </label>
      </section>

      <section className="artm-final-card artm-final-card--rubric">
        <div className="artm-section-head">
          <div>
            <h3>Tiêu chí chấm điểm</h3>
            <p>Mỗi tiêu chí nên có tên ngắn, điểm tối đa và mô tả quan sát được khi chấm.</p>
          </div>
        </div>
        <div data-required-field className="artm-final-rubric">
          <RubricListEditor
            value={form.finalAssignmentRubric}
            onChange={(val) => setForm({ ...form, finalAssignmentRubric: val })}
            label="Danh sách tiêu chí"
          />
        </div>
      </section>

      <section className="artm-final-card artm-final-card--ai">
        <div className="artm-section-head">
          <div>
            <h3>AI chấm minh chứng</h3>
            <p>AI chỉ tự xác nhận qua bài khi đủ điểm và đủ độ tin cậy; trường hợp thấp hơn sẽ chuyển Admin duyệt.</p>
          </div>
        </div>

        <div className="artm-ai-review-panel">
          <label className="artm-ai-switch-row">
            <input type="checkbox" checked={form.aiEvidenceReviewEnabled} onChange={(e) => setForm({ ...form, aiEvidenceReviewEnabled: e.target.checked })} />
            <span>
              <strong>Chấm tự động bằng AI</strong>
              <small>Nếu tắt, bài nộp không có mentor sẽ vào hàng chờ Admin đánh giá thủ công.</small>
            </span>
          </label>
        </div>

        {form.aiEvidenceReviewEnabled && (
          <div className="artm-ai-review-panel">
            <label className="artm-ai-switch-row">
                <input type="checkbox" checked={form.aiAutoPassEnabled} onChange={(e) => setForm({ ...form, aiAutoPassEnabled: e.target.checked })} />
              <span>
                <strong>Tự động xác nhận qua bài nếu đạt ngưỡng</strong>
                <small>Nếu tắt, AI vẫn chấm và gợi ý nhưng Admin là người xác nhận cuối.</small>
              </span>
            </label>

            <div className="artm-ai-threshold-grid">
              <label>
                <span>% điểm tối thiểu để tự động qua</span>
                <input type="number" min={0} max={100} value={form.aiAutoPassMinScorePercent} onChange={(e) => setForm({ ...form, aiAutoPassMinScorePercent: Number(e.target.value) })} />
              </label>
              <label>
                <span>Độ tin cậy tối thiểu để tự động qua</span>
                <input type="number" min={0} max={1} step={0.01} value={form.aiAutoPassMinConfidence} onChange={(e) => setForm({ ...form, aiAutoPassMinConfidence: Number(e.target.value) })} />
              </label>
              <label>
                <span>Dưới độ tin cậy này thì Admin duyệt</span>
                <input type="number" min={0} max={1} step={0.01} value={form.aiManualReviewBelowConfidence} onChange={(e) => setForm({ ...form, aiManualReviewBelowConfidence: Number(e.target.value) })} />
              </label>
            </div>

            <label className="artm-final-field">
              <span>Hướng dẫn AI chấm minh chứng</span>
              <textarea rows={7} value={form.aiEvidencePrompt} onChange={(e) => setForm({ ...form, aiEvidencePrompt: e.target.value })} placeholder="Hướng dẫn AI cách chấm điểm bài nộp cuối lộ trình..." />
            </label>
          </div>
        )}
      </section>
    </div>
  );

  const renderPreview = () => (
    <div className="artm-publish-grid" data-step="preview">
      <section className="artm-table-panel">
        <div className="artm-section-head">
          <div>
            <h3>Mức độ bao phủ Kỹ năng</h3>
            <p>Phân bổ kỹ năng theo cấu trúc các Node học tập</p>
          </div>
        </div>
        <div className="artm-preview-list">
          {form.skillBlocks.map((block) => {
            const allocatedNodes = getAllocatedNodes(block);
            return (
              <div className={`artm-preview-row ${allocatedNodes === 0 ? "artm-preview-row--error" : ""}`} key={block.localId}>
                <span>{block.skillNameSnapshot}</span>
                <strong>{allocatedNodes === 0 ? "Chưa phân bổ vào Node" : `Đã phân bổ vào ${allocatedNodes} Node`}</strong>
              </div>
            );
          })}
        </div>
      </section>

      <section className="artm-table-panel">
        <div className="artm-section-head">
          <div>
            <h3>Kiểm tra hợp lệ</h3>
            <p>{readinessErrors.length === 0 ? "Không có lỗi chặn xuất bản" : `${readinessErrors.length} lỗi cần sửa`}</p>
          </div>
          <button type="button" onClick={() => void runValidation()}><ClipboardCheck size={16} /> Kiểm tra</button>
        </div>
        <div className="artm-review-stack">
          {readinessErrors.length === 0 ? (
            <div className="artm-ready"><CheckCircle2 size={18} /> Lộ trình hoàn thiện. Sẵn sàng xuất bản lên hệ thống.</div>
          ) : (
            <div className="artm-error-list">
              {readinessErrors.map((error) => <div key={error}>{error}</div>)}
            </div>
          )}
          {coverageWarnings.length > 0 && (
            <div className="artm-suggestion-list">
              <strong>Gợi ý cải thiện cấu trúc</strong>
              {coverageWarnings.map((warning) => {
                const targetStep = getSuggestionTargetStep(warning);
                const targetLabel = moduleBuilderTabs.find((step) => step.key === targetStep)?.title || "Bước liên quan";
                return (
                  <div key={warning}>
                    <span><AlertTriangle size={16} /> {warning}</span>
                    {targetStep !== "preview" && (
                      <button type="button" onClick={() => goToSuggestionTarget(warning)}>
                        Tới {targetLabel}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="artm-table-panel" style={{ gridColumn: "1 / -1", marginTop: "24px" }}>
        <div className="artm-section-head">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h3>Bản đồ Phân bổ Tỷ trọng Lộ trình</h3>
              <span style={{ background: "rgba(34, 197, 94, 0.15)", color: "#22c55e", border: "1px solid rgba(34, 197, 94, 0.3)", padding: "2px 8px", borderRadius: "999px", fontSize: "12px", fontWeight: "bold" }}>
                Tổng Trọng số: 100%
              </span>
            </div>
            <p>Trọng số và phần trăm đóng góp của mỗi bài học (Node) trong lộ trình cuối cùng được tính toán tự động dựa trên độ khó và các kỹ năng đi kèm.</p>
          </div>
        </div>
        <div style={{ padding: "20px", background: "#061322", borderRadius: "12px", border: "1px solid #1e3a5f" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
            {form.nodeGroups.map((group, index) => {
              const rawWeight = nodeWeightsAndPercentages.weights.get(group.localId) || 0;
              const percent = nodeWeightsAndPercentages.percentages.get(group.localId) || 0;
              return (
                <div key={group.localId} style={{ background: "#0b1a2d", border: "1px solid #1e3a5f", borderRadius: "10px", padding: "18px", display: "flex", flexDirection: "column", gap: "10px", boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong style={{ color: "#ffffff", fontSize: "14px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "160px" }}>
                      Node {index + 1}: {group.title || "Chưa đặt tên"}
                    </strong>
                    <span style={{ fontSize: "10px", background: "#0c2138", color: "#6de9ff", border: "1px solid #24c8f5", padding: "2px 8px", borderRadius: "4px", textTransform: "uppercase", fontWeight: "bold" }}>
                      {group.difficulty || "medium"}
                    </span>
                  </div>
                  <div style={{ fontSize: "12px", color: "#a0aec0" }}>
                    Tích hợp {group.skills.length} kỹ năng
                  </div>
                  <div style={{ display: "flex", gap: "12px", marginTop: "4px", fontSize: "13px" }}>
                    <span style={{ color: "#6de9ff" }}>Trọng số thô: <strong>{rawWeight.toFixed(1)}</strong></span>
                    <span style={{ color: "#22c55e" }}>Tỷ trọng: <strong>{percent.toFixed(2).replace(/\.00$/, '')}%</strong></span>
                  </div>
                  <div style={{ width: "100%", background: "#163352", height: "8px", borderRadius: "999px", overflow: "hidden", marginTop: "4px" }}>
                    <div style={{ width: `${percent}%`, background: "#22c55e", height: "100%", borderRadius: "999px" }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );

  const renderStepErrors = () => (
    stepErrors.length > 0 ? (
      <div className="artm-step-errors">
        {stepErrors.slice(0, 5).map((error) => (
          <div key={error}><AlertTriangle size={16} /> {error}</div>
        ))}
      </div>
    ) : null
  );

  const renderStepFooter = () => {
    const currentIndex = moduleBuilderTabs.findIndex((step) => step.key === activeTab);
    const previousStep = moduleBuilderTabs[currentIndex - 1];
    const nextStep = moduleBuilderTabs[currentIndex + 1];
    return (
      <div className="artm-step-footer">
        <button type="button" onClick={goPreviousStep} disabled={!previousStep || autoGrouping}>
          <ArrowLeft size={16} /> Quay lại
        </button>
        {nextStep ? (
          <button type="button" className="artm-primary" onClick={goNextStep} disabled={autoGrouping}>
            Tiếp tục <ArrowRight size={16} />
          </button>
        ) : (
          <button type="button" className="artm-primary" onClick={() => void publishTemplate()} disabled={saving || Boolean(actionId) || autoGrouping}>
            <Rocket size={16} /> Xuất bản
          </button>
        )}
      </div>
    );
  };

  const renderBuilder = () => (
    <div className="artm-builder">
      <header className="artm-builder-topbar">
        <div>
          <button type="button" className="artm-ghost" onClick={openLibrary}><ArrowLeft size={16} /> Kho mẫu</button>
          <span style={{marginLeft: "0.5rem"}}>Mẫu lộ trình / Trình tạo</span>
          <h1>{form.editingId ? "Chỉnh sửa mẫu lộ trình" : "Tạo mẫu lộ trình"}</h1>
          <p>Mẫu là khung năng lực. Node học, kỹ năng ưu tiên và nội dung sẽ được dùng để sinh lộ trình cá nhân hóa từ hành trình và bài đánh giá.</p>
        </div>
        <div className="artm-header-actions">
          <button type="button" onClick={() => void saveTemplate()} disabled={saving || autoGrouping}>
            {saving ? <Loader2 className="artm-spin" size={16} /> : <Save size={16} />} Lưu nháp
          </button>
        </div>
      </header>

      <section className={`artm-builder-shell ${shouldShowSkillSelector ? "" : "artm-builder-shell--single"}`}>
        <main className="artm-builder-main">
          <nav className="artm-tabs artm-stepper">
            {moduleBuilderTabs.map((tab, index) => {
              const locked = !canOpenStep(tab.key);
              const complete = tab.key === "courses" || getStepValidationErrors(tab.key).length === 0;
              return (
              <button
                key={tab.key}
                type="button"
                className={`${activeTab === tab.key ? "active" : ""} ${complete ? "artm-stepper__item--done" : ""}`}
                onClick={() => goToStep(tab.key)}
                disabled={autoGrouping || (locked && activeTab !== tab.key)}
              >
                <span>{index + 1}</span>
                <strong>{tab.title}</strong>
                <small>{locked && activeTab !== tab.key ? <Lock size={12} /> : complete ? "Hoàn tất" : tab.description}</small>
              </button>
              );
            })}
          </nav>
          <section className={`artm-workspace ${activeTab === "activities" ? "artm-workspace--activities" : ""}`}>
            {renderStepErrors()}
            {activeTab === "overview" && renderOverview()}
            {activeTab === "allocation" && renderAllocation()}
            {activeTab === "grouping" && renderGrouping()}
            {activeTab === "activities" && renderNodeGroupActivities()}
            {activeTab === "courses" && renderCourses()}
            {activeTab === "finalAssessment" && renderFinalAssessment()}
            {activeTab === "preview" && renderPreview()}
            {renderStepFooter()}
          </section>
        </main>
        {shouldShowSkillSelector && <aside className="artm-inspector artm-inspector--builder">
          <h2>Lọc theo kỹ năng</h2>
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
              const status = `${block.selectedCourseIds.length} khóa thủ công · RAG ${block.ragEnabled ? "bật" : "tắt"}`;
              return (
                <button
                  type="button"
                  key={block.localId}
                  className={`artm-skill-filter ${activeSkillBlockId === block.localId ? "artm-skill-filter--active" : ""} ${block.ragEnabled ? "artm-skill-filter--ok" : "artm-skill-filter--warn"}`}
                  onClick={() => setActiveSkillBlockId(block.localId)}
                >
                  <span>{block.skillNameSnapshot}</span>
                  <strong>{allocatedNodes} node</strong>
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
      {showTrackSkillRedirect && (
        <div className="artm-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="track-skill-redirect-title">
          <div className="artm-modal">
            <div className="artm-modal__head">
              <div>
                <h3 id="track-skill-redirect-title">Chỉnh danh sách kỹ năng của nhánh</h3>
                <p>Mẫu lộ trình chỉ dùng kỹ năng đã thuộc tracking. Muốn thêm hoặc xóa kỹ năng, hãy chỉnh ở phần cấu hình nhánh nghề nghiệp để các mẫu dùng cùng nguồn dữ liệu.</p>
              </div>
            </div>
            <div className="artm-modal__actions">
              <button type="button" onClick={() => setShowTrackSkillRedirect(false)}>Ở lại</button>
              <button type="button" className="artm-primary" onClick={() => navigate("/admin?tab=track-skills")}>
                <Edit3 size={16} /> Tới cấu hình nhánh
              </button>
            </div>
          </div>
        </div>
      )}
      {pinnedDocModalOpen && (
        <PinnedDocSelectModal
          isOpen={pinnedDocModalOpen}
          onClose={() => setPinnedDocModalOpen(false)}
          skills={
            form.nodeGroups.find((g) => g.localId === pinnedDocModalNodeLocalId)?.skills.map((s) => ({
              skillId: s.skillId,
              skillNameSnapshot: s.skillNameSnapshot || "",
              skillCanonicalKeySnapshot: s.skillCanonicalKeySnapshot || "",
            })) || []
          }
          selectedDocIds={
            parsePinnedDocIds(
              form.nodeGroups.find((g) => g.localId === pinnedDocModalNodeLocalId)?.pinnedDocumentIds
            )
          }
          onApply={handleApplyPinnedDocs}
        />
      )}
    </div>
  );

  return (
    <div className={`admin-roadmap-template-studio artm-mode-${viewMode}`}>
      {viewMode === "library" ? renderLibrary() : renderBuilder()}
    </div>
  );
};

export default AdminRoadmapTemplateManager;
