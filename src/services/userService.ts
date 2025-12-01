import axiosInstance from './axiosInstance';
import {
  UserRegistrationRequest,
  UserRegistrationResponse,
  UserProfileResponse,
  UserSkillResponse
} from '../data/userDTOs';

// Helper type for axios error handling
type AxiosError = { response?: { data?: { message?: string } } };

class UserService {
  
  // Register a new user
  async register(userData: UserRegistrationRequest): Promise<UserRegistrationResponse> {
    try {
      console.log('Attempting user registration for:', userData.email);
      
      const response = await axiosInstance.post<UserRegistrationResponse>('/api/users/register', userData);
      
      console.log('User registration successful:', response.data);
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      // Ensure the response has the required fields
      if (!('requiresVerification' in response.data)) {
        console.warn('Response missing requiresVerification field, defaulting to true');
        return {
          ...(response.data as UserRegistrationResponse),
          requiresVerification: true
        };
      }
      
      return response.data;
      
    } catch (error: unknown) {
      console.error('User registration error:', error);
      const errorMessage = (error as AxiosError).response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.';
      throw new Error(errorMessage);
    }
  }

  // Get user profile by userId
  async getUserProfile(userId: number): Promise<UserProfileResponse> {
    try {
      const response = await axiosInstance.get<UserProfileResponse>(`/api/user/profile/public/${userId}`);
      return response.data;
    } catch (error: unknown) {
      console.error('Get user profile error:', error);
      const errorMessage = (error as AxiosError).response?.data?.message || 'Không thể tải thông tin người dùng.';
      throw new Error(errorMessage);
    }
  }

  // Get current logged-in user's profile
  async getMyProfile(): Promise<UserProfileResponse> {
    try {
      // Check user role to determine correct endpoint
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      let endpoint = '/api/user/profile'; // Default for USER
      
      if (user?.roles) {
        if (user.roles.includes('MENTOR')) {
          endpoint = '/api/mentors/profile';
        } else if (user.roles.includes('RECRUITER')) {
          endpoint = '/api/business/profile';
        } else if (user.roles.includes('ADMIN')) {
          // ADMIN không có profile, throw error hoặc return mock data
          throw new Error('Admin không có profile. Vui lòng sử dụng trang quản trị.');
        }
      }
      
      const response = await axiosInstance.get<UserProfileResponse>(endpoint);
      return response.data;
    } catch (error: unknown) {
      console.error('Get my profile error:', error);
      const errorMessage = (error as AxiosError).response?.data?.message || 'Không thể tải thông tin người dùng.';
      throw new Error(errorMessage);
    }
  }

  // Update user profile (uses current logged-in user)
  async updateUserProfile(userId: number, profileData: Partial<UserProfileResponse>): Promise<UserProfileResponse> {
    try {
      // Check user role to determine correct endpoint
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      let endpoint = '/api/user/profile'; // Default for USER
      
      if (user?.roles) {
        if (user.roles.includes('MENTOR')) {
          endpoint = '/api/mentors/profile';
        } else if (user.roles.includes('RECRUITER')) {
          endpoint = '/api/business/profile';
        } else if (user.roles.includes('ADMIN')) {
          throw new Error('Admin không có profile để cập nhật.');
        }
      }
      
      const response = await axiosInstance.put<UserProfileResponse>(endpoint, profileData);
      return response.data;
    } catch (error: unknown) {
      console.error('Update user profile error:', error);
      const errorMessage = (error as AxiosError).response?.data?.message || 'Cập nhật thông tin thất bại.';
      throw new Error(errorMessage);
    }
  }

  // Upload user avatar
  async uploadUserAvatar(file: File): Promise<{ avatarUrl: string }> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axiosInstance.post<{ avatarUrl: string}>(
        '/api/user/avatar',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    } catch (error: unknown) {
      console.error('Upload avatar error:', error);
      const errorMessage = (error as AxiosError).response?.data?.message || 'Upload avatar thất bại.';
      throw new Error(errorMessage);
    }
  }

  // Get user skills
  async getUserSkills(userId: number): Promise<UserSkillResponse[]> {
    try {
      const response = await axiosInstance.get<UserSkillResponse[]>(`/api/user/profile/${userId}/skills`);
      return response.data;
    } catch (error: unknown) {
      console.error('Get user skills error:', error);
      const errorMessage = (error as AxiosError).response?.data?.message || 'Không thể tải danh sách kỹ năng.';
      throw new Error(errorMessage);
    }
  }

  // Get current user's skills
  async getMySkills(): Promise<UserSkillResponse[]> {
    try {
      const response = await axiosInstance.get<UserSkillResponse[]>('/api/user/profile/skills');
      return response.data;
    } catch (error: unknown) {
      console.error('Get my skills error:', error);
      const errorMessage = (error as AxiosError).response?.data?.message || 'Không thể tải danh sách kỹ năng.';
      throw new Error(errorMessage);
    }
  }

  // Add user skill
  async addUserSkill(userId: number, skillData: Omit<UserSkillResponse, 'id'>): Promise<UserSkillResponse> {
    try {
      const response = await axiosInstance.post<UserSkillResponse>('/api/user/profile/skills', skillData);
      return response.data;
    } catch (error: unknown) {
      console.error('Add user skill error:', error);
      const errorMessage = (error as AxiosError).response?.data?.message || 'Thêm kỹ năng thất bại.';
      throw new Error(errorMessage);
    }
  }

  // Update user skill
  async updateUserSkill(userId: number, skillId: number, skillData: Partial<UserSkillResponse>): Promise<UserSkillResponse> {
    try {
      const response = await axiosInstance.put<UserSkillResponse>(`/api/user/profile/skills/${skillId}`, skillData);
      return response.data;
    } catch (error: unknown) {
      console.error('Update user skill error:', error);
      const errorMessage = (error as AxiosError).response?.data?.message || 'Cập nhật kỹ năng thất bại.';
      throw new Error(errorMessage);
    }
  }

  // Delete user skill
  async deleteUserSkill(skillId: number): Promise<void> {
    try {
      await axiosInstance.delete(`/api/user/profile/skills/${skillId}`);
    } catch (error: unknown) {
      console.error('Delete user skill error:', error);
      const errorMessage = (error as AxiosError).response?.data?.message || 'Xóa kỹ năng thất bại.';
      throw new Error(errorMessage);
    }
  }
}

export default new UserService();