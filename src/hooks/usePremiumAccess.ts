import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { premiumService } from "../services/premiumService";

type PremiumAccessState = {
  hasPremiumAccess: boolean;
  isLoading: boolean;
  planName: string | null;
};

const INITIAL_STATE: PremiumAccessState = {
  hasPremiumAccess: false,
  isLoading: true,
  planName: null,
};

type ResolvedPremiumAccessState = Omit<PremiumAccessState, "isLoading">;

const ANONYMOUS_STATE: PremiumAccessState = {
  hasPremiumAccess: false,
  isLoading: false,
  planName: null,
};

const PREMIUM_CACHE_TTL_MS = 60_000;

let premiumAccessCache:
  | {
    fetchedAt: number;
    userId: number | null;
      value: ResolvedPremiumAccessState;
    }
  | null = null;
let premiumAccessRequest: Promise<ResolvedPremiumAccessState> | null = null;

const readPremiumAccessCache = (userId: number | null): ResolvedPremiumAccessState | null => {
  if (!premiumAccessCache) {
    return null;
  }

  if (premiumAccessCache.userId !== userId) {
    premiumAccessCache = null;
    return null;
  }

  if (Date.now() - premiumAccessCache.fetchedAt > PREMIUM_CACHE_TTL_MS) {
    premiumAccessCache = null;
    return null;
  }

  return premiumAccessCache.value;
};

const resolvePremiumAccessState = async (): Promise<ResolvedPremiumAccessState> => {
  const subscription = await premiumService.getCurrentSubscription();
  const hasPremiumAccess = Boolean(
    subscription?.isActive &&
      subscription.status === "ACTIVE" &&
      subscription.plan?.planType !== "FREE_TIER",
  );

  return {
    hasPremiumAccess,
    planName: subscription?.plan?.displayName ?? subscription?.plan?.name ?? null,
  };
};

const loadPremiumAccessState = async (userId: number | null): Promise<ResolvedPremiumAccessState> => {
  const cachedState = readPremiumAccessCache(userId);
  if (cachedState) {
    return cachedState;
  }

  if (!premiumAccessRequest) {
    premiumAccessRequest = resolvePremiumAccessState()
      .then((resolvedState) => {
        premiumAccessCache = {
          fetchedAt: Date.now(),
          userId,
          value: resolvedState,
        };
        return resolvedState;
      })
      .finally(() => {
        premiumAccessRequest = null;
      });
  }

  return premiumAccessRequest;
};

export const invalidatePremiumAccessCache = (): void => {
  premiumAccessCache = null;
};

export const usePremiumAccess = (): PremiumAccessState => {
  const { isAuthenticated, user } = useAuth();
  const [state, setState] = useState<PremiumAccessState>(INITIAL_STATE);

  useEffect(() => {
    let cancelled = false;

    if (!isAuthenticated) {
      setState(ANONYMOUS_STATE);
      return;
    }

    const cachedState = readPremiumAccessCache(user?.id ?? null);
    if (cachedState) {
      setState({
        ...cachedState,
        isLoading: false,
      });
      return;
    }

    setState((previous) => ({
      ...previous,
      isLoading: true,
    }));

    const loadPremiumAccess = async () => {
      try {
        const resolvedState = await loadPremiumAccessState(user?.id ?? null);
        if (!cancelled) {
          setState({
            ...resolvedState,
            isLoading: false,
          });
        }
      } catch (error) {
        console.error("Failed to load premium access state:", error);
        if (!cancelled) {
          setState(ANONYMOUS_STATE);
        }
      }
    };

    void loadPremiumAccess();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?.id]);

  return state;
};

export default usePremiumAccess;
