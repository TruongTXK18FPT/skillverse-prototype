import React, { useState, useEffect, useRef } from 'react';
import ReactHowler from 'react-howler';
import YouTube, { YouTubeProps } from 'react-youtube';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import './temple-player.css';

// Import Audio Files
import soundNhanSinhQuan from '../../assets/pray/sound/NHAN-SINH-QUAN.mp3';
import soundPhapTaBa from '../../assets/pray/sound/PHAP-TA-BA.mp3';
import soundThanSinhPhuMau from '../../assets/pray/sound/THAN-SINH-PHU-MAU.mp3';

interface TempleMusicPlayerProps {
  isZenMode: boolean;
  onToggleZen: () => void;
  autoPlay?: boolean;
}

const LOCAL_TRACKS = [
  { title: "Nhân Sinh Quán", artist: "Ông Địa Peter", src: soundNhanSinhQuan },
  { title: "Pháp Ta Bà", artist: "Ông Địa Peter", src: soundPhapTaBa },
  { title: "Thân Sinh Phụ Mẫu", artist: "Ông Địa Peter", src: soundThanSinhPhuMau }
];

const TempleMusicPlayer: React.FC<TempleMusicPlayerProps> = ({ isZenMode, onToggleZen, autoPlay = false }) => {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [volume, setVolume] = useState(0.5);
  const [sourceMode, setSourceMode] = useState<'LOCAL' | 'YOUTUBE'>('LOCAL');
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [inputUrl, setInputUrl] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  
  // Ref for YouTube player to control volume
  const youtubePlayerRef = useRef<any>(null);

  // Extract Video ID from URL
  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const videoId = getYoutubeId(youtubeUrl);

  // Cleanup ref when switching modes to prevent stale API calls
  useEffect(() => {
    return () => {
      youtubePlayerRef.current = null;
    };
  }, [sourceMode]);

  // Update YouTube volume when volume state changes
  useEffect(() => {
    if (sourceMode === 'YOUTUBE' && youtubePlayerRef.current) {
      try {
        youtubePlayerRef.current.setVolume(isMuted ? 0 : volume * 100);
      } catch (e) {
        console.warn("YouTube setVolume failed:", e);
      }
    }
  }, [volume, isMuted, sourceMode]);

  // Sync play state with YouTube player
  useEffect(() => {
      if (sourceMode === 'YOUTUBE' && youtubePlayerRef.current) {
        try {
          if (isPlaying) youtubePlayerRef.current.playVideo();
          else youtubePlayerRef.current.pauseVideo();
        } catch (e) {
          console.warn("YouTube play/pause failed:", e);
        }
      }
  }, [isPlaying, sourceMode]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    if (sourceMode === 'LOCAL') {
      setCurrentTrackIndex((prev) => (prev + 1) % LOCAL_TRACKS.length);
      setIsPlaying(true);
    }
  };

  const handlePrev = () => {
    if (sourceMode === 'LOCAL') {
      setCurrentTrackIndex((prev) => (prev - 1 + LOCAL_TRACKS.length) % LOCAL_TRACKS.length);
      setIsPlaying(true);
    }
  };

  const handleLoadYoutube = () => {
    if (inputUrl) {
      setYoutubeUrl(inputUrl);
      setIsPlaying(true);
    }
  };

  const onYoutubeReady: YouTubeProps['onReady'] = (event) => {
    youtubePlayerRef.current = event.target;
    event.target.setVolume(isMuted ? 0 : volume * 100);
    if (isPlaying) {
        event.target.playVideo();
    }
  };

  const currentTrack = LOCAL_TRACKS[currentTrackIndex];

  return (
    <div className={`temple-player-container ${isZenMode ? 'zen-active' : ''} ${isPlaying ? 'playing' : ''}`}>
      
      {/* Audio Engine */}
      {sourceMode === 'LOCAL' ? (
        <ReactHowler
          src={currentTrack.src}
          playing={isPlaying}
          volume={isMuted ? 0 : volume}
          onEnd={handleNext}
          html5={true} // Force HTML5 Audio to support large files and streaming
        />
      ) : (
        videoId && (
            <div style={{ position: 'fixed', top: 0, left: 0, opacity: 0, pointerEvents: 'none', zIndex: -1 }}>
                <YouTube
                    videoId={videoId}
                    opts={{
                        height: '1',
                        width: '1',
                        playerVars: {
                            autoplay: isPlaying ? 1 : 0,
                            controls: 0,
                        },
                    }}
                    onReady={onYoutubeReady}
                    onEnd={() => setIsPlaying(false)}
                    onError={() => alert("YouTube Link Error")}
                />
            </div>
        )
      )}

      {/* Header */}
      <div className="tp-header">
        <div className="tp-title">JADE CONSOLE</div>
        <div 
            className={`tp-zen-toggle ${isZenMode ? 'active' : ''}`}
            onClick={onToggleZen}
            title="Chế độ Tịnh Tâm (Tắt tiếng ồn)"
        >
            <div className="tp-zen-indicator"></div>
            <span className="tp-zen-text">{isZenMode ? 'TỊNH TÂM' : 'TẠP NIỆM'}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="tp-tabs">
        <button 
            className={`tp-tab ${sourceMode === 'LOCAL' ? 'active' : ''}`}
            onClick={() => {
                setSourceMode('LOCAL');
                setIsPlaying(false); // Stop playing when switching modes
            }}
        >
            PLAYLIST
        </button>
        <button 
            className={`tp-tab ${sourceMode === 'YOUTUBE' ? 'active' : ''}`}
            onClick={() => {
                setSourceMode('YOUTUBE');
                setIsPlaying(false); // Stop playing when switching modes
            }}
        >
            YOUTUBE
        </button>
      </div>

      {/* Content Display */}
      <div className="tp-content">
        {sourceMode === 'LOCAL' ? (
            <div className="tp-song-info">
                <div className="tp-song-title">{currentTrack.title}</div>
                <div className="tp-song-artist">{currentTrack.artist}</div>
            </div>
        ) : (
            <div className="tp-input-group">
                <input 
                    type="text" 
                    className="tp-input" 
                    placeholder="Dán link YouTube..."
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                />
                <button className="tp-btn-load" onClick={handleLoadYoutube}>LOAD</button>
            </div>
        )}
      </div>

      {/* Controls */}
      <div className="tp-controls">
        <button className="tp-btn-control" onClick={handlePrev} disabled={sourceMode === 'YOUTUBE'}>
            <SkipBack size={16} />
        </button>
        
        <button className="tp-btn-control play-pause" onClick={handlePlayPause}>
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
        </button>
        
        <button className="tp-btn-control" onClick={handleNext} disabled={sourceMode === 'YOUTUBE'}>
            <SkipForward size={16} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flex: 1, marginLeft: '10px' }}>
            <div onClick={() => setIsMuted(!isMuted)} style={{ cursor: 'pointer', color: '#4ade80' }}>
                {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </div>
            <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.05" 
                value={volume} 
                onChange={(e) => {
                    setVolume(parseFloat(e.target.value));
                    if (parseFloat(e.target.value) > 0) setIsMuted(false);
                }}
                className="tp-volume-slider"
            />
        </div>
      </div>
    </div>
  );
};

export default TempleMusicPlayer;
