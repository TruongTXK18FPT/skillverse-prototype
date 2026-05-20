import axiosInstance from './axiosInstance';
import type { PageResponse } from '../types/common';
import type {
  AiReviewStatus,
  AdminReviewDecision,
  AdminRoadmapEvidenceReviewResponse,
  AdminReviewDecisionRequest,
} from '../types/roadmapEvidenceReview';

const roadmapEvidenceReviewService = {
  getReviews: async (
    page: number = 0,
    size: number = 20,
    status?: AiReviewStatus
  ): Promise<PageResponse<AdminRoadmapEvidenceReviewResponse>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });
    if (status) {
      params.append('status', status);
    }
    const response = await axiosInstance.get<PageResponse<AdminRoadmapEvidenceReviewResponse>>(
      `/admin/roadmap-evidence-reviews?${params.toString()}`
    );
    return response.data;
  },

  getReviewDetail: async (id: number): Promise<AdminRoadmapEvidenceReviewResponse> => {
    const response = await axiosInstance.get<AdminRoadmapEvidenceReviewResponse>(
      `/admin/roadmap-evidence-reviews/${id}`
    );
    return response.data;
  },

  decideReview: async (
    id: number,
    data: AdminReviewDecisionRequest
  ): Promise<AdminRoadmapEvidenceReviewResponse> => {
    const response = await axiosInstance.post<AdminRoadmapEvidenceReviewResponse>(
      `/admin/roadmap-evidence-reviews/${id}/decide`,
      data
    );
    return response.data;
  }
};

export default roadmapEvidenceReviewService;

