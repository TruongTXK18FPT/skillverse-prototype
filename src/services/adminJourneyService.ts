import axiosInstance from "./axiosInstance";
import {
  AdminJourneyDashboardResponse,
  AdminJourneyListItemResponse,
  AdminJourneyPageResponse,
  AdminQuestionAnalyticsItemResponse,
} from "../types/adminJourneyAnalytics";

type JourneyListParams = {
  status?: string;
  type?: string;
  domain?: string;
  questionSource?: string;
  questionBankId?: number;
  hasRoadmap?: boolean;
  createdFrom?: string;
  createdTo?: string;
  keyword?: string;
  page?: number;
  size?: number;
};

type QuestionAnalyticsParams = {
  questionBankId?: number;
  difficulty?: string;
  skillArea?: string;
  source?: string;
  isActive?: boolean;
  keyword?: string;
  page?: number;
  size?: number;
};

const adminJourneyService = {
  async getDashboard(): Promise<AdminJourneyDashboardResponse> {
    const response = await axiosInstance.get<AdminJourneyDashboardResponse>(
      "/api/v1/admin/journeys/dashboard",
    );
    return response.data;
  },

  async getJourneys(
    params: JourneyListParams,
  ): Promise<AdminJourneyPageResponse<AdminJourneyListItemResponse>> {
    const response = await axiosInstance.get<
      AdminJourneyPageResponse<AdminJourneyListItemResponse>
    >("/api/v1/admin/journeys/list", { params });
    return response.data;
  },

  async getQuestionAnalytics(
    params: QuestionAnalyticsParams,
  ): Promise<AdminJourneyPageResponse<AdminQuestionAnalyticsItemResponse>> {
    const response = await axiosInstance.get<
      AdminJourneyPageResponse<AdminQuestionAnalyticsItemResponse>
    >("/api/v1/admin/journeys/questions", { params });
    return response.data;
  },
};

export default adminJourneyService;
