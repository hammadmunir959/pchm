import { withBasePath } from "./apiConfig";
import { normalizeListResponse } from "./responseUtils";

const CAR_LISTINGS_URL = withBasePath("/car-listings/");
const CAR_SELL_REQUESTS_URL = withBasePath("/car-sell-requests/");

export interface CarListing {
  id: number;
  make: string;
  model: string;
  year: number;
  mileage: number;
  color: string;
  registration: string;
  price: string;
  original_price?: string | null;
  fuel_type: string;
  transmission: string;
  engine_size?: string;
  doors: number;
  seats: number;
  description: string;
  features: string[];
  condition: string;
  location?: string;
  status: string;
  featured: boolean;
  primary_image?: string | null;
  images?: Array<{
    id: number;
    image_url?: string | null;
    alt_text?: string;
    is_primary: boolean;
  }>;
}

export interface PurchaseRequestPayload {
  name: string;
  email: string;
  phone: string;
  message?: string;
  offer_price?: number | null;
  financing_required?: boolean;
  trade_in_details?: string;
}

export interface SellRequestPayload {
  name: string;
  email?: string;
  phone?: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_year?: number | null;
  mileage?: number | null;
  message?: string;
  vehicle_image?: File | null;
}

const buildQueryString = (params: Record<string, string | number | boolean | undefined>) => {
  const url = new URL(CAR_LISTINGS_URL);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.append(key, String(value));
    }
  });
  return url.toString();
};

export const carSalesApi = {
  async list(
    params: Record<string, string | number | boolean | undefined> = {}
  ): Promise<CarListing[]> {
    const response = await fetch(buildQueryString(params));

    if (!response.ok) {
      throw new Error("Unable to load car listings right now.");
    }

    const data = await response.json();
    return normalizeListResponse<CarListing>(data, "Unexpected car listings response format.");
  },

  async get(id: number): Promise<CarListing> {
    const response = await fetch(`${CAR_LISTINGS_URL}${id}/`);
    if (!response.ok) {
      throw new Error("Unable to load car listing.");
    }
    return response.json();
  },

  async submitPurchaseRequest(
    listingId: number,
    payload: PurchaseRequestPayload
  ): Promise<{ id: number }> {
    const response = await fetch(`${CAR_LISTINGS_URL}${listingId}/purchase_request/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Unable to submit your request right now.");
    }

    return response.json();
  },

  async submitSellRequest(payload: SellRequestPayload): Promise<{ id: number }> {
    const formData = new FormData();
    formData.append("name", payload.name);
    if (payload.email) formData.append("email", payload.email);
    if (payload.phone) formData.append("phone", payload.phone);
    formData.append("vehicle_make", payload.vehicle_make);
    formData.append("vehicle_model", payload.vehicle_model);
    if (payload.vehicle_year) formData.append("vehicle_year", String(payload.vehicle_year));
    if (payload.mileage) formData.append("mileage", String(payload.mileage));
    if (payload.message) formData.append("message", payload.message);
    if (payload.vehicle_image) formData.append("vehicle_image", payload.vehicle_image);

    const response = await fetch(CAR_SELL_REQUESTS_URL, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: "Unable to submit your request right now." }));
      const errorMessage = errorData.detail || errorData.email || errorData.phone || JSON.stringify(errorData);
      throw new Error(errorMessage);
    }

    return response.json();
  },
};


