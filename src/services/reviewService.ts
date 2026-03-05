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
  learnerAvatar: string | null;
  mentorId: number;
  rating: number;
  comment: string;
  reply: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewPageResponse {
  content: ReviewResponse[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

export interface ReviewStatsResponse {
  totalReviews: number;
  averageRating: number;
  fiveStarCount: number;
  fourStarCount: number;
  threeStarCount: number;
  twoStarCount: number;
  oneStarCount: number;
}

type BackendReviewResponse = {
  id: number;
  bookingId: number;
  learnerId?: number;
  learnerName?: string;
  learnerAvatar?: string | null;
  studentId?: number;
  studentName?: string;
  studentAvatar?: string | null;
  mentorId: number;
  rating: number;
  comment: string;
  reply?: string | null;
  createdAt: string;
  updatedAt: string;
};

const normalizeReview = (raw: BackendReviewResponse): ReviewResponse => ({
  id: raw.id,
  bookingId: raw.bookingId,
  learnerId: raw.learnerId ?? raw.studentId ?? 0,
  learnerName: raw.learnerName ?? raw.studentName ?? '',
  learnerAvatar: raw.learnerAvatar ?? raw.studentAvatar ?? null,
  mentorId: raw.mentorId,
  rating: raw.rating,
  comment: raw.comment,
  reply: raw.reply ?? null,
  createdAt: raw.createdAt,
  updatedAt: raw.updatedAt
});

const normalizeReviewPage = (data: any): ReviewPageResponse => {
  // Spring Page format
  if (Array.isArray(data?.content)) {
    return {
      content: (data.content as BackendReviewResponse[]).map(normalizeReview),
      totalPages: Number(data.totalPages ?? 0),
      totalElements: Number(data.totalElements ?? 0),
      size: Number(data.size ?? 0),
      number: Number(data.number ?? 0)
    };
  }

  // Shared PageResponse format
  if (Array.isArray(data?.items)) {
    const size = Number(data.size ?? 0);
    const total = Number(data.total ?? 0);
    const page = Number(data.page ?? 0);
    const totalPages = size > 0 ? Math.ceil(total / size) : (total > 0 ? 1 : 0);
    return {
      content: (data.items as BackendReviewResponse[]).map(normalizeReview),
      totalPages,
      totalElements: total,
      size,
      number: page
    };
  }

  // Plain list format
  const list = Array.isArray(data) ? data as BackendReviewResponse[] : [];
  return {
    content: list.map(normalizeReview),
    totalPages: list.length > 0 ? 1 : 0,
    totalElements: list.length,
    size: list.length,
    number: 0
  };
};

export const createReview = async (request: ReviewRequest): Promise<ReviewResponse> => {
  const response = await axiosInstance.post<BackendReviewResponse>(`/api/reviews/booking/${request.bookingId}`, request);
  return normalizeReview(response.data);
};

export const getMyMentorReviewsPage = async (
  page: number = 0,
  size: number = 10,
  rating: number | null = null,
  sort: string = 'createdAt,desc'
): Promise<ReviewPageResponse> => {
  const params: Record<string, string | number> = { page, size, sort };
  if (rating !== null) {
    params.rating = rating;
  }

  try {
    const response = await axiosInstance.get(`/api/reviews/mentor/me/paged`, {
      params
    });
    return normalizeReviewPage(response.data);
  } catch (error: any) {
    // Backward-compatible fallback for older BE returning full list at /mentor/me
    if (error?.response?.status !== 404) {
      throw error;
    }
    const fallback = await axiosInstance.get<BackendReviewResponse[]>(`/api/reviews/mentor/me`);
    const all = fallback.data.map(normalizeReview);
    const start = page * size;
    const content = all.slice(start, start + size);
    return {
      content,
      totalPages: size > 0 ? Math.ceil(all.length / size) : 0,
      totalElements: all.length,
      size,
      number: page
    };
  }
};

export const getReviewsByMentor = async (_mentorId: number, page: number = 0, size: number = 10): Promise<ReviewPageResponse> => {
  return getMyMentorReviewsPage(page, size);
};

export const getMyMentorReviewStats = async (): Promise<ReviewStatsResponse> => {
  const response = await axiosInstance.get<ReviewStatsResponse>(`/api/reviews/mentor/me/stats`);
  return response.data;
};

export const getPublicBookingReviewsByMentor = async (mentorId: number): Promise<ReviewResponse[]> => {
  const response = await axiosInstance.get<BackendReviewResponse[]>(`/api/reviews/mentor/${mentorId}`);
  return response.data.map(normalizeReview);
};

export const getMyStudentReviews = async (): Promise<ReviewResponse[]> => {
  const response = await axiosInstance.get<BackendReviewResponse[]>(`/api/reviews/student/me`);
  return response.data.map(normalizeReview);
};

export const replyToReview = async (reviewId: number, request: ReplyRequest): Promise<ReviewResponse> => {
  const response = await axiosInstance.post<BackendReviewResponse>(`/api/reviews/${reviewId}/reply`, request);
  return normalizeReview(response.data);
};

export const getReviewByBookingId = async (bookingId: number): Promise<ReviewResponse> => {
  const response = await axiosInstance.get<BackendReviewResponse>(`/api/reviews/booking/${bookingId}`);
  return normalizeReview(response.data);
};
