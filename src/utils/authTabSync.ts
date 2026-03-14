import {
  clearAuthSession,
  getAccessToken,
  getActiveAuthStorageType,
  getRefreshToken,
  getStoredUserRaw,
  setAuthSession,
} from "./authStorage";

type SyncMessage =
  | {
      type: "REQUEST_SESSION";
      fromTabId: string;
      requestId: string;
    }
  | {
      type: "SESSION_PAYLOAD";
      fromTabId: string;
      requestId: string;
      payload: SessionPayload;
    }
  | {
      type: "LOGOUT";
      fromTabId: string;
    };

type AuthStorageType = "local" | "session";

type SessionPayload = {
  accessToken: string;
  refreshToken: string | null;
  userRaw: string;
  storageType: AuthStorageType;
};

const CHANNEL_NAME = "skillverse:auth-sync:v1";
const AUTH_LOGOUT_EVENT = "auth:logout";

export const AUTH_SESSION_SYNCED_EVENT = "auth:session-synced";
export const AUTH_REMOTE_LOGOUT_EVENT = "auth:remote-logout";

const tabId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

let channel: BroadcastChannel | null = null;
let initialized = false;
const pendingRequests = new Map<string, (hasSession: boolean) => void>();

const isBrowser = (): boolean => typeof window !== "undefined";

const supportsBroadcastChannel = (): boolean =>
  isBrowser() && typeof BroadcastChannel !== "undefined";

const postMessage = (message: SyncMessage): void => {
  if (!channel) return;
  channel.postMessage(message);
};

const decodeJwtExp = (token: string): number | null => {
  try {
    const payloadBase64 = token.split(".")[1];
    if (!payloadBase64) return null;
    const decoded = JSON.parse(
      atob(payloadBase64.replace(/-/g, "+").replace(/_/g, "/")),
    ) as { exp?: number };
    return typeof decoded.exp === "number" ? decoded.exp : null;
  } catch {
    return null;
  }
};

const isTokenExpired = (token: string): boolean => {
  const exp = decodeJwtExp(token);
  if (!exp) return false;
  return Date.now() >= exp * 1000;
};

const getCurrentSessionPayload = (): SessionPayload | null => {
  const accessToken = getAccessToken();
  const userRaw = getStoredUserRaw();

  if (!accessToken || !userRaw || isTokenExpired(accessToken)) {
    return null;
  }

  const storageType = getActiveAuthStorageType() ?? "session";
  const refreshToken = getRefreshToken();

  return {
    accessToken,
    refreshToken: refreshToken ?? null,
    userRaw,
    storageType,
  };
};

const applyRemoteSession = (payload: SessionPayload): boolean => {
  try {
    const user = JSON.parse(payload.userRaw);
    const rememberMe = payload.storageType === "local";
    setAuthSession(payload.accessToken, payload.refreshToken, user, rememberMe);
    window.dispatchEvent(new Event(AUTH_SESSION_SYNCED_EVENT));
    return true;
  } catch (error) {
    console.error("Failed to apply remote auth session:", error);
    return false;
  }
};

const handleMessage = (event: MessageEvent<SyncMessage>): void => {
  const message = event.data;
  if (!message || message.fromTabId === tabId) return;

  if (message.type === "REQUEST_SESSION") {
    const payload = getCurrentSessionPayload();
    if (!payload) return;

    postMessage({
      type: "SESSION_PAYLOAD",
      fromTabId: tabId,
      requestId: message.requestId,
      payload,
    });
    return;
  }

  if (message.type === "SESSION_PAYLOAD") {
    const resolver = pendingRequests.get(message.requestId);
    if (resolver) {
      pendingRequests.delete(message.requestId);
      resolver(true);
    }

    const currentToken = getAccessToken();
    const canApply = !currentToken || isTokenExpired(currentToken);
    if (canApply) {
      applyRemoteSession(message.payload);
    }
    return;
  }

  if (message.type === "LOGOUT") {
    clearAuthSession();
    window.dispatchEvent(new Event(AUTH_REMOTE_LOGOUT_EVENT));
    window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT));
  }
};

export const initAuthTabSync = (): (() => void) => {
  if (!supportsBroadcastChannel()) {
    return () => {};
  }

  if (initialized && channel) {
    return () => {};
  }

  channel = new BroadcastChannel(CHANNEL_NAME);
  channel.onmessage = handleMessage;
  initialized = true;

  return () => {
    if (!channel) return;
    channel.close();
    channel = null;
    initialized = false;
    pendingRequests.clear();
  };
};

export const requestSessionFromOtherTabs = async (
  timeoutMs = 700,
): Promise<boolean> => {
  if (!supportsBroadcastChannel()) return false;
  if (getAccessToken()) return true;
  if (!initialized || !channel) return false;

  const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  const waitForResponse = new Promise<boolean>((resolve) => {
    pendingRequests.set(requestId, resolve);
    window.setTimeout(() => {
      if (!pendingRequests.has(requestId)) return;
      pendingRequests.delete(requestId);
      resolve(false);
    }, timeoutMs);
  });

  postMessage({
    type: "REQUEST_SESSION",
    fromTabId: tabId,
    requestId,
  });

  return waitForResponse;
};

export const broadcastSessionToOtherTabs = (): void => {
  if (!initialized || !channel) return;
  const payload = getCurrentSessionPayload();
  if (!payload) return;

  const requestId = `push-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  postMessage({
    type: "SESSION_PAYLOAD",
    fromTabId: tabId,
    requestId,
    payload,
  });
};

export const broadcastLogoutToOtherTabs = (): void => {
  if (!initialized || !channel) return;
  postMessage({
    type: "LOGOUT",
    fromTabId: tabId,
  });
};
