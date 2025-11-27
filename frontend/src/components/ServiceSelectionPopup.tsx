import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/context/ThemeContext";
import heroCarImage from "@/assets/hero-car.jpg";

const POPUP_CLOSED_EVENT = "service-popup-closed";

const ServiceSelectionPopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { theme } = useTheme();

  // Get landing popup settings from theme, or use defaults
  const landingPopup = theme?.theme.landing_popup;
  const isEnabled = landingPopup?.enabled ?? true; // Default to enabled if not set
  const popupTitle = landingPopup?.title || "Had an Accident?";
  const popupSubtitle = landingPopup?.subtitle || "Get a Replacement Car Now!";
  const popupDescription = landingPopup?.description || "Don't wait. Prestige Car Hire Management LTD provides stress-free, fast replacement vehicles while we manage your insurance claim. We're here to help you get back on the road.";
  const popupButtonText = landingPopup?.button_text || "Report an Accident & Start Claim (Fast 5 Mins)";
  const popupImage = landingPopup?.image_url || heroCarImage;
  const popupOverlayText = landingPopup?.overlay_text || "Fast & Reliable Replacement Vehicles Available 24/7";

  useEffect(() => {
    // Only show popup if enabled in theme settings
    if (isEnabled) {
      setTimeout(() => {
        setIsOpen(true);
      }, 500);
    }
  }, [isEnabled]);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);

    if (!open && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(POPUP_CLOSED_EVENT));
    }
  };

  const handleClaimClick = () => {
    handleOpenChange(false);
    navigate("/make-claim");
  };

  // Don't render if disabled
  if (!isEnabled) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[92vw] sm:w-auto sm:max-w-2xl p-0 bg-accent border-0 shadow-2xl [&>button]:hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Service selection</DialogTitle>
          <DialogDescription>Choose how you would like to start your accident claim.</DialogDescription>
        </DialogHeader>
        <div className="relative">
          {/* Custom Close button - positioned absolutely */}
          <button
            onClick={() => handleOpenChange(false)}
            className="absolute right-3 top-3 z-20 rounded-sm opacity-70 hover:opacity-100 transition-opacity text-accent-foreground hover:bg-accent-foreground/10 p-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          {/* Content */}
          <div className="p-5 sm:p-6">
            {/* Headline */}
            <div className="text-center mb-4 space-y-1.5">
              <h2 className="text-xl sm:text-2xl font-bold text-accent-foreground leading-tight">
                {popupTitle}
              </h2>
              <p className="text-lg sm:text-xl text-accent-foreground leading-tight">
                {popupSubtitle}
              </p>
            </div>

            {/* Description */}
            <p className="text-accent-foreground/90 text-sm sm:text-base mb-5 leading-relaxed text-center">
              {popupDescription}
            </p>

            {/* Car Image with Text Overlay */}
            <div className="mb-5 sm:mb-6 rounded-lg overflow-hidden relative">
              <img
                src={popupImage}
                alt="Replacement car"
                className="w-full h-48 sm:h-auto object-cover"
              />
              {/* Semi-transparent overlay box */}
              {popupOverlayText && (
                <div className="absolute bottom-3 left-3 right-3 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 sm:py-3">
                  <p className="text-white text-xs sm:text-sm font-medium text-center">
                    {popupOverlayText}
                  </p>
                </div>
              )}
            </div>

            {/* CTA Button */}
            <div className="flex justify-center">
              <Button
                onClick={handleClaimClick}
                className="bg-accent-foreground text-accent hover:bg-accent-foreground/90 text-sm sm:text-base font-semibold px-4 py-3 sm:px-6 sm:py-4 rounded-lg w-full sm:w-auto"
              >
                {popupButtonText}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ServiceSelectionPopup;

