import { withBasePath } from "./apiConfig";
import { authFetch } from "./authFetch";
import { normalizeListResponse } from "./responseUtils";

const BLOG_URL = withBasePath("/blog-posts/");

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

export interface BlogPostPayload {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  status: "draft" | "published" | "archived";
  featuredImageFile?: File | null;
}

export const adminBlogApi = {
  async list(params: Record<string, string | number | undefined> = {}): Promise<BlogPost[]> {
    const url = new URL(BLOG_URL);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.append(key, String(value));
      }
    });

    const response = await authFetch(url.toString());
    if (!response.ok) {
      throw new Error("Unable to load blog posts.");
    }

    const data = await response.json();
    return normalizeListResponse<BlogPost>(data, "Unexpected blog posts response format.");
  },

  async create(payload: BlogPostPayload) {
    const formData = new FormData();
    formData.append("title", payload.title);
    formData.append("slug", payload.slug);
    formData.append("content", payload.content);
    formData.append("excerpt", payload.excerpt);
    formData.append("status", payload.status);
    if (payload.featuredImageFile) {
      formData.append("featured_image", payload.featuredImageFile);
    }

    const response = await authFetch(BLOG_URL, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Unable to create blog post.");
    }

    return response.json();
  },

  async update(id: number, payload: Partial<BlogPostPayload>) {
    const formData = new FormData();

    if (payload.title) formData.append("title", payload.title);
    if (payload.slug) formData.append("slug", payload.slug);
    if (payload.content) formData.append("content", payload.content);
    if (payload.excerpt) formData.append("excerpt", payload.excerpt);
    if (payload.status) formData.append("status", payload.status);
    if (payload.featuredImageFile) {
      formData.append("featured_image", payload.featuredImageFile);
    }

    const response = await authFetch(`${BLOG_URL}${id}/`, {
      method: "PATCH",
      body: formData,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Unable to update blog post.");
    }

    return response.json();
  },

  async delete(id: number) {
    const response = await authFetch(`${BLOG_URL}${id}/`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Unable to delete blog post.");
    }

    return true;
  },
};

