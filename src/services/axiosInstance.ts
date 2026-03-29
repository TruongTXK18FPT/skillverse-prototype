import axios, {
  InternalAxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from "axios";
import {
  clearAuthSession,
  getAccessToken,
  getRefreshToken,
  updateAuthSession,
} from "../utils/authStorage";
import {
  broadcastLogoutToOtherTabs,
  broadcastSessionToOtherTabs,
} from "../utils/authTabSync";

// Determine baseURL based on environment

const isLocal =
  typeof window !== "undefined" && location.hostname === "localhost";
let RAW_BASE =
  import.meta.env.VITE_BACKEND_URL ??
  (isLocal ? "http://localhost:8080/api" : "/api");

// Ensure base ends with /api (backend is under /api)
if (!/\/api\/?$/i.test(RAW_BASE)) {
  RAW_BASE = `${RAW_BASE.replace(/\/+$/, "")}/api`;
}

// Bỏ dấu "/" cuối để tránh "//"
const baseURL = RAW_BASE.replace(/\/+$/, "");

/**
 * ✅ AUTOMATIC JWT TOKEN REFRESH MECHANISM
 *
 * How it works:
 * 1. When any API call returns 401 (Unauthorized), interceptor catches it
 * 2. Checks if token refresh is already in progress (prevent race condition)
 * 3. If not, calls /auth/refresh endpoint with refreshToken
 * 4. Backend validates refreshToken and returns new accessToken + refreshToken
 * 5. Updates localStorage with new tokens
 * 6. Retries original failed request with new accessToken
 * 7. Processes queued requests that failed during refresh
 *
 * Token Flow:
 * - Google Login: Frontend gets Google access_token → Backend validates → Returns JWT + refresh token
 * - JWT Token: Used for all API calls (Authorization: Bearer <token>)
 * - Refresh Token: Stored in localStorage, used to get new JWT when expired
 * - Google access_token: ONLY used once during login, NOT stored
 *
 * Benefits:
 * - Seamless user experience (no forced logout on token expiration)
 * - Handles concurrent requests during refresh (queuing mechanism)
 * - Works for both LOCAL and GOOGLE users (unified JWT approach)
 *
 * Security:
 * - Refresh token has longer expiry (24 hours default)
 * - If refresh fails → Force logout and redirect to /login
 * - Each refresh generates new tokens (rotation)
 */

export const AUTH_LOGOUT_EVENT = "auth:logout";

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const hasActiveSession = (): boolean =>
  Boolean(getAccessToken() || getRefreshToken());

// Decode JWT payload safely without external deps
const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(payload)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
};

const getTokenExpiry = (token: string): number | null => {
  const payload = decodeJwtPayload(token);
  const exp =
    payload && typeof (payload as any).exp === "number"
      ? (payload as any).exp
      : null;
  return exp;
};

const isTokenExpiringSoon = (token: string, leewaySeconds = 120): boolean => {
  const exp = getTokenExpiry(token);
  if (!exp) return false;
  const nowSec = Math.floor(Date.now() / 1000);
  return exp - nowSec <= leewaySeconds;
};

// Centralized refresh call reused by both request- and response-interceptors
const performRefresh = async (): Promise<string> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error("No refresh token");
  const response = await axios.post(`${baseURL}/auth/refresh`, {
    refreshToken,
  });
  const {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    user: newUser,
  } = response.data;
  updateAuthSession(newAccessToken, newRefreshToken, newUser);
  broadcastSessionToOtherTabs();
  return newAccessToken as string;
};

export const API_BASE_URL = baseURL;

export const axiosInstance = axios.create({
  baseURL,
  timeout: 1440000, // 240 seconds for AI requests (roadmap generation, chatbot)
  // Do NOT set a global Content-Type: axios will set correct headers per body
  // For JSON requests, axios uses application/json automatically
  // For FormData (multipart), axios sets boundary headers automatically
  headers: {},
});

// Nếu baseURL đã kết thúc bằng "/api" mà URL lại bắt đầu bằng "/api", cắt bớt một cái
axiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const baseEndsWithApi = /\/api$/i.test(baseURL);
  const url = config.url || "";

  if (baseEndsWithApi && url.startsWith("/api/")) {
    config.url = url.replace(/^\/api/, ""); // "/api/auth" -> "/auth"
  }
  // Chống "//" (trừ "http://")
  if (config.url) {
    config.url = config.url.replace(/([^:]\/)\/+/g, "$1");
  }

  // Ensure correct Content-Type for FormData uploads (e.g., STT)
  // If the request body is FormData, let axios set multipart boundary automatically
  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    if (config.headers) {
      delete (config.headers as any)["Content-Type"];
    }
  }
  return config;
});

