import React, { useEffect, useState } from 'react';
import { PetState, SpriteConfig } from './types';
import { SPRITE_SHEETS } from './constants';

interface SpriteAnimatorProps {
  state: PetState;
  facingRight: boolean;
  config: SpriteConfig;
}

export const SpriteAnimator: React.FC<SpriteAnimatorProps> = ({ state, facingRight, config }) => {
  const [frameIndex, setFrameIndex] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [currentSprite, setCurrentSprite] = useState(config.src);

  // Get appropriate sprite sheet based on state
  const getSpriteForState = (s: PetState): string => {
    switch (s) {
      case PetState.IDLE: 
        return SPRITE_SHEETS.idle;
      case PetState.DRAGGING:
        return SPRITE_SHEETS.drag;
      case PetState.WALKING: 
        return SPRITE_SHEETS.walking;
      case PetState.HAPPY: 
        return SPRITE_SHEETS.interact;
      case PetState.INTRO:
        return SPRITE_SHEETS.intro;
      case PetState.OUTRO:
        return SPRITE_SHEETS.outro;
      case PetState.SLEEP:
        return SPRITE_SHEETS.sleep;
      case PetState.WAKEUP:
        return SPRITE_SHEETS.wakeup;
      default: 
        return SPRITE_SHEETS.idle;
    }
  };

  // Update sprite sheet when state changes
  useEffect(() => {
    const newSprite = getSpriteForState(state);
    if (newSprite !== currentSprite) {
      setCurrentSprite(newSprite);
      setFrameIndex(0); // Reset frame when changing sprite
      setHasError(false); // Reset error state
    }
  }, [state, currentSprite]);

  // Frame animation
  useEffect(() => {
    const totalFrames = config.cols * config.rows;
    const interval = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % totalFrames);
    }, config.animationSpeed);

    return () => clearInterval(interval);
  }, [config.animationSpeed, config.cols, config.rows]);

  // Handle Image Error
  if (hasError) {
    return (
      <div 
        className="flex flex-col items-center justify-center text-white text-xs font-bold p-1 text-center border-2 border-white animate-pulse bg-pink-500/50 rounded-lg"
        style={{
          width: `${config.width}px`,
          height: `${config.height}px`,
        }}
      >
        <span>IMG ERR</span>
        <span className="opacity-75 font-normal text-[8px]">{currentSprite}</span>
      </div>
    );
  }

  // For 4x4 sprite sheets, we use all rows as animation frames in sequence
  // Calculate position based on frame index (0-15 for 4x4)
  const col = frameIndex % config.cols;
  const row = Math.floor(frameIndex / config.cols) % config.rows;
  
  // Using background-image approach for more reliable sprite rendering
  const bgPositionX = -(col * config.width);
  const bgPositionY = -(row * config.height);

  return (
    <div 
      className="relative overflow-hidden"
      style={{
        width: `${config.width}px`,
        height: `${config.height}px`,
        // Flip the container if moving left
        transform: facingRight ? 'scaleX(1)' : 'scaleX(-1)',
        backgroundImage: `url(${currentSprite})`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: `${bgPositionX}px ${bgPositionY}px`,
        backgroundSize: `${config.cols * 100}%`, // Scale background relative to container
        imageRendering: 'pixelated', // Keep pixel art crisp
      }}
    >
      {/* Hidden img to trigger error handling if loading fails */}
      <img 
        src={currentSprite}
        alt="hidden-loader"
        onError={() => setHasError(true)}
        style={{ display: 'none' }}
      />
    </div>
  );
};