import axiosInstance from './axiosInstance';

// ==================== TYPES ====================
export interface ExpertPromptConfig {
  id: number;
  domain: string;
  industry: string;
  jobRole: string;
  keywords?: string;
  domainRules?: string;
  rolePrompt?: string;
  systemPrompt: string;
  mediaUrl?: string;
  isActive: boolean;
  active?: boolean; // Lombok alias
  createdAt: string;
  updatedAt: string;
}

export interface ExpertPromptRequest {
  domain: string;
  industry: string;
  jobRole: string;
  keywords?: string;
  domainRules?: string;
  rolePrompt?: string;
  systemPrompt?: string;
  mediaUrl?: string;
  isActive: boolean;
}

export interface ExpertFieldResponse {
  domain: string;
  industries: {
    industry: string;
    roles: {
      jobRole: string;
      keywords?: string;
      mediaUrl?: string;
      isActive: boolean;
    }[];
  }[];
}

// ==================== ADMIN API ====================

/**
 * Get all expert prompt configs (Admin only)
 */
export const getAllExpertPrompts = async (): Promise<ExpertPromptConfig[]> => {
  const response = await axiosInstance.get('/api/v1/admin/expert-prompts');
  return response.data;
};

/**
 * Get expert prompt by ID (Admin only)
 */
export const getExpertPromptById = async (id: number): Promise<ExpertPromptConfig> => {
  const response = await axiosInstance.get(`/api/v1/admin/expert-prompts/${id}`);
  return response.data;
};

/**
 * Create new expert prompt (Admin only)
 */
export const createExpertPrompt = async (request: ExpertPromptRequest): Promise<ExpertPromptConfig> => {
  const response = await axiosInstance.post('/api/v1/admin/expert-prompts', request);
  return response.data;
};

/**
 * Update expert prompt (Admin only)
 */
export const updateExpertPrompt = async (id: number, request: ExpertPromptRequest): Promise<ExpertPromptConfig> => {
  const response = await axiosInstance.put(`/api/v1/admin/expert-prompts/${id}`, request);
  return response.data;
};

/**
 * Delete expert prompt (Admin only)
 */
export const deleteExpertPrompt = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/api/v1/admin/expert-prompts/${id}`);
};

/**
 * Upload media for expert prompt (Admin only)
 */
export const uploadExpertMedia = async (id: number, file: File): Promise<{ message: string; mediaUrl: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await axiosInstance.post(`/api/v1/admin/expert-prompts/${id}/media`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

/**
 * Update media URL directly (Admin only)
 */
export const updateExpertMediaUrl = async (id: number, mediaUrl: string): Promise<{ message: string; mediaUrl: string }> => {
  const response = await axiosInstance.put(`/api/v1/admin/expert-prompts/${id}/media-url`, { mediaUrl });
  return response.data;
};

/**
 * Delete media for expert prompt (Admin only)
 */
export const deleteExpertMedia = async (id: number): Promise<{ message: string }> => {
  const response = await axiosInstance.delete(`/api/v1/admin/expert-prompts/${id}/media`);
  return response.data;
};

// ==================== PUBLIC API ====================

/**
 * Get all expert fields (hierarchical structure)
 */
export const getExpertFields = async (): Promise<ExpertFieldResponse[]> => {
  const response = await axiosInstance.get('/api/v1/expert-fields');
  return response.data;
};

/**
 * Get all job roles (flat list)
 */
export const getAllJobRoles = async (): Promise<string[]> => {
  const response = await axiosInstance.get('/api/v1/expert-fields/roles');
  return response.data;
};

/**
 * Get all domains
 */
export const getAllDomains = async (): Promise<string[]> => {
  const response = await axiosInstance.get('/api/v1/expert-fields/domains');
  return response.data;
};

/**
 * Get all industries
 */
export const getAllIndustries = async (): Promise<string[]> => {
  const response = await axiosInstance.get('/api/v1/expert-fields/industries');
  return response.data;
};
