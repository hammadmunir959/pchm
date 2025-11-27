import { withBasePath } from "./apiConfig";
import { authFetch } from "./authFetch";
import type { AdminStatus } from "./authApi";

const STAFF_URL = withBasePath("/auth/admins/");

export interface StaffMember {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  status: AdminStatus;
  admin_type: "admin" | "super_admin";
  created_at: string;
  phone?: string;
  is_email_verified?: boolean;
}

export const adminStaffApi = {
  async list(status?: AdminStatus): Promise<StaffMember[]> {
    const url = new URL(STAFF_URL);
    if (status) {
      url.searchParams.append("status", status);
    }

    const response = await authFetch(url.toString());
    if (!response.ok) {
      throw new Error("Unable to load staff members.");
    }

    const data = await response.json();
    return data.results ?? [];
  },

  async updateStatus(id: number, status: AdminStatus): Promise<StaffMember> {
    const response = await authFetch(`${STAFF_URL}${id}/status/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Unable to update staff status.");
    }

    return response.json();
  },
};

