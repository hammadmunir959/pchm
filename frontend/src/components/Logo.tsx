import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useLandingPageConfig } from "@/hooks/useLandingPageConfig";

interface LogoProps {
  className?: string;
  lightClassName?: string;
  darkClassName?: string;
  alt?: string;
  width?: string | number;
  height?: string | number;
}

export const Logo = ({
  className = "",
  lightClassName = "",
  darkClassName = "",
  alt = "Prestige Car Hire",
  width,
  height,
}: LogoProps) => {
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { config } = useLandingPageConfig();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine current theme
  const currentTheme = theme === "system" ? systemTheme : theme;
  const isDark = mounted && currentTheme === "dark";

  // Get logo URLs - use CMS logos if available, otherwise fall back to defaults
  const lightLogoUrl = config?.logo_light_url || "/pchm-logo.svg";
  const darkLogoUrl = config?.logo_dark_url || "/pchm-logo-black.svg";

  // Use CMS logos if at least one is available, otherwise use defaults
  const hasAnyCustomLogo = config?.logo_light_url || config?.logo_dark_url;

  if (hasAnyCustomLogo) {
    // Use CMS uploaded logos (or defaults for missing ones) with theme switching
    return (
      <div className={`relative ${className}`} style={{ width, height }}>
        <img
          src={lightLogoUrl}
          alt={alt}
          className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-300 ${
            isDark ? "opacity-0" : "opacity-100"
          } ${lightClassName}`}
        />
        <img
          src={darkLogoUrl}
          alt={alt}
          className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-300 ${
            isDark ? "opacity-100" : "opacity-0"
          } ${darkClassName}`}
        />
        <span className="sr-only">{alt}</span>
      </div>
    );
  }

  // Fallback to default logos
  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      {mounted && (
        <>
          <img
            src="/pchm-logo-black.svg"
            alt={alt}
            className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-300 ${
              isDark ? "opacity-0" : "opacity-100"
            } ${lightClassName}`}
          />
          <img
            src="/pchm-logo.svg"
            alt={alt}
            className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-300 ${
              isDark ? "opacity-100" : "opacity-0"
            } ${darkClassName}`}
          />
        </>
      )}
      <span className="sr-only">{alt}</span>
    </div>
  );
};

