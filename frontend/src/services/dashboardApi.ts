import { withBasePath } from "./apiConfig";
import { authFetch } from "./authFetch";

const DASHBOARD_ANALYTICS_BASE = withBasePath("/analytics/dashboard");

const buildEndpoint = (suffix: string) =>
  `${DASHBOARD_ANALYTICS_BASE}${suffix.startsWith("/") ? suffix : `/${suffix}`}`;

const fetchDashboardData = async <T>(suffix: string): Promise<T> => {
  const response = await authFetch(buildEndpoint(suffix), {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to load dashboard data.");
  }

  return response.json() as Promise<T>;
};

// Types for API responses
export interface SummaryStats {
  totalVehicles: number;
  totalBookings: number;
  inquiries: number;
  testimonials: number;
  carListings?: number;
  purchaseRequests?: number;
  galleryImages?: number;
  newsletterSubscribers?: number;
  faqItems?: number;
  pageViewsToday?: number;
  pageViewsWeek?: number;
  pageViewsMonth?: number;
  uniqueVisitorsToday?: number;
  uniqueVisitorsWeek?: number;
  uniqueVisitorsMonth?: number;
}

export interface BookingTrend {
  month: string;
  bookings: number;
  inquiries: number;
  purchaseRequests: number;
}

export interface VehicleUsage {
  name: string;
  value: number;
  percentage: number;
}

export interface ActivityItem {
  id: number;
  text: string;
  icon: string;
  timestamp?: string;
  user?: string;
}

export interface ChatbotStats {
  totalConversations: number;
  totalMessages: number;
  avgResponseTime: string;
  leadsCollected: number;
}

// API Service Functions
export const dashboardApi = {
  // Get summary stats for Quick Stats cards
  async getSummary(): Promise<SummaryStats> {
    return fetchDashboardData<SummaryStats>("/summary/");
  },

  // Get booking trends for line chart
  async getBookingTrends(): Promise<BookingTrend[]> {
    return fetchDashboardData<BookingTrend[]>("/booking-trends/");
  },

  // Get vehicle usage for pie chart
  async getVehicleUsage(): Promise<VehicleUsage[]> {
    return fetchDashboardData<VehicleUsage[]>("/vehicle-usage/");
  },

  // Get recent activity
  async getRecentActivity(): Promise<ActivityItem[]> {
    return fetchDashboardData<ActivityItem[]>("/recent-activity/");
  },

  // Get chatbot stats
  async getChatbotStats(): Promise<ChatbotStats> {
    return fetchDashboardData<ChatbotStats>("/chatbot-stats/");
  },
};

