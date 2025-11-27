import React from 'react';
import { useTheme } from '@/context/ThemeContext';

const ThemeBanner: React.FC = () => {
  const { theme, loading } = useTheme();

  if (loading || !theme) {
    return null;
  }

  const bannerPath = theme.theme.banner;
  if (!bannerPath || bannerPath.trim() === '') {
    return null;
  }

  const bannerUrl = bannerPath.startsWith('http')
    ? bannerPath
    : `${window.location.origin}/static/${bannerPath}`;

  // Get theme colors for text overlay if needed
  const textColor = theme.theme.text_color || '#ffffff';
  const backgroundColor = theme.theme.background_color || '#000000';

  return (
    <div className="theme-banner w-full relative">
      <img
        src={bannerUrl}
        alt={theme.theme.name}
        className="w-full h-auto object-cover"
        onError={(e) => {
          // Hide on error
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
    </div>
  );
};

export default ThemeBanner;

