import axiosInstance from './axiosInstance';

export enum LinkStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  REJECTED = 'REJECTED'
}

export interface UserDto {
  id: number;
  fullName: string;
  email: string;
  avatarUrl?: string;
}

export interface ParentStudentLinkResponse {
  id: number;
  parent: UserDto;
  student: UserDto;
  status: LinkStatus;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateLinkStatusRequest {
  status: LinkStatus;
}

class StudentLinkService {
  async getStudentLinks(): Promise<ParentStudentLinkResponse[]> {
    const response = await axiosInstance.get<ParentStudentLinkResponse[]>('parents/student-links');
    return response.data;
  }

  async updateLinkStatus(linkId: number, status: LinkStatus): Promise<ParentStudentLinkResponse> {
    const response = await axiosInstance.put<ParentStudentLinkResponse>(`parents/link/${linkId}`, { status });
    return response.data;
  }
}

export default new StudentLinkService();
