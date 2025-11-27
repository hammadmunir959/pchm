import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { Logo } from "@/components/Logo";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const location = useLocation();
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const isDark = theme === "dark";

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Our People", path: "/our-people" },
    { name: "Our Fleet", path: "/our-fleet" },
    { name: "Car Sales", path: "/car-sales" },
    { name: "Testimonials", path: "/testimonials" },
    { name: "News", path: "/news" },
    { name: "Contact Us", path: "/contact" },
  ];

  const whatWeDoSubLinks = [
    { name: "Personal Assistance", path: "/personal-assistance" },
    { name: "Introducer Support", path: "/introducer-support" },
    { name: "Insurance Services", path: "/insurance-services" },
  ];

  return (
    <nav className="sticky top-0 z-50 shadow-lg">
      <div className="bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center space-x-3 animate-slideInLeft">
            <Logo className="h-[150px] w-[250px]" alt="Prestige Car Hire" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-4">
            {/* First two links */}
            {navLinks.slice(0, 2).map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-4 py-2 rounded-md text-base font-medium hover:text-accent transition-colors ${
                    isActive ? "text-accent" : ""
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
            
            {/* What We Do Dropdown - Third Position */}
            <div
              className="relative"
              onMouseEnter={() => {
                if (closeTimeoutRef.current) {
                  clearTimeout(closeTimeoutRef.current);
                  closeTimeoutRef.current = null;
                }
                setIsDropdownOpen(true);
              }}
              onMouseLeave={() => {
                if (closeTimeoutRef.current) {
                  clearTimeout(closeTimeoutRef.current);
                }
                closeTimeoutRef.current = setTimeout(() => {
                  setIsDropdownOpen(false);
                }, 200);
              }}
            >
              <Link
                to="/what-we-do"
                className={`px-4 py-2 rounded-md text-base font-medium hover:text-accent transition-colors focus:outline-none ${
                  location.pathname === "/what-we-do" || whatWeDoSubLinks.some(link => location.pathname === link.path) ? "text-accent" : ""
                }`}
              >
                <div className="flex items-center gap-1">
                  What We Do
                  <ChevronDown className="h-4 w-4" />
                </div>
              </Link>
              <div
                className={`absolute left-0 top-full mt-2 w-56 rounded-md border border-border bg-popover text-popover-foreground shadow-lg transition-all duration-200 ${
                  isDropdownOpen
                    ? "opacity-100 visible translate-y-0 pointer-events-auto"
                    : "opacity-0 invisible -translate-y-2 pointer-events-none"
                }`}
              >
                {whatWeDoSubLinks.map((link) => {
                  const isActive = location.pathname === link.path;
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`block px-4 py-2 text-base transition-colors hover:text-accent ${
                        isActive ? "text-accent" : ""
                      }`}
                    >
                      {link.name}
                    </Link>
                  );
                })}
              </div>
            </div>
            
            {/* Remaining links */}
            {navLinks.slice(2).map((link) => {
              const isActive = location.pathname === link.path;
              return (
              <Link
                key={link.path}
                to={link.path}
                  className={`px-4 py-2 rounded-md text-base font-medium hover:text-accent transition-colors ${
                    isActive ? "text-accent" : ""
                  }`}
              >
                {link.name}
              </Link>
              );
            })}
            
            {mounted && (
              <Button
                variant="outline"
                size="icon"
                onClick={toggleTheme}
                className="ml-4 hidden lg:inline-flex border-border text-foreground hover:bg-muted hover:text-foreground"
                aria-label="Toggle theme"
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            )}

            <Link to="/make-claim">
              <Button variant="default" className="ml-4 bg-accent text-accent-foreground hover:bg-accent/90 text-base font-medium px-6 py-2">
                Make a Claim
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 rounded-md hover:text-accent transition-colors"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="lg:hidden pb-4 space-y-3">
            {/* First two links */}
            {navLinks.slice(0, 2).map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`block px-4 py-3 rounded-md text-base font-medium hover:text-accent transition-colors ${
                    isActive ? "text-accent" : ""
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
            
            {/* What We Do Section in Mobile - Third Position */}
            <Link
              to="/what-we-do"
              onClick={() => setIsOpen(false)}
              className={`block px-4 py-3 rounded-md text-base font-medium hover:text-accent transition-colors ${
                location.pathname === "/what-we-do" ? "text-accent" : ""
              }`}
            >
              What We Do
            </Link>
            {whatWeDoSubLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`block px-8 py-3 rounded-md text-base font-medium hover:text-accent transition-colors ${
                    isActive ? "text-accent" : ""
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
            
            {/* Remaining links */}
            {navLinks.slice(2).map((link) => {
              const isActive = location.pathname === link.path;
              return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                  className={`block px-4 py-3 rounded-md text-base font-medium hover:text-accent transition-colors ${
                    isActive ? "text-accent" : ""
                  }`}
              >
                {link.name}
              </Link>
              );
            })}

            {mounted && (
              <Button
                variant="outline"
                onClick={toggleTheme}
                className="w-full border-border text-foreground hover:bg-muted hover:text-foreground"
              >
                <span className="flex items-center justify-center gap-2">
                  {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
                </span>
              </Button>
            )}
            
            <Link to="/make-claim" onClick={() => setIsOpen(false)}>
              <Button variant="default" className="w-full bg-accent text-accent-foreground hover:bg-accent/90 text-base font-medium py-3">
                Make a Claim
              </Button>
            </Link>
          </div>
        )}
      </div>
      </div>
    </nav>
  );
};

export default Navigation;
