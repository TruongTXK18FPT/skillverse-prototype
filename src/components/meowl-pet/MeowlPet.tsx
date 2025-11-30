import React, { useState, useEffect, useRef } from 'react';
import './MeowlPet.css';
import { SpriteAnimator } from './SpriteAnimator';
import { PetState, Position } from './types';
import { PET_CONFIG, MOVEMENT_SPEED, STOP_DISTANCE, INTERACTION_DURATION, SLEEP_TIMEOUT, SOUNDS, WALK_BOB_AMPLITUDE, WALK_BOB_SPEED } from './constants';

interface MeowlPetProps {
  targetPosition?: Position;
  isExiting?: boolean;
  onExitComplete?: () => void;
}

const MeowlPet: React.FC<MeowlPetProps> = ({ targetPosition, isExiting, onExitComplete }) => {
  // Position State
  const [position, setPosition] = useState<Position>({ 
    x: window.innerWidth / 2 - PET_CONFIG.width / 2, 
    y: window.innerHeight / 2 - PET_CONFIG.height / 2 
  });
  
  // Logic State
  const [petState, setPetState] = useState<PetState>(PetState.INTRO); // Start with INTRO
  const [isFollowing, setIsFollowing] = useState<boolean>(true);
  const [facingRight, setFacingRight] = useState<boolean>(true);
  const [bobOffset, setBobOffset] = useState<number>(0);
  
  // Dragging Refs
  const isDragging = useRef<boolean>(false);
  const dragOffset = useRef<Position>({ x: 0, y: 0 });
  
  // Interaction Refs
  const lastInteractionTime = useRef<number>(Date.now());
  
  // Audio ref for sound effects
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Mouse tracking for auto-follow
  const [mousePos, setMousePos] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 });

  // Handle Intro Animation
  useEffect(() => {
    if (petState === PetState.INTRO) {
      // Play intro sound
      if (SOUNDS.intro) {
        const introAudio = new Audio(SOUNDS.intro);
        introAudio.volume = 0.5;
        introAudio.play().catch(console.error);
      }

      const timer = setTimeout(() => {
        setPetState(PetState.IDLE);
      }, PET_CONFIG.animationSpeed * (PET_CONFIG.rows * PET_CONFIG.cols));
      return () => clearTimeout(timer);
    }
  }, [petState]);

  // Handle Outro Animation
  useEffect(() => {
    if (isExiting) {
      setPetState(PetState.OUTRO);

      // Play outro sound
      if (SOUNDS.outro) {
        const outroAudio = new Audio(SOUNDS.outro);
        outroAudio.volume = 0.5;
        outroAudio.play().catch(console.error);
      }

      const timer = setTimeout(() => {
        if (onExitComplete) onExitComplete();
      }, PET_CONFIG.animationSpeed * (PET_CONFIG.rows * PET_CONFIG.cols));
      return () => clearTimeout(timer);
    }
  }, [isExiting, onExitComplete]);

  // Handle Sleep Logic
  useEffect(() => {
    const checkSleep = setInterval(() => {
      if (petState === PetState.WALKING) {
        // If walking, keep the pet awake by updating the interaction time
        updateInteraction();
      } else if (petState === PetState.IDLE) {
        if (Date.now() - lastInteractionTime.current > SLEEP_TIMEOUT) {
          setPetState(PetState.SLEEP);
        }
      }
    }, 1000);
    return () => clearInterval(checkSleep);
  }, [petState]);

  // Update interaction time on any activity
  const updateInteraction = () => {
    lastInteractionTime.current = Date.now();
  };

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio(SOUNDS.interact);
    audioRef.current.preload = 'auto';
    audioRef.current.loop = true; // Loop sound while hovering
  }, []);

  // Play sound function
  const playInteractSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0; // Reset to start
      audioRef.current.play().catch(console.error); // Handle autoplay restrictions
    }
  };

  const stopInteractSound = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  // Track mouse position globally
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Physics Loop
  useEffect(() => {
    let animationFrameId: number;
    const currentTarget = targetPosition || mousePos;

    const loop = () => {
      // States where movement is disabled
      if (
        petState === PetState.DRAGGING || 
        petState === PetState.HAPPY || 
        petState === PetState.INTRO || 
        petState === PetState.OUTRO || 
        petState === PetState.SLEEP || 
        petState === PetState.WAKEUP
      ) {
        setBobOffset(0);
        animationFrameId = requestAnimationFrame(loop);
        return;
      }

      if (!isFollowing) {
        if (petState !== PetState.IDLE) setPetState(PetState.IDLE);
        setBobOffset(0);
        animationFrameId = requestAnimationFrame(loop);
        return;
      }

      // Follow Logic
      setPosition((prev) => {
        // Center the pet on its coordinates
        const currentCenterX = prev.x + PET_CONFIG.width / 2;
        const currentCenterY = prev.y + PET_CONFIG.height / 2;

        const dx = currentTarget.x - currentCenterX;
        const dy = currentTarget.y - currentCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > STOP_DISTANCE) {
          // Lerp movement: Move a fraction of the distance for that "chase" effect
          const nextX = prev.x + dx * MOVEMENT_SPEED;
          const nextY = prev.y + dy * MOVEMENT_SPEED;

          // Hysteresis for facing direction to prevent jitter
          if (dx > 20 && !facingRight) setFacingRight(true);
          if (dx < -20 && facingRight) setFacingRight(false);

          if (petState !== PetState.WALKING) setPetState(PetState.WALKING);

          // Calculate bobbing effect for walking animation
          const time = Date.now();
          setBobOffset(Math.sin(time / WALK_BOB_SPEED) * WALK_BOB_AMPLITUDE);

          return { x: nextX, y: nextY };
        } else {
          // Arrived / Idle
          if (petState !== PetState.IDLE) setPetState(PetState.IDLE);
          setBobOffset(0); // Reset bob
          return prev;
        }
      });

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [targetPosition, mousePos, isFollowing, petState, facingRight]);

  // Interaction Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click for drag
    e.preventDefault();
    updateInteraction();

    // Wake up if sleeping
    if (petState === PetState.SLEEP) {
      setPetState(PetState.WAKEUP);
      setTimeout(() => {
        setPetState(PetState.IDLE);
      }, PET_CONFIG.animationSpeed * (PET_CONFIG.rows * PET_CONFIG.cols));
      return;
    }
    
    // Don't drag if animating special states
    if (petState === PetState.INTRO || petState === PetState.OUTRO || petState === PetState.WAKEUP) return;

    isDragging.current = true;
    setPetState(PetState.DRAGGING);
    
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);
  };

  const handleGlobalMouseMove = (e: MouseEvent) => {
    if (!isDragging.current) return;
    updateInteraction();
    setPosition({
      x: e.clientX - dragOffset.current.x,
      y: e.clientY - dragOffset.current.y
    });
  };

  const handleGlobalMouseUp = () => {
    isDragging.current = false;
    setPetState(PetState.IDLE);
    document.removeEventListener('mousemove', handleGlobalMouseMove);
    document.removeEventListener('mouseup', handleGlobalMouseUp);
  };

  const handleMouseEnter = () => {
    if (isDragging.current) return;
    updateInteraction();
    
    // Start 3s timer
    hoverTimerRef.current = setTimeout(() => {
      setPetState(PetState.HAPPY);
      playInteractSound();
    }, 3000);
  };

  const handleMouseLeave = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    
    if (petState === PetState.HAPPY) {
      stopInteractSound();
      setPetState(PetState.IDLE);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsFollowing(!isFollowing);
  };

  return (
    <div
      className="meowl-pet fixed select-none cursor-grab active:cursor-grabbing will-change-transform"
      style={{
        // Apply position and the walking bob effect
        transform: `translate3d(${position.x}px, ${position.y + bobOffset}px, 0)`,
        width: PET_CONFIG.width,
        height: PET_CONFIG.height,
        zIndex: 9999,
      }}
      onMouseDown={handleMouseDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onContextMenu={handleContextMenu}
    >
      {/* Tooltip / Status Indicator */}
      <div className={`absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1 rounded-full bg-black/70 backdrop-blur-sm text-white text-xs font-medium pointer-events-none transition-all duration-300 ${!isFollowing ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
      </div>

      <SpriteAnimator 
        state={petState} 
        facingRight={facingRight} 
        config={PET_CONFIG} 
      />
    </div>
  );
};

export default MeowlPet;