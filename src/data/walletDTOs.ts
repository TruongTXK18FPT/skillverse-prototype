/**
 * Wallet DTOs for MyWallet System
 * Matching backend WalletResponse, WalletTransactionResponse, WithdrawalRequestResponse
 */

// ==================== WALLET RESPONSE ====================

export interface WalletResponse {
  walletId: number;
  userId: number;
  cashBalance: number; // VNĐ (withdrawable)
  coinBalance: number; // SkillCoin (non-withdrawable)
  totalDeposited: number;
  totalWithdrawn: number;
  totalCoinsEarned: number;
  totalCoinsSpent: number;
  status: WalletStatus;
  hasBankAccount: boolean;
  hasTransactionPin: boolean;
  require2FA: boolean;
  createdAt: string;
  updatedAt: string;
}

export enum WalletStatus {
  ACTIVE = 'ACTIVE',
  LOCKED = 'LOCKED',
  SUSPENDED = 'SUSPENDED'
}

// ==================== TRANSACTION RESPONSE ====================

export interface WalletTransactionResponse {
  transactionId: number;
  walletId: number;
  type: TransactionType;
  amount: number; // Cash amount
  coinAmount?: number; // Coin amount (if applicable)
  description: string;
  status: TransactionStatus;
  createdAt: string;
  metadata?: {
    packageId?: string;
    paymentCode?: string;
    orderId?: string;
    [key: string]: any;
  };
}

export enum TransactionType {
  DEPOSIT = 'DEPOSIT',
  COIN_PURCHASE = 'COIN_PURCHASE',
  COIN_EARN = 'COIN_EARN',
  COIN_SPEND = 'COIN_SPEND',
  WITHDRAWAL = 'WITHDRAWAL',
  REFUND = 'REFUND'
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

// ==================== WITHDRAWAL REQUEST ====================

export interface WithdrawalRequestResponse {
  requestId: number;
  requestCode: string;
  walletId: number;
  userId: number;
  userFullName?: string;
  userEmail: string;
  userAvatarUrl?: string;
  amount: number;
  fee: number;
  netAmount: number;
  status: string;
  statusDisplayName?: string;
  statusDescription?: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  bankBranch?: string;
  reason?: string;
  userNotes?: string;
  pinVerified?: boolean;
  twoFAVerified?: boolean;
  approvedByUserId?: number;
  approvedByName?: string;
  approvedAt?: string;
  adminNotes?: string;
  rejectionReason?: string;
  bankTransactionId?: string;
  completedAt?: string;
  priority?: number;
  retryCount?: number;
  errorMessage?: string;
  requestIp?: string;
  requestDevice?: string;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  processedAt?: string;
  canCancel?: boolean;
  isExpired?: boolean;
}

export enum WithdrawalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

// ==================== REQUEST DTOs ====================

export interface DepositRequest {
  amount: number;
  paymentMethod: 'PAYOS';
  returnUrl: string;
  cancelUrl: string;
}

export interface PurchaseCoinsRequest {
  coinAmount: number;
  paymentMethod: 'WALLET_CASH' | 'PAYOS';
  packageId?: string;
  returnUrl?: string; // For PayOS payment
  cancelUrl?: string; // For PayOS payment
}

export interface WithdrawalRequest {
  amount: number;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  bankBranch?: string;
  transactionPin: string;
  otp?: string; // If 2FA enabled
}

export interface UpdateBankAccountRequest {
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  bankBranch?: string;
}

export interface SetTransactionPinRequest {
  oldPin?: string;
  newPin: string;
}

export interface Toggle2FARequest {
  enabled: boolean;
}

// ==================== COIN PACKAGE ====================

export interface CoinPackage {
  id: string;
  coins: number;
  price: number; // VNĐ
  bonus: number; // Bonus coins
  discount: number; // Discount percentage
  title: string;
  description: string;
  popular: boolean;
  special: boolean;
  limitedTime: boolean;
  color: string;
  glowColor: string;
}

// ==================== STATISTICS ====================

export interface WalletStatistics {
  totalDeposited: number;
  totalWithdrawn: number;
  totalCoinsEarned: number;
  totalCoinsSpent: number;
  transactionCount: number;
  withdrawalCount: number;
  avgTransactionAmount: number;
  lastTransactionDate?: string;
  lastWithdrawalDate?: string;
}

// ==================== PAYMENT RESPONSE ====================

export interface CreatePaymentResponse {
  code: string;
  desc: string;
  data: {
    bin: string;
    accountNumber: string;
    accountName: string;
    amount: number;
    description: string;
    orderCode: number;
    currency: string;
    paymentLinkId: string;
    status: string;
    checkoutUrl: string;
    qrCode: string;
  };
  signature: string;
}
