export type TaxonomyStatus = 'ACTIVE' | 'INACTIVE';
export type RequirementType = 'REQUIRED' | 'IMPORTANT' | 'NICE_TO_HAVE';
export type ImportanceLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Domain {
  id: number;
  code: string;
  name: string;
  description: string;
  status: TaxonomyStatus;
}

export interface JobPosition {
  id: number;
  code: string;
  name: string;
  description: string;
  domainId: number;
  status: TaxonomyStatus;
}

export interface JobPositionTrack {
  id: number;
  code: string;
  name: string;
  description: string;
  jobPositionId: number;
  status: TaxonomyStatus;
}

export interface JobPositionTrackSkill {
  id: number;
  trackId: number;
  skillId: number;
  skillName: string;
  canonicalKey: string;
  requirementType: RequirementType;
  weight: number;
  sortOrder: number;
}
