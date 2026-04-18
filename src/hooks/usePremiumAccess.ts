import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { premiumService } from "../services/premiumService";
import { PremiumPlan } from "../data/premiumDTOs";

type PremiumPlanType = PremiumPlan["planType"];

type PremiumAccessState = {
  hasPremiumAccess: boolean;
  hasStudentTierAccess: boolean;
  hasMentorProAccess: boolean;
  isLoading: boolean;
  planName: string | null;
  planType: PremiumPlanType | null;
};

const INITIAL_STATE: PremiumAccessState = {
  hasPremiumAccess: false,
  hasStudentTierAccess: false,
  hasMentorProAccess: false,
  isLoading: true,
  planName: null,
  planType: null,
};

type ResolvedPremiumAccessState = Omit<PremiumAccessState, "isLoading">;

const ANONYMOUS_STATE: PremiumAccessState = {
  hasPremiumAccess: false,
  hasStudentTierAccess: false,
  hasMentorProAccess: false,
  isLoading: false,
  planName: null,
  planType: null,
};

const PREMIUM_CACHE_TTL_MS = 60_000;

let premiumAccessCache:
  | {
    fetchedAt: number;
    userId: number | null;
      value: ResolvedPremiumAccessState;
    }
  | null = null;
let premiumAccessRequest:
  | {
    userId: number | null;
    promise: Promise<ResolvedPremiumAccessState>;
  }
  | null = null;

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
  const planType = subscription?.plan?.planType ?? null;
  const isActivePaidSubscription = Boolean(
    subscription?.isActive &&
      subscription.status === "ACTIVE" &&
      planType &&
      planType !== "FREE_TIER",
  );
  const hasMentorProAccess = Boolean(
    isActivePaidSubscription &&
      (planType === "PREMIUM_PLUS" || planType === "RECRUITER_PRO"),
  );

  return {
    hasPremiumAccess: isActivePaidSubscription,
    hasStudentTierAccess: isActivePaidSubscription,
    hasMentorProAccess,
    planName: subscription?.plan?.displayName ?? subscription?.plan?.name ?? null,
    planType,
  };
};

const loadPremiumAccessState = async (userId: number | null): Promise<ResolvedPremiumAccessState> => {
  const cachedState = readPremiumAccessCache(userId);
  if (cachedState) {
    return cachedState;
  }

  if (premiumAccessRequest && premiumAccessRequest.userId === userId) {
    return premiumAccessRequest.promise;
  }

  const requestPromise = resolvePremiumAccessState()
    .then((resolvedState) => {
      premiumAccessCache = {
        fetchedAt: Date.now(),
        userId,
        value: resolvedState,
      };
      return resolvedState;
    })
    .finally(() => {
      if (premiumAccessRequest?.promise === requestPromise) {
        premiumAccessRequest = null;
      }
    });

  premiumAccessRequest = {
    userId,
    promise: requestPromise,
  };

  return requestPromise;
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

    setState({
      ...ANONYMOUS_STATE,
      isLoading: true,
    });

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
