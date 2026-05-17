import axiosInstance from "./axiosInstance";
import type {
  RoadmapTemplateAllocationPreviewResponse,
  RoadmapTemplateCourseCandidateResponse,
  RoadmapTemplateCourseLinkPolicy,
  RoadmapTemplateRequest,
  RoadmapTemplateResponse,
  RoadmapTemplateStatus,
  RoadmapTemplateValidationResponse,
} from "../types/roadmapTemplate";

const TEMPLATE_URL = "/v1/roadmap-templates";
const ADMIN_TEMPLATE_URL = "/v1/admin/roadmap-templates";

export const roadmapTemplateService = {
  createTemplate: async (
    payload: RoadmapTemplateRequest,
  ): Promise<RoadmapTemplateResponse> => {
    const { data } = await axiosInstance.post<RoadmapTemplateResponse>(
      ADMIN_TEMPLATE_URL,
      payload,
    );
    return data;
  },

  updateTemplate: async (
    templateId: number,
    payload: RoadmapTemplateRequest,
  ): Promise<RoadmapTemplateResponse> => {
    const { data } = await axiosInstance.put<RoadmapTemplateResponse>(
      `${ADMIN_TEMPLATE_URL}/${templateId}`,
      payload,
    );
    return data;
  },

  getTemplate: async (templateId: number): Promise<RoadmapTemplateResponse> => {
    const { data } = await axiosInstance.get<RoadmapTemplateResponse>(
      `${TEMPLATE_URL}/${templateId}`,
    );
    return data;
  },

  listAdminTemplates: async (params?: {
    domainId?: number | null;
    jobPositionId?: number | null;
    jobPositionTrackId?: number | null;
    status?: RoadmapTemplateStatus | "";
  }): Promise<RoadmapTemplateResponse[]> => {
    const { data } = await axiosInstance.get<RoadmapTemplateResponse[]>(
      ADMIN_TEMPLATE_URL,
      { params },
    );
    return data;
  },

  previewAllocation: async (
    payload: RoadmapTemplateRequest,
  ): Promise<RoadmapTemplateAllocationPreviewResponse> => {
    const { data } = await axiosInstance.post<RoadmapTemplateAllocationPreviewResponse>(
      `${ADMIN_TEMPLATE_URL}/preview-allocation`,
      payload,
    );
    return data;
  },

  validateTemplate: async (
    payload: RoadmapTemplateRequest,
  ): Promise<RoadmapTemplateValidationResponse> => {
    const { data } = await axiosInstance.post<RoadmapTemplateValidationResponse>(
      `${ADMIN_TEMPLATE_URL}/validate`,
      payload,
    );
    return data;
  },

  getCourseCandidates: async (
    skillId: number,
    policy: RoadmapTemplateCourseLinkPolicy = "AUTO_HYBRID",
    limit = 5,
  ): Promise<RoadmapTemplateCourseCandidateResponse[]> => {
    const { data } = await axiosInstance.get<RoadmapTemplateCourseCandidateResponse[]>(
      `${ADMIN_TEMPLATE_URL}/course-candidates`,
      { params: { skillId, policy, limit } },
    );
    return data;
  },

  publishTemplate: async (
    templateId: number,
  ): Promise<RoadmapTemplateResponse> => {
    const { data } = await axiosInstance.post<RoadmapTemplateResponse>(
      `${ADMIN_TEMPLATE_URL}/${templateId}/publish`,
    );
    return data;
  },

  archiveTemplate: async (
    templateId: number,
  ): Promise<RoadmapTemplateResponse> => {
    const { data } = await axiosInstance.post<RoadmapTemplateResponse>(
      `${ADMIN_TEMPLATE_URL}/${templateId}/archive`,
    );
    return data;
  },
};

export default roadmapTemplateService;
