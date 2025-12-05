import React from 'react';
import './cmd-game-styles.css';

export type BadgeRarity = 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

export interface BadgeProps {
  data: {
    id: string;
    name: string;
    description: string;
    iconUrl: string;
    rarity: BadgeRarity;
    isUnlocked: boolean;
    acquiredDate?: string;
    progressCurrent?: number;
    progressTarget?: number;
  };
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

const UniversalBadge: React.FC<BadgeProps> = ({ data, size = 'md', onClick }) => {
  const { name, iconUrl, rarity, isUnlocked } = data;
  
  // Map rarity to CSS class (lowercase)
  const rarityClass = rarity ? rarity.toLowerCase() : 'common';
  const lockedClass = !isUnlocked ? 'locked' : '';
  
  // Size styles (inline for simplicity or could be classes)
  const sizeStyle = {
    width: size === 'sm' ? '120px' : size === 'lg' ? '200px' : '100%',
    fontSize: size === 'sm' ? '0.8rem' : '1rem'
  };

  return (
    <div 
      className={`cmd-game-badge-chip ${rarityClass} ${lockedClass}`}
      style={sizeStyle}
      onClick={onClick}
      title={!isUnlocked ? 'Locked: ' + data.description : data.description}
    >
      <img 
        src={iconUrl || 'https://via.placeholder.com/100?text=BADGE'} 
        alt={name} 
        className="cmd-game-badge-icon"
        onError={(e) => {
          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/100?text=N/A';
        }}
      />
      <div className="cmd-game-badge-name">{name}</div>
      <div className="cmd-game-badge-rarity">{rarity}</div>
      
      {/* Optional: Show progress if locked and progress is available */}
      {!isUnlocked && data.progressTarget && (
        <div style={{ 
          width: '80%', 
          height: '4px', 
          background: 'rgba(255,255,255,0.1)', 
          marginTop: '0.5rem',
          borderRadius: '2px'
        }}>
          <div style={{
            width: `${Math.min(100, ((data.progressCurrent || 0) / data.progressTarget) * 100)}%`,
            height: '100%',
            background: 'var(--cmd-game-accent-grey)',
            borderRadius: '2px'
          }}></div>
        </div>
      )}
    </div>
  );
};

export default UniversalBadge;
