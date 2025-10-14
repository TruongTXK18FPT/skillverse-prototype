import axiosInstance from './axiosInstance';
import {
  GenerateRoadmapRequest,
  RoadmapResponse,
  RoadmapSessionSummary,
  ValidationResult
} from '../types/Roadmap';

// Request deduplication: Prevent duplicate API calls for the same request
let ongoingGenerateRequest: Promise<RoadmapResponse> | null = null;
let lastRequestKey: string | null = null;

/**
 * Create a unique key for a roadmap generation request
 */
const createRequestKey = (request: GenerateRoadmapRequest): string => {
  return JSON.stringify({
    goal: request.goal.toLowerCase().trim(),
    duration: request.duration,
    experience: request.experience,
    style: request.style
  });
};

/**
 * Service for AI Roadmap API calls
 */
const aiRoadmapService = {
  /**
   * Pre-validate roadmap generation request (V2)
   * Returns validation warnings/errors before actual generation
   */
  preValidate: async (request: GenerateRoadmapRequest): Promise<ValidationResult[]> => {
    try {
      const response = await axiosInstance.post<ValidationResult[]>(
        '/api/v1/ai/roadmap/validate',
        request
      );
      return response.data;
    } catch (error) {
      console.error('Failed to validate request:', error);
      const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
      throw new Error(message || 'Failed to validate request.');
    }
  },

  /**
   * Generate a new AI-powered roadmap with request deduplication
   * Prevents duplicate API calls if the same request is made while another is in progress
   */
  generateRoadmap: async (request: GenerateRoadmapRequest): Promise<RoadmapResponse> => {
    const requestKey = createRequestKey(request);
    
    // If same request is already in progress, return the ongoing promise
    if (ongoingGenerateRequest && lastRequestKey === requestKey) {
      console.log('[Roadmap Service] Duplicate request detected, using ongoing request');
      return ongoingGenerateRequest;
    }

    try {
      lastRequestKey = requestKey;
      ongoingGenerateRequest = axiosInstance.post<RoadmapResponse>(
        '/api/v1/ai/roadmap/generate',
        request
      ).then(response => response.data);
      
      const result = await ongoingGenerateRequest;
      return result;
    } catch (error) {
      console.error('Failed to generate roadmap:', error);
      const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
      throw new Error(message || 'Failed to generate roadmap. Please try again.');
    } finally {
      // Clear ongoing request after completion (successful or failed)
      ongoingGenerateRequest = null;
      lastRequestKey = null;
    }
  },

  /**
   * Get all roadmap sessions for the current user
   */
  getUserRoadmaps: async (): Promise<RoadmapSessionSummary[]> => {
    try {
      const response = await axiosInstance.get<RoadmapSessionSummary[]>(
        '/api/v1/ai/roadmap'
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch roadmaps:', error);
      const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
      throw new Error(message || 'Failed to load roadmaps.');
    }
  },

  /**
   * Get a specific roadmap by ID
   */
  getRoadmapById: async (sessionId: number): Promise<RoadmapResponse> => {
    try {
      const response = await axiosInstance.get<RoadmapResponse>(
        `/api/v1/ai/roadmap/${sessionId}`
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch roadmap:', error);
      const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
      throw new Error(message || 'Failed to load roadmap details.');
    }
  },

  /**
   * Update quest progress - mark as completed or not completed
   */
  updateQuestProgress: async (
    sessionId: number,
    questId: string,
    completed: boolean
  ): Promise<{
    sessionId: number;
    questId: string;
    completed: boolean;
    stats: {
      totalQuests: number;
      completedQuests: number;
      completionPercentage: number;
    };
  }> => {
    try {
      const response = await axiosInstance.post(
        `/api/v1/ai/roadmap/${sessionId}/progress`,
        { questId, completed }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to update quest progress:', error);
      const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
      throw new Error(message || 'Failed to update progress.');
    }
  },

};

export default aiRoadmapService;
