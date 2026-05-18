import { axiosInstance } from './axiosInstance';
import type { MentorTeachingEligibilityResponse } from '../types/mentorEligibility';

const params = (nodeId?: string | null) => (nodeId ? { nodeId } : undefined);

export const mentorEligibilityService = {
  evaluateJourney: async (
    journeyId: number,
    mentorId: number,
    nodeId?: string | null,
  ): Promise<MentorTeachingEligibilityResponse> => {
    const response = await axiosInstance.get<MentorTeachingEligibilityResponse>(
      `/api/v1/mentor-eligibility/journeys/${journeyId}/mentors/${mentorId}`,
      { params: params(nodeId) },
    );
    return response.data;
  },

  evaluateRoadmap: async (
    roadmapSessionId: number,
    mentorId: number,
    nodeId?: string | null,
  ): Promise<MentorTeachingEligibilityResponse> => {
    const response = await axiosInstance.get<MentorTeachingEligibilityResponse>(
      `/api/v1/mentor-eligibility/roadmaps/${roadmapSessionId}/mentors/${mentorId}`,
      { params: params(nodeId) },
    );
    return response.data;
  },
};
