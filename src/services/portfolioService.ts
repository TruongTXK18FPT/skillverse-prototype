// Portfolio Service - API calls to backend portfolio service
import { axiosInstance } from './axiosInstance';
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

// Use shared axios instance with automatic environment detection
const api = axiosInstance;

// ==================== PROFILE ENDPOINTS ====================

/**
 * Check if user has extended portfolio profile
 */
export const checkExtendedProfile = async (): Promise<CheckExtendedProfileResponse> => {
  try {
    const response = await api.get<CheckExtendedProfileResponse>('/portfolio/profile/check');
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
  const response = await api.get<ApiResponse<UserProfileDTO>>('/portfolio/profile');
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Failed to fetch profile');
  }
  return response.data.data;
};

/**
 * Get public profile by custom URL slug
 */
export const getProfileBySlug = async (slug: string): Promise<UserProfileDTO> => {
  const response = await api.get<ApiResponse<UserProfileDTO>>(`/portfolio/profile/slug/${slug}`);
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Profile not found');
  }
  return response.data.data;
};

/**
 * Get public profile by user ID
 */
export const getPublicProfile = async (userId: number): Promise<UserProfileDTO> => {
  const response = await api.get<ApiResponse<UserProfileDTO>>(`/portfolio/profile/${userId}`);
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
  if (avatar) {
    console.log(`📸 Adding avatar: ${avatar.name} (${(avatar.size / 1024 / 1024).toFixed(2)}MB)`);
    formData.append('avatar', avatar);
  }
  if (video) {
    console.log(`🎥 Adding video: ${video.name} (${(video.size / 1024 / 1024).toFixed(2)}MB)`);
    formData.append('video', video);
  }
  if (coverImage) {
    console.log(`🖼️ Adding cover image: ${coverImage.name} (${(coverImage.size / 1024 / 1024).toFixed(2)}MB)`);
    formData.append('coverImage', coverImage);
  }
  
  console.log('⏳ Sending create profile request...');
  const startTime = Date.now();
  
  const response = await api.post<ApiResponse<UserProfileDTO>>('/portfolio/profile', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 360000, // 2 minutes for large file uploads
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        console.log(`📊 Upload progress: ${percentCompleted}% (${(progressEvent.loaded / 1024 / 1024).toFixed(2)}MB / ${(progressEvent.total / 1024 / 1024).toFixed(2)}MB)`);
      }
    }
  });
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`✅ Profile created successfully in ${duration}s`);
  
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
  if (avatar) {
    console.log(`📸 Adding avatar: ${avatar.name} (${(avatar.size / 1024 / 1024).toFixed(2)}MB)`);
    formData.append('avatar', avatar);
  }
  if (video) {
    console.log(`🎥 Adding video: ${video.name} (${(video.size / 1024 / 1024).toFixed(2)}MB)`);
    formData.append('video', video);
  }
  if (coverImage) {
    console.log(`🖼️ Adding cover image: ${coverImage.name} (${(coverImage.size / 1024 / 1024).toFixed(2)}MB)`);
    formData.append('coverImage', coverImage);
  }
  
  console.log('⏳ Sending update profile request...');
  const startTime = Date.now();
  
  const response = await api.put<ApiResponse<UserProfileDTO>>('/portfolio/profile', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 360000, // 2 minutes for large file uploads
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        console.log(`📊 Upload progress: ${percentCompleted}% (${(progressEvent.loaded / 1024 / 1024).toFixed(2)}MB / ${(progressEvent.total / 1024 / 1024).toFixed(2)}MB)`);
      }
    }
  });
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`✅ Profile updated successfully in ${duration}s`);
  
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Failed to update extended profile');
  }
  
  return response.data.data;
};

/**
 * Delete extended portfolio profile
 */
export const deleteExtendedProfile = async (): Promise<void> => {
  const response = await api.delete<ApiResponse<void>>('/portfolio/profile');
  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to delete extended profile');
  }
};

// ==================== PROJECTS ENDPOINTS ====================

/**
 * Get all projects of authenticated user
 */
