// DOSSIER INIT SCREEN - System Initialization / Bio-Scan Empty State
// Sci-fi waiting screen for pilot registration
import { motion } from 'framer-motion';
import { Scan, Plus } from 'lucide-react';
import './dossier-init-screen.css';

interface DossierInitScreenProps {
  onInitiate: () => void;
}

const DossierInitScreen = ({ onInitiate }: DossierInitScreenProps) => {
  // Fake system logs for decoration
  const systemLogs = [
    '> SYS_CHECK: OK',
    '> MEMORY: 0%',
    '> PILOT_DB: SEARCHING...',
    '> AUTH_LEVEL: NONE',
    '> STATUS: STANDBY',
    '> AWAITING_INPUT...',
  ];

  return (
    <div className="init-screen-container">
      {/* Perspective Grid Background */}
      <div className="init-grid-floor"></div>

      {/* Ambient Particles */}
      <div className="init-particles">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="init-particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      {/* Corner Brackets */}
      <div className="init-corner init-corner-tl"></div>
      <div className="init-corner init-corner-tr"></div>
      <div className="init-corner init-corner-bl"></div>
      <div className="init-corner init-corner-br"></div>

      {/* Main Scanner Panel */}
      <motion.div
        className="init-scanner-panel"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Vertical Scan Line */}
        <div className="init-scan-line"></div>

        {/* Holographic Icon */}
        <motion.div
          className="init-holo-icon"
          animate={{
            opacity: [0.6, 1, 0.6],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <Scan size={60} strokeWidth={1.5} />

          {/* Rotating Ring */}
          <div className="init-icon-ring"></div>
        </motion.div>

        {/* Status Text */}
        <h1 className="init-glitch-text">UNIDENTIFIED USER DETECTED</h1>
        <div className="init-status-bar">
          <div className="init-status-fill"></div>
        </div>

        {/* Description */}
        <p className="init-description">
          Tactical Dossier system is in <span className="init-highlight">STANDBY MODE</span>.
          <br />
          Initialize Pilot ID creation sequence to access Mothership controls.
        </p>

        {/* Action Button */}
        <motion.button
          onClick={onInitiate}
          className="init-btn-protocol"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus size={20} />
          [ INITIATE REGISTRATION PROTOCOL ]
        </motion.button>

        {/* System Info */}
        <div className="init-system-info">
          <div className="init-info-item">
            <span className="init-info-label">SYSTEM</span>
            <span className="init-info-value">TACTICAL DOSSIER v2.5</span>
          </div>
          <div className="init-info-item">
            <span className="init-info-label">STATUS</span>
            <span className="init-info-value init-blink">AWAITING PILOT</span>
          </div>
          <div className="init-info-item">
            <span className="init-info-label">SECURITY</span>
            <span className="init-info-value">LEVEL 0</span>
          </div>
        </div>
      </motion.div>

      {/* Fake System Logs (Right Side) */}
      <div className="init-fake-logs">
        <div className="init-log-header">SYSTEM_LOG.TXT</div>
        {systemLogs.map((log, index) => (
          <motion.div
            key={index}
            className="init-log-entry"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 0.4, x: 0 }}
            transition={{ delay: index * 0.2, duration: 0.4 }}
          >
            {log}
          </motion.div>
        ))}
        <div className="init-log-cursor">_</div>
      </div>
    </div>
  );
};

export default DossierInitScreen;