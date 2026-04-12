import axiosInstance from './axiosInstance';
import {
  BusinessRegistrationRequest,
  BusinessRegistrationResponse,
  BusinessProfileResponse,
  ApplicationStatusResponse,
} from '../data/userDTOs';

type AxiosError = { response?: { data?: { message?: string } } };

class BusinessService {
  async register(
    businessData: BusinessRegistrationRequest,
    files?: { documents?: File[] },
  ): Promise<BusinessRegistrationResponse> {
    try {
      const formData = new FormData();

      formData.append('email', businessData.businessEmail);
      formData.append('password', businessData.password);
      formData.append('confirmPassword', businessData.confirmPassword);
      formData.append('fullName', businessData.contactPersonName);
      formData.append('companyName', businessData.companyName);
      formData.append('companyWebsite', businessData.companyWebsite);
      formData.append('companyAddress', businessData.businessAddress);
      formData.append(
        'taxCodeOrBusinessRegistrationNumber',
        businessData.taxId,
      );

      if (businessData.phone) {
        formData.append('phone', businessData.phone);
      }

      if (businessData.contactPersonPhone) {
        formData.append('contactPersonPhone', businessData.contactPersonPhone);
      }
      formData.append(
        'contactPersonPosition',
        businessData.contactPersonPosition,
      );
      formData.append('companySize', businessData.companySize);
      formData.append('industry', businessData.industry);

      if (files?.documents && files.documents.length > 0) {
        formData.append('companyDocumentsFile', files.documents[0]);
        files.documents.forEach((file) => {
          formData.append('companyDocumentsFiles', file);
        });
      }

      const response = await axiosInstance.post<BusinessRegistrationResponse>(
        '/api/business/register',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );

      if (!('requiresVerification' in response.data)) {
        return {
          ...(response.data as BusinessRegistrationResponse),
          requiresVerification: true,
        };
      }

      return response.data;
    } catch (error: unknown) {
      console.error('Business registration error:', error);
      const errorMessage =
        (error as AxiosError).response?.data?.message ||
        'Dang ky doanh nghiep that bai. Vui long thu lai.';
      throw new Error(errorMessage);
    }
  }

  async getBusinessProfile(
    businessId: number,
  ): Promise<BusinessProfileResponse> {
    try {
      const response = await axiosInstance.get<BusinessProfileResponse>(
        `/api/business/${businessId}/profile`,
      );
      return response.data;
    } catch (error: unknown) {
      console.error('Get business profile error:', error);
      const errorMessage =
        (error as AxiosError).response?.data?.message ||
        'Khong the tai thong tin doanh nghiep.';
      throw new Error(errorMessage);
    }
  }

  async getMyBusinessProfile(): Promise<BusinessProfileResponse> {
    try {
      const response = await axiosInstance.get<BusinessProfileResponse>(
        '/api/business/profile',
      );
      return response.data;
    } catch (error: unknown) {
      console.error('Get my business profile error:', error);
      const errorMessage =
        (error as AxiosError).response?.data?.message ||
        'Khong the tai ho so doanh nghiep.';
      throw new Error(errorMessage);
    }
  }

  async updateMyBusinessProfile(
    profileData: Partial<BusinessProfileResponse>,
  ): Promise<BusinessProfileResponse> {
    try {
      const response = await axiosInstance.put<BusinessProfileResponse>(
        '/api/business/profile',
        profileData,
      );
      return response.data;
    } catch (error: unknown) {
      console.error('Update business profile error:', error);
      const errorMessage =
        (error as AxiosError).response?.data?.message ||
        'Cap nhat thong tin doanh nghiep that bai.';
      throw new Error(errorMessage);
    }
  }

  async uploadCompanyLogo(file: File): Promise<{ companyLogoUrl: string }> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axiosInstance.post<{ companyLogoUrl: string }>(
        '/api/business/profile/logo',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );

      return response.data;
    } catch (error: unknown) {
      console.error('Upload company logo error:', error);
      const errorMessage =
        (error as AxiosError).response?.data?.message ||
        'Cap nhat logo doanh nghiep that bai.';
      throw new Error(errorMessage);
    }
  }

  async getBusinessApplicationStatus(
    businessId: number,
  ): Promise<ApplicationStatusResponse> {
    try {
      const response = await axiosInstance.get<ApplicationStatusResponse>(
        `/api/business/${businessId}/status`,
      );
      return response.data;
    } catch (error: unknown) {
      console.error('Get business application status error:', error);
      const errorMessage =
        (error as AxiosError).response?.data?.message ||
        'Khong the tai trang thai don dang ky doanh nghiep.';
      throw new Error(errorMessage);
    }
  }
}

export default new BusinessService();
