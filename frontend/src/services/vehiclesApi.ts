import { withBasePath } from "./apiConfig";
import { normalizeListResponse } from "./responseUtils";

export type VehicleStatus = "available" | "booked" | "maintenance";
export type VehicleTransmission = "automatic" | "manual";
export type VehicleFuelType = "petrol" | "diesel" | "hybrid" | "electric";

export interface Vehicle {
  id: number;
  name: string;
  type: string;
  registration: string;
  status: VehicleStatus;
  daily_rate: string;
  transmission: VehicleTransmission;
  seats: number;
  fuel_type: VehicleFuelType;
  color?: string | null;
  manufacturer?: string | null;
  model?: string | null;
  image?: string;
  image_url?: string | null;
  description?: string;
}

const VEHICLES_URL = withBasePath("/vehicles/");

export const vehiclesApi = {
  async list(params: Record<string, string | number | undefined> = {}): Promise<Vehicle[]> {
    const url = new URL(VEHICLES_URL);

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.append(key, String(value));
      }
    });

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Unable to load vehicles right now.");
    }

    const data = await response.json();
    return normalizeListResponse<Vehicle>(data, "Unexpected vehicles response format.");
  },
};

