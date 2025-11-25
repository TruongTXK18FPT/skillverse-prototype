import React from 'react';

export interface FrequencyChannel {
  id: string;
  name: string;
  count: number;
}

interface FrequencyTunerProps {
  channels: FrequencyChannel[];
  activeChannel: string;
  onChannelChange: (channelId: string) => void;
}

const FrequencyTuner: React.FC<FrequencyTunerProps> = ({
  channels,
  activeChannel,
  onChannelChange,
}) => {
  return (
    <div className="frequency-tuner">
      {channels.map((channel, index) => (
        <button
          key={channel.id}
          className={`frequency-tab ${activeChannel === channel.id ? 'active' : ''}`}
          onClick={() => onChannelChange(channel.id)}
          style={{ animationDelay: `${index * 0.05}s` }}
        >
          <span>{channel.name}</span>
          <span className="frequency-count">{channel.count}</span>
        </button>
      ))}
    </div>
  );
};

export default FrequencyTuner;