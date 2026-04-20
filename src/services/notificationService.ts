import axiosInstance from './axiosInstance';

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  relatedId: string;
  createdAt: string;
  senderId?: number;
  senderName?: string;
  senderAvatar?: string;
}

export interface NotificationResponse {
  content: Notification[];
  totalPages: number;
  totalElements: number;
  last: boolean;
  size: number;
  number: number;
}

export const notificationService = {
  getUserNotifications: async (page: number = 0, size: number = 10, isRead?: boolean) => {
    let url = `/notifications?page=${page}&size=${size}&sort=createdAt,desc`;
    if (isRead !== undefined) {
      url += `&isRead=${isRead}`;
    }
    const response = await axiosInstance.get<NotificationResponse>(url);
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await axiosInstance.get<number>('/notifications/unread-count');
    return response.data;
  },

  getTotalCount: async () => {
    const response = await axiosInstance.get<number>('/notifications/total-count');
    return response.data;
  },

  markAsRead: async (id: number) => {
    await axiosInstance.post(`/notifications/${id}/read`);
  },

  markAllAsRead: async () => {
    await axiosInstance.post('/notifications/read-all');
  }
};
