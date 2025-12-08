import React from 'react';
import './pilot-styles.css';
import idleSprite from '../../../assets/meowl-pet/spritesheet/idle.png';

interface CompanionPodProps {
  isPetActive?: boolean;
  onTogglePet?: () => void;
}

const CompanionPod: React.FC<CompanionPodProps> = ({ 
  isPetActive = true,
  onTogglePet
}) => {
  
  return (
    <div className="pilot-panel companion-pod-container" style={{ 
      position: 'relative', 
      overflow: 'hidden', 
      height: '100%',
      minHeight: '320px',
      display: 'flex', 
      flexDirection: 'column',
      background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.6) 0%, rgba(15, 23, 42, 0.9) 100%)',
      border: '1px solid rgba(14, 165, 233, 0.3)',
      boxShadow: '0 0 20px rgba(14, 165, 233, 0.1), inset 0 0 20px rgba(14, 165, 233, 0.05)',
      borderRadius: '12px'
    }}>
      {/* Header with Tech Decoration */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '1.2rem 1.5rem',
        borderBottom: '1px solid rgba(14, 165, 233, 0.2)',
        background: 'rgba(14, 165, 233, 0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '8px', height: '8px', background: '#0ea5e9', borderRadius: '50%', boxShadow: '0 0 10px #0ea5e9' }}></div>
          <h2 className="pilot-section-title" style={{ margin: 0, fontSize: '1.1rem', letterSpacing: '2px' }}>COMPANION POD</h2>
        </div>
        
        {/* Tech Status Indicator */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          fontSize: '0.7rem',
          fontFamily: 'monospace',
          color: isPetActive ? '#0ea5e9' : '#64748b',
          border: `1px solid ${isPetActive ? 'rgba(14, 165, 233, 0.4)' : 'rgba(100, 116, 139, 0.4)'}`,
          padding: '4px 8px',
          borderRadius: '4px',
          background: isPetActive ? 'rgba(14, 165, 233, 0.1)' : 'rgba(15, 23, 42, 0.5)'
        }}>
          <span style={{ 
            display: 'block', 
            width: '6px', 
            height: '6px', 
            borderRadius: '50%', 
            background: isPetActive ? '#0ea5e9' : '#64748b',
            boxShadow: isPetActive ? '0 0 8px #0ea5e9' : 'none',
            animation: isPetActive ? 'pulse 2s infinite' : 'none'
          }}></span>
          {isPetActive ? 'SYSTEM ONLINE' : 'OFFLINE'}
        </div>
      </div>
      
      {/* Main Hologram Stage */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        position: 'relative',
        padding: '2rem'
      }}>
        {/* Grid Background Effect */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'linear-gradient(rgba(14, 165, 233, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(14, 165, 233, 0.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          opacity: 0.3,
          pointerEvents: 'none'
        }}></div>

        {/* Hologram Projector Base */}
        <div style={{
          position: 'absolute',
          bottom: '40px',
          width: '120px',
          height: '40px',
          background: 'radial-gradient(ellipse at center, rgba(14, 165, 233, 0.4) 0%, transparent 70%)',
          transform: 'perspective(500px) rotateX(60deg)',
          boxShadow: '0 0 30px rgba(14, 165, 233, 0.2)',
          zIndex: 1
        }}></div>

        {/* The Pet */}
        <div className="pilot-pod-stage" style={{ 
          position: 'relative', 
          zIndex: 10,
          transition: 'all 0.5s ease',
          filter: isPetActive ? 'drop-shadow(0 0 15px rgba(14, 165, 233, 0.6))' : 'grayscale(1) opacity(0.3) blur(2px)',
          transform: isPetActive ? 'translateY(-10px)' : 'translateY(0)',
          animation: isPetActive ? 'float 6s ease-in-out infinite' : 'none'
        }}>
          <div 
            style={{ 
              width: '64px', 
              height: '64px', 
              backgroundImage: `url(${idleSprite})`,
              backgroundPosition: '0 0', 
              backgroundSize: '400%', 
              imageRendering: 'pixelated',
              transform: 'scale(2.5)',
            }}
          />
        </div>

        {/* Hologram Scanline Effect (Only when active) */}
        {isPetActive && (
          <div style={{
            position: 'absolute',
            inset: '20px',
            background: 'linear-gradient(to bottom, transparent 50%, rgba(14, 165, 233, 0.05) 51%)',
            backgroundSize: '100% 4px',
            pointerEvents: 'none',
            zIndex: 20,
            opacity: 0.5
          }}></div>
        )}
      </div>

      {/* Control Panel Footer */}
      <div style={{ 
        padding: '1rem 1.5rem', 
        borderTop: '1px solid rgba(14, 165, 233, 0.2)',
        background: 'rgba(15, 23, 42, 0.5)',
        display: 'flex',
        justifyContent: 'center'
      }}>
        {onTogglePet ? (
          <button 
            onClick={onTogglePet}
            style={{
              background: 'transparent',
              border: '1px solid rgba(14, 165, 233, 0.5)',
              color: '#0ea5e9',
              padding: '8px 24px',
              fontFamily: 'monospace',
              fontSize: '0.8rem',
              letterSpacing: '2px',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.3s ease',
              textTransform: 'uppercase',
              boxShadow: isPetActive ? '0 0 15px rgba(14, 165, 233, 0.2)' : 'none'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(14, 165, 233, 0.1)';
              e.currentTarget.style.boxShadow = '0 0 20px rgba(14, 165, 233, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.boxShadow = isPetActive ? '0 0 15px rgba(14, 165, 233, 0.2)' : 'none';
            }}
          >
            {isPetActive ? 'DEACTIVATE PROTOCOL' : 'INITIALIZE PET'}
          </button>
        ) : (
          <div style={{ color: '#64748b', fontSize: '0.8rem', fontFamily: 'monospace' }}>CONTROLS LOCKED</div>
        )}
      </div>

      <style>{`
        @keyframes float {
          0% { transform: translateY(-10px); }
          50% { transform: translateY(-20px); }
          100% { transform: translateY(-10px); }
        }
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default CompanionPod;
