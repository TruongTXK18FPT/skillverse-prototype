import axiosInstance from './axiosInstance';
import {
  MentorRegistrationRequest,
  MentorRegistrationResponse,
  MentorProfileResponse,
  ApplicationStatusResponse
} from '../data/userDTOs';

// Helper type for axios error handling
type AxiosError = { response?: { data?: { message?: string } } };

class MentorService {
  
  // Register a new mentor
  async register(mentorData: MentorRegistrationRequest, files?: { cv?: File; certifications?: File[] }): Promise<MentorRegistrationResponse> {
    try {
      console.log('Attempting mentor registration for:', mentorData.email);
      
      // Create FormData for multipart request
      const formData = new FormData();
      
      // Add each form field individually (not as nested JSON)
      formData.append('email', mentorData.email);
      formData.append('password', mentorData.password);
      formData.append('confirmPassword', mentorData.confirmPassword);
      formData.append('fullName', mentorData.fullName);
      
      // Optional fields (if they exist in the interface)
      if (mentorData.linkedinProfile) formData.append('linkedinProfile', mentorData.linkedinProfile);
      
      // Mentor-specific fields (match backend parameter names)
      formData.append('mainExpertiseArea', mentorData.mainExpertise || '');
      formData.append('yearsOfExperience', mentorData.yearsOfExperience?.toString() || '0');
      formData.append('personalProfile', mentorData.personalBio || '');
      
      // Add files if provided
      if (files?.cv) {
        formData.append('cvPortfolioFile', files.cv);
      }
      
      if (files?.certifications && files.certifications.length > 0) {
        // For multiple certificates, we'll send the first one for now
        // TODO: Handle multiple certificate files properly
        formData.append('certificatesFile', files.certifications[0]);
      }
      
      const response = await axiosInstance.post<MentorRegistrationResponse>(
        '/api/mentors/register', 
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      console.log('Mentor registration successful:', response.data);
      
      // Ensure the response has the required fields
      if (!('requiresVerification' in response.data)) {
        console.warn('Response missing requiresVerification field, defaulting to true');
        return {
          ...(response.data as MentorRegistrationResponse),
          requiresVerification: true
        };
      }
      
      return response.data;
      
    } catch (error: unknown) {
      console.error('Mentor registration error:', error);
      const errorMessage = (error as AxiosError).response?.data?.message || 'Đăng ký mentor thất bại. Vui lòng thử lại.';
      throw new Error(errorMessage);
    }
  }

  // Get mentor profile
  async getMentorProfile(mentorId: number): Promise<MentorProfileResponse> {
    try {
      const response = await axiosInstance.get<MentorProfileResponse>(`/api/mentors/${mentorId}/profile`);
      return response.data;
    } catch (error: unknown) {
      console.error('Get mentor profile error:', error);
      const errorMessage = (error as AxiosError).response?.data?.message || 'Không thể tải thông tin mentor.';
      throw new Error(errorMessage);
    }
  }

  // Update mentor profile
  async updateMentorProfile(mentorId: number, profileData: Partial<MentorProfileResponse>): Promise<MentorProfileResponse> {
    try {
      const response = await axiosInstance.put<MentorProfileResponse>(`/api/mentors/${mentorId}/profile`, profileData);
      return response.data;
    } catch (error: unknown) {
      console.error('Update mentor profile error:', error);
      const errorMessage = (error as AxiosError).response?.data?.message || 'Cập nhật thông tin mentor thất bại.';
      throw new Error(errorMessage);
    }
  }

  // Get mentor application status
  async getMentorApplicationStatus(mentorId: number): Promise<ApplicationStatusResponse> {
    try {
      const response = await axiosInstance.get<ApplicationStatusResponse>(`/api/mentors/${mentorId}/status`);
      return response.data;
    } catch (error: unknown) {
      console.error('Get mentor application status error:', error);
      const errorMessage = (error as AxiosError).response?.data?.message || 'Không thể tải trạng thái đơn đăng ký mentor.';
      throw new Error(errorMessage);
    }
  }
}

export default new MentorService();