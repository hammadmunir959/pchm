import { useMemo, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { Loader2, BarChart3, Users, Clock, Activity, RefreshCcw, TrendingUp, Eye, Calendar, Filter } from "lucide-react";
import DashboardHeader from "@/components/DashboardHeader";
import DashboardNavBar from "@/components/DashboardNavBar";
import AnimatedSection from "@/components/AnimatedSection";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  webAnalyticsApi,
  type WebAnalyticsOverview,
  type WebAnalyticsPeriod,
  type TopPage,
} from "@/services/webAnalyticsApi";
import { getPageName } from "@/utils/pageNameMapper";
import { format } from "date-fns";

const periodOptions: { label: string; value: WebAnalyticsPeriod }[] = [
  { label: "7 days", value: "7d" },
  { label: "30 days", value: "30d" },
  { label: "90 days", value: "90d" },
];

const SOURCE_COLORS = ["#3b82f6", "#22c55e", "#f97316", "#a855f7", "#06b6d4", "#eab308"];

const formatNumber = (value?: number) => {
  if (value === undefined || value === null) return "—";
  return Intl.NumberFormat().format(value);
};

const formatDuration = (seconds?: number) => {
  if (seconds === undefined || seconds === null || seconds <= 0) return "0m 00s";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}m ${secs.toString().padStart(2, "0")}s`;
};

const formatHour = (hour: number) => {
  const date = new Date();
  date.setHours(hour);
  return date.toLocaleTimeString([], { hour: "numeric" });
};

const WebAnalytics = () => {
  const [period, setPeriod] = useState<WebAnalyticsPeriod>("30d");
  const [activeTab, setActiveTab] = useState("overview");

  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery<WebAnalyticsOverview, Error>({
    queryKey: ["web-analytics", period],
    queryFn: () => webAnalyticsApi.getOverview(period),
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData,
  });

  const headlineCards = useMemo(() => {
    if (!data?.headline) return [];
    return [
      {
        label: "Total views",
        value: formatNumber(data.headline.totalViews),
        icon: <BarChart3 className="w-5 h-5 text-blue-500" />,
        helper: "All tracked page impressions",
      },
      {
        label: "Unique visitors",
        value: formatNumber(data.headline.uniqueVisitors),
        icon: <Users className="w-5 h-5 text-emerald-500" />,
        helper: "Distinct sessions for the period",
      },
      {
        label: "Avg time on site",
        value: formatDuration(data.headline.avgSessionDurationSeconds),
        icon: <Clock className="w-5 h-5 text-purple-500" />,
        helper: "Per session average",
      },
      {
        label: "Viewer minutes",
        value: `${formatNumber(Math.round(data.headline.viewerMinutes))} min`,
        icon: <Activity className="w-5 h-5 text-orange-500" />,
        helper: "Total aggregated time",
      },
    ];
  }, [data]);

  return (
    <div className="min-h-screen flex flex-col bg-background bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.08),_transparent_55%)]">
      <DashboardHeader />
      <DashboardNavBar />
      <main className="flex-grow py-8">
        <div className="container mx-auto px-4 lg:px-6">
          <AnimatedSection>
            <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  Intelligence
                </p>
                <h1 className="text-3xl font-semibold text-foreground">Web Analytics</h1>
                <p className="text-sm text-muted-foreground mt-1 max-w-xl">
                  Complete visibility into visitor behaviour, engagement, and acquisition trends.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {periodOptions.map((option) => (
                  <Button
                    key={option.value}
                    size="sm"
                    variant={option.value === period ? "default" : "outline"}
                    className="rounded-full"
                    onClick={() => setPeriod(option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => refetch()}
                  disabled={isFetching}
                >
                  <RefreshCcw className={`w-4 h-4 mr-1 ${isFetching ? "animate-spin" : ""}`} />
                  Sync
                </Button>
              </div>
            </div>

            {error && (
              <div className="mb-6 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                Unable to load analytics. {error.message}
              </div>
            )}

            {isLoading && !data ? (
              <div className="flex items-center justify-center py-32">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="mb-6 grid w-full max-w-md grid-cols-2">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="high-performing">High-Performing Pages</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-10">
                  <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
                  <div className="rounded-3xl border bg-card/80 p-6 shadow-sm">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                          Audience overview
                        </p>
                        <h2 className="text-2xl font-semibold text-foreground">
                          Visitor growth curve
                        </h2>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {data?.trafficTrend?.length ?? 0} days
                      </span>
                    </div>
                    <div className="mt-6 h-[320px]">
                      <ChartContainer
                        config={{
                          views: { label: "Views", color: "hsl(var(--chart-1))" },
                          uniqueVisitors: { label: "Unique visitors", color: "hsl(var(--chart-2))" },
                        }}
                      >
                        <ResponsiveContainer>
                          <AreaChart data={data?.trafficTrend ?? []}>
                            <defs>
                              <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                              </linearGradient>
                              <linearGradient id="colorUnique" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                            <XAxis
                              dataKey="date"
                              minTickGap={24}
                              tickFormatter={(value) =>
                                new Date(value).toLocaleDateString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                })
                              }
                            />
                            <YAxis allowDecimals={false} />
                            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                            <Area
                              dataKey="views"
                              stroke="#3b82f6"
                              fill="url(#colorViews)"
                              strokeWidth={2}
                              name="Views"
                            />
                            <Area
                              dataKey="uniqueVisitors"
                              stroke="#10b981"
                              fill="url(#colorUnique)"
                              strokeWidth={2}
                              name="Unique visitors"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </div>
                  </div>

                  <div className="rounded-3xl border bg-muted/40 p-6 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                      Key signals
                    </p>
                    <h3 className="text-xl font-semibold mt-1">Engagement health</h3>
                    <div className="mt-6 space-y-4">
                      <div className="flex items-center justify-between border-b border-border/60 pb-3">
                        <div>
                          <p className="text-sm text-muted-foreground">Bounce rate</p>
                          <p className="text-lg font-semibold">
                            {data?.headline ? `${data.headline.bounceRate}%` : "—"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Returning rate</p>
                          <p className="text-lg font-semibold">
                            {data?.headline ? `${data.headline.returningVisitorRate}%` : "—"}
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Average pages per session</p>
                        <p className="text-3xl font-semibold">
                          {data?.headline ? data.headline.avgPagesPerSession.toFixed(1) : "—"}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Total sessions: {formatNumber(data?.headline.totalSessions)}
                        </p>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {headlineCards.map((card) => (
                          <div
                            key={card.label}
                            className="rounded-2xl border border-border/60 bg-card p-3 shadow-sm"
                          >
                            <div className="flex items-center gap-2 text-sm font-medium">
                              {card.icon}
                              <span>{card.label}</span>
                            </div>
                            <p className="mt-2 text-2xl font-semibold">{card.value}</p>
                            <p className="text-xs text-muted-foreground mt-1">{card.helper}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>

                <section className="mb-10 grid gap-6 xl:grid-cols-3">
                  <div className="rounded-3xl border bg-card/80 p-6 shadow-sm xl:col-span-2">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                          Hourly coverage
                        </p>
                        <h3 className="text-xl font-semibold">Peak traffic timeline</h3>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Local timezone · 24h spread
                      </span>
                    </div>
                    <div className="mt-6 h-[280px]">
                      <ChartContainer
                        config={{ views: { label: "Views", color: "hsl(var(--chart-1))" } }}
                        className="h-full w-full"
                      >
                        <BarChart data={data?.hourlyDistribution ?? []}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                          <XAxis dataKey="hour" tickFormatter={(value) => formatHour(value as number)} />
                          <YAxis allowDecimals={false} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="views" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ChartContainer>
                    </div>
                  </div>
                  <div className="rounded-3xl border bg-card/80 p-6 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                      Device mix
                    </p>
                    <h3 className="text-xl font-semibold">Experience surface</h3>
                    <div className="mt-6 h-[260px]">
                      <ChartContainer config={{}} className="h-full w-full">
                        <PieChart>
                          <Pie
                            data={data?.deviceBreakdown ?? []}
                            dataKey="views"
                            nameKey="device"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={2}
                          >
                            {(data?.deviceBreakdown ?? []).map((entry, index) => (
                              <Cell
                                key={`device-${entry.device}`}
                                fill={SOURCE_COLORS[index % SOURCE_COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Legend />
                        </PieChart>
                      </ChartContainer>
                    </div>
                    <div className="mt-4 space-y-2">
                      {(data?.deviceBreakdown ?? []).map((entry) => (
                        <div
                          key={entry.device}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-muted-foreground">{entry.device}</span>
                          <span className="font-semibold">
                            {entry.percentage.toFixed(1)}% · {formatNumber(entry.views)} views
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                <section className="grid gap-6 lg:grid-cols-[1fr,1fr]">
                  <div className="rounded-3xl border bg-card/80 p-6 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                      Acquisition channels
                    </p>
                    <h3 className="text-xl font-semibold">Traffic sources</h3>
                    <div className="mt-4 space-y-4">
                      {(data?.trafficSources ?? []).map((source, index) => (
                        <div
                          key={source.source}
                          className="rounded-2xl border border-border/60 p-4 shadow-sm"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span
                                className="h-3 w-3 rounded-full"
                                style={{
                                  backgroundColor: SOURCE_COLORS[index % SOURCE_COLORS.length],
                                }}
                              />
                              <div>
                                <p className="font-medium">{source.source}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatNumber(source.views)} views
                                </p>
                              </div>
                            </div>
                            <p className="text-lg font-semibold">{source.percentage.toFixed(1)}%</p>
                          </div>
                        </div>
                      ))}
                      {(data?.trafficSources?.length ?? 0) === 0 && (
                        <p className="text-sm text-muted-foreground">
                          Traffic sources will appear once referrer data is collected.
                        </p>
                      )}
                    </div>
                  </div>
                </section>
                </TabsContent>

                <TabsContent value="high-performing" className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Page Views</CardTitle>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{formatNumber(data?.headline.totalViews)}</div>
                        <p className="text-xs text-muted-foreground">
                          Across all pages in selected period
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Top Pages Tracked</CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{data?.topPages?.length || 0}</div>
                        <p className="text-xs text-muted-foreground">
                          Pages with highest traffic
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Unique Visitors</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {formatNumber(data?.headline.uniqueVisitors)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Distinct visitors in selected period
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {data?.range && (
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(data.range.start), "MMM d, yyyy")} - {format(new Date(data.range.end), "MMM d, yyyy")}
                    </div>
                  )}

                  {/* Pages Table */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Top Performing Pages</CardTitle>
                      <CardDescription>
                        Pages ranked by total views and traffic share
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {!data?.topPages || data.topPages.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                          <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>No page view data available for the selected period.</p>
                          <p className="text-sm mt-2">
                            Page views will appear here once visitors start browsing your site.
                          </p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-12">#</TableHead>
                                <TableHead>Page Name</TableHead>
                                <TableHead>Path</TableHead>
                                <TableHead className="text-right">Views</TableHead>
                                <TableHead className="text-right">Traffic Share</TableHead>
                                <TableHead>Performance</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {data.topPages.map((page: TopPage, index: number) => {
                                const pageName = getPageName(page.path, page.title);
                                const getPerformanceBadge = (share: number) => {
                                  if (share >= 20) {
                                    return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">High</Badge>;
                                  }
                                  if (share >= 10) {
                                    return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200">Medium</Badge>;
                                  }
                                  if (share >= 5) {
                                    return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-200">Low</Badge>;
                                  }
                                  return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100 border-gray-200">Very Low</Badge>;
                                };
                                return (
                                  <TableRow key={`${page.path}-${index}`}>
                                    <TableCell className="font-medium">
                                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                                        {index + 1}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="font-semibold">{pageName}</div>
                                    </TableCell>
                                    <TableCell>
                                      <code className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground">
                                        {page.path}
                                      </code>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <div className="flex items-center justify-end gap-2">
                                        <Eye className="w-4 h-4 text-muted-foreground" />
                                        <span className="font-semibold">{formatNumber(page.views)}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <div className="flex items-center justify-end gap-2">
                                        <div className="w-24 bg-muted rounded-full h-2">
                                          <div
                                            className="bg-primary h-2 rounded-full transition-all"
                                            style={{ width: `${Math.min(page.share, 100)}%` }}
                                          />
                                        </div>
                                        <span className="font-medium w-12 text-right">
                                          {page.share.toFixed(1)}%
                                        </span>
                                      </div>
                                    </TableCell>
                                    <TableCell>{getPerformanceBadge(page.share)}</TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Additional Insights */}
                  {data?.topPages && data.topPages.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Insights</CardTitle>
                        <CardDescription>Key observations from your page performance</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {data.topPages[0] && (
                            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                              <TrendingUp className="w-5 h-5 text-primary mt-0.5" />
                              <div>
                                <p className="font-medium">
                                  Top Page: <span className="text-primary">{getPageName(data.topPages[0].path, data.topPages[0].title)}</span>
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Receiving {data.topPages[0].share.toFixed(1)}% of all traffic with {formatNumber(data.topPages[0].views)} views
                                </p>
                              </div>
                            </div>
                          )}
                          {data.topPages.length >= 3 && (
                            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                              <BarChart3 className="w-5 h-5 text-primary mt-0.5" />
                              <div>
                                <p className="font-medium">Top 3 Pages</p>
                                <p className="text-sm text-muted-foreground">
                                  Combined, the top 3 pages account for{" "}
                                  {data.topPages
                                    .slice(0, 3)
                                    .reduce((sum, page) => sum + page.share, 0)
                                    .toFixed(1)}
                                  % of total traffic
                                </p>
                              </div>
                            </div>
                          )}
                          {data.topPages.length >= 5 && (
                            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                              <Eye className="w-5 h-5 text-primary mt-0.5" />
                              <div>
                                <p className="font-medium">Traffic Distribution</p>
                                <p className="text-sm text-muted-foreground">
                                  Top 5 pages represent{" "}
                                  {data.topPages
                                    .slice(0, 5)
                                    .reduce((sum, page) => sum + page.share, 0)
                                    .toFixed(1)}
                                  % of all page views, indicating{" "}
                                  {data.topPages.slice(0, 5).reduce((sum, page) => sum + page.share, 0) > 50
                                    ? "concentrated"
                                    : "diverse"}{" "}
                                  user interest
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </AnimatedSection>
        </div>
      </main>
    </div>
  );
};

export default WebAnalytics;


