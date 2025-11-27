import { withBasePath } from "./apiConfig";
import { authFetch as baseAuthFetch } from "./authFetch";
import { normalizeListResponse } from "./responseUtils";
import type { CarListing } from "./carSalesApi";

const CAR_LISTINGS_URL = withBasePath("/car-listings/");
const CAR_PURCHASE_REQUESTS_URL = withBasePath("/car-purchase-requests/");
const CAR_SELL_REQUESTS_URL = withBasePath("/car-sell-requests/");

const authFetch = (url: string, options: RequestInit = {}) => {
  if (options.body instanceof FormData) {
    return baseAuthFetch(url, options);
  }
  return baseAuthFetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
};

export interface CarListingPayload {
  make: string;
  model: string;
  year: number;
  mileage: number;
  color: string;
  registration: string;
  price: number;
  original_price?: number | null;
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
}

export interface CarListingImagePayload {
  image: File;
  altText?: string;
  isPrimary?: boolean;
}

export interface CarPurchaseRequest {
  id: number;
  car_listing: number;
  car_listing_title?: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  offer_price?: string | null;
  financing_required: boolean;
  trade_in_details?: string;
  status: string;
  notes?: string;
  assigned_staff?: number | null;
  assigned_staff_name?: string | null;
  created_at: string;
}

const buildQueryString = (baseUrl: string, params: Record<string, string | number | undefined>) => {
  const url = new URL(baseUrl);
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.append(key, String(value));
    }
  });
  return url.toString();
};

export const adminCarSalesApi = {
  async list(params: Record<string, string | number | undefined> = {}): Promise<CarListing[]> {
    const response = await authFetch(buildQueryString(CAR_LISTINGS_URL, params));
    if (!response.ok) {
      throw new Error("Unable to load car listings.");
    }
    const data = await response.json();
    return normalizeListResponse<CarListing>(data, "Unexpected car listings response format.");
  },

  async create(payload: CarListingPayload): Promise<CarListing> {
    const response = await authFetch(CAR_LISTINGS_URL, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Unable to create car listing.");
    }
    return response.json();
  },

  async update(id: number, payload: Partial<CarListingPayload>): Promise<CarListing> {
    const response = await authFetch(`${CAR_LISTINGS_URL}${id}/`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Unable to update car listing.");
    }
    return response.json();
  },

  async delete(id: number): Promise<void> {
    const response = await authFetch(`${CAR_LISTINGS_URL}${id}/`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Unable to delete car listing.");
    }
  },

  async uploadImage(listingId: number, payload: CarListingImagePayload) {
    const formData = new FormData();
    formData.append("image", payload.image);
    if (payload.isPrimary) {
      formData.append("is_primary", "true");
    }
    if (payload.altText) {
      formData.append("alt_text", payload.altText);
    }

    const response = await authFetch(`${CAR_LISTINGS_URL}${listingId}/upload-image/`, {
      method: "POST",
      body: formData,
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Unable to upload image.");
    }
    return response.json();
  },

  async listPurchaseRequests(
    params: Record<string, string | number | undefined> = {}
  ): Promise<CarPurchaseRequest[]> {
    const response = await authFetch(buildQueryString(CAR_PURCHASE_REQUESTS_URL, params));
    if (!response.ok) {
      throw new Error("Unable to load purchase requests.");
    }
    const data = await response.json();
    return normalizeListResponse<CarPurchaseRequest>(
      data,
      "Unexpected purchase requests response format."
    );
  },

  async updatePurchaseRequest(
    id: number,
    payload: Partial<Pick<CarPurchaseRequest, "status" | "notes" | "assigned_staff">>
  ): Promise<CarPurchaseRequest> {
    const response = await authFetch(`${CAR_PURCHASE_REQUESTS_URL}${id}/`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Unable to update purchase request.");
    }
    return response.json();
  },
};

export interface CarSellRequest {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_year?: number | null;
  mileage?: number | null;
  message?: string;
  vehicle_image?: string | null;
  vehicle_image_url?: string | null;
  status: string;
  notes?: string;
  assigned_staff?: number | null;
  assigned_staff_name?: string | null;
  created_at: string;
  updated_at: string;
  contacted_at?: string | null;
}

export const adminCarSellRequestsApi = {
  async list(
    params: Record<string, string | number | undefined> = {}
  ): Promise<CarSellRequest[]> {
    const response = await authFetch(buildQueryString(CAR_SELL_REQUESTS_URL, params));
    if (!response.ok) {
      throw new Error("Unable to load sell requests.");
    }
    const data = await response.json();
    return normalizeListResponse<CarSellRequest>(
      data,
      "Unexpected sell requests response format."
    );
  },

  async update(
    id: number,
    payload: Partial<Pick<CarSellRequest, "status" | "notes" | "assigned_staff">>
  ): Promise<CarSellRequest> {
    const response = await authFetch(`${CAR_SELL_REQUESTS_URL}${id}/`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Unable to update sell request.");
    }
    return response.json();
  },
};


