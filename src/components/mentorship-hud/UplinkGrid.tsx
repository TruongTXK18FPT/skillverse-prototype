import React from 'react';
import { User } from 'lucide-react';
import './uplink-styles.css';

interface UplinkGridProps {
  loading: boolean;
  isEmpty: boolean;
  children: React.ReactNode;
}

const UplinkGrid: React.FC<UplinkGridProps> = ({ loading, isEmpty, children }) => {
  if (loading) {
    return (
      <div className="uplink-loading">
        <div className="uplink-spinner"></div>
        <p className="uplink-loading-text">
          // DOWNLOADING MASTER ARCHIVES...
        </p>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="uplink-empty">
        <User className="uplink-empty-icon" size={64} />
        <h3 className="uplink-empty-title">NO SIGNAL DETECTED</h3>
        <p className="uplink-empty-text">
          No masters found matching your search parameters. Try adjusting your frequency caps or signal scanner input.
        </p>
      </div>
    );
  }

  return <div className="uplink-grid">{children}</div>;
};

export default UplinkGrid;