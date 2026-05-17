import axiosInstance from "./axiosInstance";
import type {
  CreateRoadmapPurchaseRequest,
  RoadmapOfferingRequest,
  RoadmapOfferingResponse,
  RoadmapPurchaseResponse,
  RoadmapTemplateRequest,
  RoadmapTemplateResponse,
} from "../types/roadmapPackage";

const TEMPLATE_URL = "/v1/roadmap-templates";
const OFFERING_URL = "/v1/roadmap-offerings";
const PURCHASE_URL = "/v1/roadmap-purchases";
const ADMIN_TEMPLATE_URL = "/v1/admin/roadmap-templates";

export const roadmapPackageService = {
  createTemplate: async (
    payload: RoadmapTemplateRequest,
  ): Promise<RoadmapTemplateResponse> => {
    const { data } = await axiosInstance.post<RoadmapTemplateResponse>(
      TEMPLATE_URL,
      payload,
    );
    return data;
  },

  updateTemplate: async (
    templateId: number,
    payload: RoadmapTemplateRequest,
  ): Promise<RoadmapTemplateResponse> => {
    const { data } = await axiosInstance.put<RoadmapTemplateResponse>(
      `${TEMPLATE_URL}/${templateId}`,
      payload,
    );
    return data;
  },

  getMyTemplates: async (): Promise<RoadmapTemplateResponse[]> => {
    const { data } =
      await axiosInstance.get<RoadmapTemplateResponse[]>(`${TEMPLATE_URL}/my`);
    return data;
  },

  getTemplate: async (templateId: number): Promise<RoadmapTemplateResponse> => {
    const { data } = await axiosInstance.get<RoadmapTemplateResponse>(
      `${TEMPLATE_URL}/${templateId}`,
    );
    return data;
  },

  submitTemplate: async (
    templateId: number,
  ): Promise<RoadmapTemplateResponse> => {
    const { data } = await axiosInstance.post<RoadmapTemplateResponse>(
      `${TEMPLATE_URL}/${templateId}/submit`,
    );
    return data;
  },

  getSubmittedTemplates: async (): Promise<RoadmapTemplateResponse[]> => {
    const { data } = await axiosInstance.get<RoadmapTemplateResponse[]>(
      `${ADMIN_TEMPLATE_URL}/submitted`,
    );
    return data;
  },

  approveTemplate: async (
    templateId: number,
  ): Promise<RoadmapTemplateResponse> => {
    const { data } = await axiosInstance.post<RoadmapTemplateResponse>(
      `${ADMIN_TEMPLATE_URL}/${templateId}/approve`,
    );
    return data;
  },

  rejectTemplate: async (
    templateId: number,
  ): Promise<RoadmapTemplateResponse> => {
    const { data } = await axiosInstance.post<RoadmapTemplateResponse>(
      `${ADMIN_TEMPLATE_URL}/${templateId}/reject`,
    );
    return data;
  },

  createOffering: async (
    payload: RoadmapOfferingRequest,
  ): Promise<RoadmapOfferingResponse> => {
    const { data } = await axiosInstance.post<RoadmapOfferingResponse>(
      OFFERING_URL,
      payload,
    );
    return data;
  },

  updateOffering: async (
    offeringId: number,
    payload: RoadmapOfferingRequest,
  ): Promise<RoadmapOfferingResponse> => {
    const { data } = await axiosInstance.put<RoadmapOfferingResponse>(
      `${OFFERING_URL}/${offeringId}`,
      payload,
    );
    return data;
  },

  getMyOfferings: async (): Promise<RoadmapOfferingResponse[]> => {
    const { data } =
      await axiosInstance.get<RoadmapOfferingResponse[]>(`${OFFERING_URL}/my`);
    return data;
  },

  getActiveOfferings: async (): Promise<RoadmapOfferingResponse[]> => {
    const { data } = await axiosInstance.get<RoadmapOfferingResponse[]>(
      OFFERING_URL,
    );
    return data;
  },

  getOffering: async (offeringId: number): Promise<RoadmapOfferingResponse> => {
    const { data } = await axiosInstance.get<RoadmapOfferingResponse>(
      `${OFFERING_URL}/${offeringId}`,
    );
    return data;
  },

  publishOffering: async (
    offeringId: number,
  ): Promise<RoadmapOfferingResponse> => {
    const { data } = await axiosInstance.post<RoadmapOfferingResponse>(
      `${OFFERING_URL}/${offeringId}/publish`,
    );
    return data;
  },

  pauseOffering: async (
    offeringId: number,
  ): Promise<RoadmapOfferingResponse> => {
    const { data } = await axiosInstance.post<RoadmapOfferingResponse>(
      `${OFFERING_URL}/${offeringId}/pause`,
    );
    return data;
  },

  purchase: async (
    payload: CreateRoadmapPurchaseRequest,
  ): Promise<RoadmapPurchaseResponse> => {
    const { data } = await axiosInstance.post<RoadmapPurchaseResponse>(
      PURCHASE_URL,
      payload,
    );
    return data;
  },

  getMyPurchases: async (): Promise<RoadmapPurchaseResponse[]> => {
    const { data } =
      await axiosInstance.get<RoadmapPurchaseResponse[]>(`${PURCHASE_URL}/my`);
    return data;
  },

  getPurchase: async (purchaseId: number): Promise<RoadmapPurchaseResponse> => {
    const { data } = await axiosInstance.get<RoadmapPurchaseResponse>(
      `${PURCHASE_URL}/${purchaseId}`,
    );
    return data;
  },

  cancelPurchase: async (
    purchaseId: number,
  ): Promise<RoadmapPurchaseResponse> => {
    const { data } = await axiosInstance.post<RoadmapPurchaseResponse>(
      `${PURCHASE_URL}/${purchaseId}/cancel`,
    );
    return data;
  },
};

export default roadmapPackageService;

