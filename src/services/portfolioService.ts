// Portfolio Service - API calls to backend portfolio service
import axios from 'axios';
import {
  UserProfileDTO,
  PortfolioProjectDTO,
  ExternalCertificateDTO,
  MentorReviewDTO,
  GeneratedCVDTO,
  CVGenerationRequest,
  ApiResponse,
  CheckExtendedProfileResponse
} from '../data/portfolioDTOs';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const PORTFOLIO_API = `${API_BASE_URL}/api/portfolio`;

// Axios instance with authentication
const api = axios.create({
  baseURL: PORTFOLIO_API,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ==================== PROFILE ENDPOINTS ====================

/**
 * Check if user has extended portfolio profile
 */
export const checkExtendedProfile = async (): Promise<CheckExtendedProfileResponse> => {
  try {
    const response = await api.get<CheckExtendedProfileResponse>('/profile/check');
    return response.data;
  } catch (error: any) {
    console.error('Error checking extended profile:', error.response?.data || error.message);
    // If error, assume no extended profile
    return { success: false, hasExtendedProfile: false };
  }
};

/**
 * Get combined profile (basic + extended) of authenticated user
 */
export const getProfile = async (): Promise<UserProfileDTO> => {
  const response = await api.get<ApiResponse<UserProfileDTO>>('/profile');
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Failed to fetch profile');
  }
  return response.data.data;
};

/**
 * Get public profile by custom URL slug
 */
export const getProfileBySlug = async (slug: string): Promise<UserProfileDTO> => {
  const response = await api.get<ApiResponse<UserProfileDTO>>(`/profile/slug/${slug}`);
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Profile not found');
  }
  return response.data.data;
};

/**
 * Get public profile by user ID
 */
export const getPublicProfile = async (userId: number): Promise<UserProfileDTO> => {
  const response = await api.get<ApiResponse<UserProfileDTO>>(`/profile/${userId}`);
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Profile not found');
  }
  return response.data.data;
};

/**
 * Create extended portfolio profile
 */
export const createExtendedProfile = async (
  profile: Partial<UserProfileDTO>,
  avatar?: File,
  video?: File,
  coverImage?: File
): Promise<UserProfileDTO> => {
  const formData = new FormData();
  
  // Add profile JSON
  const profileBlob = new Blob([JSON.stringify(profile)], { type: 'application/json' });
  formData.append('profile', profileBlob);
  
  // Add files if provided
  if (avatar) formData.append('avatar', avatar);
  if (video) formData.append('video', video);
  if (coverImage) formData.append('coverImage', coverImage);
  
  const response = await api.post<ApiResponse<UserProfileDTO>>('/profile', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Failed to create extended profile');
  }
  
  return response.data.data;
};

/**
 * Update extended portfolio profile
 */
export const updateExtendedProfile = async (
  profile: Partial<UserProfileDTO>,
  avatar?: File,
  video?: File,
  coverImage?: File
): Promise<UserProfileDTO> => {
  const formData = new FormData();
  
  // Add profile JSON
  const profileBlob = new Blob([JSON.stringify(profile)], { type: 'application/json' });
  formData.append('profile', profileBlob);
  
  // Add files if provided
  if (avatar) formData.append('avatar', avatar);
  if (video) formData.append('video', video);
  if (coverImage) formData.append('coverImage', coverImage);
  
  const response = await api.put<ApiResponse<UserProfileDTO>>('/profile', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Failed to update extended profile');
  }
  
  return response.data.data;
};

/**
 * Delete extended portfolio profile
 */
export const deleteExtendedProfile = async (): Promise<void> => {
  const response = await api.delete<ApiResponse<void>>('/profile');
  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to delete extended profile');
  }
};

// ==================== PROJECTS ENDPOINTS ====================

/**
 * Get all projects of authenticated user
 */
export const getUserProjects = async (): Promise<PortfolioProjectDTO[]> => {
  const response = await api.get<ApiResponse<PortfolioProjectDTO[]>>('/projects');
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Failed to fetch projects');
  }
  return response.data.data;
};

/**
 * Create a new project
 */
export const createProject = async (
  project: PortfolioProjectDTO,
  thumbnail?: File
): Promise<PortfolioProjectDTO> => {
  const formData = new FormData();
  
  // Add project JSON
  const projectBlob = new Blob([JSON.stringify(project)], { type: 'application/json' });
  formData.append('project', projectBlob);
  
  // Add thumbnail if provided
  if (thumbnail) formData.append('thumbnail', thumbnail);
  
  const response = await api.post<ApiResponse<PortfolioProjectDTO>>('/projects', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Failed to create project');
  }
  
  return response.data.data;
};

