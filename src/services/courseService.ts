import axiosInstance from './axiosInstance';
import {
  CourseDetailDTO,
  CourseSummaryDTO,
  CourseCreateDTO,
  CourseUpdateDTO,
  CourseUpgradePolicy,
  CourseStatus,
  PageResponse
} from '../data/courseDTOs';
import { CoursePurchaseDTO, CoursePurchaseRequestDTO } from '../data/purchaseDTOs';
import { getAccessToken } from '../utils/authStorage';

// Re-export DTOs for backward compatibility
export type { CoursePurchaseDTO, CoursePurchaseRequestDTO as CoursePurchaseRequest };

/**
 * Course Service - Complete API Integration
 * Matches Backend CourseController endpoints
 */

// ==================== NORMALIZERS ====================

function normalizePageResponse<T>(data: unknown): PageResponse<T> {
  const dataObj = data as Record<string, unknown>;
  const content: T[] = (dataObj?.content as T[] ?? dataObj?.items as T[]) ?? [];
  const size: number = (dataObj?.size as number) ?? 0;
  const page: number = (dataObj?.page as number) ?? 0;
  const totalElements: number = (dataObj?.totalElements as number) ?? (dataObj?.total as number) ?? content.length;
  const totalPages: number = (dataObj?.totalPages as number) ?? (size ? Math.ceil(totalElements / size) : 1);
  const first: boolean = (dataObj?.first as boolean) ?? page === 0;
  const last: boolean = (dataObj?.last as boolean) ?? (page + 1 >= totalPages);
  const empty: boolean = (dataObj?.empty as boolean) ?? content.length === 0;
  return { content, page, size, totalElements, totalPages, first, last, empty };
}

// ==================== COURSE CRUD OPERATIONS ====================

/**
 * Create a new course
 * POST /api/courses
 */
