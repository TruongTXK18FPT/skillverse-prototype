export interface CertificateDTO {
  id: number;
  courseId: number;
  userId: number;
  courseTitle: string;
  recipientName: string;
  instructorName: string;
  instructorSignatureUrl?: string | null;
  issuerName: string;
  type: string;
  serial: string;
  issuedAt: string;
  revokedAt?: string | null;
  criteria?: string | null;
}

export interface CertificateVerificationDTO {
  serial: string;
  courseTitle: string;
  recipientName: string;
  instructorName: string;
  instructorSignatureUrl?: string | null;
  issuerName: string;
  type: string;
  issuedAt: string;
  revokedAt?: string | null;
  verificationStatus: "VALID" | "REVOKED";
  completionStatement: string;
  disclaimer: string;
}
