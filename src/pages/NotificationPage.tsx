import React, { useState, useEffect } from "react";
import MeowlKuruLoader from "../components/kuru-loader/MeowlKuruLoader";
import {
  Bell,
  CheckCheck,
  MessageSquare,
  CreditCard,
  Star,
  Info,
  CheckCircle,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Filter,
  Mail,
  BookOpen,
  Briefcase,
  Users,
  AlertTriangle,
  Award,
  FileText,
  DollarSign,
  ArrowDownCircle,
  ArrowUpCircle,
  Shield,
  Gavel,
  Send,
  Check,
  Ban,
  Eye,
  Zap,
  Heart,
  MessageCircle,
  GraduationCap,
  FileCheck,
  FileX,
  RefreshCw,
  Wrench,
  TrendingUp,
  BadgeCheck,
  UserPlus,
  UserX,
  Clock3,
  Scale,
  Lock,
  Megaphone,
  AlertCircle,
  BellRing,
  CalendarCheck,
  UserCheck,
  Handshake,
  PenLine,
  Trash2,
  Ban as BanIcon,
} from "lucide-react";
import {
  notificationService,
  Notification,
} from "../services/notificationService";
import { useNavigate } from "react-router-dom";
import { UserDto } from "../data/authDTOs";
import { useAuth } from "../context/AuthContext";
import { formatNotificationDisplay } from "../utils/notificationDisplay";
import Header from "../components/layout/Header";
import { motion, AnimatePresence } from "framer-motion";
import "../styles/NotificationPage.css";

// ==================== ICON MAP ====================
const getIcon = (type: string) => {
  switch (type) {
    // Social / Community
    case "LIKE":
      return <Heart size={24} />;
    case "COMMENT":
      return <MessageSquare size={24} />;
    case "PRECHAT_MESSAGE":
    case "PRECHAT_NEW_MESSAGE":
      return <MessageCircle size={24} />;
    case "RECRUITMENT_MESSAGE":
      return <Send size={24} />;

    // Premium / Subscription
    case "PREMIUM_PURCHASE":
      return <Star size={24} />;
    case "PREMIUM_EXPIRATION":
      return <Clock3 size={24} />;
    case "PREMIUM_CANCEL":
      return <XCircle size={24} />;

    // Wallet / Payment
    case "WALLET_DEPOSIT":
      return <ArrowDownCircle size={24} />;
    case "COIN_PURCHASE":
      return <DollarSign size={24} />;
    case "WITHDRAWAL_APPROVED":
      return <CheckCircle size={24} />;
    case "WITHDRAWAL_REJECTED":
      return <XCircle size={24} />;

    // Mentor Booking
    case "BOOKING_CREATED":
      return <CalendarCheck size={24} />;
    case "BOOKING_CONFIRMED":
      return <CheckCircle size={24} />;
    case "BOOKING_REJECTED":
      return <XCircle size={24} />;
    case "BOOKING_REMINDER":
      return <BellRing size={24} />;
    case "BOOKING_COMPLETED":
      return <Check size={24} />;
    case "BOOKING_CANCELLED":
      return <BanIcon size={24} />;
    case "BOOKING_REFUND":
      return <ArrowUpCircle size={24} />;
    case "BOOKING_STARTED":
      return <Zap size={24} />;
    case "BOOKING_MENTOR_COMPLETED":
      return <Check size={24} />;
    case "MENTOR_REVIEW_RECEIVED":
      return <Star size={24} />;
    case "MENTOR_LEVEL_UP":
      return <TrendingUp size={24} />;
    case "MENTOR_BADGE_AWARDED":
      return <BadgeCheck size={24} />;

    // Course / Assignment
    case "TASK_DEADLINE":
      return <Clock size={24} />;
    case "TASK_OVERDUE":
      return <AlertTriangle size={24} />;
    case "TASK_REVIEW":
      return <FileCheck size={24} />;
    case "ASSIGNMENT_SUBMITTED":
      return <FileCheck size={24} />;
    case "ASSIGNMENT_GRADED":
      return <GraduationCap size={24} />;
    case "ASSIGNMENT_LATE":
      return <FileX size={24} />;
    case "COURSE_REJECTED":
      return <XCircle size={24} />;
    case "COURSE_SUSPENDED":
      return <BanIcon size={24} />;
    case "COURSE_RESTORED":
      return <RefreshCw size={24} />;

    // Escrow / Business
    case "ESCROW_FUNDED":
      return <Shield size={24} />;
    case "ESCROW_RELEASED":
      return <DollarSign size={24} />;
    case "ESCROW_REFUNDED":
      return <ArrowUpCircle size={24} />;
    case "DISPUTE_OPENED":
      return <AlertCircle size={24} />;
    case "DISPUTE_RESOLVED":
      return <Scale size={24} />;

    // Short-term Jobs
    case "JOB_APPROVED":
      return <CheckCircle size={24} />;
    case "JOB_REJECTED":
      return <XCircle size={24} />;
    case "JOB_DELETED":
      return <Trash2 size={24} />;
    case "JOB_BANNED":
      return <BanIcon size={24} />;
    case "JOB_UNBANNED":
      return <RefreshCw size={24} />;
    case "SHORT_TERM_APPLICATION_SUBMITTED":
      return <UserPlus size={24} />;
    case "SHORT_TERM_APPLICATION_ACCEPTED":
      return <UserCheck size={24} />;
    case "SHORT_TERM_APPLICATION_REJECTED":
      return <UserX size={24} />;
    case "SHORT_TERM_WORK_SUBMITTED":
      return <FileCheck size={24} />;
    case "SHORT_TERM_WORK_APPROVED":
      return <CheckCircle size={24} />;
    case "FULLTIME_APPLICATION_REVIEWED":
      return <Eye size={24} />;
    case "FULLTIME_APPLICATION_ACCEPTED":
      return <UserCheck size={24} />;
    case "FULLTIME_APPLICATION_REJECTED":
      return <UserX size={24} />;
    case "INTERVIEW_SCHEDULED":
      return <CalendarCheck size={24} />;
    case "INTERVIEW_COMPLETED":
      return <CheckCircle size={24} />;
    case "OFFER_SENT":
      return <Handshake size={24} />;
    case "OFFER_ACCEPTED":
      return <UserCheck size={24} />;
    case "OFFER_REJECTED":
      return <UserX size={24} />;

    // Admin / Escalation
    case "WORKER_CANCELLATION_REQUESTED":
      return <AlertTriangle size={24} />;
    case "ADMIN_CANCELLATION_REJECTED":
      return <Shield size={24} />;
    case "WORKER_CANCELLATION_REJECTED":
      return <XCircle size={24} />;
    case "WORKER_AUTO_CANCELLED":
      return <XCircle size={24} />;
    case "WORKER_AUTO_APPROVED":
      return <CheckCircle size={24} />;
    case "RECRUITER_AUTO_APPROVED_WARNING":
      return <AlertCircle size={24} />;
    case "ADMIN_DISPUTE_ESCALATED":
      return <Shield size={24} />;
    case "DISPUTE_ELIGIBILITY_UNLOCKED":
      return <Lock size={24} />;
    case "REVIEW_WINDOW_EXPIRING":
      return <Clock size={24} />;

    // System
    case "WELCOME":
      return <UserPlus size={24} />;
    case "SYSTEM":
      return <Info size={24} />;
    case "WARNING":
      return <AlertTriangle size={24} />;
    case "VIOLATION_REPORT":
      return <Megaphone size={24} />;

    // Contract / Signing
    case "CONTRACT_SENT_FOR_SIGNATURE":
      return <Send size={24} />;
    case "CONTRACT_SIGNED":
      return <Handshake size={24} />;
    case "CONTRACT_REJECTED":
      return <XCircle size={24} />;
    case "CONTRACT_CANCELLED":
      return <BanIcon size={24} />;
    case "CONTRACT_EXPIRED":
      return <Clock size={24} />;

    default:
      return <Bell size={24} />;
  }
};

