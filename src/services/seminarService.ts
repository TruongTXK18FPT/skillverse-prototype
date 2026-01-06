import axiosInstance from './axiosInstance';
import { 
    Seminar, 
    SeminarCreateRequest, 
    SeminarUpdateRequest, 
    SeminarResponse, 
    SeminarTicketResponse,
    SeminarTicket
} from '../types/seminar';

// Helper: Get auth headers if token exists (for optional auth endpoints)
const getOptionalAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem('accessToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

class SeminarService {
    // Public User & General - with optional auth for personalized data (isOwned)
    // Backend defaults to ACCEPTED + OPEN if no statuses provided
    // statuses can be: 'PENDING', 'ACCEPTED', 'OPEN', 'CLOSED', 'REJECTED', 'DRAFT'
    async getAllSeminars(page = 0, size = 6, statuses?: string | string[]): Promise<SeminarResponse> {
        let url = `/seminars?page=${page}&size=${size}`;
        
        // Add statuses to query params if provided
        if (statuses) {
            const statusArray = Array.isArray(statuses) ? statuses : [statuses];
            statusArray.forEach(status => {
                url += `&statuses=${status}`;
            });
        }
        
        const response = await axiosInstance.get(url, { headers: getOptionalAuthHeaders() });
        return response.data;
    }

    async getSeminarById(id: number): Promise<Seminar> {
        const response = await axiosInstance.get(
            `/seminars/${id}`,
            { headers: getOptionalAuthHeaders() }
        );
        return response.data;
    }

    async buyTicket(id: number): Promise<SeminarTicket> {
        const response = await axiosInstance.post(`/seminars/${id}/buy`);
        return response.data;
    }

    async getMyTickets(page = 0, size = 10): Promise<SeminarTicketResponse> {
        const response = await axiosInstance.get(`/seminars/my-tickets?page=${page}&size=${size}`);
        return response.data;
    }

    // Recruiter
    async createSeminar(data: FormData): Promise<Seminar> {
        const response = await axiosInstance.post('/seminars', data, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    }

    async updateSeminar(id: number, data: SeminarUpdateRequest): Promise<Seminar> {
        const response = await axiosInstance.put(`/seminars/${id}`, data);
        return response.data;
    }

    async getMySeminars(page = 0, size = 10): Promise<SeminarResponse> {
        const response = await axiosInstance.get(`/seminars/my-seminars?page=${page}&size=${size}`);
        return response.data;
    }

    async submitSeminar(id: number): Promise<void> {
        await axiosInstance.post(`/seminars/${id}/submit`);
    }

    // Admin
    async getSeminarByIdForAdmin(id: number): Promise<Seminar> {
        const response = await axiosInstance.get(`/seminars/${id}/admin`);
        return response.data;
    }

    async approveSeminar(id: number): Promise<void> {
        await axiosInstance.post(`/seminars/${id}/approve`);
    }

    async rejectSeminar(id: number): Promise<void> {
        await axiosInstance.post(`/seminars/${id}/reject`);
    }
    
    // Revenue Report (Recruiter)
    async getSeminarRevenueReport(id: number): Promise<any> {
        const response = await axiosInstance.get(`/seminars/${id}/revenue-report`);
        return response.data;
    }

    async downloadSeminarRevenueInvoice(id: number): Promise<Blob> {
        const response = await axiosInstance.get(`/seminars/${id}/revenue-invoice`, {
            responseType: 'blob',
        });
        return response.data;
    }
}

export const seminarService = new SeminarService();

