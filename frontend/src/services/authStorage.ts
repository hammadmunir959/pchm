const ACCESS_TOKEN_KEY = "pchm_access_token";
const REFRESH_TOKEN_KEY = "pchm_refresh_token";
const USER_KEY = "pchm_auth_user";

export type StoredAuthUser = {
  id: number;
  email: string;
  adminType: "super-admin" | "admin";
  firstName?: string;
  lastName?: string;
  status?: string | null;
  isEmailVerified?: boolean;
};

const canAccessStorage = () => typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const safeParseUser = (raw: string | null): StoredAuthUser | null => {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredAuthUser;
  } catch {
    return null;
  }
};

export const getAccessToken = () => {
  if (!canAccessStorage()) return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

export const getRefreshToken = () => {
  if (!canAccessStorage()) return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const hasStoredSession = () => {
  if (!canAccessStorage()) return false;
  return Boolean(localStorage.getItem(ACCESS_TOKEN_KEY));
};

export const getStoredUser = (): StoredAuthUser | null => {
  if (!canAccessStorage()) return null;
  const stored = localStorage.getItem(USER_KEY);
  const parsed = safeParseUser(stored);
  if (!parsed && stored) {
    localStorage.removeItem(USER_KEY);
  }
  return parsed;
};

export const storeSession = ({
  accessToken,
  refreshToken,
  user,
}: {
  accessToken: string;
  refreshToken: string;
  user: StoredAuthUser;
}) => {
  if (!canAccessStorage()) return;
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const setStoredUser = (user: StoredAuthUser | null) => {
  if (!canAccessStorage()) return;
  if (!user) {
    localStorage.removeItem(USER_KEY);
    return;
  }
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearSession = () => {
  if (!canAccessStorage()) return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const storageKeys = {
  ACCESS: ACCESS_TOKEN_KEY,
  REFRESH: REFRESH_TOKEN_KEY,
  USER: USER_KEY,
} as const;

