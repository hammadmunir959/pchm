import { describe, it, expect, vi, beforeEach } from 'vitest';
import { themeApi } from '../themeApi';

// Mock fetch globally
global.fetch = vi.fn();

describe('themeApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch active theme successfully', async () => {
    const mockTheme = {
      theme_key: 'christmas',
      theme: {
        name: 'Christmas',
        primary_color: '#C4122E',
        secondary_color: '#0B6B3A',
        banner: 'themes/christmas/banner.jpg',
        icons_path: 'themes/christmas/icons/',
        animations: ['snow'],
        popup: {
          title: 'Merry Christmas!',
          content: 'Enjoy our festive offers 🎄'
        }
      },
      event: {
        name: 'Christmas Event',
        slug: 'christmas-2024'
      }
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockTheme,
    });

    const result = await themeApi.getActiveTheme();
    expect(result).toEqual(mockTheme);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/theming/active-theme/'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      })
    );
  });

  it('should throw error when fetch fails', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    await expect(themeApi.getActiveTheme()).rejects.toThrow('Failed to fetch active theme');
  });

  it('should handle network errors', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    await expect(themeApi.getActiveTheme()).rejects.toThrow('Network error');
  });
});