// ==================== ICON COLOR ====================
const getIconColor = (type: string): string => {
  switch (type) {
    case "LIKE":
      return "var(--notif-like)";
    case "COMMENT":
    case "PRECHAT_MESSAGE":
    case "PRECHAT_NEW_MESSAGE":
    case "RECRUITMENT_MESSAGE":
      return "var(--notif-comment)";
    case "PREMIUM_PURCHASE":
    case "PREMIUM_EXPIRATION":
    case "PREMIUM_CANCEL":
      return "var(--notif-premium)";
    case "WALLET_DEPOSIT":
    case "COIN_PURCHASE":
    case "WITHDRAWAL_APPROVED":
    case "WITHDRAWAL_REJECTED":
    case "ESCROW_FUNDED":
    case "ESCROW_RELEASED":
    case "ESCROW_REFUNDED":
      return "var(--notif-wallet)";
    case "BOOKING_CREATED":
    case "BOOKING_CONFIRMED":
    case "BOOKING_REJECTED":
    case "BOOKING_REMINDER":
    case "BOOKING_COMPLETED":
    case "BOOKING_CANCELLED":
    case "BOOKING_REFUND":
    case "BOOKING_STARTED":
    case "BOOKING_MENTOR_COMPLETED":
    case "MENTOR_REVIEW_RECEIVED":
      return "var(--notif-booking)";
    case "MENTOR_LEVEL_UP":
    case "MENTOR_BADGE_AWARDED":
      return "var(--notif-mentor)";
    case "TASK_DEADLINE":
    case "TASK_OVERDUE":
    case "TASK_REVIEW":
    case "ASSIGNMENT_SUBMITTED":
    case "ASSIGNMENT_GRADED":
    case "ASSIGNMENT_LATE":
    case "COURSE_REJECTED":
    case "COURSE_SUSPENDED":
    case "COURSE_RESTORED":
      return "var(--notif-course)";
    case "DISPUTE_OPENED":
    case "DISPUTE_RESOLVED":
    case "ADMIN_DISPUTE_ESCALATED":
    case "DISPUTE_ELIGIBILITY_UNLOCKED":
      return "var(--notif-dispute)";
    case "JOB_APPROVED":
    case "JOB_REJECTED":
    case "JOB_DELETED":
    case "JOB_BANNED":
    case "JOB_UNBANNED":
    case "SHORT_TERM_APPLICATION_SUBMITTED":
    case "SHORT_TERM_APPLICATION_ACCEPTED":
    case "SHORT_TERM_APPLICATION_REJECTED":
    case "SHORT_TERM_WORK_SUBMITTED":
    case "SHORT_TERM_WORK_APPROVED":
    case "FULLTIME_APPLICATION_REVIEWED":
    case "FULLTIME_APPLICATION_ACCEPTED":
    case "FULLTIME_APPLICATION_REJECTED":
    case "INTERVIEW_SCHEDULED":
    case "INTERVIEW_COMPLETED":
    case "OFFER_SENT":
    case "OFFER_ACCEPTED":
    case "OFFER_REJECTED":
    case "WORKER_CANCELLATION_REQUESTED":
    case "ADMIN_CANCELLATION_REJECTED":
    case "WORKER_CANCELLATION_REJECTED":
    case "WORKER_AUTO_CANCELLED":
    case "WORKER_AUTO_APPROVED":
    case "RECRUITER_AUTO_APPROVED_WARNING":
    case "REVIEW_WINDOW_EXPIRING":
      return "var(--notif-job)";
    case "CONTRACT_SENT_FOR_SIGNATURE":
    case "CONTRACT_SIGNED":
    case "CONTRACT_REJECTED":
    case "CONTRACT_CANCELLED":
    case "CONTRACT_EXPIRED":
      return "var(--notif-contract)";
    case "WELCOME":
      return "var(--notif-primary)";
    case "SYSTEM":
      return "var(--notif-secondary)";
    case "WARNING":
      return "var(--notif-warning)";
    case "VIOLATION_REPORT":
      return "var(--notif-error)";
    default:
      return "var(--notif-primary)";
  }
};

// ==================== TYPE CATEGORY ====================
const getTypeCategory = (type: string): string => {
  const categories: Record<string, string[]> = {
    social: [
      "LIKE",
      "COMMENT",
      "PRECHAT_MESSAGE",
      "PRECHAT_NEW_MESSAGE",
      "RECRUITMENT_MESSAGE",
    ],
    premium: ["PREMIUM_PURCHASE", "PREMIUM_EXPIRATION", "PREMIUM_CANCEL"],
    wallet: [
      "WALLET_DEPOSIT",
      "COIN_PURCHASE",
      "WITHDRAWAL_APPROVED",
      "WITHDRAWAL_REJECTED",
    ],
    booking: [
      "BOOKING_CREATED",
      "BOOKING_CONFIRMED",
      "BOOKING_REJECTED",
      "BOOKING_REMINDER",
      "BOOKING_COMPLETED",
      "BOOKING_CANCELLED",
      "BOOKING_REFUND",
      "BOOKING_STARTED",
      "BOOKING_MENTOR_COMPLETED",
      "MENTOR_REVIEW_RECEIVED",
    ],
    mentor: ["MENTOR_LEVEL_UP", "MENTOR_BADGE_AWARDED"],
    course: [
      "TASK_DEADLINE",
      "TASK_OVERDUE",
      "TASK_REVIEW",
      "ASSIGNMENT_SUBMITTED",
      "ASSIGNMENT_GRADED",
      "ASSIGNMENT_LATE",
      "COURSE_REJECTED",
      "COURSE_SUSPENDED",
      "COURSE_RESTORED",
    ],
    escrow: [
      "ESCROW_FUNDED",
      "ESCROW_RELEASED",
      "ESCROW_REFUNDED",
      "REVIEW_WINDOW_EXPIRING",
    ],
    dispute: [
      "DISPUTE_OPENED",
      "DISPUTE_RESOLVED",
      "ADMIN_DISPUTE_ESCALATED",
      "DISPUTE_ELIGIBILITY_UNLOCKED",
    ],
    job: [
      "JOB_APPROVED",
      "JOB_REJECTED",
      "JOB_DELETED",
      "JOB_BANNED",
      "JOB_UNBANNED",
      "SHORT_TERM_APPLICATION_SUBMITTED",
      "SHORT_TERM_APPLICATION_ACCEPTED",
      "SHORT_TERM_APPLICATION_REJECTED",
      "SHORT_TERM_WORK_SUBMITTED",
      "SHORT_TERM_WORK_APPROVED",
      "FULLTIME_APPLICATION_REVIEWED",
      "FULLTIME_APPLICATION_ACCEPTED",
      "FULLTIME_APPLICATION_REJECTED",
      "INTERVIEW_SCHEDULED",
      "INTERVIEW_COMPLETED",
      "OFFER_SENT",
      "OFFER_ACCEPTED",
      "OFFER_REJECTED",
      "WORKER_CANCELLATION_REQUESTED",
      "ADMIN_CANCELLATION_REJECTED",
      "WORKER_CANCELLATION_REJECTED",
      "WORKER_AUTO_CANCELLED",
      "WORKER_AUTO_APPROVED",
      "RECRUITER_AUTO_APPROVED_WARNING",
    ],
    contract: [
      "CONTRACT_SENT_FOR_SIGNATURE",
      "CONTRACT_SIGNED",
      "CONTRACT_REJECTED",
      "CONTRACT_CANCELLED",
      "CONTRACT_EXPIRED",
    ],
    system: ["WELCOME", "SYSTEM", "WARNING", "VIOLATION_REPORT"],
  };
  for (const [cat, types] of Object.entries(categories)) {
    if (types.includes(type)) return cat;
  }
  return "other";
};

// ==================== ROUTE NAVIGATION ====================
type NotificationTarget = {
  pathname: string;
  search?: string;
  hash?: string;
  state?: Record<string, unknown>;
};

const getUserRoles = (user: any): string[] =>
  Array.isArray(user?.roles)
    ? user.roles.map((role: string) => role.toUpperCase())
    : [];

