import axiosInstance from './axiosInstance';
import {
  ContractListResponse,
  CreateContractRequest,
  UpdateContractRequest,
  SignContractRequest,
  ContractResponse,
} from '../types/contract';

type AxiosError = { response?: { data?: { message?: string } } };
type ContractApiResponse = Record<string, unknown>;

class ContractService {

  // ==================== PRIVATE HELPER ====================

  private handleError(error: unknown, defaultMessage: string): never {
    const axiosError = error as AxiosError;
    const errorMessage = axiosError.response?.data?.message || defaultMessage;
    console.error(`${defaultMessage}:`, errorMessage);
    throw new Error(errorMessage);
  }

  private toNumber(value: unknown): number | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
  }

  private normalizeContract(data: ContractApiResponse): ContractResponse {
    const salary = this.toNumber(data.salary) ?? 0;
    const probationSalary = this.toNumber(data.probationSalary);
    const mealAllowance = this.toNumber(data.mealAllowance);
    const transportAllowance = this.toNumber(data.transportAllowance);
    const housingAllowance = this.toNumber(data.housingAllowance);
    const employerSignature = (data.employerSignature as ContractResponse['employerSignature']) ?? undefined;
    const candidateSignature = (data.candidateSignature as ContractResponse['candidateSignature']) ?? undefined;
    const signedPdfUrl = typeof data.signedPdfUrl === 'string' ? data.signedPdfUrl : undefined;
    const employerAddress = typeof data.employerAddress === 'string' ? data.employerAddress : undefined;

    return {
      ...(data as unknown as ContractResponse),
      salary,
      monthlySalary: salary,
      probationSalary,
      mealAllowance,
      transportAllowance,
      housingAllowance,
      employerSignature,
      candidateSignature,
      employerAddress,
      employerCompanyAddress:
        typeof data.employerCompanyAddress === 'string'
          ? data.employerCompanyAddress
          : employerAddress,
      employerSignatureUrl:
        typeof data.employerSignatureUrl === 'string'
          ? data.employerSignatureUrl
          : employerSignature?.signatureImageUrl,
      employerSignedAt:
        typeof data.employerSignedAt === 'string'
          ? data.employerSignedAt
          : employerSignature?.signedAt,
      candidateSignatureUrl:
        typeof data.candidateSignatureUrl === 'string'
          ? data.candidateSignatureUrl
          : candidateSignature?.signatureImageUrl,
      candidateSignedAt:
        typeof data.candidateSignedAt === 'string'
          ? data.candidateSignedAt
          : candidateSignature?.signedAt,
      signedPdfUrl,
      pdfUrl: typeof data.pdfUrl === 'string' ? data.pdfUrl : signedPdfUrl,
    };
  }

  private normalizeContractListItem(data: ContractApiResponse): ContractListResponse {
    const salary = this.toNumber(data.salary) ?? 0;
    const applicationId = this.toNumber(data.applicationId);
    const jobId = this.toNumber(data.jobId);

    return {
      ...(data as unknown as ContractListResponse),
      applicationId,
      jobId,
      salary,
      monthlySalary: salary,
    };
  }

  // ==================== CONTRACT CRUD ====================

  /**
   * Create a new contract (DRAFT status)
   * @requires RECRUITER role
   */
  async createContract(data: CreateContractRequest): Promise<ContractResponse> {
    try {
      const response = await axiosInstance.post<ContractApiResponse>('/contracts', data);
      return this.normalizeContract(response.data);
    } catch (error) {
      this.handleError(error, 'Failed to create contract');
    }
  }

  /**
   * Get contracts for current user based on role.
   * "EMPLOYER" = recruiter perspective (employer = party A in labor contract).
   * @requires USER or RECRUITER role
   */
  async getMyContracts(
    role: 'EMPLOYER' | 'CANDIDATE',
    options?: { suppressError?: boolean },
  ): Promise<ContractListResponse[]> {
    try {
      const response = await axiosInstance.get<ContractApiResponse[]>(
        `/contracts/my?role=${role}`
      );
      return response.data.map((item) => this.normalizeContractListItem(item));
    } catch (error) {
      if (options?.suppressError) {
        return [];
      }
      this.handleError(error, 'Failed to fetch contracts');
    }
  }

  /**
   * Get contract by ID
   * @requires OWNER role (employer or candidate)
   */
  async getContractById(id: number): Promise<ContractResponse> {
    try {
      const response = await axiosInstance.get<ContractApiResponse>(`/contracts/${id}`);
      return this.normalizeContract(response.data);
    } catch (error) {
      this.handleError(error, 'Failed to fetch contract');
    }
  }

  /**
   * Get contract by application ID
   * @requires RECRUITER role
   */
  async getContractByApplication(applicationId: number): Promise<ContractResponse | null> {
    try {
      const response = await axiosInstance.get<ContractApiResponse>(
        `/contracts/applications/${applicationId}`
      );
      return this.normalizeContract(response.data);
    } catch {
      return null;
    }
  }

  /**
   * Update an existing draft contract
   * @requires RECRUITER role (owner)
   */
  async updateContract(id: number, data: UpdateContractRequest): Promise<ContractResponse> {
    try {
      const response = await axiosInstance.put<ContractApiResponse>(`/contracts/${id}`, data);
      return this.normalizeContract(response.data);
    } catch (error) {
      this.handleError(error, 'Failed to update contract');
    }
  }

  /**
   * Send contract for signature (DRAFT → PENDING_SIGNER)
   * @requires RECRUITER role (owner)
   */
  async sendForSignature(id: number): Promise<ContractResponse> {
    try {
      const response = await axiosInstance.patch<ContractApiResponse>(`/contracts/${id}/send`);
      return this.normalizeContract(response.data);
    } catch (error) {
      this.handleError(error, 'Failed to send contract for signature');
    }
  }

  /**
   * Sign or reject a contract
   * @requires CANDIDATE or RECRUITER role (based on current status)
   */
  async signContract(id: number, data: SignContractRequest): Promise<ContractResponse> {
    try {
      const response = await axiosInstance.post<ContractApiResponse>(
        `/contracts/${id}/sign`,
        data
      );
      return this.normalizeContract(response.data);
    } catch (error) {
      this.handleError(error, 'Failed to sign contract');
    }
  }

  /**
   * Cancel a contract
   * @requires EMPLOYER or CANDIDATE role (owner)
   */
  async cancelContract(id: number): Promise<ContractResponse> {
    try {
      const response = await axiosInstance.post<ContractApiResponse>(`/contracts/${id}/cancel`);
      return this.normalizeContract(response.data);
    } catch (error) {
      this.handleError(error, 'Failed to cancel contract');
    }
  }

  /**
   * Download contract PDF
   * @requires OWNER role
   */
  async downloadPdf(id: number): Promise<Blob> {
    try {
      const response = await axiosInstance.get(`/contracts/${id}/pdf`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      this.handleError(error, 'Failed to download contract PDF');
    }
  }

  // ==================== HELPER METHODS ====================

  /**
   * Get status display text
   */
  getStatusText(status: string): string {
    switch (status) {
      case 'DRAFT': return 'Bản nháp';
      case 'PENDING_SIGNER': return 'Chờ ứng viên ký';
      case 'PENDING_EMPLOYER': return 'Chờ nhà tuyển dụng ký';
      case 'SIGNED': return 'Đã ký';
      case 'REJECTED': return 'Bị từ chối';
      case 'CANCELLED': return 'Đã hủy';
      default: return status;
    }
  }

  /**
   * Get status badge color
   */
  getStatusColor(status: string): string {
    switch (status) {
      case 'DRAFT': return 'gray';
      case 'PENDING_SIGNER': return 'blue';
      case 'PENDING_EMPLOYER': return 'orange';
      case 'SIGNED': return 'green';
      case 'REJECTED': return 'red';
      case 'CANCELLED': return 'gray';
      default: return 'gray';
    }
  }

  /**
   * Get contract type display text
   */
  getTypeText(type: string): string {
    switch (type) {
      case 'PROBATION': return 'Hợp đồng thử việc';
      case 'FULL_TIME': return 'Hợp đồng lao động';
      case 'PART_TIME': return 'Hợp đồng thời vụ';
      default: return type;
    }
  }

  /**
   * Format contract number for display
   */
  formatContractNumber(num: string): string {
    return num || '';
  }

  /**
   * Format salary for display
   */
  formatSalary(amount: number): string {
    const formatter = new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    });
    return formatter.format(amount);
  }
}

export default new ContractService();
