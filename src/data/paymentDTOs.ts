export interface CreatePaymentRequest {
  amount: string;
  currency?: 'VND' | 'USD';
  type: 'PREMIUM_SUBSCRIPTION' | 'COURSE_PURCHASE' | 'WALLET_TOPUP' | 'REFUND';
  paymentMethod: 'PAYOS';
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
