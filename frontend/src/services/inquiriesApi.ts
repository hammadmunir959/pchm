import { withBasePath } from "./apiConfig";

const INQUIRIES_URL = withBasePath("/inquiries/");

export interface InquiryPayload {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  vehicle_interest?: string;
  recaptcha_token?: string;
}

export const inquiriesApi = {
  async create(payload: InquiryPayload): Promise<{ id: number }> {
    const response = await fetch(INQUIRIES_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        ...payload,
        recaptcha_token: payload.recaptcha_token || "dev-token",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Unable to submit inquiry right now.");
    }

    return response.json();
  },
};


