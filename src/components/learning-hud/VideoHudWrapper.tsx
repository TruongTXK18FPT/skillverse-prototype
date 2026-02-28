import React from 'react';
import './learning-hud.css';

interface VideoHudWrapperProps {
  videoUrl: string;
  title: string;
  children?: React.ReactNode;
}

/**
 * Convert YouTube watch/short URLs to embeddable format.
 * e.g. https://www.youtube.com/watch?v=abc → https://www.youtube.com/embed/abc
 *      https://youtu.be/abc             → https://www.youtube.com/embed/abc
 */
const toEmbedUrl = (url: string): string => {
  try {
    const u = new URL(url);
    // youtube.com/watch?v=VIDEO_ID
    if ((u.hostname === 'www.youtube.com' || u.hostname === 'youtube.com') && u.pathname === '/watch') {
      const videoId = u.searchParams.get('v');
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }
    // youtu.be/VIDEO_ID
    if (u.hostname === 'youtu.be') {
      const videoId = u.pathname.slice(1);
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }
    // youtube.com/shorts/VIDEO_ID
    if ((u.hostname === 'www.youtube.com' || u.hostname === 'youtube.com') && u.pathname.startsWith('/shorts/')) {
      const videoId = u.pathname.replace('/shorts/', '');
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }
  } catch {
    // not a valid URL, return as-is
  }
  return url;
};

const VideoHudWrapper: React.FC<VideoHudWrapperProps> = ({
  videoUrl,
  title,
  children
}) => {
  const embedUrl = toEmbedUrl(videoUrl);

  return (
    <div className="learning-hud-video-frame">
      {/* Video iframe */}
      <iframe
        src={embedUrl}
        title={title}
        allowFullScreen
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
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