// CV Builder API - Functions for CV export, editing, and AI enhancement
import { axiosInstance } from "../services/axiosInstance";

/**
 * Export CV from portfolio data without AI processing
 */
export async function exportCVFromPortfolio(
  request: CVExportRequest,
): Promise<CVExportResponse> {
  const response = await axiosInstance.post("/portfolio/cv/export", request);
  return response.data;
}

/**
 * Enhance a specific CV section using AI
 */
export async function enhanceCVSection(
  request: AIEnhanceSectionRequest,
): Promise<AIEnhanceSectionResponse> {
  const response = await axiosInstance.post("/portfolio/cv/enhance", request);
  return response.data;
}

/**
 * Update CV content
 */
export async function updateCV(
  cvId: number,
  updates: { cvContent?: string; cvJson?: string },
): Promise<CVUpdateResponse> {
  const response = await axiosInstance.put(`/portfolio/cv/${cvId}`, updates);
  return response.data;
}

/**
 * Get all CVs for the current user
 */
export async function getUserCVs(): Promise<CVListResponse> {
  const response = await axiosInstance.get("/portfolio/cv/all");
  return response.data;
}

/**
 * Get active CV
 */
export async function getActiveCV(): Promise<CVResponse> {
  const response = await axiosInstance.get("/portfolio/cv/active");
  return response.data;
}

/**
 * Set a CV as active
 */
export async function setActiveCV(cvId: number): Promise<CVResponse> {
  const response = await axiosInstance.put(
    `/portfolio/cv/${cvId}/set-active`,
    {},
  );
  return response.data;
}

/**
 * Delete a CV
 */
export async function deleteCV(
  cvId: number,
): Promise<{ success: boolean; message: string }> {
  const response = await axiosInstance.delete(`/portfolio/cv/${cvId}`);
  return response.data;
}

// ==================== Types ====================

export interface CVExportRequest {
  templateName: "PROFESSIONAL" | "CREATIVE" | "MINIMAL" | "MODERN";
  targetRole?: string;
  targetIndustry?: string;
  additionalInstructions?: string;
  includeProjects?: boolean;
  includeCertificates?: boolean;
  includeReviews?: boolean;
  includeCompletedMissions?: boolean;
}

export interface CVExportResponse {
  success: boolean;
  message: string;
  data: GeneratedCV;
}

export interface AIEnhanceSectionRequest {
  section: "summary" | "experience" | "project" | "education" | "skill";
  itemId?: string;
  instruction: string;
  currentContent: string;
  contextData?: Record<string, string>;
}

export interface AIEnhanceSectionResponse {
  success: boolean;
  message: string;
  data: {
    enhancedContent: string;
    alternatives: string[];
    section: string;
    itemId?: string;
    suggestions?: string;
  };
}

export interface CVUpdateResponse {
  success: boolean;
  message: string;
  data: GeneratedCV;
}

export interface CVListResponse {
  success: boolean;
  data: GeneratedCV[];
}

export interface CVResponse {
  success: boolean;
  data: GeneratedCV;
}

export interface GeneratedCV {
  id: number;
  userId: number;
  cvContent: string;
  cvJson: string;
  templateName: string;
  isActive: boolean;
  version: number;
  generatedByAi: boolean;
  pdfUrl?: string;
  createdAt: string;
  updatedAt: string;
}
