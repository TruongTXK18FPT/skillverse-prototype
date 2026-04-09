// ==================== ENUMS ====================

export enum ContractType {
  PROBATION = 'PROBATION',
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
}

export enum ContractStatus {
  DRAFT = 'DRAFT',
  PENDING_SIGNER = 'PENDING_SIGNER',
  PENDING_EMPLOYER = 'PENDING_EMPLOYER',
  SIGNED = 'SIGNED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export enum SignatureAction {
  SIGN = 'SIGN',
  REJECT = 'REJECT',
}

// ==================== INTERFACES ====================

export interface ContractSignature {
  id?: number;
  signedBy?: number;
  signedByName?: string;
  signedByRole?: string;
  status?: string;
  signatureImageUrl?: string;
  signedAt?: string;
}

export interface Contract {
  id: number;
  contractNumber: string;
  applicationId?: number;
  jobId?: number;

  // Contract type & status
  contractType: ContractType;
  status: ContractStatus;

  // Job content
  jobTitle?: string;
  workingLocation?: string;
  candidatePosition?: string;
  jobDescription?: string;

  // Probation
  probationMonths?: number;
  probationSalary?: number;
  probationSalaryText?: string;
  probationEvaluationCriteria?: string;
  probationObjectives?: string;

  // Compensation
  salary: number;
  salaryText: string;
  salaryPaymentDate?: number;
  paymentMethod?: string;
  mealAllowance?: number;
  transportAllowance?: number;
  housingAllowance?: number;
  otherAllowances?: string;
  bonusPolicy?: string;

  // Working hours & leave
  workingHoursPerDay?: number;
  workingHoursPerWeek?: number;
  workingSchedule?: string;
  remoteWorkPolicy?: string;
  annualLeaveDays?: number;
  leavePolicy?: string;

  // Benefits & insurance
  insurancePolicy?: string;
  healthCheckupAnnual?: boolean;
  trainingPolicy?: string;
  otherBenefits?: string;

  // Legal clauses
  legalText?: string;
  confidentialityClause?: string;
  ipClause?: string;
  nonCompeteClause?: string;
  nonCompeteDurationMonths?: number;
  terminationNoticeDays?: number;
  terminationClause?: string;

  // Dates
  startDate: string;
  endDate?: string;

  // Employer info
  employerId: number;
  employerName: string;
  employerEmail: string;
  employerCompanyName?: string;
  employerAddress?: string;
  employerCompanyAddress?: string;
  employerTaxId?: string;

  // Candidate info
  candidateId: number;
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  candidateAddress?: string;
  candidateDateOfBirth?: string;
  candidateIdCardNumber?: string;
  candidateIdCardPlace?: string;

  // Signatures
  employerSignature?: ContractSignature;
  employerSignatureUrl?: string;
  employerSignedAt?: string;
  candidateSignature?: ContractSignature;
  candidateSignatureUrl?: string;
  candidateSignedAt?: string;

  // PDF
  signedPdfUrl?: string;
  pdfUrl?: string;
  monthlySalary?: number;

  // Metadata
  createdAt: string;
  updatedAt: string;
  signedAt?: string;
}

// ==================== REQUEST DTOs ====================

export interface CreateContractRequest {
  applicationId?: number;
  contractType: ContractType;
  // Job content
  jobTitle?: string;
  workingLocation?: string;
  candidatePosition?: string;
  jobDescription?: string;
  // Probation
  probationMonths?: number;
  probationSalary?: number;
  probationSalaryText?: string;
  probationEvaluationCriteria?: string;
  probationObjectives?: string;
  // Compensation
  salary: number;
  salaryText: string;
  salaryPaymentDate?: number;
  paymentMethod?: string;
  mealAllowance?: number;
  transportAllowance?: number;
  housingAllowance?: number;
  otherAllowances?: string;
  bonusPolicy?: string;
  // Working hours & leave
  workingHoursPerDay?: number;
  workingHoursPerWeek?: number;
  workingSchedule?: string;
  remoteWorkPolicy?: string;
  annualLeaveDays?: number;
  leavePolicy?: string;
  // Benefits
  insurancePolicy?: string;
  healthCheckupAnnual?: boolean;
  trainingPolicy?: string;
  otherBenefits?: string;
  // Legal clauses
  legalText?: string;
  confidentialityClause?: string;
  ipClause?: string;
  nonCompeteClause?: string;
  nonCompeteDurationMonths?: number;
  terminationNoticeDays?: number;
  terminationClause?: string;
  // Dates
  startDate: string;
  endDate?: string;
  // Candidate info for contract
  candidateDateOfBirth?: string;
  candidateIdCardNumber?: string;
  candidateIdCardPlace?: string;
  candidateAddress?: string;
}

export interface UpdateContractRequest {
  contractType?: ContractType;
  jobTitle?: string;
  workingLocation?: string;
  candidatePosition?: string;
  jobDescription?: string;
  probationMonths?: number;
  probationSalary?: number;
  probationSalaryText?: string;
  probationEvaluationCriteria?: string;
  probationObjectives?: string;
  salary?: number;
  salaryText?: string;
  salaryPaymentDate?: number;
  paymentMethod?: string;
  mealAllowance?: number;
  transportAllowance?: number;
  housingAllowance?: number;
  otherAllowances?: string;
  bonusPolicy?: string;
  workingHoursPerDay?: number;
  workingHoursPerWeek?: number;
  workingSchedule?: string;
  remoteWorkPolicy?: string;
  annualLeaveDays?: number;
  leavePolicy?: string;
  insurancePolicy?: string;
  healthCheckupAnnual?: boolean;
  trainingPolicy?: string;
  otherBenefits?: string;
  legalText?: string;
  confidentialityClause?: string;
  ipClause?: string;
  nonCompeteClause?: string;
  nonCompeteDurationMonths?: number;
  terminationNoticeDays?: number;
  terminationClause?: string;
  startDate?: string;
  endDate?: string;
  candidateDateOfBirth?: string;
  candidateIdCardNumber?: string;
  candidateIdCardPlace?: string;
  candidateAddress?: string;
}

