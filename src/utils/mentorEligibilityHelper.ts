import type { MentorNodeEligibility, TeachingEligibilityStatus } from '../types/mentorEligibility';

export interface EligibilityDisplayInfo {
  label: string;
  badgeClass: string;
  description: string;
}

export const getEligibilityDisplayInfo = (status: TeachingEligibilityStatus): EligibilityDisplayInfo => {
  switch (status) {
    case 'ELIGIBLE':
      return {
        label: 'Phù hợp',
        badgeClass: 'rdmv-eligibility-badge--eligible',
        description: 'Đáp ứng đầy đủ các kỹ năng yêu cầu.',
      };
    case 'PARTIALLY_ELIGIBLE':
      return {
        label: 'Thiếu kỹ năng phụ',
        badgeClass: 'rdmv-eligibility-badge--partial',
        description: 'Đáp ứng kỹ năng chính, nhưng thiếu một số kỹ năng quan trọng hoặc nâng cao.',
      };
    case 'NEEDS_REVIEW':
      return {
        label: 'Cần xem xét',
        badgeClass: 'rdmv-eligibility-badge--review',
        description: 'Chưa đủ dữ liệu để đánh giá tự động. Bạn nên trao đổi trực tiếp với Mentor.',
      };
    case 'NOT_ELIGIBLE':
      return {
        label: 'Không phù hợp',
        badgeClass: 'rdmv-eligibility-badge--not-eligible',
        description: 'Không đáp ứng các kỹ năng bắt buộc cho lộ trình này.',
      };
    default:
      return {
        label: 'Không xác định',
        badgeClass: 'rdmv-eligibility-badge--review',
        description: 'Trạng thái không xác định.',
      };
  }
};

export const getMissingSkillsText = (nodeEligibility: MentorNodeEligibility): string => {
  const missing = [
    ...(nodeEligibility.missingRequiredSkills || []),
    ...(nodeEligibility.missingImportantSkills || []),
  ];
  
  if (missing.length === 0) {
    return '';
  }

  return missing
    .map((skill) => skill.skillName || skill.canonicalKey || `Skill ${skill.skillId}`)
    .join(', ');
};
