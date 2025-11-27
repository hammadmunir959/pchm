/**
 * Maps page paths to friendly, human-readable page names
 */
export const getPageName = (path: string, title?: string): string => {
  // If title is provided and not empty, use it
  if (title && title.trim()) {
    return title;
  }

  // Normalize path
  const normalizedPath = path.toLowerCase().trim();

  // Map common paths to friendly names
  const pageNameMap: Record<string, string> = {
    // Homepage
    '/': 'Home Page',
    '/index': 'Home Page',
    '/home': 'Home Page',

    // Main pages
    '/make-claim': 'Make a Claim',
    '/contact': 'Contact Us',
    '/our-people': 'Our People',
    '/our-fleet': 'Our Fleet',
    '/car-sales': 'Car Sales',
    '/what-we-do': 'What We Do',
    '/testimonials': 'Testimonials',
    '/testimonial-form': 'Testimonial Form',
    '/news': 'News & Blog',
    '/blog': 'News & Blog',

    // Services
    '/personal-assistance': 'Personal Assistance',
    '/introducer-support': 'Introducer Support',
    '/insurance-services': 'Insurance Services',

    // Admin pages (if tracked)
    '/admin/login': 'Admin Login',
    '/admin/dashboard': 'Admin Dashboard',
    '/admin/register': 'Admin Register',

    // Common patterns
    '/about': 'About Us',
    '/services': 'Services',
    '/gallery': 'Gallery',
    '/faq': 'FAQ',
    '/privacy': 'Privacy Policy',
    '/terms': 'Terms & Conditions',
  };

  // Direct match
  if (pageNameMap[normalizedPath]) {
    return pageNameMap[normalizedPath];
  }

  // Check for partial matches (e.g., /news/123)
  for (const [key, value] of Object.entries(pageNameMap)) {
    if (normalizedPath.startsWith(key)) {
      // For dynamic routes, try to extract meaningful info
      if (normalizedPath.includes('/news/') || normalizedPath.includes('/blog/')) {
        return 'News Article';
      }
      if (normalizedPath.includes('/car-sales/')) {
        return 'Car Listing';
      }
      return value;
    }
  }

  // Try to extract from path segments
  const segments = normalizedPath.split('/').filter(Boolean);
  if (segments.length > 0) {
    // Capitalize and format the last segment
    const lastSegment = segments[segments.length - 1];
    const formatted = lastSegment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    return formatted;
  }

  // Fallback: return the path itself, cleaned up
  return path
    .split('/')
    .filter(Boolean)
    .map(segment =>
      segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    )
    .join(' > ') || 'Unknown Page';
};


