import { useEffect, useState } from "react";
import { landingPageApi, LandingPageConfig } from "@/services/landingPageApi";

export const useLandingPageConfig = () => {
  const [config, setConfig] = useState<LandingPageConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await landingPageApi.getConfig();
        setConfig(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to load config"));
        // Set default config on error
        setConfig(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadConfig();
  }, []);

  return { config, isLoading, error };
};


