import { withBasePath } from "./apiConfig";
import { authFetch } from "./authFetch";

const LANDING_CONFIG_URL = withBasePath("/cms/landing-config/");

export interface LandingPageConfig {
  id: number;
  hero_video?: File | null;
  hero_video_url?: string | null;
  logo_light?: File | null;
  logo_light_url?: string | null;
  logo_dark?: File | null;
  logo_dark_url?: string | null;
  contact_phone: string;
  contact_email: string;
  contact_address: string;
  contact_hours?: string;
  google_map_embed_url?: string;
  last_updated?: string;
}

export const adminLandingPageApi = {
  async getConfig(): Promise<LandingPageConfig> {
    const response = await authFetch(LANDING_CONFIG_URL);
    if (!response.ok) {
      throw new Error("Unable to load landing page configuration.");
    }
    return response.json();
  },

  async updateConfig(id: number, payload: FormData | Partial<LandingPageConfig>): Promise<LandingPageConfig> {
    const isFormData = payload instanceof FormData;
    const response = await authFetch(`${LANDING_CONFIG_URL}${id}/`, {
      method: "PATCH",
      headers: isFormData ? {} : { "Content-Type": "application/json" },
      body: isFormData ? payload : JSON.stringify(payload),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Unable to update landing page configuration.");
    }
    return response.json();
  },
};


