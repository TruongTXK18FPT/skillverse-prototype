import axiosInstance from './axiosInstance';
import {
  CourseDetailDTO,
  CourseSummaryDTO,
  CourseCreateDTO,
  CourseUpdateDTO,
  CourseStatus,
  PageResponse
} from '../data/courseDTOs';

/**
 * Course Service - Complete API Integration
 * Matches Backend CourseController endpoints
 */

// ==================== NORMALIZERS ====================

function normalizePageResponse<T>(data: any): PageResponse<T> {
  const content: T[] = (data?.content ?? data?.items) ?? [];
  const size: number = data?.size ?? 0;
  const page: number = data?.page ?? 0;
  const totalElements: number = data?.totalElements ?? data?.total ?? content.length;
  const totalPages: number = data?.totalPages ?? (size ? Math.ceil(totalElements / size) : 1);
  const first: boolean = data?.first ?? page === 0;
  const last: boolean = data?.last ?? (page + 1 >= totalPages);
  const empty: boolean = data?.empty ?? content.length === 0;
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
    if (courseData.level) formData.append('level', courseData.level);
    if (thumbnailFile) formData.append('thumbnailFile', thumbnailFile);
    if (courseData.price) formData.append('price', courseData.price.toString());
    if (courseData.currency) formData.append('currency', courseData.currency);

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
    formData.append('title', courseData.title);
    if (courseData.description) formData.append('description', courseData.description);
    if (courseData.level) formData.append('level', courseData.level);
    if (thumbnailFile) formData.append('thumbnailFile', thumbnailFile);
    if (courseData.price) formData.append('price', courseData.price.toString());
    if (courseData.currency) formData.append('currency', courseData.currency);

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
 * Delete a course
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
    console.error('Error deleting course:', error);
    throw error;
  }
};

/**
 * Get course by ID
 * GET /api/courses/{courseId}
 */
