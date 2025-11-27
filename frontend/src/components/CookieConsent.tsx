import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "cookie-consent";
const POPUP_CLOSED_EVENT = "service-popup-closed";

type ConsentValue = "accepted" | "rejected";

const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const maybeShowBanner = () => {
      const stored = window.localStorage.getItem(STORAGE_KEY) as ConsentValue | null;
      if (!stored) {
        setIsVisible(true);
      }
    };

    const delayedTimer = window.setTimeout(maybeShowBanner, 2200);
    window.addEventListener(POPUP_CLOSED_EVENT, maybeShowBanner);

    return () => {
      window.clearTimeout(delayedTimer);
      window.removeEventListener(POPUP_CLOSED_EVENT, maybeShowBanner);
    };
  }, []);

  const handleConsent = (value: ConsentValue) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, value);
    setIsVisible(false);
  };

  const handleCustomize = () => {
    alert("Customization options coming soon!");
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50">
      <div className="mx-auto mb-4 w-[95vw] max-w-4xl rounded-2xl border border-border bg-popover/95 p-5 shadow-2xl backdrop-blur transition-colors">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">We value your privacy</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              We use cookies to enhance your browsing experience, serve personalised content, and analyse our
              traffic. Manage your preferences or accept all to continue.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button
              variant="outline"
              onClick={handleCustomize}
              className="w-full sm:w-auto"
            >
              Customise
            </Button>
            <Button
              variant="outline"
              onClick={() => handleConsent("rejected")}
              className="w-full sm:w-auto"
            >
              Reject All
            </Button>
            <Button
              onClick={() => handleConsent("accepted")}
              className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90"
            >
              Accept All
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;

