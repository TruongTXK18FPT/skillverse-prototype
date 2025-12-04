import React, { useEffect, useState } from 'react';
import { getMySkillTab, SkillTabResponseDTO } from '../../services/mentorProfileService';
import BadgeCard from '../../components/mentor/BadgeCard';
import QuickStatsCard from '../../components/mentor/QuickStatsCard';

const AllBadgesPage: React.FC = () => {
  const [skillTab, setSkillTab] = useState<SkillTabResponseDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    getMySkillTab()
      .then(data => { if (mounted) setSkillTab(data); })
      .catch(() => { if (mounted) setError('Không thể tải dữ liệu huy hiệu.'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  if (loading) return <div style={{ padding: 24 }}>Đang tải...</div>;
  if (error) return <div style={{ padding: 24, color: '#ef4444' }}>{error}</div>;
  if (!skillTab) return null;

  return (
    <div style={{ maxWidth: 1080, margin: '24px auto', padding: '0 16px' }}>
      <h2 style={{ color: '#fff', fontWeight: 800, marginBottom: 8 }}>Huy Hiệu Của Tôi</h2>
      <p style={{ color: '#94a3b8', marginBottom: 16 }}>Theo dõi tiến độ để mở khóa tất cả huy hiệu.</p>

      <QuickStatsCard
        sessionsCompleted={skillTab.sessionsCompleted}
        fiveStarCount={skillTab.fiveStarCount}
        courseSales={skillTab.courseSales}
        revenueVnd={skillTab.revenueVnd}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        {skillTab.badges.map(b => (
          <BadgeCard key={b.code}
            code={b.code}
            name={b.name}
            description={b.description}
            progressCurrent={b.progressCurrent}
            progressTarget={b.progressTarget}
            earned={b.earned}
          />
        ))}
      </div>
    </div>
  );
};

export default AllBadgesPage;