export const getUserProjects = async (): Promise<PortfolioProjectDTO[]> => {
  const response = await api.get<ApiResponse<PortfolioProjectDTO[]>>('/portfolio/projects');
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
  if (thumbnail) {
    console.log(`🖼️ Adding project thumbnail: ${thumbnail.name} (${(thumbnail.size / 1024 / 1024).toFixed(2)}MB)`);
    formData.append('thumbnail', thumbnail);
  }
  
  const response = await api.post<ApiResponse<PortfolioProjectDTO>>('/portfolio/projects', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 60000, // 1 minute
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
  if (thumbnail) {
    console.log(`🖼️ Adding project thumbnail: ${thumbnail.name} (${(thumbnail.size / 1024 / 1024).toFixed(2)}MB)`);
    formData.append('thumbnail', thumbnail);
  }
  
  const response = await api.put<ApiResponse<PortfolioProjectDTO>>(
    `/portfolio/projects/${projectId}`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000, // 1 minute
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
  const response = await api.delete<ApiResponse<void>>(`/portfolio/projects/${projectId}`);
  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to delete project');
  }
};

// ==================== CERTIFICATES ENDPOINTS ====================

/**
 * Get all certificates of authenticated user
 */
export const getUserCertificates = async (): Promise<ExternalCertificateDTO[]> => {
  const response = await api.get<ApiResponse<ExternalCertificateDTO[]>>('/portfolio/certificates');
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
  if (image) {
    console.log(`🖼️ Adding certificate image: ${image.name} (${(image.size / 1024 / 1024).toFixed(2)}MB)`);
    formData.append('image', image);
  }
  
  const response = await api.post<ApiResponse<ExternalCertificateDTO>>(
    '/portfolio/certificates',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000, // 1 minute
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
  const response = await api.delete<ApiResponse<void>>(`/portfolio/certificates/${certificateId}`);
  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to delete certificate');
  }
};

// ==================== REVIEWS ENDPOINTS ====================

/**
 * Get all mentor reviews for authenticated user
 */
export const getUserReviews = async (): Promise<MentorReviewDTO[]> => {
  const response = await api.get<ApiResponse<MentorReviewDTO[]>>('/portfolio/reviews');
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
  const response = await api.post<ApiResponse<GeneratedCVDTO>>('/portfolio/cv/generate', request);
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
  const response = await api.put<ApiResponse<GeneratedCVDTO>>(`/portfolio/cv/${cvId}`, {
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
  const response = await api.get<ApiResponse<GeneratedCVDTO>>('/portfolio/cv/active');
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'No active CV found');
  }
  return response.data.data;
};

/**
 * Get all CV versions
 */
export const getAllCVs = async (): Promise<GeneratedCVDTO[]> => {
  const response = await api.get<ApiResponse<GeneratedCVDTO[]>>('/portfolio/cv/all');
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Failed to fetch CVs');
  }
  return response.data.data;
};

export const setActiveCV = async (cvId: number): Promise<void> => {
  const response = await api.put<ApiResponse<void>>(`/portfolio/cv/${cvId}/set-active`);
  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to set active CV');
  }
};

export const deleteCV = async (cvId: number): Promise<void> => {
  const response = await api.delete<ApiResponse<void>>(`/portfolio/cv/${cvId}`);
  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to delete CV');
  }
};

// ==================== PUBLIC DATA ENDPOINTS ====================

/**
 * Get public projects by user ID
 */
export const getPublicUserProjects = async (userId: number): Promise<PortfolioProjectDTO[]> => {
  const response = await api.get<ApiResponse<PortfolioProjectDTO[]>>(`/portfolio/public/${userId}/projects`);
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Failed to fetch public projects');
  }
  return response.data.data;
};

/**
 * Get public certificates by user ID
 */
export const getPublicUserCertificates = async (userId: number): Promise<ExternalCertificateDTO[]> => {
  const response = await api.get<ApiResponse<ExternalCertificateDTO[]>>(`/portfolio/public/${userId}/certificates`);
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Failed to fetch public certificates');
  }
  return response.data.data;
};

/**
 * Get public reviews by user ID
 */
export const getPublicUserReviews = async (userId: number): Promise<MentorReviewDTO[]> => {
  const response = await api.get<ApiResponse<MentorReviewDTO[]>>(`/portfolio/public/${userId}/reviews`);
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Failed to fetch public reviews');
  }
  return response.data.data;
};

/**
 * Get all public portfolios
 */
export const getAllPublicPortfolios = async (): Promise<UserProfileDTO[]> => {
  const response = await api.get<ApiResponse<UserProfileDTO[]>>('/portfolio/public');
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Failed to fetch public portfolios');
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
  getAllPublicPortfolios,
  createExtendedProfile,
  updateExtendedProfile,
  deleteExtendedProfile,
  
  // Projects
  getUserProjects,
  getPublicUserProjects,
  createProject,
  updateProject,
  deleteProject,
  
  // Certificates
  getUserCertificates,
  getPublicUserCertificates,
  createCertificate,
  deleteCertificate,
  
  // Reviews
  getUserReviews,
  getPublicUserReviews,
  
  // CV Generation
  generateCV,
  updateCV,
  getActiveCV,
  getAllCVs,
  setActiveCV,
  deleteCV, // Added this
};

export default portfolioService;