const LEARNER_ROLES = ["USER", "LEARNER", "STUDENT", "CANDIDATE"];
const JOB_LAB_NOTIFICATION_TYPES = [
  "SHORT_TERM_APPLICATION_ACCEPTED",
  "SHORT_TERM_WORK_APPROVED",
  "FULLTIME_APPLICATION_ACCEPTED",
];

const hasAnyRole = (user: any, roles: string[]): boolean => {
  const userRoles = getUserRoles(user);
  return roles.some((role) => userRoles.includes(role));
};

const isAdminUser = (user: any): boolean => {
  const roles = getUserRoles(user);
  return (
    roles.includes("ADMIN") || roles.some((role) => role.endsWith("_ADMIN"))
  );
};

const isMentorUser = (user: any): boolean => hasAnyRole(user, ["MENTOR"]);
const isRecruiterUser = (user: any): boolean => hasAnyRole(user, ["RECRUITER"]);
const isLearnerUser = (user: any): boolean =>
  hasAnyRole(user, LEARNER_ROLES) &&
  !isMentorUser(user) &&
  !isRecruiterUser(user) &&
  !isAdminUser(user) &&
  !hasAnyRole(user, ["PARENT"]);

const shouldOpenJobLabFromNotification = (type: string, user: any): boolean =>
  isLearnerUser(user) && JOB_LAB_NOTIFICATION_TYPES.includes(type);

const buildBusinessTarget = (
  activeSection:
    | "overview"
    | "fulltime"
    | "shortterm"
    | "candidates"
    | "seminar" = "overview",
): NotificationTarget => ({
  pathname: "/business",
  state: { activeSection },
});

const buildJobLabTarget = ({
  viewMode = "applications",
  jobType = "ALL",
  selectedApplicationId,
  applicationType,
}: {
  viewMode?:
    | "dashboard"
    | "applications"
    | "workspace"
    | "contracts"
    | "interviews"
    | "offers"
    | "disputes";
  jobType?: "ALL" | "REGULAR" | "SHORT_TERM";
  selectedApplicationId?: string;
  applicationType?: "REGULAR" | "SHORT_TERM";
} = {}): NotificationTarget => ({
  pathname: "/my-applications",
  state: {
    viewMode,
    jobType,
    selectedApplicationId,
    applicationType,
  },
});

const buildContractTarget = (
  relatedId: string,
  user: any,
  type: string,
): NotificationTarget => {
  if (!relatedId) {
    return isRecruiterUser(user)
      ? { pathname: "/business/contracts" }
      : { pathname: "/my-contracts" };
  }

  if (
    type === "CONTRACT_SENT_FOR_SIGNATURE" &&
    isLearnerUser(user) &&
    !isRecruiterUser(user)
  ) {
    return { pathname: `/contracts/${relatedId}/sign` };
  }

  return isRecruiterUser(user)
    ? { pathname: `/business/contracts/${relatedId}` }
    : { pathname: `/contracts/${relatedId}` };
};

const normalizePath = (path?: string): string | null => {
  if (!path) return null;
  return path.startsWith("/") ? path : `/${path}`;
};

const buildPayloadTarget = (
  notification: Pick<Notification, "type" | "payload">,
  currentUser: UserDto | null,
): NotificationTarget | null => {
  const action = notification.payload?.action;
  const resource = notification.payload?.resource;

  // Mentor/Admin nhận ASSIGNMENT_GRADED từ BE với payload /assignment/{id} — bỏ qua payload
  // để rơi vào switch fallback /mentor, tránh sai route sang learner page
  if (
    notification.type === "ASSIGNMENT_GRADED" &&
    (isMentorUser(currentUser) || isAdminUser(currentUser))
  ) {
    return null;
  }

  const actionPath = normalizePath(action?.path);
  if (actionPath) {
    return {
      pathname: actionPath,
      hash: action?.anchor ? `#${action.anchor}` : undefined,
    };
  }

  if (resource?.assignmentId != null) {
    return { pathname: `/assignment/${resource.assignmentId}` };
  }

  if (action?.key === "COURSE_PURCHASE_SUCCESS") {
    return {
      pathname: "/dashboard",
      hash: action?.anchor ? `#${action.anchor}` : "#modules-section",
    };
  }

  return null;
};

