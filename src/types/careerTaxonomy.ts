export interface Domain {
  id: number;
  code: string;
  name: string;
  description: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface JobPosition {
  id: number;
  code: string;
  name: string;
  description: string;
  domainId: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface JobPositionTrack {
  id: number;
  code: string;
  name: string;
  description: string;
  jobPositionId: number;
  targetLevel: 'INTERNSHIP' | 'FRESHER' | 'JUNIOR' | 'MIDDLE' | 'SENIOR';
  status: 'ACTIVE' | 'INACTIVE';
}

export interface JobPositionTrackSkill {
  id: number;
  trackId: number;
  skillId: number;
  skillName: string;
  canonicalKey: string;
  requirementType: 'REQUIRED' | 'OPTIONAL';
  importanceLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  sortOrder: number;
}
