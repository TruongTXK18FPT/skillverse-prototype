import { axiosInstance } from "./axiosInstance";
import type { BookingResponse } from "./bookingService";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface RoadmapFollowUpMeetingDTO {
  id?: number;
  bookingId?: number;
  journeyId?: number;
  mentorId?: number;
  learnerId?: number;
  title: string;
  purpose?: string;
  agenda?: string;
  scheduledAt: string;
  durationMinutes?: number;
  meetingLink?: string;
  status?: string;
  notes?: string;
  createdByUserId?: number;
  createdByRole?: string;
  canJoin?: boolean;
  rejectReason?: string;
}

export interface RoadmapMentorWorkspaceResponse {
  booking: BookingResponse;
  journeyId: number;
  roadmapSessionId: number | null;
  roadmap: any; // RoadmapResponse — reuse existing type from roadmap module
  followUpMeetings: RoadmapFollowUpMeetingDTO[];
}

export interface RoadmapMentorOverviewUpdateRequest {
  purpose?: string;
  audience?: string;
  postRoadmapState?: string;
  structure?: any[];
  thinkingProgression?: string[];
  nextSteps?: any;
}

export interface RoadmapMentorNodeUpsertRequest {
  nodeId?: string;
  parentId?: string;
  title?: string;
  description?: string;
  estimatedTimeMinutes?: number;
  type?: "MAIN" | "SIDE";
  difficulty?: string;
  isCore?: boolean;
  learningObjectives?: string[];
  keyConcepts?: string[];
  practicalExercises?: string[];
  suggestedResources?: string[];
  successCriteria?: string[];
  prerequisites?: string[];
  suggestedCourseIds?: string[];
  suggestedModuleIds?: string[];
}

export interface RoadmapMentorNodeReorderRequest {
  parentId?: string;
  orderedNodeIds: string[];
}

// ─── API ─────────────────────────────────────────────────────────────────────

const BASE = "/api/v1/mentor-roadmap-bookings";

/** Danh sách booking ROADMAP_MENTORING của mentor */
export const getMentorRoadmapBookings = async (): Promise<
  BookingResponse[]
> => {
  const res = await axiosInstance.get<BookingResponse[]>(BASE);
  return res.data;
};

/** Lấy workspace đầy đủ (roadmap + booking + follow-ups) */
export const getWorkspace = async (
  bookingId: number,
): Promise<RoadmapMentorWorkspaceResponse> => {
  const res = await axiosInstance.get<RoadmapMentorWorkspaceResponse>(
    `${BASE}/${bookingId}/workspace`,
  );
  return res.data;
};

/** Cập nhật overview/structure/thinking/nextSteps */
export const updateOverview = async (
  bookingId: number,
  request: RoadmapMentorOverviewUpdateRequest,
): Promise<RoadmapMentorWorkspaceResponse> => {
  const res = await axiosInstance.put<RoadmapMentorWorkspaceResponse>(
    `${BASE}/${bookingId}/overview`,
    request,
  );
  return res.data;
};

/** Cập nhật node hiện có */
export const updateNode = async (
  bookingId: number,
  nodeId: string,
  request: RoadmapMentorNodeUpsertRequest,
): Promise<RoadmapMentorWorkspaceResponse> => {
  const res = await axiosInstance.put<RoadmapMentorWorkspaceResponse>(
    `${BASE}/${bookingId}/nodes/${encodeURIComponent(nodeId)}`,
    request,
  );
  return res.data;
};

/** Thêm node mentor mới */
export const createNode = async (
  bookingId: number,
  request: RoadmapMentorNodeUpsertRequest,
): Promise<RoadmapMentorWorkspaceResponse> => {
  const res = await axiosInstance.post<RoadmapMentorWorkspaceResponse>(
    `${BASE}/${bookingId}/nodes`,
    request,
  );
  return res.data;
};

/** Sắp xếp lại thứ tự node */
export const reorderNodes = async (
  bookingId: number,
  request: RoadmapMentorNodeReorderRequest,
): Promise<RoadmapMentorWorkspaceResponse> => {
  const res = await axiosInstance.put<RoadmapMentorWorkspaceResponse>(
    `${BASE}/${bookingId}/nodes/reorder`,
    request,
  );
  return res.data;
};

// ─── Follow-Up Meetings ─────────────────────────────────────────────────────

/** Danh sách follow-up meetings */
export const getFollowUps = async (
  bookingId: number,
): Promise<RoadmapFollowUpMeetingDTO[]> => {
  const res = await axiosInstance.get<RoadmapFollowUpMeetingDTO[]>(
    `${BASE}/${bookingId}/follow-ups`,
  );
  return res.data;
};

/** Tạo follow-up meeting */
export const createFollowUp = async (
  bookingId: number,
  request: RoadmapFollowUpMeetingDTO,
): Promise<RoadmapFollowUpMeetingDTO> => {
  const res = await axiosInstance.post<RoadmapFollowUpMeetingDTO>(
    `${BASE}/${bookingId}/follow-ups`,
    request,
  );
  return res.data;
};

/** Cập nhật follow-up meeting */
export const updateFollowUp = async (
  bookingId: number,
  meetingId: number,
  request: Partial<RoadmapFollowUpMeetingDTO>,
): Promise<RoadmapFollowUpMeetingDTO> => {
  const res = await axiosInstance.put<RoadmapFollowUpMeetingDTO>(
    `${BASE}/${bookingId}/follow-ups/${meetingId}`,
    request,
  );
  return res.data;
};

/** Xóa follow-up meeting */
export const deleteFollowUp = async (
  bookingId: number,
  meetingId: number,
): Promise<void> => {
  await axiosInstance.delete(`${BASE}/${bookingId}/follow-ups/${meetingId}`);
};

/** Chấp nhận meeting (bên đối diện creator) */
export const acceptFollowUp = async (
  bookingId: number,
  meetingId: number,
): Promise<RoadmapFollowUpMeetingDTO> => {
  const res = await axiosInstance.post<RoadmapFollowUpMeetingDTO>(
    `${BASE}/${bookingId}/follow-ups/${meetingId}/accept`,
  );
  return res.data;
};

/** Từ chối meeting kèm lý do tùy chọn */
export const rejectFollowUp = async (
  bookingId: number,
  meetingId: number,
  reason?: string,
): Promise<RoadmapFollowUpMeetingDTO> => {
  const res = await axiosInstance.post<RoadmapFollowUpMeetingDTO>(
    `${BASE}/${bookingId}/follow-ups/${meetingId}/reject`,
    { reason },
  );
  return res.data;
};

// ─── Export as namespace-like object ─────────────────────────────────────────

export const mentorRoadmapWorkspaceService = {
  getMentorRoadmapBookings,
  getWorkspace,
  updateOverview,
  updateNode,
  createNode,
  reorderNodes,
  getFollowUps,
  createFollowUp,
  updateFollowUp,
  deleteFollowUp,
  acceptFollowUp,
  rejectFollowUp,
};
