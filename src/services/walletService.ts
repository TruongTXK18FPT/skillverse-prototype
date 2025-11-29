/**
 * Wallet Service - API calls for MyWallet system
 * All endpoints are protected and require JWT authentication
 */

import axiosInstance from './axiosInstance';
import {
  WalletResponse,
  WalletTransactionResponse,
  WithdrawalRequestResponse,
  DepositRequest,
  PurchaseCoinsRequest,
  WithdrawalRequest,
  UpdateBankAccountRequest,
  SetTransactionPinRequest,
  Toggle2FARequest,
  CoinPackage,
  WalletStatistics,
  CreatePaymentResponse
} from '../data/walletDTOs';

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
      console.log('🔍 Fetching wallet data...');
      console.log('📍 Token present:', !!localStorage.getItem('accessToken'));
      console.log('📍 User data:', localStorage.getItem('user'));
      
      const response = await axiosInstance.get<WalletResponse>('/wallet/my-wallet');
      console.log('✅ Wallet data loaded:', response.data);
      return response.data;
    } catch (error: unknown) {
      console.error('❌ Get wallet error:', error);
      console.error('❌ Error details:', (error as any).response?.data);
      const errorMessage = (error as AxiosError).response?.data?.message || 'Không thể tải thông tin ví.';
      throw new Error(errorMessage);
    }
  }

  // ==================== DEPOSIT ====================
  
  /**
   * Create deposit request (PayOS payment)
   * POST /api/wallet/deposit
   */
  async createDeposit(request: DepositRequest): Promise<CreatePaymentResponse> {
    try {
      console.log('💰 Creating deposit request:', request);
      const response = await axiosInstance.post<CreatePaymentResponse>('/wallet/deposit', request);
      console.log('✅ Deposit request created:', response.data);
      return response.data;
    } catch (error: unknown) {
      console.error('❌ Create deposit error:', error);
      const errorMessage = (error as AxiosError).response?.data?.message || 'Tạo yêu cầu nạp tiền thất bại.';
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
      console.log('🪙 Purchasing coins with cash:', request);
      // Ensure paymentMethod is set to WALLET_CASH
      const payload = {
        ...request,
        paymentMethod: 'WALLET_CASH'
      };
      const response = await axiosInstance.post('/wallet/coins/purchase-with-cash', payload);
      console.log('✅ Coins purchased successfully:', response.data);
      return response.data;
    } catch (error: unknown) {
      console.error('❌ Purchase coins error:', error);
      const errorMessage = (error as AxiosError).response?.data?.message || 'Mua xu thất bại.';
      throw new Error(errorMessage);
    }
  }

  /**
   * Purchase coins with PayOS payment
   * POST /api/wallet/coins/purchase-with-payos
   */
  async purchaseCoinsWithPayOS(request: PurchaseCoinsRequest): Promise<CreatePaymentResponse> {
    try {
      console.log('🪙 Creating PayOS coin purchase:', request);
      // Ensure paymentMethod is set to PAYOS
      const payload = {
        ...request,
        paymentMethod: 'PAYOS'
      };
      const response = await axiosInstance.post<CreatePaymentResponse>('/wallet/coins/purchase-with-payos', payload);
      console.log('✅ PayOS payment created:', response.data);
      return response.data;
    } catch (error: unknown) {
      console.error('❌ Purchase coins with PayOS error:', error);
      const errorMessage = (error as AxiosError).response?.data?.message || 'Tạo thanh toán mua xu thất bại.';
      throw new Error(errorMessage);
    }
  }

  /**
   * Get available coin packages
   * GET /api/wallet/coins/packages
   */
  async getCoinPackages(): Promise<CoinPackage[]> {
    try {
      console.log('📦 Fetching coin packages...');
      const response = await axiosInstance.get<CoinPackage[]>('/wallet/coins/packages');
      console.log('✅ Coin packages loaded:', response.data.length, 'packages');
      return response.data;
    } catch (error: unknown) {
      console.error('❌ Get coin packages error:', error);
      const errorMessage = (error as AxiosError).response?.data?.message || 'Không thể tải gói xu.';
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
      const response = await axiosInstance.get('/wallet/coins/calculate-price', {
        params: { coinAmount }
      });
      return response.data;
    } catch (error: unknown) {
      console.error('❌ Calculate coin price error:', error);
      const errorMessage = (error as AxiosError).response?.data?.message || 'Tính giá xu thất bại.';
      throw new Error(errorMessage);
    }
  }

  // ==================== TRANSACTIONS ====================
  
  /**
   * Get transaction history with pagination
   * GET /api/wallet/transactions?page=0&size=20
   */
  async getTransactions(page: number = 0, size: number = 20): Promise<{
    content: WalletTransactionResponse[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
  }> {
    try {
      console.log(`📜 Fetching transactions (page ${page}, size ${size})...`);
      const response = await axiosInstance.get('/wallet/transactions', {
        params: { page, size }
      });
      console.log('✅ Transactions loaded:', response.data.content.length, 'items');
      return response.data;
    } catch (error: unknown) {
      console.error('❌ Get transactions error:', error);
      const errorMessage = (error as AxiosError).response?.data?.message || 'Không thể tải lịch sử giao dịch.';
      throw new Error(errorMessage);
    }
  }

  /**
   * Get transaction detail
   * GET /api/wallet/transactions/{id}
   */
  async getTransactionDetail(id: number): Promise<WalletTransactionResponse> {
    try {
      const response = await axiosInstance.get<WalletTransactionResponse>(`/wallet/transactions/${id}`);
      return response.data;
    } catch (error: unknown) {
      console.error('❌ Get transaction detail error:', error);
      const errorMessage = (error as AxiosError).response?.data?.message || 'Không thể tải chi tiết giao dịch.';
      throw new Error(errorMessage);
    }
  }

  // ==================== WITHDRAWAL ====================
  
  /**
   * Create withdrawal request
   * POST /api/wallet/withdraw/request
   */
  async createWithdrawalRequest(request: WithdrawalRequest): Promise<WithdrawalRequestResponse> {
    try {
      console.log('💸 Creating withdrawal request:', { ...request, transactionPin: '***' });
      const response = await axiosInstance.post<WithdrawalRequestResponse>('/wallet/withdraw/request', request);
      console.log('✅ Withdrawal request created:', response.data);
      return response.data;
    } catch (error: unknown) {
      console.error('❌ Create withdrawal error:', error);
      const errorMessage = (error as AxiosError).response?.data?.message || 'Tạo yêu cầu rút tiền thất bại.';
      throw new Error(errorMessage);
    }
  }

  /**
   * Get my withdrawal requests with pagination
   * GET /api/wallet/withdraw/my-requests?page=0&size=20
   */
  async getMyWithdrawalRequests(page: number = 0, size: number = 20): Promise<{
    content: WithdrawalRequestResponse[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
  }> {
    try {
      console.log(`💸 Fetching withdrawal requests (page ${page}, size ${size})...`);
      const response = await axiosInstance.get('/wallet/withdraw/my-requests', {
        params: { page, size }
      });
      console.log('✅ Withdrawal requests loaded:', response.data.content.length, 'items');
      return response.data;
    } catch (error: unknown) {
      console.error('❌ Get withdrawal requests error:', error);
      const errorMessage = (error as AxiosError).response?.data?.message || 'Không thể tải lịch sử rút tiền.';
      throw new Error(errorMessage);
    }
  }

  /**
   * Get withdrawal request detail
   * GET /api/wallet/withdraw/{id}
   */
  async getWithdrawalDetail(id: number): Promise<WithdrawalRequestResponse> {
    try {
      const response = await axiosInstance.get<WithdrawalRequestResponse>(`/wallet/withdraw/${id}`);
      return response.data;
    } catch (error: unknown) {
      console.error('❌ Get withdrawal detail error:', error);
      const errorMessage = (error as AxiosError).response?.data?.message || 'Không thể tải chi tiết yêu cầu rút tiền.';
      throw new Error(errorMessage);
    }
  }

  /**
   * Cancel withdrawal request
   * PUT /api/wallet/withdraw/{id}/cancel
   */
  async cancelWithdrawalRequest(id: number, reason?: string): Promise<WithdrawalRequestResponse> {
    try {
      console.log(`🚫 Cancelling withdrawal request ${id}:`, reason);
      const response = await axiosInstance.put<WithdrawalRequestResponse>(`/wallet/withdraw/${id}/cancel`, {
        reason
      });
      console.log('✅ Withdrawal request cancelled:', response.data);
      return response.data;
    } catch (error: unknown) {
      console.error('❌ Cancel withdrawal error:', error);
      const errorMessage = (error as AxiosError).response?.data?.message || 'Hủy yêu cầu rút tiền thất bại.';
      throw new Error(errorMessage);
    }
  }

  // ==================== INVOICE DOWNLOAD ====================

  /**
   * Download invoice PDF for a wallet transaction
   * GET /api/wallet/transactions/{id}/invoice
   */
  async downloadTransactionInvoice(transactionId: number): Promise<Blob> {
    try {
      console.log('📄 Downloading invoice for transaction:', transactionId);
      const response = await axiosInstance.get(`/wallet/transactions/${transactionId}/invoice`, {
        responseType: 'blob'
      });
      console.log('✅ Invoice downloaded successfully');
      return response.data;
    } catch (error: unknown) {
      console.error('❌ Download invoice error:', error);
      const errorMessage = (error as AxiosError).response?.data?.message || 'Không thể tải hóa đơn.';
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
    type?: string
  ): Promise<{
    content: WalletTransactionResponse[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
  }> {
    try {
      const params: any = { page, size };
      if (type && type !== 'ALL') {
        params.type = type;
      }
      console.log('🔍 [Admin] Fetching wallet transactions with params:', params);
      const response = await axiosInstance.get('/admin/wallet/transactions', { params });
      console.log('✅ [Admin] Wallet transactions loaded:', response.data.content?.length || 0, 'items');
      return response.data;
    } catch (error: unknown) {
      console.error('❌ [Admin] Get wallet transactions error:', error);
      const errorMessage = (error as AxiosError).response?.data?.message || 'Không thể tải danh sách giao dịch ví.';
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
    status?: string
  ): Promise<{
    content: WithdrawalRequestResponse[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
  }> {
    try {
      const params: any = { page, size };
      if (status && status !== 'ALL') {
        params.status = status;
      }
      console.log('🔍 [Admin] Fetching withdrawal requests with params:', params);
      const response = await axiosInstance.get('/admin/wallet/withdrawals', { params });
      console.log('✅ [Admin] Withdrawal requests loaded:', response.data.content?.length || 0, 'items');
      return response.data;
    } catch (error: unknown) {
      console.error('❌ [Admin] Get withdrawal requests error:', error);
      const errorMessage = (error as AxiosError).response?.data?.message || 'Không thể tải danh sách yêu cầu rút tiền.';
      throw new Error(errorMessage);
    }
  }

  /**
   * Admin: Get withdrawal request detail
   * GET /api/admin/wallet/withdrawals/{id}
   */
  async adminGetWithdrawalDetail(id: number): Promise<WithdrawalRequestResponse> {
    try {
      console.log(`🔍 [Admin] Fetching withdrawal detail: ${id}`);
      const response = await axiosInstance.get<WithdrawalRequestResponse>(`/admin/wallet/withdrawals/${id}`);
      console.log('✅ [Admin] Withdrawal detail loaded:', response.data.requestCode);
      return response.data;
    } catch (error: unknown) {
      console.error('❌ [Admin] Get withdrawal detail error:', error);
      const errorMessage = (error as AxiosError).response?.data?.message || 'Không thể tải chi tiết yêu cầu rút tiền.';
      throw new Error(errorMessage);
    }
  }

  /**
   * Admin: Approve withdrawal request
   * PUT /api/admin/wallet/withdrawals/{id}/approve
   */
  async adminApproveWithdrawal(id: number, adminNotes?: string): Promise<WithdrawalRequestResponse> {
    try {
      console.log(`✅ [Admin] Approving withdrawal: ${id}`);
      const response = await axiosInstance.put<WithdrawalRequestResponse>(
        `/admin/wallet/withdrawals/${id}/approve`,
        { adminNotes }
      );
      console.log('✅ [Admin] Withdrawal approved:', response.data.requestCode);
      return response.data;
    } catch (error: unknown) {
      console.error('❌ [Admin] Approve withdrawal error:', error);
      const errorMessage = (error as AxiosError).response?.data?.message || 'Không thể duyệt yêu cầu rút tiền.';
      throw new Error(errorMessage);
    }
  }

  /**
   * Admin: Reject withdrawal request
   * PUT /api/admin/wallet/withdrawals/{id}/reject
   */
  async adminRejectWithdrawal(id: number, adminNotes: string): Promise<WithdrawalRequestResponse> {
    try {
      console.log(`❌ [Admin] Rejecting withdrawal: ${id}`);
      const response = await axiosInstance.put<WithdrawalRequestResponse>(
        `/admin/wallet/withdrawals/${id}/reject`,
        { adminNotes }
      );
      console.log('✅ [Admin] Withdrawal rejected:', response.data.requestCode);
      return response.data;
    } catch (error: unknown) {
      console.error('❌ [Admin] Reject withdrawal error:', error);
      const errorMessage = (error as AxiosError).response?.data?.message || 'Không thể từ chối yêu cầu rút tiền.';
      throw new Error(errorMessage);
    }
  }

  /**
   * Admin: Mark withdrawal as completed
   * PUT /api/admin/wallet/withdrawals/{id}/complete
   */
  async adminCompleteWithdrawal(id: number, adminNotes?: string): Promise<WithdrawalRequestResponse> {
    try {
      console.log(`✅ [Admin] Completing withdrawal: ${id}`);
      const response = await axiosInstance.put<WithdrawalRequestResponse>(
        `/admin/wallet/withdrawals/${id}/complete`,
        { adminNotes }
      );
      console.log('✅ [Admin] Withdrawal completed:', response.data.requestCode);
      return response.data;
    } catch (error: unknown) {
      console.error('❌ [Admin] Complete withdrawal error:', error);
      const errorMessage = (error as AxiosError).response?.data?.message || 'Không thể hoàn thành yêu cầu rút tiền.';
      throw new Error(errorMessage);
    }
  }

  // ==================== SETTINGS ====================
  
  /**
   * Set/update transaction PIN
   * PUT /api/wallet/pin
   */
  async setTransactionPin(request: SetTransactionPinRequest): Promise<{ message: string }> {
    try {
      console.log('🔒 Setting transaction PIN...');
      const response = await axiosInstance.put('/wallet/pin', request);
      console.log('✅ Transaction PIN set successfully');
      return response.data;
    } catch (error: unknown) {
      console.error('❌ Set PIN error:', error);
      const errorMessage = (error as AxiosError).response?.data?.message || 'Cài đặt mã PIN thất bại.';
      throw new Error(errorMessage);
    }
  }

  /**
   * Update bank account info
   * PUT /api/wallet/bank-account
   */
  async updateBankAccount(request: UpdateBankAccountRequest): Promise<{ message: string }> {
    try {
      console.log('🏦 Updating bank account...');
      const response = await axiosInstance.put('/wallet/bank-account', request);
      console.log('✅ Bank account updated successfully');
      return response.data;
    } catch (error: unknown) {
      console.error('❌ Update bank account error:', error);
      const errorMessage = (error as AxiosError).response?.data?.message || 'Cập nhật tài khoản ngân hàng thất bại.';
      throw new Error(errorMessage);
    }
  }

  /**
   * Toggle 2FA for withdrawals
   * PUT /api/wallet/2fa
   */
  async toggle2FA(enabled: boolean): Promise<{ message: string; enabled: boolean }> {
    try {
      console.log(`🔐 ${enabled ? 'Enabling' : 'Disabling'} 2FA...`);
      const response = await axiosInstance.put('/wallet/2fa', { enabled });
      console.log(`✅ 2FA ${enabled ? 'enabled' : 'disabled'} successfully`);
      return response.data;
    } catch (error: unknown) {
      console.error('❌ Toggle 2FA error:', error);
      const errorMessage = (error as AxiosError).response?.data?.message || 'Cài đặt 2FA thất bại.';
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
      console.log('📊 Fetching wallet statistics...');
      const response = await axiosInstance.get<WalletStatistics>('/wallet/statistics');
      console.log('✅ Statistics loaded:', response.data);
      return response.data;
    } catch (error: unknown) {
      console.error('❌ Get statistics error:', error);
      const errorMessage = (error as AxiosError).response?.data?.message || 'Không thể tải thống kê ví.';
      throw new Error(errorMessage);
    }
  }
}

export default new WalletService();
