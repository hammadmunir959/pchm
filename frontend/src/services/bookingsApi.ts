import { withBasePath } from "./apiConfig";

const CLAIMS_URL = withBasePath("/claims/");

export interface ClaimResponse {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  status: string;
  created_at: string;
}

export const bookingsApi = {
  async submitClaim(formData: FormData): Promise<ClaimResponse> {
    const response = await fetch(CLAIMS_URL, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        errorText || "We could not submit your claim at the moment. Please try again later."
      );
    }

    return response.json();
  },
};


