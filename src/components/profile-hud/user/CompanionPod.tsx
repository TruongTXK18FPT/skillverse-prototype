import React from 'react';
import './pilot-styles.css';

interface CompanionPodProps {
  isPetActive?: boolean;
  onTogglePet?: () => void;
}

const CompanionPod: React.FC<CompanionPodProps> = ({ 
  isPetActive = true,
  onTogglePet
}) => {
  const spritesheetUrl = '/src/assets/meowl-pet/spritesheet/idle.png'; // Path to the idle spritesheet

  return (
    <div className="">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 className="pilot-section-title" style={{ margin: 0 }}>Meowl Pet</h2>
        {onTogglePet && (
          <div className="pilot-toggle-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--pilot-text-dim)' }}>ACTIVE</span>
            <label className="pilot-toggle-switch" style={{ position: 'relative', display: 'inline-block', width: '40px', height: '20px' }}>
              <input 
                type="checkbox" 
                checked={isPetActive} 
                onChange={onTogglePet}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span className="pilot-toggle-slider" style={{
                position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: isPetActive ? 'var(--pilot-primary)' : '#1e293b',
                transition: '.4s', borderRadius: '20px',
                border: '1px solid var(--pilot-border)'
              }}>
                <span style={{
                  position: 'absolute', content: '""', height: '14px', width: '14px',
                  left: isPetActive ? '22px' : '2px', bottom: '2px',
                  backgroundColor: 'white', transition: '.4s', borderRadius: '50%'
                }}/>
              </span>
            </label>
          </div>
        )}
      </div>
      
      <div className="pilot-pod-container">
        <div className="pilot-pod-stage">
          {/* Display first frame of idle spritesheet */}
          <div 
            style={{ 
              width: '64px', 
              height: '64px', 
              backgroundImage: `url(${spritesheetUrl})`,
              backgroundPosition: '0 0', // First frame
              backgroundSize: '400%', // Assuming 4x4 spritesheet
              imageRendering: 'pixelated',
              transform: 'scale(2)', // Scale up to look good
              filter: isPetActive ? 'drop-shadow(0 0 5px var(--pilot-primary))' : 'grayscale(1) opacity(0.5)'
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default CompanionPod;
