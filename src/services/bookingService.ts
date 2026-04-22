import { axiosInstance } from './axiosInstance';

export interface BookingResponse {
  id: number;
  mentorId: number;
  learnerId: number;
  createdAt?: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED' | 'ONGOING' | 'PENDING_COMPLETION' | 'DISPUTED' | 'REFUNDED';
  confirmedByLearner?: boolean;
  mentorCompletedAt?: string;
  learnerConfirmedAt?: string;
  learnerCompletedAt?: string;
  completionDeadline?: string;
  priceVnd: number;
  meetingLink?: string;
  paymentReference?: string;
  mentorName?: string; // Optional, might need to fetch separately or enrich
  mentorAvatar?: string;
  learnerName?: string;
  learnerAvatar?: string;
  disputeId?: number;
  chatAllowed?: boolean;
  // Node/Journey context for mentoring flow (optional, per §6.3.5)
  journeyId?: number;
  roadmapSessionId?: number;
  nodeId?: string;
  nodeSkillId?: number;
  bookingType?: 'GENERAL' | 'NODE_MENTORING' | 'JOURNEY_MENTORING';
}

export interface Page<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

export const getMyBookings = async (mentorView: boolean = false, page: number = 0, size: number = 10): Promise<Page<BookingResponse>> => {
  const response = await axiosInstance.get<Page<BookingResponse>>(`/api/mentor-bookings/me`, {
    params: {
      mentorView,
      page,
      size
    }
  });
  return response.data;
};

export interface CreateBookingRequest {
  mentorId: number;
  startTime: string;
  durationMinutes: number;
  priceVnd: number;
  paymentMethod: 'WALLET';
  // Node/Journey context for mentoring flow (optional, per §6.3.5)
  journeyId?: number;
  roadmapSessionId?: number;
  nodeId?: string;
  nodeSkillId?: number;
  bookingType?: 'GENERAL' | 'NODE_MENTORING' | 'JOURNEY_MENTORING';
}

export const createBookingWithWallet = async (request: CreateBookingRequest): Promise<BookingResponse> => {
  const response = await axiosInstance.post<BookingResponse>('/api/mentor-bookings/wallet', request);
  return response.data;
};

export const approveBooking = async (id: number): Promise<BookingResponse> => {
  const response = await axiosInstance.put<BookingResponse>(`/api/mentor-bookings/${id}/approve`);
  return response.data;
};

export const rejectBooking = async (id: number, reason?: string): Promise<BookingResponse> => {
  const response = await axiosInstance.put<BookingResponse>(`/api/mentor-bookings/${id}/reject`, null, {
    params: { reason }
  });
  return response.data;
};

export const startMeeting = async (id: number): Promise<BookingResponse> => {
  const response = await axiosInstance.put<BookingResponse>(`/api/mentor-bookings/${id}/start`);
  return response.data;
};

export const completeBooking = async (id: number): Promise<BookingResponse> => {
  // Part 6: This transitions to PENDING_COMPLETION (waiting for other party)
  const response = await axiosInstance.put<BookingResponse>(`/api/mentor-bookings/${id}/complete`);
  return response.data;
};

export const confirmCompleteBooking = async (id: number): Promise<BookingResponse> => {
  const response = await axiosInstance.put<BookingResponse>(`/api/mentor-bookings/${id}/confirm-complete`);
  return response.data;
};

export const getBookingDetail = async (id: number): Promise<BookingResponse> => {
  const response = await axiosInstance.get<BookingResponse>(`/api/mentor-bookings/${id}`);
  return response.data;
};

export const downloadBookingInvoice = async (id: number): Promise<Blob> => {
  const response = await axiosInstance.get(`/api/mentor-bookings/${id}/invoice`, {
    responseType: 'blob'
  });
  return response.data;
};

export const cancelBooking = async (id: number): Promise<BookingResponse> => {
  const response = await axiosInstance.delete<BookingResponse>(`/api/mentor-bookings/${id}`);
  return response.data;
};

export const rateBooking = async (id: number, stars: number, comment: string, skillEndorsed?: string): Promise<string> => {
  const response = await axiosInstance.post<string>(`/api/mentor-bookings/${id}/rating`, {
    stars,
    comment,
    skillEndorsed
  });
  return response.data;
};

export const getMentorActiveBookings = async (mentorId: number, from: string, to: string): Promise<BookingResponse[]> => {
  const response = await axiosInstance.get<BookingResponse[]>(`/api/mentor-bookings/mentor/${mentorId}/bookings`, {
    params: { from, to }
  });
  return response.data;
};