const getNotificationTarget = (
  notification: Pick<Notification, "type" | "relatedId" | "message" | "title" | "payload">,
  user: UserDto | null,
): NotificationTarget => {
  const payloadTarget = buildPayloadTarget(notification, user);
  if (payloadTarget) {
    return payloadTarget;
  }

  const { type, relatedId, message, title } = notification;

  switch (type) {
    // Social / Community
    case "LIKE":
    case "COMMENT":
      return { pathname: `/community/${relatedId}` };
    case "PRECHAT_MESSAGE":
    case "PRECHAT_NEW_MESSAGE":
      return {
        pathname: "/messages",
        state: {
          openChatWith: relatedId,
          bookingId: relatedId,
          type: "MENTOR",
        },
      };
    case "RECRUITMENT_MESSAGE":
      return {
        pathname: "/messages",
        state: {
          openChatWith: relatedId,
          type: "RECRUITMENT",
        },
      };

    // Premium
    case "PREMIUM_PURCHASE":
    case "PREMIUM_EXPIRATION":
    case "PREMIUM_CANCEL":
      return { pathname: "/premium" };

    // Wallet
    case "WALLET_DEPOSIT":
    case "COIN_PURCHASE":
    case "WITHDRAWAL_APPROVED":
    case "WITHDRAWAL_REJECTED":
      return { pathname: "/my-wallet" };

    // Mentor Booking
    case "BOOKING_CREATED":
    case "BOOKING_CONFIRMED":
    case "BOOKING_REJECTED":
    case "BOOKING_REMINDER":
    case "BOOKING_COMPLETED":
    case "BOOKING_CANCELLED":
    case "BOOKING_REFUND":
    case "BOOKING_STARTED":
    case "BOOKING_MENTOR_COMPLETED":
      return relatedId
        ? { pathname: `/bookings/${relatedId}` }
        : isMentorUser(user)
          ? { pathname: "/mentor" }
          : { pathname: "/my-bookings" };
    case "MENTOR_REVIEW_RECEIVED":
    case "MENTOR_LEVEL_UP":
    case "MENTOR_BADGE_AWARDED":
      return { pathname: "/mentor" };

    // Course / Assignment
    case "TASK_DEADLINE":
    case "TASK_OVERDUE":
    case "TASK_REVIEW":
      return { pathname: "/study-planner" };
    case "ASSIGNMENT_SUBMITTED":
      return isMentorUser(user) || isAdminUser(user)
        ? { pathname: "/mentor" }
        : { pathname: "/courses" };
    case "ASSIGNMENT_GRADED":
    case "ASSIGNMENT_LATE":
      return isMentorUser(user) || isAdminUser(user)
        ? { pathname: "/mentor" }
        : { pathname: "/courses" };
    case "COURSE_REJECTED":
    case "COURSE_SUSPENDED":
    case "COURSE_RESTORED":
      return isMentorUser(user) || isAdminUser(user)
        ? { pathname: "/mentor" }
        : { pathname: "/courses" };

    // Escrow
    case "ESCROW_FUNDED":
    case "ESCROW_RELEASED":
      return { pathname: "/my-wallet" };
    case "ESCROW_REFUNDED":
    case "REVIEW_WINDOW_EXPIRING":
      return isRecruiterUser(user)
        ? buildBusinessTarget("shortterm")
        : { pathname: "/my-wallet" };

    // Dispute
    case "DISPUTE_ELIGIBILITY_UNLOCKED":
      return buildJobLabTarget({
        viewMode: "workspace",
        jobType: "SHORT_TERM",
        selectedApplicationId: relatedId,
        applicationType: "SHORT_TERM",
      });
    case "ADMIN_DISPUTE_ESCALATED":
      return { pathname: "/admin" };
    case "DISPUTE_OPENED":
      if (isRecruiterUser(user)) return buildBusinessTarget("shortterm");
      if (isMentorUser(user)) return { pathname: "/mentor" };
      return { pathname: "/my-bookings" };
    case "DISPUTE_RESOLVED": {
      if (isRecruiterUser(user)) return buildBusinessTarget("shortterm");
      if (isMentorUser(user)) return { pathname: "/mentor" };
      if (!isLearnerUser(user)) return { pathname: "/notifications" };

      const normalizedMessage = `${title} ${message}`.toLowerCase();
      const looksLikeShortTermDispute =
        normalizedMessage.includes("job") ||
        normalizedMessage.includes("công việc") ||
        normalizedMessage.includes("outcome") ||
        normalizedMessage.includes("one of your jobs");

      return looksLikeShortTermDispute
        ? buildJobLabTarget({
            viewMode: "disputes",
            jobType: "SHORT_TERM",
            applicationType: "SHORT_TERM",
          })
        : { pathname: "/my-bookings" };
    }

    // Short-term Jobs / Applications
    case "JOB_APPROVED":
    case "JOB_REJECTED":
    case "JOB_DELETED":
    case "JOB_BANNED":
    case "JOB_UNBANNED":
    case "SHORT_TERM_APPLICATION_SUBMITTED":
    case "SHORT_TERM_WORK_SUBMITTED":
    case "RECRUITER_AUTO_APPROVED_WARNING":
      return buildBusinessTarget("shortterm");
    case "SHORT_TERM_APPLICATION_ACCEPTED":
      return buildJobLabTarget({
        viewMode: "workspace",
        jobType: "SHORT_TERM",
        selectedApplicationId: relatedId,
        applicationType: "SHORT_TERM",
      });
    case "SHORT_TERM_APPLICATION_REJECTED":
      return buildJobLabTarget({
        viewMode: "applications",
        jobType: "SHORT_TERM",
        selectedApplicationId: relatedId,
        applicationType: "SHORT_TERM",
      });
    case "SHORT_TERM_WORK_APPROVED":
    case "WORKER_AUTO_APPROVED":
      return buildJobLabTarget({
        viewMode: "workspace",
        jobType: "SHORT_TERM",
        selectedApplicationId: relatedId,
        applicationType: "SHORT_TERM",
      });
    case "FULLTIME_APPLICATION_REVIEWED":
    case "FULLTIME_APPLICATION_ACCEPTED":
    case "FULLTIME_APPLICATION_REJECTED":
      return buildJobLabTarget({
        viewMode: "applications",
        jobType: "REGULAR",
        selectedApplicationId: relatedId,
        applicationType: "REGULAR",
      });
    case "INTERVIEW_SCHEDULED":
    case "INTERVIEW_COMPLETED":
      return isRecruiterUser(user)
        ? buildBusinessTarget("fulltime")
        : buildJobLabTarget({
            viewMode: "interviews",
            jobType: "REGULAR",
            selectedApplicationId: relatedId,
            applicationType: "REGULAR",
          });
    case "OFFER_SENT":
    case "OFFER_ACCEPTED":
    case "OFFER_REJECTED":
      return isRecruiterUser(user)
        ? buildBusinessTarget("fulltime")
        : buildJobLabTarget({
            viewMode: "offers",
            jobType: "REGULAR",
            selectedApplicationId: relatedId,
            applicationType: "REGULAR",
          });
    case "WORKER_CANCELLATION_REQUESTED":
      return isRecruiterUser(user)
        ? buildBusinessTarget("shortterm")
        : buildJobLabTarget({
            viewMode: "disputes",
            jobType: "SHORT_TERM",
            applicationType: "SHORT_TERM",
          });
    case "WORKER_AUTO_CANCELLED":
    case "WORKER_CANCELLATION_REJECTED":
      return isRecruiterUser(user)
        ? buildBusinessTarget("shortterm")
        : buildJobLabTarget({
            viewMode: "applications",
            jobType: "SHORT_TERM",
            applicationType: "SHORT_TERM",
          });
    case "ADMIN_CANCELLATION_REJECTED":
      return isRecruiterUser(user)
        ? buildBusinessTarget("shortterm")
        : buildJobLabTarget({
            viewMode: "applications",
            jobType: "SHORT_TERM",
            applicationType: "SHORT_TERM",
          });

    // Contract
    case "CONTRACT_SENT_FOR_SIGNATURE":
    case "CONTRACT_SIGNED":
    case "CONTRACT_REJECTED":
    case "CONTRACT_CANCELLED":
    case "CONTRACT_EXPIRED":
      return buildContractTarget(relatedId, user, type);

    // System
    case "WELCOME":
      return { pathname: "/dashboard" };
    case "SYSTEM":
    case "WARNING":
      return { pathname: "/notifications" };
    case "VIOLATION_REPORT":
      return { pathname: "/my-reports" };

    default:
      return { pathname: "/notifications" };
  }
};

// ==================== TYPE DISPLAY LABEL ====================
const getTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    LIKE: "Thích",
    COMMENT: "Bình luận",
    PRECHAT_MESSAGE: "Tin nhắn mentor booking",
    PRECHAT_NEW_MESSAGE: "Tin nhắn mentor booking",
    RECRUITMENT_MESSAGE: "Tin nhắn tuyển dụng",
    PREMIUM_PURCHASE: "Mua Premium",
    PREMIUM_EXPIRATION: "Premium hết hạn",
    PREMIUM_CANCEL: "Hủy Premium",
    WALLET_DEPOSIT: "Nạp tiền ví",
    COIN_PURCHASE: "Mua Coin",
    WITHDRAWAL_APPROVED: "Rút tiền được duyệt",
    WITHDRAWAL_REJECTED: "Rút tiền bị từ chối",
    BOOKING_CREATED: "Booking mới",
    BOOKING_CONFIRMED: "Booking được xác nhận",
    BOOKING_REJECTED: "Booking bị từ chối",
    BOOKING_REMINDER: "Nhắc nhở Booking",
    BOOKING_COMPLETED: "Booking hoàn thành",
    BOOKING_CANCELLED: "Booking bị hủy",
    BOOKING_REFUND: "Hoàn tiền Booking",
    BOOKING_STARTED: "Booking bắt đầu",
    BOOKING_MENTOR_COMPLETED: "Mentor hoàn thành session",
    MENTOR_REVIEW_RECEIVED: "Nhận đánh giá Mentor",
    MENTOR_LEVEL_UP: "Level lên Mentor",
    MENTOR_BADGE_AWARDED: "Nhận huy hiệu",
    TASK_DEADLINE: "Hạn chót nhiệm vụ",
    TASK_OVERDUE: "Nhiệm vụ quá hạn",
    TASK_REVIEW: "Review nhiệm vụ",
    ASSIGNMENT_SUBMITTED: "Nộp bài",
    ASSIGNMENT_GRADED: "Chấm điểm",
    ASSIGNMENT_LATE: "Nộp muộn",
    COURSE_REJECTED: "Khóa học bị từ chối",
    COURSE_SUSPENDED: "Khóa học bị đình chỉ",
    COURSE_RESTORED: "Khóa học được khôi phục",
    ESCROW_FUNDED: "Escrow đã nạp",
    ESCROW_RELEASED: "Escrow được giải ngân",
    ESCROW_REFUNDED: "Escrow được hoàn",
    DISPUTE_OPENED: "Khiếu nại được mở",
    DISPUTE_RESOLVED: "Khiếu nại được giải quyết",
    REVIEW_WINDOW_EXPIRING: "Cửa sổ review sắp hết hạn",
    JOB_APPROVED: "Job được duyệt",
    JOB_REJECTED: "Job bị từ chối",
    JOB_DELETED: "Job bị xóa",
    JOB_BANNED: "Job bị cấm",
    JOB_UNBANNED: "Job được gỡ cấm",
    SHORT_TERM_APPLICATION_SUBMITTED: "Ứng tuyển ngắn hạn",
    SHORT_TERM_APPLICATION_ACCEPTED: "Ứng tuyển được chấp nhận",
    SHORT_TERM_APPLICATION_REJECTED: "Ứng tuyển bị từ chối",
    SHORT_TERM_WORK_SUBMITTED: "Nộp công việc ngắn hạn",
    SHORT_TERM_WORK_APPROVED: "Công việc được duyệt",
    FULLTIME_APPLICATION_REVIEWED: "Ứng tuyển chính thức được review",
    FULLTIME_APPLICATION_ACCEPTED: "Ứng tuyển chính thức được nhận",
    FULLTIME_APPLICATION_REJECTED: "Ứng tuyển chính thức bị từ chối",
    INTERVIEW_SCHEDULED: "Đã lên lịch phỏng vấn",
    INTERVIEW_COMPLETED: "Phỏng vấn đã hoàn tất",
    OFFER_SENT: "Đã nhận đề nghị",
    OFFER_ACCEPTED: "Đã chấp nhận đề nghị",
    OFFER_REJECTED: "Đã từ chối đề nghị",
    WORKER_CANCELLATION_REQUESTED: "Yêu cầu hủy của Worker",
    ADMIN_CANCELLATION_REJECTED: "Admin từ chối yêu cầu hủy",
    WORKER_CANCELLATION_REJECTED: "Yêu cầu hủy bị từ chối",
    WORKER_AUTO_CANCELLED: "Worker bị hủy tự động",
    WORKER_AUTO_APPROVED: "Worker được duyệt tự động",
    RECRUITER_AUTO_APPROVED_WARNING: "Cảnh báo Recruiter",
    ADMIN_DISPUTE_ESCALATED: "Khiếu nại được escalation",
    DISPUTE_ELIGIBILITY_UNLOCKED: "Mở khóa tranh chấp",
    WELCOME: "Chào mừng",
    SYSTEM: "Thông báo hệ thống",
    WARNING: "Cảnh báo",
    VIOLATION_REPORT: "Báo cáo vi phạm",
    CONTRACT_SENT_FOR_SIGNATURE: "Hợp đồng chờ ký",
    CONTRACT_SIGNED: "Hợp đồng đã ký",
    CONTRACT_REJECTED: "Hợp đồng bị từ chối",
    CONTRACT_CANCELLED: "Hợp đồng bị hủy",
    CONTRACT_EXPIRED: "Hợp đồng hết hạn ký",
  };
  return labels[type] || type;
};

