import { withBasePath } from "./apiConfig";
import { authFetch } from "./authFetch";
import { normalizeListResponse } from "./responseUtils";

const INQUIRIES_URL = withBasePath("/inquiries/");

export type InquiryStatus = "unread" | "replied" | "resolved";

export interface AdminInquiry {
  id: number;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  vehicle_interest?: string;
  status: InquiryStatus;
  source: "web" | "chatbot";
  created_at: string;
}

export const adminInquiriesApi = {
  async list(params: Record<string, string | number | undefined> = {}): Promise<AdminInquiry[]> {
    const url = new URL(INQUIRIES_URL);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.append(key, String(value));
      }
    });

    const response = await authFetch(url.toString());
    if (!response.ok) {
      throw new Error("Unable to load inquiries.");
    }

    const data = await response.json();
    return normalizeListResponse<AdminInquiry>(data, "Unexpected inquiries response format.");
  },

  async updateStatus(id: number, status: InquiryStatus) {
    const response = await authFetch(`${INQUIRIES_URL}${id}/update_status/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Unable to update inquiry status.");
    }

    return response.json();
  },

  async markSpam(id: number, spamScore?: number) {
    const response = await authFetch(`${INQUIRIES_URL}${id}/mark_spam/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spam_score: spamScore }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Unable to mark inquiry as spam.");
    }

    return response.json();
  },

  async delete(id: number) {
    const response = await authFetch(`${INQUIRIES_URL}${id}/`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Unable to delete inquiry.");
    }
    return true;
  },
  async reply(id: number, message: string) {
    const response = await authFetch(`${INQUIRIES_URL}${id}/reply_email/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Unable to send reply.");
    }

    return response.json();
  },
};

