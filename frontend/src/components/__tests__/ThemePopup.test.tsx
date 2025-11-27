import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import ThemePopup from '../ThemePopup';
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

describe('ThemePopup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear sessionStorage
    sessionStorage.clear();
    // Mock timers
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    sessionStorage.clear();
  });

  it('should not render when theme has no popup', () => {
    const { useTheme } = require('../../context/ThemeContext');
    useTheme.mockReturnValue({
      theme: {
        theme_key: 'default',
        theme: {
          popup: null,
        },
      },
      loading: false,
    });

    const { container } = render(
      <ThemeProvider>
        <ThemePopup />
      </ThemeProvider>
    );

    expect(container.firstChild).toBeNull();
  });

  it('should show popup when theme has popup and not shown before', async () => {
    const { useTheme } = require('../../context/ThemeContext');
    useTheme.mockReturnValue({
      theme: {
        theme_key: 'christmas',
        theme: {
          popup: {
            title: 'Merry Christmas!',
            content: 'Enjoy our festive offers 🎄',
          },
        },
      },
      loading: false,
    });

    render(
      <ThemeProvider>
        <ThemePopup />
      </ThemeProvider>
    );

    // Fast-forward timer
    vi.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(screen.getByText('Merry Christmas!')).toBeInTheDocument();
      expect(screen.getByText('Enjoy our festive offers 🎄')).toBeInTheDocument();
    });

    // Check sessionStorage
    expect(sessionStorage.getItem('theme_popup_christmas')).toBe('true');
  });

  it('should not show popup if already shown in session', () => {
    // Set sessionStorage
    sessionStorage.setItem('theme_popup_christmas', 'true');

    const { useTheme } = require('../../context/ThemeContext');
    useTheme.mockReturnValue({
      theme: {
        theme_key: 'christmas',
        theme: {
          popup: {
            title: 'Merry Christmas!',
            content: 'Enjoy our festive offers 🎄',
          },
        },
      },
      loading: false,
    });

    const { container } = render(
      <ThemeProvider>
        <ThemePopup />
      </ThemeProvider>
    );

    // Fast-forward timer
    vi.advanceTimersByTime(1000);

    expect(container.firstChild).toBeNull();
  });
});

