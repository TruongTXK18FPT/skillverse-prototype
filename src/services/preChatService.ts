import axiosInstance from './axiosInstance';

export interface PreChatMessageResponse {
  id: number;
  mentorId: number;
  learnerId: number;
  senderId: number;
  content: string;
  createdAt: string;
}

export interface PreChatThreadSummary {
  counterpartId: number;
  counterpartName: string;
  counterpartAvatar?: string;
  lastContent: string;
  lastTime: string;
  unreadCount: number;
  isMyRoleMentor: boolean;
}

export interface PreChatMessageRequest {
  mentorId: number;
  content: string;
}

export const getThreads = async (page = 0, size = 20): Promise<PreChatThreadSummary[]> => {
  const response = await axiosInstance.get(`/api/prechat/threads?page=${page}&size=${size}`);
  return response.data;
};

export const getConversation = async (counterpartId: number, page = 0, size = 50): Promise<{ content: PreChatMessageResponse[], totalPages: number, totalElements: number }> => {
  const response = await axiosInstance.get(`/api/prechat/conversation?counterpartId=${counterpartId}&page=${page}&size=${size}`);
  return response.data;
};

export const sendMessage = async (mentorId: number, content: string): Promise<PreChatMessageResponse> => {
  const response = await axiosInstance.post('/api/prechat/send', { mentorId, content });
  return response.data;
};

export const sendAsMentor = async (learnerId: number, content: string): Promise<PreChatMessageResponse> => {
  const response = await axiosInstance.post(`/api/prechat/mentor/send?learnerId=${learnerId}`, { content });
  return response.data;
};

export const markRead = async (mentorId: number): Promise<void> => {
  await axiosInstance.put(`/api/prechat/mark-read?mentorId=${mentorId}`);
};
