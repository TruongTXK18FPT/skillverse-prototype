/**
 * Wallet Service - API calls for MyWallet system
 * All endpoints are protected and require JWT authentication
 */

import axiosInstance from "./axiosInstance";
import {
  WalletResponse,
  WalletTransactionResponse,
  WithdrawalRequestResponse,
  DepositRequest,
  PurchaseCoinsRequest,
  WithdrawalRequest,
  UpdateBankAccountRequest,
  SetTransactionPinRequest,
  CoinPackage,
  WalletStatistics,
  CreatePaymentResponse,
} from "../data/walletDTOs";

// Helper type for axios error handling
type AxiosError = { response?: { data?: { message?: string } } };

class WalletService {
  // ==================== WALLET INFO ====================

  /**
   * Get current user's wallet information
   * GET /api/wallet/my-wallet
   */
  async getMyWallet(): Promise<WalletResponse> {
    try {
      const response =
        await axiosInstance.get<WalletResponse>("/wallet/my-wallet");
      return response.data;
    } catch (error: unknown) {
      console.error("❌ Get wallet error:", error);
      console.error("❌ Error details:", (error as any).response?.data);
      const errorMessage =
        (error as AxiosError).response?.data?.message ||
        "Không thể tải thông tin ví.";
      throw new Error(errorMessage);
    }
  }

  // ==================== DEPOSIT ====================

  /**
   * Create wallet top-up request (PayOS)
   * POST /api/wallet/deposit
   */
  async createDeposit(request: DepositRequest): Promise<CreatePaymentResponse> {
    try {
      const response = await axiosInstance.post<CreatePaymentResponse>(
        "/wallet/deposit",
        request,
      );

      return response.data;
    } catch (error: unknown) {
      console.error("❌ Create deposit error:", error);
      const errorMessage =
        (error as AxiosError).response?.data?.message ||
        "Tạo yêu cầu nạp tiền thất bại.";
      throw new Error(errorMessage);
    }
  }

  // ==================== COIN PURCHASE ====================

  /**
   * Purchase coins with wallet cash
   * POST /api/wallet/coins/purchase-with-cash
   */
  async purchaseCoinsWithCash(request: PurchaseCoinsRequest): Promise<{
    success: boolean;
    message: string;
    transaction: WalletTransactionResponse;
    newCoinBalance: number;
    newCashBalance: number;
  }> {
    try {
      // Ensure paymentMethod is set to WALLET_CASH
      const payload = {
        ...request,
        paymentMethod: "WALLET_CASH",
      };
      const response = await axiosInstance.post(
        "/wallet/coins/purchase-with-cash",
        payload,
      );

      return response.data;
    } catch (error: unknown) {
      console.error("❌ Purchase coins error:", error);
      const errorMessage =
        (error as AxiosError).response?.data?.message || "Mua xu thất bại.";
      throw new Error(errorMessage);
    }
  }

  /**
   * Get available coin packages
   * GET /api/wallet/coins/packages
   */
  async getCoinPackages(): Promise<CoinPackage[]> {
    try {
      const response = await axiosInstance.get<CoinPackage[]>(
        "/wallet/coins/packages",
      );

      return response.data;
    } catch (error: unknown) {
      console.error("❌ Get coin packages error:", error);
      const errorMessage =
        (error as AxiosError).response?.data?.message ||
        "Không thể tải gói xu.";
      throw new Error(errorMessage);
    }
  }

  /**
   * Calculate coin price for custom amount
   * GET /api/wallet/coins/calculate-price?coinAmount=100
   */
  async calculateCoinPrice(coinAmount: number): Promise<{
    coinAmount: number;
    price: number;
    pricePerCoin: number;
  }> {
    try {
      const response = await axiosInstance.get(
        "/wallet/coins/calculate-price",
        {
          params: { coinAmount },
        },
      );
      return response.data;
    } catch (error: unknown) {
      console.error("❌ Calculate coin price error:", error);
      const errorMessage =
        (error as AxiosError).response?.data?.message ||
        "Tính giá xu thất bại.";
      throw new Error(errorMessage);
    }
  }

  // ==================== TRANSACTIONS ====================

