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
  if (from) {
    // Pass UTC ISO string directly to backend.
    // Backend uses LocalDateTime which ignores the Z/offset and treats the
    // components as VN-local wall-clock time. We pass UTC = correct VN time.
    // Example: "2026-03-26T03:24:56Z" UTC = "2026-03-26T10:24:56" VN
    // LocalDateTime.parse("2026-03-26T10:24:56") → correct VN datetime.
    const d = new Date(from);
    const pad = (n: number) => String(n).padStart(2, '0');
    // Extract UTC components — these equal VN-local wall-clock time
    const localStr = `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
    params.append('from', localStr);
  }
  if (to) {
    const d = new Date(to);
    const pad = (n: number) => String(n).padStart(2, '0');
    const localStr = `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
    params.append('to', localStr);
  }

  const response = await axiosInstance.get<Availability[]>(`${API_ENDPOINT}/${mentorId}?${params.toString()}`);
  return response.data;
};

export const deleteAvailability = async (id: number): Promise<void> => {
  await axiosInstance.delete(`${API_ENDPOINT}/${id}`);
};
