import React, { createContext, useContext, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useElevatorState, ElevatorState } from '../../hooks/useElevatorState';
import backgroundImage from '../../assets/elevator-deck/background.jpeg';
import './ElevatorAuthLayout.css';

// Context for elevator state
interface ElevatorContextType {
  state: ElevatorState;
  userName: string;
  setUserName: (name: string) => void;
  triggerLoginSuccess: (name?: string) => Promise<void>;
}

const ElevatorContext = createContext<ElevatorContextType | null>(null);

export const useElevator = () => {
  const context = useContext(ElevatorContext);
  if (!context) {
    throw new Error('useElevator must be used within ElevatorAuthLayout');
  }
  return context;
};

interface ElevatorAuthLayoutProps {
  children: ReactNode;
  onTransitionComplete?: () => void;
}

// Layer 1: Space Background (visible through glass)
const SpaceBackground: React.FC = () => {
  return (
    <div className="space-background">
      <img src={backgroundImage} alt="Space View" className="space-bg-image" />
      <div className="space-overlay"></div>
      {/* Floating particles */}
      <div className="space-particles">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="space-particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`
            }}
          />
        ))}
      </div>
    </div>
  );
};

// Layer 2: Elevator Frame (Fixed metal frame on left and right)
const ElevatorFrame: React.FC = () => {
  return (
    <div className="elevator-frame-container">
      {/* Left Frame */}
      <div className="elevator-side-frame left">
        <div className="frame-metal">
          <div className="frame-panel">
            <div className="panel-indent"></div>
            <div className="panel-indent"></div>
            <div className="panel-indent"></div>
          </div>
          <div className="frame-lights">
            <div className="light-bar"></div>
            <div className="light-bar"></div>
          </div>
          <div className="frame-vent">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="vent-slot" />
            ))}
          </div>
        </div>
        <div className="frame-edge right-edge"></div>
      </div>

      {/* Right Frame */}
      <div className="elevator-side-frame right">
        <div className="frame-edge left-edge"></div>
        <div className="frame-metal">
          <div className="frame-panel">
            <div className="panel-indent"></div>
            <div className="panel-indent"></div>
            <div className="panel-indent"></div>
          </div>
          <div className="frame-lights">
            <div className="light-bar"></div>
            <div className="light-bar"></div>
          </div>
          <div className="frame-vent">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="vent-slot" />
            ))}
          </div>
        </div>
      </div>

      {/* Top Frame */}
      <div className="elevator-top-frame">
        <div className="top-indicator">
          <span className="indicator-label">HYPERION DECK</span>
          <div className="indicator-lights">
            <span className="ind-light active"></span>
            <span className="ind-light"></span>
            <span className="ind-light"></span>
          </div>
        </div>
      </div>

      {/* Bottom Frame */}
      <div className="elevator-bottom-frame">
        <div className="bottom-stripe"></div>
      </div>
    </div>
  );
};

// Layer 3: Glass Doors - No longer animate, just decorative
const GlassDoors: React.FC = () => {
  return (
    <div className="glass-doors-container">
      {/* Left Glass Door */}
      <div className="glass-door left-door">
        <div className="glass-surface">
          <div className="glass-reflection"></div>
          <div className="glass-edge-highlight"></div>
        </div>
      </div>

      {/* Right Glass Door */}
      <div className="glass-door right-door">
        <div className="glass-surface">
          <div className="glass-reflection"></div>
          <div className="glass-edge-highlight"></div>
        </div>
      </div>

      {/* Center Line */}
      <div className="door-center-line" />
    </div>
  );
};

// Access Granted Message - Simple flash animation
const AccessGrantedMessage: React.FC<{ show: boolean }> = ({ show }) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="access-granted-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="access-granted-text"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{
              scale: [0.8, 1.1, 1],
              opacity: [0, 1, 1, 0, 1, 1, 0, 1]
            }}
            transition={{
              duration: 1.2,
              times: [0, 0.2, 0.3, 0.4, 0.5, 0.7, 0.8, 1]
            }}
          >
            ACCESS GRANTED
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Main Layout Component
const ElevatorAuthLayout: React.FC<ElevatorAuthLayoutProps> = ({
  children,
  onTransitionComplete
}) => {
  const { state, userName, setUserName, triggerLoginSuccess } = useElevatorState();

  const handleLoginSuccess = async (name?: string) => {
    await triggerLoginSuccess(name);
    if (onTransitionComplete) {
      onTransitionComplete();
    }
  };

  // When exiting, animate the whole container up
  const isExiting = state === 'exiting';
  const showAccessGranted = state === 'accessGranted';

  return (
    <ElevatorContext.Provider value={{
      state,
      userName,
      setUserName,
      triggerLoginSuccess: handleLoginSuccess
    }}>
      <motion.div
        className="elevator-container"
        animate={{
          y: isExiting ? '-100vh' : '0vh',
          opacity: isExiting ? 0 : 1
        }}
        transition={{
          duration: 0.8,
          ease: [0.4, 0, 0.2, 1]
        }}
      >
        {/* Layer 1: Space Background */}
        <SpaceBackground />

        {/* Layer 2: Glass Doors */}
        <GlassDoors />

        {/* Layer 3: Fixed Elevator Frame */}
        <ElevatorFrame />

        {/* Layer 4: Content (Login Form) - Hide when access granted */}
        <AnimatePresence mode="wait">
          {state === 'idle' && (
            <motion.div
              className="elevator-content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{
                opacity: 0,
                scale: 0.95,
                transition: { duration: 0.3 }
              }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Access Granted Message */}
        <AccessGrantedMessage show={showAccessGranted} />

        {/* HUD Overlay */}
        <div className="hud-overlay">
          <div className="hud-corner top-left">
            <span>SYS:ONLINE</span>
            <span className="hud-value">v2.4.1</span>
          </div>
          <div className="hud-corner top-right">
            <span>DECK:AUTH</span>
            <span className="hud-value">LV.00</span>
          </div>
          <div className="hud-corner bottom-left">
            <span>STATUS</span>
            <span className={`hud-value ${showAccessGranted || isExiting ? 'status-arrived' : ''}`}>
              {(showAccessGranted || isExiting) ? 'ARRIVED' : 'STANDBY'}
            </span>
          </div>
          <div className="hud-corner bottom-right">
            <span>SKILLVERSE</span>
            <span className="hud-value">HYPERION</span>
          </div>
        </div>

        {/* Scanlines Effect */}
        <div className="scanlines"></div>

        {/* Vignette Effect */}
        <div className="vignette"></div>
      </motion.div>
    </ElevatorContext.Provider>
  );
};

export default ElevatorAuthLayout;