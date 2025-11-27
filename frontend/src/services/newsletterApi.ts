import { withBasePath } from "./apiConfig";

const NEWSLETTER_PUBLIC_URL = withBasePath("/newsletter/");

export const newsletterApi = {
  async subscribe(email: string, name?: string, source: string = "website"): Promise<{ message: string }> {
    const response = await fetch(`${NEWSLETTER_PUBLIC_URL}subscribe/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ email, name, source }),
      credentials: "include",
    });

    const text = await response.text();
    let data: any = {};
    try { data = text ? JSON.parse(text) : {}; } catch { /* ignore */ }

    if (!response.ok) {
      const err = (data && (data.error || data.detail)) || text || "Subscription failed.";
      throw new Error(err);
    }

    return data as { message: string };
  },
  async unsubscribe(email: string): Promise<{ message: string }> {
    const response = await fetch(`${NEWSLETTER_PUBLIC_URL}unsubscribe/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ email }),
      credentials: "include",
    });
    const text = await response.text();
    let data: any = {};
    try { data = text ? JSON.parse(text) : {}; } catch { /* ignore */ }
    if (!response.ok) {
      const err = (data && (data.error || data.detail)) || text || "Unsubscribe failed.";
      throw new Error(err);
    }
    return data as { message: string };
  },
};
