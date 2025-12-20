import React, { useEffect, useState } from 'react';
import { PetState, SpriteConfig } from './types';
import { SPRITE_SHEETS } from './constants';

interface SpriteAnimatorProps {
  state: PetState;
  facingRight: boolean;
  config: SpriteConfig;
  startFrame?: number;
  endFrame?: number;
  customSequence?: number[];
  speedMultiplier?: number;
  loop?: boolean;
}

export const SpriteAnimator: React.FC<SpriteAnimatorProps> = ({ 
  state, 
  facingRight, 
  config, 
  startFrame, 
  endFrame, 
  customSequence,
  speedMultiplier = 1,
  loop = true 
}) => {
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
      case PetState.GROOMING:
        return SPRITE_SHEETS.grooming;
      case PetState.TAKE_PIZZA:
        return SPRITE_SHEETS.takePizza;
      case PetState.EATING:
        return SPRITE_SHEETS.eatPizza;
      case PetState.FINISH_PIZZA:
        return SPRITE_SHEETS.finishPizza;
      case PetState.STOMACH_ACHE:
        return SPRITE_SHEETS.stomachAche;
      case PetState.FIND_TOILET:
        return SPRITE_SHEETS.findToilet;
      case PetState.REALIZE:
        return SPRITE_SHEETS.realize;
      case PetState.FLEE_CRY:
        return SPRITE_SHEETS.fleeCry;
      case PetState.HIDING_CRY:
        return SPRITE_SHEETS.hidingCry;
      case PetState.DRAG_CRY:
        return SPRITE_SHEETS.dragCry;
      case PetState.OK_FOR_NOW:
        return SPRITE_SHEETS.okForNow;
      case PetState.ANGRY:
        return SPRITE_SHEETS.angry;
      case PetState.COFFEE_1:
        return SPRITE_SHEETS.coffee1;
      case PetState.COFFEE_2:
        return SPRITE_SHEETS.coffee2;
      case PetState.COFFEE_3:
        return SPRITE_SHEETS.coffee3;
      case PetState.COFFEE_4:
        return SPRITE_SHEETS.coffee4;
      case PetState.COFFEE_5:
        return SPRITE_SHEETS.coffee5;
      default: 
        return SPRITE_SHEETS.idle;
    }
  };

  // Update sprite sheet when state changes
  useEffect(() => {
    const newSprite = getSpriteForState(state);
    if (newSprite !== currentSprite) {
      setCurrentSprite(newSprite);
      setFrameIndex(startFrame || 0); // Reset frame when changing sprite
      setHasError(false); // Reset error state
    }
  }, [state, currentSprite, startFrame]);

  // Frame animation
  useEffect(() => {
    const totalFrames = config.cols * config.rows;
    
    // If custom sequence is provided, use it
    if (customSequence && customSequence.length > 0) {
      const interval = setInterval(() => {
        setFrameIndex((prev) => {
          const next = prev + 1;
          if (next >= customSequence.length) {
            if (!loop) return customSequence.length - 1;
            return 0;
          }
          return next;
        });
      }, config.animationSpeed * (1 / speedMultiplier));
      return () => clearInterval(interval);
    }

    // Standard start/end frame logic
    const start = startFrame !== undefined ? startFrame : 0;
    const end = endFrame !== undefined ? endFrame : totalFrames - 1;
    
    const interval = setInterval(() => {
      setFrameIndex((prev) => {
        // If we switched from custom sequence to normal, prev might be out of bounds or irrelevant
        // But usually we reset frameIndex on state change.
        // However, if we just change props without state change, we need to be careful.
        // For now, simple increment is fine.
        
        // Ensure prev is within range if we just switched modes (though useEffect deps should handle reset)
        let current = prev;
        if (current < start) current = start;
        
        const next = current + 1;
        if (next > end) {
          if (!loop) return end; // Stay at last frame if not looping
          return start;
        }
        return next;
      });
    }, config.animationSpeed * (1 / speedMultiplier));

    return () => clearInterval(interval);
  }, [config.animationSpeed, config.cols, config.rows, startFrame, endFrame, customSequence, speedMultiplier, loop]);

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
  let actualFrame = frameIndex;
  
  // If using custom sequence, map index to actual frame
  if (customSequence && customSequence.length > 0) {
    actualFrame = customSequence[frameIndex % customSequence.length];
  }

  const col = actualFrame % config.cols;
  const row = Math.floor(actualFrame / config.cols) % config.rows;
  
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