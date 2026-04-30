import axiosInstance from './axiosInstance';

export const uploadMentorCccd = async (
  cccdFrontFile: File,
  cccdBackFile: File
): Promise<{ success: boolean; message: string }> => {
  const formData = new FormData();
  formData.append('cccdFrontFile', cccdFrontFile);
  formData.append('cccdBackFile', cccdBackFile);

  try {
    const response = await axiosInstance.post(
      `/api/identity/upload-cccd`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );

    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data) {
      throw new Error(error.response.data.message || 'Lỗi khi tải lên CCCD');
    }
    throw new Error('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
  }
};

/**
 * [Admin] Approve a mentor's supplemental CCCD identity verification.
 * Sets identityVerified=true and sends email notification to the mentor.
 */
export const adminApproveCccd = async (
  userId: number
): Promise<{ success: boolean; message: string; userId: number }> => {
  try {
    const response = await axiosInstance.post(`/api/identity/admin/approve-cccd/${userId}`);
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data) {
      throw new Error(error.response.data.message || 'Lỗi khi duyệt CCCD');
    }
    throw new Error('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
  }
};

export interface PendingCccdMentor {
  userId: number;
  fullName: string;
  email: string;
  cccdNumber?: string;
  cccdFullName?: string;
  cccdDob?: string;
  cccdExtractedData?: string;
  identityVerified?: boolean;
  applicationStatus?: string;
  updatedAt?: string;
}

/**
 * [Admin] Get list of mentors who have submitted CCCD but not yet identity-verified.
 */
export const getPendingCccdVerifications = async (): Promise<PendingCccdMentor[]> => {
  try {
    const response = await axiosInstance.get('/api/identity/admin/pending-cccd');
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data) {
      throw new Error(error.response.data.message || 'Lỗi khi tải danh sách CCCD chờ duyệt');
    }
    throw new Error('Không thể kết nối đến máy chủ.');
  }
};


/**
 * Allows a mentor to cancel their pending CCCD verification request.
 */
export const cancelCccdRequest = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await axiosInstance.post('/api/identity/cancel-cccd');
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data) {
      throw new Error(error.response.data.message || 'Lỗi khi hủy yêu cầu CCCD');
    }
    throw new Error('Không thể kết nối đến máy chủ.');
  }
};
