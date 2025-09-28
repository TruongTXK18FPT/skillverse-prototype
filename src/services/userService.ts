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
      if (!response.data.hasOwnProperty('requiresVerification')) {
        console.warn('Response missing requiresVerification field, defaulting to true');
        return {
          ...response.data,
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

  // Get user profile
  async getUserProfile(userId: number): Promise<UserProfileResponse> {
    try {
      const response = await axiosInstance.get<UserProfileResponse>(`/api/users/${userId}/profile`);
      return response.data;
    } catch (error: unknown) {
      console.error('Get user profile error:', error);
      const errorMessage = (error as AxiosError).response?.data?.message || 'Không thể tải thông tin người dùng.';
      throw new Error(errorMessage);
    }
  }

  // Update user profile
  async updateUserProfile(userId: number, profileData: Partial<UserProfileResponse>): Promise<UserProfileResponse> {
    try {
      const response = await axiosInstance.put<UserProfileResponse>(`/api/users/${userId}/profile`, profileData);
      return response.data;
    } catch (error: unknown) {
      console.error('Update user profile error:', error);
      const errorMessage = (error as AxiosError).response?.data?.message || 'Cập nhật thông tin thất bại.';
      throw new Error(errorMessage);
    }
  }

  // Get user skills
  async getUserSkills(userId: number): Promise<UserSkillResponse[]> {
    try {
      const response = await axiosInstance.get<UserSkillResponse[]>(`/api/users/${userId}/skills`);
      return response.data;
    } catch (error: unknown) {
      console.error('Get user skills error:', error);
      const errorMessage = (error as AxiosError).response?.data?.message || 'Không thể tải danh sách kỹ năng.';
      throw new Error(errorMessage);
    }
  }

  // Add user skill
  async addUserSkill(userId: number, skillData: Omit<UserSkillResponse, 'id'>): Promise<UserSkillResponse> {
    try {
      const response = await axiosInstance.post<UserSkillResponse>(`/api/users/${userId}/skills`, skillData);
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
      const response = await axiosInstance.put<UserSkillResponse>(`/api/users/${userId}/skills/${skillId}`, skillData);
      return response.data;
    } catch (error: unknown) {
      console.error('Update user skill error:', error);
      const errorMessage = (error as AxiosError).response?.data?.message || 'Cập nhật kỹ năng thất bại.';
      throw new Error(errorMessage);
    }
  }

  // Delete user skill
  async deleteUserSkill(userId: number, skillId: number): Promise<void> {
    try {
      await axiosInstance.delete(`/api/users/${userId}/skills/${skillId}`);
    } catch (error: unknown) {
      console.error('Delete user skill error:', error);
      const errorMessage = (error as AxiosError).response?.data?.message || 'Xóa kỹ năng thất bại.';
      throw new Error(errorMessage);
    }
  }
}

export default new UserService();