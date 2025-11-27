import { withBasePath } from "./apiConfig";
import { authFetch } from "./authFetch";

const ACTIVITY_BASE = withBasePath("/analytics/dashboard");

const buildQueryString = (params: Record<string, string | number | undefined>) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && `${value}`.length > 0) {
      searchParams.set(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
};

export type ActivityLogType = "login" | "logout" | "create" | "update" | "delete" | "view";

export interface AdminActivityLogEntry {
  id: number;
  activity_type: ActivityLogType;
  activity_label: string;
  description: string;
  timestamp: string;
  user_name?: string | null;
  user_email?: string | null;
  ip_address?: string | null;
  icon?: string;
}

export interface PaginatedActivityResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: AdminActivityLogEntry[];
}

export interface ActivityLogQuery {
  page?: number;
  pageSize?: number;
  type?: ActivityLogType;
  q?: string;
}

export const adminActivityApi = {
  async fetchActivityLog(params: ActivityLogQuery = {}): Promise<PaginatedActivityResponse> {
    const query = buildQueryString({
      page: params.page,
      page_size: params.pageSize,
      type: params.type,
      q: params.q,
    });

    const response = await authFetch(`${ACTIVITY_BASE}/activity-log/${query}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Failed to load activity log.");
    }

    return response.json() as Promise<PaginatedActivityResponse>;
  },
};

