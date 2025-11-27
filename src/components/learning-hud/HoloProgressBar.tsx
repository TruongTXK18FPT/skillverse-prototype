import React from 'react';
import './learning-hud.css';

interface HoloProgressBarProps {
  percent: number;
  label?: string;
}

const HoloProgressBar: React.FC<HoloProgressBarProps> = ({
  percent,
  label = "NEURAL SYNC RATE"
}) => {
  return (
    <div className="learning-hud-progress-container">
      <span className="learning-hud-progress-label">{label}</span>
      <div className="learning-hud-progress-bar-wrapper">
        <div
          className="learning-hud-progress-bar"
          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
        />
      </div>
      <span className="learning-hud-progress-text">
        {Math.round(percent)}% SYNCED
      </span>
    </div>
  );
};

export default HoloProgressBar;