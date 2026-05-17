import type { ImportanceLevel, RequirementType } from "./careerTaxonomy";

export type RoadmapTemplateStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED"
  | "ARCHIVED";

export type RoadmapOfferingStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "ARCHIVED";

export type RoadmapPurchaseStatus =
  | "PENDING_PAYMENT"
  | "ACTIVE"
  | "COMPLETED"
  | "CANCELLED"
  | "REFUNDED";

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
  displayOrder?: number;
  required?: boolean;
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
  nodes: RoadmapTemplateNodeRequest[];
  courses?: RoadmapTemplateCourseRequest[];
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

export interface RoadmapTemplateResponse {
  id: number;
  mentorId: number;
  mentorName?: string;
  domainId?: number | null;
  jobPositionId?: number | null;
  jobPositionTrackId?: number | null;
  title: string;
  description?: string;
  targetRole?: string;
  targetLevel?: string;
  targetRoleSnapshot?: string;
  targetLevelSnapshot?: string;
  status: RoadmapTemplateStatus;
  createdAt?: string;
  updatedAt?: string;
  nodes: RoadmapTemplateNodeResponse[];
  courses: RoadmapTemplateCourseResponse[];
}

export interface RoadmapOfferingRequest {
  templateId: number;
  title: string;
  description?: string;
  price: number;
  currency?: string;
  maxStudents?: number | null;
}

export interface RoadmapOfferingResponse {
  id: number;
  templateId: number;
  mentorId: number;
  mentorName?: string;
  title: string;
  description?: string;
  price: number;
  currency: string;
  status: RoadmapOfferingStatus;
  maxStudents?: number | null;
  createdAt?: string;
  updatedAt?: string;
  template?: RoadmapTemplateResponse | null;
}

export interface CreateRoadmapPurchaseRequest {
  offeringId: number;
}

export interface RoadmapPurchaseResponse {
  id: number;
  studentId: number;
  mentorId: number;
  offeringId: number;
  templateId: number;
  bookingId?: number | null;
  journeyId?: number | null;
  roadmapSessionId?: number | null;
  price: number;
  currency: string;
  status: RoadmapPurchaseStatus;
  activatedAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  offering?: RoadmapOfferingResponse | null;
}

