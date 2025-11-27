import { withBasePath } from "./apiConfig";

const LANDING_CONFIG_URL = withBasePath("/cms/landing-config/");

export interface LandingPageConfig {
  id: number;
  hero_video_url?: string | null;
  logo_light_url?: string | null;
  logo_dark_url?: string | null;
  contact_phone: string;
  contact_email: string;
  contact_address: string;
  contact_hours?: string;
  google_map_embed_url?: string;
  last_updated?: string;
}

let cachedConfig: LandingPageConfig | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const landingPageApi = {
  async getConfig(): Promise<LandingPageConfig> {
    // Check cache first
    const now = Date.now();
    if (cachedConfig && now - cacheTimestamp < CACHE_DURATION) {
      return cachedConfig;
    }

    try {
      const response = await fetch(LANDING_CONFIG_URL);
      if (!response.ok) {
        throw new Error("Unable to load landing page configuration.");
      }
      const config = await response.json();
      
      // Update cache
      cachedConfig = config;
      cacheTimestamp = now;
      
      return config;
    } catch (error) {
      // If fetch fails, return cached config if available, or throw
      if (cachedConfig) {
        return cachedConfig;
      }
      throw error;
    }
  },

  clearCache() {
    cachedConfig = null;
    cacheTimestamp = 0;
  },
};


