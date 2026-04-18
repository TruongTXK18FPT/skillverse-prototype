/**
 * Skill DTOs — mirrors BE SkillDto
 * All skill names are stored UPPERCASE in the DB.
 */
export interface SkillDto {
  id: number;
  name: string;
  category?: string | null;
  description?: string | null;
  parentSkillId?: number | null;
  createdAt?: string;
  updatedAt?: string;
}
