import React from 'react';
import './rank-styles.css';

interface ClearanceHeaderProps {
  title?: string;
  subtitle?: string;
}

const ClearanceHeader: React.FC<ClearanceHeaderProps> = ({
  title = 'ACCESS LEVEL',
  subtitle = 'UPGRADE YOUR PILOT LICENSE TO ACCESS RESTRICTED SECTORS'
}) => {
  return (
    <div className="clearance-header">
      <div className="clearance-header-content">
        <div>
          <h1 className="clearance-title">
            {title}
          </h1>
          <p className="clearance-subtitle">
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ClearanceHeader;
