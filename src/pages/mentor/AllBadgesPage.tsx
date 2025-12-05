import React, { useEffect, useState } from 'react';
import { getMySkillTab, SkillTabResponseDTO, SkillTabBadgeInfo } from '../../services/mentorProfileService';
import UniversalBadge, { BadgeRarity } from '../../components/profile-hud/gamification/UniversalBadge';
import '../../components/profile-hud/gamification/cmd-game-styles.css';

const AllBadgesPage: React.FC = () => {
  const [skillTab, setSkillTab] = useState<SkillTabResponseDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'UNLOCKED' | 'LOCKED'>('ALL');
  const [rarityFilter, setRarityFilter] = useState<BadgeRarity | 'ALL'>('ALL');

  useEffect(() => {
    let mounted = true;
    getMySkillTab()
      .then(data => { if (mounted) setSkillTab(data); })
      .catch(() => { if (mounted) setError('Không thể tải dữ liệu huy hiệu.'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  // Helper to determine rarity (mock logic since API doesn't provide it)
  const getRarity = (code: string): BadgeRarity => {
    const hash = code.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const rarities: BadgeRarity[] = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY'];
    return rarities[hash % rarities.length];
  };

  // Helper to get icon (mock)
  const getIcon = (code: string) => {
    // In a real app, map code to asset URL
    return `https://api.dicebear.com/7.x/shapes/svg?seed=${code}`;
  };

  if (loading) return (
    <div className="cmd-game-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div style={{ color: 'var(--cmd-game-accent-cyan)', fontFamily: 'var(--cmd-game-font-header)' }}>LOADING MATRIX...</div>
    </div>
  );
  
  if (error) return <div style={{ padding: 24, color: '#ef4444' }}>{error}</div>;
  if (!skillTab) return null;

  // Filter logic
  const filteredBadges = skillTab.badges.filter(b => {
    const matchesStatus = 
      filter === 'ALL' ? true :
      filter === 'UNLOCKED' ? b.earned :
      !b.earned;
    
    const rarity = getRarity(b.code);
    const matchesRarity = rarityFilter === 'ALL' ? true : rarity === rarityFilter;

    return matchesStatus && matchesRarity;
  });

  return (
    <div className="cmd-game-container">
      <div className="cmd-game-inventory-header">
        <div className="cmd-game-page-title">
          <span>ACHIEVEMENT MATRIX</span>
          <span style={{ fontSize: '1rem', opacity: 0.5, fontFamily: 'var(--cmd-game-font-mono)' }}>
            // TOTAL: {skillTab.badges.length}
          </span>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
          <div className="cmd-game-filter-bar">
            {(['ALL', 'UNLOCKED', 'LOCKED'] as const).map(f => (
              <button
                key={f}
                className={`cmd-game-filter-btn ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="cmd-game-filter-bar">
            {(['ALL', 'COMMON', 'RARE', 'LEGENDARY'] as const).map(f => (
              <button
                key={f}
                className={`cmd-game-filter-btn ${rarityFilter === f ? 'active' : ''}`}
                onClick={() => setRarityFilter(f as any)}
                style={{ fontSize: '0.7rem', padding: '0.3rem 0.8rem' }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="cmd-game-grid">
        {filteredBadges.map(b => (
          <UniversalBadge
            key={b.code}
            data={{
              id: b.code,
              name: b.name,
              description: b.description,
              iconUrl: getIcon(b.code),
              rarity: getRarity(b.code),
              isUnlocked: b.earned,
              progressCurrent: b.progressCurrent,
              progressTarget: b.progressTarget
            }}
            size="md"
          />
        ))}
      </div>
    </div>
  );
};

export default AllBadgesPage;

