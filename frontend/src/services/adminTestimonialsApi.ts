import { withBasePath } from "./apiConfig";
import { authFetch } from "./authFetch";
import { normalizeListResponse } from "./responseUtils";

const TESTIMONIALS_URL = withBasePath("/testimonials/");

export interface AdminTestimonialPayload {
  name: string;
  feedback: string;
  rating: number;
  status?: "pending" | "approved" | "rejected" | "archived";
}

export const adminTestimonialsApi = {
  async list(params: Record<string, string | number | undefined> = {}) {
    const url = new URL(TESTIMONIALS_URL);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.append(key, String(value));
      }
    });

    const response = await authFetch(url.toString());
    if (!response.ok) {
      throw new Error("Unable to load testimonials.");
    }

    const data = await response.json();
    return normalizeListResponse(data, "Unexpected testimonials response format.");
  },

  async create(payload: AdminTestimonialPayload) {
    const response = await authFetch(TESTIMONIALS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Unable to create testimonial.");
    }

    return response.json();
  },

  async update(id: number, payload: AdminTestimonialPayload) {
    const response = await authFetch(`${TESTIMONIALS_URL}${id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Unable to update testimonial.");
    }

    return response.json();
  },

  async delete(id: number) {
    const response = await authFetch(`${TESTIMONIALS_URL}${id}/`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Unable to delete testimonial.");
    }

    return true;
  },

  async approve(id: number) {
    const response = await authFetch(`${TESTIMONIALS_URL}${id}/approve/`, {
      method: "PATCH",
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Unable to approve testimonial.");
    }

    return response.json();
  },

  async reject(id: number) {
    const response = await authFetch(`${TESTIMONIALS_URL}${id}/reject/`, {
      method: "PATCH",
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Unable to reject testimonial.");
    }

    return response.json();
  },

  async publish(id: number) {
    const response = await authFetch(`${TESTIMONIALS_URL}${id}/publish/`, {
      method: "PATCH",
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Unable to publish testimonial.");
    }

    return response.json();
  },

  async archive(id: number) {
    const response = await authFetch(`${TESTIMONIALS_URL}${id}/archive/`, {
      method: "PATCH",
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Unable to archive testimonial.");
    }

    return response.json();
  },
};

