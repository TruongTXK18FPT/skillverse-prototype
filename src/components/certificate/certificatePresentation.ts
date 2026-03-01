import {
  CertificateDTO,
  CertificateVerificationDTO,
} from "../../data/certificateDTOs";

export const INTERNAL_CERTIFICATE_ISSUER = "Skillverse";
export const INTERNAL_CERTIFICATE_DISCLAIMER =
  "Đây là xác nhận hoàn thành khóa học trên nền tảng Skillverse; không mặc định là bằng cấp, văn bằng được Nhà nước công nhận, hoặc chứng chỉ hành nghề.";

export const formatCertificateDate = (value?: string) => {
  if (!value) return "Chưa cập nhật";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa cập nhật";

  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

export const buildCriteriaSummary = (certificate: CertificateDTO | null) => {
  if (!certificate?.criteria) return null;

  try {
    const parsed = JSON.parse(certificate.criteria) as {
      completedLessonCount?: number;
      totalLessonCount?: number;
      completedQuizCount?: number;
      totalQuizCount?: number;
      completedRequiredAssignmentCount?: number;
      totalRequiredAssignmentCount?: number;
    };

    const items = [
      {
        label: "Bài học đã hoàn thành",
        completed: parsed.completedLessonCount ?? 0,
        total: parsed.totalLessonCount ?? 0,
      },
      {
        label: "Bài kiểm tra đã đạt",
        completed: parsed.completedQuizCount ?? 0,
        total: parsed.totalQuizCount ?? 0,
      },
      {
        label: "Bài tập bắt buộc đã đạt",
        completed: parsed.completedRequiredAssignmentCount ?? 0,
        total: parsed.totalRequiredAssignmentCount ?? 0,
      },
    ].filter((item) => item.total > 0);

    if (!items.length) {
      return null;
    }

    return items.map(
      (item) => `${item.label}: ${item.completed}/${item.total}`,
    );
  } catch {
    return null;
  }
};

export const buildCertificateVerificationPath = (serial: string) =>
  `/certificate/verify/${encodeURIComponent(serial)}`;

export const buildLegacyCertificateVerificationPath = (serial: string) =>
  `/verify/certificate/${encodeURIComponent(serial)}`;

export const buildCertificateVerificationUrl = (serial: string) => {
  const path = buildCertificateVerificationPath(serial);
  const configuredOrigin =
    typeof import.meta !== "undefined" &&
    typeof import.meta.env?.VITE_PUBLIC_APP_URL === "string" &&
    import.meta.env.VITE_PUBLIC_APP_URL.trim().length > 0
      ? import.meta.env.VITE_PUBLIC_APP_URL.trim().replace(/\/$/, "")
      : null;

  if (configuredOrigin) {
    return `${configuredOrigin}${path}`;
  }

  if (typeof window === "undefined") {
    return path;
  }

  return `${window.location.origin}${path}`;
};

export const buildCertificateShareText = (
  certificate: Pick<
    CertificateDTO,
    "courseTitle" | "recipientName" | "serial" | "issuerName"
  >,
) => {
  const verifyUrl = buildCertificateVerificationUrl(certificate.serial);
  const recipientName = getCertificateDisplayName(
    certificate.recipientName,
    "Học viên Skillverse",
  );

  return [
    `Chứng chỉ hoàn thành khóa học: ${certificate.courseTitle}`,
    `Người nhận: ${recipientName}`,
    `Đơn vị phát hành: ${certificate.issuerName || INTERNAL_CERTIFICATE_ISSUER}`,
    `Mã chứng chỉ: ${certificate.serial}`,
    `Xem và xác thực công khai tại: ${verifyUrl}`,
  ].join("\n");
};

export const getCertificateTypeLabel = (type?: string) => {
  switch (type) {
    case "COURSE":
      return "Chứng chỉ khóa học";
    default:
      return type || "Chứng chỉ nội bộ";
  }
};

export const getCertificateDisplayName = (
  value?: string | null,
  fallback = "Skillverse",
) => {
  if (!value || !value.trim()) {
    return fallback;
  }

  const trimmed = value.trim();
  if (!trimmed.includes("@")) {
    return trimmed;
  }

  const localPart = trimmed.slice(0, trimmed.indexOf("@"));
  const normalized = localPart.replace(/[._-]+/g, " ").replace(/\s+/g, " ").trim();
  if (!normalized) {
    return fallback;
  }

  return normalized
    .split(" ")
    .map((part) =>
      part ? `${part.charAt(0).toUpperCase()}${part.slice(1)}` : part,
    )
    .join(" ");
};

export const getVerificationStatusLabel = (
  certificate: Pick<CertificateVerificationDTO, "verificationStatus" | "revokedAt">,
) => {
  if (certificate.verificationStatus === "REVOKED" || certificate.revokedAt) {
    return "Đã thu hồi";
  }

  return "Hợp lệ";
};

export const getCertificateCompletionStatement = (value?: string | null) => {
  const normalized = value?.trim();
  if (!normalized) {
    return "Chứng chỉ này xác nhận học viên đã hoàn thành các yêu cầu khóa học đã được ghi nhận trên nền tảng Skillverse.";
  }

  if (normalized.startsWith("This internal certificate confirms")) {
    return "Chứng chỉ này xác nhận học viên đã hoàn thành các yêu cầu khóa học đã được ghi nhận trên nền tảng Skillverse.";
  }

  return normalized;
};

export const getCertificateDisclaimerText = (value?: string | null) => {
  const normalized = value?.trim();
  if (!normalized) {
    return INTERNAL_CERTIFICATE_DISCLAIMER;
  }

  if (normalized.startsWith("This is a Skillverse course completion certificate.")) {
    return INTERNAL_CERTIFICATE_DISCLAIMER;
  }

  return normalized;
};
