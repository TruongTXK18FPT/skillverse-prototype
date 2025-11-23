/**
 * Admin User Management Types
 */

export type PrimaryRole = 'USER' | 'MENTOR' | 'RECRUITER' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'INACTIVE';

export interface AdminUserResponse {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string;
  phoneNumber: string | null;
  primaryRole: PrimaryRole;
  status: UserStatus;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  lastActive: string;
  avatarUrl: string | null;
  coursesCreated: number;
  coursesEnrolled: number;
  certificatesEarned: number;
}

export interface AdminUserListResponse {
  users: AdminUserResponse[];
  totalUsers: number;
  totalMentors: number;
  totalRecruiters: number;
  totalRegularUsers: number;
  totalActiveUsers: number;
  totalInactiveUsers: number;
}

export interface UpdateUserStatusRequest {
  userId: number;
  status: UserStatus;
  reason?: string;
}

export interface UpdateUserRoleRequest {
  userId: number;
  primaryRole: PrimaryRole;
  reason?: string;
}

export interface UpdateUserProfileRequest {
  userId: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  reason?: string;
}

export interface UserFilters {
  role?: PrimaryRole;
  status?: UserStatus;
  search?: string;
}

export interface AdminUserDetailResponse {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string;
  phoneNumber: string | null;
  primaryRole: PrimaryRole;
  status: UserStatus;
  isEmailVerified: boolean;
  authProvider: string;
  googleLinked: boolean;
  createdAt: string;
  updatedAt: string;
  lastActive: string;
  avatarUrl: string | null;
  bio: string | null;
  coursesCreated: number;
  coursesEnrolled: number;
  certificatesEarned: number;
  totalSpent: number;
  totalEarned: number;
  loginCount: number;
  lastLoginAt: string;
  lastLoginIp: string | null;
  recentCourses?: UserCourseInfo[];
  recentCertificates?: UserCertificateInfo[];
}

export interface UserCourseInfo {
  courseId: number;
  courseTitle: string;
  courseThumbnail: string | null;
  enrolledAt: string;
  progress: number;
}

export interface UserCertificateInfo {
  certificateId: number;
  courseName: string;
  issuedAt: string;
  certificateUrl: string;
}

export interface ResetPasswordRequest {
  userId: number;
  newPassword: string;
  reason?: string;
}