// ==================== TYPE DESCRIPTION ====================
const getTypeDescription = (type: string, message: string): string => {
  const descriptions: Record<string, string> = {
    LIKE: "Ai đó đã thích bài viết hoặc nội dung của bạn.",
    COMMENT: "Ai đó đã bình luận trên bài viết của bạn.",
    PRECHAT_MESSAGE: "Bạn có tin nhắn mới từ booking mentor.",
    PRECHAT_NEW_MESSAGE: "Bạn có tin nhắn mới từ booking mentor.",
    RECRUITMENT_MESSAGE: "Bạn có tin nhắn tuyển dụng mới.",
    PREMIUM_PURCHASE: "Bạn đã mua thành công gói Premium.",
    PREMIUM_EXPIRATION:
      "Gói Premium của bạn sắp hết hạn. Hãy gia hạn để tiếp tục sử dụng.",
    PREMIUM_CANCEL: "Gói Premium của bạn đã bị hủy.",
    WALLET_DEPOSIT: "Tiền đã được nạp vào ví của bạn thành công.",
    COIN_PURCHASE: "Bạn đã mua Coin thành công.",
    WITHDRAWAL_APPROVED: "Yêu cầu rút tiền của bạn đã được duyệt.",
    WITHDRAWAL_REJECTED: "Yêu cầu rút tiền của bạn bị từ chối.",
    BOOKING_CREATED: "Một yêu cầu booking mới đã được tạo.",
    BOOKING_CONFIRMED: "Booking của bạn đã được xác nhận.",
    BOOKING_REJECTED: "Booking của bạn đã bị từ chối.",
    BOOKING_REMINDER: "Nhắc nhở: Bạn có buổi booking sắp tới.",
    BOOKING_COMPLETED: "Booking đã được hoàn thành.",
    BOOKING_CANCELLED: "Booking đã bị hủy.",
    BOOKING_REFUND: "Tiền booking đã được hoàn cho bạn.",
    BOOKING_STARTED: "Buổi mentor đã bắt đầu!",
    BOOKING_MENTOR_COMPLETED: "Mentor đã hoàn thành session.",
    MENTOR_REVIEW_RECEIVED: "Bạn đã nhận được đánh giá từ học viên.",
    MENTOR_LEVEL_UP: "Chúc mừng! Bạn đã lên level Mentor mới!",
    MENTOR_BADGE_AWARDED: "Bạn đã nhận được một huy hiệu mới!",
    TASK_DEADLINE: "Một nhiệm vụ sắp đến hạn nộp.",
    TASK_OVERDUE: "Một nhiệm vụ đã quá hạn.",
    TASK_REVIEW: "Nhiệm vụ của bạn đang được review.",
    ASSIGNMENT_SUBMITTED: "Bài nộp của bạn đã được ghi nhận.",
    ASSIGNMENT_GRADED: "Bài của bạn đã được chấm điểm.",
    ASSIGNMENT_LATE: "Bài nộp của bạn bị trễ.",
    COURSE_REJECTED: "Khóa học của bạn bị từ chối.",
    COURSE_SUSPENDED: "Khóa học của bạn bị đình chỉ.",
    COURSE_RESTORED: "Khóa học đã được khôi phục.",
    ESCROW_FUNDED: "Escrow đã được nạp tiền cho công việc.",
    ESCROW_RELEASED: "Tiền escrow đã được giải ngân cho bạn.",
    ESCROW_REFUNDED: "Tiền escrow đã được hoàn lại.",
    DISPUTE_OPENED: "Một khiếu nại đã được mở cho công việc này.",
    DISPUTE_RESOLVED: "Khiếu nại đã được giải quyết.",
    REVIEW_WINDOW_EXPIRING: "Cửa sổ review sắp hết hạn. Hãy kiểm tra ngay.",
    JOB_APPROVED: "Job của bạn đã được duyệt.",
    JOB_REJECTED: "Job của bạn bị từ chối.",
    JOB_DELETED: "Job đã bị xóa.",
    JOB_BANNED: "Job bị cấm do vi phạm.",
    JOB_UNBANNED: "Job đã được gỡ cấm.",
    SHORT_TERM_APPLICATION_SUBMITTED: "Đơn ứng tuyển đã được gửi.",
    SHORT_TERM_APPLICATION_ACCEPTED: "Đơn ứng tuyển được chấp nhận!",
    SHORT_TERM_APPLICATION_REJECTED: "Đơn ứng tuyển bị từ chối.",
    SHORT_TERM_WORK_SUBMITTED: "Công việc đã được nộp, chờ review.",
    SHORT_TERM_WORK_APPROVED:
      "Công việc đã được duyệt. Bạn sẽ nhận được thanh toán.",
    FULLTIME_APPLICATION_REVIEWED: "Đơn ứng tuyển đã được xem xét.",
    FULLTIME_APPLICATION_ACCEPTED: "Chúc mừng! Bạn được nhận vào vị trí này.",
    FULLTIME_APPLICATION_REJECTED:
      "Rất tiếc, đơn ứng tuyển không được chấp nhận.",
    INTERVIEW_SCHEDULED: "Bạn đã nhận lịch phỏng vấn mới.",
    INTERVIEW_COMPLETED: "Buổi phỏng vấn đã hoàn thành. Hãy chờ kết quả tiếp theo.",
    OFFER_SENT: "Nhà tuyển dụng đã gửi đề nghị cho hồ sơ của bạn.",
    OFFER_ACCEPTED: "Bạn đã chấp nhận đề nghị tuyển dụng.",
    OFFER_REJECTED: "Đề nghị tuyển dụng đã bị từ chối.",
    WORKER_CANCELLATION_REQUESTED: "Worker yêu cầu hủy công việc.",
    ADMIN_CANCELLATION_REJECTED:
      "Admin đã từ chối yêu cầu hủy. Công việc cần tiếp tục xử lý.",
    WORKER_CANCELLATION_REJECTED:
      "Yêu cầu hủy đã bị Admin từ chối. Bạn có thể tiếp tục công việc.",
    WORKER_AUTO_CANCELLED: "Công việc bị hủy tự động do hết hạn.",
    WORKER_AUTO_APPROVED: "Công việc được duyệt tự động.",
    RECRUITER_AUTO_APPROVED_WARNING: "Sắp tự động duyệt. Kiểm tra ngay!",
    ADMIN_DISPUTE_ESCALATED: "Khiếu nại được chuyển lên Admin.",
    DISPUTE_ELIGIBILITY_UNLOCKED: "Bạn đã đủ điều kiện mở tranh chấp.",
    WELCOME: "Chào mừng bạn đến với SkillVerse!",
    SYSTEM: "Thông báo từ hệ thống.",
    WARNING: "Cảnh báo: Có vấn đề cần bạn lưu ý.",
    VIOLATION_REPORT: "Có báo cáo vi phạm liên quan đến tài khoản của bạn.",
    CONTRACT_SENT_FOR_SIGNATURE: "Một hợp đồng đang chờ bạn ký.",
    CONTRACT_SIGNED: "Hợp đồng đã được ký thành công!",
    CONTRACT_REJECTED: "Hợp đồng bị từ chối ký.",
    CONTRACT_CANCELLED: "Hợp đồng đã bị hủy bỏ.",
    CONTRACT_EXPIRED: "Hợp đồng đã hết hạn ký (72 giờ) và không còn hiệu lực.",
  };
  return descriptions[type] || message;
};

