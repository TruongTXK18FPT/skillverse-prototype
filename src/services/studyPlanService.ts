import axiosInstance from './axiosInstance';
import { 
  CreateStudySessionRequest, 
  GenerateScheduleRequest, 
  StudySessionResponse, 
  StudySessionStatus,
  RefineScheduleRequest,
  CheckScheduleHealthRequest,
  ScheduleHealthReport
} from '../types/StudyPlan';

const BASE_URL = '/study-planner';

export const studyPlanService = {
  createSession: async (request: CreateStudySessionRequest): Promise<StudySessionResponse> => {
    const response = await axiosInstance.post<StudySessionResponse>(`${BASE_URL}/sessions`, request);
    return response.data;
  },

  createSessionsBatch: async (requests: CreateStudySessionRequest[]): Promise<StudySessionResponse[]> => {
    const response = await axiosInstance.post<StudySessionResponse[]>(`${BASE_URL}/sessions/batch`, requests);
    return response.data;
  },

  getSessions: async (): Promise<StudySessionResponse[]> => {
    const response = await axiosInstance.get<StudySessionResponse[]>(`${BASE_URL}/sessions`);
    return response.data;
  },

  getSessionsInRange: async (start: string, end: string): Promise<StudySessionResponse[]> => {
    const response = await axiosInstance.get<StudySessionResponse[]>(`${BASE_URL}/sessions/range`, {
      params: { start, end }
    });
    return response.data;
  },

  updateStatus: async (sessionId: string, status: StudySessionStatus): Promise<StudySessionResponse> => {
    const response = await axiosInstance.patch<StudySessionResponse>(`${BASE_URL}/sessions/${sessionId}/status`, null, {
      params: { status }
    });
    return response.data;
  },

  deleteSession: async (sessionId: string): Promise<void> => {
    await axiosInstance.delete(`${BASE_URL}/sessions/${sessionId}`);
  },

  generateSchedule: async (request: GenerateScheduleRequest): Promise<StudySessionResponse[]> => {
    const payload = {
      ...request,
      preferredTimeWindows: request.preferredTimeWindows?.map(w => `${w.startTime}-${w.endTime}`)
    };
    const response = await axiosInstance.post<StudySessionResponse[]>(`${BASE_URL}/generate-schedule`, payload);
    return response.data;
  },

  generateProposal: async (request: GenerateScheduleRequest): Promise<StudySessionResponse[]> => {
    const payload = {
      ...request,
      preferredTimeWindows: request.preferredTimeWindows?.map(w => `${w.startTime}-${w.endTime}`)
    };
    const response = await axiosInstance.post<StudySessionResponse[]>(`${BASE_URL}/generate-proposal`, payload);
    return response.data;
  },

  refineSchedule: async (request: RefineScheduleRequest): Promise<StudySessionResponse[]> => {
    const response = await axiosInstance.post<StudySessionResponse[]>(`${BASE_URL}/refine-schedule`, request);
    return response.data;
  },

  checkScheduleHealth: async (request: CheckScheduleHealthRequest): Promise<ScheduleHealthReport> => {
    const response = await axiosInstance.post<ScheduleHealthReport>(`${BASE_URL}/schedule-health`, request);
    return response.data;
  },

  suggestHealthyAdjustments: async (request: CheckScheduleHealthRequest): Promise<ScheduleHealthReport> => {
    const response = await axiosInstance.post<ScheduleHealthReport>(`${BASE_URL}/schedule-suggest-fix`, request);
    return response.data;
  }
};
