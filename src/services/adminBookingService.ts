import { axiosInstance } from './axiosInstance';
import { BookingResponse, Page } from './bookingService';

export interface AdminBookingStatusPoint {
  status: string;
  count: number;
}

export interface AdminBookingRevenuePoint {
  label: string;
  grossValueVnd: number;
  learnerSpendVnd: number;
  refundedVnd: number;
  mentorPayoutVnd: number;
  adminCommissionVnd: number;
}

export interface AdminBookingDashboardResponse {
  totalBookings: number;
  pendingBookings: number;
  activeBookings: number;
  completedBookings: number;
  disputedBookings: number;
  refundedBookings: number;
  grossBookingValueVnd: number;
  learnerNetSpendVnd: number;
  learnerRefundedVnd: number;
  mentorPayoutVnd: number;
  adminCommissionVnd: number;
  escrowHoldingVnd: number;
  monthlyRevenue: AdminBookingRevenuePoint[];
  statusBreakdown: AdminBookingStatusPoint[];
}

interface AdminBookingQuery {
  status?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  size?: number;
}

export const getAdminBookingDashboard = async (
  fromDate?: string,
  toDate?: string,
): Promise<AdminBookingDashboardResponse> => {
  const response = await axiosInstance.get<AdminBookingDashboardResponse>('/api/admin/bookings/dashboard', {
    params: { fromDate, toDate },
  });
  return response.data;
};

export const getAdminBookings = async ({
  status,
  fromDate,
  toDate,
  page = 0,
  size = 20,
}: AdminBookingQuery): Promise<Page<BookingResponse>> => {
  const response = await axiosInstance.get<Page<BookingResponse>>('/api/admin/bookings', {
    params: { status, fromDate, toDate, page, size },
  });
  return response.data;
};

export const getAdminBookingDetail = async (bookingId: number): Promise<BookingResponse> => {
  const response = await axiosInstance.get<BookingResponse>(`/api/admin/bookings/${bookingId}`);
  return response.data;
};
