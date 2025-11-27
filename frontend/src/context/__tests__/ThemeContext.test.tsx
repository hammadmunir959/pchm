import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../ThemeContext';
import { themeApi } from '../../services/themeApi';

// Mock themeApi
vi.mock('../../services/themeApi', () => ({
  themeApi: {
    getActiveTheme: vi.fn(),
  },
}));

describe('ThemeContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear document body classes
    document.body.className = '';
    // Clear CSS variables
    document.documentElement.style.removeProperty('--theme-primary');
    document.documentElement.style.removeProperty('--theme-secondary');
  });

  it('should provide theme context', async () => {
    const mockTheme = {
      theme_key: 'christmas',
      theme: {
        name: 'Christmas',
        primary_color: '#C4122E',
        secondary_color: '#0B6B3A',
        banner: 'themes/christmas/banner.jpg',
        icons_path: 'themes/christmas/icons/',
        animations: ['snow'],
        popup: null,
      },
      event: null,
    };

    (themeApi.getActiveTheme as any).mockResolvedValueOnce(mockTheme);

    const TestComponent = () => {
      const { theme, loading } = useTheme();
      if (loading) return <div>Loading...</div>;
      return <div>{theme?.theme.name}</div>;
    };

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Christmas')).toBeInTheDocument();
    });
  });

  it('should apply CSS variables when theme loads', async () => {
    const mockTheme = {
      theme_key: 'christmas',
      theme: {
        name: 'Christmas',
        primary_color: '#C4122E',
        secondary_color: '#0B6B3A',
        banner: '',
        icons_path: '',
        animations: [],
        popup: null,
      },
      event: null,
    };

    (themeApi.getActiveTheme as any).mockResolvedValueOnce(mockTheme);

    render(
      <ThemeProvider>
        <div>Test</div>
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(document.documentElement.style.getPropertyValue('--theme-primary')).toBe('#C4122E');
      expect(document.documentElement.style.getPropertyValue('--theme-secondary')).toBe('#0B6B3A');
      expect(document.body.classList.contains('theme-christmas')).toBe(true);
    });
  });

  it('should handle errors gracefully', async () => {
    (themeApi.getActiveTheme as any).mockRejectedValueOnce(new Error('API Error'));

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ThemeProvider>
        <div>Test</div>
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });

    // Should apply default theme on error
    await waitFor(() => {
      expect(document.body.classList.contains('theme-default')).toBe(true);
    });

    consoleSpy.mockRestore();
  });
});

