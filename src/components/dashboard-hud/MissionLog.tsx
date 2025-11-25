import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Award } from 'lucide-react';
import HUDCard from './HUDCard';
import './MissionLog.css';

interface Achievement {
  title: string;
  icon: string;
  date: string;
  points: number;
  description: string;
}

interface Deadline {
  task: string;
  date: string;
  type: string;
  priority: 'high' | 'medium' | 'low';
  timeLeft: string;
}

interface MissionLogProps {
  achievements?: Achievement[];
  deadlines?: Deadline[];
  achievementsTitle?: string;
  deadlinesTitle?: string;
}

const MissionLog: React.FC<MissionLogProps> = ({
  achievements = [],
  deadlines = [],
  achievementsTitle = 'Recent Achievements',
  deadlinesTitle = 'Proximity Alerts'
}) => {
  const priorityColors = {
    high: 'red',
    medium: 'yellow',
    low: 'cyan'
  };

  return (
    <div className="mission-log">
      {/* Achievements */}
      {achievements.length > 0 && (
        <HUDCard
          title={achievementsTitle}
          subtitle={`${achievements.length} Unlocked`}
          variant="chamfer"
          delay={0.4}
        >
          <div className="mission-log__achievements">
            {achievements.slice(0, 4).map((achievement, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.3,
                  delay: 0.5 + index * 0.1,
                  ease: [0.4, 0, 0.2, 1]
                }}
                className="mission-log__achievement"
              >
                <div className="mission-log__achievement-icon">{achievement.icon}</div>
                <div className="mission-log__achievement-content">
                  <h4 className="mission-log__achievement-title">{achievement.title}</h4>
                  <p className="mission-log__achievement-desc">{achievement.description}</p>
                  <div className="mission-log__achievement-footer">
                    <span className="mission-log__achievement-date">{achievement.date}</span>
                    <span className="mission-log__achievement-points">
                      +{achievement.points} XP
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </HUDCard>
      )}

      {/* Deadlines */}
      {deadlines.length > 0 && (
        <HUDCard
          title={deadlinesTitle}
          subtitle={`${deadlines.length} Incoming Events`}
          variant="chamfer"
          delay={0.5}
        >
          <div className="mission-log__deadlines">
            {deadlines.map((deadline, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.3,
                  delay: 0.6 + index * 0.1,
                  ease: [0.4, 0, 0.2, 1]
                }}
                className={`mission-log__deadline mission-log__deadline--${deadline.priority}`}
              >
                <div className="mission-log__deadline-indicator">
                  <AlertCircle size={18} />
                </div>
                <div className="mission-log__deadline-content">
                  <div className="mission-log__deadline-header">
                    <h4 className="mission-log__deadline-task">{deadline.task}</h4>
                    <span className={`mission-log__deadline-badge mission-log__deadline-badge--${deadline.priority}`}>
                      {deadline.priority.toUpperCase()}
                    </span>
                  </div>
                  <div className="mission-log__deadline-footer">
                    <span className="mission-log__deadline-type">{deadline.type.toUpperCase()}</span>
                    <span className="mission-log__deadline-time">{deadline.timeLeft}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </HUDCard>
      )}
    </div>
  );
};

export default MissionLog;
