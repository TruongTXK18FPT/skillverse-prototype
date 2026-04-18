import axios from "axios";
import axiosInstance from "./axiosInstance";
import {
  StudentVerificationDetailResponse,
  StudentVerificationEligibilityResponse,
  StudentVerificationStartResponse,
} from "../types/studentVerification";

const resolveErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError(error)) {
    return (
      (error.response?.data as { message?: string } | undefined)?.message ||
      error.message ||
      fallback
    );
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};

// [Nghiep vu] Gom nhom API xac thuc sinh vien de frontend tai su dung mot luong du lieu thong nhat.
const studentVerifyService = {
  // [Nghiep vu] Bat dau yeu cau xac thuc sinh vien bang email truong + anh the.
  async startVerification(
    schoolEmail: string,
    studentCardImage: File,
  ): Promise<StudentVerificationStartResponse> {
    const formData = new FormData();
    formData.append("schoolEmail", schoolEmail);
    formData.append("studentCardImage", studentCardImage);

    try {
      const { data } =
        await axiosInstance.post<StudentVerificationStartResponse>(
          "/api/student-verifications/requests",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          },
        );
      return data;
    } catch (error) {
      throw new Error(
        resolveErrorMessage(
          error,
          "Không thể khởi tạo yêu cầu xác thực sinh viên.",
        ),
      );
    }
  },

  // [Nghiep vu] Gui lai OTP cho request dang cho xac minh email truong.
  async resendOtp(
    requestId: number,
  ): Promise<StudentVerificationStartResponse> {
    try {
      const { data } =
        await axiosInstance.post<StudentVerificationStartResponse>(
          `/api/student-verifications/requests/${requestId}/resend-otp`,
        );
      return data;
    } catch (error) {
      throw new Error(
        resolveErrorMessage(error, "Không thể gửi lại OTP lúc này."),
      );
    }
  },

  // [Nghiep vu] Xac minh OTP va dua request sang hang doi admin review.
  async verifyOtpAndSubmit(
    requestId: number,
    otp: string,
  ): Promise<StudentVerificationDetailResponse> {
    try {
      const { data } =
        await axiosInstance.post<StudentVerificationDetailResponse>(
          `/api/student-verifications/requests/${requestId}/verify-otp`,
          { otp },
        );
      return data;
    } catch (error) {
      throw new Error(
        resolveErrorMessage(error, "Không thể xác minh OTP. Vui lòng thử lại."),
      );
    }
  },

  // [Nghiep vu] Lay request moi nhat cua user, neu chua co thi tra ve null.
  async getLatestRequest(): Promise<StudentVerificationDetailResponse | null> {
    try {
      const { data } =
        await axiosInstance.get<StudentVerificationDetailResponse>(
          "/api/student-verifications/requests/latest",
        );
      return data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }

      throw new Error(
        resolveErrorMessage(
          error,
          "Không thể tải thông tin xác thực sinh viên.",
        ),
      );
    }
  },

  // [Nghiep vu] Lay chi tiet mot request cu the cua user.
  async getMyRequestDetail(
    requestId: number,
  ): Promise<StudentVerificationDetailResponse> {
    try {
      const { data } =
        await axiosInstance.get<StudentVerificationDetailResponse>(
          `/api/student-verifications/requests/${requestId}`,
        );
      return data;
    } catch (error) {
      throw new Error(
        resolveErrorMessage(error, "Không thể tải chi tiết yêu cầu xác thực."),
      );
    }
  },

  // [Nghiep vu] Kiem tra user da du dieu kien mua goi STUDENT_PACK hay chua.
  async getEligibility(): Promise<StudentVerificationEligibilityResponse> {
    try {
      const { data } =
        await axiosInstance.get<StudentVerificationEligibilityResponse>(
          "/api/student-verifications/eligibility",
        );
      return data;
    } catch (error) {
      throw new Error(
        resolveErrorMessage(
          error,
          "Không thể kiểm tra điều kiện xác thực sinh viên.",
        ),
      );
    }
  },
};

export default studentVerifyService;
