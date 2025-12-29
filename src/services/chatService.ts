import axiosInstance from './axiosInstance';

export interface ChatMessage {
  id: number;
  senderId: number;
  recipientId: number;
  content: string;
  timestamp: string;
}

class ChatService {
  /**
   * Get chat history between two users
   */
  async getChatHistory(senderId: number, recipientId: number): Promise<ChatMessage[]> {
    const response = await axiosInstance.get<ChatMessage[]>(`/api/messages/${senderId}/${recipientId}`);
    return response.data;
  }
}

export default new ChatService();
