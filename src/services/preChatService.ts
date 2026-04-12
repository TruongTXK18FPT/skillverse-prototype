import axiosInstance from './axiosInstance';

export interface PreChatMessageResponse {
  id: number;
  bookingId?: number;
  mentorId: number;
  learnerId: number;
  senderId: number;
  senderName?: string;
  senderAvatar?: string;
  content: string;
  createdAt: string;
  chatEnabled: boolean;
}

export interface PreChatThreadSummary {
  bookingId: number;
  counterpartId: number;
  counterpartName: string;
  counterpartAvatar?: string;
  lastContent: string;
  lastTime: string;
  unreadCount: number;
  isMyRoleMentor: boolean;
  bookingStartTime: string;
  bookingEndTime: string;
  bookingStatus: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED' | 'ONGOING' | 'PENDING_COMPLETION' | 'DISPUTED' | 'REFUNDED';
  chatEnabled: boolean;
}

export interface PreChatMessageRequest {
  bookingId: number;
  content: string;
}

export const getThreads = async (page = 0, size = 20): Promise<PreChatThreadSummary[]> => {
  const response = await axiosInstance.get(`/api/prechat/threads?page=${page}&size=${size}`);
  return response.data;
};

export const getConversation = async (bookingId: number, page = 0, size = 50): Promise<{ content: PreChatMessageResponse[], totalPages: number, totalElements: number }> => {
  const response = await axiosInstance.get(`/api/prechat/conversation?bookingId=${bookingId}&page=${page}&size=${size}`);
  return response.data;
};

export const sendMessage = async (bookingId: number, content: string): Promise<PreChatMessageResponse> => {
  const response = await axiosInstance.post('/api/prechat/send', { bookingId, content });
  return response.data;
};

export const markRead = async (bookingId: number): Promise<void> => {
  await axiosInstance.put(`/api/prechat/mark-read?bookingId=${bookingId}`);
};
