/**
 * VerifiedSkillsBadge — Embeddable Portfolio Component
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Displays mentor-verified skills from ROADMAP_MENTORING flow.
 * Can be used in both private portfolio and public profile view.
 *
 * Aurora Violet design — distinct from Neon Tech Cyan Blue.
 */
import React, { useEffect, useState, useCallback } from 'react';
import { Award, CheckCircle, User } from 'lucide-react';
import type { UserVerifiedSkillDTO } from '../../types/NodeMentoring';
import { getVerifiedSkills, getPublicVerifiedSkills } from '../../services/nodeMentoringService';
import './VerifiedSkillsBadge.css';

interface VerifiedSkillsBadgeProps {
  /** If provided, fetches public skills. Otherwise uses authenticated user's skills. */
  userId?: number;
  /** If true, used in public profile context. */
  isPublic?: boolean;
}

const VerifiedSkillsBadge: React.FC<VerifiedSkillsBadgeProps> = ({
  userId,
  isPublic = false,
}) => {
  const [skills, setSkills] = useState<UserVerifiedSkillDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSkills = useCallback(async () => {
    try {
      setLoading(true);
      const data = isPublic && userId
        ? await getPublicVerifiedSkills(userId)
        : await getVerifiedSkills();
      setSkills(data);
    } catch {
      // Silent fail — component just shows empty state
      setSkills([]);
    } finally {
      setLoading(false);
    }
  }, [userId, isPublic]);

  useEffect(() => {
    loadSkills();
  }, [loadSkills]);

  const getLevelClass = (level?: string): string => {
    if (!level) return '';
    const l = level.toLowerCase();
    if (l.includes('beginner') || l.includes('basic')) return 'beginner';
    if (l.includes('intermediate') || l.includes('mid')) return 'intermediate';
    if (l.includes('advanced') || l.includes('senior')) return 'advanced';
    if (l.includes('expert') || l.includes('master')) return 'expert';
    return 'intermediate';
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getInitials = (name?: string) => {
    if (!name) return 'M';
    return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  };

  if (loading) return null;
  if (skills.length === 0 && isPublic) return null; // Don't show empty on public profile

  return (
    <div className="vsb-container">
      <div className="vsb-header">
        <div className="vsb-header-left">
          <div className="vsb-header-icon">
            <Award size={20} />
          </div>
          <h3>Verified Skills</h3>
        </div>
        {skills.length > 0 && (
          <span className="vsb-count">{skills.length} skill{skills.length > 1 ? 's' : ''}</span>
        )}
      </div>

      {skills.length === 0 ? (
        <div className="vsb-empty">
          <Award size={48} />
          <p>
            Chưa có skill nào được xác thực.<br />
            Hoàn thành Roadmap Mentoring để nhận chứng chỉ kỹ năng!
          </p>
        </div>
      ) : (
        <div className="vsb-grid">
          {skills.map((skill) => (
            <div key={skill.id} className="vsb-card">
              <div className="vsb-card-top">
                <span className="vsb-skill-name">
                  {skill.skillName.replace(/_/g, ' ')}
                </span>
                <span className="vsb-verified-badge">
                  <CheckCircle size={14} />
                </span>
              </div>

              {skill.skillLevel && (
                <span className={`vsb-level ${getLevelClass(skill.skillLevel)}`}>
                  {skill.skillLevel}
                </span>
              )}

              <div className="vsb-mentor-row">
                <span className="vsb-mentor-avatar">
                  {getInitials(skill.verifiedByMentorName)}
                </span>
                Verified by {skill.verifiedByMentorName || `Mentor #${skill.verifiedByMentorId}`}
              </div>

              <span className="vsb-date">
                {formatDate(skill.verifiedAt)}
              </span>

              {skill.verificationNote && (
                <div className="vsb-note">
                  "{skill.verificationNote}"
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VerifiedSkillsBadge;
