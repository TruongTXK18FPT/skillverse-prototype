import React from 'react';
import { useNavigate } from 'react-router-dom';
import './NotFoundHud.css';

const NotFoundHud: React.FC = () => {
  const navigate = useNavigate();

  const handleSafePath = () => {
    navigate('/');
  };

  const handleDangerousPath = () => {
    navigate('/pray');
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
    </div>
  );
};

export default NotFoundHud;
