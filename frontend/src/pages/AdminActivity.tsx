import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import {
  Activity as ActivityIcon,
  AlertCircle,
  Edit3,
  Eye,
  Filter,
  LogIn,
  LogOut,
  PlusCircle,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DashboardHeader from "@/components/DashboardHeader";
import DashboardNavBar from "@/components/DashboardNavBar";
import AnimatedSection from "@/components/AnimatedSection";
import type { ActivityLogType, AdminActivityLogEntry } from "@/services/adminActivityApi";
import { adminActivityApi } from "@/services/adminActivityApi";

type FilterState = {
  type: "all" | ActivityLogType;
  search: string;
};

const DEFAULT_FILTERS: FilterState = {
  type: "all",
  search: "",
};

const PAGE_SIZE = 15;

const ACTIVITY_TYPE_LABELS: Record<ActivityLogType, string> = {
  login: "User Login",
  logout: "User Logout",
  create: "Record Created",
  update: "Record Updated",
  delete: "Record Deleted",
  view: "Record Viewed",
};

const ACTIVITY_META: Record<
  ActivityLogType,
  { icon: JSX.Element; badgeColor: string; accent: string; bubble: string }
> = {
  login: {
    icon: <LogIn className="w-4 h-4" />,
    badgeColor: "bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300",
    accent: "text-sky-600",
    bubble: "bg-sky-50 text-sky-600 border-sky-200",
  },
  logout: {
    icon: <LogOut className="w-4 h-4" />,
    badgeColor: "bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-200",
    accent: "text-slate-600",
    bubble: "bg-slate-50 text-slate-600 border-slate-200",
  },
  create: {
    icon: <PlusCircle className="w-4 h-4" />,
    badgeColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
    accent: "text-emerald-600",
    bubble: "bg-emerald-50 text-emerald-600 border-emerald-200",
  },
  update: {
    icon: <Edit3 className="w-4 h-4" />,
    badgeColor: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
    accent: "text-amber-600",
    bubble: "bg-amber-50 text-amber-600 border-amber-200",
  },
  delete: {
    icon: <Trash2 className="w-4 h-4" />,
    badgeColor: "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
    accent: "text-rose-600",
    bubble: "bg-rose-50 text-rose-600 border-rose-200",
  },
  view: {
    icon: <Eye className="w-4 h-4" />,
    badgeColor: "bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300",
    accent: "text-purple-600",
    bubble: "bg-purple-50 text-purple-600 border-purple-200",
  },
};

const getActivityMeta = (type: ActivityLogType | undefined) => {
  if (type && ACTIVITY_META[type]) {
    return ACTIVITY_META[type];
  }
  return {
    icon: <ActivityIcon className="w-4 h-4" />,
    badgeColor: "bg-muted text-foreground",
    accent: "text-foreground",
    bubble: "bg-muted text-foreground border-border",
  };
};

const AdminActivity = () => {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [searchInput, setSearchInput] = useState("");

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ["admin-activity-log", page, filters.type, filters.search],
    queryFn: () =>
      adminActivityApi.fetchActivityLog({
        page,
        pageSize: PAGE_SIZE,
        type: filters.type === "all" ? undefined : filters.type,
        q: filters.search ? filters.search : undefined,
      }),
    keepPreviousData: true,
  });

  const activities = data?.results ?? [];
  const totalItems = data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  const summaryText = useMemo(() => {
    if (!totalItems) {
      return "No activity recorded yet";
    }
    const start = (page - 1) * PAGE_SIZE + 1;
    const end = Math.min(totalItems, page * PAGE_SIZE);
    return `Showing ${start}-${end} of ${totalItems} activities`;
  }, [page, totalItems]);

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFilters((prev) => ({ ...prev, search: searchInput.trim() }));
    setPage(1);
  };

  const handleTypeChange = (value: string) => {
    setFilters((prev) => ({ ...prev, type: value as FilterState["type"] }));
    setPage(1);
  };

  const handleRefresh = () => {
    refetch();
  };

  const goToPrevious = () => setPage((prev) => Math.max(prev - 1, 1));
  const goToNext = () => setPage((prev) => Math.min(prev + 1, totalPages));

  const renderActivity = (activity: AdminActivityLogEntry) => {
    const meta = getActivityMeta(activity.activity_type);
    const timestamp = activity.timestamp ? new Date(activity.timestamp) : null;
    const exactTime = timestamp ? format(timestamp, "EEE, MMM d · p") : "Unknown time";
    const relativeTime = timestamp ? formatDistanceToNow(timestamp, { addSuffix: true }) : "—";

    return (
      <li
        key={activity.id}
        className="relative rounded-3xl border border-border/60 bg-card/80 p-5 shadow-sm transition hover:border-primary/30"
      >
        <div className="flex items-start gap-4">
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${meta.bubble}`}>
            {meta.icon}
          </div>
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className={`text-xs uppercase tracking-[0.3em] ${meta.accent}`}>
                  {ACTIVITY_TYPE_LABELS[activity.activity_type]}
                </p>
                <p className="mt-1 text-base font-semibold text-foreground">{activity.description}</p>
              </div>
              <Badge className={meta.badgeColor}>{activity.activity_type}</Badge>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span>{activity.user_name ?? "System"}</span>
              {activity.ip_address && (
                <span className="rounded-full border border-border/60 px-3 py-1 text-xs">IP {activity.ip_address}</span>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
              <span>{exactTime}</span>
              <span>{relativeTime}</span>
            </div>
          </div>
        </div>
      </li>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <DashboardHeader />
      <DashboardNavBar />

      <main className="flex-grow py-10">
        <div className="container mx-auto px-4 lg:px-6">
          <AnimatedSection>
            <div className="mb-8 flex flex-col gap-4 rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Governance</p>
                <h1 className="text-3xl font-semibold text-foreground flex items-center gap-2">
                  <ActivityIcon className="w-7 h-7 text-primary" />
                  Admin Activity Log
                </h1>
                <p className="text-sm text-muted-foreground">
                  Track every critical admin action with precise timestamps and user attribution.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" onClick={handleRefresh} disabled={isFetching}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>
            </div>

            <section className="mb-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-border/60 bg-card/80 p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Log Entries</p>
                <p className="mt-2 text-3xl font-bold text-foreground">{totalItems}</p>
                <p className="text-sm text-muted-foreground">{summaryText}</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-card/80 p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Filters</p>
                <p className="mt-2 text-lg font-semibold capitalize">
                  {filters.type === "all" ? "All activity types" : ACTIVITY_TYPE_LABELS[filters.type]}
                </p>
                <p className="text-sm text-muted-foreground">
                  {filters.search ? `Matching “${filters.search}”` : "No search term applied"}
                </p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-card/80 p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Page</p>
                <p className="mt-2 text-3xl font-bold text-foreground">{page}</p>
                <p className="text-sm text-muted-foreground">
                  of {totalPages} {totalPages === 1 ? "page" : "pages"}
                </p>
              </div>
            </section>

            <section className="mb-8 rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm">
              <form onSubmit={handleSearchSubmit} className="grid gap-4 md:grid-cols-[2fr,1fr]">
                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2">
                    <Search className="w-4 h-4" /> Search Activity
                  </label>
                  <div className="relative">
                    <Input
                      placeholder="Search by description, user or IP"
                      value={searchInput}
                      onChange={(event) => setSearchInput(event.target.value)}
                      className="pl-10"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2">
                    <Filter className="w-4 h-4" /> Activity Type
                  </label>
                  <Select value={filters.type} onValueChange={handleTypeChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All activity</SelectItem>
                      {Object.entries(ACTIVITY_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end justify-end md:col-span-2">
                  <Button type="submit" className="w-full md:w-auto">
                    <Search className="w-4 h-4 mr-2" />
                    Apply filters
                  </Button>
                </div>
              </form>
            </section>

            <section className="space-y-4">
              {isError && (
                <div className="flex items-center gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
                  <AlertCircle className="w-5 h-5" />
                  Unable to load activity log. Please try again.
                </div>
              )}

              {isLoading ? (
                <div className="grid gap-4">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-28 w-full animate-pulse rounded-3xl border border-border/60 bg-muted/40"
                    />
                  ))}
                </div>
              ) : activities.length > 0 ? (
                <ul className="space-y-4">{activities.map((activity) => renderActivity(activity))}</ul>
              ) : (
                <div className="rounded-3xl border border-border/60 bg-card/80 p-12 text-center text-muted-foreground">
                  <p className="text-lg font-semibold">No activity found</p>
                  <p className="mt-2 text-sm">Adjust your filters or check back later.</p>
                </div>
              )}
            </section>

            <div className="mt-8 flex flex-col gap-4 border-t border-border/60 pt-6 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
              <p>{summaryText}</p>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={goToPrevious} disabled={page === 1 || isFetching}>
                  Previous
                </Button>
                <Button variant="outline" onClick={goToNext} disabled={page >= totalPages || isFetching}>
                  Next
                </Button>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </main>
    </div>
  );
};

export default AdminActivity;

