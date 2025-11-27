import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ThemeBanner from '../ThemeBanner';
import { ThemeProvider } from '../../context/ThemeContext';
import { themeApi } from '../../services/themeApi';

// Mock themeApi
vi.mock('../../services/themeApi', () => ({
  themeApi: {
    getActiveTheme: vi.fn(),
  },
}));

// Mock useTheme hook
vi.mock('../../context/ThemeContext', async () => {
  const actual = await vi.importActual('../../context/ThemeContext');
  return {
    ...actual,
    useTheme: vi.fn(),
  };
});

describe('ThemeBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when loading', () => {
    const { useTheme } = require('../../context/ThemeContext');
    useTheme.mockReturnValue({
      theme: null,
      loading: true,
      error: null,
      refreshTheme: vi.fn(),
    });

    const { container } = render(
      <ThemeProvider>
        <ThemeBanner />
      </ThemeProvider>
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render banner image when theme is loaded', () => {
    const { useTheme } = require('../../context/ThemeContext');
    useTheme.mockReturnValue({
      theme: {
        theme_key: 'christmas',
        theme: {
          name: 'Christmas',
          banner: 'themes/christmas/banner.jpg',
        },
      },
      loading: false,
      error: null,
      refreshTheme: vi.fn(),
    });

    render(
      <ThemeProvider>
        <ThemeBanner />
      </ThemeProvider>
    );

    const img = screen.getByAltText('Christmas');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', expect.stringContaining('themes/christmas/banner.jpg'));
  });

  it('should hide image on error', () => {
    const { useTheme } = require('../../context/ThemeContext');
    useTheme.mockReturnValue({
      theme: {
        theme_key: 'christmas',
        theme: {
          name: 'Christmas',
          banner: 'themes/christmas/banner.jpg',
        },
      },
      loading: false,
      error: null,
      refreshTheme: vi.fn(),
    });

    render(
      <ThemeProvider>
        <ThemeBanner />
      </ThemeProvider>
    );

    const img = screen.getByAltText('Christmas') as HTMLImageElement;
    
    // Simulate image error
    const errorEvent = new Event('error');
    img.dispatchEvent(errorEvent);

    // Image should be hidden (display: none)
    expect(img.style.display).toBe('none');
  });
});

