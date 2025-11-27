import { withBasePath } from './apiConfig';
import { authFetch } from './authFetch';

export interface ThemeConfig {
  name: string;
  primary_color: string;
  secondary_color: string;
  background_color?: string;
  text_color?: string;
  accent_color?: string;
  banner: string;
  hero_background?: string;
  icons_path: string;
  animations: string[];
  popup: {
    title: string;
    content: string;
  } | null;
  landing_popup?: {
    enabled: boolean;
    title: string;
    subtitle: string;
    description: string;
    button_text: string;
    image_url?: string;
    overlay_text?: string;
  } | null;
}

export interface ThemeEvent {
  id?: number;
  name: string;
  slug: string;
  start_date: string;
  end_date: string;
  theme_key: string;
  is_active?: boolean;
}

export interface Theme {
  key: string;
  name: string;
  config: ThemeConfig;
  event?: ThemeEvent | null;
  is_custom?: boolean;
}

export interface ActiveThemeResponse {
  theme_key: string;
  theme: ThemeConfig;
  event: {
    name: string;
    slug: string;
  } | null;
  preview?: boolean;
}

export const themeApi = {
  async getActiveTheme(): Promise<ActiveThemeResponse> {
    const response = await fetch(withBasePath('/theming/active-theme/'), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      credentials: 'include', // Include cookies for session
    });

    if (!response.ok) {
      throw new Error('Failed to fetch active theme');
    }

    return response.json();
  },

  async setPreviewTheme(themeKey: string | null): Promise<{ success: boolean; message: string; theme_key: string | null }> {
    const response = await authFetch(withBasePath('/theming/preview-theme/'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      credentials: 'include', // Include cookies for session
      body: JSON.stringify({ theme_key: themeKey || '' }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to set preview theme');
    }

    return response.json();
  },

  // List all themes
  async listThemes(): Promise<Theme[]> {
    const response = await authFetch(withBasePath('/theming/themes/'), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch themes');
    }

    return response.json();
  },

  // Get a specific theme
  async getTheme(themeKey: string): Promise<Theme> {
    const response = await authFetch(withBasePath(`/theming/themes/${themeKey}/`), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch theme');
    }

    return response.json();
  },

  // Create theme
  async createTheme(themeData: {
    key: string;
    name: string;
    primary_color: string;
    secondary_color: string;
    background_color?: string;
    text_color?: string;
    accent_color?: string;
    banner?: string;
    hero_background?: string;
    icons_path?: string;
    animations?: string[];
    popup_title?: string;
    popup_content?: string;
    landing_popup_enabled?: boolean;
    landing_popup_title?: string;
    landing_popup_subtitle?: string;
    landing_popup_description?: string;
    landing_popup_button_text?: string;
    landing_popup_image_url?: string;
    landing_popup_overlay_text?: string;
  }): Promise<Theme> {
    const response = await authFetch(withBasePath('/theming/themes/'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(themeData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create theme');
    }

    const data = await response.json();
    return {
      key: data.key,
      name: data.name,
      config: data.config,
      is_custom: data.is_custom,
    };
  },

  // Update theme configuration
  async updateTheme(themeKey: string, config: Partial<ThemeConfig>): Promise<Theme> {
    const response = await authFetch(withBasePath(`/theming/themes/${themeKey}/`), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update theme');
    }

    return response.json();
  },

  // List theme events
  async listEvents(): Promise<ThemeEvent[]> {
    const response = await authFetch(withBasePath('/theming/events/'), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch events');
    }

    return response.json();
  },

  // Create theme event
  async createEvent(event: Omit<ThemeEvent, 'id'>): Promise<ThemeEvent> {
    const response = await authFetch(withBasePath('/theming/events/'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create event');
    }

    return response.json();
  },

  // Update theme event
  async updateEvent(eventId: number, event: Partial<ThemeEvent>): Promise<ThemeEvent> {
    const response = await authFetch(withBasePath(`/theming/events/${eventId}/`), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update event');
    }

    return response.json();
  },

  // Delete theme event
  async deleteEvent(eventId: number): Promise<void> {
    const response = await authFetch(withBasePath(`/theming/events/${eventId}/`), {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete event');
    }
  },
};

