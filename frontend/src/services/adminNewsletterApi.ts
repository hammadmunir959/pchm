import { withBasePath } from "./apiConfig";
import { authFetch } from "./authFetch";
import { normalizeListResponse } from "./responseUtils";

const NEWSLETTER_URL = withBasePath("/newsletter/");

export type SubscriberStatus = "active" | "inactive" | "all";

export interface NewsletterSubscriber {
  id: number;
  email: string;
  name?: string;
  subscribed_at: string;
  is_active: boolean;
  unsubscribed_at?: string | null;
  source?: string;
}

export interface CreateSubscriberPayload {
  email: string;
  name?: string;
  source?: string;
  is_active?: boolean;
}

export type CampaignStatus = "draft" | "scheduled" | "sending" | "sent" | "cancelled";

export interface NewsletterCampaign {
  id: number;
  subject: string;
  content: string;
  scheduled_at?: string | null;
  sent_at?: string | null;
  status: CampaignStatus;
  recipients_count: number;
  opened_count: number;
  clicked_count: number;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface NewsletterCampaignPayload {
  subject: string;
  content: string;
  scheduled_at?: string | null;
  status?: CampaignStatus;
}

export const adminNewsletterApi = {
  // Subscribers
  async listSubscribers(params: Record<string, string | boolean | undefined> = {}): Promise<NewsletterSubscriber[]> {
    const url = new URL(`${NEWSLETTER_URL}subscribers/`);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.append(key, String(value));
      }
    });

    const response = await authFetch(url.toString());
    if (!response.ok) {
      throw new Error("Unable to load subscribers.");
    }

    const data = await response.json();
    return normalizeListResponse<NewsletterSubscriber>(data, "Unexpected subscribers response format.");
  },
  async listSubscribersPaged(params: Record<string, string | number | boolean | undefined> = {}): Promise<{ results: NewsletterSubscriber[]; count: number; next?: string | null; previous?: string | null; }> {
    const url = new URL(`${NEWSLETTER_URL}subscribers/`);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.append(key, String(value));
      }
    });
    const response = await authFetch(url.toString());
    if (!response.ok) {
      throw new Error("Unable to load subscribers.");
    }
    const data = await response.json();
    if (Array.isArray(data)) {
      return { results: data as NewsletterSubscriber[], count: (data as NewsletterSubscriber[]).length, next: null, previous: null };
    }
    return data as { results: NewsletterSubscriber[]; count: number; next?: string | null; previous?: string | null; };
  },

  async createSubscriber(payload: CreateSubscriberPayload): Promise<NewsletterSubscriber> {
    const response = await authFetch(`${NEWSLETTER_URL}subscribers/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Unable to create subscriber.");
    }

    return response.json();
  },

  async updateSubscriberStatus(id: number, isActive: boolean) {
    const response = await authFetch(`${NEWSLETTER_URL}subscribers/${id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: isActive }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Unable to update subscriber status.");
    }

    return response.json();
  },

  async deleteSubscriber(id: number) {
    const response = await authFetch(`${NEWSLETTER_URL}subscribers/${id}/`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Unable to delete subscriber.");
    }

    return true;
  },

  // Campaigns
  async listCampaigns(params: Record<string, string | boolean | undefined> = {}): Promise<NewsletterCampaign[]> {
    const url = new URL(`${NEWSLETTER_URL}campaigns/`);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.append(key, String(value));
      }
    });

    const response = await authFetch(url.toString());
    if (!response.ok) {
      throw new Error("Unable to load campaigns.");
    }

    const data = await response.json();
    return normalizeListResponse<NewsletterCampaign>(data, "Unexpected campaigns response format.");
  },
  async listCampaignsPaged(params: Record<string, string | number | boolean | undefined> = {}): Promise<{ results: NewsletterCampaign[]; count: number; next?: string | null; previous?: string | null; }> {
    const url = new URL(`${NEWSLETTER_URL}campaigns/`);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.append(key, String(value));
      }
    });
    const response = await authFetch(url.toString());
    if (!response.ok) {
      throw new Error("Unable to load campaigns.");
    }
    const data = await response.json();
    if (Array.isArray(data)) {
      return { results: data as NewsletterCampaign[], count: (data as NewsletterCampaign[]).length, next: null, previous: null };
    }
    return data as { results: NewsletterCampaign[]; count: number; next?: string | null; previous?: string | null; };
  },

  async getCampaign(id: number): Promise<NewsletterCampaign> {
    const response = await authFetch(`${NEWSLETTER_URL}campaigns/${id}/`);

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Unable to load campaign.");
    }

    return response.json();
  },

  async createCampaign(payload: NewsletterCampaignPayload) {
    const response = await authFetch(`${NEWSLETTER_URL}campaigns/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Unable to create campaign.");
    }

    return response.json();
  },

  async updateCampaign(id: number, payload: Partial<NewsletterCampaignPayload>) {
    const response = await authFetch(`${NEWSLETTER_URL}campaigns/${id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Unable to update campaign.");
    }

    return response.json();
  },

  async deleteCampaign(id: number) {
    const response = await authFetch(`${NEWSLETTER_URL}campaigns/${id}/`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Unable to delete campaign.");
    }

    return true;
  },

  async sendCampaign(id: number) {
    const response = await authFetch(`${NEWSLETTER_URL}campaigns/${id}/send_campaign/`, {
      method: "POST",
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Unable to send campaign.");
    }

    return response.json();
  },
  async sendCampaignTest(id: number, email: string) {
    const response = await authFetch(`${NEWSLETTER_URL}campaigns/${id}/send_test/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Unable to send test email.");
    }
    return response.json();
  },
};

