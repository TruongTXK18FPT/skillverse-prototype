import axiosInstance from './axiosInstance';
import { SkillDto } from '../data/skillDTOs';
import { PageResponse } from '../data/courseDTOs';

const API_BASE = '/skills';

/**
 * Skill Service
 * Matches BE SkillController endpoints.
 *
 * Normalization rules:
 * - All skill names stored as UPPERCASE with underscores for separators
 * - "java core" / "java-core" / "java_core" → "JAVA_CORE"
 * - FE normalizes input BEFORE adding, BEFORE searching
 * - BE suggest endpoint uses CONTAINS (not just prefix) — typing "core" finds "JAVA_CORE"
 */
export const skillService = {
  /**
   * GET /api/skills/suggest?prefix=...
   * Case-insensitive prefix search — returns up to 10 skills.
   * All returned skill names are in UPPERCASE (BE storage format).
   *
   * @param prefix  Search prefix (not normalized — BE does case-insensitive matching)
   * @param page    Page number (default 0)
   * @param size    Page size (default 10)
   */
  suggestByPrefix: async (
    prefix: string,
    page = 0,
    size = 10,
  ): Promise<SkillDto[]> => {
    const trimmed = prefix.trim();
    if (!trimmed) return [];

    const response = await axiosInstance.get<PageResponse<SkillDto>>(
      `${API_BASE}/suggest`,
      {
        params: { prefix: trimmed, page, size },
      },
    );

    const data = response.data as Record<string, unknown>;
    const content: SkillDto[] =
      (data?.content as SkillDto[]) ??
      (data?.items as SkillDto[]) ??
      [];

    return content;
  },

  /**
   * Normalize a skill tag input value to the canonical storage format.
   * ALL non-alphanumeric chars → underscore. Then collapse consecutive underscores.
   * "java core" / "java-core" / "java_core" / "JAVA  CORE" → "JAVA_CORE"
   */
  normalize: (value: string): string =>
    value.trim().replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').replace(/_+/g, '_').toUpperCase(),
};
