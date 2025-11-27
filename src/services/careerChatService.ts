import axiosInstance from './axiosInstance';
import {
  ChatRequest,
  ChatResponse,
  ChatSession,
  ChatMessageHistory,
  ExpertFieldResponse,
  ChatMode
} from '../types/CareerChat';

/**
 * Career Chat Service
 * Handles all API calls for AI Career Counseling
 */
class CareerChatService {
  private readonly BASE_URL = '/v1/ai/chat';
  private readonly EXPERT_FIELDS_URL = '/v1/expert-fields';
  private readonly EXPERT_SESSIONS_KEY = 'expert_session_ids';

  /**
   * Mark a session as expert mode session
   */
  private markExpertSession(sessionId: number): void {
    const expertSessions = this.getExpertSessionIds();
    if (!expertSessions.includes(sessionId)) {
      expertSessions.push(sessionId);
      localStorage.setItem(this.EXPERT_SESSIONS_KEY, JSON.stringify(expertSessions));
    }
  }

  /**
   * Get list of expert session IDs from localStorage
   */
  private getExpertSessionIds(): number[] {
    try {
      const stored = localStorage.getItem(this.EXPERT_SESSIONS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Remove session from expert sessions list
   */
  private removeExpertSession(sessionId: number): void {
    const expertSessions = this.getExpertSessionIds();
    const filtered = expertSessions.filter(id => id !== sessionId);
    localStorage.setItem(this.EXPERT_SESSIONS_KEY, JSON.stringify(filtered));
  }

  /**
   * Send a message to the AI career counselor
   */
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    const response = await axiosInstance.post<ChatResponse>(this.BASE_URL, request);
    
    // Mark as expert session if in expert mode
    if (request.chatMode === ChatMode.EXPERT_MODE && response.data.sessionId) {
      this.markExpertSession(response.data.sessionId);
    }
    
    return response.data;
  }

  /**
   * Get conversation history for a session
   */
  async getHistory(sessionId: number): Promise<ChatMessageHistory[]> {
    const response = await axiosInstance.get<ChatMessageHistory[]>(
      `${this.BASE_URL}/history/${sessionId}`
    );
    return response.data;
  }

  /**
   * Get all chat sessions for current user, filtered by chatMode
   * Uses localStorage to track expert sessions if backend doesn't provide chatMode
   */
  async getSessions(chatMode?: ChatMode): Promise<ChatSession[]> {
    try {
      const response = await axiosInstance.get<ChatSession[]>(`${this.BASE_URL}/sessions`, {
        params: chatMode ? { chatMode } : {}
      });
      
      const sessions = response.data;
      
      if (!chatMode) {
        return sessions;
      }
      
      // If backend returns chatMode field, use it
      if (sessions.length > 0 && sessions[0].chatMode !== undefined) {
        return sessions.filter(s => s.chatMode === chatMode);
      }
      
      // Fallback: Use localStorage to filter
      const expertSessionIds = this.getExpertSessionIds();
      
      if (chatMode === ChatMode.EXPERT_MODE) {
        return sessions.filter(s => expertSessionIds.includes(s.sessionId));
      } else {
        return sessions.filter(s => !expertSessionIds.includes(s.sessionId));
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      return [];
    }
  }

  /**
   * Delete a chat session
   */
  async deleteSession(sessionId: number): Promise<void> {
    await axiosInstance.delete(`${this.BASE_URL}/sessions/${sessionId}`);
    // Remove from expert sessions tracking
    this.removeExpertSession(sessionId);
  }

  /**
   * Rename a chat session
   */
  async renameSession(sessionId: number, newTitle: string): Promise<ChatSession> {
    const response = await axiosInstance.patch<ChatSession>(
      `${this.BASE_URL}/sessions/${sessionId}`,
      null,
      {
        params: { newTitle }
      }
    );
    return response.data;
  }

  /**
   * Get available expert fields (domains, industries, roles)
   */
  async getExpertFields(): Promise<ExpertFieldResponse[]> {
    const response = await axiosInstance.get<ExpertFieldResponse[]>(this.EXPERT_FIELDS_URL);
    return response.data;
  }

  /**
   * Get all available domains
   */
  async getDomains(): Promise<string[]> {
    const response = await axiosInstance.get<string[]>(`${this.EXPERT_FIELDS_URL}/domains`);
    return response.data;
  }

  /**
   * Get all available industries
   */
  async getIndustries(): Promise<string[]> {
    const response = await axiosInstance.get<string[]>(`${this.EXPERT_FIELDS_URL}/industries`);
    return response.data;
  }

  /**
   * Get all available job roles
   */
  async getRoles(): Promise<string[]> {
    const response = await axiosInstance.get<string[]>(`${this.EXPERT_FIELDS_URL}/roles`);
    return response.data;
  }

  // ==================== ADMIN ENDPOINTS ====================

  /**
   * Get chat statistics for admin dashboard
   * Returns total sessions and messages count
   */
  async getAdminStats(): Promise<{ totalSessions: number; totalMessages: number }> {
    const response = await axiosInstance.get<{ totalSessions: number; totalMessages: number }>(
      `${this.BASE_URL}/admin/stats`
    );
    return response.data;
  }
}

export default new CareerChatService();
