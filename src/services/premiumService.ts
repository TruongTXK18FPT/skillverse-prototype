import api from './axiosInstance';
import axios from 'axios';
import { PremiumPlan, CreateSubscriptionRequest, UserSubscriptionResponse } from '../data/premiumDTOs';

export const premiumService = {
  async getPremiumPlans(): Promise<PremiumPlan[]> {
    const { data } = await api.get('/api/premium/plans');
    return data;
  },

  async getPlanById(planId: number): Promise<PremiumPlan> {
    const { data } = await api.get(`/api/premium/plans/${planId}`);
    return data;
  },

  async createSubscription(request: CreateSubscriptionRequest): Promise<UserSubscriptionResponse> {
    const { data } = await api.post('/api/premium/subscribe', request);
    return data;
  },

  async getCurrentSubscription(): Promise<UserSubscriptionResponse | null> {
    try {
      const { data } = await api.get('/api/premium/subscription/current');
      return data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  async getSubscriptionHistory(): Promise<UserSubscriptionResponse[]> {
    const { data } = await api.get('/api/premium/subscription/history');
    return data;
  },

  async cancelSubscription(reason?: string): Promise<void> {
    await api.put('/api/premium/subscription/cancel', null, {
      params: { reason }
    });
  },

  async checkPremiumStatus(): Promise<boolean> {
    const { data } = await api.get('/api/premium/status');
    return data;
  },

  async purchaseWithWallet(planId: number, applyStudentDiscount: boolean = false): Promise<UserSubscriptionResponse> {
    const { data } = await api.post('/api/premium/purchase-with-wallet', null, {
      params: { planId, applyStudentDiscount }
    });
    return data;
  }
};
