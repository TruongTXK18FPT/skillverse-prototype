import { axiosInstance } from './axiosInstance';

export interface BookingResponse {
  id: number;
  mentorId: number;
  learnerId: number;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED' | 'ONGOING';
  priceVnd: number;
  meetingLink?: string;
  paymentReference?: string;
  mentorName?: string; // Optional, might need to fetch separately or enrich
  mentorAvatar?: string;
  learnerName?: string;
  learnerAvatar?: string;
}

export interface Page<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

export const getMyBookings = async (mentorView: boolean = false, page: number = 0, size: number = 10): Promise<Page<BookingResponse>> => {
  try {
    const response = await axiosInstance.get<Page<BookingResponse>>(`/api/mentor-bookings/me`, {
      params: {
        mentorView,
        page,
        size
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching bookings:', error);
    throw error;
  }
};

export interface CreateBookingRequest {
  mentorId: number;
  startTime: string;
  durationMinutes: number;
  priceVnd: number;
  paymentMethod: 'PAYOS' | 'WALLET';
  successUrl?: string;
  cancelUrl?: string;
}

export const createBookingWithWallet = async (request: CreateBookingRequest): Promise<BookingResponse> => {
  try {
    const response = await axiosInstance.post<BookingResponse>('/api/mentor-bookings/wallet', request);
    return response.data;
  } catch (error) {
    console.error('Error creating booking with wallet:', error);
    throw error;
  }
};

export const approveBooking = async (id: number): Promise<BookingResponse> => {
  try {
    const response = await axiosInstance.put<BookingResponse>(`/api/mentor-bookings/${id}/approve`);
    return response.data;
  } catch (error) {
    console.error('Error approving booking:', error);
    throw error;
  }
};

export const rejectBooking = async (id: number, reason?: string): Promise<BookingResponse> => {
  try {
    const response = await axiosInstance.put<BookingResponse>(`/api/mentor-bookings/${id}/reject`, null, {
      params: { reason }
    });
    return response.data;
  } catch (error) {
    console.error('Error rejecting booking:', error);
    throw error;
  }
};

export const startMeeting = async (id: number): Promise<BookingResponse> => {
  try {
    const response = await axiosInstance.put<BookingResponse>(`/api/mentor-bookings/${id}/start`);
    return response.data;
  } catch (error) {
    console.error('Error starting meeting:', error);
    throw error;
  }
};

export const completeBooking = async (id: number): Promise<BookingResponse> => {
  try {
    const response = await axiosInstance.put<BookingResponse>(`/api/mentor-bookings/${id}/complete`);
    return response.data;
  } catch (error) {
    console.error('Error completing booking:', error);
    throw error;
  }
};

export const downloadBookingInvoice = async (id: number): Promise<Blob> => {
  try {
    const response = await axiosInstance.get(`/api/mentor-bookings/${id}/invoice`, {
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    console.error('Error downloading booking invoice:', error);
    throw error;
  }
};

export const cancelBooking = async (id: number): Promise<BookingResponse> => {
  try {
    const response = await axiosInstance.delete<BookingResponse>(`/api/mentor-bookings/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error cancelling booking:', error);
    throw error;
  }
};

export const rateBooking = async (id: number, stars: number, comment: string, skillEndorsed?: string): Promise<string> => {
  try {
    const response = await axiosInstance.post<string>(`/api/mentor-bookings/${id}/rating`, {
      stars,
      comment,
      skillEndorsed
    });
    return response.data;
  } catch (error) {
    console.error('Error rating booking:', error);
    throw error;
  }
};
