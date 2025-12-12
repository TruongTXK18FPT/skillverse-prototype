import React, { useState, useEffect, useRef } from 'react';
import ReactHowler from 'react-howler';
import YouTube from 'react-youtube';
import {
  Play, Pause, SkipBack, SkipForward,
  Volume2, VolumeX, Repeat, Music, ChevronDown, Link as LinkIcon
} from 'lucide-react';
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
  // Default always expanded (even on mobile) when first mounted
  const [isExpanded, setIsExpanded] = useState(true);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [volume, setVolume] = useState(0.5);
  const [sourceMode, setSourceMode] = useState<'LOCAL' | 'YOUTUBE'>('LOCAL');
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [inputUrl, setInputUrl] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  
  // Ref để tránh stale closure trong onEnd
  const isLoopingRef = useRef(isLooping);
  
  // Thêm state để force update loop cho Howler
  const [howlerLoop, setHowlerLoop] = useState(false);

  // Đồng bộ state loop của UI với prop loop của Howler và Ref
  useEffect(() => {
    setHowlerLoop(isLooping);
    isLoopingRef.current = isLooping;
  }, [isLooping]);

  // Progress & Meta
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [ytMeta, setYtMeta] = useState({ title: '', author: '' });

  const youtubePlayerRef = useRef<any>(null);
  const howlerRef = useRef<ReactHowler>(null);
  const progressInterval = useRef<any>(null);

  const currentTrack = LOCAL_TRACKS[currentTrackIndex];

  // --- CLEANUP FUNCTION (CRITICAL FIX) ---
  // Reset refs và state khi chuyển chế độ để tránh crash
  useEffect(() => {
    // Stop playing when switching
    setIsPlaying(false);
    setProgress(0);
    setDuration(0);

    // Clear Refs based on new mode
    if (sourceMode === 'LOCAL') {
      youtubePlayerRef.current = null;
    } else {
      // Switching to Youtube
      // Howler component will unmount, ref will clear automatically
    }
  }, [sourceMode]);

  // --- Helpers ---
  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };
  const videoId = getYoutubeId(youtubeUrl);

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // --- Local Load Handler ---
  const handleLocalLoad = () => {
    if (howlerRef.current) setDuration(howlerRef.current.duration());
  };

  // --- Progress Loop ---
  useEffect(() => {
    if (isPlaying && !isSeeking) {
      progressInterval.current = setInterval(() => {
        if (sourceMode === 'LOCAL' && howlerRef.current) {
          const seek = howlerRef.current.seek() as number;
          setProgress(seek);
          if (duration === 0) setDuration(howlerRef.current.duration());
        } else if (sourceMode === 'YOUTUBE' && youtubePlayerRef.current) {
          // Check if player is actually ready
          if (typeof youtubePlayerRef.current.getCurrentTime === 'function') {
            const currentTime = youtubePlayerRef.current.getCurrentTime();
            setProgress(currentTime);
            const dur = youtubePlayerRef.current.getDuration();
            if (dur > 0 && duration !== dur) setDuration(dur);
          }
        }
      }, 1000);
    } else {
      clearInterval(progressInterval.current);
    }
    return () => clearInterval(progressInterval.current);
  }, [isPlaying, isSeeking, sourceMode, duration]);

  // --- Seek Handlers ---
  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setProgress(newTime);
    setIsSeeking(true);
  };

  const handleSeekMouseUp = (e: React.MouseEvent<HTMLInputElement> | React.TouchEvent<HTMLInputElement>) => {
    setIsSeeking(false);
    const newTime = parseFloat((e.target as HTMLInputElement).value);

    if (sourceMode === 'LOCAL' && howlerRef.current) {
      howlerRef.current.seek(newTime);
    } else if (sourceMode === 'YOUTUBE' && youtubePlayerRef.current) {
      youtubePlayerRef.current.seekTo(newTime, true);
    }
  };

  // --- Sync Volume ---
  useEffect(() => {
    if (sourceMode === 'YOUTUBE' && youtubePlayerRef.current && typeof youtubePlayerRef.current.setVolume === 'function') {
      youtubePlayerRef.current.setVolume(isMuted ? 0 : volume * 100);
    }
  }, [volume, isMuted, sourceMode]);

  // --- Sync Play/Pause ---
  useEffect(() => {
    if (sourceMode === 'YOUTUBE' && youtubePlayerRef.current && typeof youtubePlayerRef.current.playVideo === 'function') {
      isPlaying ? youtubePlayerRef.current.playVideo() : youtubePlayerRef.current.pauseVideo();
    }
  }, [isPlaying, sourceMode]);

  // --- Navigation ---
  const handleNext = () => {
    if (sourceMode === 'LOCAL') {
      setCurrentTrackIndex((prev) => (prev + 1) % LOCAL_TRACKS.length);
      setIsPlaying(true);
      setProgress(0);
    }
  };

  const handlePrev = () => {
    if (sourceMode === 'LOCAL') {
      setCurrentTrackIndex((prev) => (prev - 1 + LOCAL_TRACKS.length) % LOCAL_TRACKS.length);
      setIsPlaying(true);
      setProgress(0);
    }
  };

  // --- LOOP LOGIC FIXED ---
  const handleTrackEnd = () => {
    if (isLooping) {
      // 1. YouTube: Manual Loop
      if (sourceMode === 'YOUTUBE' && youtubePlayerRef.current) {
        youtubePlayerRef.current.seekTo(0);
        youtubePlayerRef.current.playVideo();
        setProgress(0);
      }
      // 2. Local: Howler 'loop' prop handles audio. We just reset UI.
      else if (sourceMode === 'LOCAL') {
        setProgress(0);
        // DO NOT call seek(0) here, it causes stutter.
      }
    } else {
      // Not looping -> Next track (Local) or Stop (YouTube)
      if (sourceMode === 'LOCAL') handleNext();
      else setIsPlaying(false);
    }
  };

  // --- RENDER ---
  return (
    <div className="temple-player-wrapper">
      
      {/* 1. AUDIO ENGINES (LUÔN RENDER - KHÔNG BAO GIỜ BỊ UNMOUNT HOẶC DISPLAY:NONE) */}
      <div className="audio-engine-layer" style={{ position: 'fixed', top: -9999, left: -9999, opacity: 0, pointerEvents: 'none' }}>
          {sourceMode === 'LOCAL' && currentTrack && (
            <ReactHowler
              ref={howlerRef}
              src={currentTrack.src}
              playing={isPlaying}
              volume={isMuted ? 0 : volume}
              // Dùng state riêng để đảm bảo đồng bộ
              loop={howlerLoop} 
              onEnd={() => {
                 // Dùng Ref để lấy giá trị mới nhất, tránh stale closure
                 if (isLoopingRef.current) {
                   setProgress(0);
                 } else {
                   handleNext();
                 }
              }}
              onLoad={handleLocalLoad}
              html5={false}
            />
          )}

          {sourceMode === 'YOUTUBE' && videoId && (
              <YouTube
                videoId={videoId}
                opts={{ playerVars: { autoplay: 1, controls: 0, playsinline: 1 } }} // playsinline quan trọng cho mobile
                onReady={(e) => {
                  youtubePlayerRef.current = e.target;
                  e.target.setVolume(isMuted ? 0 : volume * 100);
                  const data = e.target.getVideoData();
                  if (data) setYtMeta({ title: data.title, author: data.author });
                  setDuration(e.target.getDuration());
                  if(isPlaying) e.target.playVideo();
                }}
                onStateChange={(e) => {
                  if (e.data === 0) handleTrackEnd(); 
                }}
              />
          )}
      </div>

      {/* 2. VISUAL UI (Chỉ hiện khi isExpanded = true) */}
      <div 
        className={`temple-player-container ${isZenMode ? 'zen-active' : ''}`} 
        style={{ 
            display: isExpanded ? 'block' : 'none',
        }} 
      >
        <div className="tp-header">
          <div className="tp-header-left">
            <div className="tp-title">JADE CONSOLE</div>
            <button className="tp-collapse-btn" onClick={() => setIsExpanded(false)}>
              <ChevronDown size={16} />
            </button>
          </div>

          <div className={`tp-zen-toggle ${isZenMode ? 'active' : ''}`} onClick={onToggleZen}>
            <div className="tp-zen-indicator"></div>
            <span className="tp-zen-text">{isZenMode ? 'TỊNH TÂM' : 'TẠP NIỆM'}</span>
          </div>
        </div>

        <div className="tp-tabs">
          <button className={`tp-tab ${sourceMode === 'LOCAL' ? 'active' : ''}`} onClick={() => setSourceMode('LOCAL')}>PLAYLIST</button>
          <button className={`tp-tab ${sourceMode === 'YOUTUBE' ? 'active' : ''}`} onClick={() => setSourceMode('YOUTUBE')}>YOUTUBE</button>
        </div>

        <div className="tp-content">
          {sourceMode === 'LOCAL' ? (
            <div className="tp-song-info">
              <div className="tp-song-title">{currentTrack?.title}</div>
              <div className="tp-song-artist">{currentTrack?.artist}</div>
            </div>
          ) : (
            // YouTube Display Logic
            videoId && ytMeta.title ? (
              <div className="tp-song-info youtube-mode">
                <div className="tp-song-title" title={ytMeta.title}>{ytMeta.title.substring(0, 30) + (ytMeta.title.length > 30 ? '...' : '')}</div>
                <div className="tp-song-artist">{ytMeta.author || 'YouTube Audio'}</div>
                <button className="tp-change-link-btn" onClick={() => {
                  setYoutubeUrl('');
                  setYtMeta({ title: '', author: '' });
                  setIsPlaying(false);
                  youtubePlayerRef.current = null; // Xóa tham chiếu tới player cũ ngay lập tức
                }}>
                  <LinkIcon size={10} style={{ marginRight: 4 }} /> Change Link
                </button>
              </div>
            ) : (
              <div className="tp-input-group">
                <input
                  type="text" className="tp-input" placeholder="Link YouTube..."
                  value={inputUrl} onChange={(e) => setInputUrl(e.target.value)}
                />
                <button className="tp-btn-load" onClick={() => { setYoutubeUrl(inputUrl); setIsPlaying(true); setDuration(0); }}>LOAD</button>
              </div>
            )
          )}
        </div>

        <div className="tp-progress-container">
          <span className="tp-time">{formatTime(progress)}</span>
          <input
            type="range" min="0" max={duration > 0 ? duration : 100} step="1"
            value={progress} onChange={handleSeekChange}
            onMouseUp={handleSeekMouseUp} onTouchEnd={handleSeekMouseUp}
            className="tp-seek-slider" disabled={duration === 0}
            style={{ opacity: duration === 0 ? 0.5 : 1 }}
          />
          <span className="tp-time">{formatTime(duration)}</span>
        </div>

        <div className="tp-controls-row">
          <button className={`tp-btn-control small ${isLooping ? 'active-loop' : ''}`} onClick={() => setIsLooping(!isLooping)}><Repeat size={14} /></button>

          <button className="tp-btn-control" onClick={handlePrev} disabled={sourceMode === 'YOUTUBE'}><SkipBack size={18} /></button>

          <button className="tp-btn-control play-pause" onClick={() => setIsPlaying(!isPlaying)}>
            {isPlaying ? <Pause size={22} /> : <Play size={22} />}
          </button>

          <button className="tp-btn-control" onClick={handleNext} disabled={sourceMode === 'YOUTUBE'}><SkipForward size={18} /></button>

          <div className="tp-volume-container">
            <div onClick={() => setIsMuted(!isMuted)} style={{ cursor: 'pointer', color: '#4ade80' }}>
              {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </div>
            <input
              type="range" min="0" max="1" step="0.05" value={volume}
              onChange={(e) => { setVolume(parseFloat(e.target.value)); if (parseFloat(e.target.value) > 0) setIsMuted(false); }}
              className="tp-volume-slider"
            />
          </div>
        </div>
      </div>

      <div
        className={`tp-mobile-fab ${isPlaying ? 'playing' : ''}`}
        style={{ display: isExpanded ? 'none' : 'flex' }}
        onClick={() => setIsExpanded(true)}
      >
        <Music size={24} className={isPlaying ? 'spin-slow' : ''} />
      </div>

    </div>
  );
};

export default TempleMusicPlayer;