import { useState, useCallback } from 'react';

export type ElevatorState = 'idle' | 'moving' | 'accessGranted' | 'exiting';

interface UseElevatorStateReturn {
  state: ElevatorState;
  userName: string;
  setUserName: (name: string) => void;
  startMoving: () => void;
  reset: () => void;
  triggerLoginSuccess: (name?: string) => Promise<void>;
}

export const useElevatorState = (): UseElevatorStateReturn => {
  const [state, setState] = useState<ElevatorState>('idle');
  const [userName, setUserName] = useState<string>('Commander');

  const startMoving = useCallback(() => {
    setState('moving');
  }, []);

  const reset = useCallback(() => {
    setState('idle');
    setUserName('Commander');
  }, []);

  // Simplified animation sequence:
  // 1. Hide form, status changes to ARRIVED (green)
  // 2. Show ACCESS GRANTED flashing 2 times
  // 3. Swipe up entire layout
  const triggerLoginSuccess = useCallback(async (name?: string): Promise<void> => {
    console.log('[Elevator] triggerLoginSuccess called with name:', name);

    if (name) {
      setUserName(name);
    }

    // Phase 1: Show ACCESS GRANTED with flash effect (1.5s)
    console.log('[Elevator] Setting state to accessGranted');
    setState('accessGranted');
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Phase 2: Trigger exit animation (swipe up)
    console.log('[Elevator] Setting state to exiting');
    setState('exiting');
    await new Promise(resolve => setTimeout(resolve, 800));

    console.log('[Elevator] Animation complete');
  }, []);

  return {
    state,
    userName,
    setUserName,
    startMoving,
    reset,
    triggerLoginSuccess,
  };
};

export default useElevatorState;