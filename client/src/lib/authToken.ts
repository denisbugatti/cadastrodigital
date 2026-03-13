/**
 * Auth token storage key — used as fallback for iframe contexts
 * where third-party cookies are blocked (e.g., Manus preview).
 * 
 * The token is stored in localStorage and sent via Authorization header.
 * This is a separate file to avoid circular imports with main.tsx.
 */
export const AUTH_TOKEN_KEY = "app_auth_token";

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string): void {
  try {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch {
    // localStorage may be unavailable in some contexts
  }
}

export function clearStoredToken(): void {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch {
    // localStorage may be unavailable in some contexts
  }
}
