import React from 'react';
import './PetStyles.css';

interface PetLevelBarProps {
  level: number;
  xp: number;
  maxXp: number;
}

const PetLevelBar: React.FC<PetLevelBarProps> = ({ level, xp, maxXp }) => {
  const percentage = Math.min(100, Math.max(0, (xp / maxXp) * 100));

  return (
    <div className="pet-level-container">
      <div className="pet-level-badge">LV.{level}</div>
      <div className="pet-level-bar">
        <div 
          className="pet-level-fill" 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default PetLevelBar;
