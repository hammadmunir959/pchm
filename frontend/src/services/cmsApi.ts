import { withBasePath } from "./apiConfig";

const CMS_CONFIG_URL = withBasePath("/cms/landing-config/");

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

export const cmsApi = {
  async getConfig(): Promise<LandingPageConfig> {
    const response = await fetch(CMS_CONFIG_URL);
    if (!response.ok) {
      throw new Error("Unable to load CMS configuration.");
    }
    return response.json();
  },
};