// ==================== TYPE BANNER COLOR ====================
const getTypeBannerColor = (type: string): string => {
  switch (type) {
    case "LIKE":
      return "linear-gradient(135deg, #ff6b9d, #c44569)";
    case "COMMENT":
    case "PRECHAT_MESSAGE":
    case "PRECHAT_NEW_MESSAGE":
    case "RECRUITMENT_MESSAGE":
      return "linear-gradient(135deg, #4facfe, #00f2fe)";
    case "PREMIUM_PURCHASE":
    case "PREMIUM_EXPIRATION":
    case "PREMIUM_CANCEL":
      return "linear-gradient(135deg, #f093fb, #f5576c)";
    case "WALLET_DEPOSIT":
    case "COIN_PURCHASE":
    case "WITHDRAWAL_APPROVED":
    case "ESCROW_FUNDED":
    case "ESCROW_RELEASED":
      return "linear-gradient(135deg, #10b981, #059669)";
    case "WITHDRAWAL_REJECTED":
    case "ESCROW_REFUNDED":
      return "linear-gradient(135deg, #f59e0b, #d97706)";
    case "BOOKING_CREATED":
    case "BOOKING_CONFIRMED":
    case "BOOKING_STARTED":
    case "BOOKING_COMPLETED":
    case "BOOKING_MENTOR_COMPLETED":
      return "linear-gradient(135deg, #6366f1, #8b5cf6)";
    case "BOOKING_REJECTED":
    case "BOOKING_CANCELLED":
      return "linear-gradient(135deg, #ef4444, #dc2626)";
    case "BOOKING_REMINDER":
      return "linear-gradient(135deg, #f59e0b, #d97706)";
    case "BOOKING_REFUND":
      return "linear-gradient(135deg, #10b981, #059669)";
    case "MENTOR_REVIEW_RECEIVED":
    case "MENTOR_LEVEL_UP":
    case "MENTOR_BADGE_AWARDED":
      return "linear-gradient(135deg, #f59e0b, #eab308)";
    case "TASK_DEADLINE":
    case "TASK_REVIEW":
    case "ASSIGNMENT_SUBMITTED":
    case "ASSIGNMENT_GRADED":
      return "linear-gradient(135deg, #6366f1, #8b5cf6)";
    case "TASK_OVERDUE":
    case "ASSIGNMENT_LATE":
    case "COURSE_REJECTED":
    case "COURSE_SUSPENDED":
      return "linear-gradient(135deg, #ef4444, #dc2626)";
    case "COURSE_RESTORED":
      return "linear-gradient(135deg, #10b981, #059669)";
    case "DISPUTE_OPENED":
      return "linear-gradient(135deg, #ef4444, #b91c1c)";
    case "DISPUTE_RESOLVED":
      return "linear-gradient(135deg, #10b981, #059669)";
    case "ADMIN_DISPUTE_ESCALATED":
      return "linear-gradient(135deg, #dc2626, #b91c1c)";
    case "DISPUTE_ELIGIBILITY_UNLOCKED":
      return "linear-gradient(135deg, #6366f1, #4f46e5)";
    case "JOB_APPROVED":
    case "SHORT_TERM_WORK_APPROVED":
    case "FULLTIME_APPLICATION_ACCEPTED":
    case "WORKER_AUTO_APPROVED":
      return "linear-gradient(135deg, #10b981, #059669)";
    case "JOB_REJECTED":
    case "SHORT_TERM_APPLICATION_REJECTED":
    case "FULLTIME_APPLICATION_REJECTED":
    case "WORKER_AUTO_CANCELLED":
      return "linear-gradient(135deg, #ef4444, #dc2626)";
    case "JOB_DELETED":
    case "JOB_BANNED":
      return "linear-gradient(135deg, #6b7280, #4b5563)";
    case "JOB_UNBANNED":
      return "linear-gradient(135deg, #10b981, #059669)";
    case "SHORT_TERM_APPLICATION_SUBMITTED":
    case "FULLTIME_APPLICATION_REVIEWED":
      return "linear-gradient(135deg, #6366f1, #8b5cf6)";
    case "SHORT_TERM_APPLICATION_ACCEPTED":
      return "linear-gradient(135deg, #10b981, #059669)";
    case "SHORT_TERM_WORK_SUBMITTED":
      return "linear-gradient(135deg, #f59e0b, #d97706)";
    case "INTERVIEW_SCHEDULED":
      return "linear-gradient(135deg, #06b6d4, #0891b2)";
    case "INTERVIEW_COMPLETED":
      return "linear-gradient(135deg, #6366f1, #8b5cf6)";
    case "OFFER_SENT":
      return "linear-gradient(135deg, #a855f7, #7c3aed)";
    case "OFFER_ACCEPTED":
      return "linear-gradient(135deg, #10b981, #059669)";
    case "OFFER_REJECTED":
      return "linear-gradient(135deg, #ef4444, #dc2626)";
    case "ADMIN_CANCELLATION_REJECTED":
    case "WORKER_CANCELLATION_REJECTED":
      return "linear-gradient(135deg, #f59e0b, #d97706)";
    case "WORKER_CANCELLATION_REQUESTED":
    case "RECRUITER_AUTO_APPROVED_WARNING":
    case "REVIEW_WINDOW_EXPIRING":
      return "linear-gradient(135deg, #f59e0b, #d97706)";
    case "CONTRACT_SENT_FOR_SIGNATURE":
    case "CONTRACT_SIGNED":
      return "linear-gradient(135deg, #6366f1, #8b5cf6)";
    case "CONTRACT_REJECTED":
    case "CONTRACT_CANCELLED":
    case "CONTRACT_EXPIRED":
      return "linear-gradient(135deg, #ef4444, #dc2626)";
    case "WELCOME":
      return "linear-gradient(135deg, #6366f1, #8b5cf6)";
    case "SYSTEM":
      return "linear-gradient(135deg, #3b82f6, #2563eb)";
    case "WARNING":
      return "linear-gradient(135deg, #f59e0b, #d97706)";
    case "VIOLATION_REPORT":
      return "linear-gradient(135deg, #ef4444, #dc2626)";
    default:
      return "linear-gradient(135deg, #6366f1, #8b5cf6)";
  }
};

