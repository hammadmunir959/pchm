import { redirectToLogin, shouldForceLogoutFromResponse } from "./sessionManager";
import { getAccessToken } from "./authStorage";

export const authFetch = async (url: string, options: RequestInit = {}) => {
  const token = getAccessToken();
  if (!token) {
    redirectToLogin();
  }

  const headers =
    options.headers instanceof Headers ? options.headers : new Headers(options.headers);
  headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (await shouldForceLogoutFromResponse(response)) {
    redirectToLogin();
  }

  return response;
};

