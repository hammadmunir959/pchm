import { withBasePath } from "./apiConfig";
import { authFetch } from "./authFetch";

const VEHICLES_URL = withBasePath("/vehicles/");

export type VehicleStatus = "available" | "booked" | "maintenance";
export type VehicleTransmission = "automatic" | "manual";
export type VehicleFuelType = "petrol" | "diesel" | "hybrid" | "electric";

export interface VehiclePayload {
  name: string;
  type: string;
  registration: string;
  status: VehicleStatus;
  dailyRate: string;
  transmission: VehicleTransmission;
  seats: number;
  fuelType: VehicleFuelType;
  description?: string;
  color?: string;
  manufacturer?: string;
  model?: string;
  imageFile?: File | null;
}

const buildVehicleFormData = (payload: VehiclePayload) => {
  const formData = new FormData();
  formData.append("name", payload.name);
  formData.append("type", payload.type);
  formData.append("registration", payload.registration);
  formData.append("status", payload.status);
  formData.append("daily_rate", payload.dailyRate ?? "0");
  formData.append("transmission", payload.transmission);
  formData.append("seats", String(payload.seats));
  formData.append("fuel_type", payload.fuelType);

  if (payload.description) {
    formData.append("description", payload.description);
  }
  if (payload.color) {
    formData.append("color", payload.color);
  }
  if (payload.manufacturer) {
    formData.append("manufacturer", payload.manufacturer);
  }
  if (payload.model) {
    formData.append("model", payload.model);
  }
  if (payload.imageFile) {
    formData.append("image", payload.imageFile);
  }
  return formData;
};

export const adminVehiclesApi = {
  async create(payload: VehiclePayload) {
    const response = await authFetch(VEHICLES_URL, {
      method: "POST",
      body: buildVehicleFormData(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Unable to create vehicle.");
    }
    return response.json();
  },

  async update(id: number, payload: VehiclePayload) {
    const response = await authFetch(`${VEHICLES_URL}${id}/`, {
      method: "PATCH",
      body: buildVehicleFormData(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Unable to update vehicle.");
    }
    return response.json();
  },

  async delete(id: number) {
    const response = await authFetch(`${VEHICLES_URL}${id}/`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Unable to delete vehicle.");
    }
    return true;
  },

  async updateStatus(id: number, status: VehicleStatus) {
    const headers = new Headers();
    headers.set("Content-Type", "application/json");

    const response = await authFetch(`${VEHICLES_URL}${id}/update_status/`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Unable to update vehicle status.");
    }
    return response.json();
  },
};

