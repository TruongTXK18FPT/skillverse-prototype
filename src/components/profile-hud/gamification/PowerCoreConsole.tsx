import React from 'react';
import './cmd-game-styles.css';

interface PowerCoreConsoleProps {
  totalPoints: number;
  currentLevel: number;
  nextLevelPoints: number;
  progressPercentage: number;
  stats?: {
    label: string;
    value: string | number;
  }[];
}

const PowerCoreConsole: React.FC<PowerCoreConsoleProps> = ({ 
  totalPoints, 
  currentLevel, 
  nextLevelPoints, 
  progressPercentage,
  stats = []
}) => {
  
  // Calculate next rank name (mock logic or passed prop)
  const getRankName = (level: number) => {
    if (level < 5) return 'CADET';
    if (level < 10) return 'OFFICER';
    if (level < 20) return 'COMMANDER';
    if (level < 50) return 'CAPTAIN';
    return 'ADMIRAL';
  };

  return (
    <div className="cmd-game-console">
      {/* Left: Reactor */}
      <div className="cmd-game-reactor-container">
        <div className="cmd-game-reactor-ring">
          <div className="cmd-game-reactor-core">
            <div className="cmd-game-reactor-value">{totalPoints}</div>
            <div className="cmd-game-reactor-label">TOTAL OUTPUT</div>
          </div>
        </div>
      </div>

      {/* Right: Rank Conduit */}
      <div className="cmd-game-conduit">
        <div className="cmd-game-rank-header">
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--cmd-game-text-dim)' }}>CURRENT CLEARANCE</div>
            <div className="cmd-game-rank-current">
              LVL {currentLevel} // {getRankName(currentLevel)}
            </div>
          </div>
          <div className="cmd-game-rank-next">
            NEXT: {getRankName(currentLevel + 1)} ({nextLevelPoints} PTS)
          </div>
        </div>

        <div className="cmd-game-plasma-bar-bg">
          <div 
            className="cmd-game-plasma-bar-fill" 
            style={{ width: `${Math.min(100, Math.max(0, progressPercentage))}%` }}
          ></div>
        </div>

        <div className="cmd-game-mini-stats">
          {stats.map((stat, index) => (
            <div key={index} className="cmd-game-stat-box">
              <div className="cmd-game-stat-val">{stat.value}</div>
              <div className="cmd-game-stat-lbl">{stat.label}</div>
            </div>
          ))}
          {/* Default stats if none provided */}
          {stats.length === 0 && (
            <>
              <div className="cmd-game-stat-box">
                <div className="cmd-game-stat-val">{(currentLevel * 10)}</div>
                <div className="cmd-game-stat-lbl">COINS EARNED</div>
              </div>
              <div className="cmd-game-stat-box">
                <div className="cmd-game-stat-val">ACTIVE</div>
                <div className="cmd-game-stat-lbl">STATUS</div>
              </div>
              <div className="cmd-game-stat-box">
                <div className="cmd-game-stat-val">100%</div>
                <div className="cmd-game-stat-lbl">EFFICIENCY</div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PowerCoreConsole;
