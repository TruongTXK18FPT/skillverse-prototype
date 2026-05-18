import type { RequirementType } from './careerTaxonomy';

export type TeachingEligibilityStatus =
  | 'ELIGIBLE'
  | 'PARTIALLY_ELIGIBLE'
  | 'NOT_ELIGIBLE'
  | 'NEEDS_REVIEW';

export interface MentorEligibilitySkillRequirement {
  skillId?: number | null;
  skillName?: string | null;
  canonicalKey?: string | null;
  requirementType: RequirementType;
}

export interface MentorNodeEligibility {
  nodeId?: string | null;
  title?: string | null;
  status: TeachingEligibilityStatus;
  matchPercent: number;
  matchedSkills: MentorEligibilitySkillRequirement[];
  missingRequiredSkills: MentorEligibilitySkillRequirement[];
  missingImportantSkills: MentorEligibilitySkillRequirement[];
  missingNiceToHaveSkills: MentorEligibilitySkillRequirement[];
}

export interface MentorTeachingEligibilityResponse {
  mentorId: number;
  roadmapSessionId?: number | null;
  journeyId?: number | null;
  summaryStatus: TeachingEligibilityStatus;
  overallMatchPercent: number;
  nodes: MentorNodeEligibility[];
}