export const createCourse = async (
  authorId: number,
  courseData: CourseCreateDTO,
  thumbnailFile?: File
): Promise<CourseDetailDTO> => {
  try {
    const formData = new FormData();
    formData.append('authorId', authorId.toString());
    formData.append('title', courseData.title);
    if (courseData.description) formData.append('description', courseData.description);
    if (courseData.shortDescription) formData.append('shortDescription', courseData.shortDescription);
    if (courseData.level) formData.append('level', courseData.level);
    if (courseData.category) formData.append('category', courseData.category);
    if (courseData.estimatedDurationHours !== undefined && courseData.estimatedDurationHours !== null) {
      formData.append('estimatedDurationHours', courseData.estimatedDurationHours.toString());
    }
    if (courseData.language) formData.append('language', courseData.language);
    if (courseData.learningObjectives?.length) {
      courseData.learningObjectives.forEach((item) => formData.append('learningObjectives', item));
    }
    if (courseData.requirements?.length) {
      courseData.requirements.forEach((item) => formData.append('requirements', item));
    }
    if (courseData.courseSkills?.length) {
      courseData.courseSkills.forEach((item) => formData.append('courseSkills', item));
    }
    if (thumbnailFile) formData.append('thumbnailFile', thumbnailFile);
    if (courseData.price !== undefined && courseData.price !== null) {
      formData.append('price', courseData.price.toString());
    }
    if (courseData.currency) {
      formData.append('currency', courseData.currency);
    }

    const response = await axiosInstance.post<CourseDetailDTO>(
      '/courses',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error creating course:', error);
    throw error;
  }
};

/**
 * Update an existing course
 * PUT /api/courses/{courseId}
 */
export const updateCourse = async (
  courseId: number,
  courseData: CourseUpdateDTO,
  actorId: number,
  thumbnailFile?: File
): Promise<CourseDetailDTO> => {
  try {
    const formData = new FormData();
    formData.append('actorId', actorId.toString());
    if (courseData.title) formData.append('title', courseData.title);
    if (courseData.description) formData.append('description', courseData.description);
    if (courseData.shortDescription) formData.append('shortDescription', courseData.shortDescription);
    if (courseData.level) formData.append('level', courseData.level);
    if (courseData.category) formData.append('category', courseData.category);
    if (courseData.estimatedDurationHours !== undefined && courseData.estimatedDurationHours !== null) {
      formData.append('estimatedDurationHours', courseData.estimatedDurationHours.toString());
    }
    if (courseData.language) formData.append('language', courseData.language);
    if (courseData.learningObjectives?.length) {
      courseData.learningObjectives.forEach((item) => formData.append('learningObjectives', item));
    }
    if (courseData.requirements?.length) {
      courseData.requirements.forEach((item) => formData.append('requirements', item));
    }
    if (courseData.courseSkills?.length) {
      courseData.courseSkills.forEach((item) => formData.append('courseSkills', item));
    }
    if (thumbnailFile) formData.append('thumbnailFile', thumbnailFile);
    if (courseData.price !== undefined && courseData.price !== null) {
      formData.append('price', courseData.price.toString());
    }
    if (courseData.currency) {
      formData.append('currency', courseData.currency);
    }

    const response = await axiosInstance.put<CourseDetailDTO>(
      `/courses/${courseId}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error updating course:', error);
    throw error;
  }
};

/**
 * Archive a course (API still uses DELETE verb, archive-by-default on backend)
 * DELETE /api/courses/{courseId}
 */
export const deleteCourse = async (
  courseId: number,
  actorId: number
): Promise<void> => {
  try {
    await axiosInstance.delete(`/courses/${courseId}`, {
      params: { actorId }
    });
  } catch (error) {
    console.error('Error archiving course:', error);
    throw error;
  }
};

/**
 * Get course by ID
 * GET /api/courses/{courseId}
 */
export const getCourse = async (
  courseId: number
): Promise<CourseDetailDTO> => {
  try {
    // Manually attach JWT if available — this is a public endpoint
    // but authenticated users need it to view their own DRAFT courses
    const token = getAccessToken();
    const response = await axiosInstance.get<CourseDetailDTO>(
      `/courses/${courseId}`,
      token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching course:', error);
    throw error;
  }
};

const courseDetailCache = new Map<number, CourseDetailDTO>();
const courseDetailRequestCache = new Map<number, Promise<CourseDetailDTO>>();

const getCourseWithCache = async (courseId: number): Promise<CourseDetailDTO> => {
  const cachedCourse = courseDetailCache.get(courseId);
  if (cachedCourse) {
    return cachedCourse;
  }

  const inflightRequest = courseDetailRequestCache.get(courseId);
  if (inflightRequest) {
    return inflightRequest;
  }

  const request = getCourse(courseId)
    .then((course) => {
      courseDetailCache.set(courseId, course);
      return course;
    })
    .finally(() => {
      courseDetailRequestCache.delete(courseId);
    });

  courseDetailRequestCache.set(courseId, request);
  return request;
};

/**
 * Best-effort batch course loading for roadmap nodes.
 * If the backend batch endpoint is unavailable, fall back to cached parallel requests.
 */
export const getCoursesBatch = async (
  ids: Array<number | string>,
): Promise<Record<string, CourseDetailDTO | null>> => {
  const normalizedIds = Array.from(
    new Set(
      ids
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value) && value > 0),
    ),
  );

  if (normalizedIds.length === 0) {
    return {};
  }

  try {
    const response = await axiosInstance.get<CourseDetailDTO[]>("/courses/batch", {
      params: { ids: normalizedIds.join(",") },
    });

    const fetchedCourses = Array.isArray(response.data) ? response.data : [];
    const fetchedCourseById = new Map<number, CourseDetailDTO>();
    fetchedCourses.forEach((course) => {
      if (course?.id) {
        courseDetailCache.set(course.id, course);
        fetchedCourseById.set(course.id, course);
      }
    });

    return normalizedIds.reduce<Record<string, CourseDetailDTO | null>>((accumulator, id) => {
      const matchingCourse = fetchedCourseById.get(id) ?? courseDetailCache.get(id) ?? null;
      accumulator[String(id)] = matchingCourse;
      return accumulator;
    }, {});
  } catch (error) {
    const results = await Promise.allSettled(
      normalizedIds.map(async (id) => [String(id), await getCourseWithCache(id)] as const),
    );

    return results.reduce<Record<string, CourseDetailDTO | null>>((accumulator, result, index) => {
      const id = String(normalizedIds[index]);
      accumulator[id] = result.status === "fulfilled" ? result.value[1] : null;
      return accumulator;
    }, {});
  }
};

// ==================== COURSE QUERY OPERATIONS ====================

/**
 * List courses with pagination, search, and filtering
 * GET /api/courses
 * 
 * @param search - Maps to BE `q` query param for title search
 * @param sortBy - Field to sort by (uses Spring Pageable `sort` format)
 * @param sortOrder - Sort direction
 */
export const listCourses = async (
  page: number = 0,
  size: number = 10,
  _level?: string,
  status?: string,
  search?: string,
  sortBy: string = 'createdAt',
  sortOrder: 'asc' | 'desc' = 'desc'
): Promise<PageResponse<CourseSummaryDTO>> => {
  try {
    const params: Record<string, string | number> = {
      page,
      size,
      sort: `${sortBy},${sortOrder}`
    };

    if (status) params.status = status;
    if (search) params.q = search;

    const response = await axiosInstance.get<PageResponse<CourseSummaryDTO>>(
      '/courses',
      { params }
    );
    return normalizePageResponse<CourseSummaryDTO>(response.data);
  } catch (error) {
    console.error('Error listing courses:', error);
    throw error;
  }
};

/**
 * List courses by author
 * GET /api/courses/by-author/{authorId}
 */
export const listCoursesByAuthor = async (
  authorId: number,
  page: number = 0,
  size: number = 10,
  sortBy: string = 'updatedAt',
  sortOrder: 'asc' | 'desc' = 'desc'
): Promise<PageResponse<CourseSummaryDTO>> => {
  try {
    const response = await axiosInstance.get<PageResponse<CourseSummaryDTO>>(
      `/courses/by-author/${authorId}`,
      {
        params: {
          page,
          size,
          sort: `${sortBy},${sortOrder}`
        }
      }
    );
    return normalizePageResponse<CourseSummaryDTO>(response.data);
  } catch (error) {
    console.error('Error listing courses by author:', error);
    throw error;
  }
};

/**
 * List mentor courses with server-side status filter.
 * Uses backend filtering instead of client-side useMemo.
 * GET /api/courses/by-author/{authorId}?status=...&excludeArchived=...
 *
 * @param authorId - The mentor's user ID
 * @param page - Page number (0-indexed)
 * @param size - Page size
 * @param sortBy - Sort field (default: updatedAt)
 * @param sortOrder - Sort direction (default: desc)
 * @param status - Filter by specific status (undefined = no filter, use with excludeArchived=false for archived)
 * @param excludeArchived - Exclude archived courses (default: true). Set to false to include archived.
 *                          When false and status is undefined, returns only ARCHIVED courses.
 */
export const listCoursesByAuthorWithStatus = async (
  authorId: number,
  page: number = 0,
  size: number = 10,
  sortBy: string = 'updatedAt',
  sortOrder: 'asc' | 'desc' = 'desc',
  status?: CourseStatus,
  excludeArchived: boolean = true
): Promise<PageResponse<CourseSummaryDTO>> => {
  try {
    const params: Record<string, unknown> = { page, size, sort: `${sortBy},${sortOrder}` };
    if (status) {
      params.status = status;
    } else if (excludeArchived) {
      params.excludeArchived = true;
    }
    // If excludeArchived=false and no status, backend defaults to non-archived
    // To get archived only, frontend should call with status=ARCHIVED

    const response = await axiosInstance.get<PageResponse<CourseSummaryDTO>>(
      `/courses/by-author/${authorId}`,
      { params }
    );
    return normalizePageResponse<CourseSummaryDTO>(response.data);
  } catch (error) {
    console.error('Error listing courses by author with status:', error);
    throw error;
  }
};

/**
 * Fetch mentor's course stats (badge counts per status).
 * GET /api/courses/by-author/{authorId}/stats
 *
 * Returns: { DRAFT: 2, PENDING: 1, PUBLIC: 5, REJECTED: 0, SUSPENDED: 0, ARCHIVED: 3, ALL: 8 }
 */
export const getMentorCourseStats = async (authorId: number): Promise<Record<string, number>> => {
  try {
    const response = await axiosInstance.get<Record<string, number>>(
      `/courses/by-author/${authorId}/stats`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching mentor course stats:', error);
    throw error;
  }
};

/**
 * List pending courses (for admin approval)
 * GET /api/admin/courses/pending
 */
export const listPendingCourses = async (
  page: number = 0,
  size: number = 10,
  sortBy: string = 'submittedAt',
  sortOrder: 'asc' | 'desc' = 'desc'
): Promise<PageResponse<CourseSummaryDTO>> => {
  try {
    const response = await axiosInstance.get<PageResponse<CourseSummaryDTO>>(
      '/admin/courses/pending',
      {
        params: {
          page,
          size,
          sort: `${sortBy},${sortOrder}`
        }
      }
    );
    return normalizePageResponse<CourseSummaryDTO>(response.data);
  } catch (error) {
    console.error('Error listing pending courses:', error);
    throw error;
  }
};

/**
 * List published courses (public view)
 * GET /api/courses?status=PUBLIC
 */
export const listPublishedCourses = async (
  page: number = 0,
  size: number = 10
): Promise<PageResponse<CourseSummaryDTO>> => {
  try {
    const response = await axiosInstance.get<PageResponse<CourseSummaryDTO>>(
      '/courses',
      {
        params: { 
          page, 
          size,
          status: 'PUBLIC' // Filter for published courses only
        }
      }
    );
    return normalizePageResponse<CourseSummaryDTO>(response.data);
  } catch (error) {
    console.error('Error listing published courses:', error);
    throw error;
  }
};

/**
 * Get course purchases for mentor's courses
 * GET /api/course-purchases/mentor
 */
export const getMentorCoursePurchases = async (
  page: number = 0,
  size: number = 10
): Promise<PageResponse<CoursePurchaseDTO>> => {
  try {
    const response = await axiosInstance.get<PageResponse<CoursePurchaseDTO>>(
      '/course-purchases/mentor',
      {
        params: { page, size }
      }
    );
    return normalizePageResponse<CoursePurchaseDTO>(response.data);
  } catch (error) {
    console.error('Error fetching mentor course purchases:', error);
    throw error;
  }
};

// ==================== COURSE PURCHASE PAYMENT ====================

/**
 * Purchase course with My-Wallet balance
 * POST /api/course-purchases/wallet
 */
export const purchaseCourseWithWallet = async (
  request: CoursePurchaseRequestDTO
): Promise<CoursePurchaseDTO> => {
  try {
    const response = await axiosInstance.post<CoursePurchaseDTO>(
      '/course-purchases/wallet',
      request
    );
    return response.data;
  } catch (error) {
    console.error('Error purchasing course with wallet:', error);
    throw error;
  }
};

// ==================== COURSE WORKFLOW OPERATIONS ====================

/**
 * Submit course for approval
 * PUT /api/courses/{courseId}/submit
 */
export const submitCourseForApproval = async (
  courseId: number,
  actorId: number
): Promise<CourseDetailDTO> => {
  try {
    const response = await axiosInstance.post<CourseDetailDTO>(
      `/courses/${courseId}/submit`,
      null,
      {
        params: { actorId }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error submitting course for approval:', error);
    throw error;
  }
};

/**
 * Approve course (admin only)
 * POST /api/admin/courses/{courseId}/approve
 * AdminId is extracted from JWT on backend — no need to send it.
 */
export const approveCourse = async (
  courseId: number,
  _actorId?: number
): Promise<CourseDetailDTO> => {
  try {
    const response = await axiosInstance.post<CourseDetailDTO>(
      `/admin/courses/${courseId}/approve`
    );
    return response.data;
  } catch (error) {
    console.error('Error approving course:', error);
    throw error;
  }
};

/**
 * Reject course (admin only)
 * POST /api/admin/courses/{courseId}/reject
 */
export const rejectCourse = async (
  courseId: number,
  _actorId: number,
  reason: string
): Promise<CourseDetailDTO> => {
  try {
    const response = await axiosInstance.post<CourseDetailDTO>(
      `/admin/courses/${courseId}/reject`,
      null,
      {
        params: { reason }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error rejecting course:', error);
    throw error;
  }
};

/**
 * Suspend course (admin only)
 * POST /api/admin/courses/{courseId}/suspend
 */
export const suspendCourse = async (
  courseId: number,
  _adminId: number,
  reason: string
): Promise<CourseDetailDTO> => {
  try {
    const response = await axiosInstance.post<CourseDetailDTO>(
      `/admin/courses/${courseId}/suspend`,
      null,
      { params: { reason } }
    );
    return response.data;
  } catch (error) {
    console.error('Error suspending course:', error);
    throw error;
  }
};

/**
 * Restore suspended course (admin only)
 * POST /api/admin/courses/{courseId}/restore
 */
export const restoreCourse = async (
  courseId: number,
  _adminId?: number
): Promise<CourseDetailDTO> => {
  try {
    const response = await axiosInstance.post<CourseDetailDTO>(
      `/admin/courses/${courseId}/restore`
    );
    return response.data;
  } catch (error) {
    console.error('Error restoring course:', error);
    throw error;
  }
};

/**
 * Update course upgrade policy (admin only)
 * POST /api/admin/courses/{courseId}/upgrade-policy?policy=...
 */
export const updateCourseUpgradePolicy = async (
  courseId: number,
  policy: CourseUpgradePolicy
): Promise<CourseDetailDTO> => {
  try {
    const response = await axiosInstance.post<CourseDetailDTO>(
      `/admin/courses/${courseId}/upgrade-policy`,
      null,
      {
        params: { policy }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error updating course upgrade policy:', error);
    throw error;
  }
};

// ==================== ADMIN COURSE MANAGEMENT ====================

/**
 * Course stats response from admin endpoint
 */
export interface CourseStatsResponse {
  totalPending: number;
  totalApproved: number;
  totalRejected: number;
  totalSuspended: number;
  totalDraft: number;
  totalArchived: number;
  totalAll: number;
}

export interface CourseRevisionDTO {
  id: number;
  courseId: number;
  revisionNumber: number;
  sourceRevisionId?: number | null;
  isActive?: boolean;
  status: CourseRevisionStatus;
  title?: string;
  description?: string;
  level?: string;
  category?: string;
  shortDescription?: string;
  estimatedDurationHours?: number;
  language?: string;
  price?: number;
  currency?: string;
  learningObjectivesJson?: string;
  requirementsJson?: string;
  courseSkillTagsJson?: string;
  contentSnapshotJson?: string;
  sourceCourseStatus?: string;
  thumbnailMediaId?: number;
  thumbnailUrl?: string;
  createdBy?: number;
  createdAt?: string;
  updatedAt?: string;
  submittedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  archivedAt?: string;
  autoUpgradeOutcome?: 'UPGRADED' | 'SKIPPED' | 'ERROR';
  autoUpgradeAffectedEnrollments?: number;
  autoUpgradeReasonCode?: string;
  autoUpgradeReasonDetail?: string;
}

export type ApproveRevisionResponse = CourseRevisionDTO;

export interface CourseRevisionUpdateDTO {
  title?: string;
  description?: string;
  level?: string;
  category?: string;
  shortDescription?: string;
  estimatedDurationHours?: number;
  language?: string;
  price?: number;
  currency?: string;
  learningObjectives?: string[];
  requirements?: string[];
  courseSkills?: string[];
  contentSnapshotJson?: string;
  thumbnailMediaId?: number;
}

export type CourseRevisionStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'ARCHIVED';

/**
 * Get course statistics grouped by status (admin only)
 * GET /api/admin/courses/stats
 */
export const getAdminCourseStats = async (): Promise<CourseStatsResponse> => {
  try {
    const response = await axiosInstance.get<CourseStatsResponse>('/admin/courses/stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching admin course stats:', error);
    throw error;
  }
};

/**
 * List all courses with optional status filter (admin only)
 * GET /api/admin/courses
 */
export const listAllCoursesAdmin = async (
  page: number = 0,
  size: number = 10,
  status?: string,
  search?: string,
  sortBy: string = 'createdAt',
  sortOrder: 'asc' | 'desc' = 'desc'
): Promise<PageResponse<CourseSummaryDTO>> => {
  try {
    const params: Record<string, string | number> = {
      page,
      size,
      sort: `${sortBy},${sortOrder}`
    };
    if (status) params.status = status;
    if (search) params.q = search;

    const response = await axiosInstance.get<PageResponse<CourseSummaryDTO>>(
      '/admin/courses',
      { params }
    );
    return normalizePageResponse<CourseSummaryDTO>(response.data);
  } catch (error) {
    console.error('Error listing admin courses:', error);
    throw error;
  }
};

// ==================== COURSE REVISION (CANARY APIs) ====================

export const createCourseRevision = async (
  courseId: number
): Promise<CourseRevisionDTO> => {
  const response = await axiosInstance.post<CourseRevisionDTO>(
    `/courses/${courseId}/revisions`
  );
  return response.data;
};

export const submitCourseRevision = async (
  revisionId: number
): Promise<CourseRevisionDTO> => {
  const response = await axiosInstance.post<CourseRevisionDTO>(
    `/course-revisions/${revisionId}/submit`
  );
  return response.data;
};

export const updateCourseRevision = async (
  revisionId: number,
  payload: CourseRevisionUpdateDTO,
  thumbnailFile?: File
): Promise<CourseRevisionDTO> => {
  // Always use FormData to match BE @ModelAttribute contract.
  // @ModelAttribute only binds multipart/form-data — JSON body silently drops
  // array fields (courseSkills, requirements, learningObjectives).
  const formData = new FormData();

  // Scalar fields
  const scalarFields = [
    'title', 'description', 'level', 'category', 'shortDescription',
    'estimatedDurationHours', 'language', 'price', 'currency',
  ];
  scalarFields.forEach((field) => {
    const value = (payload as Record<string, unknown>)[field];
    if (value !== undefined && value !== null) formData.append(field, String(value));
  });

  // Array fields — send sentinel when empty to tell BE to clear the field.
  // Spring @ModelAttribute cannot distinguish missing field (→ null) from empty array,
  // so we send "__EMPTY__" as a marker to represent "user intentionally cleared this".
  if (payload.learningObjectives?.length) {
    payload.learningObjectives.forEach((item) => formData.append('learningObjectives', item));
  } else {
    formData.append('learningObjectives', '__EMPTY__');
  }
  if (payload.requirements?.length) {
    payload.requirements.forEach((item) => formData.append('requirements', item));
  } else {
    formData.append('requirements', '__EMPTY__');
  }
  if (payload.courseSkills?.length) {
    payload.courseSkills.forEach((item) => formData.append('courseSkills', item));
  } else {
    formData.append('courseSkills', '__EMPTY__');
  }

  // Content snapshot & thumbnail
  if (payload.contentSnapshotJson) formData.append('contentSnapshotJson', payload.contentSnapshotJson);
  if (payload.thumbnailMediaId) formData.append('thumbnailMediaId', String(payload.thumbnailMediaId));
  if (thumbnailFile) formData.append('thumbnailFile', thumbnailFile);

  const response = await axiosInstance.put<CourseRevisionDTO>(
    `/course-revisions/${revisionId}`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return response.data;
};

export const getCourseRevision = async (
  revisionId: number
): Promise<CourseRevisionDTO> => {
  // Gắn token thủ công — interceptor có thể miss getAccessToken() trong một số context
  // Pattern giống getCourse() trong cùng file
  const token = getAccessToken();
  const response = await axiosInstance.get<CourseRevisionDTO>(
    `/course-revisions/${revisionId}`,
    token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
  );
  return response.data;
};

// Lấy revision APPROVED gần nhất của 1 course — cho admin so sánh khi xem pending revision
export const getLatestApprovedRevision = async (
  courseId: number
): Promise<CourseRevisionDTO | null> => {
  const token = getAccessToken();
  try {
    const response = await axiosInstance.get<CourseRevisionDTO>(
      `/admin/course-revisions/courses/${courseId}/latest-approved`,
      token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
    );
    return response.data;
  } catch {
    return null; // graceful fallback
  }
};

export const listCourseRevisions = async (
  courseId: number,
  page: number = 0,
  size: number = 20,
  status?: CourseRevisionStatus
): Promise<PageResponse<CourseRevisionDTO>> => {
  const response = await axiosInstance.get<PageResponse<CourseRevisionDTO>>(
    `/courses/${courseId}/revisions`,
    {
      params: {
        page,
        size,
        ...(status ? { status } : {})
      }
    }
  );

  return normalizePageResponse<CourseRevisionDTO>(response.data);
};

export const listAdminCourseRevisions = async (
  page: number = 0,
  size: number = 20,
  status: CourseRevisionStatus = 'PENDING'
): Promise<PageResponse<CourseRevisionDTO>> => {
  const response = await axiosInstance.get<PageResponse<CourseRevisionDTO>>(
    '/admin/course-revisions',
    {
      params: {
        page,
        size,
        status,
        sort: 'submittedAt,asc'
      }
    }
  );

  return normalizePageResponse<CourseRevisionDTO>(response.data);
};

export const approveCourseRevision = async (
  revisionId: number
): Promise<ApproveRevisionResponse> => {
  const response = await axiosInstance.post<ApproveRevisionResponse>(
    `/admin/course-revisions/${revisionId}/approve`
  );
  return {
    ...response.data,
    autoUpgradeOutcome: response.data?.autoUpgradeOutcome ?? 'SKIPPED',
    autoUpgradeReasonCode: response.data?.autoUpgradeReasonCode ?? 'UNKNOWN',
    autoUpgradeReasonDetail: response.data?.autoUpgradeReasonDetail ?? 'Không có chi tiết từ hệ thống.'
  };
};

export const rejectCourseRevision = async (
  revisionId: number,
  reason?: string
): Promise<CourseRevisionDTO> => {
  const response = await axiosInstance.post<CourseRevisionDTO>(
    `/admin/course-revisions/${revisionId}/reject`,
    null,
    reason ? { params: { reason } } : undefined
  );
  return response.data;
};

// ==================== REVISION DIFF ====================

export type CourseRevisionDiff = RevisionDiffDTO;

// Diff API response types
export interface RevisionDiffDTO {
  revisionId: number;
  courseId: number;
  revisionTitle: string | null;
  liveTitle: string | null;
  revisionNumber: number;
  moduleChanges: ModuleChangeDTO[];
  summary: DiffSummaryDTO;
}

export interface ModuleChangeDTO {
  changeKind: 'ADDED' | 'REMOVED' | 'MODIFIED' | 'CONTENT_ONLY';
  id: number | null;
  revisionId: number;
  liveId: number | null;
  title: string | null;
  description: string | null;
  orderIndex: number | null;
  itemChanges: ItemChangeDTO[];
  fieldChanges: FieldChangeListDTO | null;
}

export interface ItemChangeDTO {
  changeType: 'ADDED' | 'REMOVED' | 'MODIFIED';
  kind: 'LESSON' | 'QUIZ' | 'ASSIGNMENT';
  id: number | null;
  moduleId: number | null;
  title: string | null;
  fieldChanges: FieldChangeListDTO | null;
}

export interface FieldChangeListDTO {
  title: FieldChangeDTO | null;
  description: FieldChangeDTO | null;
  orderIndex: FieldChangeDTO | null;
  contentText: FieldChangeDTO | null;
  durationSec: FieldChangeDTO | null;
  videoUrl: FieldChangeDTO | null;
  resourceUrl: FieldChangeDTO | null;
  passScore: FieldChangeDTO | null;
  maxAttempts: FieldChangeDTO | null;
  timeLimitMinutes: FieldChangeDTO | null;
  gradingMethod: FieldChangeDTO | null;
  submissionType: FieldChangeDTO | null;
  maxScore: FieldChangeDTO | null;
  passingScore: FieldChangeDTO | null;
  isRequired: FieldChangeDTO | null;
  lessonType: FieldChangeDTO | null;
}

export interface FieldChangeDTO {
  fieldName: string;
  previousValue: string | null;
  newValue: string | null;
}

export interface DiffSummaryDTO {
  modulesAdded: number;
  modulesRemoved: number;
  modulesModified: number;
  modulesContentOnly: number;
  lessonsAdded: number;
  lessonsModified: number;
  lessonsRemoved: number;
  quizzesAdded: number;
  quizzesModified: number;
  quizzesRemoved: number;
  assignmentsAdded: number;
  assignmentsModified: number;
  assignmentsRemoved: number;
  totalChanges: number;
  hasChanges: boolean;
}

export const getRevisionDiff = async (revisionId: number): Promise<RevisionDiffDTO> => {
  const extractErrorInfo = (error: any) => {
    const status = error?.response?.status as number | undefined;
    const code = String(error?.response?.data?.code || '');
    const responsePayload = error?.response?.data;
    const responseText = typeof responsePayload === 'string'
      ? responsePayload
      : JSON.stringify(responsePayload ?? {});
    const message = `${String(error?.message || '')} ${responseText}`.toLowerCase();
    return { status, code, message };
  };

  const isRouteMissingLikeError = (info: { status?: number; code: string; message: string }) => (
    info.status === 404 ||
    info.code === 'NOT_FOUND' ||
    info.message.includes('no static resource') ||
    info.message.includes('resource not found')
  );

  let response;
  try {
    response = await axiosInstance.get<RevisionDiffDTO>(
      `/admin/course-revisions/${revisionId}/diff`
    );
  } catch (error: any) {
    try {
      // Fall back to non-admin endpoint for all errors (auth, 404, network, etc.)
      response = await axiosInstance.get<RevisionDiffDTO>(
        `/course-revisions/${revisionId}/diff`
      );
    } catch (fallbackError: any) {
      const primaryInfo = extractErrorInfo(error);
      const fallbackInfo = extractErrorInfo(fallbackError);
      const routeMissingLike = isRouteMissingLikeError(primaryInfo) || isRouteMissingLikeError(fallbackInfo);

      if (routeMissingLike) {
        (fallbackError as any).__diffEndpointMissing = true;
      }

      throw fallbackError;
    }
  }

  const data = response.data;
  // Guard against missing summary (backend may return malformed data)
  const summaryRaw = data.summary;
  const totalFromFields = summaryRaw
    ? summaryRaw.modulesAdded + summaryRaw.modulesRemoved +
      summaryRaw.modulesModified + summaryRaw.modulesContentOnly +
      summaryRaw.lessonsAdded + summaryRaw.lessonsModified + summaryRaw.lessonsRemoved +
      summaryRaw.quizzesAdded + summaryRaw.quizzesModified + summaryRaw.quizzesRemoved +
      summaryRaw.assignmentsAdded + summaryRaw.assignmentsModified + summaryRaw.assignmentsRemoved
    : 0;

  return {
    ...data,
    summary: {
      ...(summaryRaw ?? {}),
      totalChanges: (summaryRaw?.totalChanges ?? totalFromFields),
      hasChanges: (summaryRaw?.hasChanges ?? totalFromFields > 0),
    }
  };
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Check if user can edit course
 */
export const canEditCourse = (course: CourseDetailDTO | CourseSummaryDTO, userId: number): boolean => {
  return course.author.id === userId && 
    (course.status === CourseStatus.DRAFT || course.status === CourseStatus.REJECTED || course.status === CourseStatus.SUSPENDED);
};

/**
 * Check if course can be submitted for approval
 * Requirements: Must be DRAFT, REJECTED, or SUSPENDED status and have at least one module
 */
export const canSubmitForApproval = (course: CourseDetailDTO): boolean => {
  return (course.status === CourseStatus.DRAFT || course.status === CourseStatus.REJECTED || course.status === CourseStatus.SUSPENDED) &&
    course.modules && 
    course.modules.length > 0; // Must have at least one module (modules contain lessons)
};

/**
 * Get status color for badge
 */
export const getCourseStatusColor = (status: CourseStatus): string => {
  switch (status) {
    case CourseStatus.DRAFT:
      return 'gray';
    case CourseStatus.PENDING:
      return 'orange';
    case CourseStatus.PUBLIC:
      return 'green';
    case CourseStatus.ARCHIVED:
      return 'red';
    case CourseStatus.REJECTED:
      return 'red';
    case CourseStatus.SUSPENDED:
      return 'purple';
    default:
      return 'gray';
  }
};

/**
 * Get status text
 */
export const getCourseStatusText = (status: CourseStatus): string => {
  switch (status) {
    case CourseStatus.DRAFT:
      return 'Draft';
    case CourseStatus.PENDING:
      return 'Pending Review';
    case CourseStatus.PUBLIC:
      return 'Public';
    case CourseStatus.ARCHIVED:
      return 'Archived';
    case CourseStatus.REJECTED:
      return 'Bị từ chối';
    case CourseStatus.SUSPENDED:
      return 'Tạm khóa (vi phạm)';
    default:
      return status;
  }
};
