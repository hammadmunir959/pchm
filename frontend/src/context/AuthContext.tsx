import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  clearSession,
  getStoredUser,
  hasStoredSession,
  storeSession,
  storageKeys,
  getAccessToken,
  type StoredAuthUser,
} from "@/services/authStorage";
import type { AdminStatus, LoginResponse } from "@/services/authApi";
import { isTokenValid, getTokenExpirationTime } from "@/utils/tokenValidation";

type AuthRole = "super-admin" | "admin";

export interface AuthUser {
  id: number;
  email: string;
  adminType: AuthRole;
  firstName?: string;
  lastName?: string;
  status: AdminStatus | null;
  isEmailVerified?: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (session: Pick<LoginResponse, "access" | "refresh" | "user">) => void;
  logout: () => void;
  hasRole: (roles: AuthRole | AuthRole[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const normalizeStatus = (status: string | null | undefined): AdminStatus | null => {
  if (!status) return null;
  if (status === "active" || status === "pending_approval" || status === "suspended") {
    return status;
  }
  return null;
};

const normalizeRole = (role: string | null | undefined): AuthRole | null => {
  if (role === "super_admin") return "super-admin";
  if (role === "admin") return "admin";
  return null;
};

const toStoredAuthUser = (user: LoginResponse["user"]): StoredAuthUser => {
  const normalizedRole = normalizeRole(user.admin_type);
  if (!normalizedRole) {
    throw new Error("Unable to determine admin role from the provided user object.");
  }

  return {
    id: user.id,
    email: user.email,
    adminType: normalizedRole,
    firstName: user.first_name,
    lastName: user.last_name,
    status: normalizeStatus(user.status),
    isEmailVerified: user.is_email_verified,
  };
};

const toAuthUser = (user: StoredAuthUser | null): AuthUser | null => {
  if (!user) return null;
  return {
    ...user,
    status: normalizeStatus(user.status) ?? null,
  };
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasToken, setHasToken] = useState(false);

  // Validate token and clear session if expired
  const validateAndCleanSession = useCallback(() => {
    const tokenPresent = hasStoredSession();
    if (tokenPresent) {
      const tokenIsValid = isTokenValid();
      if (!tokenIsValid) {
        // Token is expired, clear session
        clearSession();
        setUser(null);
        setHasToken(false);
        return false;
      }
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    const storedUser = getStoredUser();
    const tokenPresent = hasStoredSession();
    
    // Validate token expiration on initialization
    if (tokenPresent) {
      const tokenIsValid = isTokenValid();
      if (tokenIsValid) {
        setUser(toAuthUser(storedUser));
        setHasToken(true);
      } else {
        // Token is expired, clear session
        clearSession();
        setUser(null);
        setHasToken(false);
      }
    } else {
      setUser(null);
      setHasToken(false);
    }
    
    setIsLoading(false);

    if (typeof window === "undefined") {
      return;
    }

    // Set up periodic token validation
    const token = getAccessToken();
    if (token) {
      const expirationTime = getTokenExpirationTime(token);
      if (expirationTime > 0) {
        // Set up a timeout to check token expiration before it actually expires
        // Check 1 minute before expiration, or every 5 minutes if token expires in more than 5 minutes
        const checkInterval = Math.min(expirationTime - 60000, 5 * 60 * 1000);
        const timeoutId = setTimeout(() => {
          validateAndCleanSession();
        }, Math.max(checkInterval, 1000)); // At least 1 second

        return () => clearTimeout(timeoutId);
      } else {
        // Token already expired
        validateAndCleanSession();
      }
    }

    const handleStorage = (event: StorageEvent) => {
      if (!event.key || event.key === storageKeys.ACCESS) {
        const tokenExists = hasStoredSession();
        if (tokenExists) {
          const tokenIsValid = isTokenValid();
          if (tokenIsValid) {
            setHasToken(true);
            const storedUser = getStoredUser();
            setUser(toAuthUser(storedUser));
          } else {
            // Token is expired
            clearSession();
            setHasToken(false);
            setUser(null);
          }
        } else {
          setHasToken(false);
          setUser(null);
        }
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [validateAndCleanSession]);

  const login = useCallback(
    (session: Pick<LoginResponse, "access" | "refresh" | "user">) => {
      const storedUser = toStoredAuthUser(session.user);
      storeSession({
        accessToken: session.access,
        refreshToken: session.refresh,
        user: storedUser,
      });
      setUser(toAuthUser(storedUser));
      setHasToken(true);
    },
    [],
  );

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    setHasToken(false);
  }, []);

  const hasRole = useCallback(
    (roles: AuthRole | AuthRole[]) => {
      const requiredRoles = Array.isArray(roles) ? roles : [roles];
      if (!user) return false;
      return requiredRoles.includes(user.adminType);
    },
    [user],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user) && hasToken,
      isLoading,
      login,
      logout,
      hasRole,
    }),
    [user, hasToken, isLoading, login, logout, hasRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};


