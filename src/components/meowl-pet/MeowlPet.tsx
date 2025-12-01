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
  
  // Animation Control
  const [startFrame, setStartFrame] = useState<number | undefined>(undefined);
  const [endFrame, setEndFrame] = useState<number | undefined>(undefined);
  const [eatingPhase, setEatingPhase] = useState<number>(0); // 0: none, 1: chewing, 2: swallowing
  const [toiletPhase, setToiletPhase] = useState<number>(0); // 0: running, 1: hidden
  const toiletTargetRef = useRef<Position>({ x: 0, y: 0 });
  const toiletTimerRef = useRef<number>(0);
  const isReturningFromToiletRef = useRef<boolean>(false);

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

  // Reset animation frames when state changes
  useEffect(() => {
    setStartFrame(undefined);
    setEndFrame(undefined);
  }, [petState]);

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
        setPetState(PetState.WALKING);
        isReturningFromToiletRef.current = true;
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

  // Random Idle Behavior (Every 15s)
  useEffect(() => {
    if (petState !== PetState.IDLE) return;

    const randomBehavior = setInterval(() => {
      if (petState !== PetState.IDLE) return;
      
      const rand = Math.random();
      if (rand < 0.33) {
        // Stay IDLE
      } else if (rand < 0.66) {
        // Grooming
        setPetState(PetState.GROOMING);
        setTimeout(() => setPetState(PetState.IDLE), 4000); // Groom for 4s
      } else {
        // Eat Pizza Sequence
        startEatingSequence();
      }
    }, 15000);

    return () => clearInterval(randomBehavior);
  }, [petState]);

  const startEatingSequence = () => {
    setPetState(PetState.TAKE_PIZZA);
    // Take pizza animation (16 frames * 100ms = 1.6s)
    setTimeout(() => {
      setPetState(PetState.EATING);
      setEatingPhase(1); // Start chewing
    }, 1600);
  };

  // Handle Eating Logic
  useEffect(() => {
    if (petState === PetState.EATING) {
      if (eatingPhase === 1) {
        // Chewing: Loop rows 0-2 (Frames 0-11)
        setStartFrame(0);
        setEndFrame(11);
        
        // Chew for random time (2-4s)
        const chewTime = 2000 + Math.random() * 2000;
        const timer = setTimeout(() => {
          setEatingPhase(2);
        }, chewTime);
        return () => clearTimeout(timer);
      } else if (eatingPhase === 2) {
        // Swallowing/Finishing bite: Loop row 3 (Frames 12-15)
        setStartFrame(12);
        setEndFrame(15);
        
        // Play once or short loop then finish
        const timer = setTimeout(() => {
          setPetState(PetState.FINISH_PIZZA);
          setEatingPhase(0);
        }, 1600);
        return () => clearTimeout(timer);
      }
    } else if (petState === PetState.FINISH_PIZZA) {
      // After finishing pizza, check for stomach ache (rare)
      const timer = setTimeout(() => {
        // 20% chance of stomach ache
        if (Math.random() < 0.2) {
          startStomachAcheSequence();
        } else {
          setPetState(PetState.IDLE);
        }
      }, 1600);
      return () => clearTimeout(timer);
    }
  }, [petState, eatingPhase]);

  const startStomachAcheSequence = () => {
    setPetState(PetState.STOMACH_ACHE);
    // Stomach ache for 3s
    setTimeout(() => {
      setPetState(PetState.FIND_TOILET);
      setToiletPhase(0);
      toiletTimerRef.current = Date.now();
    }, 3000);
  };

  // Handle Toilet Logic
  useEffect(() => {
    if (petState === PetState.TOILET_BREAK) {
      // Play flush sound
      if (SOUNDS.flush) {
        const flushAudio = new Audio(SOUNDS.flush);
        flushAudio.volume = 0.5;
        flushAudio.play().catch(console.error);
      }

      const timer = setTimeout(() => {
        // Return to user from the edge it disappeared
        setPetState(PetState.WALKING); 
        isReturningFromToiletRef.current = true;
        
        // Set position to just off-screen left (where it ran to)
        setPosition({ x: -100, y: position.y });
      }, 3000);
      return () => clearTimeout(timer);
    }
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
        petState === PetState.WAKEUP ||
        petState === PetState.GROOMING ||
        petState === PetState.TAKE_PIZZA ||
        petState === PetState.EATING ||
        petState === PetState.FINISH_PIZZA ||
        petState === PetState.STOMACH_ACHE ||
        petState === PetState.TOILET_BREAK
      ) {
        setBobOffset(0);
        animationFrameId = requestAnimationFrame(loop);
        return;
      }

      // Handle Find Toilet Chaos Movement
      if (petState === PetState.FIND_TOILET) {
        const now = Date.now();
        const runDuration = now - toiletTimerRef.current;

        if (runDuration < 4000) {
          // Run chaotically for 4s
          // Pick random target every 500ms or if close
          const dx = toiletTargetRef.current.x - position.x;
          const dy = toiletTargetRef.current.y - position.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 20 || Math.random() < 0.05) {
            toiletTargetRef.current = {
              x: Math.random() * (window.innerWidth - 100),
              y: Math.random() * (window.innerHeight - 100)
            };
          }
        } else {
          // Run to edge
          if (toiletPhase === 0) {
            setToiletPhase(1);
            // Pick nearest edge
            toiletTargetRef.current = {
              x: -200, // Just run left off screen for simplicity
              y: position.y
            };
          }
        }

        // Move towards toilet target
        setPosition((prev) => {
          const tDx = toiletTargetRef.current.x - prev.x;
          const tDy = toiletTargetRef.current.y - prev.y;
          
          // Move fast!
          const speed = MOVEMENT_SPEED * 3; 
          const nextX = prev.x + tDx * speed;
          const nextY = prev.y + tDy * speed;

          if (tDx > 0 && !facingRight) setFacingRight(true);
          if (tDx < 0 && facingRight) setFacingRight(false);

          // Check if off screen
          if (toiletPhase === 1 && prev.x < -100) {
            setPetState(PetState.TOILET_BREAK);
          }

          return { x: nextX, y: nextY };
        });

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
          const speed = isReturningFromToiletRef.current ? MOVEMENT_SPEED * 0.2 : MOVEMENT_SPEED;
          const nextX = prev.x + dx * speed;
          const nextY = prev.y + dy * speed;

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
          isReturningFromToiletRef.current = false;
          return prev;
        }
      });

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [targetPosition, mousePos, isFollowing, petState, facingRight, toiletPhase]);

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
    // Prevent interaction if busy with special animations
    if (petState !== PetState.IDLE && petState !== PetState.WALKING) return;

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

  if (petState === PetState.TOILET_BREAK) return null; // Hide pet during toilet break

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

      <SpriteAnimator 
        state={petState} 
        facingRight={facingRight} 
        config={PET_CONFIG}
        startFrame={startFrame}
        endFrame={endFrame}
      />
    </div>
  );
};

export default MeowlPet;