// Public endpoints (❌ bỏ tiền tố /api vì đã có trong baseURL)
const PUBLIC_ENDPOINTS = [
  "/auth/register",
  "/auth/login",
  "/auth/google", // ✅ Google OAuth login endpoint
  "/auth/refresh",
  "/auth/verify",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/verify-email",
  "/auth/resend-verification",
  "/auth/resend-otp",
  "/auth/complete-profile",
  "/users/register",
  "/users/verify-email",
  "/users/resend-otp",
  "/mentors/register",
  "/business/register",
  "/v1/meowl/chat", // Meowl chat endpoint
  "/v1/meowl/reminders", // Meowl reminders
  "/v1/meowl/notifications", // Meowl notifications
  "/v1/meowl/health", // Meowl health check
  // NOTE: Keep premium plan endpoints out of this list so authenticated users
  // still send JWT and backend can role-filter correctly (USER -> LEARNER).
  // Guests without token can still call these endpoints normally.
  "/jobs/public", // Public jobs listing
  "/short-term-jobs/public", // Public short-term jobs listing
  "/short-term-jobs/search", // Public short-term job search
  "/job-reviews/user", // Public user rating summary
  "/job-reviews/public", // Public job reviews
  "/portfolio/public", // Public portfolio listing/details
  "/portfolio/profile/slug", // Public portfolio by slug
  "/certificates/verify", // Public certificate verification
  "/courses", // Public course listing and details
  "/v1/expert-fields", // Public expert field catalog
  "/gamification/leaderboard", // Public gamification leaderboard
  "/gamification/badges/definitions", // Public badge definitions
];

// Check if the URL matches any public endpoint
const isPublicEndpoint = (url: string, method?: string): boolean => {
  // Normalize URL by removing /api prefix if present
  const normalizedUrl = url.replace(/^\/api/, "");
  const pathOnly = normalizedUrl.split("?")[0];

  // ✅ Admin course endpoints - ALWAYS require authentication
  const adminCourseEndpoints = [
    "/courses/pending",
    "/courses/approve",
    "/courses/reject",
  ];

  if (
    adminCourseEndpoints.some((adminPath) => normalizedUrl.includes(adminPath))
  ) {
    return false; // Require authentication
  }

  // Community posts: Public GET only
  if (normalizedUrl.startsWith("/posts")) {
    if (method && method.toUpperCase() !== "GET") {
      return false;
    }
    return true;
  }

  // Short-term job detail: Public GET /short-term-jobs/{id}
  if (/^\/short-term-jobs\/\d+$/.test(normalizedUrl)) {
    if (method && method.toUpperCase() === "GET") {
      return true;
    }
  }

  // Public portfolio by numeric user id: GET /portfolio/profile/{userId}
  if (/^\/portfolio\/profile\/\d+$/.test(normalizedUrl)) {
    if (method && method.toUpperCase() === "GET") {
      return true;
    }
  }

  return PUBLIC_ENDPOINTS.some((endpoint) => {
    // Special handling for /courses: Only GET requests to list/detail are public
    if (endpoint === "/courses") {
      // POST/PUT/DELETE always require auth
      if (method && method.toUpperCase() !== "GET") {
        return false;
      }
      // Only GET /courses and GET /courses/{id} are public.
      // Nested protected routes such as /courses/{id}/revisions must NOT be public.
      return (
        pathOnly === "/courses" ||
        /^\/courses\/\d+$/.test(pathOnly)
      );
    }

    // Use startsWith for exact path matching (more secure)
    // Also check if URL contains endpoint with query params
    return (
      normalizedUrl.startsWith(endpoint) ||
      normalizedUrl.startsWith(endpoint + "/") ||
      normalizedUrl.startsWith(endpoint + "?")
    );
  });
};