export const getCourse = async (
  courseId: number,
  actorId?: number
): Promise<CourseDetailDTO> => {
  try {
    const response = await axiosInstance.get<CourseDetailDTO>(
      `/courses/${courseId}`,
      actorId ? { params: { actorId } } : undefined
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching course:', error);
    throw error;
  }
};

// ==================== COURSE QUERY OPERATIONS ====================

/**
 * List courses with pagination, search, and filtering
 * GET /api/courses
 */
export const listCourses = async (
  page: number = 0,
  size: number = 10,
  level?: string,
  status?: string,
  search?: string,
  sortBy: string = 'createdAt',
  sortOrder: 'asc' | 'desc' = 'desc'
): Promise<PageResponse<CourseSummaryDTO>> => {
  try {
    const params: any = {
      page,
      size,
      sortBy,
      sortOrder
    };

    if (level) params.level = level;
    if (status) params.status = status;
    if (search) params.search = search;

    const response = await axiosInstance.get<any>(
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
  size: number = 10
): Promise<PageResponse<CourseSummaryDTO>> => {
  try {
    const response = await axiosInstance.get<any>(
      `/courses/by-author/${authorId}`,
      {
        params: { page, size }
      }
    );
    return normalizePageResponse<CourseSummaryDTO>(response.data);
  } catch (error) {
    console.error('Error listing courses by author:', error);
    throw error;
  }
};

/**
 * List pending courses (for admin approval)
 * GET /api/courses/pending
 */
export const listPendingCourses = async (
  page: number = 0,
  size: number = 10,
  sortBy: string = 'submittedDate',
  sortOrder: 'asc' | 'desc' = 'desc'
): Promise<PageResponse<CourseSummaryDTO>> => {
  try {
    const response = await axiosInstance.get<any>(
      '/courses/pending',
      {
        params: {
          page,
          size,
          sortBy,
          sortOrder
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
    const response = await axiosInstance.get<any>(
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
 * Search courses
 * GET /api/courses/search
 */
export const searchCourses = async (
  query: string,
  page: number = 0,
  size: number = 10
): Promise<PageResponse<CourseSummaryDTO>> => {
  try {
    const response = await axiosInstance.get<any>(
      '/courses/search',
      {
        params: {
          q: query,
          page,
          size
        }
      }
    );
    return normalizePageResponse<CourseSummaryDTO>(response.data);
  } catch (error) {
    console.error('Error searching courses:', error);
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
 * POST /api/courses/{courseId}/approve
 */
export const approveCourse = async (
  courseId: number,
  actorId: number
): Promise<CourseDetailDTO> => {
  try {
    const response = await axiosInstance.post<CourseDetailDTO>(
      `/courses/${courseId}/approve`,
      null,
      {
        params: {
          adminId: actorId
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error approving course:', error);
    throw error;
  }
};

/**
 * Reject course (admin only)
 * POST /api/courses/{courseId}/reject
 */
export const rejectCourse = async (
  courseId: number,
  actorId: number,
  reason: string
): Promise<CourseDetailDTO> => {
  try {
    const response = await axiosInstance.post<CourseDetailDTO>(
      `/courses/${courseId}/reject`,
      null,
      {
        params: {
          adminId: actorId,
          reason
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error rejecting course:', error);
    throw error;
  }
};

/**
 * Publish course
 * PUT /api/courses/{courseId}/publish
 */
export const publishCourse = async (
  courseId: number,
  actorId: number
): Promise<CourseDetailDTO> => {
  try {
    const response = await axiosInstance.put<CourseDetailDTO>(
      `/courses/${courseId}/publish`,
      null,
      {
        params: { actorId }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error publishing course:', error);
    throw error;
  }
};

/**
 * Unpublish course
 * PUT /api/courses/{courseId}/unpublish
 */
export const unpublishCourse = async (
  courseId: number,
  actorId: number
): Promise<CourseDetailDTO> => {
  try {
    const response = await axiosInstance.put<CourseDetailDTO>(
      `/courses/${courseId}/unpublish`,
      null,
      {
        params: { actorId }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error unpublishing course:', error);
    throw error;
  }
};

/**
 * Archive course
 * PUT /api/courses/{courseId}/archive
 */
export const archiveCourse = async (
  courseId: number,
  actorId: number
): Promise<CourseDetailDTO> => {
  try {
    const response = await axiosInstance.put<CourseDetailDTO>(
      `/courses/${courseId}/archive`,
      null,
      {
        params: { actorId }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error archiving course:', error);
    throw error;
  }
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Check if user can edit course
 */
export const canEditCourse = (course: CourseDetailDTO | CourseSummaryDTO, userId: number): boolean => {
  return course.author.id === userId && 
    (course.status === CourseStatus.DRAFT || course.status === CourseStatus.PENDING);
};

/**
 * Check if course can be submitted for approval
 * Requirements: Must be DRAFT status and have at least one module
 */
export const canSubmitForApproval = (course: CourseDetailDTO): boolean => {
  return course.status === CourseStatus.DRAFT &&
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
    default:
      return status;
  }
};

// ==================== LEGACY SUPPORT ====================

/**
 * Legacy Course interface (for backward compatibility)
 */
export interface Course {
  id: string;
  title: string;
  instructor: string;
  category: string;
  image: string;
  level?: string;
  price?: string;
  rating?: number;
  students?: string | number;
  description?: string;
  duration?: string;
  modules?: number;
  certificate?: boolean;
}

/**
 * Convert CourseDetailDTO to legacy Course format
 */
const convertToLegacyCourse = (dto: CourseSummaryDTO): Course => {
  return {
    id: dto.id.toString(),
    title: dto.title,
    instructor: dto.author?.fullName || `${dto.author?.firstName} ${dto.author?.lastName}`,
    category: 'general', // No category field in DTO
    image: dto.thumbnail?.url || '/images/default-course.jpg',
    level: dto.level,
    price: '0', // Pricing not in current DTO
    rating: 0, // Rating not in summary DTO
    students: dto.enrollmentCount,
    description: dto.description,
    duration: '0', // Duration not in DTO
    modules: 0, // Module count not in summary DTO
    certificate: false
  };
};

/**
 * Fetch all courses (legacy support)
 */
export const fetchAllCourses = async (): Promise<Course[]> => {
  try {
    const response = await listPublishedCourses(0, 100);
    return response.content.map(convertToLegacyCourse);
  } catch (error) {
    console.error('Error fetching all courses:', error);
    return [];
  }
};

/**
 * Find course by ID (legacy support)
 */
export const findCourseById = async (id: string): Promise<Course | null> => {
  try {
    const courseId = parseInt(id);
    if (isNaN(courseId)) return null;
    
    const course = await getCourse(courseId);
    const summary: CourseSummaryDTO = {
      id: course.id,
      title: course.title,
      description: course.description,
      level: course.level,
      status: course.status,
      author: course.author,
      thumbnail: course.thumbnail,
      enrollmentCount: course.enrollmentCount,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt
    };
    
    return convertToLegacyCourse(summary);
  } catch (error) {
    console.error('Error finding course by ID:', error);
    return null;
  }
};

/**
 * Parse price (legacy)
 */
export const parsePrice = (priceStr?: string): number => {
  if (!priceStr || 
      priceStr.toLowerCase().includes('miễn phí') || 
      priceStr.toLowerCase().includes('0 vnd') ||
      priceStr.trim() === '0') return 0;
  const numStr = priceStr.replace(/[^\d]/g, '');
  return parseInt(numStr) || 0;
};

/**
 * Check if price is free (legacy)
 */
export const isFreePrice = (priceStr?: string): boolean => {
  if (!priceStr) return true;
  const lowerPrice = priceStr.toLowerCase().trim();
  const freeFormats = ['miễn phí', '0 vnd', '0vnd', '0 vnđ', '0vnđ', 'free', 'gratis'];
  return freeFormats.some(format => lowerPrice.includes(format)) || 
         lowerPrice === '0' || 
         parsePrice(priceStr) === 0;
};

