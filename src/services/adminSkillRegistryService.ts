import { Skill, SkillSuggestion, PageResponse } from '../types/skillRegistry';
import api from './axiosInstance'; // Assuming you have a centralized axios instance here

export const adminSkillRegistryService = {
  // Skill APIs
  getActiveSkills: async (): Promise<Skill[]> => {
    const { data } = await api.get('/skills/all');
    return data;
  },
  
  createSkill: async (skill: Partial<Skill>): Promise<Skill> => {
    const { data } = await api.post('/skills', skill);
    return data;
  },
  
  updateSkill: async (id: number, skill: Partial<Skill>): Promise<Skill> => {
    const { data } = await api.put(`/skills/${id}`, skill);
    return data;
  },

  deactivateSkill: async (id: number): Promise<void> => {
    await api.delete(`/skills/${id}`);
  },

  reactivateSkill: async (id: number): Promise<void> => {
    await api.put(`/skills/${id}/reactivate`);
  },

  hardDeleteSkill: async (id: number): Promise<void> => {
    await api.delete(`/skills/${id}/hard`);
  },

  
  resolveSkill: async (rawName: string): Promise<Skill> => {
    const { data } = await api.post('/skills/resolve', null, { params: { rawName } });
    return data;
  },

  suggestSkills: async (prefix: string): Promise<PageResponse<Skill>> => {
    const { data } = await api.get('/skills/suggest', { params: { prefix, size: 10 } });
    return data;
  },


  // Suggestion APIs
  getPendingSuggestions: async (page = 0, size = 20): Promise<PageResponse<SkillSuggestion>> => {
    const { data } = await api.get('/admin/skill-suggestions', { params: { page, size } });
    return data;
  },

  approveSuggestion: async (id: number): Promise<SkillSuggestion> => {
    const { data } = await api.post(`/admin/skill-suggestions/${id}/approve`);
    return data;
  },

  mergeSuggestion: async (id: number, matchedSkillId: number): Promise<SkillSuggestion> => {
    const { data } = await api.post(`/admin/skill-suggestions/${id}/merge`, null, { params: { matchedSkillId } });
    return data;
  },

  rejectSuggestion: async (id: number, reviewNote?: string): Promise<SkillSuggestion> => {
    const { data } = await api.post(`/admin/skill-suggestions/${id}/reject`, null, { params: { reviewNote } });
    return data;
  }
};
