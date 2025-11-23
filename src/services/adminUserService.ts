import axiosInstance from './axiosInstance';
import {
  AdminUserListResponse,
  AdminUserResponse,
  AdminUserDetailResponse,
  UpdateUserStatusRequest,
  UpdateUserRoleRequest,
  UpdateUserProfileRequest,
  ResetPasswordRequest,
  UserFilters,
  PrimaryRole,
  UserStatus
} from '../types/adminUser';

/**
 * AdminUserService - Service for admin user management operations
 */
class AdminUserService {
  private readonly BASE_URL = '/api/admin/users';

  /**
   * Get all users with optional filters
   * @param filters - Optional filters for role, status, and search
   * @returns Promise<AdminUserListResponse>
   */
  async getAllUsers(filters?: UserFilters): Promise<AdminUserListResponse> {
    try {
      const params: Record<string, string> = {};
      
      if (filters?.role) {
        params.role = filters.role;
      }
      if (filters?.status) {
        params.status = filters.status;
      }
      if (filters?.search) {
        params.search = filters.search;
      }

      const response = await axiosInstance.get<AdminUserListResponse>(
        this.BASE_URL,
        { params }
      );
      
      console.log(`✅ Fetched ${response.data.totalUsers} users`);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching users:', error);
      throw error;
    }
  }

  /**
   * Get user by ID
   * @param userId - User ID
   * @returns Promise<AdminUserResponse>
   */
  async getUserById(userId: number): Promise<AdminUserResponse> {
    try {
      const response = await axiosInstance.get<AdminUserResponse>(
        `${this.BASE_URL}/${userId}`
      );
      
      console.log(`✅ Fetched user details for userId: ${userId}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get detailed user information
   * @param userId - User ID
   * @returns Promise<AdminUserDetailResponse>
   */
  async getUserDetailById(userId: number): Promise<AdminUserDetailResponse> {
    try {
      const response = await axiosInstance.get<AdminUserDetailResponse>(
        `${this.BASE_URL}/${userId}/detail`
      );
      
      console.log(`✅ Fetched detailed user info for userId: ${userId}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching user detail ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Update user status
   * @param request - UpdateUserStatusRequest
   * @returns Promise<AdminUserResponse>
   */
  async updateUserStatus(request: UpdateUserStatusRequest): Promise<AdminUserResponse> {
    try {
      const response = await axiosInstance.put<AdminUserResponse>(
        `${this.BASE_URL}/status`,
        request
      );
      
      console.log(`✅ Updated user status for userId: ${request.userId}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating user status:', error);
      throw error;
    }
  }

  /**
   * Update user role
   * @param request - UpdateUserRoleRequest
   * @returns Promise<AdminUserResponse>
   */
  async updateUserRole(request: UpdateUserRoleRequest): Promise<AdminUserResponse> {
    try {
      const response = await axiosInstance.put<AdminUserResponse>(
        `${this.BASE_URL}/role`,
        request
      );
      
      console.log(`✅ Updated user role for userId: ${request.userId}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating user role:', error);
      throw error;
    }
  }

  /**
   * Ban a user
   * @param userId - User ID
   * @param reason - Optional reason for banning
   * @returns Promise<AdminUserResponse>
   */
  async banUser(userId: number, reason?: string): Promise<AdminUserResponse> {
    try {
      const params: Record<string, string> = {};
      if (reason) {
        params.reason = reason;
      }

      const response = await axiosInstance.post<AdminUserResponse>(
        `${this.BASE_URL}/${userId}/ban`,
        null,
        { params }
      );
      
      console.log(`✅ Banned user ${userId}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error banning user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Unban a user
   * @param userId - User ID
   * @param reason - Optional reason for unbanning
   * @returns Promise<AdminUserResponse>
   */
  async unbanUser(userId: number, reason?: string): Promise<AdminUserResponse> {
    try {
      const params: Record<string, string> = {};
      if (reason) {
        params.reason = reason;
      }

      const response = await axiosInstance.post<AdminUserResponse>(
        `${this.BASE_URL}/${userId}/unban`,
        null,
        { params }
      );
      
      console.log(`✅ Unbanned user ${userId}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error unbanning user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Update user profile
   * @param request - UpdateUserProfileRequest
   * @returns Promise<AdminUserResponse>
   */
  async updateUserProfile(request: UpdateUserProfileRequest): Promise<AdminUserResponse> {
    try {
      const response = await axiosInstance.put<AdminUserResponse>(
        `${this.BASE_URL}/profile`,
        request
      );
      
      console.log(`✅ Updated user profile for userId: ${request.userId}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating user profile:', error);
      throw error;
    }
  }

  /**
   * Reset user password
   * @param request - ResetPasswordRequest
   * @returns Promise<string>
   */
  async resetUserPassword(request: ResetPasswordRequest): Promise<string> {
    try {
      const response = await axiosInstance.post<string>(
        `${this.BASE_URL}/reset-password`,
        request
      );
      
      console.log(`✅ Reset password for userId: ${request.userId}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error resetting password:', error);
      throw error;
    }
  }

  /**
   * Delete a user (soft delete)
   * @param userId - User ID
   * @returns Promise<void>
   */
  async deleteUser(userId: number): Promise<void> {
    try {
      await axiosInstance.delete(`${this.BASE_URL}/${userId}`);
      console.log(`✅ Deleted user ${userId}`);
    } catch (error) {
      console.error(`❌ Error deleting user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get users by role
   * @param role - Primary role to filter by
   * @returns Promise<AdminUserListResponse>
   */
  async getUsersByRole(role: PrimaryRole): Promise<AdminUserListResponse> {
    return this.getAllUsers({ role });
  }

  /**
   * Get users by status
   * @param status - User status to filter by
   * @returns Promise<AdminUserListResponse>
   */
  async getUsersByStatus(status: UserStatus): Promise<AdminUserListResponse> {
    return this.getAllUsers({ status });
  }

  /**
   * Search users
   * @param search - Search query
   * @returns Promise<AdminUserListResponse>
   */
  async searchUsers(search: string): Promise<AdminUserListResponse> {
    return this.getAllUsers({ search });
  }
}

// Export singleton instance
const adminUserService = new AdminUserService();
export default adminUserService;
