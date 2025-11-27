import React from "react";

interface AnimatedSectionProps {
  children: React.ReactNode;
  delay?: number; // delay in milliseconds (converted to seconds for CSS)
  className?: string;
}

/**
 * AnimatedSection: Wraps content with a fade-in-up animation on page load.
 * @param children - Content to animate
 * @param delay - Optional delay in milliseconds (default: 0)
 * @param className - Additional Tailwind classes to apply
 */
const AnimatedSection: React.FC<AnimatedSectionProps> = ({
  children,
  delay = 0,
  className = "",
}) => {
  const delaySeconds = delay / 1000;

  return (
    <div
      className={`animate-fadeInUp ${className}`}
      style={{ animationDelay: `${delaySeconds}s` }}
    >
      {children}
    </div>
  );
};

export default AnimatedSection;
