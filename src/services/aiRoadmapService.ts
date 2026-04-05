import axiosInstance from './axiosInstance';
import {
  GenerateRoadmapRequest,
  RoadmapResponse,
  RoadmapStatusCounts,
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
    goal: request.goal?.toLowerCase().trim(),
    duration: request.duration,
    experience: request.experience,
    style: request.style,
    roadmapType: request.roadmapType,
    target: request.target?.toLowerCase().trim(),
    desiredDuration: request.desiredDuration,
    dailyTime: request.dailyTime,
    priority: request.priority,
    industry: request.industry
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
      
      return ongoingGenerateRequest;
    }

    try {
      lastRequestKey = requestKey;
      ongoingGenerateRequest = axiosInstance.post<RoadmapResponse>(
        '/api/v1/ai/roadmap/generate',
        request,
        {
          timeout: 3600000 // 1 hour timeout
        }
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
  getUserRoadmaps: async (includeDeleted = false): Promise<RoadmapSessionSummary[]> => {
    try {
      const response = await axiosInstance.get<RoadmapSessionSummary[]>(
        '/api/v1/ai/roadmap',
        { params: { includeDeleted } }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch roadmaps:', error);
      const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
      throw new Error(message || 'Failed to load roadmaps.');
    }
  },

  /**
   * Get lifecycle counts for current user's roadmaps
   */
  getUserRoadmapStatusCounts: async (): Promise<RoadmapStatusCounts> => {
    try {
      const response = await axiosInstance.get<Record<string, number>>(
        '/api/v1/ai/roadmap/status-counts'
      );

      const active = Number(response.data.active ?? 0);
      const paused = Number(response.data.paused ?? 0);
      const deleted = Number(response.data.deleted ?? 0);
      const total = Number(response.data.total ?? (active + paused + deleted));

      return {
        active,
        paused,
        deleted,
        total,
      };
    } catch (error) {
      console.error('Failed to fetch roadmap status counts:', error);
      const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
      throw new Error(message || 'Failed to load roadmap status counts.');
    }
  },

  /**
   * Get only soft-deleted roadmaps for current user
   */
  getUserDeletedRoadmaps: async (): Promise<RoadmapSessionSummary[]> => {
    try {
      const response = await axiosInstance.get<RoadmapSessionSummary[]>(
        '/api/v1/ai/roadmap/deleted'
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch deleted roadmaps:', error);
      const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
      throw new Error(message || 'Failed to load deleted roadmaps.');
    }
  },

  /**
   * Get ALL roadmaps for Admin Analytics
   */
  getAllRoadmaps: async (): Promise<RoadmapSessionSummary[]> => {
    try {
      const response = await axiosInstance.get<RoadmapSessionSummary[]>(
        '/api/v1/roadmaps?includeDeleted=false'
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch all roadmaps:', error);
      return [];
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
   * Activate a roadmap and automatically pause other active roadmaps of the user.
   */
  activateRoadmap: async (sessionId: number): Promise<void> => {
    try {
      await axiosInstance.put(`/api/v1/ai/roadmap/${sessionId}/activate`);
    } catch (error) {
      console.error('Failed to activate roadmap:', error);
      const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
      throw new Error(message || 'Failed to activate roadmap.');
    }
  },

  /**
   * Pause a roadmap.
   */
  pauseRoadmap: async (sessionId: number): Promise<void> => {
    try {
      await axiosInstance.put(`/api/v1/ai/roadmap/${sessionId}/pause`);
    } catch (error) {
      console.error('Failed to pause roadmap:', error);
      const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
      throw new Error(message || 'Failed to pause roadmap.');
    }
  },

  /**
   * Soft-delete a roadmap owned by the current user.
   */
  deleteRoadmap: async (sessionId: number): Promise<void> => {
    try {
      await axiosInstance.delete(`/api/v1/ai/roadmap/${sessionId}`);
    } catch (error) {
      console.error('Failed to delete roadmap:', error);
      const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
      throw new Error(message || 'Failed to delete roadmap.');
    }
  },

  /**
   * Permanently delete a roadmap and its direct linked data.
   */
  permanentDeleteRoadmap: async (sessionId: number): Promise<void> => {
    try {
      await axiosInstance.delete(`/api/v1/ai/roadmap/${sessionId}/permanent`);
    } catch (error) {
      console.error('Failed to permanently delete roadmap:', error);
      const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
      throw new Error(message || 'Failed to permanently delete roadmap.');
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
