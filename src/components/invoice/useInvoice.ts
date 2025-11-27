import { useState } from 'react';
import { UserSubscriptionResponse } from '../../data/premiumDTOs';

interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  customerName: string;
  customerEmail: string;
  customerId?: number;
  planName: string;
  planDisplayName: string;
  planType: string;
  planDescription?: string;
  originalPrice: number;
  discount?: number;
  discountReason?: string;
  finalPrice: number;
  currency: string;
  startDate: string;
  endDate: string;
  durationMonths: number;
  paymentMethod: string;
  paymentStatus: 'SUCCESS' | 'PENDING' | 'FAILED';
  transactionId?: string;
  isStudentDiscount?: boolean;
  features?: string[];
}

export const useInvoice = () => {
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);

  const generateInvoiceNumber = (subscriptionId: number, date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `SV${year}${month}${day}-${String(subscriptionId).padStart(6, '0')}`;
  };

  const parseFeatures = (featuresJson: string): string[] => {
    try {
      const parsed = JSON.parse(featuresJson);
      if (Array.isArray(parsed)) return parsed;
      return [];
    } catch {
      return featuresJson ? featuresJson.split(',').map(f => f.trim()) : [];
    }
  };

  const openInvoice = (
    subscription: UserSubscriptionResponse,
    userName: string,
    userEmail: string,
    userId?: number
  ) => {
    const createdDate = new Date(subscription.createdAt);
    const originalPrice = parseFloat(subscription.plan.price);
    
    // Calculate discount if student subscription
    let discount = 0;
    let discountReason = '';
    if (subscription.isStudentSubscription) {
      const discountPercent = parseFloat(subscription.plan.studentDiscountPercent || '0');
      discount = (originalPrice * discountPercent) / 100;
      discountReason = `Giảm ${discountPercent}% cho sinh viên`;
    }

    const data: InvoiceData = {
      invoiceNumber: generateInvoiceNumber(subscription.id, createdDate),
      invoiceDate: subscription.createdAt,
      customerName: userName || subscription.userName || 'Khách hàng',
      customerEmail: userEmail || subscription.userEmail || '',
      customerId: userId || subscription.userId,
      planName: subscription.plan.name,
      planDisplayName: subscription.plan.displayName,
      planType: subscription.plan.planType,
      planDescription: subscription.plan.description,
      originalPrice: originalPrice,
      discount: discount,
      discountReason: discountReason,
      finalPrice: originalPrice - discount,
      currency: subscription.plan.currency,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      durationMonths: subscription.plan.durationMonths,
      paymentMethod: 'PayOS',
      paymentStatus: subscription.status === 'ACTIVE' || subscription.status === 'EXPIRED' ? 'SUCCESS' : 
                     subscription.status === 'PENDING' ? 'PENDING' : 'FAILED',
      transactionId: subscription.paymentTransactionId?.toString(),
      isStudentDiscount: subscription.isStudentSubscription,
      features: parseFeatures(subscription.plan.features)
    };

    setInvoiceData(data);
    setShowInvoice(true);
  };

  const closeInvoice = () => {
    setShowInvoice(false);
    setInvoiceData(null);
  };

  return {
    showInvoice,
    invoiceData,
    openInvoice,
    closeInvoice
  };
};

export type { InvoiceData };
