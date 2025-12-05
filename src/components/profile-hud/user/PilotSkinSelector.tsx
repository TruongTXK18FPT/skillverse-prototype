import React from 'react';
import './pilot-styles.css';

interface Skin {
  id: string;
  nameVi: string;
  image: string;
  isPremium?: boolean;
}

interface PilotSkinSelectorProps {
  currentSkin?: string;
  skins?: Skin[];
  onSelectSkin?: (skinId: string) => void;
}

const PilotSkinSelector: React.FC<PilotSkinSelectorProps> = ({ 
  currentSkin = 'default', 
  skins = [],
  onSelectSkin
}) => {
  return (
    <div className="pilot-section">
      <h2 className="pilot-section-title">SKIN SELECTION</h2>
      <div className="pilot-outfit-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}>
        {skins.map(skin => (
          <div 
            key={skin.id}
            className={`pilot-outfit-module ${currentSkin === skin.id ? 'active' : ''}`}
            onClick={() => onSelectSkin && onSelectSkin(skin.id)}
            title={skin.nameVi}
            style={{ padding: '1rem' }}
          >
            <div className="pilot-outfit-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80px', width: '100%', marginBottom: '0.5rem' }}>
              <img src={skin.image} alt={skin.nameVi} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div className="pilot-outfit-name" style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>{skin.nameVi}</div>
          </div>
        ))}
        {skins.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--pilot-text-dim)', padding: '1rem' }}>
            NO SKINS DETECTED
          </div>
        )}
      </div>
    </div>
  );
};

export default PilotSkinSelector;
