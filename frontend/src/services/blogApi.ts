import { withBasePath } from "./apiConfig";
import { normalizeListResponse } from "./responseUtils";

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  status: "draft" | "published" | "archived";
  featured_image_url?: string | null;
  author_name?: string | null;
  published_at?: string | null;
  created_at?: string;
}

const BLOG_POSTS_URL = withBasePath("/blog-posts/");

export const blogApi = {
  async list(params: Record<string, string | number | undefined> = {}): Promise<BlogPost[]> {
    const url = new URL(BLOG_POSTS_URL);
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
      throw new Error("Unable to load blog posts right now.");
    }

    const data = await response.json();
    return normalizeListResponse<BlogPost>(data, "Unexpected blog posts response format.");
  },
};


