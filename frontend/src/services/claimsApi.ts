import { withBasePath } from "./apiConfig";
import { authFetch } from "./authFetch";
import { normalizeListResponse } from "./responseUtils";

const CLAIMS_URL = withBasePath("/claims/");

export interface Claim {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  accident_date: string;
  pickup_location: string;
  drop_location: string;
  notes?: string;
  status: "pending" | "approved" | "cancelled";
  created_at: string;
  vehicle_registration: string;
  insurance_company: string;
  policy_number: string;
  accident_details: string;
  assigned_staff: number | null;
  assigned_staff_details?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  documents: Array<{
    id: number;
    file_name: string;
    file_url?: string;
  }>;
  vehicle_details?: {
    id: number;
    name: string;
    registration: string;
    type: string;
  } | null;
}

export const claimsApi = {
  async list(params: Record<string, string | number | undefined> = {}): Promise<Claim[]> {
    const url = new URL(CLAIMS_URL);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.append(key, String(value));
      }
    });

    const response = await authFetch(url.toString());
    if (!response.ok) {
      throw new Error("Unable to load bookings right now.");
    }
    const data = await response.json();
    return normalizeListResponse<Claim>(data, "Unexpected claims response format.");
  },

  async approve(id: number): Promise<Claim> {
    const response = await authFetch(`${CLAIMS_URL}${id}/approve/`, {
      method: "PATCH",
    });
    if (!response.ok) {
      throw new Error("Failed to approve claim.");
    }
    return response.json();
  },

  async cancel(id: number): Promise<Claim> {
    const response = await authFetch(`${CLAIMS_URL}${id}/cancel/`, {
      method: "PATCH",
    });
    if (!response.ok) {
      throw new Error("Failed to cancel claim.");
    }
    return response.json();
  },

  async assignStaff(id: number, staffId: number): Promise<Claim> {
    const response = await authFetch(`${CLAIMS_URL}${id}/assign_staff/`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ staff_id: staffId }),
    });
    if (!response.ok) {
      throw new Error("Failed to assign staff to claim.");
    }
    return response.json();
  },

  async updateStatus(id: number, status: "pending" | "approved" | "cancelled"): Promise<Claim> {
    const response = await authFetch(`${CLAIMS_URL}${id}/`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) {
      throw new Error(`Failed to update status to ${status}.`);
    }
    return response.json();
  },

  async assignVehicle(id: number, vehicleId: number | null): Promise<Claim> {
    const response = await authFetch(`${CLAIMS_URL}${id}/`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ vehicle: vehicleId }),
    });
    if (!response.ok) {
      throw new Error("Failed to assign vehicle to claim.");
    }
    return response.json();
  },
};

