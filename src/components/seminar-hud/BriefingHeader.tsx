import React from 'react';
import './briefing-styles.css';

interface BriefingHeaderProps {
  totalSeminars: number;
  activeSeminars: number;
}

const BriefingHeader: React.FC<BriefingHeaderProps> = ({
  totalSeminars,
  activeSeminars,
}) => {
  return (
    <div className="briefing-header-v2">
      {/* Scrolling Marquee Text */}
      <div className="briefing-marquee">
        <div className="briefing-marquee-content">
          // SEMINAR_UPLINK_PROTOCOL_INITIATED...
          SECURE_CHANNEL_ACTIVE...
          INTEL_FEED_STREAMING...
          {totalSeminars} CHANNELS_AVAILABLE...
          {activeSeminars} BRIEFINGS_LIVE...
          AWAITING_OPERATIVE_CONNECTION...
        </div>
      </div>
    </div>
  );
};

export default BriefingHeader;