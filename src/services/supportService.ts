import axiosInstance from './axiosInstance';

export interface CreateTicketRequest {
  email: string;
  subject: string;
  category: string;
  priority: string;
  description: string;
  userId?: number;
}

export interface TicketResponse {
  id: number;
  ticketCode: string;
  email: string;
  subject: string;
  category: string;
  priority: string;
  description: string;
  status: string;
  adminResponse?: string;
  assignedToName?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
  userId?: number;
  userName?: string;
}

export interface TicketStatsResponse {
  totalTickets: number;
  openTickets: number;        // PENDING
  respondedTickets: number;   // RESPONDED
  inProgressTickets: number;  // IN_PROGRESS
  resolvedTickets: number;    // COMPLETED
  closedTickets: number;      // CLOSED
  ticketsByCategory: Record<string, number>;
}

export interface TicketMessageRequest {
  ticketCode: string;
  content: string;
  senderEmail: string;
  senderName: string;
  senderType: 'USER' | 'ADMIN';
  senderId?: number;
}

export interface TicketMessageResponse {
  id: number;
  ticketCode: string;
  senderId?: number;
  senderEmail: string;
  senderName: string;
  senderType: 'USER' | 'ADMIN';
  content: string;
  isRead: boolean;
  createdAt: string;
}

const supportService = {
  /**
   * Create a new support ticket (public)
   */
  createTicket: async (request: CreateTicketRequest): Promise<TicketResponse> => {
    const response = await axiosInstance.post('/v1/support/tickets', request);
    return response.data;
  },

  /**
   * Get ticket by code (for tracking)
   */
  getTicketByCode: async (ticketCode: string): Promise<TicketResponse> => {
    const response = await axiosInstance.get(`/v1/support/tickets/code/${ticketCode}`);
    return response.data;
  },

  /**
   * Get tickets by email
   */
  getTicketsByEmail: async (email: string): Promise<TicketResponse[]> => {
    const response = await axiosInstance.get(`/v1/support/tickets/email/${email}`);
    return response.data;
  },

  /**
   * Get my tickets (authenticated user)
   */
  getMyTickets: async (userId: number): Promise<TicketResponse[]> => {
    const response = await axiosInstance.get('/v1/support/tickets/my', {
      params: { userId }
    });
    return response.data;
  },

  /**
   * Add response to ticket (user follow-up)
   */
  addResponse: async (ticketId: number, responseText: string): Promise<TicketResponse> => {
    const response = await axiosInstance.post(`/v1/support/tickets/${ticketId}/respond`, {
      response: responseText
    });
    return response.data;
  },

  // ==================== Admin APIs ====================

  /**
   * Get all tickets with filters (Admin)
   */
  getAllTickets: async (params: {
    status?: string;
    category?: string;
    priority?: string;
    page?: number;
    size?: number;
  }): Promise<{ content: TicketResponse[]; totalElements: number; totalPages: number }> => {
    const response = await axiosInstance.get('/v1/support/admin/tickets', { params });
    return response.data;
  },

  /**
   * Get ticket by ID (Admin)
   */
  getTicketById: async (id: number): Promise<TicketResponse> => {
    const response = await axiosInstance.get(`/v1/support/admin/tickets/${id}`);
    return response.data;
  },

  /**
   * Update ticket (Admin)
   */
  updateTicket: async (id: number, request: {
    status?: string;
    priority?: string;
    adminResponse?: string;
    assignedToId?: number;
  }): Promise<TicketResponse> => {
    const response = await axiosInstance.put(`/v1/support/admin/tickets/${id}`, request);
    return response.data;
  },

  /**
   * Get assigned tickets (Admin)
   */
  getAssignedTickets: async (adminId: number, page = 0, size = 20): Promise<{
    content: TicketResponse[];
    totalElements: number;
  }> => {
    const response = await axiosInstance.get(`/v1/support/admin/tickets/assigned/${adminId}`, {
      params: { page, size }
    });
    return response.data;
  },

  /**
   * Get ticket statistics (Admin)
   */
  getTicketStats: async (): Promise<TicketStatsResponse> => {
    const response = await axiosInstance.get('/v1/support/admin/tickets/stats');
    return response.data;
  },

  /**
   * Delete ticket (Admin)
   */
  deleteTicket: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/v1/support/admin/tickets/${id}`);
  },

  /**
   * Close ticket (User only)
   */
  closeTicket: async (id: number): Promise<TicketResponse> => {
    const response = await axiosInstance.post(`/v1/support/tickets/${id}/close`);
    return response.data;
  },

  // ============ CHAT METHODS ============

  /**
   * Get messages for a ticket
   */
  getTicketMessages: async (ticketCode: string): Promise<TicketMessageResponse[]> => {
    const response = await axiosInstance.get(`/v1/support/chat/${ticketCode}/messages`);
    return response.data;
  },

  /**
   * Send a message to a ticket
   */
  sendTicketMessage: async (ticketCode: string, request: Omit<TicketMessageRequest, 'ticketCode'>): Promise<TicketMessageResponse> => {
    const response = await axiosInstance.post(`/v1/support/chat/${ticketCode}/messages`, {
      ...request,
      ticketCode
    });
    return response.data;
  },

  /**
   * Mark messages as read
   */
  markMessagesAsRead: async (ticketCode: string, senderType: 'USER' | 'ADMIN'): Promise<void> => {
    await axiosInstance.post(`/v1/support/chat/${ticketCode}/messages/read`, null, {
      params: { senderType }
    });
  }
};

export default supportService;
