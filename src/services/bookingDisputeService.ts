import { axiosInstance } from './axiosInstance';

export type EvidenceType = 'TEXT' | 'FILE' | 'LINK' | 'SCREENSHOT' | 'CHAT_LOG' | 'IMAGE';

export interface BookingDispute {
  id: number;
  bookingId: number;
  initiatorId: number;
  respondentId: number;
  reason: string;
  status: 'OPEN' | 'UNDER_INVESTIGATION' | 'AWAITING_RESPONSE' | 'RESOLVED' | 'DISMISSED' | 'ESCALATED';
  resolution?: 'FULL_REFUND' | 'FULL_RELEASE' | 'PARTIAL_REFUND' | 'PARTIAL_RELEASE';
  resolutionNotes?: string;
  refundAmount?: number;
  releasedAmount?: number;
  mentorPayoutAmount?: number;
  adminCommissionAmount?: number;
  resolvedBy?: number;
  resolvedAt?: string;
  createdAt: string;
}

export interface BookingDisputeEvidence {
  id: number;
  disputeId: number;
  submittedBy: number;
  evidenceType: EvidenceType;
  content?: string;
  fileUrl?: string;
  fileName?: string;
  description?: string;
  isOfficial: boolean;
  createdAt: string;
  responses?: BookingDisputeResponse[];
}

export interface BookingDisputeResponse {
  id: number;
  evidenceId: number;
  respondedBy: number;
  respondedByName: string;
  content: string;
  isAdminResponse: boolean;
  createdAt: string;
}

export const openBookingDispute = async (
  bookingId: number,
  reason?: string
): Promise<BookingDispute> => {
  try {
    const response = await axiosInstance.post<BookingDispute>('/api/booking-disputes', null, {
      params: { bookingId, reason },
    });
    return response.data;
  } catch (error) {
    console.error('Error opening booking dispute:', error);
    throw error;
  }
};

export const getBookingDispute = async (
  disputeId: number
): Promise<BookingDispute> => {
  try {
    const response = await axiosInstance.get<BookingDispute>(`/api/booking-disputes/${disputeId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching booking dispute:', error);
    throw error;
  }
};

export const getBookingDisputeByBooking = async (
  bookingId: number
): Promise<BookingDispute> => {
  try {
    const response = await axiosInstance.get<BookingDispute>(`/api/booking-disputes/booking/${bookingId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching booking dispute by booking:', error);
    throw error;
  }
};

export const submitBookingDisputeEvidence = async (
  disputeId: number,
  type: EvidenceType,
  content?: string,
  fileUrl?: string,
  fileName?: string,
  description?: string
): Promise<BookingDisputeEvidence> => {
  try {
    const response = await axiosInstance.post<BookingDisputeEvidence>(
      `/api/booking-disputes/${disputeId}/evidence`,
      null,
      {
        params: {
          type,
          content,
          fileUrl,
          fileName,
          description,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error submitting dispute evidence:', error);
    throw error;
  }
};

export const getBookingDisputeEvidence = async (
  disputeId: number
): Promise<BookingDisputeEvidence[]> => {
  try {
    const response = await axiosInstance.get<BookingDisputeEvidence[]>(
      `/api/booking-disputes/${disputeId}/evidence`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching dispute evidence:', error);
    throw error;
  }
};

export const respondToBookingDisputeEvidence = async (
  disputeId: number,
  evidenceId: number,
  content: string
): Promise<BookingDisputeResponse> => {
  try {
    const response = await axiosInstance.post<BookingDisputeResponse>(
      `/api/booking-disputes/${disputeId}/respond`,
      null,
      {
        params: { evidenceId, content },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error responding to dispute evidence:', error);
    throw error;
  }
};

// Admin endpoints
export const getAllBookingDisputes = async (
  status?: string,
  page: number = 0,
  size: number = 20
) => {
  try {
    const response = await axiosInstance.get('/api/admin/booking-disputes', {
      params: { status, page, size },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching all booking disputes:', error);
    throw error;
  }
};

export const getAdminBookingDisputeDetail = async (disputeId: number) => {
  try {
    const response = await axiosInstance.get(`/api/admin/booking-disputes/${disputeId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching booking dispute detail:', error);
    throw error;
  }
};

export const getAdminBookingDisputeEvidence = async (disputeId: number) => {
  try {
    const response = await axiosInstance.get(`/api/admin/booking-disputes/${disputeId}/evidence`);
    return response.data;
  } catch (error) {
    console.error('Error fetching booking dispute evidence:', error);
    throw error;
  }
};

export const resolveBookingDispute = async (
  disputeId: number,
  resolution: 'FULL_REFUND' | 'FULL_RELEASE' | 'PARTIAL_REFUND' | 'PARTIAL_RELEASE',
  notes?: string,
  partialAmount?: number
) => {
  try {
    const response = await axiosInstance.post(
      `/api/admin/booking-disputes/${disputeId}/resolve`,
      { resolution, notes, partialAmount }
    );
    return response.data;
  } catch (error) {
    console.error('Error resolving booking dispute:', error);
    throw error;
  }
};
