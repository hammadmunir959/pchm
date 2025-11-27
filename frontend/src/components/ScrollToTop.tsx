import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { ArrowUp } from "lucide-react";

const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const location = useLocation();

  // Handle scroll event and calculate progress
  useEffect(() => {
    const handleScroll = () => {
      // Calculate scroll progress (0 to 100)
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

      setScrollProgress(progress);

      // Show button if scrolled more than 300px
      setIsVisible(scrollTop > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  }, [location.pathname]);

  // Smooth scroll to top
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // SVG circle circumference
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (scrollProgress / 100) * circumference;

  return (
    <button
      onClick={scrollToTop}
      className={`fixed bottom-8 right-8 z-40 w-12 h-12 transition-opacity duration-300 ${
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      aria-label="Scroll to top"
      title="Back to top"
    >
      {/* Circular progress background */}
      <svg
        width="48"
        height="48"
        viewBox="0 0 48 48"
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx="24"
          cy="24"
          r="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-muted-foreground opacity-20"
        />

        {/* Progress circle (fills as you scroll) */}
        <circle
          cx="24"
          cy="24"
          r="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-accent transition-all duration-200"
          strokeDasharray={113.1}
          strokeDashoffset={113.1 - (scrollProgress / 100) * 113.1}
          strokeLinecap="round"
        />
      </svg>

      {/* Arrow icon in center */}
      <div className="absolute inset-0 flex items-center justify-center">
        <ArrowUp className="w-3.5 h-3.5 text-accent" strokeWidth={3} />
      </div>
    </button>
  );
};

export default ScrollToTop;
