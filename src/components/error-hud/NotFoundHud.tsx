import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './NotFoundHud.css';

const NotFoundHud: React.FC = () => {
  const navigate = useNavigate();
  const [showHorrorModal, setShowHorrorModal] = useState(false);

  const handleSafePath = () => {
    navigate('/');
  };

  const handleDangerousPath = () => {
    setShowHorrorModal(true);
  };

  const confirmDangerousPath = () => {
    navigate('/pray', { state: { fromHorror: true } });
  };

  const cancelDangerousPath = () => {
    setShowHorrorModal(false);
  };

  return (
    <div className="error-404-container">
      <div className="error-404-content">
        <h1 className="error-404-glitch" data-text="ERROR 404: SECTOR COLLAPSED">
          ERROR 404: SECTOR COLLAPSED
        </h1>
        
        <p className="error-404-description">
          Navigation systems failed. You are drifting in the void.
        </p>

        <div className="error-404-actions">
          <button className="error-btn-safe" onClick={handleSafePath}>
            [ INITIATE EMERGENCY REBOOT ]
          </button>
          
          <button className="error-btn-danger" onClick={handleDangerousPath}>
            [ ATTEMPT FORBIDDEN UPLINK ]
          </button>
        </div>
      </div>

      {/* Horror Modal */}
      {showHorrorModal && (
        <div className="horror-modal-overlay">
          <div className="horror-modal-content">
            <div className="horror-cracks"></div>
            <h2 className="horror-title" data-text="WARNING: FATAL ERROR">WARNING: FATAL ERROR</h2>
            <p className="horror-text">
              DETECTED UNSTABLE REALITY ANCHOR.<br/>
              PROCEEDING MAY CAUSE IRREVERSIBLE PSYCHOLOGICAL CORRUPTION.<br/>
              <span className="horror-highlight">ARE YOU SURE?</span>
            </p>
            <div className="horror-actions">
              <button className="horror-btn-confirm" onClick={confirmDangerousPath}>
                YES, I ACCEPT MY FATE
              </button>
              <button className="horror-btn-cancel" onClick={cancelDangerousPath}>
                NO, TURN BACK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotFoundHud;
