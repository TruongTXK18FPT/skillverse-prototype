import React, { useEffect, useRef, useState } from 'react';
import './MeowlActor.css';

// Import Assets
import walkImg from '../../../assets/meowl-tic-tac-toe/sprite-sheet/walk-with-o.png';
import pickupImg from '../../../assets/meowl-tic-tac-toe/sprite-sheet/pick-up.png';
import placeImg from '../../../assets/meowl-tic-tac-toe/sprite-sheet/place-move.png';
import smugImg from '../../../assets/meowl-tic-tac-toe/sprite-sheet/smug.png';
import panicImg from '../../../assets/meowl-tic-tac-toe/sprite-sheet/panic.png';
import winImg from '../../../assets/meowl-tic-tac-toe/sprite-sheet/meowl-win.png';
import loseImg from '../../../assets/meowl-tic-tac-toe/sprite-sheet/meowl-lose.png';
// --- NEW IMPORT ---
import thinkImg from '../../../assets/meowl-tic-tac-toe/sprite-sheet/idle-think.png';

// Import Sound
import panicSound from '../../../assets/meowl-tic-tac-toe/sound/anh-ban-a.mp3';
import loseSound from '../../../assets/meowl-tic-tac-toe/sound/banana-cat-cry.mp3';
import happySound from '../../../assets/meowl-tic-tac-toe/sound/happy-happy-happy-cat.mp3';

// Thêm 'think' vào type
export type MeowlAction = 'idle' | 'walk' | 'pickup' | 'place' | 'smug' | 'panic' | 'win' | 'lose' | 'think';

interface MeowlActorProps {
  action: MeowlAction;
  style?: React.CSSProperties;
}

interface SpriteConfig {
  src: string;
  cols: number;
  rows: number;
  frames?: number;
  speed: number;
  loop: boolean;
}

const SPRITE_CONFIGS: Record<MeowlAction, SpriteConfig> = {
  idle:   { src: walkImg, cols: 4, rows: 4, speed: 150, loop: true },
  walk:   { src: walkImg, cols: 4, rows: 4, speed: 100, loop: true },
  pickup: { src: pickupImg, cols: 4, rows: 4, speed: 80, loop: false, frames: 12 },
  place:  { src: placeImg, cols: 4, rows: 4, speed: 80, loop: false },
  smug:   { src: smugImg, cols: 4, rows: 4, speed: 150, loop: true },
  panic:  { src: panicImg, cols: 4, rows: 4, speed: 80, loop: true },
  win:    { src: winImg, cols: 4, rows: 4, speed: 120, loop: true },
  lose:   { src: loseImg, cols: 4, rows: 4, speed: 150, loop: true },
  // --- NEW CONFIG ---
  think:  { src: thinkImg, cols: 4, rows: 4, speed: 150, loop: true },
};

const MeowlActor: React.FC<MeowlActorProps> = ({ action, style }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [frameIndex, setFrameIndex] = useState(0);
  const config = SPRITE_CONFIGS[action];

  useEffect(() => {
    if (action === 'panic') playAudio(panicSound);
    else if (action === 'lose') playAudio(loseSound);
    else if (action === 'win') playAudio(happySound);
  }, [action]);

  useEffect(() => {
    setFrameIndex(0);
  }, [action]);

  useEffect(() => {
    const totalFrames = config.frames || (config.cols * config.rows);
    const interval = setInterval(() => {
      setFrameIndex(prev => {
        const next = prev + 1;
        if (next >= totalFrames) {
          if (!config.loop) {
            clearInterval(interval);
            return prev;
          }
          return 0;
        }
        return next;
      });
    }, config.speed);
    return () => clearInterval(interval);
  }, [config, action]);

  const playAudio = (src: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    audioRef.current = new Audio(src);
    audioRef.current.play().catch(e => console.error(e));
  };

  const col = frameIndex % config.cols;
  const row = Math.floor(frameIndex / config.cols) % config.rows;
  
  // Size hiển thị cố định
  const width = 150; 
  const height = 150;
  
  const bgX = -(col * width);
  const bgY = -(row * height);

  return (
    <div 
      className={`meowl-actor ${action}`}
      style={{
        ...style,
        width: `${width}px`,
        height: `${height}px`,
        backgroundImage: `url(${config.src})`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: `${bgX}px ${bgY}px`,
        backgroundSize: `${config.cols * 100}%`,
        imageRendering: 'pixelated'
      }}
    />
  );
};

export default MeowlActor;