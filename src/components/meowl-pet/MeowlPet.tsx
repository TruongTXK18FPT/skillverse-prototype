import React, { useState, useEffect, useRef } from 'react';
import './MeowlPet.css';
import { SpriteAnimator } from './SpriteAnimator';
import { PetState, Position } from './types';
import { PET_CONFIG, MOVEMENT_SPEED, STOP_DISTANCE, INTERACTION_DURATION, SLEEP_TIMEOUT, SOUNDS, WALK_BOB_AMPLITUDE, WALK_BOB_SPEED } from './constants';
import PetContextMenu from './PetContextMenu';

interface MeowlPetProps {
  targetPosition?: Position;
  isExiting?: boolean;
  onExitComplete?: () => void;
}

const MEOWL_PET_AUDIO_ENABLED = false;

const playOneShotSound = (
  src?: string,
  volume = 0.5,
): HTMLAudioElement | null => {
  if (!MEOWL_PET_AUDIO_ENABLED || !src) return null;

  const audio = new Audio(src);
  audio.volume = volume;
  audio.play().catch(console.error);
  return audio;
};

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
  const [customSequence, setCustomSequence] = useState<number[] | undefined>(undefined);
  const [eatingPhase, setEatingPhase] = useState<number>(0); // 0: none, 1: chewing, 2: swallowing
  const [toiletPhase, setToiletPhase] = useState<number>(0); // 0: running, 1: hidden
  const toiletTargetRef = useRef<Position>({ x: 0, y: 0 });
  const toiletTimerRef = useRef<number>(0);
  const isReturningFromToiletRef = useRef<boolean>(false);
  const isJobPanicRef = useRef<boolean>(false);
  const isRecoveringFromPanicRef = useRef<boolean>(false);

  // Dragging Refs
  const isDragging = useRef<boolean>(false);
  const dragOffset = useRef<Position>({ x: 0, y: 0 });
  const dragStartTimeRef = useRef<number>(0);
  
  // Interaction Refs
  const lastInteractionTime = useRef<number>(Date.now());
  
  // Audio ref for sound effects
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Mouse tracking for auto-follow
  const [mousePos, setMousePos] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 });

  // New Features State
  const [showMenu, setShowMenu] = useState(false);
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const maxXp = 100;
  const [isLocked, setIsLocked] = useState(false); // Replaces isFollowing logic partially

  // Reset animation frames when state changes
  useEffect(() => {
    setStartFrame(undefined);
    setEndFrame(undefined);
    setCustomSequence(undefined);
  }, [petState]);

  // Job Page Panic Logic
  useEffect(() => {
    const checkJobPage = () => {
      const isJobPage = window.location.pathname.includes('/jobs');
      
      if (isJobPage && !isJobPanicRef.current) {
        // Enter Panic Mode
        isJobPanicRef.current = true;
        setPetState(PetState.REALIZE);
        setIsFollowing(false); // Stop following mouse
        
        // Realize for 3.2s (slower) then flee
        setTimeout(() => {
          setPetState(PetState.FLEE_CRY);
          playOneShotSound(SOUNDS.cry);
        }, 2000);
      } else if (!isJobPage && isJobPanicRef.current) {
        // Exit Panic Mode
        isJobPanicRef.current = false;
        setPetState(PetState.OK_FOR_NOW);
        
        // Relief for 3.2s (slower) then back to normal
        setTimeout(() => {
          setPetState(PetState.WALKING);
          setIsFollowing(true);
          isRecoveringFromPanicRef.current = true;
          
          // Reset speed after a while
          setTimeout(() => {
            isRecoveringFromPanicRef.current = false;
            setPetState(PetState.IDLE);
          }, 3000);
        }, 3200);
      }
    };

    // Check on mount and URL changes
    checkJobPage();
    
    // Listen for popstate (browser back/forward)
    window.addEventListener('popstate', checkJobPage);
    
    // Hacky way to detect pushState changes (SPA navigation)
    const originalPushState = history.pushState;
    history.pushState = function(...args) {
      originalPushState.apply(this, args);
      checkJobPage();
    };
    
    const originalReplaceState = history.replaceState;
    history.replaceState = function(...args) {
      originalReplaceState.apply(this, args);
      checkJobPage();
    };

    return () => {
      window.removeEventListener('popstate', checkJobPage);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, []);

  // Audio Fix: Play sound when HAPPY state is active
  useEffect(() => {
    if (petState === PetState.HAPPY) {
      playInteractSound();
    } else {
      stopInteractSound();
    }
  }, [petState]);

  // Coffee Sequence Logic
  useEffect(() => {
    if (petState === PetState.COFFEE_1) {
      // Pull out coffee (Sheet 1)
      const timer = setTimeout(() => {
        setPetState(PetState.COFFEE_2);
      }, PET_CONFIG.animationSpeed * 16);
      return () => clearTimeout(timer);
    } else if (petState === PetState.COFFEE_2) {
      // Drink (Sheet 2)
      const timer = setTimeout(() => {
        setPetState(PetState.COFFEE_3);
      }, 1600);
      return () => clearTimeout(timer);
    } else if (petState === PetState.COFFEE_3) {
      // High (Sheet 3)
      const timer = setTimeout(() => {
        setPetState(PetState.COFFEE_4);
      }, 1600);
      return () => clearTimeout(timer);
    } else if (petState === PetState.COFFEE_4) {
      // Smoke (Sheet 4) - Custom Animation Sequence
      // Loop start (0,1) 4 times for "overload"
      // Play middle (2-11)
      // Loop end (12-15) 3 times for "exhaustion"
      const sequence = [
        0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 
        2, 3, 2, 3, 2, 3, 
        4, 5, 4, 5, 
        6, 7, 8, 7, 8, 7, 8, 7, 8, 9, 10, 11, 
        12, 13, 12, 13, 12, 13, 12, 13, 
        12, 13, 12, 13, 12, 13, 12, 13,
        12, 13, 12, 13, 12, 13, 12, 13, 14, 15
      ];
      setCustomSequence(sequence);
      
      const duration = sequence.length * PET_CONFIG.animationSpeed;
      
      const timer = setTimeout(() => {
        setPetState(PetState.COFFEE_5);
      }, duration);
      return () => clearTimeout(timer);
    } else if (petState === PetState.COFFEE_5) {
      // Recover (Sheet 5)
      const timer = setTimeout(() => {
        setPetState(PetState.IDLE);
      }, PET_CONFIG.animationSpeed * 16);
      return () => clearTimeout(timer);
    }
  }, [petState]);

  // Handle Intro Animation
  useEffect(() => {
    if (petState === PetState.INTRO) {
      playOneShotSound(SOUNDS.intro);

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

      playOneShotSound(SOUNDS.outro);

      const timer = setTimeout(() => {
        if (onExitComplete) onExitComplete();
      }, PET_CONFIG.animationSpeed * (PET_CONFIG.rows * PET_CONFIG.cols));
      return () => clearTimeout(timer);
    }
  }, [isExiting, onExitComplete]);

  // Handle Hiding Cry Logic (Stay in corner)
  useEffect(() => {
    if (petState === PetState.HIDING_CRY) {
      // Default loop: First 2 rows (Frames 0-7)
      if (startFrame === undefined) {
        setStartFrame(0);
        setEndFrame(7);
      }
    }
  }, [petState, startFrame]);

  // Handle Angry Sound
  useEffect(() => {
    let angryAudio: HTMLAudioElement | null = null;

    if (petState === PetState.ANGRY) {
      angryAudio = playOneShotSound(SOUNDS.angry);
    }

    return () => {
      if (angryAudio) {
        angryAudio.pause();
        angryAudio.currentTime = 0;
      }
    };
  }, [petState]);

  // Handle Sleep Logic
  useEffect(() => {
    const checkSleep = setInterval(() => {
      if (showMenu) return; // Don't sleep if menu is open

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
  }, [petState, showMenu]);

  // Random Idle Behavior (Every 15s)
  useEffect(() => {
    if (petState !== PetState.IDLE || showMenu) return; // Don't do random stuff if menu is open

    const randomBehavior = setInterval(() => {
      if (petState !== PetState.IDLE || showMenu) return;
      
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
      playOneShotSound(SOUNDS.flush);

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
    if (!MEOWL_PET_AUDIO_ENABLED) {
      return;
    }

    audioRef.current = new Audio(SOUNDS.interact);
    audioRef.current.preload = 'auto';
    audioRef.current.loop = true; // Loop sound while hovering

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []);

  // Play sound function
  const playInteractSound = () => {
    if (!MEOWL_PET_AUDIO_ENABLED) return;

    if (audioRef.current) {
      audioRef.current.currentTime = 0; // Reset to start
      audioRef.current.play().catch(console.error); // Handle autoplay restrictions
    }
  };

  const stopInteractSound = () => {
    if (!MEOWL_PET_AUDIO_ENABLED) return;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  // Track mouse position globally
  const hasMouseMoved = useRef<boolean>(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      hasMouseMoved.current = true;
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Physics Loop
  useEffect(() => {
    let animationFrameId: number;
    const currentTarget = targetPosition || mousePos;

    const loop = () => {
      // Force IDLE if menu is open
      if (showMenu) {
        if (petState !== PetState.IDLE) setPetState(PetState.IDLE);
        setBobOffset(0);
        animationFrameId = requestAnimationFrame(loop);
        return;
      }

      // States where movement is disabled
      if (
        petState === PetState.DRAGGING || 
        petState === PetState.DRAG_CRY ||
        petState === PetState.ANGRY ||
        petState === PetState.HAPPY || 
        petState === PetState.EATING ||
        petState === PetState.INTRO ||
        petState === PetState.OUTRO || 
        petState === PetState.SLEEP || 
        petState === PetState.WAKEUP ||
        petState === PetState.GROOMING ||
        petState === PetState.TAKE_PIZZA ||
        petState === PetState.FINISH_PIZZA ||
        petState === PetState.STOMACH_ACHE ||
        petState === PetState.TOILET_BREAK ||
        petState === PetState.REALIZE ||
        petState === PetState.OK_FOR_NOW ||
        petState === PetState.COFFEE_1 ||
        petState === PetState.COFFEE_2 ||
        petState === PetState.COFFEE_3 ||
        petState === PetState.COFFEE_4 ||
        petState === PetState.COFFEE_5
      ) {
        setBobOffset(0);
        animationFrameId = requestAnimationFrame(loop);
        return;
      }

      // Handle Flee Cry Logic (Run to bottom left)
      if (petState === PetState.FLEE_CRY) {
        const targetX = 20;
        const targetY = window.innerHeight - PET_CONFIG.height - 20;
        
        setPosition((prev) => {
          const dx = targetX - prev.x;
          const dy = targetY - prev.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 10) {
            // Arrived at corner
            setPetState(PetState.HIDING_CRY);
            setFacingRight(true); // Face right to look at screen
            return prev;
          }

          // Run fast
          const speed = MOVEMENT_SPEED * 3;
          const nextX = prev.x + dx * speed;
          const nextY = prev.y + dy * speed;

          if (dx > 0 && !facingRight) setFacingRight(true);
          if (dx < 0 && facingRight) setFacingRight(false);

          return { x: nextX, y: nextY };
        });
        
        animationFrameId = requestAnimationFrame(loop);
        return;
      }

      // Handle Hiding Cry Logic (Stay in corner)
      if (petState === PetState.HIDING_CRY) {
        // Ensure it stays in corner even if window resizes
        setPosition({
          x: 20,
          y: window.innerHeight - PET_CONFIG.height - 20
        });
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

        // Override target if returning from toilet
        let activeTarget = currentTarget;
        if (isReturningFromToiletRef.current) {
          activeTarget = { 
            x: window.innerWidth / 2, 
            y: window.innerHeight / 2 
          };
        }

        const dx = activeTarget.x - currentCenterX;
        const dy = activeTarget.y - currentCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > STOP_DISTANCE) {
          // Lerp movement: Move a fraction of the distance for that "chase" effect
          const isSlow = isRecoveringFromPanicRef.current; // Removed isReturningFromToiletRef
          const speed = isSlow ? MOVEMENT_SPEED * 0.2 : MOVEMENT_SPEED;
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
          
          // Clear toilet return flag immediately upon arrival
          if (isReturningFromToiletRef.current) {
            isReturningFromToiletRef.current = false;
          }

          // Only clear slow flags if we have actually moved the mouse (meaning we know where to go and we arrived there)
          // OR if we are following a fixed target position
          if (hasMouseMoved.current || targetPosition) {
            isRecoveringFromPanicRef.current = false;
          }
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

    // Clear hover timer to prevent Happy state triggering while dragging
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }

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
    dragStartTimeRef.current = Date.now();
    
    // Use special drag sprite if in panic mode
    if (isJobPanicRef.current) {
      setPetState(PetState.DRAG_CRY);
    } else {
      setPetState(PetState.DRAGGING);
    }
    
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
    
    // Check for long drag (Angry) - Only if not in panic mode
    if (!isJobPanicRef.current && petState !== PetState.ANGRY) {
      if (Date.now() - dragStartTimeRef.current > 3000) { // 3 seconds threshold
        setPetState(PetState.ANGRY);
      }
    }

    setPosition({
      x: e.clientX - dragOffset.current.x,
      y: e.clientY - dragOffset.current.y
    });
  };

  const handleGlobalMouseUp = () => {
    isDragging.current = false;
    
    if (isJobPanicRef.current) {
      // If dropped in panic mode, flee back to corner
      setPetState(PetState.FLEE_CRY);
      playOneShotSound(SOUNDS.cry);
    } else {
      // If was angry, stay angry for a bit
      if (petState === PetState.ANGRY) {
        setTimeout(() => setPetState(PetState.IDLE), 2000);
      } else {
        setPetState(PetState.IDLE);
      }
    }
    
    document.removeEventListener('mousemove', handleGlobalMouseMove);
    document.removeEventListener('mouseup', handleGlobalMouseUp);
  };

  const handleMouseEnter = () => {
    if (isDragging.current || showMenu) return; // Don't interact if menu is open
    
    // Special hover for Hiding Cry
    if (petState === PetState.HIDING_CRY) {
      // Loop last 2 rows (Frames 8-15)
      setStartFrame(8);
      setEndFrame(15);
      return;
    }

    // Prevent interaction if busy with special animations
    if (petState !== PetState.IDLE && petState !== PetState.WALKING && petState !== PetState.ANGRY) return;

    updateInteraction();
    
    // Start 3s timer for Happy state (only if not angry)
    if (petState !== PetState.ANGRY) {
      hoverTimerRef.current = setTimeout(() => {
        setPetState(PetState.HAPPY);
        // Sound is handled by useEffect now
      }, 3000);
    }
  };

  const handleMouseLeave = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    
    if (petState === PetState.HIDING_CRY) {
      // Reset to first 2 rows (Frames 0-7)
      setStartFrame(0);
      setEndFrame(7);
      return;
    }
    
    if (petState === PetState.HAPPY) {
      setPetState(PetState.IDLE);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowMenu(true);
  };

  const handleMenuClose = () => {
    setShowMenu(false);
  };

  const handleUseItem = (itemId: string) => {
    if (itemId === 'coffee') {
      setPetState(PetState.COFFEE_1);
    }
  };

  const handleToggleLock = () => {
    setIsLocked(!isLocked);
  };

  // Manage Following State based on Menu and Lock
  useEffect(() => {
    if (showMenu) {
      setIsFollowing(false);
    } else {
      // If menu is closed, follow only if not locked
      setIsFollowing(!isLocked);
    }
  }, [showMenu, isLocked]);

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
      {showMenu && (
        <PetContextMenu 
          petPosition={{
            x: position.x,
            y: position.y + bobOffset, // Include bob offset for accurate line connection
            width: PET_CONFIG.width,
            height: PET_CONFIG.height
          }}
          onClose={handleMenuClose}
          onToggleLock={handleToggleLock}
          isLocked={isLocked}
          onUseItem={handleUseItem}
          level={level}
          xp={xp}
          maxXp={maxXp}
        />
      )}

      <SpriteAnimator 
        state={petState} 
        facingRight={facingRight} 
        config={PET_CONFIG}
        startFrame={startFrame}
        endFrame={endFrame}
        customSequence={customSequence}
        speedMultiplier={petState === PetState.OK_FOR_NOW || petState === PetState.REALIZE ? 0.5 : 1}
        loop={
          petState !== PetState.INTRO && 
          petState !== PetState.OUTRO &&
          petState !== PetState.COFFEE_1 &&
          petState !== PetState.COFFEE_5
        }
      />
    </div>
  );
};

export default MeowlPet;