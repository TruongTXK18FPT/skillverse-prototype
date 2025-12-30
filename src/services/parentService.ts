import axiosInstance from './axiosInstance';
import { RoadmapSessionSummary } from '../types/Roadmap';
import { ChatSession, ChatMessage } from '../types/Chat';

export interface StudentInfo {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
}

export interface StudentProgress {
  roadmapProgress: number; // Percentage
  completedSkills: number;
  inProgressSkills: number;
  milestonesReached: number;
  studyTimeToday: number; // Minutes
  studyTimeWeek: number; // Minutes
  studyTimeMonth: number; // Minutes
  streakDays: number;
  missedDays: number;
  learningStatus: 'Good' | 'Behind' | 'Risk';
  premiumPlan?: string;
  premiumExpiry?: string;
  totalRoadmaps: number;
  chatSessionsCount: number;
  completedJobs: number;
  portfolioCreated: boolean;
}

export interface StudentProject {
  id: number;
  title: string;
  status: 'Completed' | 'In Progress';
  score?: number;
  completionDate?: string;
  skills: string[];
}

export interface StudentDetail extends StudentInfo {
  progress: StudentProgress;
  projects: StudentProject[];
  walletBalance: number;
}

export interface ParentDashboardData {
  students: StudentDetail[];
  parentWalletBalance: number;
}

export interface Transaction {
  id: number;
  date: string;
  amount: number;
  type: 'Deposit' | 'Purchase' | 'Transfer';
  description: string;
  status: 'Success' | 'Pending' | 'Failed';
  studentName?: string; // If related to a student
}

export interface ParentStudentLinkResponse {
  id: number;
  parent: any;
  student: any;
  status: 'PENDING' | 'ACTIVE' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
  inviteCode?: string;
}

export interface LearningReportData {
  id?: number;
  generatedAt: string;
  studentId: number;
  studentName: string;
  reportContent: string;
  sections: {
    learningGoals: string;
    achievements: string;
    learningBehavior: string;
    strengths: string;
    risksAndGaps: string;
    recommendations: string;
  };
}

class ParentService {
  
  async getDashboard(): Promise<ParentDashboardData> {
    const response = await axiosInstance.get<any>('parents/dashboard');
    
    // Map backend response to frontend structure
    const backendData = response.data;
    
    const students: StudentDetail[] = (backendData.students || []).map((s: any) => ({
      id: s.studentInfo.id,
      firstName: s.studentInfo.firstName || 'Unknown',
      lastName: s.studentInfo.lastName || 'Student',
      email: s.studentInfo.email,
      avatarUrl: s.studentInfo.avatarUrl,
      progress: {
        roadmapProgress: s.overallProgress || 0,
        completedSkills: s.completedCourses || 0,
        inProgressSkills: s.inProgressCourses || 0,
        milestonesReached: 0, // Mock
        studyTimeToday: s.studyTimeToday || 0,
        studyTimeWeek: s.studyTimeWeek || 0,
        studyTimeMonth: s.studyTimeMonth || 0,
        streakDays: s.streakDays || 0,
        missedDays: 0, // Mock
        learningStatus: s.learningStatus || 'Good',
        premiumPlan: s.premiumPlan,
        premiumExpiry: s.premiumExpiry,
        totalRoadmaps: s.totalRoadmaps || 0,
        chatSessionsCount: s.chatSessionsCount || 0,
        completedJobs: s.completedJobs || 0,
        portfolioCreated: s.portfolioCreated || false
      },
      projects: [], // Mock
      walletBalance: 0 // Mock
    }));

    return {
      students,
      parentWalletBalance: 0 // Mock
    };
  }

  async getSentRequests(): Promise<ParentStudentLinkResponse[]> {
    const response = await axiosInstance.get<ParentStudentLinkResponse[]>('parents/sent-requests');
    return response.data;
  }

