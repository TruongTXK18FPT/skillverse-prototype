import { API_BASE_URL } from '../services/axiosInstance';

export const resolveRecruitmentAssetUrl = (raw?: string | null): string | undefined => {
  if (!raw) {
    return undefined;
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    return undefined;
  }

  if (/^(https?:\/\/|blob:|data:|mailto:|tel:|#)/i.test(trimmed)) {
    return trimmed;
  }

  const apiRoot = API_BASE_URL.replace(/\/api$/i, '');
  return trimmed.startsWith('/') ? `${apiRoot}${trimmed}` : `${apiRoot}/${trimmed}`;
};

export const getApplicantDisplayName = (
  fullName?: string | null,
  email?: string | null,
): string => {
  const trimmedName = fullName?.trim();
  if (trimmedName) {
    return trimmedName;
  }

  const localPart = email?.split('@')[0]?.trim();
  if (localPart) {
    return localPart;
  }

  return 'Ứng viên SkillVerse';
};

export const getApplicantInitials = (
  fullName?: string | null,
  email?: string | null,
): string => {
  const displayName = getApplicantDisplayName(fullName, email);
  const parts = displayName
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return '?';
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] || ''}${parts[parts.length - 1][0] || ''}`.toUpperCase();
};

export const getApplicantSubtitle = (
  professionalTitle?: unknown,
  hasPortfolio?: boolean,
): string => {
  const trimmedTitle =
    typeof professionalTitle === 'string'
      ? professionalTitle.trim()
      : typeof professionalTitle === 'number'
        ? String(professionalTitle).trim()
        : '';

  if (trimmedTitle) {
    return trimmedTitle;
  }

  return hasPortfolio ? 'Có portfolio công khai' : 'Ứng viên đã nộp đơn';
};

export const getPortfolioPath = (portfolioSlug?: string | null): string | null => {
  const trimmed = portfolioSlug?.trim();
  return trimmed ? `/portfolio/${trimmed}` : null;
};
