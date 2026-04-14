import { useState, useEffect, useCallback } from "react";
import jobService from "../services/jobService";
import shortTermJobService from "../services/shortTermJobService";
import contractService from "../services/contractService";
import walletService from "../services/walletService";
import { notificationService } from "../services/notificationService";
import { recruiterSubscriptionService } from "../services/recruiterSubscriptionService";
import { JobPostingResponse } from "../data/jobDTOs";
import { ShortTermJobResponse, ShortTermJobStatus } from "../types/ShortTermJob";
import { ContractListResponse } from "../types/contract";
import { WalletTransactionResponse } from "../data/walletDTOs";

export interface RecruiterStats {
  // Basic counts
  ftTotal: number;
  ftOpen: number;
  ftClosed: number;
  ftApplicants: number;
  stTotal: number;
  stPublished: number;
  stPendingApproval: number;
  stInProgress: number;
  stCompleted: number;
  stApplicants: number;
  totalJobs: number;
  totalApplicants: number;

  // Hires
  totalHires: number;
  pendingCount: number;

  // Application pipeline
  applicationByStatus: Record<string, number>;
  funnelData: FunnelStage[];

  // Spending
  monthlySpending: number;
  lastMonthSpending: number;
  totalSpending: number;
  costPerApplicant: number;
  costPerHire: number;
  spendingByCategory: SpendingCategory[];

  // Effectiveness
  offerAcceptanceRate: number;
  applicationToHireRate: number;
  avgTimeToHire: number; // days
  activePipelineValue: number;

  // Alerts
  expiringJobsCount: number;
  lowQuotaCount: number;
  openDisputesCount: number;
}

export interface FunnelStage {
  status: string;
  label: string;
  count: number;
  color: string;
  rate?: number; // conversion from previous stage
}

export interface SpendingCategory {
  category: string;
  amount: number;
  color: string;
  percentage: number;
}

export interface ActivityItem {
  id: string;
  type: ActivityType;
  icon: React.ReactNode;
  color: string;
  title: string;
  description: string;
  timestamp: Date;
  relatedId?: string;
}

export type ActivityType =
  | "NEW_APPLICATION"
  | "APPLICATION_ACCEPTED"
  | "APPLICATION_REJECTED"
  | "CONTRACT_SIGNED"
  | "JOB_APPROVED"
  | "JOB_REJECTED"
  | "GIG_COMPLETED"
  | "DISPUTE_OPENED"
  | "DISPUTE_RESOLVED"
  | "QUOTA_WARNING"
  | "SUBSCRIPTION"
  | "BOOST_EFFECTIVE";

const FUNNEL_STAGES: FunnelStage[] = [
  { status: "PENDING", label: "Chờ xem xét", count: 0, color: "#94a3b8" },
  { status: "REVIEWED", label: "Đã xem", count: 0, color: "#60a5fa" },
  { status: "ACCEPTED", label: "Đã accept", count: 0, color: "#34d399" },
  { status: "INTERVIEW_SCHEDULED", label: "Phỏng vấn", count: 0, color: "#a78bfa" },
  { status: "INTERVIEWED", label: "Đã phỏng vấn", count: 0, color: "#fb923c" },
  { status: "OFFER_SENT", label: "Đã gửi offer", count: 0, color: "#f472b6" },
  { status: "CONTRACT_SIGNED", label: "Đã tuyển", count: 0, color: "#10b981" },
];


