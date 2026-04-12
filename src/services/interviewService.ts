import axiosInstance from './axiosInstance';
import { JobApplicationStatus } from '../data/jobDTOs';

export enum MeetingType {
  GOOGLE_MEET = 'GOOGLE_MEET',
  SKILLVERSE_ROOM = 'SKILLVERSE_ROOM',
  ZOOM = 'ZOOM',
  MICROSOFT_TEAMS = 'MICROSOFT_TEAMS',
  PHONE_CALL = 'PHONE_CALL',
  ONSITE = 'ONSITE',
}

export enum InterviewStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  NO_SHOW = 'NO_SHOW',
}

export interface CreateInterviewRequest {
  applicationId: number;
  scheduledAt: string; // ISO datetime string
  durationMinutes?: number;
  meetingType: MeetingType;
  meetingLink?: string;
  skillverseRoomId?: string;
  location?: string;
  interviewerName?: string;
  interviewNotes?: string;
}

export interface InterviewScheduleResponse {
  id: number;
  applicationId: number;
  candidateName: string;
  candidateEmail: string;
  candidateAvatarUrl?: string;
  jobTitle: string;
  scheduledAt: string;
  durationMinutes: number;
  meetingType: MeetingType;
  meetingLink?: string;
  skillverseRoomId?: string;
  location?: string;
  interviewerName?: string;
  interviewNotes?: string;
  status: InterviewStatus;
  createdAt: string;
  updatedAt: string;
}

class InterviewService {
  async scheduleInterview(data: CreateInterviewRequest): Promise<InterviewScheduleResponse> {
    try {
      const response = await axiosInstance.post<InterviewScheduleResponse>('/api/interviews', data);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      const message = axiosError.response?.data?.message || 'Failed to schedule interview';
      throw new Error(message);
    }
  }

  async getInterviewByApplication(applicationId: number): Promise<InterviewScheduleResponse> {
    try {
      const response = await axiosInstance.get<InterviewScheduleResponse>(
        `/api/interviews/application/${applicationId}`,
      );
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      const message = axiosError.response?.data?.message || 'Failed to get interview details';
      throw new Error(message);
    }
  }

  async getInterviewsByJob(jobPostingId: number): Promise<InterviewScheduleResponse[]> {
    try {
      const response = await axiosInstance.get<InterviewScheduleResponse[]>(
        `/api/interviews/job/${jobPostingId}`,
      );
      return response.data;
    } catch {
      return []; // Return empty if no interviews
    }
  }

  async completeInterview(interviewId: number, notes?: string): Promise<InterviewScheduleResponse> {
    try {
      const response = await axiosInstance.patch<InterviewScheduleResponse>(
        `/api/interviews/${interviewId}/complete`,
        null,
        { params: notes ? { notes } : undefined },
      );
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      const message = axiosError.response?.data?.message || 'Failed to complete interview';
      throw new Error(message);
    }
  }

  async cancelInterview(interviewId: number): Promise<InterviewScheduleResponse> {
    try {
      const response = await axiosInstance.patch<InterviewScheduleResponse>(
        `/api/interviews/${interviewId}/cancel`,
      );
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      const message = axiosError.response?.data?.message || 'Failed to cancel interview';
      throw new Error(message);
    }
  }

  async getMyInterviews(): Promise<InterviewScheduleResponse[]> {
    try {
      const response = await axiosInstance.get<InterviewScheduleResponse[]>(
        '/api/interviews/me',
      );
      return response.data;
    } catch {
      return [];
    }
  }

  /**
   * Update application status to OFFER_SENT or OFFER_ACCEPTED/OFFER_REJECTED.
   * For OFFER_SENT: requires REMOTE job and INTERVIEWED status.
   * For OFFER_ACCEPTED/OFFER_REJECTED: requires OFFER_SENT status.
   */
  async updateApplicationStatus(
    applicationId: number,
    status: 'OFFER_SENT' | 'OFFER_ACCEPTED' | 'OFFER_REJECTED',
    data?: { offerDetails?: string },
  ): Promise<unknown> {
    try {
      const response = await axiosInstance.patch<unknown>(
        `/api/jobs/applications/${applicationId}/status`,
        { status, ...data },
      );
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      const message = axiosError.response?.data?.message || 'Failed to update application status';
      throw new Error(message);
    }
  }
}

const interviewService = new InterviewService();
export default interviewService;
