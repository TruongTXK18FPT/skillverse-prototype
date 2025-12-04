import { axiosInstance } from './axiosInstance';

export interface ReviewRequest {
  bookingId: number;
  rating: number;
  comment: string;
}

export interface ReplyRequest {
  reply: string;
}

export interface ReviewResponse {
  id: number;
  bookingId: number;
  learnerId: number;
  learnerName: string;
  learnerAvatar: string;
  mentorId: number;
  rating: number;
  comment: string;
  reply: string;
  createdAt: string;
  updatedAt: string;
}

export const createReview = async (request: ReviewRequest): Promise<ReviewResponse> => {
  const response = await axiosInstance.post<ReviewResponse>(`/api/reviews/booking/${request.bookingId}`, request);
  return response.data;
};

export const getReviewsByMentor = async (mentorId: number, page: number = 0, size: number = 10): Promise<any> => {
  // Currently using /mentor/me which returns reviews for the logged-in mentor
  const response = await axiosInstance.get(`/api/reviews/mentor/me`, {
    params: { page, size }
  });
  return response.data;
};

export const getPublicBookingReviewsByMentor = async (mentorId: number): Promise<ReviewResponse[]> => {
  const response = await axiosInstance.get<ReviewResponse[]>(`/api/reviews/mentor/${mentorId}`);
  return response.data;
};

export const getMyStudentReviews = async (): Promise<ReviewResponse[]> => {
  const response = await axiosInstance.get<ReviewResponse[]>(`/api/reviews/student/me`);
  return response.data;
};

export const replyToReview = async (reviewId: number, request: ReplyRequest): Promise<ReviewResponse> => {
  const response = await axiosInstance.post<ReviewResponse>(`/api/reviews/${reviewId}/reply`, request);
  return response.data;
};

export const getReviewByBookingId = async (bookingId: number): Promise<ReviewResponse> => {
  const response = await axiosInstance.get<ReviewResponse>(`/api/reviews/booking/${bookingId}`);
  return response.data;
};
