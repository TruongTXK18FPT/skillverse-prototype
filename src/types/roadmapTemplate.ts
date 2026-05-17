import type { ImportanceLevel, RequirementType } from "./careerTaxonomy";
import type { SkillLevel } from "./Journey";

export type RoadmapTemplateStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "ARCHIVED"
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED";

export type RoadmapTemplateGenerationMode =
  | "LEGACY_STATIC"
  | "TEMPLATE_AI_GUIDED";

export type RoadmapTemplateKnowledgePolicy =
  | "TEMPLATE_ONLY"
  | "TEMPLATE_PLUS_LOCAL_RAG";

export type RoadmapTemplateCourseLinkPolicy =
  | "MANUAL_ONLY"
  | "AUTO_NEWEST"
  | "AUTO_POPULAR"
  | "AUTO_HYBRID";

export interface RoadmapTemplateNodeRequest {
  parentNodeId?: number | null;
  nodeKey?: string;
  title: string;
  description?: string;
  orderIndex: number;
  skillId?: number | null;
  skillNameSnapshot?: string;
  skillCanonicalKeySnapshot?: string;
  requirementType?: RequirementType;
  importanceLevel?: ImportanceLevel;
  difficulty?: string;
  estimatedHours?: number | null;
  expectedOutput?: string;
  rubric?: string;
}

export interface RoadmapTemplateCourseRequest {
  templateNodeId?: number | null;
  courseId: number;
  skillId?: number | null;
  displayOrder?: number;
  required?: boolean;
}

export interface RoadmapTemplateActivityRequest {
  id?: number;
  title: string;
  description?: string;
  exerciseType?: string;
  expectedOutput?: string;
  rubric?: string;
  difficulty?: string;
  minLevel?: SkillLevel | null;
  maxLevel?: SkillLevel | null;
  estimatedHours?: number | null;
  prerequisiteHint?: string;
  aiPromptHint?: string;
  orderIndex: number;
}

export interface RoadmapTemplateSkillBlockRequest {
  id?: number;
  skillId: number;
  skillNameSnapshot?: string;
  skillCanonicalKeySnapshot?: string;
  weightPercent: number;
  minNodes?: number | null;
  maxNodes?: number | null;
  nodeCountOverride?: number | null;
  learningGoals?: string;
  requiredTopics?: string;
  activityInstructions?: string;
  exerciseTypes?: string;
  successCriteria?: string;
  ragQueryHint?: string;
  courseLinkPolicy?: RoadmapTemplateCourseLinkPolicy;
  autoCourseLimit?: number | null;
  ragEnabled?: boolean;
  activities: RoadmapTemplateActivityRequest[];
}

export interface RoadmapTemplateRequest {
  domainId?: number | null;
  jobPositionId?: number | null;
  jobPositionTrackId?: number | null;
  title: string;
  description?: string;
  targetRole?: string;
  targetLevel?: string;
  targetRoleSnapshot?: string;
  targetLevelSnapshot?: string;
  totalNodeCount?: number | null;
  generationMode?: RoadmapTemplateGenerationMode;
  knowledgePolicy?: RoadmapTemplateKnowledgePolicy;
  globalLearningGoal?: string;
  audienceLevel?: string;
  outputStandard?: string;
  assessmentPolicy?: string;
  templateInstructions?: string;
  constraintsJson?: string;
  nodes: RoadmapTemplateNodeRequest[];
  courses?: RoadmapTemplateCourseRequest[];
  skillBlocks?: RoadmapTemplateSkillBlockRequest[];
}

export interface RoadmapTemplateNodeResponse
  extends RoadmapTemplateNodeRequest {
  id: number;
  templateId: number;
}

export interface RoadmapTemplateCourseResponse
  extends RoadmapTemplateCourseRequest {
  id: number;
  templateId: number;
  templateNodeId?: number | null;
}

export interface RoadmapTemplateActivityResponse
  extends RoadmapTemplateActivityRequest {
  id: number;
  templateId: number;
  skillBlockId: number;
}

export interface RoadmapTemplateSkillBlockResponse
  extends RoadmapTemplateSkillBlockRequest {
  id: number;
  templateId: number;
  allocatedNodes?: number | null;
  activities: RoadmapTemplateActivityResponse[];
}

export interface RoadmapTemplateAllocationItem {
  skillId: number;
  skillName?: string;
  weightPercent?: number;
  minNodes?: number | null;
  maxNodes?: number | null;
  nodeCountOverride?: number | null;
  allocatedNodes: number;
  rawShare?: number;
}

export interface RoadmapTemplateAllocationPreviewResponse {
  totalNodeCount?: number | null;
  allocatedNodeCount: number;
  valid: boolean;
  errors: string[];
  items: RoadmapTemplateAllocationItem[];
}

export interface RoadmapTemplateValidationResponse {
  valid: boolean;
  errors: string[];
  allocation?: RoadmapTemplateAllocationPreviewResponse;
}

export interface RoadmapTemplateCourseCandidateResponse {
  courseId: number;
  title?: string;
  level?: string;
  category?: string;
  createdAt?: string;
  enrollmentCount?: number;
  thumbnailUrl?: string;
}

export interface RoadmapTemplateResponse {
  id: number;
  createdByAdminId?: number | null;
  updatedByAdminId?: number | null;
  domainId?: number | null;
  jobPositionId?: number | null;
  jobPositionTrackId?: number | null;
  title: string;
  description?: string;
  targetRole?: string;
  targetLevel?: string;
  targetRoleSnapshot?: string;
  targetLevelSnapshot?: string;
  totalNodeCount?: number | null;
  generationMode?: RoadmapTemplateGenerationMode;
  knowledgePolicy?: RoadmapTemplateKnowledgePolicy;
  globalLearningGoal?: string;
  audienceLevel?: string;
  outputStandard?: string;
  assessmentPolicy?: string;
  templateInstructions?: string;
  constraintsJson?: string;
  status: RoadmapTemplateStatus;
  createdAt?: string;
  updatedAt?: string;
  nodes: RoadmapTemplateNodeResponse[];
  courses: RoadmapTemplateCourseResponse[];
  skillBlocks?: RoadmapTemplateSkillBlockResponse[];
  allocationPreview?: RoadmapTemplateAllocationPreviewResponse;
}
