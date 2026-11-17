/**
 * apiClient.js — Global fetch wrapper with JWT auto-refresh + 401/403 interception
 *
 * Flow:
 *  1. Make API request with current access token
 *  2. If 401 → try to refresh access token using refresh token (stored in localStorage)
 *  3. If refresh succeeds → retry the original request with new token (seamless)
 *  4. If refresh fails (token revoked/expired) → clear session + redirect to /login
 *  5. If 403 → redirect to /unauthorized page
 *
 * Usage: import apiFetch from '../utils/apiClient';
 * Replace: fetch(url, options) → apiFetch(url, options)
 */

import config from "./config.json";

const BASE_URL = config.Calibmaster.URL;

// Prevent multiple simultaneous refresh calls (only one refresh at a time)
let isRefreshing = false;
let failedQueue = []; // Queue of { resolve, reject } for requests waiting on refresh

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
};

/**
 * Attempt to get a new access token using the stored refresh token.
 * Returns the new access token string on success, or null on failure.
 */
const tryRefreshToken = async () => {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) return null;

  try {
    const response = await fetch(`${BASE_URL}/api/users/refresh-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (data.code === 200 && data.data?.token) {
      // Store new tokens
      localStorage.setItem("token", data.data.token);
      if (data.data.refreshToken) {
        localStorage.setItem("refreshToken", data.data.refreshToken);
      }
      return data.data.token;
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * Force logout — clears all session data and redirects to login page.
 */
const forceLogout = () => {
  console.warn("[apiClient] Session expired — redirecting to login");
  localStorage.clear();
  sessionStorage.clear();
  window.location.href = "/login";
};

/**
 * Main fetch wrapper.
 * Automatically injects the Authorization header if a token exists in localStorage.
 * Retries once with a fresh token if a 401 is received.
 */
const apiFetch = async (url, options = {}) => {
  // Inject Authorization header automatically if not already provided
  const token = localStorage.getItem("token");
  if (token && !options.headers?.Authorization) {
    options = {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    };
  }

  const response = await fetch(url, options);

  // ── Handle 403 Forbidden ──────────────────────────────────────────────────
  if (response.status === 403) {
    console.warn("[apiClient] 403 Forbidden — redirecting to unauthorized");
    window.location.href = "/dashboard/unauthorized";
    return new Promise(() => {}); // Stop calling code from processing stale data
  }

  // ── Handle 401 Unauthorized → try refresh ────────────────────────────────
  if (response.status === 401) {
    if (isRefreshing) {
      // Another request is already refreshing — queue this one
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (newToken) => {
            options.headers = { ...options.headers, Authorization: `Bearer ${newToken}` };
            resolve(fetch(url, options));
          },
          reject,
        });
      });
    }

    isRefreshing = true;

    const newToken = await tryRefreshToken();

    if (newToken) {
      // Refresh succeeded — process queued requests with new token
      processQueue(null, newToken);
      isRefreshing = false;

      // Retry the original request with the new token
      options.headers = { ...options.headers, Authorization: `Bearer ${newToken}` };
      return fetch(url, options);
    } else {
      // Refresh failed — force logout
      processQueue(new Error("Session expired"), null);
      isRefreshing = false;
      forceLogout();
      return new Promise(() => {});
    }
  }

  return response;
};

export { apiFetch, tryRefreshToken, forceLogout };
export default apiFetch;
