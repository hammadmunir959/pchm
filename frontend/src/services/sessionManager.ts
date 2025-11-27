import { clearSession } from "./authStorage";

const LOGIN_ROUTE = "/admin/login";

const isBrowser = typeof window !== "undefined";

export const redirectToLogin = (message = "Session expired. Redirecting to login..."): never => {
  clearSession();

  if (isBrowser) {
    if (window.location.pathname !== LOGIN_ROUTE) {
      window.location.replace(LOGIN_ROUTE);
    } else {
      window.location.reload();
    }
  }

  throw new Error(message);
};

export const isTokenInvalidPayload = (payload: unknown): boolean => {
  if (!payload || typeof payload !== "object") return false;
  const data = payload as Record<string, unknown>;

  if (typeof data.code === "string" && data.code === "token_not_valid") {
    return true;
  }

  if (typeof data.detail === "string") {
    const lowerDetail = data.detail.toLowerCase();
    return lowerDetail.includes("token") && lowerDetail.includes("expired");
  }

  return false;
};

export const shouldForceLogoutFromResponse = async (response: Response): Promise<boolean> => {
  if (response.status !== 401) {
    return false;
  }

  try {
    const clone = response.clone();
    const data = await clone.json();
    if (isTokenInvalidPayload(data)) {
      return true;
    }
  } catch {
    try {
      const textClone = response.clone();
      const text = await textClone.text();
      if (text.toLowerCase().includes("token") && text.toLowerCase().includes("expired")) {
        return true;
      }
    } catch {
      return false;
    }
  }

  return false;
};

