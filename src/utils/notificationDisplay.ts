import { Notification } from "../services/notificationService";

type DisputeTone = "neutral" | "warning" | "success" | "danger";

export interface NotificationDisplay {
  title: string;
  message: string;
  rawMessage: string;
  isDispute: boolean;
  disputeOutcomeCode?: string;
  disputeOutcomeLabel?: string;
  disputeOutcomeTone?: DisputeTone;
  disputeOutcomeHint?: string;
}

const DISPUTE_OUTCOME_META: Record<
  string,
  { label: string; tone: DisputeTone; hint: string }
> = {
  NO_ACTION: {
    label: "Không thay đổi kết quả",
    tone: "neutral",
    hint: "Admin chưa áp dụng hoàn tiền hay giải ngân bổ sung.",
  },
  FULL_REFUND: {
    label: "Hoàn tiền 100%",
    tone: "success",
    hint: "Toàn bộ số tiền được hoàn cho bên khiếu nại theo quyết định Admin.",
  },
  FULL_RELEASE: {
    label: "Giải ngân 100%",
    tone: "success",
    hint: "Toàn bộ khoản giữ trong escrow được giải ngân.",
  },
  PARTIAL_REFUND: {
    label: "Hoàn tiền một phần",
    tone: "warning",
    hint: "Admin áp dụng hoàn tiền theo tỷ lệ cho bên khiếu nại.",
  },
  PARTIAL_RELEASE: {
    label: "Giải ngân một phần",
    tone: "warning",
    hint: "Khoản thanh toán được chia theo tỷ lệ sau khi xử lý khiếu nại.",
  },
  RECRUITER_WINS: {
    label: "Nhà tuyển dụng thắng khiếu nại",
    tone: "success",
    hint: "Kết quả nghiêng về phía nhà tuyển dụng sau khi Admin rà soát.",
  },
  WORKER_WINS: {
    label: "Ứng viên thắng khiếu nại",
    tone: "success",
    hint: "Kết quả nghiêng về phía ứng viên sau khi Admin rà soát.",
  },
  WORKER_PARTIAL: {
    label: "Ứng viên nhận thanh toán một phần",
    tone: "warning",
    hint: "Admin cho phép ứng viên nhận một phần thanh toán.",
  },
  RECRUITER_WARNING: {
    label: "Nhà tuyển dụng bị cảnh báo",
    tone: "warning",
    hint: "Admin đã ghi nhận vi phạm và gửi cảnh báo đến nhà tuyển dụng.",
  },
  RESUBMIT_REQUIRED: {
    label: "Yêu cầu nộp lại",
    tone: "warning",
    hint: "Công việc cần được nộp lại theo yêu cầu từ Admin.",
  },
  CANCEL_JOB: {
    label: "Hủy công việc",
    tone: "danger",
    hint: "Công việc bị hủy theo quyết định xử lý khiếu nại.",
  },
};

const DISPUTE_OUTCOME_CODES = Object.keys(DISPUTE_OUTCOME_META);

const normalizeSpaces = (value: string | undefined): string =>
  (value ?? "").replace(/\s+/g, " ").trim();

const extractQuotedText = (message: string): string | undefined => {
  const match = message.match(/"([^"]+)"/);
  return match?.[1]?.trim();
};

const extractDisputeOutcomeCode = (
  title: string,
  message: string,
): string | undefined => {
  const merged = `${title} ${message}`.toUpperCase();
  const explicitMatch = merged.match(
    /(?:OUTCOME|RESOLUTION)\s*[:=-]\s*([A-Z_]+)/,
  );
  if (explicitMatch?.[1] && DISPUTE_OUTCOME_META[explicitMatch[1]]) {
    return explicitMatch[1];
  }

  return DISPUTE_OUTCOME_CODES.find((code) => merged.includes(code));
};

