const sanitizeBaseUrl = (url: string) => url.replace(/\/$/, "");

const inferDefaultBaseUrl = () => {
  if (typeof window !== "undefined" && window.location.origin) {
    return `${window.location.origin}/api`;
  }
  return "http://localhost:8000/api";
};

const rawBaseUrl =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || inferDefaultBaseUrl();

export const API_BASE_URL = sanitizeBaseUrl(rawBaseUrl);

export const withBasePath = (path: string) => `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;


