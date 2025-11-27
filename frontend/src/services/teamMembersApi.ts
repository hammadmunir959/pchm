import { withBasePath } from "./apiConfig";
import { authFetch } from "./authFetch";

const TEAM_MEMBERS_URL = withBasePath("/cms/team-members/");

export interface TeamMember {
  id: number;
  name: string;
  role: string;
  description: string;
  image?: File | null;
  image_url?: string | null;
  order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const teamMembersApi = {
  /**
   * Get all active team members (public endpoint)
   */
  async list(): Promise<TeamMember[]> {
    const response = await fetch(TEAM_MEMBERS_URL);
    if (!response.ok) {
      throw new Error("Unable to load team members.");
    }
    return response.json();
  },

  /**
   * Get a single team member by ID (public endpoint)
   */
  async get(id: number): Promise<TeamMember> {
    const response = await fetch(`${TEAM_MEMBERS_URL}${id}/`);
    if (!response.ok) {
      throw new Error("Unable to load team member.");
    }
    return response.json();
  },
};

