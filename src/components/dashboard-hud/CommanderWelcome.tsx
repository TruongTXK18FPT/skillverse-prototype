import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Zap } from 'lucide-react';
import './CommanderWelcome.css';

interface CommanderWelcomeProps {
  userName?: string;
  subtitle?: string;
  onViewPlan?: () => void;
  onResumeLearning?: () => void;
  viewPlanText?: string;
  resumeText?: string;
}

const CommanderWelcome: React.FC<CommanderWelcomeProps> = ({
  userName = 'Commander',
  subtitle = 'COMMAND CENTER OPERATIONAL',
  onViewPlan,
  onResumeLearning,
  viewPlanText = 'View Study Plan',
  resumeText = 'Resume Learning'
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      className="commander-welcome"
    >
      <div className="commander-welcome__backdrop"></div>

      <div className="commander-welcome__content">
        <div className="commander-welcome__left">
          <div className="commander-welcome__status">
            <div className="commander-welcome__status-dot"></div>
            <span className="commander-welcome__status-text">SYSTEM READY</span>
          </div>

          <h1 className="commander-welcome__title">
            WELCOME BACK, <span className="commander-welcome__name">{userName.toUpperCase()}</span>
          </h1>

          <p className="commander-welcome__subtitle">
            {subtitle}
          </p>

          <div className="commander-welcome__id-card">
            <div className="commander-welcome__id-label">PILOT ID</div>
            <div className="commander-welcome__id-value">#SV-{Math.floor(Math.random() * 10000).toString().padStart(4, '0')}</div>
          </div>
        </div>

        <div className="commander-welcome__right">
          <button
            onClick={onViewPlan}
            className="commander-welcome__button commander-welcome__button--primary"
          >
            <div className="commander-welcome__button-glow"></div>
            <FileText className="commander-welcome__button-icon" size={20} />
            <span>{viewPlanText}</span>
          </button>

          <button
            onClick={onResumeLearning}
            className="commander-welcome__button commander-welcome__button--secondary"
          >
            <div className="commander-welcome__button-glow"></div>
            <Zap className="commander-welcome__button-icon" size={20} />
            <span>{resumeText}</span>
          </button>
        </div>
      </div>

      {/* Corner decorations */}
      <div className="commander-welcome__corner commander-welcome__corner--tl"></div>
      <div className="commander-welcome__corner commander-welcome__corner--tr"></div>
      <div className="commander-welcome__corner commander-welcome__corner--bl"></div>
      <div className="commander-welcome__corner commander-welcome__corner--br"></div>
    </motion.div>
  );
};

export default CommanderWelcome;