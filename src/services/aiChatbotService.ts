import axiosInstance from './axiosInstance';
import { ChatRequest, ChatResponse, ChatMessage } from '../types/Chat';

/**
 * Service for AI Career Counseling Chatbot API calls
 */
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
  getHistory: async (sessionId: number): Promise<ChatMessage[]> => {
    try {
      const response = await axiosInstance.get<ChatMessage[]>(
        `/api/v1/ai/chat/history/${sessionId}`
      );
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
  getSessions: async (): Promise<number[]> => {
    try {
      const response = await axiosInstance.get<number[]>(
        '/api/v1/ai/chat/sessions'
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
      throw new Error(message || 'Failed to load chat sessions.');
    }
  }
};

export default aiChatbotService;
