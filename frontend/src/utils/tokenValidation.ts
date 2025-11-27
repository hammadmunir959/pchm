import { getAccessToken as getStoredAccessToken } from "@/services/authStorage";

/**
 * Decodes a JWT token without verification (client-side only)
 * @param token - JWT token string
 * @returns Decoded token payload or null if invalid
 */
const decodeJWT = (token: string): { exp?: number; [key: string]: unknown } | null => {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }

    const payload = parts[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return decoded;
  } catch {
    return null;
  }
};

/**
 * Checks if a JWT token is expired
 * @param token - JWT token string
 * @returns true if token is expired or invalid, false otherwise
 */
export const isTokenExpired = (token: string | null): boolean => {
  if (!token) {
    return true;
  }

  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) {
    // If we can't decode or there's no expiration, consider it expired for safety
    return true;
  }

  // exp is in seconds, Date.now() is in milliseconds
  const expirationTime = decoded.exp * 1000;
  const currentTime = Date.now();
  
  // Add a 5 second buffer to account for clock skew and network delays
  const buffer = 5000;
  
  return currentTime >= expirationTime - buffer;
};

/**
 * Gets the current access token and validates it
 * @returns true if token exists and is not expired, false otherwise
 */
export const isTokenValid = (): boolean => {
  const token = getStoredAccessToken();
  if (!token) {
    return false;
  }
  
  return !isTokenExpired(token);
};

/**
 * Gets the time until token expiration in milliseconds
 * @param token - JWT token string
 * @returns milliseconds until expiration, or 0 if expired/invalid
 */
export const getTokenExpirationTime = (token: string | null): number => {
  if (!token) {
    return 0;
  }

  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) {
    return 0;
  }

  const expirationTime = decoded.exp * 1000;
  const currentTime = Date.now();
  const timeUntilExpiration = expirationTime - currentTime;
  
  return Math.max(0, timeUntilExpiration);
};

