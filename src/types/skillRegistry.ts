export interface Skill {
  id: number;
  name: string;
  canonicalKey: string;
  description: string;
  parentSkillId?: number | null;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

export interface SkillSuggestion {
  id: number;
  suggestedName: string;
  suggestedCanonicalKey: string;
  description: string;
  sourceUserId: number;
  status: 'PENDING' | 'APPROVED_CREATED' | 'MERGED_TO_EXISTING' | 'REJECTED';
  matchedSkillId?: number | null;
  reviewNote?: string | null;
  createdAt: string;
}

export interface PageResponse<T> {
  items: T[];
  page: number;
  size: number;
  total: number;
}