const buildDisputeOpenedDisplay = (
  notification: Pick<Notification, "title" | "message">,
): NotificationDisplay => {
  const rawMessage = normalizeSpaces(notification.message);
  const quotedJobTitle = extractQuotedText(rawMessage);
  const normalizedTitle = "Khiếu nại đã được gửi lên Admin";

  if (/learner/i.test(rawMessage)) {
    const reasonMatch = rawMessage.match(/dispute\s*:\s*(.+)$/i);
    const reason = normalizeSpaces(reasonMatch?.[1]);

    return {
      title: normalizedTitle,
      message: reason
        ? `Học viên đã mở khiếu nại với lý do: "${reason}". Admin sẽ xem xét trong thời gian sớm nhất.`
        : "Học viên đã mở khiếu nại cho phiên làm việc. Admin sẽ xem xét trong thời gian sớm nhất.",
      rawMessage,
      isDispute: true,
    };
  }

  if (quotedJobTitle) {
    return {
      title: normalizedTitle,
      message: `Ứng viên đã gửi khiếu nại cho công việc "${quotedJobTitle}". Admin sẽ xem xét trong vòng 5 ngày làm việc.`,
      rawMessage,
      isDispute: true,
    };
  }

  if (rawMessage) {
    return {
      title: normalizedTitle,
      message: rawMessage,
      rawMessage,
      isDispute: true,
    };
  }

  return {
    title: normalizedTitle,
    message: "Khiếu nại đã được ghi nhận. Admin sẽ xem xét và phản hồi sớm.",
    rawMessage,
    isDispute: true,
  };
};

const buildDisputeResolvedDisplay = (
  notification: Pick<Notification, "title" | "message">,
): NotificationDisplay => {
  const rawMessage = normalizeSpaces(notification.message);
  const outcomeCode = extractDisputeOutcomeCode(
    notification.title,
    notification.message,
  );
  const outcomeMeta = outcomeCode
    ? DISPUTE_OUTCOME_META[outcomeCode]
    : undefined;

  let messagePrefix = "Khiếu nại đã được xử lý bởi Admin.";
  if (/your dispute/i.test(rawMessage)) {
    messagePrefix = "Khiếu nại của bạn đã được xử lý.";
  } else if (/one of your jobs/i.test(rawMessage)) {
    messagePrefix = "Khiếu nại của một công việc đã được xử lý.";
  } else if (/đã|đã|giai quyet|giải quyết/i.test(rawMessage)) {
    messagePrefix = "Khiếu nại đã được xử lý.";
  }

  const normalizedMessage = outcomeMeta
    ? `${messagePrefix} Kết quả: ${outcomeMeta.label}.`
    : rawMessage || messagePrefix;

  return {
    title: "Khiếu nại đã được giải quyết",
    message: normalizedMessage,
    rawMessage,
    isDispute: true,
    disputeOutcomeCode: outcomeCode,
    disputeOutcomeLabel: outcomeMeta?.label,
    disputeOutcomeTone: outcomeMeta?.tone,
    disputeOutcomeHint: outcomeMeta?.hint,
  };
};

const buildDisputeEscalatedDisplay = (
  notification: Pick<Notification, "message">,
): NotificationDisplay => {
  const rawMessage = normalizeSpaces(notification.message);

  return {
    title: "Khiếu nại đã được chuyển cấp Admin",
    message:
      rawMessage ||
      "Hệ thống đã chuyển khiếu nại lên Admin để ưu tiên xử lý. Vui lòng theo dõi cập nhật tiếp theo.",
    rawMessage,
    isDispute: true,
  };
};

const buildDisputeEligibilityDisplay = (
  notification: Pick<Notification, "message">,
): NotificationDisplay => {
  const rawMessage = normalizeSpaces(notification.message);

  return {
    title: "Đã mở quyền khiếu nại",
    message:
      rawMessage ||
      "Bạn đã đủ điều kiện mở khiếu nại cho công việc hiện tại. Hãy bổ sung đầy đủ bằng chứng trước khi gửi.",
    rawMessage,
    isDispute: true,
  };
};

export const formatNotificationDisplay = (
  notification: Pick<Notification, "type" | "title" | "message">,
): NotificationDisplay => {
  switch (notification.type) {
    case "DISPUTE_OPENED":
      return buildDisputeOpenedDisplay(notification);
    case "DISPUTE_RESOLVED":
      return buildDisputeResolvedDisplay(notification);
    case "ADMIN_DISPUTE_ESCALATED":
      return buildDisputeEscalatedDisplay(notification);
    case "DISPUTE_ELIGIBILITY_UNLOCKED":
      return buildDisputeEligibilityDisplay(notification);
    default:
      return {
        title: notification.title,
        message: notification.message,
        rawMessage: notification.message,
        isDispute: false,
      };
  }
};