  async getStudentLinks(): Promise<ParentStudentLinkResponse[]> {
    const response = await axiosInstance.get<ParentStudentLinkResponse[]>('parents/student-links');
    return response.data;
  }

  async updateLinkStatus(linkId: number, status: 'ACTIVE' | 'REJECTED'): Promise<void> {
    await axiosInstance.put(`parents/link/${linkId}`, { status });
  }

  async linkStudent(studentEmail: string): Promise<void> {
    await axiosInstance.post('parents/link', { studentEmail });
  }

  async unlinkStudent(studentId: number): Promise<void> {
    await axiosInstance.delete(`parents/link/${studentId}`);
  }

  async getWalletTransactions(): Promise<Transaction[]> {
    const response = await axiosInstance.get<Transaction[]>('parents/wallet/transactions');
    return response.data;
  }

  async topUpWallet(amount: number, paymentMethod: string): Promise<void> {
    await axiosInstance.post('parents/wallet/top-up', { amount, paymentMethod });
  }

  async purchasePremium(studentId: number, planId: string): Promise<void> {
    await axiosInstance.post('parents/purchase/premium', { studentId, planId });
  }

  async getStudentRoadmaps(studentId: number): Promise<RoadmapSessionSummary[]> {
    const response = await axiosInstance.get<RoadmapSessionSummary[]>(`parents/student/${studentId}/roadmaps`);
    return response.data;
  }

  async getStudentChatSessions(studentId: number): Promise<ChatSession[]> {
    const response = await axiosInstance.get<ChatSession[]>(`parents/student/${studentId}/chat-sessions`);
    return response.data;
  }

  async getStudentChatSessionDetails(studentId: number, sessionId: number): Promise<ChatMessage[]> {
    const response = await axiosInstance.get<ChatMessage[]>(`parents/student/${studentId}/chat-sessions/${sessionId}`);
    return response.data;
  }

  /**
   * Generate AI-powered Learning Report for a student
   * This report follows educational analysis guidelines for parents
   */
  async generateLearningReport(studentId: number): Promise<LearningReportData> {
    try {
      const response = await axiosInstance.post<LearningReportData>(
        `parents/student/${studentId}/learning-report`,
        {},
        { timeout: 120000 } // 2 minute timeout for AI generation
      );
      return response.data;
    } catch (error: any) {
      // If backend endpoint not available, generate a mock/placeholder report
      // This allows the feature to work while backend is being developed
      if (error.response?.status === 404 || error.code === 'ERR_NETWORK') {
        return this.generateLocalReport(studentId);
      }
      throw error;
    }
  }

  /**
   * Get learning report history for a student
   */
  async getLearningReportHistory(studentId: number): Promise<LearningReportData[]> {
    const response = await axiosInstance.get<LearningReportData[]>(
      `parents/student/${studentId}/learning-reports`
    );
    return response.data;
  }

