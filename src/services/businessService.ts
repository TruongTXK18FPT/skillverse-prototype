import axiosInstance from './axiosInstance';
import {
  BusinessRegistrationRequest,
  BusinessRegistrationResponse,
  BusinessProfileResponse,
  ApplicationStatusResponse
} from '../data/userDTOs';

// Helper type for axios error handling
type AxiosError = { response?: { data?: { message?: string } } };

class BusinessService {
  
  // Register a new business
  async register(businessData: BusinessRegistrationRequest, files?: { documents?: File[] }): Promise<BusinessRegistrationResponse> {
    try {
      console.log('Attempting business registration for:', businessData.businessEmail);
      
      // Create FormData for multipart request
      const formData = new FormData();
      
      // Add each form field individually (not as nested JSON)
      formData.append('email', businessData.businessEmail);
      formData.append('password', businessData.password);
      formData.append('confirmPassword', businessData.confirmPassword);
      formData.append('fullName', businessData.contactPersonName); // Contact person name (NOT company name!)
      formData.append('companyName', businessData.companyName);
      formData.append('companyWebsite', businessData.companyWebsite);
      formData.append('companyAddress', businessData.businessAddress);
      formData.append('taxCodeOrBusinessRegistrationNumber', businessData.taxId);
      
      // Contact Person Information
      if (businessData.contactPersonPhone) {
        formData.append('phone', businessData.contactPersonPhone);
      }
      formData.append('contactPersonPosition', businessData.contactPersonPosition);
      
      // Company Extended Information
      formData.append('companySize', businessData.companySize);
      formData.append('industry', businessData.industry);
      
      // Add files if provided
      if (files?.documents && files.documents.length > 0) {
        // Send the first document for now
        // TODO: Handle multiple document files properly
        formData.append('companyDocumentsFile', files.documents[0]);
      }
      
      const response = await axiosInstance.post<BusinessRegistrationResponse>(
        '/api/business/register', 
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      console.log('Business registration successful:', response.data);
      
      // Ensure the response has the required fields
      if (!('requiresVerification' in response.data)) {
        console.warn('Response missing requiresVerification field, defaulting to true');
        return {
          ...(response.data as BusinessRegistrationResponse),
          requiresVerification: true
        };
      }
      
      return response.data;
      
    } catch (error: unknown) {
      console.error('Business registration error:', error);
      const errorMessage = (error as AxiosError).response?.data?.message || 'Đăng ký doanh nghiệp thất bại. Vui lòng thử lại.';
      throw new Error(errorMessage);
    }
  }

  // Get business profile
  async getBusinessProfile(businessId: number): Promise<BusinessProfileResponse> {
    try {
      const response = await axiosInstance.get<BusinessProfileResponse>(`/api/business/${businessId}/profile`);
      return response.data;
    } catch (error: unknown) {
      console.error('Get business profile error:', error);
      const errorMessage = (error as AxiosError).response?.data?.message || 'Không thể tải thông tin doanh nghiệp.';
      throw new Error(errorMessage);
    }
  }

  // Update business profile
  async updateBusinessProfile(businessId: number, profileData: Partial<BusinessProfileResponse>): Promise<BusinessProfileResponse> {
    try {
      const response = await axiosInstance.put<BusinessProfileResponse>(`/api/business/${businessId}/profile`, profileData);
      return response.data;
    } catch (error: unknown) {
      console.error('Update business profile error:', error);
      const errorMessage = (error as AxiosError).response?.data?.message || 'Cập nhật thông tin doanh nghiệp thất bại.';
      throw new Error(errorMessage);
    }
  }

  // Get business application status
  async getBusinessApplicationStatus(businessId: number): Promise<ApplicationStatusResponse> {
    try {
      const response = await axiosInstance.get<ApplicationStatusResponse>(`/api/business/${businessId}/status`);
      return response.data;
    } catch (error: unknown) {
      console.error('Get business application status error:', error);
      const errorMessage = (error as AxiosError).response?.data?.message || 'Không thể tải trạng thái đơn đăng ký doanh nghiệp.';
      throw new Error(errorMessage);
    }
  }
}

export default new BusinessService();