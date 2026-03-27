export type TopupPaymentType = 'WALLET_TOPUP';
export type TopupPaymentMethod = 'PAYOS';

export interface CreatePaymentRequest {
  amount: string;
  currency?: 'VND';
  type: TopupPaymentType;
  paymentMethod: TopupPaymentMethod;
  description?: string;
  planId?: number;
  metadata?: string;
  successUrl?: string;
  cancelUrl?: string;
}

export interface CreatePaymentResponse {
  transactionReference: string;
  checkoutUrl: string;
  gatewayReferenceId: string;
  qrCodeUrl?: string;
  deepLinkUrl?: string;
  expiresAt?: string;
  message: string;
}

export interface PaymentTransactionResponse {
  id: number;
  userId: number;
  userName?: string;
  userEmail?: string;
  userAvatarUrl?: string;
  internalReference: string;
  referenceId?: string;
  amount: string;
  currency: string;
  type: string;
  paymentMethod: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REFUNDED';
  description?: string;
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
}
