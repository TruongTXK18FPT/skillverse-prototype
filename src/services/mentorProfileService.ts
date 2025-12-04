import { axiosInstance } from './axiosInstance';

export interface MentorProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  bio?: string;
  specialization?: string;
  experience?: number;
  avatar?: string;
  socialLinks?: {
    linkedin?: string;
    github?: string;
    website?: string;
  };
  skills?: string[];
  achievements?: string[];
  ratingAverage?: number;
  ratingCount?: number;
  hourlyRate?: number;
  createdAt: string;
  updatedAt: string;
  preChatEnabled?: boolean;
  slug?: string;
}

export interface MentorProfileUpdateDTO {
  firstName?: string;
  lastName?: string;
  bio?: string;
  specialization?: string;
  experience?: number;
  hourlyRate?: number;
  avatar?: string;
  socialLinks?: {
    linkedin?: string;
    github?: string;
    website?: string;
  };
  skills?: string[];
  achievements?: string[];
}

export interface SkillTabBadgeInfo {
  code: string;
  name: string;
  description: string;
  progressCurrent: number;
  progressTarget: number;
  earned: boolean;
}

export interface SkillTabResponseDTO {
  skillPoints: number;
  currentLevel: number;
  levelTitle?: string;
  nextLevelPoints: number;
  sessionsCompleted: number;
  fiveStarCount: number;
  courseSales: number;
  revenueVnd: number;
  badges: SkillTabBadgeInfo[];
}

/**
 * Get all approved mentors
 * GET /api/mentors
 */
export const getAllMentors = async (): Promise<MentorProfile[]> => {
  try {
    const response = await axiosInstance.get<MentorProfile[]>('/api/mentors');
    return response.data;
  } catch (error) {
    console.error('Error fetching all mentors:', error);
    throw error;
  }
};

/**
 * Get current logged-in mentor profile
 * GET /api/mentors/profile
 */
export const getMyMentorProfile = async (): Promise<MentorProfile> => {
  try {
    const response = await axiosInstance.get<MentorProfile>('/api/mentors/profile');
    return response.data;
  } catch (error) {
    console.error('Error fetching my mentor profile:', error);
    throw error;
  }
};

/**
 * Get mentor profile by ID
 * GET /api/mentors/{mentorId}/profile
 */
export const getMentorProfile = async (mentorId: number): Promise<MentorProfile> => {
  try {
    const response = await axiosInstance.get<MentorProfile>(`/api/mentors/${mentorId}/profile`);
    return response.data;
  } catch (error) {
    console.error('Error fetching mentor profile:', error);
    throw error;
  }
};

export const getMySkillTab = async (): Promise<SkillTabResponseDTO> => {
  try {
    const response = await axiosInstance.get<SkillTabResponseDTO>('/api/mentors/skilltab');
    return response.data;
  } catch (error) {
    console.error('Error fetching my mentor skilltab:', error);
    throw error;
  }
};

export const getMentorSkillTab = async (mentorId: number): Promise<SkillTabResponseDTO> => {
  try {
    const response = await axiosInstance.get<SkillTabResponseDTO>(`/api/mentors/${mentorId}/skilltab`);
    return response.data;
  } catch (error) {
    console.error('Error fetching mentor skilltab:', error);
    throw error;
  }
};

/**
 * Update current logged-in mentor profile
 * PUT /api/mentors/profile
 */
export const updateMyMentorProfile = async (
  profileData: MentorProfileUpdateDTO
): Promise<MentorProfile> => {
  try {
    const response = await axiosInstance.put<MentorProfile>(
      '/api/mentors/profile',
      profileData
    );
    return response.data;
  } catch (error) {
    console.error('Error updating my mentor profile:', error);
    throw error;
  }
};

/**
 * Update mentor profile by ID (Admin)
 * PUT /api/mentors/{mentorId}/profile
 */
export const updateMentorProfile = async (
  mentorId: number,
  profileData: MentorProfileUpdateDTO
): Promise<MentorProfile> => {
  try {
    const response = await axiosInstance.put<MentorProfile>(
      `/api/mentors/${mentorId}/profile`,
      profileData
    );
    return response.data;
  } catch (error) {
    console.error('Error updating mentor profile:', error);
    throw error;
  }
};

/**
 * Upload current logged-in mentor avatar
 * POST /api/mentors/avatar
 */
export const uploadMyMentorAvatar = async (
  file: File
): Promise<{ avatarUrl: string }> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await axiosInstance.post<{ avatarUrl: string }>(
      '/api/mentors/avatar',
      formData
    );
    return response.data;
  } catch (error) {
    console.error('Error uploading my mentor avatar:', error);
    throw error;
  }
};

/**
 * Upload mentor avatar by ID (Admin)
 * POST /api/mentors/{mentorId}/avatar
 */
export const uploadMentorAvatar = async (
  mentorId: number,
  file: File
): Promise<{ avatarUrl: string }> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await axiosInstance.post<{ avatarUrl: string }>(
      `/api/mentors/${mentorId}/avatar`,
      formData
    );
    return response.data;
  } catch (error) {
    console.error('Error uploading mentor avatar:', error);
    throw error;
  }
};

/**
 * Set pre-chat enabled status for current mentor
 * PUT /api/mentors/prechat-enabled
 */
export const setPreChatEnabled = async (enabled: boolean): Promise<void> => {
  try {
    await axiosInstance.put(`/api/mentors/prechat-enabled?enabled=${enabled}`);
  } catch (error) {
    console.error('Error setting pre-chat enabled:', error);
    throw error;
  }
};

/**
 * Toggle favorite status for a mentor
 * POST /api/favorites/toggle/{mentorId}
 */
export const toggleFavoriteMentor = async (mentorId: number): Promise<boolean> => {
  try {
    const response = await axiosInstance.post<{ isFavorite: boolean }>(`/api/favorites/toggle/${mentorId}`);
    return response.data.isFavorite;
  } catch (error) {
    console.error('Error toggling favorite mentor:', error);
    throw error;
  }
};

/**
 * Get my favorite mentors
 * GET /api/favorites/me
 */
export const getMyFavoriteMentors = async (): Promise<MentorProfile[]> => {
  try {
    const response = await axiosInstance.get<MentorProfile[]>('/api/favorites/me');
    return response.data;
  } catch (error) {
    console.error('Error fetching favorite mentors:', error);
    throw error;
  }
};
