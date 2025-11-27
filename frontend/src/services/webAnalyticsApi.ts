import { withBasePath } from "./apiConfig";
import { authFetch } from "./authFetch";

const WEB_ANALYTICS_BASE = withBasePath("/analytics/dashboard");

export type WebAnalyticsPeriod = "7d" | "30d" | "90d";

export interface HeadlineMetrics {
  totalViews: number;
  uniqueVisitors: number;
  totalSessions: number;
  avgSessionDurationSeconds: number;
  avgPagesPerSession: number;
  viewerMinutes: number;
  bounceRate: number;
  returningVisitorRate: number;
}

export interface TrafficTrendPoint {
  date: string;
  views: number;
  uniqueVisitors: number;
}

export interface HourlyDistributionPoint {
  hour: number;
  views: number;
}

export interface TrafficSourceBreakdown {
  source: string;
  views: number;
  percentage: number;
}

export interface DeviceBreakdown {
  device: string;
  views: number;
  percentage: number;
}

export interface TopPage {
  path: string;
  title: string;
  views: number;
  share: number;
}

export interface WebAnalyticsOverview {
  period: WebAnalyticsPeriod | string;
  range: {
    start: string;
    end: string;
  };
  headline: HeadlineMetrics;
  trafficTrend: TrafficTrendPoint[];
  hourlyDistribution: HourlyDistributionPoint[];
  topPages: TopPage[];
  trafficSources: TrafficSourceBreakdown[];
  deviceBreakdown: DeviceBreakdown[];
  engagement: {
    sessions: number;
    avgSessionDurationSeconds: number;
    avgPagesPerSession: number;
    totalDurationSeconds: number;
  };
}

const buildEndpoint = (suffix: string) =>
  `${WEB_ANALYTICS_BASE}${suffix.startsWith("/") ? suffix : `/${suffix}`}`;

export const webAnalyticsApi = {
  async getOverview(period: WebAnalyticsPeriod = "30d"): Promise<WebAnalyticsOverview> {
    const params = new URLSearchParams({ period });
    const response = await authFetch(
      `${buildEndpoint("/web-overview/")}?${params.toString()}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        credentials: "include",
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Unable to load web analytics.");
    }

    return response.json() as Promise<WebAnalyticsOverview>;
  },
};


