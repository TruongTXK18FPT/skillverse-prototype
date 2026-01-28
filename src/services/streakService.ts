import axiosInstance from "./axiosInstance";

// =============================================
// STREAK SERVICE - Daily Check-In & Streak Tracking
// =============================================

export interface CheckInResponse {
  success: boolean;
  message: string;
  checkInDate: string;
  checkInTime: string;
  alreadyCheckedIn: boolean;
  coinsAwarded: number;
  xpAwarded: number;
  isBonusDay: boolean;
  currentStreak: number;
  longestStreak: number;
  streakDay: number;
  weeklyActivity: boolean[];
  powerLevel: number;
}

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  totalCheckIns: number;
  monthlyCheckIns: number;
  weeklyActivity: boolean[];
  powerLevel: number;
  checkedInToday: boolean;
  lastCheckInDate: string | null;
  weekDates: string[];
}

class StreakService {
  /**
   * Perform daily check-in
   */
  async checkIn(): Promise<CheckInResponse> {
    try {
      const response = await axiosInstance.post<CheckInResponse>(
        "/api/streak/check-in",
      );
      return response.data;
    } catch (error: any) {
      console.error("Check-in failed:", error);
      // Return a failure response
      return {
        success: false,
        message:
          error.response?.data?.message || "Đã có lỗi xảy ra khi điểm danh",
        checkInDate: new Date().toISOString().split("T")[0],
        checkInTime: new Date().toISOString(),
        alreadyCheckedIn: false,
        coinsAwarded: 0,
        xpAwarded: 0,
        isBonusDay: false,
        currentStreak: 0,
        longestStreak: 0,
        streakDay: 0,
        weeklyActivity: [false, false, false, false, false, false, false],
        powerLevel: 0,
      };
    }
  }

  /**
   * Get streak information
   */
  async getStreakInfo(): Promise<StreakInfo | null> {
    try {
      const response = await axiosInstance.get<StreakInfo>("/api/streak/info");
      return response.data;
    } catch (error: any) {
      console.error("Failed to get streak info:", error);
      return null;
    }
  }

  /**
   * Check if user has checked in today
   */
  async hasCheckedInToday(): Promise<boolean> {
    try {
      const response = await axiosInstance.get<boolean>("/api/streak/status");
      return response.data;
    } catch (error: any) {
      console.error("Failed to check status:", error);
      // Fallback to localStorage
      const lastCheckIn = localStorage.getItem("lastCheckIn");
      return lastCheckIn === new Date().toDateString();
    }
  }
}

export const streakService = new StreakService();
export default streakService;
