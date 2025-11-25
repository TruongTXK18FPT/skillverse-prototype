import React from 'react';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import HUDCard from './HUDCard';
import './SystemStatus.css';

interface SystemStatusProps {
  currentStreak: number;
  longestStreak: number;
  weeklyGoal: number;
  thisWeek: boolean[];
  streakLabel?: string;
  daysLabel?: string;
  currentStreakLabel?: string;
  longestStreakLabel?: string;
  weeklyGoalLabel?: string;
}

const SystemStatus: React.FC<SystemStatusProps> = ({
  currentStreak,
  longestStreak,
  weeklyGoal,
  thisWeek,
  streakLabel = 'System Uptime',
  daysLabel = 'Days',
  currentStreakLabel = 'Current Sync',
  longestStreakLabel = 'Max Uptime',
  weeklyGoalLabel = 'Weekly Target'
}) => {
  const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <HUDCard variant="chamfer" scanline delay={0.2}>
      <div className="system-status">
        {/* Header */}
        <div className="system-status__header">
          <div className="system-status__title-wrapper">
            <div className="system-status__flame-wrapper">
              <div className="system-status__flame-glow"></div>
              <Flame className="system-status__flame-icon" size={28} />
            </div>
            <div>
              <h3 className="system-status__title">{streakLabel}</h3>
              <p className="system-status__subtitle">
                {currentStreak} {daysLabel} {currentStreakLabel}
              </p>
            </div>
          </div>

          <div className="system-status__stats">
            <div className="system-status__stat">
              <span className="system-status__stat-label">{longestStreakLabel}</span>
              <span className="system-status__stat-value">{longestStreak} {daysLabel}</span>
            </div>
            <div className="system-status__stat-divider"></div>
            <div className="system-status__stat">
              <span className="system-status__stat-label">{weeklyGoalLabel}</span>
              <span className="system-status__stat-value">{weeklyGoal} {daysLabel}</span>
            </div>
          </div>
        </div>

        {/* Sync Calendar */}
        <div className="system-status__calendar">
          {thisWeek.map((synced, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.3,
                delay: 0.3 + index * 0.05,
                ease: [0.4, 0, 0.2, 1]
              }}
              className={`system-status__day ${synced ? 'system-status__day--synced' : ''}`}
            >
              <div className="system-status__day-indicator">
                {synced && <div className="system-status__day-pulse"></div>}
              </div>
              <span className="system-status__day-label">{weekDays[index]}</span>
            </motion.div>
          ))}
        </div>

        {/* Power Level Bar */}
        <div className="system-status__power">
          <div className="system-status__power-label">
            <span>POWER LEVEL</span>
            <span className="system-status__power-percentage">
              {Math.round((currentStreak / longestStreak) * 100)}%
            </span>
          </div>
          <div className="system-status__power-bar">
            <motion.div
              className="system-status__power-fill"
              initial={{ width: 0 }}
              animate={{ width: `${(currentStreak / longestStreak) * 100}%` }}
              transition={{ duration: 1.5, delay: 0.5, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className="system-status__power-glow"></div>
            </motion.div>
          </div>
        </div>
      </div>
    </HUDCard>
  );
};

export default SystemStatus;