  /**
   * Get transaction history with pagination
   * GET /api/wallet/transactions?page=0&size=20
   */
  async getTransactions(
    page: number = 0,
    size: number = 20,
  ): Promise<{
    content: WalletTransactionResponse[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
  }> {
    try {
      const response = await axiosInstance.get("/wallet/transactions", {
        params: { page, size },
      });

      return response.data;
    } catch (error: unknown) {
      console.error("❌ Get transactions error:", error);
      const errorMessage =
        (error as AxiosError).response?.data?.message ||
        "Không thể tải lịch sử giao dịch.";
      throw new Error(errorMessage);
    }
  }

  /**
   * Get transaction detail
   * GET /api/wallet/transactions/{id}
   */
  async getTransactionDetail(id: number): Promise<WalletTransactionResponse> {
    try {
      const response = await axiosInstance.get<WalletTransactionResponse>(
        `/wallet/transactions/${id}`,
      );
      return response.data;
    } catch (error: unknown) {
      console.error("❌ Get transaction detail error:", error);
      const errorMessage =
        (error as AxiosError).response?.data?.message ||
        "Không thể tải chi tiết giao dịch.";
      throw new Error(errorMessage);
    }
  }

  // ==================== WITHDRAWAL ====================

  /**
   * Create withdrawal request
   * POST /api/wallet/withdraw/request
   */
  async createWithdrawalRequest(
    request: WithdrawalRequest,
  ): Promise<WithdrawalRequestResponse> {
    try {
      const response = await axiosInstance.post<WithdrawalRequestResponse>(
        "/wallet/withdraw/request",
        request,
      );

      return response.data;
    } catch (error: unknown) {
      console.error("❌ Create withdrawal error:", error);
      const errorMessage =
        (error as AxiosError).response?.data?.message ||
        "Tạo yêu cầu rút tiền thất bại.";
      throw new Error(errorMessage);
    }
  }

  /**
   * Get my withdrawal requests with pagination
   * GET /api/wallet/withdraw/my-requests?page=0&size=20
   */
  async getMyWithdrawalRequests(
    page: number = 0,
    size: number = 20,
  ): Promise<{
    content: WithdrawalRequestResponse[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
  }> {
    try {
      const response = await axiosInstance.get("/wallet/withdraw/my-requests", {
        params: { page, size },
      });

      return response.data;
    } catch (error: unknown) {
      console.error("❌ Get withdrawal requests error:", error);
      const errorMessage =
        (error as AxiosError).response?.data?.message ||
        "Không thể tải lịch sử rút tiền.";
      throw new Error(errorMessage);
    }
  }

  /**
   * Get withdrawal request detail
   * GET /api/wallet/withdraw/{id}
   */
  async getWithdrawalDetail(id: number): Promise<WithdrawalRequestResponse> {
    try {
      const response = await axiosInstance.get<WithdrawalRequestResponse>(
        `/wallet/withdraw/${id}`,
      );
      return response.data;
    } catch (error: unknown) {
      console.error("❌ Get withdrawal detail error:", error);
      const errorMessage =
        (error as AxiosError).response?.data?.message ||
        "Không thể tải chi tiết yêu cầu rút tiền.";
      throw new Error(errorMessage);
    }
  }

  /**
   * Cancel withdrawal request
   * PUT /api/wallet/withdraw/{id}/cancel
   */
  async cancelWithdrawalRequest(
    id: number,
    reason?: string,
  ): Promise<WithdrawalRequestResponse> {
    try {
      const response = await axiosInstance.put<WithdrawalRequestResponse>(
        `/wallet/withdraw/${id}/cancel`,
        {
          reason,
        },
      );

      return response.data;
    } catch (error: unknown) {
      console.error("❌ Cancel withdrawal error:", error);
      const errorMessage =
        (error as AxiosError).response?.data?.message ||
        "Hủy yêu cầu rút tiền thất bại.";
      throw new Error(errorMessage);
    }
  }

  // ==================== ADMIN - WITHDRAWAL MANAGEMENT ====================

  /**
   * Admin: Get all wallet transactions (system-wide)
   * GET /api/admin/wallet/transactions?page=0&size=50&type=PURCHASE_PREMIUM
   */
  async adminGetAllWalletTransactions(
    page: number = 0,
    size: number = 50,
    type?: string,
  ): Promise<{
    content: WalletTransactionResponse[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
  }> {
    try {
      const params: any = { page, size };
      if (type && type !== "ALL") {
        params.type = type;
      }

      const response = await axiosInstance.get("/admin/wallet/transactions", {
        params,
      });

      return response.data;
    } catch (error: unknown) {
      console.error("❌ [Admin] Get wallet transactions error:", error);
      const errorMessage =
        (error as AxiosError).response?.data?.message ||
        "Không thể tải danh sách giao dịch ví.";
      throw new Error(errorMessage);
    }
  }

  /**
   * Admin: Get all withdrawal requests with filtering
   * GET /api/admin/wallet/withdrawals?page=0&size=50&status=PENDING
   */
  async adminGetWithdrawalRequests(
    page: number = 0,
    size: number = 50,
    status?: string,
  ): Promise<{
    content: WithdrawalRequestResponse[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
  }> {
    try {
      const params: any = { page, size };
      if (status && status !== "ALL") {
        params.status = status;
      }

      const response = await axiosInstance.get("/admin/wallet/withdrawals", {
        params,
      });

      return response.data;
    } catch (error: unknown) {
      console.error("❌ [Admin] Get withdrawal requests error:", error);
      const errorMessage =
        (error as AxiosError).response?.data?.message ||
        "Không thể tải danh sách yêu cầu rút tiền.";
      throw new Error(errorMessage);
    }
  }

  /**
   * Admin: Get withdrawal request detail
   * GET /api/admin/wallet/withdrawals/{id}
   */
  async adminGetWithdrawalDetail(
    id: number,
  ): Promise<WithdrawalRequestResponse> {
    try {
      const response = await axiosInstance.get<WithdrawalRequestResponse>(
        `/admin/wallet/withdrawals/${id}`,
      );

      return response.data;
    } catch (error: unknown) {
      console.error("❌ [Admin] Get withdrawal detail error:", error);
      const errorMessage =
        (error as AxiosError).response?.data?.message ||
        "Không thể tải chi tiết yêu cầu rút tiền.";
      throw new Error(errorMessage);
    }
  }

  /**
   * Admin: Approve withdrawal request
   * PUT /api/admin/wallet/withdrawals/{id}/approve
   */
  async adminApproveWithdrawal(
    id: number,
    adminNotes?: string,
  ): Promise<WithdrawalRequestResponse> {
    try {
      const response = await axiosInstance.put<WithdrawalRequestResponse>(
        `/admin/wallet/withdrawals/${id}/approve`,
        { adminNotes },
      );

      return response.data;
    } catch (error: unknown) {
      console.error("❌ [Admin] Approve withdrawal error:", error);
      const errorMessage =
        (error as AxiosError).response?.data?.message ||
        "Không thể duyệt yêu cầu rút tiền.";
      throw new Error(errorMessage);
    }
  }

  /**
   * Admin: Reject withdrawal request
   * PUT /api/admin/wallet/withdrawals/{id}/reject
   */
  async adminRejectWithdrawal(
    id: number,
    adminNotes: string,
  ): Promise<WithdrawalRequestResponse> {
    try {
      const response = await axiosInstance.put<WithdrawalRequestResponse>(
        `/admin/wallet/withdrawals/${id}/reject`,
        { adminNotes },
      );

      return response.data;
    } catch (error: unknown) {
      console.error("❌ [Admin] Reject withdrawal error:", error);
      const errorMessage =
        (error as AxiosError).response?.data?.message ||
        "Không thể từ chối yêu cầu rút tiền.";
      throw new Error(errorMessage);
    }
  }

  /**
   * Admin: Mark withdrawal as completed
   * PUT /api/admin/wallet/withdrawals/{id}/complete
   */
  async adminCompleteWithdrawal(
    id: number,
    adminNotes?: string,
  ): Promise<WithdrawalRequestResponse> {
    try {
      const response = await axiosInstance.put<WithdrawalRequestResponse>(
        `/admin/wallet/withdrawals/${id}/complete`,
        { adminNotes },
      );

      return response.data;
    } catch (error: unknown) {
      console.error("❌ [Admin] Complete withdrawal error:", error);
      const errorMessage =
        (error as AxiosError).response?.data?.message ||
        "Không thể hoàn thành yêu cầu rút tiền.";
      throw new Error(errorMessage);
    }
  }

  /**
   * Admin: Gift cash/coins to user
   * POST /api/admin/wallet/users/gift
   */
  async adminGiftUser(request: {
    userId: number;
    cashAmount: number;
    coinAmount: number;
    reason: string;
  }): Promise<WalletTransactionResponse> {
    try {
      const response = await axiosInstance.post<WalletTransactionResponse>(
        "/admin/wallet/users/gift",
        request,
      );
      return response.data;
    } catch (error: unknown) {
      console.error("❌ [Admin] Gift user error:", error);
      const errorMessage =
        (error as AxiosError).response?.data?.message || "Tặng quà thất bại.";
      throw new Error(errorMessage);
    }
  }

  // ==================== SETTINGS ====================

  /**
   * Set/update transaction PIN
   * PUT /api/wallet/pin
   */
  async setTransactionPin(
    request: SetTransactionPinRequest,
  ): Promise<{ message: string }> {
    try {
      const response = await axiosInstance.put("/wallet/pin", request);

      return response.data;
    } catch (error: unknown) {
      console.error("❌ Set PIN error:", error);
      const errorMessage =
        (error as AxiosError).response?.data?.message ||
        "Cài đặt mã PIN thất bại.";
      throw new Error(errorMessage);
    }
  }

  /**
   * Update bank account info
   * PUT /api/wallet/bank-account
   */
  async updateBankAccount(
    request: UpdateBankAccountRequest,
  ): Promise<{ message: string }> {
    try {
      const response = await axiosInstance.put("/wallet/bank-account", request);

      return response.data;
    } catch (error: unknown) {
      console.error("❌ Update bank account error:", error);
      const errorMessage =
        (error as AxiosError).response?.data?.message ||
        "Cập nhật tài khoản ngân hàng thất bại.";
      throw new Error(errorMessage);
    }
  }

  /**
   * Toggle 2FA for withdrawals
   * PUT /api/wallet/2fa
   */
  async toggle2FA(
    enabled: boolean,
  ): Promise<{ message: string; enabled: boolean }> {
    try {
      const response = await axiosInstance.put("/wallet/2fa", { enabled });

      return response.data;
    } catch (error: unknown) {
      console.error("❌ Toggle 2FA error:", error);
      const errorMessage =
        (error as AxiosError).response?.data?.message ||
        "Cài đặt 2FA thất bại.";
      throw new Error(errorMessage);
    }
  }

  // ==================== STATISTICS ====================

  /**
   * Get wallet statistics
   * GET /api/wallet/statistics
   */
  async getStatistics(): Promise<WalletStatistics> {
    try {
      const response =
        await axiosInstance.get<WalletStatistics>("/wallet/statistics");

      return response.data;
    } catch (error: unknown) {
      console.error("❌ Get statistics error:", error);
      const errorMessage =
        (error as AxiosError).response?.data?.message ||
        "Không thể tải thống kê ví.";
      throw new Error(errorMessage);
    }
  }

  /**
   * Alias for getStatistics
   */
  async getWalletStatistics(): Promise<WalletStatistics> {
    return this.getStatistics();
  }

  /**
   * Alias for getTransactions (for backward compatibility)
   */
  async getTransactionHistory(
    page: number = 0,
    size: number = 20,
  ): Promise<{
    content: WalletTransactionResponse[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
  }> {
    return this.getTransactions(page, size);
  }

  /**
   * Download transaction invoice PDF
   * GET /api/wallet/transactions/{id}/invoice
   */
  async downloadTransactionInvoice(transactionId: number): Promise<Blob> {
    try {
      const response = await axiosInstance.get(
        `/wallet/transactions/${transactionId}/invoice`,
        {
          responseType: "blob",
        },
      );
      return response.data;
    } catch (error: unknown) {
      console.error("❌ Download invoice error:", error);
      const errorMessage =
        (error as AxiosError).response?.data?.message ||
        "Không thể tải hóa đơn.";
      throw new Error(errorMessage);
    }
  }
}

export default new WalletService();