export const useRecruiterStats = (refreshTrigger: number = 0) => {
  const [stats, setStats] = useState<RecruiterStats>({
    ftTotal: 0, ftOpen: 0, ftClosed: 0, ftApplicants: 0,
    stTotal: 0, stPublished: 0, stPendingApproval: 0, stInProgress: 0, stCompleted: 0, stApplicants: 0,
    totalJobs: 0, totalApplicants: 0,
    totalHires: 0, pendingCount: 0,
    applicationByStatus: {},
    funnelData: [],
    monthlySpending: 0, lastMonthSpending: 0, totalSpending: 0,
    costPerApplicant: 0, costPerHire: 0,
    spendingByCategory: [],
    offerAcceptanceRate: 0, applicationToHireRate: 0,
    avgTimeToHire: 0, activePipelineValue: 0,
    expiringJobsCount: 0, lowQuotaCount: 0, openDisputesCount: 0,
  });
  const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const computeStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const [ftJobs, stJobs, contracts, transactions, notifications, subscriptionInfo] =
        await Promise.all([
          jobService.getMyJobs().catch(() => [] as JobPostingResponse[]),
          shortTermJobService.getMyJobs().catch(() => [] as ShortTermJobResponse[]),
          contractService.getMyContracts("EMPLOYER", { suppressError: true }).catch(() => [] as ContractListResponse[]),
          walletService.getTransactions(0, 100).catch(() => ({ content: [] as WalletTransactionResponse[] })),
          notificationService.getUserNotifications(0, 30).catch(() => ({ content: [] })),
          recruiterSubscriptionService.getSubscriptionInfo().catch(() => null),
        ]);

      // Basic counts
      const ftTotal = ftJobs.length;
      const ftOpen = ftJobs.filter((j) => j.status === "OPEN").length;
      const ftClosed = ftJobs.filter((j) => j.status === "CLOSED").length;
      const ftApplicants = ftJobs.reduce((s, j) => s + (j.applicantCount || 0), 0);
      const stTotal = stJobs.length;
      const stPublished = stJobs.filter((j) => j.status === ShortTermJobStatus.PUBLISHED).length;
      const stPendingApproval = stJobs.filter((j) => j.status === ShortTermJobStatus.PENDING_APPROVAL).length;
      const stInProgress = stJobs.filter((j) =>
        [ShortTermJobStatus.IN_PROGRESS, ShortTermJobStatus.SUBMITTED, ShortTermJobStatus.UNDER_REVIEW].includes(j.status)
      ).length;
      const stCompleted = stJobs.filter((j) =>
        [ShortTermJobStatus.COMPLETED, ShortTermJobStatus.PAID].includes(j.status)
      ).length;
      const stApplicants = stJobs.reduce((s, j) => s + (j.applicantCount || 0), 0);
      const totalJobs = ftTotal + stTotal;
      const totalApplicants = ftApplicants + stApplicants;

      // Hires — signed contracts
      const totalHires = contracts.filter((c) => c.status === "SIGNED").length;
      const jobsNeedingReview = ftJobs.filter((j) => j.status === "OPEN" && (j.applicantCount || 0) > 0);
      const pendingCount = jobsNeedingReview.reduce((s, j) => s + (j.applicantCount || 0), 0);

      // Application pipeline — we estimate from job data
      // Since getMyJobs doesn't return per-status breakdown, we derive from job counts
      // Real per-status breakdown requires calling getJobApplicants for each job
      const applicationByStatus: Record<string, number> = {
        PENDING: pendingCount,
        REVIEWED: 0,
        ACCEPTED: 0,
        INTERVIEW_SCHEDULED: 0,
        INTERVIEWED: 0,
        OFFER_SENT: 0,
        OFFER_ACCEPTED: 0,
        OFFER_REJECTED: 0,
        CONTRACT_SIGNED: totalHires,
        REJECTED: 0,
      };

      // Build funnel — approximate from contracts + applicants
      const funnelStages: FunnelStage[] = FUNNEL_STAGES.map((stage) => {
        let count = 0;
        if (stage.status === "PENDING") count = pendingCount;
        else if (stage.status === "CONTRACT_SIGNED") count = totalHires;
        return { ...stage, count };
      });

      // Calculate conversion rates
      for (let i = 1; i < funnelStages.length; i++) {
        const prev = funnelStages[i - 1].count;
        const curr = funnelStages[i].count;
        funnelStages[i].rate = prev > 0 ? Math.round((curr / prev) * 100) : 0;
      }

      // Spending — analyze wallet transactions
      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();
      const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
      const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

      const txList = transactions.content || [];
      const spendingTx = txList.filter(
        (tx) => tx.isDebit && (tx.status === "COMPLETED" || tx.status === "PENDING")
      );

      let monthlySpending = 0;
      let lastMonthSpending = 0;
      let totalSpending = 0;

      spendingTx.forEach((tx) => {
        const d = new Date(tx.createdAt);
        const amt = Math.abs(tx.cashAmount || 0);
        if (amt > 0) {
          totalSpending += amt;
          if (d.getMonth() === thisMonth && d.getFullYear() === thisYear) {
            monthlySpending += amt;
          }
          if (d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear) {
            lastMonthSpending += amt;
          }
        }
      });

      // Categorize spending
      const postingAmt = spendingTx
        .filter((tx) =>
          tx.description?.toLowerCase().includes("tuyển") ||
          tx.description?.toLowerCase().includes("đăng") ||
          tx.referenceType?.toLowerCase().includes("job")
        )
        .reduce((s, tx) => s + Math.abs(tx.cashAmount || 0), 0);
      const boostAmt = spendingTx
        .filter((tx) =>
          tx.description?.toLowerCase().includes("boost") ||
          tx.transactionType?.toLowerCase().includes("boost")
        )
        .reduce((s, tx) => s + Math.abs(tx.cashAmount || 0), 0);
      const subAmt = spendingTx
        .filter((tx) =>
          tx.transactionType?.toLowerCase().includes("premium") ||
          tx.transactionType?.toLowerCase().includes("recruiter") ||
          tx.description?.toLowerCase().includes("gói")
        )
        .reduce((s, tx) => s + Math.abs(tx.cashAmount || 0), 0);

      const spendingByCategory: SpendingCategory[] = [];
      if (postingAmt > 0) spendingByCategory.push({ category: "Đăng tin", amount: postingAmt, color: "#3b82f6", percentage: 0 });
      if (boostAmt > 0) spendingByCategory.push({ category: "Job Boost", amount: boostAmt, color: "#f59e0b", percentage: 0 });
      if (subAmt > 0) spendingByCategory.push({ category: "Subscription", amount: subAmt, color: "#a78bfa", percentage: 0 });
      const otherAmt = totalSpending - postingAmt - boostAmt - subAmt;
      if (otherAmt > 0) spendingByCategory.push({ category: "Khác", amount: otherAmt, color: "#94a3b8", percentage: 0 });

      if (totalSpending > 0) {
        spendingByCategory.forEach((c) => {
          c.percentage = Math.round((c.amount / totalSpending) * 100);
        });
      }

      // Effectiveness metrics
      const offerSentCount = ftApplicants > 0 ? Math.max(1, Math.round(ftApplicants * 0.15)) : 0;
      const offerAcceptanceRate = offerSentCount > 0 ? Math.round((totalHires / offerSentCount) * 100) : 0;
      const applicationToHireRate = totalApplicants > 0 ? Math.round((totalHires / totalApplicants) * 100) : 0;

      // Time to hire — from signed contracts
      let avgTimeToHire = 0;
      const signedContracts = contracts.filter((c) => c.status === "SIGNED");
      if (signedContracts.length > 0) {
        const totalDays = signedContracts.reduce((s, c) => {
          const created = new Date(c.createdAt || now);
          const signed = new Date(c.signedAt || now);
          return s + Math.max(1, Math.round((signed.getTime() - created.getTime()) / 86400000));
        }, 0);
        avgTimeToHire = Math.round(totalDays / signedContracts.length);
      }

      // Active pipeline value — sum of budgets of open jobs
      const activePipelineValue = ftJobs
        .filter((j) => j.status === "OPEN")
        .reduce((s, j) => s + (j.maxBudget || 0), 0);

      // Alerts
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 86400000);
      const expiringJobsCount = ftJobs.filter((j) => {
        if (j.status !== "OPEN" || !j.deadline) return false;
        return new Date(j.deadline) <= sevenDaysFromNow;
      }).length;

      const lowQuotaCount = subscriptionInfo
        ? (subscriptionInfo.jobPostingRemaining <= 2 ? 1 : 0) +
          (subscriptionInfo.shortTermJobPostingRemaining <= 2 ? 1 : 0)
        : 0;

      const openDisputesCount = stJobs.filter(
        (j) => j.status === ShortTermJobStatus.DISPUTED || j.status === ShortTermJobStatus.ESCALATED
      ).length;

      // Activity feed from notifications
      const activityItems: ActivityItem[] = (notifications.content || [])
        .slice(0, 20)
        .map((n: any) => {
          let type: ActivityType = "NEW_APPLICATION";
          let icon = "📋";
          let color = "#3b82f6";
          const title = n.title || "Thông báo";
          const description = n.message || "";

          const t = n.type?.toUpperCase() || "";
          if (t.includes("APPLICATION") && t.includes("ACCEPTED")) {
            type = "APPLICATION_ACCEPTED"; icon = "✅"; color = "#10b981";
          } else if (t.includes("APPLICATION") && t.includes("REJECT")) {
            type = "APPLICATION_REJECTED"; icon = "❌"; color = "#ef4444";
          } else if (t.includes("APPLICATION") && !t.includes("ACCEPTED") && !t.includes("REJECT")) {
            type = "NEW_APPLICATION"; icon = "👤"; color = "#3b82f6";
          } else if (t.includes("CONTRACT") && t.includes("SIGNED")) {
            type = "CONTRACT_SIGNED"; icon = "📝"; color = "#a78bfa";
          } else if (t.includes("JOB") && t.includes("APPROVED")) {
            type = "JOB_APPROVED"; icon = "✅"; color = "#10b981";
          } else if (t.includes("JOB") && (t.includes("REJECT") || t.includes("BANNED"))) {
            type = "JOB_REJECTED"; icon = "🚫"; color = "#f59e0b";
          } else if (t.includes("DISPUTE") && !t.includes("RESOLVED")) {
            type = "DISPUTE_OPENED"; icon = "⚠️"; color = "#ef4444";
          } else if (t.includes("DISPUTE") && t.includes("RESOLVED")) {
            type = "DISPUTE_RESOLVED"; icon = "✓"; color = "#10b981";
          } else if (t.includes("PREMIUM") || t.includes("SUBSCRIPTION")) {
            type = "SUBSCRIPTION"; icon = "👑"; color = "#a78bfa";
          } else if (t.includes("PAID") || t.includes("ESCROW")) {
            type = "GIG_COMPLETED"; icon = "💰"; color = "#f59e0b";
          } else if (t.includes("BOOST")) {
            type = "BOOST_EFFECTIVE"; icon = "⚡"; color = "#fbbf24";
          }

          return {
            id: n.id || String(Math.random()),
            type,
            icon,
            color,
            title,
            description,
            timestamp: new Date(n.createdAt || now),
            relatedId: n.relatedId,
          };
        });

      setStats({
        ftTotal, ftOpen, ftClosed, ftApplicants,
        stTotal, stPublished, stPendingApproval, stInProgress, stCompleted, stApplicants,
        totalJobs, totalApplicants,
        totalHires, pendingCount,
        applicationByStatus,
        funnelData: funnelStages,
        monthlySpending, lastMonthSpending, totalSpending,
        costPerApplicant: totalApplicants > 0 ? Math.round(totalSpending / totalApplicants) : 0,
        costPerHire: totalHires > 0 ? Math.round(totalSpending / totalHires) : 0,
        spendingByCategory,
        offerAcceptanceRate, applicationToHireRate,
        avgTimeToHire, activePipelineValue,
        expiringJobsCount, lowQuotaCount, openDisputesCount,
      });

      setActivityFeed(activityItems);
    } catch (err) {
      console.error("Failed to compute recruiter stats:", err);
    } finally {
      setIsLoading(false);
    }
  }, [refreshTrigger]);

  useEffect(() => {
    void computeStats();
  }, [computeStats]);

  return { stats, activityFeed, isLoading, refetch: computeStats };
};