  /**
   * Get the latest learning report for a student
   */
  async getLatestLearningReport(studentId: number): Promise<LearningReportData | null> {
    try {
      const response = await axiosInstance.get<LearningReportData>(
        `parents/student/${studentId}/learning-reports/latest`
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Generate a local placeholder report when backend is unavailable
   * This uses available frontend data to create a basic report
   */
  private async generateLocalReport(studentId: number): Promise<LearningReportData> {
    // Fetch available data
    const dashboard = await this.getDashboard();
    const student = dashboard.students.find(s => s.id === studentId);
    
    if (!student) {
      throw new Error('Student not found');
    }

    let chatSessions: ChatSession[] = [];
    let roadmaps: RoadmapSessionSummary[] = [];
    
    try {
      chatSessions = await this.getStudentChatSessions(studentId);
    } catch (e) {
      console.warn('Could not fetch chat sessions for report');
    }
    
    try {
      roadmaps = await this.getStudentRoadmaps(studentId);
    } catch (e) {
      console.warn('Could not fetch roadmaps for report');
    }

    const studentName = `${student.firstName} ${student.lastName}`;
    const now = new Date().toISOString();

    // Generate sections based on available data
    const learningGoals = this.generateGoalsSection(student, roadmaps);
    const achievements = this.generateAchievementsSection(student, roadmaps);
    const learningBehavior = this.generateBehaviorSection(student, chatSessions);
    const strengths = this.generateStrengthsSection(student, chatSessions, roadmaps);
    const risksAndGaps = this.generateRisksSection(student);
    const recommendations = this.generateRecommendationsSection(student, roadmaps);

    const reportContent = `
# 📊 BÁO CÁO HỌC TẬP
## Học viên: ${studentName}

---

## 1. Mục Tiêu Học Tập Hiện Tại

${learningGoals}

---

## 2. Kết Quả Học Tập Cụ Thể

${achievements}

---

## 3. Mô Hình Hành Vi Học Tập

${learningBehavior}

---

## 4. Điểm Mạnh Thể Hiện Qua Tương Tác Với AI

${strengths}

---

## 5. Rủi Ro Hoặc Khoảng Trống Cần Lưu Ý

${risksAndGaps}

---

## 6. Khuyến Nghị Cụ Thể Cho 30 Ngày Tiếp Theo

${recommendations}

---

> *Báo cáo này được tạo tự động dựa trên dữ liệu hoạt động thực tế của học viên trong hệ thống.*
`;

    return {
      generatedAt: now,
      studentId,
      studentName,
      reportContent,
      sections: {
        learningGoals,
        achievements,
        learningBehavior,
        strengths,
        risksAndGaps,
        recommendations
      }
    };
  }

  private generateGoalsSection(student: StudentDetail, roadmaps: RoadmapSessionSummary[]): string {
    const lines: string[] = [];
    
    lines.push('**Dữ liệu quan sát được:**');
    
    if (roadmaps.length > 0) {
      lines.push(`- Học viên đã tạo **${roadmaps.length}** lộ trình học tập`);
      const activeRoadmaps = roadmaps.filter(r => r.progressPercentage < 100);
      if (activeRoadmaps.length > 0) {
        lines.push(`- Hiện đang theo đuổi **${activeRoadmaps.length}** lộ trình:`);
        activeRoadmaps.slice(0, 3).forEach(r => {
          lines.push(`  - ${r.title || r.originalGoal || 'Chưa đặt tên'}`);
        });
      }
    } else {
      lines.push('- Chưa có lộ trình học tập được tạo trong hệ thống');
    }

    if (student.progress.completedSkills > 0) {
      lines.push(`- Đã hoàn thành **${student.progress.completedSkills}** khóa học/kỹ năng`);
    }
    
    if (student.progress.inProgressSkills > 0) {
      lines.push(`- Đang học **${student.progress.inProgressSkills}** khóa học/kỹ năng`);
    }

    lines.push('');
    lines.push('**Nhận định của AI:**');
    
    if (roadmaps.length > 0 || student.progress.inProgressSkills > 0) {
      lines.push('- Học viên có định hướng học tập rõ ràng thông qua việc thiết lập lộ trình');
    } else {
      lines.push('- Cần hỗ trợ học viên xác định mục tiêu học tập cụ thể');
    }

    return lines.join('\n');
  }

  private generateAchievementsSection(student: StudentDetail, roadmaps: RoadmapSessionSummary[]): string {
    const lines: string[] = [];
    
    lines.push('**Dữ liệu quan sát được:**');
    
    const completedRoadmaps = roadmaps.filter(r => r.progressPercentage === 100);
    
    if (completedRoadmaps.length > 0) {
      lines.push(`- Hoàn thành **${completedRoadmaps.length}** lộ trình học tập`);
    }
    
    if (student.progress.completedSkills > 0) {
      lines.push(`- Hoàn thành **${student.progress.completedSkills}** khóa học/module`);
    }
    
    if (student.progress.completedJobs > 0) {
      lines.push(`- Hoàn thành **${student.progress.completedJobs}** công việc/bài tập thực hành`);
    }
    
    if (student.progress.portfolioCreated) {
      lines.push('- Đã tạo Portfolio cá nhân');
    }

    if (student.projects.length > 0) {
      const completedProjects = student.projects.filter(p => p.status === 'Completed');
      if (completedProjects.length > 0) {
        lines.push(`- Hoàn thành **${completedProjects.length}** dự án thực hành`);
      }
    }

    if (completedRoadmaps.length === 0 && student.progress.completedSkills === 0) {
      lines.push('- Chưa có kết quả học tập hoàn thành được ghi nhận');
    }

    lines.push('');
    lines.push('**Nhận định của AI:**');
    
    const totalAchievements = completedRoadmaps.length + student.progress.completedSkills + student.progress.completedJobs;
    if (totalAchievements > 5) {
      lines.push('- Học viên cho thấy khả năng hoàn thành tốt các mục tiêu đặt ra');
    } else if (totalAchievements > 0) {
      lines.push('- Học viên đang trong quá trình tích lũy kết quả học tập');
    } else {
      lines.push('- Cần theo dõi thêm để đánh giá khả năng hoàn thành mục tiêu');
    }

    return lines.join('\n');
  }

  private generateBehaviorSection(student: StudentDetail, chatSessions: ChatSession[]): string {
    const lines: string[] = [];
    
    lines.push('**Dữ liệu quan sát được:**');
    
    if (chatSessions.length > 0) {
      const totalMessages = chatSessions.reduce((sum, s) => sum + s.messageCount, 0);
      lines.push(`- Tham gia **${chatSessions.length}** phiên trao đổi với AI`);
      lines.push(`- Tổng cộng **${totalMessages}** lượt trao đổi`);
      
      const avgMessages = Math.round(totalMessages / chatSessions.length);
      lines.push(`- Trung bình **${avgMessages}** tin nhắn mỗi phiên`);
    } else {
      lines.push('- Chưa có dữ liệu trao đổi với AI');
    }

    if (student.progress.streakDays > 0) {
      lines.push(`- Duy trì **${student.progress.streakDays}** ngày học liên tục`);
    }

    lines.push('');
    lines.push('**Nhận định của AI:**');
    
    if (chatSessions.length > 5) {
      const avgMessages = chatSessions.reduce((sum, s) => sum + s.messageCount, 0) / chatSessions.length;
      if (avgMessages > 5) {
        lines.push('- Xu hướng học tập **chủ động**: thường xuyên đặt câu hỏi và đào sâu vấn đề');
      } else {
        lines.push('- Xu hướng học tập **có chọn lọc**: tập trung vào các câu hỏi cụ thể');
      }
    } else if (chatSessions.length > 0) {
      lines.push('- Đang trong giai đoạn làm quen với công cụ học tập AI');
    } else {
      lines.push('- Chưa có đủ dữ liệu để đánh giá mô hình hành vi');
    }

    return lines.join('\n');
  }

  private generateStrengthsSection(student: StudentDetail, chatSessions: ChatSession[], roadmaps: RoadmapSessionSummary[]): string {
    const lines: string[] = [];
    
    lines.push('**Dữ liệu quan sát được:**');
    
    const strengths: string[] = [];
    
    if (roadmaps.length > 0) {
      strengths.push('Có khả năng lập kế hoạch học tập');
    }
    
    if (chatSessions.length > 3) {
      strengths.push('Chủ động tìm kiếm hỗ trợ khi cần');
    }
    
    if (student.progress.completedSkills > 0) {
      strengths.push('Có tính kiên trì trong học tập');
    }
    
    if (student.progress.portfolioCreated) {
      strengths.push('Biết cách tổng hợp và trình bày thành quả');
    }
    
    if (student.progress.streakDays >= 7) {
      strengths.push('Duy trì thói quen học tập đều đặn');
    }

    if (strengths.length > 0) {
      strengths.forEach(s => lines.push(`- ${s}`));
    } else {
      lines.push('- Cần thêm dữ liệu để xác định điểm mạnh');
    }

    lines.push('');
    lines.push('**Nhận định của AI:**');
    
    if (strengths.length >= 3) {
      lines.push('- Học viên thể hiện nhiều năng lực tích cực trong quá trình học tập');
    } else if (strengths.length > 0) {
      lines.push('- Học viên đang phát triển các kỹ năng học tập cơ bản');
    } else {
      lines.push('- Cần quan sát thêm để nhận diện điểm mạnh');
    }

    return lines.join('\n');
  }

  private generateRisksSection(student: StudentDetail): string {
    const lines: string[] = [];
    
    lines.push('**Dữ liệu quan sát được:**');
    
    const risks: string[] = [];
    
    if (student.progress.learningStatus === 'Risk') {
      risks.push('Trạng thái học tập đang ở mức cần hỗ trợ');
    } else if (student.progress.learningStatus === 'Behind') {
      risks.push('Tiến độ học tập chậm hơn so với kế hoạch');
    }
    
    if (student.progress.inProgressSkills > student.progress.completedSkills * 2) {
      risks.push('Số lượng khóa học đang dở dang nhiều hơn hoàn thành');
    }
    
    if (student.progress.streakDays === 0 && student.progress.totalRoadmaps > 0) {
      risks.push('Có dấu hiệu gián đoạn trong học tập');
    }

    if (risks.length > 0) {
      risks.forEach(r => lines.push(`- ${r}`));
    } else {
      lines.push('- Không phát hiện rủi ro đáng kể');
    }

    lines.push('');
    lines.push('**Nhận định của AI:**');
    
    if (risks.length > 0) {
      lines.push('- Các điểm trên không nhất thiết là vấn đề nghiêm trọng');
      lines.push('- Cần theo dõi và hỗ trợ kịp thời nếu tình trạng kéo dài');
    } else {
      lines.push('- Quá trình học tập diễn ra ổn định');
    }

    return lines.join('\n');
  }

  private generateRecommendationsSection(student: StudentDetail, roadmaps: RoadmapSessionSummary[]): string {
    const lines: string[] = [];
    
    lines.push('**Đề xuất thực hiện:**');
    
    // Based on data, provide specific recommendations
    if (roadmaps.length === 0) {
      lines.push('1. **Thiết lập lộ trình học tập**: Khuyến khích học viên tạo lộ trình học tập đầu tiên để có định hướng rõ ràng');
    }
    
    if (student.progress.inProgressSkills > 0 && student.progress.completedSkills === 0) {
      lines.push('2. **Hoàn thành khóa học đầu tiên**: Tập trung hoàn thành một khóa học để tạo động lực');
    }
    
    if (student.progress.chatSessionsCount < 3) {
      lines.push('3. **Tận dụng AI hỗ trợ**: Khuyến khích học viên sử dụng tính năng chat AI để giải đáp thắc mắc');
    }
    
    if (!student.progress.portfolioCreated && student.progress.completedSkills > 2) {
      lines.push('4. **Tạo Portfolio**: Học viên đã có đủ kết quả để bắt đầu xây dựng Portfolio cá nhân');
    }
    
    if (student.progress.streakDays < 3) {
      lines.push('5. **Xây dựng thói quen**: Đặt mục tiêu học tập mỗi ngày, dù chỉ 15-30 phút');
    }

    lines.push('');
    lines.push('**Vai trò của phụ huynh:**');
    lines.push('- Theo dõi tiến độ thông qua dashboard này');
    lines.push('- Hỏi thăm về nội dung học tập hàng tuần');
    lines.push('- Không tạo áp lực về thời gian học, tập trung vào kết quả');

    return lines.join('\n');
  }
}

export default new ParentService();