// Request interceptor to add auth token (only for protected endpoints)
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Only add token for protected endpoints
    if (!isPublicEndpoint(config.url || "", config.method)) {
      const token = getAccessToken();
      const refreshToken = getRefreshToken();
      // Pre-emptive refresh if token is about to expire (leeway window)
      if (token && refreshToken && isTokenExpiringSoon(token) && !isRefreshing) {
        isRefreshing = true;
        return new Promise<InternalAxiosRequestConfig>((resolve, reject) => {
          performRefresh()
            .then((newToken) => {
              processQueue(null, newToken);
              isRefreshing = false;
              config.headers = config.headers || {};
              config.headers.Authorization = `Bearer ${newToken}`;
              resolve(config);
            })
            .catch((err) => {
              isRefreshing = false;
              processQueue(err as Error, null);
              clearAuthTokens();
              if (typeof window !== "undefined") {
                const p = window.location.pathname;
                const pub =
                  p.includes("/login") ||
                  p.includes("/register") ||
                  p.includes("/verify") ||
                  p === "/" ||
                  p.includes("/user-guide");
                if (!pub) window.location.href = "/login";
              }
              reject(err);
            });
        });
      }
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

// ✅ REFRESH MECHANISM: Process queued requests after token refresh
const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor to handle common errors with auto-refresh
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // ✅ AUTO-REFRESH JWT: If 401 and not a refresh/login request, try to refresh token
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      const requestUrl = originalRequest.url || "";

      // ✅ SECURITY: Check if 401 is due to password change (token invalidated)
      const errorMessage =
        (error.response?.data as { message?: string })?.message || "";
      if (
        errorMessage.includes("password change") ||
        errorMessage.includes("Token invalidated")
      ) {
        console.warn(
          "🔒 Token invalidated due to password change, forcing logout",
        );
        clearAuthTokens();

        // Don't redirect if already on login page
        const currentPath = window.location.pathname;
        if (!currentPath.includes("/login")) {
          window.location.href = "/login?reason=password_changed";
        }
        return Promise.reject(error);
      }

      // Don't retry if it's already a refresh or login request
      if (
        requestUrl.includes("/auth/refresh") ||
        requestUrl.includes("/auth/login") ||
        requestUrl.includes("/auth/google")
      ) {
        console.warn("Authentication failed on auth endpoint, clearing tokens");
        clearAuthTokens();

        const currentPath = window.location.pathname;
        const isPublicPage =
          currentPath.includes("/login") ||
          currentPath.includes("/register") ||
          currentPath.includes("/verify") ||
          currentPath === "/" ||
          currentPath.includes("/user-guide");

        if (!isPublicPage) {
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }

      // ✅ CONCURRENCY CONTROL: If refresh is already in progress, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return axiosInstance(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getRefreshToken();

      if (!refreshToken) {
        console.warn("❌ No refresh token available, clearing tokens");
        isRefreshing = false;
        processQueue(new Error("No refresh token"), null);
        clearAuthTokens();

        // Don't redirect if on public pages
        const currentPath = window.location.pathname;
        const isPublicPage =
          currentPath.includes("/login") ||
          currentPath.includes("/register") ||
          currentPath.includes("/verify") ||
          currentPath === "/" ||
          currentPath === "/jobs" ||
          currentPath === "/premium" ||
          currentPath === "/portfolio" ||
          currentPath.includes("/courses") ||
          currentPath.includes("/user-guide");

        if (!isPublicPage) {
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }

      try {
        // ✅ CALL REFRESH ENDPOINT: Get new tokens

        const response = await axios.post(`${baseURL}/auth/refresh`, {
          refreshToken,
        });

        const {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
          user: newUser,
        } = response.data;

        // ✅ UPDATE STORAGE: Save new tokens
        updateAuthSession(newAccessToken, newRefreshToken, newUser);
        broadcastSessionToOtherTabs();

        // ✅ UPDATE REQUEST: Retry original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        isRefreshing = false;
        processQueue(null, newAccessToken);

        return axiosInstance(originalRequest);
      } catch (refreshError) {
        console.error("❌ Token refresh failed, logging out", refreshError);
        isRefreshing = false;
        processQueue(refreshError as Error, null);

        // ✅ REFRESH FAILED: Clear tokens and redirect to login
        clearAuthTokens();

        const currentPath = window.location.pathname;
        const isPublicPage =
          currentPath.includes("/login") ||
          currentPath.includes("/register") ||
          currentPath.includes("/verify") ||
          currentPath === "/" ||
          currentPath.includes("/user-guide");

        if (!isPublicPage) {
          window.location.href = "/login";
        }

        return Promise.reject(refreshError);
      }
    }

    // ✅ OTHER ERRORS: Pass through
    return Promise.reject(error);
  },
);

// Utility function to clear authentication tokens
export const clearAuthTokens = (): void => {
  const shouldBroadcastLogout = hasActiveSession();
  clearAuthSession();
  if (shouldBroadcastLogout) {
    broadcastLogoutToOtherTabs();
  }
  window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT));
};

export default axiosInstance;
