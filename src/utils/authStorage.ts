const AUTH_KEYS = ["accessToken", "refreshToken", "user", "deviceSessionId"] as const;

type AuthKey = (typeof AUTH_KEYS)[number];
type AuthStorage = "local" | "session";

const isBrowser = (): boolean =>
  typeof window !== "undefined" &&
  typeof window.localStorage !== "undefined" &&
  typeof window.sessionStorage !== "undefined";

const hasAuthData = (storage: Storage): boolean =>
  AUTH_KEYS.some((key) => storage.getItem(key) !== null);

const getStorageByType = (storageType: AuthStorage): Storage => {
  return storageType === "local" ? window.localStorage : window.sessionStorage;
};

export const getActiveAuthStorageType = (): AuthStorage | null => {
  if (!isBrowser()) return null;
  if (hasAuthData(window.sessionStorage)) return "session";
  if (hasAuthData(window.localStorage)) return "local";
  return null;
};

const getActiveAuthStorage = (): Storage | null => {
  const activeType = getActiveAuthStorageType();
  return activeType ? getStorageByType(activeType) : null;
};

export const getAuthItem = (key: AuthKey): string | null => {
  if (!isBrowser()) return null;
  return (
    window.sessionStorage.getItem(key) ?? window.localStorage.getItem(key)
  );
};

export const getAccessToken = (): string | null => getAuthItem("accessToken");

export const getRefreshToken = (): string | null => getAuthItem("refreshToken");

export const getStoredUserRaw = (): string | null => getAuthItem("user");

export const setAuthSession = (
  accessToken: string,
  refreshToken: string | null | undefined,
  user: unknown,
  rememberMe: boolean,
): void => {
  if (!isBrowser()) return;

  clearAuthSession();

  const storage = rememberMe ? window.localStorage : window.sessionStorage;
  storage.setItem("accessToken", accessToken);
  if (refreshToken) {
    storage.setItem("refreshToken", refreshToken);
  }
  storage.setItem("user", JSON.stringify(user));
};

export const updateAuthSession = (
  accessToken: string,
  refreshToken: string | null | undefined,
  user?: unknown,
): void => {
  if (!isBrowser()) return;

  const storage = getActiveAuthStorage() ?? window.localStorage;
  const preservedUser = user ?? getStoredUserRaw();

  clearAuthSession();

  storage.setItem("accessToken", accessToken);
  if (refreshToken) {
    storage.setItem("refreshToken", refreshToken);
  }
  if (preservedUser !== undefined && preservedUser !== null) {
    storage.setItem(
      "user",
      typeof preservedUser === "string"
        ? preservedUser
        : JSON.stringify(preservedUser),
    );
  }
};

export const updateStoredUser = (user: unknown): void => {
  if (!isBrowser()) return;

  const storage = getActiveAuthStorage() ?? window.localStorage;
  storage.setItem("user", JSON.stringify(user));
};

export const clearAuthSession = (): void => {
  if (!isBrowser()) return;

  AUTH_KEYS.forEach((key) => {
    window.localStorage.removeItem(key);
    window.sessionStorage.removeItem(key);
  });
};

export const getDeviceSessionId = (): string | null => {
  if (!isBrowser()) return null;
  return (
    window.sessionStorage.getItem("deviceSessionId") ??
    window.localStorage.getItem("deviceSessionId")
  );
};

export const setDeviceSessionId = (
  sessionId: string,
  rememberMe: boolean,
): void => {
  if (!isBrowser()) return;
  const storage = rememberMe ? window.localStorage : window.sessionStorage;
  storage.setItem("deviceSessionId", sessionId);
};

export const clearDeviceSessionId = (): void => {
  if (!isBrowser()) return;
  window.localStorage.removeItem("deviceSessionId");
  window.sessionStorage.removeItem("deviceSessionId");
};
