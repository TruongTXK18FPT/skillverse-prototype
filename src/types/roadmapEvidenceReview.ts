export type AiReviewStatus = 'PENDING' | 'PASSED' | 'FAILED' | 'NEEDS_ADMIN_REVIEW';
export type AdminReviewDecision = 'APPROVE' | 'REJECT';

export interface AdminRoadmapEvidenceReviewResponse {
  id: number;
  nodeSubmissionId?: number;
  journeyOutputAssessmentId?: number;
  journeyId: number;
  roadmapSessionId: number;
  nodeId?: string;
  learnerId: number;
  attemptNumber: number;
  status: AiReviewStatus;
  aiScorePercent?: number;
  aiConfidence?: number;
  aiFeedback?: string;
  aiRubricBreakdownJson?: string;
  aiProvider?: string;
  aiModelName?: string;
  errorMessage?: string;
  targetType?: 'NODE_EVIDENCE' | 'FINAL_ASSIGNMENT';
  adminDecision?: AdminReviewDecision;
  adminReviewReason?: string;
  adminReviewedBy?: number;
  adminReviewedAt?: string;
  createdAt: string;
  updatedAt: string;
  reviewReasonType?: 'AI_DISABLED';
}

export interface AdminReviewDecisionRequest {
  decision: AdminReviewDecision;
  reason: string;
}