/**
 * Update an existing project
 */
export const updateProject = async (
  projectId: number,
  project: PortfolioProjectDTO,
  thumbnail?: File
): Promise<PortfolioProjectDTO> => {
  const formData = new FormData();
  
  // Add project JSON
  const projectBlob = new Blob([JSON.stringify(project)], { type: 'application/json' });
  formData.append('project', projectBlob);
  
  // Add thumbnail if provided
  if (thumbnail) formData.append('thumbnail', thumbnail);
  
  const response = await api.put<ApiResponse<PortfolioProjectDTO>>(
    `/projects/${projectId}`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Failed to update project');
  }
  
  return response.data.data;
};

/**
 * Delete a project
 */
export const deleteProject = async (projectId: number): Promise<void> => {
  const response = await api.delete<ApiResponse<void>>(`/projects/${projectId}`);
  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to delete project');
  }
};

// ==================== CERTIFICATES ENDPOINTS ====================

/**
 * Get all certificates of authenticated user
 */
export const getUserCertificates = async (): Promise<ExternalCertificateDTO[]> => {
  const response = await api.get<ApiResponse<ExternalCertificateDTO[]>>('/certificates');
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Failed to fetch certificates');
  }
  return response.data.data;
};

/**
 * Create a new external certificate
 */
export const createCertificate = async (
  certificate: ExternalCertificateDTO,
  image?: File
): Promise<ExternalCertificateDTO> => {
  const formData = new FormData();
  
  // Add certificate JSON
  const certBlob = new Blob([JSON.stringify(certificate)], { type: 'application/json' });
  formData.append('certificate', certBlob);
  
  // Add image if provided
  if (image) formData.append('image', image);
  
  const response = await api.post<ApiResponse<ExternalCertificateDTO>>(
    '/certificates',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Failed to create certificate');
  }
  
  return response.data.data;
};

/**
 * Delete a certificate
 */
export const deleteCertificate = async (certificateId: number): Promise<void> => {
  const response = await api.delete<ApiResponse<void>>(`/certificates/${certificateId}`);
  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to delete certificate');
  }
};

// ==================== REVIEWS ENDPOINTS ====================

/**
 * Get all mentor reviews for authenticated user
 */
export const getUserReviews = async (): Promise<MentorReviewDTO[]> => {
  const response = await api.get<ApiResponse<MentorReviewDTO[]>>('/reviews');
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Failed to fetch reviews');
  }
  return response.data.data;
};

// ==================== CV GENERATION ENDPOINTS ====================

/**
 * Generate CV with AI
 */
export const generateCV = async (
  request: CVGenerationRequest
): Promise<GeneratedCVDTO> => {
  const response = await api.post<ApiResponse<GeneratedCVDTO>>('/cv/generate', request);
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Failed to generate CV');
  }
  return response.data.data;
};

/**
 * Update an existing CV
 */
export const updateCV = async (
  cvId: number,
  cvContent: string,
  cvJson?: string
): Promise<GeneratedCVDTO> => {
  const response = await api.put<ApiResponse<GeneratedCVDTO>>(`/cv/${cvId}`, {
    cvContent,
    cvJson,
  });
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Failed to update CV');
  }
  return response.data.data;
};

/**
 * Get active CV
 */
export const getActiveCV = async (): Promise<GeneratedCVDTO> => {
  const response = await api.get<ApiResponse<GeneratedCVDTO>>('/cv/active');
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'No active CV found');
  }
  return response.data.data;
};

/**
 * Get all CV versions
 */
export const getAllCVs = async (): Promise<GeneratedCVDTO[]> => {
  const response = await api.get<ApiResponse<GeneratedCVDTO[]>>('/cv/all');
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Failed to fetch CVs');
  }
  return response.data.data;
};

// Export all services
export const portfolioService = {
  // Profile
  checkExtendedProfile,
  getProfile,
  getProfileBySlug,
  getPublicProfile,
  createExtendedProfile,
  updateExtendedProfile,
  deleteExtendedProfile,
  
  // Projects
  getUserProjects,
  createProject,
  updateProject,
  deleteProject,
  
  // Certificates
  getUserCertificates,
  createCertificate,
  deleteCertificate,
  
  // Reviews
  getUserReviews,
  
  // CV Generation
  generateCV,
  updateCV,
  getActiveCV,
  getAllCVs,
};

export default portfolioService;
