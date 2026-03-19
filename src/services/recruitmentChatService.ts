import axiosInstance from './axiosInstance';
import {
  RecruitmentSessionResponse,
  RecruitmentMessageResponse,
  CreateRecruitmentSessionRequest,
  SendRecruitmentMessageRequest,
  RecruitmentSessionStatus
} from '../data/portfolioDTOs';

// Helper type for axios error handling
type AxiosError = { response?: { data?: { message?: string } } };

class RecruitmentChatService {

  private handleError(error: unknown, defaultMessage: string): never {
    const axiosError = error as AxiosError;
    const errorMessage = axiosError.response?.data?.message || defaultMessage;
    console.error(`${defaultMessage}:`, errorMessage);
    throw new Error(errorMessage);
  }

  /**
   * Create a new recruitment session (recruiter contacting candidate)
   * @requires RECRUITER role
   */
  async createSession(request: CreateRecruitmentSessionRequest): Promise<RecruitmentSessionResponse> {
    try {
      const response = await axiosInstance.post<RecruitmentSessionResponse>(
        '/api/v1/recruitment/sessions',
        request
      );
      return response.data;
    } catch (error) {
      this.handleError(error, 'Failed to create recruitment session');
    }
  }

  /**
   * Get or create a recruitment session (used for seamless chat initiation)
   * @requires RECRUITER role
   */
  async getOrCreateSession(
    candidateId: number,
    jobId?: number,
    sourceType: string = 'MANUAL'
  ): Promise<RecruitmentSessionResponse> {
    try {
      const params = new URLSearchParams();
      params.append('candidateId', candidateId.toString());
      if (jobId) params.append('jobId', jobId.toString());
      params.append('sourceType', sourceType);

      const response = await axiosInstance.post<RecruitmentSessionResponse>(
        `/api/v1/recruitment/sessions/get-or-create?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      this.handleError(error, 'Failed to get or create session');
    }
  }

  /**
   * Get recruiter's recruitment sessions
   * @requires RECRUITER role
   */
  async getRecruiterSessions(
    page: number = 0,
    size: number = 20,
    sortBy: string = 'lastMessageAt',
    sortDir: string = 'desc'
  ): Promise<{ sessions: RecruitmentSessionResponse[]; totalElements: number; totalPages: number }> {
    try {
      const response = await axiosInstance.get('/api/v1/recruitment/sessions', {
        params: { page, size, sortBy, sortDir }
      });
      return {
        sessions: response.data.content || [],
        totalElements: response.data.totalElements || 0,
        totalPages: response.data.totalPages || 0
      };
    } catch (error) {
      this.handleError(error, 'Failed to get recruiter sessions');
    }
  }

  /**
   * Get candidate's (user's) recruitment sessions
   * @requires USER role
   */
  async getCandidateSessions(
    page: number = 0,
    size: number = 20,
    sortBy: string = 'lastMessageAt',
    sortDir: string = 'desc'
  ): Promise<{ sessions: RecruitmentSessionResponse[]; totalElements: number; totalPages: number }> {
    try {
      const response = await axiosInstance.get('/api/v1/recruitment/my-sessions', {
        params: { page, size, sortBy, sortDir }
      });
      return {
        sessions: response.data.content || [],
        totalElements: response.data.totalElements || 0,
        totalPages: response.data.totalPages || 0
      };
    } catch (error) {
      this.handleError(error, 'Failed to get candidate sessions');
    }
  }

  /**
   * Get a specific session by ID
   * @requires RECRUITER or USER role
   */
  async getSessionById(sessionId: number): Promise<RecruitmentSessionResponse> {
    try {
      const response = await axiosInstance.get<RecruitmentSessionResponse>(
        `/api/v1/recruitment/sessions/${sessionId}`
      );
      return response.data;
    } catch (error) {
      this.handleError(error, 'Failed to get session');
    }
  }

  /**
   * Search recruiter's sessions
   * @requires RECRUITER role
   */
  async searchSessions(
    query: string,
    page: number = 0,
    size: number = 20
  ): Promise<{ sessions: RecruitmentSessionResponse[]; totalElements: number; totalPages: number }> {
    try {
      const response = await axiosInstance.get('/api/v1/recruitment/sessions/search', {
        params: { query, page, size }
      });
      return {
        sessions: response.data.content || [],
        totalElements: response.data.totalElements || 0,
        totalPages: response.data.totalPages || 0
      };
    } catch (error) {
      this.handleError(error, 'Failed to search sessions');
    }
  }

  /**
   * Get sessions by job
   * @requires RECRUITER role
   */
  async getSessionsByJob(jobId: number): Promise<RecruitmentSessionResponse[]> {
    try {
      const response = await axiosInstance.get<RecruitmentSessionResponse[]>(
        `/api/v1/recruitment/sessions/job/${jobId}`
      );
      return response.data || [];
    } catch (error) {
      this.handleError(error, 'Failed to get sessions by job');
    }
  }

  /**
   * Send a message in a recruitment session
   * @requires RECRUITER or USER role
   */
  async sendMessage(request: SendRecruitmentMessageRequest): Promise<RecruitmentMessageResponse> {
    try {
      const response = await axiosInstance.post<RecruitmentMessageResponse>(
        '/api/v1/recruitment/messages',
        request
      );
      return response.data;
    } catch (error) {
      this.handleError(error, 'Failed to send message');
    }
  }

  /**
   * Get messages from a session
   * @requires RECRUITER or USER role
   */
  async getSessionMessages(
    sessionId: number,
    page: number = 0,
    size: number = 50
  ): Promise<{ messages: RecruitmentMessageResponse[]; totalElements: number; totalPages: number }> {
    try {
      const response = await axiosInstance.get(`/api/v1/recruitment/sessions/${sessionId}/messages`, {
        params: { page, size }
      });
      return {
        messages: response.data.content || [],
        totalElements: response.data.totalElements || 0,
        totalPages: response.data.totalPages || 0
      };
    } catch (error) {
      this.handleError(error, 'Failed to get messages');
    }
  }

  /**
   * Mark messages as read
   * @requires RECRUITER or USER role
   */
  async markMessagesAsRead(sessionId: number): Promise<void> {
    try {
      await axiosInstance.put(`/api/v1/recruitment/sessions/${sessionId}/read`);
    } catch (error) {
      this.handleError(error, 'Failed to mark messages as read');
    }
  }

  /**
   * Update session status (recruiter only)
   * @requires RECRUITER role
   */
  async updateSessionStatus(
    sessionId: number,
    status: RecruitmentSessionStatus,
    note?: string
  ): Promise<RecruitmentSessionResponse> {
    try {
      const response = await axiosInstance.put<RecruitmentSessionResponse>(
        `/api/v1/recruitment/sessions/${sessionId}/status`,
        { status, note }
      );
      return response.data;
    } catch (error) {
      this.handleError(error, 'Failed to update session status');
    }
  }

  /**
   * Archive/delete a session
   * @requires RECRUITER or USER role
   */
  async archiveSession(sessionId: number): Promise<void> {
    try {
      await axiosInstance.delete(`/api/v1/recruitment/sessions/${sessionId}`);
    } catch (error) {
      this.handleError(error, 'Failed to archive session');
    }
  }

  /**
   * Get unread message count
   * @requires RECRUITER or USER role
   */
  async getUnreadCount(): Promise<number> {
    try {
      const response = await axiosInstance.get<{ count: number }>('/api/v1/recruitment/unread-count');
      return response.data.count || 0;
    } catch (error) {
      this.handleError(error, 'Failed to get unread count');
    }
  }
}

const recruitmentChatService = new RecruitmentChatService();
export default recruitmentChatService;