// ==================== COMPONENT ====================
const NotificationPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);
  const selectedDisplay = selectedNotification
    ? formatNotificationDisplay(selectedNotification)
    : null;
  const navigate = useNavigate();
  const { user } = useAuth();

  const fetchStats = async () => {
    try {
      const [total, unread] = await Promise.all([
        notificationService.getTotalCount(),
        notificationService.getUnreadCount(),
      ]);
      setTotalCount(total);
      setUnreadCount(unread);
    } catch (error) {
      console.error("Failed to fetch stats", error);
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      let isReadParam: boolean | undefined = undefined;
      if (filter === "unread") isReadParam = false;
      if (filter === "read") isReadParam = true;

      const data = await notificationService.getUserNotifications(
        page,
        10,
        isReadParam,
      );
      setNotifications(data.content);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [page, filter]);

  const handleMarkAsRead = async (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      fetchStats();
    } catch (error) {
      console.error("Failed to mark as read", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      fetchStats();
    } catch (error) {
      console.error("Failed to mark all as read", error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }
    setSelectedNotification(notification);
  };

  const handleModalAction = () => {
    if (!selectedNotification) return;

    const target = getNotificationTarget(selectedNotification, user);
    setSelectedNotification(null);

    const destination = target.search
      ? `${target.pathname}${target.search}`
      : target.pathname;
    const navigateTarget = target.hash
      ? `${destination}${target.hash}`
      : destination;

    if (target.state) {
      navigate(navigateTarget, { state: target.state });
    } else {
      navigate(navigateTarget);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Vừa xong";
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days < 7) return `${days} ngày trước`;
    return date.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getActionLabel = (type: string, currentUser: any): string => {
    if (
      shouldOpenJobLabFromNotification(type, currentUser) &&
      [
        "SHORT_TERM_APPLICATION_ACCEPTED",
        "SHORT_TERM_WORK_APPROVED",
        "FULLTIME_APPLICATION_ACCEPTED",
      ].includes(type)
    ) {
      return "Mở Job Lab";
    }

    switch (type) {
      case "CONTRACT_SENT_FOR_SIGNATURE":
        return "Ký ngay";
      case "CONTRACT_SIGNED":
        return "Xem hợp đồng";
      case "CONTRACT_REJECTED":
      case "CONTRACT_CANCELLED":
      case "CONTRACT_EXPIRED":
        return "Xem chi tiết";
      case "BOOKING_CREATED":
      case "BOOKING_CONFIRMED":
      case "BOOKING_REMINDER":
        return "Xem booking";
      case "BOOKING_REJECTED":
      case "BOOKING_CANCELLED":
        return "Xem chi tiết";
      case "PREMIUM_PURCHASE":
        return "Kiểm tra Premium";
      case "PREMIUM_EXPIRATION":
        return "Gia hạn ngay";
      case "WALLET_DEPOSIT":
      case "COIN_PURCHASE":
        return "Xem ví";
      case "WITHDRAWAL_APPROVED":
      case "WITHDRAWAL_REJECTED":
        return "Xem ví";
      case "ESCROW_FUNDED":
      case "ESCROW_RELEASED":
      case "ESCROW_REFUNDED":
        return "Xem ví";
      case "DISPUTE_OPENED":
      case "DISPUTE_RESOLVED":
        return "Xem khiếu nại";
      case "WORKER_CANCELLATION_REQUESTED":
        return "Mở Dispute";
      case "WORKER_AUTO_CANCELLED":
      case "ADMIN_CANCELLATION_REJECTED":
      case "WORKER_CANCELLATION_REJECTED":
        return "Mở Job Lab";
      case "INTERVIEW_SCHEDULED":
      case "INTERVIEW_COMPLETED":
        return "Xem lịch phỏng vấn";
      case "OFFER_SENT":
      case "OFFER_ACCEPTED":
      case "OFFER_REJECTED":
        return "Xem đề nghị";
      case "SHORT_TERM_APPLICATION_ACCEPTED":
      case "FULLTIME_APPLICATION_ACCEPTED":
        return "Xem hợp đồng";
      case "SHORT_TERM_WORK_APPROVED":
        return "Xem thanh toán";
      case "WELCOME":
        return "Khám phá ngay";
      case "VIOLATION_REPORT":
        return "Xem báo cáo";
      case "MENTOR_LEVEL_UP":
      case "MENTOR_BADGE_AWARDED":
        return "Xem thành tích";
      case "COURSE_REJECTED":
      case "COURSE_SUSPENDED":
      case "COURSE_RESTORED":
        return "Xem khóa học";
      default:
        return "Xem chi tiết";
    }
  };

  return (
    <div className="notification-page">
      <Header />

      {/* Background Effects */}
      <div className="notif-bg-effects">
        <div className="notif-grid-overlay"></div>
        <div className="notif-glow-orb orb-1"></div>
        <div className="notif-glow-orb orb-2"></div>
        <div className="notif-glow-orb orb-3"></div>
      </div>

      {/* Hero Section */}
      <section className="notif-hero">
        <motion.div
          className="hero-content"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="hero-icon-container">
            <Bell size={64} className="hero-icon" />
            <div className="icon-glow-ring"></div>
          </div>
          <h1 className="hero-title">
            <span className="title-gradient">TRUNG TÂM THÔNG BÁO</span>
          </h1>
          <p className="hero-tagline">NOTIFICATION CENTER</p>

          <button
            className="filter-btn"
            onClick={handleMarkAllAsRead}
            style={{ margin: "0 auto" }}
          >
            <CheckCheck size={18} />
            <span>Đánh dấu tất cả đã đọc</span>
          </button>
        </motion.div>
      </section>

      {/* Stats Grid */}
      <motion.div
        className="notif-stats-grid"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="notif-stat-card">
          <div className="stat-icon-wrapper total">
            <Bell size={24} />
          </div>
          <div className="stat-content">
            <h3>Tổng thông báo</h3>
            <p className="stat-value">{totalCount}</p>
          </div>
        </div>
        <div className="notif-stat-card">
          <div className="stat-icon-wrapper unread">
            <Mail size={24} />
          </div>
          <div className="stat-content">
            <h3>Chưa đọc</h3>
            <p className="stat-value">{unreadCount}</p>
          </div>
        </div>
        <div className="notif-stat-card">
          <div className="stat-icon-wrapper read">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <h3>Đã đọc</h3>
            <p className="stat-value">{totalCount - unreadCount}</p>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        className="notif-filters"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <button
          className={`filter-btn ${filter === "all" ? "active" : ""}`}
          onClick={() => {
            setFilter("all");
            setPage(0);
          }}
        >
          <Filter size={18} />
          <span>Tất cả</span>
        </button>
        <button
          className={`filter-btn ${filter === "unread" ? "active" : ""}`}
          onClick={() => {
            setFilter("unread");
            setPage(0);
          }}
        >
          <Mail size={18} />
          <span>Chưa đọc</span>
        </button>
        <button
          className={`filter-btn ${filter === "read" ? "active" : ""}`}
          onClick={() => {
            setFilter("read");
            setPage(0);
          }}
        >
          <CheckCircle size={18} />
          <span>Đã đọc</span>
        </button>
      </motion.div>

      {/* Notification List */}
      <div className="notif-list-container">
        {loading ? (
          <div
            style={{
              padding: 40,
              textAlign: "center",
              color: "var(--notif-text-dim)",
            }}
          >
            <MeowlKuruLoader text="Đang tải thông báo..." size="small" />
          </div>
        ) : notifications.length === 0 ? (
          <div
            style={{
              padding: 60,
              textAlign: "center",
              color: "var(--notif-text-dim)",
            }}
          >
            <Bell size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
            <p>Không có thông báo nào</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {notifications.map((notification, index) => {
              const display = formatNotificationDisplay(notification);

              return (
                <motion.div
                  key={notification.id}
                  className={`notif-item ${!notification.isRead ? "unread" : ""}`}
                  onClick={() => handleNotificationClick(notification)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.01 }}
                >
                  <div
                    className="notif-icon-wrapper"
                    style={{
                      background: `rgba(${notification.type === "CONTRACT_SIGNED" || notification.type === "CONTRACT_SENT_FOR_SIGNATURE" ? "99, 102, 241" : "0, 212, 255"}, 0.1)`,
                      color: getIconColor(notification.type),
                      border: `1px solid ${getIconColor(notification.type)}40`,
                    }}
                  >
                    {notification.senderAvatar ? (
                      <img
                        src={notification.senderAvatar}
                        alt={notification.senderName || "User"}
                        style={{
                          width: "100%",
                          height: "100%",
                          borderRadius: "12px",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <div style={{ color: getIconColor(notification.type) }}>
                        {getIcon(notification.type)}
                      </div>
                    )}
                  </div>
                  <div className="notif-content">
                    <div className="notif-header-row">
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          flexWrap: "wrap",
                        }}
                      >
                        <h4 className="notif-title">{display.title}</h4>
                        <span
                          className="notif-type-badge"
                          style={{
                            background: `${getIconColor(notification.type)}20`,
                            color: getIconColor(notification.type),
                            border: `1px solid ${getIconColor(notification.type)}40`,
                            padding: "2px 8px",
                            borderRadius: "6px",
                            fontSize: "0.7rem",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          {getTypeLabel(notification.type)}
                        </span>
                        {display.disputeOutcomeLabel && (
                          <span
                            className={`notif-dispute-pill notif-dispute-pill--${display.disputeOutcomeTone || "neutral"}`}
                          >
                            {display.disputeOutcomeLabel}
                          </span>
                        )}
                      </div>
                      <span className="notif-time">
                        <Clock size={14} />
                        {formatTime(notification.createdAt)}
                      </span>
                    </div>
                    <p className="notif-message">
                      {notification.senderName && (
                        <span
                          style={{
                            fontWeight: "bold",
                            color: getIconColor(notification.type),
                            marginRight: "6px",
                          }}
                        >
                          {notification.senderName}
                        </span>
                      )}
                      {display.message}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination-bar">
          <button
            className="pagination-btn"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            <ChevronLeft size={20} />
          </button>
          <span className="pagination-text">
            Trang {page + 1} / {totalPages}
          </span>
          <button
            className="pagination-btn"
            disabled={page === totalPages - 1}
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      {/* Enhanced Detail Modal */}
      <AnimatePresence>
        {selectedNotification && (
          <motion.div
            className="notif-modal-overlay"
            onClick={() => setSelectedNotification(null)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="notif-modal notif-modal-enhanced"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
            >
              <button
                className="modal-close-btn"
                onClick={() => setSelectedNotification(null)}
              >
                <XCircle size={24} />
              </button>

              {/* Modal Header Banner */}
              <div
                className="notif-modal-banner"
                style={{
                  background: getTypeBannerColor(selectedNotification.type),
                }}
              >
                <div
                  className="modal-icon-large"
                  style={{
                    background: "rgba(255,255,255,0.2)",
                    border: "2px solid rgba(255,255,255,0.4)",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  {getIcon(selectedNotification.type)}
                </div>
                <div className="modal-banner-info">
                  <span className="modal-type-badge">
                    {getTypeLabel(selectedNotification.type)}
                  </span>
                  <h2
                    className="modal-title"
                    style={{
                      color: "white",
                      textShadow: "0 2px 8px rgba(0,0,0,0.3)",
                    }}
                  >
                    {selectedDisplay?.title || selectedNotification.title}
                  </h2>
                </div>
              </div>

              <div className="modal-content-wrapper">
                {/* Sender info */}
                {selectedNotification.senderName && (
                  <div className="modal-sender-info">
                    <div
                      className="modal-sender-avatar"
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: "50%",
                        background: `${getIconColor(selectedNotification.type)}20`,
                        border: `2px solid ${getIconColor(selectedNotification.type)}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                        margin: "0 auto",
                      }}
                    >
                      {selectedNotification.senderAvatar ? (
                        <img
                          src={selectedNotification.senderAvatar}
                          alt={selectedNotification.senderName}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <Users
                          size={20}
                          style={{
                            color: getIconColor(selectedNotification.type),
                          }}
                        />
                      )}
                    </div>
                    <span className="modal-sender-name">
                      {selectedNotification.senderName}
                    </span>
                  </div>
                )}

                {/* Message */}
                <div
                  className="modal-message-box"
                  style={{
                    background: `${getIconColor(selectedNotification.type)}08`,
                    border: `1px solid ${getIconColor(selectedNotification.type)}20`,
                    borderRadius: "12px",
                    padding: "16px",
                    marginBottom: "20px",
                  }}
                >
                  <p
                    className="modal-message"
                    style={{ color: "var(--notif-text)" }}
                  >
                    {selectedDisplay?.isDispute
                      ? selectedDisplay.message
                      : getTypeDescription(
                          selectedNotification.type,
                          selectedNotification.message,
                        )}
                  </p>
                  {selectedDisplay?.isDispute &&
                    selectedDisplay.disputeOutcomeLabel && (
                      <div
                        className={`modal-dispute-outcome modal-dispute-outcome--${selectedDisplay.disputeOutcomeTone || "neutral"}`}
                      >
                        <Scale size={16} />
                        <div>
                          <strong>
                            Kết quả xử lý: {selectedDisplay.disputeOutcomeLabel}
                          </strong>
                          {selectedDisplay.disputeOutcomeHint && (
                            <p>{selectedDisplay.disputeOutcomeHint}</p>
                          )}
                        </div>
                      </div>
                    )}
                  {selectedDisplay?.rawMessage &&
                    selectedDisplay.rawMessage !== selectedDisplay.message && (
                      <p
                        className="modal-message-raw"
                        style={{
                          color: "var(--notif-text-dim)",
                          fontSize: "0.9rem",
                          marginTop: "8px",
                          fontStyle: "italic",
                        }}
                      >
                        "{selectedDisplay.rawMessage}"
                      </p>
                    )}
                </div>

                {/* Metadata row */}
                <div className="modal-meta-row">
                  <span className="modal-meta-item">
                    <Clock size={14} />
                    {formatTime(selectedNotification.createdAt)}
                  </span>
                  {selectedNotification.relatedId && (
                    <span className="modal-meta-item">
                      <FileText size={14} />
                      ID: {selectedNotification.relatedId}
                    </span>
                  )}
                </div>

                {/* Contract-specific signing CTA */}
                {selectedNotification.type ===
                  "CONTRACT_SENT_FOR_SIGNATURE" && (
                  <div className="modal-contract-cta">
                    <PenLine size={20} />
                    <span>
                      Hợp đồng đang chờ bạn ký. Vui lòng kiểm tra nội dung và ký
                      trong 72 giờ.
                    </span>
                  </div>
                )}
                {selectedNotification.type === "CONTRACT_SIGNED" && (
                  <div
                    className="modal-contract-cta"
                    style={{
                      background: "rgba(16, 185, 129, 0.1)",
                      borderColor: "rgba(16, 185, 129, 0.3)",
                    }}
                  >
                    <CheckCircle size={20} style={{ color: "#10b981" }} />
                    <span>
                      Hợp đồng đã được cả hai bên ký và có hiệu lực pháp luật.
                    </span>
                  </div>
                )}
                {(selectedNotification.type === "CONTRACT_REJECTED" ||
                  selectedNotification.type === "CONTRACT_CANCELLED" ||
                  selectedNotification.type === "CONTRACT_EXPIRED") && (
                  <div
                    className="modal-contract-cta"
                    style={{
                      background: "rgba(239, 68, 68, 0.1)",
                      borderColor: "rgba(239, 68, 68, 0.3)",
                    }}
                  >
                    <AlertTriangle size={20} style={{ color: "#ef4444" }} />
                    <span>
                      Hợp đồng không còn hiệu lực. Bạn có thể liên hệ bên kia để
                      tạo hợp đồng mới.
                    </span>
                  </div>
                )}

                {/* Action Button */}
                <div className="modal-actions">
                  <button
                    className="modal-btn"
                    onClick={handleModalAction}
                    style={{
                      background: getTypeBannerColor(selectedNotification.type),
                      minWidth: "180px",
                    }}
                  >
                    {getIcon(selectedNotification.type)}
                    {getActionLabel(selectedNotification.type, user)}
                  </button>
                  <button
                    className="modal-btn modal-btn-secondary"
                    onClick={() => setSelectedNotification(null)}
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationPage;
