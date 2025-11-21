import axiosInstance from './axiosInstance';
import { ChatRequest, ChatResponse, ChatMessage, ChatSession } from '../types/Chat';

/**
 * Service for AI Career Counseling Chatbot API calls
 */
// Try to infer userId from common storage keys if not explicitly provided
const getStoredUserId = (): string | null => {
  const keys = ['userId', 'user_id', 'uid'];
  for (const k of keys) {
    const v = localStorage.getItem(k);
    if (v) return v;
  }
  return null;
};

const aiChatbotService = {
  /**
   * Send a message to the AI career counselor
   */
  sendMessage: async (request: ChatRequest): Promise<ChatResponse> => {
    try {
      const response = await axiosInstance.post<ChatResponse>(
        '/api/v1/ai/chat',
        request
      );
      return response.data;
    } catch (error) {
      console.error('Failed to send message:', error);
      // Re-throw original error to preserve response data (status, code, details)
      // This allows caller to handle specific error cases (429, 401, etc.)
      throw error;
    }
  },

  /**
   * Get conversation history for a session
   */
  getHistory: async (sessionId: number, userId?: string | number): Promise<ChatMessage[]> => {
    try {
      const params: Record<string, string | number> = {};
      const inferred = getStoredUserId();
      if (userId ?? inferred) {
        params.userId = (userId ?? inferred) as string | number;
      }
      const response = await axiosInstance.get<ChatMessage[]>(`/api/v1/ai/chat/history/${sessionId}`,{ params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch chat history:', error);
      const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
      throw new Error(message || 'Failed to load conversation history.');
    }
  },

  /**
   * Get all chat sessions for current user with titles
   */
  getSessions: async (userId?: string | number): Promise<ChatSession[]> => {
    try {
      const params: Record<string, string | number> = {};
      const inferred = getStoredUserId();
      if (userId ?? inferred) {
        params.userId = (userId ?? inferred) as string | number;
      }
      const response = await axiosInstance.get<ChatSession[]>('/api/v1/ai/chat/sessions',{ params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
      throw new Error(message || 'Failed to load chat sessions.');
    }
  },

  /**
   * Delete a chat session
   */
  deleteSession: async (sessionId: number): Promise<void> => {
    try {
      await axiosInstance.delete(`/api/v1/ai/chat/sessions/${sessionId}`);
    } catch (error) {
      console.error('Failed to delete session:', error);
      const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
      throw new Error(message || 'Failed to delete chat session.');
    }
  },

  /**
   * Rename a chat session
   */
  renameSession: async (sessionId: number, newTitle: string): Promise<ChatSession> => {
    try {
      const response = await axiosInstance.patch<ChatSession>(
        `/api/v1/ai/chat/sessions/${sessionId}`,
        null,
        { params: { newTitle } }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to rename session:', error);
      const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
      throw new Error(message || 'Failed to rename chat session.');
    }
  }
};

export default aiChatbotService;
