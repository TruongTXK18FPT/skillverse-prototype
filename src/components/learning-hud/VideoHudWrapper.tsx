import React from 'react';
import './learning-hud.css';

interface VideoHudWrapperProps {
  videoUrl: string;
  title: string;
  children?: React.ReactNode;
}

const VideoHudWrapper: React.FC<VideoHudWrapperProps> = ({
  videoUrl,
  title,
  children
}) => {
  return (
    <div className="learning-hud-video-frame">
      {/* Video iframe */}
      <iframe
        src={videoUrl}
        title={title}
        allowFullScreen
      />

      {/* HUD Overlay with corner labels */}
      <div className="learning-hud-video-overlay">
        <div className="learning-hud-corner-label top-left">
          SOURCE: INSTRUCTOR_FEED
        </div>
        <div className="learning-hud-corner-label top-right">
          STREAMING
        </div>
        <div className="learning-hud-corner-label bottom-left">
          NEURAL LINK ACTIVE
        </div>
        <div className="learning-hud-corner-label bottom-right">
          {new Date().toLocaleTimeString('en-US', { hour12: false })}
        </div>
      </div>

      {children}
    </div>
  );
};

export default VideoHudWrapper;