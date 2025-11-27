import { withBasePath } from "./apiConfig";
import { authFetch } from "./authFetch";
import type { TeamMember } from "./teamMembersApi";

const TEAM_MEMBERS_URL = withBasePath("/cms/team-members/");

export interface CreateTeamMemberData {
  name: string;
  role: string;
  description: string;
  image?: File | null;
  order?: number;
  is_active?: boolean;
}

export interface UpdateTeamMemberData extends Partial<CreateTeamMemberData> {}

export const adminTeamMembersApi = {
  /**
   * Get all team members (admin endpoint - includes inactive)
   */
  async list(): Promise<TeamMember[]> {
    const response = await authFetch(TEAM_MEMBERS_URL);
    if (!response.ok) {
      throw new Error("Unable to load team members.");
    }
    return response.json();
  },

  /**
   * Get a single team member by ID
   */
  async get(id: number): Promise<TeamMember> {
    const response = await authFetch(`${TEAM_MEMBERS_URL}${id}/`);
    if (!response.ok) {
      throw new Error("Unable to load team member.");
    }
    return response.json();
  },

  /**
   * Create a new team member
   */
  async create(data: CreateTeamMemberData): Promise<TeamMember> {
    const isFormData = data.image instanceof File;
    const body = isFormData
      ? (() => {
          const formData = new FormData();
          formData.append("name", data.name);
          formData.append("role", data.role);
          formData.append("description", data.description);
          if (data.image) {
            formData.append("image", data.image);
          }
          if (data.order !== undefined) {
            formData.append("order", data.order.toString());
          }
          if (data.is_active !== undefined) {
            formData.append("is_active", data.is_active.toString());
          }
          return formData;
        })()
      : JSON.stringify({
          name: data.name,
          role: data.role,
          description: data.description,
          order: data.order ?? 0,
          is_active: data.is_active ?? true,
        });

    const response = await authFetch(TEAM_MEMBERS_URL, {
      method: "POST",
      headers: isFormData ? {} : { "Content-Type": "application/json" },
      body,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Unable to create team member.");
    }
    return response.json();
  },

  /**
   * Update an existing team member
   */
  async update(id: number, data: UpdateTeamMemberData): Promise<TeamMember> {
    const isFormData = data.image instanceof File;
    const body = isFormData
      ? (() => {
          const formData = new FormData();
          if (data.name !== undefined) {
            formData.append("name", data.name);
          }
          if (data.role !== undefined) {
            formData.append("role", data.role);
          }
          if (data.description !== undefined) {
            formData.append("description", data.description);
          }
          if (data.image) {
            formData.append("image", data.image);
          }
          if (data.order !== undefined) {
            formData.append("order", data.order.toString());
          }
          if (data.is_active !== undefined) {
            formData.append("is_active", data.is_active.toString());
          }
          return formData;
        })()
      : JSON.stringify(data);

    const response = await authFetch(`${TEAM_MEMBERS_URL}${id}/`, {
      method: "PATCH",
      headers: isFormData ? {} : { "Content-Type": "application/json" },
      body,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Unable to update team member.");
    }
    return response.json();
  },

  /**
   * Delete a team member
   */
  async delete(id: number): Promise<void> {
    const response = await authFetch(`${TEAM_MEMBERS_URL}${id}/`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Unable to delete team member.");
    }
  },
};

