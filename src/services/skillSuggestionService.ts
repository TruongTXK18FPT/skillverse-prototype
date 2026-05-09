import api from './axiosInstance';

export interface SkillSuggestionDto {
  id?: number;
  suggestedName: string;
  suggestedCanonicalKey?: string;
  suggestedBy?: number;
  reason?: string;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewNote?: string;
  resolvedSkillId?: number;
}

export const skillSuggestionService = {
  suggestSkill: async (dto: SkillSuggestionDto): Promise<SkillSuggestionDto> => {
    const { data } = await api.post('/skill-suggestions', dto);
    return data;
  }
};
