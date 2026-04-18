import axios from "axios";
import axiosInstance from "./axiosInstance";
import { uploadMedia } from "./mediaService";
import {
  UserRegistrationRequest,
  UserRegistrationResponse,
  UserProfileResponse,
  UserSkillResponse,
} from "../data/userDTOs";
import { getStoredUserRaw } from "../utils/authStorage";

type ApiErrorPayload = {
  code?: string;
  message?: string;
  details?: unknown;
} | string;

type StoredUserSnapshot = {
  id?: number;
  email?: string;
  fullName?: string;
  username?: string;
  roles?: string[];
  avatarUrl?: string;
};

type UserProfileView = UserProfileResponse & {
  username?: string;
  roles?: string[];
  avatarUrl?: string;
};

function extractApiErrorMessage(error: unknown, fallbackMessage: string): string {
  if (axios.isAxiosError<ApiErrorPayload>(error)) {
    const responseData = error.response?.data;

    if (typeof responseData === "string" && responseData.trim()) {
      return responseData;
    }

    if (responseData && typeof responseData === "object") {
      if (typeof responseData.message === "string" && responseData.message.trim()) {
        return responseData.message;
      }

      if (typeof responseData.details === "string" && responseData.details.trim()) {
        return responseData.details;
      }

      if (Array.isArray(responseData.details)) {
        const messages = responseData.details.filter(
          (item): item is string => typeof item === "string" && item.trim().length > 0,
        );

        if (messages.length > 0) {
          return messages.join("; ");
        }
      }

      if (responseData.details && typeof responseData.details === "object") {
        const detailsValues = Object.values(responseData.details as Record<string, unknown>);
        const firstMessage = detailsValues.find(
          (value) => typeof value === "string" && value.trim().length > 0,
        );

        if (typeof firstMessage === "string") {
          return firstMessage;
        }
      }
    }

    if (error.message && error.message.trim()) {
      return error.message;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallbackMessage;
}

class UserService {
  // Register a new user
  async register(
    userData: UserRegistrationRequest,
  ): Promise<UserRegistrationResponse> {
    try {
      const response = await axiosInstance.post<UserRegistrationResponse>(
        "/api/users/register",
        userData,
      );

      // Ensure the response has the required fields
      if (!("requiresVerification" in response.data)) {
        console.warn(
          "Response missing requiresVerification field, defaulting to true",
        );
        return {
          ...(response.data as UserRegistrationResponse),
          requiresVerification: true,
        };
      }

      return response.data;
    } catch (error: unknown) {
      console.error("User registration error:", error);
      const errorMessage = extractApiErrorMessage(
        error,
        "Đăng ký thất bại. Vui lòng thử lại.",
      );
      throw new Error(errorMessage);
    }
  }

  // Get user profile by userId
  async getUserProfile(userId: number): Promise<UserProfileResponse> {
    try {
      const response = await axiosInstance.get<UserProfileResponse>(
        `/api/user/profile/public/${userId}`,
      );
      return response.data;
    } catch (error: unknown) {
      console.error("Get user profile error:", error);
      const errorMessage = extractApiErrorMessage(
        error,
        "Không thể tải thông tin người dùng.",
      );
      throw new Error(errorMessage);
    }
  }

  // Get current logged-in user's profile
  async getMyProfile(): Promise<UserProfileView> {
    try {
      // Check user role to determine correct endpoint
      const userStr = getStoredUserRaw();
      const user = userStr ? (JSON.parse(userStr) as StoredUserSnapshot) : null;
      const currentUser: StoredUserSnapshot = user ?? {};
      const storedRoles = user?.roles ?? [];

      let endpoint = "/api/user/profile"; // Default for USER

      if (storedRoles.length > 0) {
        if (storedRoles.includes("MENTOR")) {
          endpoint = "/api/mentors/profile";
        } else if (storedRoles.includes("RECRUITER")) {
          endpoint = "/api/business/profile";
        } else if (storedRoles.includes("ADMIN")) {
          // ADMIN doesn't have a profile endpoint, return basic data from localStorage
          return {
            id: currentUser.id ?? 0,
            username: currentUser.username,
            email: currentUser.email ?? "",
            fullName: currentUser.fullName || "Admin",
            avatarMediaId: undefined,
            avatarMediaUrl: currentUser.avatarUrl,
            avatarPosition: undefined,
            phone: undefined,
            bio: undefined,
            address: undefined,
            region: undefined,
            socialLinks: undefined,
            birthday: undefined,
            gender: undefined,
            province: undefined,
            district: undefined,
            isActive: true,
            emailVerified: true,
            createdAt: "",
            updatedAt: "",
            roles: storedRoles,
            avatarUrl: currentUser.avatarUrl,
          } as UserProfileView;
        }
      }

      const response = await axiosInstance.get<UserProfileView>(endpoint);

      // For RECRUITER and MENTOR, API may not return roles field
      // Merge roles from localStorage if missing
      if (storedRoles.length > 0 && !response.data.roles) {
        response.data.roles = storedRoles;
      }

      return response.data;
    } catch (error: unknown) {
      console.error("Get my profile error:", error);
      const errorMessage = extractApiErrorMessage(
        error,
        "Không thể tải thông tin người dùng.",
      );
      throw new Error(errorMessage);
    }
  }

  // Update user profile (uses current logged-in user)
  async updateUserProfile(
    _userId: number,
    profileData: Partial<UserProfileResponse>,
  ): Promise<UserProfileResponse> {
    try {
      // Check user role to determine correct endpoint
      const userStr = getStoredUserRaw();
      const user = userStr ? (JSON.parse(userStr) as StoredUserSnapshot) : null;

      let endpoint = "/api/user/profile"; // Default for USER

      if (user?.roles) {
        if (user.roles.includes("MENTOR")) {
          endpoint = "/api/mentors/profile";
        } else if (user.roles.includes("RECRUITER")) {
          endpoint = "/api/business/profile";
        } else if (user.roles.includes("ADMIN")) {
          throw new Error("Admin không có profile để cập nhật.");
        }
      }

      const response = await axiosInstance.put<UserProfileResponse>(
        endpoint,
        profileData,
      );
      return response.data;
    } catch (error: unknown) {
      console.error("Update user profile error:", error);
      const errorMessage = extractApiErrorMessage(
        error,
        "Cập nhật thông tin thất bại.",
      );
      throw new Error(errorMessage);
    }
  }

  // Upload user avatar
  async uploadUserAvatar(
    file: File,
    userId: number,
  ): Promise<{ avatarUrl: string }> {
    try {
      // Step 1: Upload to Media Service
      const media = await uploadMedia(file, userId);

      // Step 2: Update User Profile with new Media
      await this.updateUserProfile(userId, {
        avatarMediaId: media.id,
      });

      return { avatarUrl: media.url };
    } catch (error: unknown) {
      console.error("Upload avatar error:", error);
      const errorMessage = extractApiErrorMessage(
        error,
        "Upload avatar thất bại.",
      );
      throw new Error(errorMessage);
    }
  }

  // Get user skills
  async getUserSkills(userId: number): Promise<UserSkillResponse[]> {
    try {
      const response = await axiosInstance.get<UserSkillResponse[]>(
        `/api/user/profile/${userId}/skills`,
      );
      return response.data;
    } catch (error: unknown) {
      console.error("Get user skills error:", error);
      const errorMessage = extractApiErrorMessage(
        error,
        "Không thể tải danh sách kỹ năng.",
      );
      throw new Error(errorMessage);
    }
  }

  // Get current user's skills
  async getMySkills(): Promise<UserSkillResponse[]> {
    try {
      const response = await axiosInstance.get<UserSkillResponse[]>(
        "/api/user/profile/skills",
      );
      return response.data;
    } catch (error: unknown) {
      console.error("Get my skills error:", error);
      const errorMessage = extractApiErrorMessage(
        error,
        "Không thể tải danh sách kỹ năng.",
      );
      throw new Error(errorMessage);
    }
  }

  // Add user skill
  async addUserSkill(
    _userId: number,
    skillData: Omit<UserSkillResponse, "id">,
  ): Promise<UserSkillResponse> {
    try {
      const response = await axiosInstance.post<UserSkillResponse>(
        "/api/user/profile/skills",
        skillData,
      );
      return response.data;
    } catch (error: unknown) {
      console.error("Add user skill error:", error);
      const errorMessage = extractApiErrorMessage(
        error,
        "Thêm kỹ năng thất bại.",
      );
      throw new Error(errorMessage);
    }
  }

  // Update user skill
  async updateUserSkill(
    _userId: number,
    skillId: number,
    skillData: Partial<UserSkillResponse>,
  ): Promise<UserSkillResponse> {
    try {
      const response = await axiosInstance.put<UserSkillResponse>(
        `/api/user/profile/skills/${skillId}`,
        skillData,
      );
      return response.data;
    } catch (error: unknown) {
      console.error("Update user skill error:", error);
      const errorMessage = extractApiErrorMessage(
        error,
        "Cập nhật kỹ năng thất bại.",
      );
      throw new Error(errorMessage);
    }
  }

  // Delete user skill
  async deleteUserSkill(skillId: number): Promise<void> {
    try {
      await axiosInstance.delete(`/api/user/profile/skills/${skillId}`);
    } catch (error: unknown) {
      console.error("Delete user skill error:", error);
      const errorMessage = extractApiErrorMessage(
        error,
        "Xóa kỹ năng thất bại.",
      );
      throw new Error(errorMessage);
    }
  }
}

export default new UserService();
