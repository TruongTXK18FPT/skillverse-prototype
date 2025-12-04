import axiosInstance from './axiosInstance';

/**
 * Enrollment Service - Complete API Integration
 * Matches Backend EnrollmentController endpoints
 */

// ==================== DTOs ====================

export interface EnrollRequestDTO {
  courseId: number;
}

export interface EnrollmentDetailDTO {
  id: number;
  courseId: number;
  userId: number;
  status: 'ENROLLED' | 'COMPLETED' | 'CANCELLED';
  progressPercent: number;
  entitlementSource: 'PURCHASE' | 'FREE' | 'GIFT' | 'TRIAL';
  entitlementRef?: string;
  enrolledAt: string;
  completedAt?: string;
  completed: boolean;
}

export interface EnrollmentStatsDTO {
  totalEnrollments: number;
  activeEnrollments: number;
  completedEnrollments: number;
  averageProgress: number;
  enrollmentsThisMonth: number;
}

// ==================== ENROLLMENT OPERATIONS ====================

/**
 * Enroll a user in a course
 * POST /api/enrollments
 */
export const enrollUser = async (
  courseId: number,
  userId: number
): Promise<EnrollmentDetailDTO> => {
  try {
    // BE expects only { courseId } in request body
    const enrollRequest: EnrollRequestDTO = { courseId };

    const response = await axiosInstance.post<EnrollmentDetailDTO>(
      '/enrollments',
      enrollRequest,
      {
        params: { userId }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error enrolling user:', error);
    throw error;
  }
};

/**
 * Unenroll a user from a course
 * DELETE /api/enrollments/course/{courseId}/user/{userId}
 */
export const unenrollUser = async (
  courseId: number,
  userId: number
): Promise<void> => {
  try {
    await axiosInstance.delete(`/enrollments/course/${courseId}/user/${userId}`);
  } catch (error) {
    console.error('Error unenrolling user:', error);
    throw error;
  }
};

/**
 * Get enrollment details for a user in a course
 * GET /api/enrollments/course/{courseId}/user/{userId}
 */
export const getEnrollment = async (
  courseId: number,
  userId: number
): Promise<EnrollmentDetailDTO> => {
  try {
    const response = await axiosInstance.get<EnrollmentDetailDTO>(
      `/enrollments/course/${courseId}/user/${userId}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching enrollment:', error);
    throw error;
  }
};

/**
 * Get all enrollments for a course (Mentor/Admin view)
 * GET /api/enrollments/course/{courseId}
 */
export const getCourseEnrollments = async (
  courseId: number,
  actorId: number,
  page: number = 0,
  size: number = 20
): Promise<{ content: EnrollmentDetailDTO[]; totalElements: number; totalPages: number }> => {
  try {
    const response = await axiosInstance.get<{
      content: EnrollmentDetailDTO[];
      totalElements: number;
      totalPages: number;
    }>(`/enrollments/course/${courseId}`, {
      params: { 
        actorId,
        page, 
        size 
      }
    });
    
    // Handle both PageResponse formats if needed, similar to getUserEnrollments
    const data: any = response.data;
    return {
      content: data.content || data.items || [],
      totalElements: data.totalElements || data.total || 0,
      totalPages: data.totalPages || 0
    };
  } catch (error) {
    console.error('Error fetching course enrollments:', error);
    throw error;
  }
};

/**
 * Check if user is enrolled in course
 * GET /api/enrollments/course/{courseId}/user/{userId}/status
 */
export const checkEnrollmentStatus = async (
  courseId: number,
  userId: number
): Promise<boolean> => {
  try {
    const response = await axiosInstance.get<{ enrolled: boolean }>(
      `/enrollments/course/${courseId}/user/${userId}/status`
    );
    return response.data.enrolled;
  } catch (error) {
    console.error('Error checking enrollment status:', error);
    return false; // Default to not enrolled if error
  }
};

/**
 * Get all enrollments for a user
 * GET /api/enrollments/user/{userId}
 */
export const getUserEnrollments = async (
  userId: number,
  page: number = 0,
  size: number = 20
): Promise<{ content: EnrollmentDetailDTO[]; totalElements: number; totalPages: number }> => {
  try {
    // Backend returns PageResponse which has { items, page, size, total }
    const response = await axiosInstance.get<{
      items: EnrollmentDetailDTO[];
      total: number;
      page: number;
      size: number;
    }>(`/enrollments/user/${userId}`, {
      params: { page, size }
    });
    
    return {
      content: response.data.items || [],
      totalElements: response.data.total,
      totalPages: Math.ceil(response.data.total / (size || 20))
    };
  } catch (error) {
    console.error('Error fetching user enrollments:', error);
    throw error;
  }
};

/**
 * Update course completion status
 * PUT /api/enrollments/course/{courseId}/user/{userId}/completion
 */
export const updateCompletionStatus = async (
  courseId: number,
  userId: number,
  completed: boolean
): Promise<void> => {
  try {
    await axiosInstance.put(
      `/enrollments/course/${courseId}/user/${userId}/completion`,
      null,
      {
        params: { completed }
      }
    );
  } catch (error) {
    console.error('Error updating completion status:', error);
    throw error;
  }
};

/**
 * Update enrollment progress percentage
 * PUT /api/enrollments/course/{courseId}/user/{userId}/progress
 */
export const updateProgress = async (
  courseId: number,
  userId: number,
  progressPercentage: number
): Promise<void> => {
  try {
    await axiosInstance.put(
      `/enrollments/course/${courseId}/user/${userId}/progress`,
      null,
      {
        params: { progressPercentage }
      }
    );
  } catch (error) {
    console.error('Error updating progress:', error);
    throw error;
  }
};

/**
 * Get enrollment statistics for a course
 * GET /api/enrollments/course/{courseId}/stats
 */
export const getEnrollmentStats = async (
  courseId: number,
  actorId: number
): Promise<EnrollmentStatsDTO> => {
  try {
    const response = await axiosInstance.get<EnrollmentStatsDTO>(
      `/enrollments/course/${courseId}/stats`,
      {
        params: { actorId }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching enrollment stats:', error);
    throw error;
  }
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Check if user can enroll in course (not already enrolled)
 */
export const canEnroll = async (courseId: number, userId: number): Promise<boolean> => {
  try {
    const isEnrolled = await checkEnrollmentStatus(courseId, userId);
    return !isEnrolled;
  } catch (error) {
    console.error('Error checking enrollment eligibility:', error);
    return false;
  }
};

/**
 * Get enrollment progress for display
 */
export const getEnrollmentProgress = async (
  courseId: number,
  userId: number
): Promise<{ enrolled: boolean; progress: number; completed: boolean }> => {
  try {
    const enrollment = await getEnrollment(courseId, userId);
    return {
      enrolled: true,
      progress: enrollment.progressPercent,
      completed: enrollment.completed
    };
  } catch {
    return {
      enrolled: false,
      progress: 0,
      completed: false
    };
  }
};
