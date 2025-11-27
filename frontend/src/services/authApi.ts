import { API_BASE_URL, withBasePath } from "./apiConfig";
import { getAccessToken } from "./authStorage";
import { isTokenInvalidPayload, redirectToLogin } from "./sessionManager";

type AdminType = "super-admin" | "admin";
type BackendAdminType = "super_admin" | "admin";
export type AdminStatus = "active" | "pending_approval" | "suspended";
type BackendAdminStatus = "active" | "pending_approval" | "suspended";

const AUTH_BASE_URL = withBasePath("/auth");

const defaultHeaders: HeadersInit = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

const toBackendAdminType = (type: AdminType): BackendAdminType =>
  type === "super-admin" ? "super_admin" : "admin";

const fromBackendAdminType = (type: BackendAdminType | null | undefined): AdminType | null => {
  if (type === "super_admin") return "super-admin";
  if (type === "admin") return "admin";
  return null;
};

const parseJsonSafe = async (response: Response) => {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

const buildErrorMessage = (status: number, data: Record<string, unknown> | null) => {
  if (data?.error && typeof data.error === "string") return data.error;
  if (data?.message && typeof data.message === "string") return data.message;
  return `Request failed with status ${status}`;
};

export class ApiError<T = Record<string, unknown> | null> extends Error {
  status: number;
  data: T;

  constructor(status: number, message: string, data: T) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

const hasAuthHeader = (headers: HeadersInit | undefined): boolean => {
  if (!headers) return false;
  if (headers instanceof Headers) {
    return headers.has("Authorization");
  }
  if (Array.isArray(headers)) {
    return headers.some(([key]) => key.toLowerCase() === "authorization");
  }
  return Object.keys(headers).some((key) => key.toLowerCase() === "authorization");
};

const request = async <T>(path: string, options: RequestInit): Promise<T> => {
  const includesAuthHeader = hasAuthHeader(options.headers);
  const response = await fetch(`${AUTH_BASE_URL}${path}`, {
    credentials: "include",
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {}),
    },
  });

  const data = await parseJsonSafe(response);

  if (!response.ok) {
    if (response.status === 401 && includesAuthHeader && isTokenInvalidPayload(data)) {
      redirectToLogin();
    }
    throw new ApiError(response.status, buildErrorMessage(response.status, data), data);
  }

  return (data as T) ?? ({} as T);
};

const authHeaders = (): HeadersInit => {
  const token = getAccessToken();
  if (!token) {
    redirectToLogin("Please log in again to perform this action.");
  }
  return {
    Authorization: `Bearer ${token}`,
  };
};

export interface RegisterAdminPayload {
  email: string;
  password: string;
  adminType: AdminType;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface RegisterAdminResponse {
  message: string;
  user_id: number;
  status: BackendAdminStatus;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: {
    id: number;
    email: string;
    admin_type: BackendAdminType;
    status: BackendAdminStatus;
    first_name: string;
    last_name: string;
    is_email_verified: boolean;
  };
}

export interface VerifyOtpPayload {
  email: string;
  otpCode: string;
  purpose?: string;
}

export interface VerifyOtpResponse {
  message: string;
}

export interface ResetPasswordPayload {
  email: string;
  otpCode: string;
  newPassword: string;
}

export interface AdminSummary {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  status: BackendAdminStatus;
  created_at?: string;
}

export const authApi = {
  async registerAdmin(payload: RegisterAdminPayload): Promise<RegisterAdminResponse> {
    const body = {
      email: payload.email,
      password: payload.password,
      admin_type: toBackendAdminType(payload.adminType),
      first_name: payload.firstName ?? "",
      last_name: payload.lastName ?? "",
      phone: payload.phone ?? "",
    };

    const response = await request<{ data?: RegisterAdminResponse; success?: boolean }>("/register/", {
      method: "POST",
      body: JSON.stringify(body),
    });
    
    // Extract data from wrapped response (backend uses success_response wrapper)
    if (response.data) {
      return response.data;
    }
    // Fallback for backward compatibility
    return response as unknown as RegisterAdminResponse;
  },

  async login(payload: LoginPayload): Promise<LoginResponse> {
    const body = {
      email: payload.email,
      password: payload.password,
    };

    const response = await request<{ data?: LoginResponse; success?: boolean }>("/login/", {
      method: "POST",
      body: JSON.stringify(body),
    });
    
    // Extract data from wrapped response (backend uses success_response wrapper)
    if (response.data) {
      return response.data;
    }
    // Fallback for backward compatibility
    return response as unknown as LoginResponse;
  },

  async verifyOtp(payload: VerifyOtpPayload): Promise<VerifyOtpResponse> {
    const body = {
      email: payload.email,
      otp_code: payload.otpCode,
      purpose: payload.purpose ?? "verification",
    };

    return request<VerifyOtpResponse>("/verify-otp/", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  async resendVerificationOtp(email: string): Promise<{ message: string }> {
    return request<{ message: string }>("/resend-otp/", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  async requestPasswordReset(email: string): Promise<{ message: string }> {
    return request<{ message: string }>("/password/request-reset/", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  async resetPassword(payload: ResetPasswordPayload): Promise<{ message: string }> {
    const body = {
      email: payload.email,
      otp_code: payload.otpCode,
      new_password: payload.newPassword,
    };

    return request<{ message: string }>("/password/reset/", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  normalizeAdminType: fromBackendAdminType,
  normalizeAdminStatus: (
    status: BackendAdminStatus | AdminStatus | string | null | undefined,
  ): AdminStatus | null => {
    if (!status) return null;
    if (status === "active" || status === "pending_approval" || status === "suspended") {
      return status;
    }
    return null;
  },

  async getAdmins(status?: AdminStatus): Promise<AdminSummary[]> {
    const query = status ? `?status=${encodeURIComponent(status)}` : "";
    const data = await request<{ results: AdminSummary[] }>(`/admins/${query}`, {
      method: "GET",
      headers: authHeaders(),
    });
    return data.results ?? [];
  },

  async updateAdminStatus(id: number, status: AdminStatus): Promise<AdminSummary> {
    return request<AdminSummary>(`/admins/${id}/status/`, {
      method: "PATCH",
      headers: {
        ...authHeaders(),
      },
      body: JSON.stringify({ status }),
    });
  },
};

export type { AdminType };

