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
  createdAt: string;
  updatedAt: string;
}

export interface MentorProfileUpdateDTO {
  firstName?: string;
  lastName?: string;
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
}

/**
 * Get mentor profile by ID
 * GET /api/mentors/{mentorId}/profile
 */
export const getMentorProfile = async (mentorId: number): Promise<MentorProfile> => {
  try {
    const response = await axiosInstance.get<MentorProfile>(`/mentors/${mentorId}/profile`);
    return response.data;
  } catch (error) {
    console.error('Error fetching mentor profile:', error);
    throw error;
  }
};

/**
 * Update mentor profile
 * PUT /api/mentors/{mentorId}/profile
 */
export const updateMentorProfile = async (
  mentorId: number,
  profileData: MentorProfileUpdateDTO
): Promise<MentorProfile> => {
  try {
    const response = await axiosInstance.put<MentorProfile>(
      `/mentors/${mentorId}/profile`,
      profileData
    );
    return response.data;
  } catch (error) {
    console.error('Error updating mentor profile:', error);
    throw error;
  }
};

/**
 * Upload mentor avatar
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
      `/mentors/${mentorId}/avatar`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error uploading mentor avatar:', error);
    throw error;
  }
};