export interface SignContractRequest {
  action: SignatureAction;
  signatureImageUrl?: string;
  rejectionReason?: string;
}

// ==================== RESPONSE DTOs ====================

export interface ContractResponse extends Contract {
  applicationJobTitle?: string;
  userId?: number;
  userFullName?: string;
  version?: number;
}

export interface ContractListResponse {
  id: number;
  contractNumber: string;
  applicationId?: number;
  jobId?: number;
  contractType: ContractType;
  status: ContractStatus;
  salary: number;
  monthlySalary?: number;
  salaryText: string;
  startDate: string;
  endDate?: string;
  probationMonths?: number;
  workingLocation?: string;
  jobTitle?: string;
  candidateName: string;
  candidateEmail: string;
  employerName: string;
  employerEmail: string;
  employerCompanyName?: string;
  createdAt: string;
  signedAt?: string;
}

// ==================== DISPLAY HELPERS ====================

export interface ContractStatusDisplayInfo {
  text: string;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
}

export const CONTRACT_STATUS_DISPLAY: Record<ContractStatus, ContractStatusDisplayInfo> = {
  [ContractStatus.DRAFT]: {
    text: 'Bản nháp',
    color: 'text-gray-700',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-300',
    description: 'Hợp đồng đang được soạn thảo, chưa được gửi đi.',
  },
  [ContractStatus.PENDING_SIGNER]: {
    text: 'Chờ ứng viên ký',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300',
    description: 'Hợp đồng đã được gửi đến ứng viên, đang chờ ứng viên ký.',
  },
  [ContractStatus.PENDING_EMPLOYER]: {
    text: 'Chờ nhà tuyển dụng ký',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-300',
    description: 'Ứng viên đã ký, đang chờ nhà tuyển dụng đối ký.',
  },
  [ContractStatus.SIGNED]: {
    text: 'Đã ký',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-300',
    description: 'Cả hai bên đã ký, hợp đồng có hiệu lực.',
  },
  [ContractStatus.REJECTED]: {
    text: 'Bị từ chối',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-300',
    description: 'Một trong hai bên đã từ chối ký hợp đồng.',
  },
  [ContractStatus.CANCELLED]: {
    text: 'Đã hủy',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-400',
    description: 'Hợp đồng đã bị hủy bỏ.',
  },
};

export interface ContractTypeDisplayInfo {
  text: string;
  description: string;
}

export const CONTRACT_TYPE_DISPLAY: Record<ContractType, ContractTypeDisplayInfo> = {
  [ContractType.PROBATION]: {
    text: 'Hợp đồng thử việc',
    description: 'Theo Bộ luật Lao động 2019, Điều 25-27',
  },
  [ContractType.FULL_TIME]: {
    text: 'Hợp đồng lao động',
    description: 'Hợp đồng không xác định thời hạn, theo Bộ luật Lao động 2019, Điều 20-24',
  },
  [ContractType.PART_TIME]: {
    text: 'Hợp đồng thời vụ',
    description: 'Hợp đồng theo công việc / thời vụ',
  },
};

// ==================== SALARY TEXT HELPERS ====================

export function numberToVietnameseWords(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) return 'không';

  const digits = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
  const scales = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ'];

  const readTwoDigits = (value: number, full: boolean): string => {
    const tens = Math.floor(value / 10);
    const units = value % 10;
    if (tens === 0) return units === 0 ? '' : full ? `lẻ ${digits[units]}` : digits[units];
    if (tens === 1) {
      if (units === 0) return 'mười';
      if (units === 5) return 'mười lăm';
      return `mười ${digits[units]}`;
    }
    let result = `${digits[tens]} mươi`;
    if (units === 1) return `${result} mốt`;
    if (units === 4) return `${result} tư`;
    if (units === 5) return `${result} lăm`;
    if (units > 0) result += ` ${digits[units]}`;
    return result;
  };

  const readThreeDigits = (value: number, full: boolean): string => {
    const hundreds = Math.floor(value / 100);
    const rest = value % 100;
    const parts: string[] = [];
    if (hundreds > 0 || full) parts.push(`${digits[hundreds]} trăm`);
    if (rest > 0) parts.push(readTwoDigits(rest, hundreds > 0 || full));
    return parts.join(' ').trim();
  };

  const chunks: number[] = [];
  let remaining = Math.floor(amount);
  while (remaining > 0) { chunks.push(remaining % 1000); remaining = Math.floor(remaining / 1000); }
  if (chunks.length > scales.length) return amount.toLocaleString('vi-VN');

  const segments: string[] = [];
  for (let i = chunks.length - 1; i >= 0; i--) {
    const chunk = chunks[i];
    if (chunk === 0) continue;
    const hasHigher = segments.length > 0;
    const seg = readThreeDigits(chunk, hasHigher && chunk < 100);
    segments.push(scales[i] ? `${seg} ${scales[i]}` : seg);
  }
  return segments.join(' ').replace(/\s+/g, ' ').trim();
}

export function formatSalaryText(amount: number): string {
  return `${numberToVietnameseWords(amount)} đồng (${amount.toLocaleString('vi-VN')})`;
}

// ==================== CONTRACT TYPE ====================
// Re-export ContractType from this file for consumers
export type { ContractType as CT };
