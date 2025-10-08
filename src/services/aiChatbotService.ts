import axiosInstance from './axiosInstance';
import { ChatRequest, ChatResponse, ChatMessage } from '../types/Chat';

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
      const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
      throw new Error(message || 'Failed to send message. Please try again.');
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
   * Get all chat sessions for current user
   */
  getSessions: async (userId?: string | number): Promise<number[]> => {
    try {
      const params: Record<string, string | number> = {};
      const inferred = getStoredUserId();
      if (userId ?? inferred) {
        params.userId = (userId ?? inferred) as string | number;
      }
      const response = await axiosInstance.get<number[]>('/api/v1/ai/chat/sessions',{ params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
      throw new Error(message || 'Failed to load chat sessions.');
    }
  }
};

export default aiChatbotService;
