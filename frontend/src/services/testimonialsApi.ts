import { withBasePath } from "./apiConfig";
import { normalizeListResponse } from "./responseUtils";

export interface Testimonial {
  id: number;
  name: string;
  feedback: string;
  rating: number;
  service_type?: "car_hire" | "car_rental" | "claims_management" | "car_purchase_sale" | null;
  status: "pending" | "approved" | "rejected";
  created_at?: string;
}

const TESTIMONIALS_URL = withBasePath("/testimonials/");

export const testimonialsApi = {
  async list(params: Record<string, string | number | undefined> = {}): Promise<Testimonial[]> {
    const url = new URL(TESTIMONIALS_URL);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.append(key, String(value));
      }
    });

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error("Unable to load testimonials right now.");
    }

    const data = await response.json();
    return normalizeListResponse<Testimonial>(
      data,
      "Unexpected testimonials response format."
    );
  },

  async create(payload: { name: string; feedback: string; rating: number; service_type?: string }) {
    const response = await fetch(TESTIMONIALS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      // Handle rate limiting (429 status)
      if (response.status === 429) {
        // Check Retry-After header first (DRF standard)
        const retryAfter = response.headers.get("Retry-After");
        let waitTime = 3600; // Default: 1 hour
        
        if (retryAfter) {
          waitTime = parseInt(retryAfter, 10);
        } else {
          // Fallback: try to parse response body
          try {
            const errorData = await response.clone().json();
            waitTime = errorData.wait || errorData.detail?.wait || 3600;
          } catch {
            // If parsing fails, use default
          }
        }
        
        const minutes = Math.ceil(waitTime / 60);
        throw new Error(
          `You have reached the submission limit (2 per hour). Please try again in ${minutes} minute${minutes !== 1 ? "s" : ""}.`
        );
      }
      const errorText = await response.text();
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.detail || errorData.message || "Unable to submit testimonial right now.");
      } catch {
        throw new Error(errorText || "Unable to submit testimonial right now.");
      }
    }

    return response.json();
  },
};


