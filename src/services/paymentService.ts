import api from './axiosInstance';
import axios from 'axios';
import { CreatePaymentRequest, CreatePaymentResponse, PaymentTransactionResponse } from '../data/paymentDTOs';

export const paymentService = {
  async createPayment(request: CreatePaymentRequest): Promise<CreatePaymentResponse> {
    const { data } = await api.post('/api/payments/create', request);
    return data;
  },

  async getPaymentByReference(internalReference: string): Promise<PaymentTransactionResponse | null> {
    try {
      const { data } = await api.get(`/api/payments/transaction/${internalReference}`);
      return data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  async getPaymentById(paymentId: number): Promise<PaymentTransactionResponse | null> {
    try {
      const { data } = await api.get(`/api/payments/transaction/id/${paymentId}`);
      return data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  async getPaymentHistory(): Promise<PaymentTransactionResponse[]> {
    const { data } = await api.get('/api/payments/history');
    return data;
  },

  async cancelPayment(internalReference: string, reason?: string): Promise<void> {
    await api.put(`/api/payments/cancel/${internalReference}`, null, {
      params: { reason }
    });
  },

  // ==================== ADMIN METHODS ====================

  async adminGetAllTransactions(
    page: number = 0,
    size: number = 50,
    filters?: {
      status?: string;
      userId?: number;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<{
    content: PaymentTransactionResponse[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
  }> {
    const params: any = { page, size, ...filters };
    const { data } = await api.get('/api/admin/payments/transactions', { params });
    return data;
  },

  async adminGetPaymentDetail(id: number): Promise<PaymentTransactionResponse> {
    const { data } = await api.get(`/api/admin/payments/transactions/${id}`);
    return data;
  },

  async adminGetPaymentStatistics(startDate?: string, endDate?: string): Promise<{
    totalTransactions: number;
    completedCount: number;
    pendingCount: number;
    failedCount: number;
    totalRevenue: string;
    totalWalletDeposits: string;
    startDate: string;
    endDate: string;
  }> {
    const { data } = await api.get('/api/admin/payments/statistics', {
      params: { startDate, endDate }
    });
    return data;
  },

  async adminGetWalletStatistics(): Promise<{
    totalCashBalance: string;
    totalCoinBalance: number;
    activeWalletCount: number;
  }> {
    const { data } = await api.get('/api/admin/payments/wallet-stats');
    return data;
  },

  /**
   * Get revenue breakdown by time period
   * @param period - "daily", "weekly", "monthly", "yearly"
   * @param days - lookback period
   */
  async adminGetRevenueBreakdown(period: string = 'daily', days: number = 30): Promise<{
    period: string;
    data: Array<{
      date?: string;
      week?: string;
      month?: string;
      year?: number;
      revenue: number;
      transactions: number;
    }>;
    totalRevenue: number;
    totalTransactions: number;
    dataPoints: number;
  }> {
    const { data } = await api.get('/api/admin/payments/revenue-breakdown', {
      params: { period, days }
    });
    return data;
  },

  /**
   * Download PDF invoice for a payment transaction
   */
  async adminDownloadPaymentInvoice(paymentId: number): Promise<Blob> {
    const response = await api.get(`/api/admin/payments/transactions/${paymentId}/invoice`, {
      responseType: 'blob'
    });
    return response.data;
  },

  /**
   * Download PDF invoice for a wallet transaction
   */
  async adminDownloadWalletInvoice(transactionId: number): Promise<Blob> {
    const response = await api.get(`/api/admin/payments/wallet-transactions/${transactionId}/invoice`, {
      responseType: 'blob'
    });
    return response.data;
  }
};
