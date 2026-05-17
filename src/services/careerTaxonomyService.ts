import { Domain, JobPosition, JobPositionTrack, JobPositionTrackSkill } from '../types/careerTaxonomy';
import api from './axiosInstance';

export const careerTaxonomyService = {
  // Read APIs for Admin
  getDomains: async (): Promise<Domain[]> => {
    const { data } = await api.get('/admin/domains');
    return data;
  },

  getJobPositions: async (domainId?: number): Promise<JobPosition[]> => {
    const { data } = await api.get('/admin/job-positions', { params: { domainId } });
    return data;
  },

  getTracks: async (jobPositionId?: number): Promise<JobPositionTrack[]> => {
    const { data } = await api.get(`/admin/job-position-tracks`, { params: { jobPositionId } });
    return data;
  },

  getTrackSkills: async (trackId: number): Promise<JobPositionTrackSkill[]> => {
    const { data } = await api.get(`/job-position-tracks/${trackId}/skills`);
    return data;
  },

  // Read APIs for mentors/users
  getActiveDomains: async (): Promise<Domain[]> => {
    const { data } = await api.get('/domains');
    return data;
  },

  getActiveJobPositions: async (domainId?: number): Promise<JobPosition[]> => {
    const { data } = await api.get('/job-positions', { params: { domainId } });
    return data;
  },

  getActiveTracks: async (jobPositionId: number): Promise<JobPositionTrack[]> => {
    const { data } = await api.get(`/job-positions/${jobPositionId}/tracks`);
    return data;
  },

  searchJobPositionsBySkill: async (skillId: number): Promise<JobPosition[]> => {
    const { data } = await api.get('/job-positions/search-by-skill', { params: { skillId } });
    return data;
  },

  // Write APIs (Admin)
  createDomain: async (domain: Partial<Domain>): Promise<Domain> => {
    const { data } = await api.post('/admin/domains', domain);
    return data;
  },

  updateDomain: async (id: number, domain: Partial<Domain>): Promise<Domain> => {
    const { data } = await api.put(`/admin/domains/${id}`, domain);
    return data;
  },

  deactivateDomain: async (id: number): Promise<void> => {
    await api.delete(`/admin/domains/${id}`);
  },

  reactivateDomain: async (id: number): Promise<void> => {
    await api.put(`/admin/domains/${id}/reactivate`);
  },

  hardDeleteDomain: async (id: number): Promise<void> => {
    await api.delete(`/admin/domains/${id}/hard`);
  },

  createJobPosition: async (jp: Partial<JobPosition>): Promise<JobPosition> => {
    const { data } = await api.post('/admin/job-positions', jp);
    return data;
  },

  updateJobPosition: async (id: number, jp: Partial<JobPosition>): Promise<JobPosition> => {
    const { data } = await api.put(`/admin/job-positions/${id}`, jp);
    return data;
  },

  deactivateJobPosition: async (id: number): Promise<void> => {
    await api.delete(`/admin/job-positions/${id}`);
  },

  reactivateJobPosition: async (id: number): Promise<void> => {
    await api.put(`/admin/job-positions/${id}/reactivate`);
  },

  hardDeleteJobPosition: async (id: number): Promise<void> => {
    await api.delete(`/admin/job-positions/${id}/hard`);
  },

  createTrack: async (track: Partial<JobPositionTrack>): Promise<JobPositionTrack> => {
    const { data } = await api.post('/admin/job-position-tracks', track);
    return data;
  },

  updateTrack: async (id: number, track: Partial<JobPositionTrack>): Promise<JobPositionTrack> => {
    const { data } = await api.put(`/admin/job-position-tracks/${id}`, track);
    return data;
  },

  deactivateTrack: async (id: number): Promise<void> => {
    await api.delete(`/admin/job-position-tracks/${id}`);
  },

  reactivateTrack: async (id: number): Promise<void> => {
    await api.put(`/admin/job-position-tracks/${id}/reactivate`);
  },

  hardDeleteTrack: async (id: number): Promise<void> => {
    await api.delete(`/admin/job-position-tracks/${id}/hard`);
  },

  updateTrackSkills: async (trackId: number, skills: Partial<JobPositionTrackSkill>[]): Promise<JobPositionTrackSkill[]> => {
    const { data } = await api.post(`/admin/job-position-tracks/${trackId}/skills`, skills);
    return data;
  }
};
