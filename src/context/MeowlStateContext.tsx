import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { streakService } from "../services/streakService";
import authService from "../services/authService";

// Import special state images
import meowlLoseStreak from "../assets/streak/meowl-losestreak.png";
import meowlSleeping from "../assets/streak/meowl-1day.png";

/**
 * MeowlState - Determines which image to display based on user's activity
 * - 'active': User has checked in today and is actively using the app
 * - 'lose-streak': User has NOT checked in today (needs to điểm danh)
 * - 'sleeping': User hasn't interacted with Meowl for 1 hour
 */
export type MeowlState = "active" | "lose-streak" | "sleeping";

interface MeowlStateContextType {
  meowlState: MeowlState;
  hasCheckedInToday: boolean;
  lastInteractionTime: number;
  stateImage: string | null; // null means use skin image, otherwise use this override
  recordInteraction: () => void;
  refreshCheckInStatus: () => Promise<void>;
  markCheckedIn: () => void; // Immediately mark as checked in (for instant UI update)
  isAuthenticated: boolean;
  // Check-in success modal state
  showCheckInSuccessModal: boolean;
  checkInCoins: number;
  triggerCheckInSuccess: (coins: number) => void;
  closeCheckInSuccess: () => void;
}

const MeowlStateContext = createContext<MeowlStateContextType | undefined>(
  undefined,
);

const STORAGE_KEYS = {
  LAST_INTERACTION: "meowl-last-interaction",
};

// 1 hour in milliseconds
const SLEEP_TIMEOUT = 60 * 60 * 1000;

export const MeowlStateProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [hasCheckedInToday, setHasCheckedInToday] = useState<boolean>(true); // Assume true initially
  const [lastInteractionTime, setLastInteractionTime] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LAST_INTERACTION);
    return saved ? parseInt(saved, 10) : Date.now();
  });
  const [meowlState, setMeowlState] = useState<MeowlState>("active");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Check-in success modal state
  const [showCheckInSuccessModal, setShowCheckInSuccessModal] =
    useState<boolean>(false);
  const [checkInCoins, setCheckInCoins] = useState<number>(0);

  const triggerCheckInSuccess = useCallback((coins: number) => {
    setCheckInCoins(coins);
    setShowCheckInSuccessModal(true);
  }, []);

  const closeCheckInSuccess = useCallback(() => {
    setShowCheckInSuccessModal(false);
  }, []);

  // Check authentication status
  useEffect(() => {
    const checkAuth = () => {
      const authenticated = authService.isAuthenticated();
      setIsAuthenticated(authenticated);
    };
    checkAuth();

    // Listen for auth changes
    const interval = setInterval(checkAuth, 1000);
    return () => clearInterval(interval);
  }, []);

  // Check if user has checked in today
  const refreshCheckInStatus = useCallback(async () => {
    // Only check if authenticated
    if (!authService.isAuthenticated()) {
      setHasCheckedInToday(true); // Default to true if not logged in
      return;
    }
    try {
      const status = await streakService.hasCheckedInToday();
      setHasCheckedInToday(status);
    } catch (error) {
      console.error("Failed to check attendance status:", error);
      // On error, don't change state to avoid showing wrong image
    }
  }, []);

  // Immediately mark as checked in (for instant UI update after check-in)
  const markCheckedIn = useCallback(() => {
    setHasCheckedInToday(true);
    recordInteraction(); // Also record interaction to unfreeze
  }, []);

  // Record user interaction with Meowl
  const recordInteraction = useCallback(() => {
    const now = Date.now();
    setLastInteractionTime(now);
    localStorage.setItem(STORAGE_KEYS.LAST_INTERACTION, now.toString());
  }, []);

  // Initial check on mount
  useEffect(() => {
    refreshCheckInStatus();

    // Set up periodic check (every 5 minutes)
    const checkInterval = setInterval(
      () => {
        refreshCheckInStatus();
      },
      5 * 60 * 1000,
    );

    return () => clearInterval(checkInterval);
  }, [refreshCheckInStatus]);

  // Calculate Meowl state based on check-in and interaction
  useEffect(() => {
    const calculateState = () => {
      const now = Date.now();
      const timeSinceLastInteraction = now - lastInteractionTime;

      // If not authenticated, always show active (default) state
      if (!isAuthenticated) {
        setMeowlState("active");
        return;
      }

      // Priority 1: If user hasn't checked in today, show lose-streak (frozen)
      if (!hasCheckedInToday) {
        setMeowlState("lose-streak");
        return;
      }

      // Priority 2: If no interaction for 1 hour, show sleeping
      if (timeSinceLastInteraction >= SLEEP_TIMEOUT) {
        setMeowlState("sleeping");
        return;
      }

      // Otherwise, Meowl is active
      setMeowlState("active");
    };

    calculateState();

    // Check state every minute for sleeping timeout
    const stateInterval = setInterval(calculateState, 60 * 1000);

    return () => clearInterval(stateInterval);
  }, [hasCheckedInToday, lastInteractionTime, isAuthenticated]);

  // Determine which image to use (null means use the skin image from MeowlSkinContext)
  const getStateImage = (): string | null => {
    switch (meowlState) {
      case "lose-streak":
        return meowlLoseStreak;
      case "sleeping":
        return meowlSleeping;
      case "active":
      default:
        return null; // Use normal skin image
    }
  };

  return (
    <MeowlStateContext.Provider
      value={{
        meowlState,
        hasCheckedInToday,
        lastInteractionTime,
        stateImage: getStateImage(),
        recordInteraction,
        refreshCheckInStatus,
        markCheckedIn,
        isAuthenticated,
        showCheckInSuccessModal,
        checkInCoins,
        triggerCheckInSuccess,
        closeCheckInSuccess,
      }}
    >
      {children}
    </MeowlStateContext.Provider>
  );
};

export const useMeowlState = (): MeowlStateContextType => {
  const context = useContext(MeowlStateContext);
  if (!context) {
    throw new Error("useMeowlState must be used within a MeowlStateProvider");
  }
  return context;
};

export { meowlLoseStreak, meowlSleeping };
