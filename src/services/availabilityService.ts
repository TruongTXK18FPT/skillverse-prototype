import axiosInstance from './axiosInstance';

const API_ENDPOINT = '/mentor-availability';

export interface Availability {
  id: number;
  mentorId: number;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
  recurrenceType: 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
}

export interface AvailabilityRequest {
  startTime: string;
  endTime: string;
  isRecurring: boolean;
  recurrenceType: 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
  recurrenceEndDate?: string;
}

export const addAvailability = async (data: AvailabilityRequest): Promise<Availability[]> => {
  const response = await axiosInstance.post<Availability[]>(API_ENDPOINT, data);
  return response.data;
};

export const getAvailability = async (mentorId: number, from?: string, to?: string): Promise<Availability[]> => {
  const params = new URLSearchParams();
  if (from) params.append('from', from);
  if (to) params.append('to', to);
  
  const response = await axiosInstance.get<Availability[]>(`${API_ENDPOINT}/${mentorId}?${params.toString()}`);
  return response.data;
};

export const deleteAvailability = async (id: number): Promise<void> => {
  await axiosInstance.delete(`${API_ENDPOINT}/${id}`);
};
