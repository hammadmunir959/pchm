import { useEffect, useMemo, useRef, useState } from "react";
import {
  Shield,
  Users,
  Settings,
  BarChart3,
  Ban,
  RefreshCcw,
  CheckCircle2,
  AlertTriangle,
  Search,
  Loader2,
  Car,
  Calendar,
  MessageSquare,
  Star,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import AnimatedSection from "@/components/AnimatedSection";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { authApi } from "@/services/authApi";
import type { AdminStatus, AdminSummary } from "@/services/authApi";
import { dashboardApi } from "@/services/dashboardApi";
import type { SummaryStats } from "@/services/dashboardApi";
import { useToast } from "@/hooks/use-toast";
import DashboardHeader from "@/components/DashboardHeader";
import { useAuth } from "@/context/AuthContext";

type AdminBuckets = Record<AdminStatus, AdminSummary[]>;

const emptyBuckets: AdminBuckets = {
  pending_approval: [],
  active: [],
  suspended: [],
};

const statusCopy: Record<
  AdminStatus,
  {
    label: string;
    description: string;
    empty: string;
    badgeVariant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  pending_approval: {
    label: "Pending",
    description: "Admins awaiting manual approval",
    empty: "No pending admin requests right now.",
    badgeVariant: "secondary",
  },
  active: {
    label: "Active",
    description: "Admins with full dashboard access",
    empty: "No active admins found.",
    badgeVariant: "default",
  },
  suspended: {
    label: "Suspended",
    description: "Admins without access",
    empty: "No suspended admins.",
    badgeVariant: "destructive",
  },
};

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { logout } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<AdminStatus>("pending_approval");
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const adminSectionRef = useRef<HTMLDivElement | null>(null);

  const {
    data: adminBuckets = emptyBuckets,
    isLoading: isLoadingAdmins,
    isFetching: isFetchingAdmins,
    error: adminError,
    refetch: refetchAdmins,
  } = useQuery<AdminBuckets>({
    queryKey: ["super-admin", "admins"],
    queryFn: async () => {
      const [pending, active, suspended] = await Promise.all([
        authApi.getAdmins("pending_approval"),
        authApi.getAdmins("active"),
        authApi.getAdmins("suspended"),
      ]);
      return {
        pending_approval: pending,
        active,
        suspended,
      };
    },
    staleTime: 60 * 1000,
  });

  const {
    data: summaryData,
    isLoading: isLoadingSummary,
    error: summaryError,
  } = useQuery<SummaryStats, Error>({
    queryKey: ["super-admin", "summary"],
    queryFn: dashboardApi.getSummary,
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    if (adminError) {
      const message =
        adminError instanceof Error ? adminError.message : "Unable to load admin information.";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  }, [adminError, toast]);

  useEffect(() => {
    if (summaryError) {
      const message =
        summaryError instanceof Error ? summaryError.message : "Unable to load operational KPIs.";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  }, [summaryError, toast]);

  useEffect(() => {
    if (!isLoadingAdmins && adminBuckets && adminBuckets !== emptyBuckets) {
      setLastSyncedAt(new Date());
    }
  }, [adminBuckets, isLoadingAdmins]);

  const updateAdminStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: AdminStatus }) =>
      authApi.updateAdminStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["super-admin", "admins"] });
      toast({
        title: variables.status === "active" ? "Admin activated" : "Status updated",
        description:
          variables.status === "active"
            ? "Admin access has been granted."
            : `Admin moved to ${statusCopy[variables.status].label} list.`,
      });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Unable to update status.";
      toast({ title: "Action failed", description: message, variant: "destructive" });
    },
    onSettled: () => {
      setActionLoadingId(null);
    },
  });

  const handleStatusChange = (adminId: number, nextStatus: AdminStatus) => {
    setActionLoadingId(adminId);
    updateAdminStatusMutation.mutate({ id: adminId, status: nextStatus });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetchAdmins();
    } finally {
      setIsRefreshing(false);
    }
  };

  const adminStats = useMemo(() => {
    const pendingCount = adminBuckets.pending_approval.length;
    const activeCount = adminBuckets.active.length;
    const suspendedCount = adminBuckets.suspended.length;
    const totalAdmins = pendingCount + activeCount + suspendedCount;

    const pendingPressure = pendingCount > 5;

    return [
      {
        title: "Total Admins",
        value: totalAdmins.toString(),
        icon: <Users className="w-6 h-6" />,
        description: "All admin accounts",
      },
      {
        title: "Pending Approvals",
        value: pendingCount.toString(),
        icon: <AlertTriangle className="w-6 h-6" />,
        description: pendingPressure ? "High review load" : "Awaiting decisions",
      },
      {
        title: "Active Admins",
        value: activeCount.toString(),
        icon: <Shield className="w-6 h-6" />,
        description: "Approved & live users",
      },
      {
        title: "Suspended Admins",
        value: suspendedCount.toString(),
        icon: <Ban className="w-6 h-6" />,
        description: "Access currently revoked",
      },
    ];
  }, [adminBuckets]);

  const filteredAdmins = useMemo(() => {
    const list = adminBuckets[selectedStatus] ?? [];
    if (!searchTerm.trim()) {
      return list;
    }
    const term = searchTerm.toLowerCase();
    return list.filter((admin) => {
      const fullName = `${admin.first_name ?? ""} ${admin.last_name ?? ""}`.trim().toLowerCase();
      return (
        admin.email.toLowerCase().includes(term) ||
        fullName.includes(term) ||
        (admin.first_name ?? "").toLowerCase().includes(term) ||
        (admin.last_name ?? "").toLowerCase().includes(term)
      );
    });
  }, [adminBuckets, selectedStatus, searchTerm]);

  const scrollToAdminSection = () => {
    adminSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setSelectedStatus("pending_approval");
  };

  const quickActions = [
    {
      title: "Review Pending Admins",
      description: "Approve or suspend incoming requests",
      icon: <Shield className="w-5 h-5 mb-2 text-accent" />,
      onClick: scrollToAdminSection,
    },
    {
      title: "Open Admin Dashboard",
      description: "Monitor fleet & operations",
      icon: <BarChart3 className="w-5 h-5 mb-2 text-accent" />,
      onClick: () => navigate("/admin/dashboard"),
    },
    {
      title: "View Settings",
      description: "Manage platform preferences",
      icon: <Settings className="w-5 h-5 mb-2 text-accent" />,
      onClick: () => navigate("/admin/dashboard/settings"),
    },
  ];

  const quickStatsConfig = [
    {
      title: "Total Vehicles",
      key: "totalVehicles" as const,
      description: "Current fleet size",
      icon: <Car className="w-6 h-6" />,
      bgColor: "bg-blue-500",
    },
    {
      title: "Total Bookings",
      key: "totalBookings" as const,
      description: "Lifetime bookings",
      icon: <Calendar className="w-6 h-6" />,
      bgColor: "bg-green-500",
    },
    {
      title: "Inquiries",
      key: "inquiries" as const,
      description: "Today's inquiries",
      icon: <MessageSquare className="w-6 h-6" />,
      bgColor: "bg-orange-500",
    },
    {
      title: "Testimonials",
      key: "testimonials" as const,
      description: "Approved testimonials",
      icon: <Star className="w-6 h-6" />,
      bgColor: "bg-purple-500",
    },
  ];

  const quickStats = quickStatsConfig.map((config) => ({
    ...config,
    value: summaryData ? summaryData[config.key]?.toLocaleString() ?? "0" : "0",
  }));

  const getLastSyncedLabel = () => {
    if (!lastSyncedAt) return "Not synced yet";
    return `Last synced ${formatDistanceToNow(lastSyncedAt, { addSuffix: true })}`;
  };

  const renderAdminCard = (admin: AdminSummary) => {
    const displayName =
      admin.first_name || admin.last_name
        ? `${admin.first_name ?? ""} ${admin.last_name ?? ""}`.trim()
        : admin.email;
    const createdAt = admin.created_at ? new Date(admin.created_at) : null;
    const createdLabel =
      createdAt && !Number.isNaN(createdAt.getTime())
        ? formatDistanceToNow(createdAt, { addSuffix: true })
        : null;
    const isActionLoading = actionLoadingId === admin.id;

    const actionButtons = () => {
      if (admin.status === "pending_approval") {
        return (
          <>
            <Button
              size="sm"
              onClick={() => handleStatusChange(admin.id, "active")}
              disabled={isActionLoading}
            >
              {isActionLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              Approve
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleStatusChange(admin.id, "suspended")}
              disabled={isActionLoading}
            >
              {isActionLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Ban className="mr-2 h-4 w-4" />
              )}
              Suspend
            </Button>
          </>
        );
      }

      if (admin.status === "active") {
        return (
          <Button
            size="sm"
            variant="destructive"
            onClick={() => handleStatusChange(admin.id, "suspended")}
            disabled={isActionLoading}
          >
            {isActionLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Ban className="mr-2 h-4 w-4" />
            )}
            Suspend
          </Button>
        );
      }

      return (
        <Button
          size="sm"
          onClick={() => handleStatusChange(admin.id, "active")}
          disabled={isActionLoading}
        >
          {isActionLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Shield className="mr-2 h-4 w-4" />
          )}
          Reinstate
        </Button>
      );
    };

    return (
      <div
        key={admin.id}
        className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border rounded-lg p-4"
      >
        <div>
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <p className="font-semibold text-lg text-foreground">{displayName}</p>
              <p className="text-sm text-muted-foreground">{admin.email}</p>
            </div>
            <Badge variant={statusCopy[admin.status as AdminStatus]?.badgeVariant ?? "outline"}>
              {statusCopy[admin.status as AdminStatus]?.label ?? admin.status}
            </Badge>
          </div>
          {createdLabel && (
            <p className="text-xs text-muted-foreground mt-1">Requested {createdLabel}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">{actionButtons()}</div>
      </div>
    );
  };

  const renderAdminsForStatus = (status: AdminStatus) => {
    if (isLoadingAdmins) {
      return (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-20 w-full" />
          ))}
        </div>
      );
    }

    if (filteredAdmins.length === 0 && selectedStatus === status) {
      return (
        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          {statusCopy[status].empty}
        </div>
      );
    }

    if (selectedStatus === status) {
      return <div className="space-y-4">{filteredAdmins.map((admin) => renderAdminCard(admin))}</div>;
    }

    const list = adminBuckets[status];
    if (list.length === 0) {
      return (
        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          {statusCopy[status].empty}
        </div>
      );
    }
    return <div className="space-y-4">{list.map((admin) => renderAdminCard(admin))}</div>;
  };

  return (
    <div 
      className="min-h-screen flex flex-col bg-background"
      data-admin-area
    >
      <DashboardHeader />

      <main className="flex-grow py-12 lg:py-16">
        <div className="container mx-auto px-4">
          <AnimatedSection>
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-full bg-accent/10 p-3">
                  <Shield className="w-8 h-8 text-accent" />
                </div>
                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold">Super Admin Dashboard</h1>
                  <p className="text-muted-foreground mt-1">
                    Manage and oversee all system operations
                  </p>
                </div>
              </div>
            </div>

            {/* Operational KPIs */}
            <section className="mb-10 space-y-6">
              <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Snapshot</p>
                  <h2 className="text-2xl font-bold text-foreground">Operational KPIs</h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  Pulled directly from the live admin telemetry.
                </p>
              </div>
              {summaryError && (
                <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  Unable to load KPIs. {summaryError instanceof Error ? summaryError.message : "Please try again shortly."}
                </div>
              )}
              {isLoadingSummary ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="rounded-2xl border border-border/60 bg-card/60 p-4 shadow-sm">
                      <div className="flex h-24 items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {quickStats.map((stat) => (
                    <div
                      key={stat.title}
                      className="group rounded-2xl border border-border/60 bg-card/80 p-5 shadow-sm transition hover:-translate-y-1 hover:border-accent/40"
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${stat.bgColor} text-white shadow-md`}>
                          {stat.icon}
                        </div>
                        <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                          Live
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-muted-foreground">{stat.title}</h3>
                      <p className="mt-1 text-3xl font-bold text-foreground">{stat.value}</p>
                      <p className="mt-2 text-xs text-muted-foreground">{stat.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {adminStats.map((stat, index) => (
                <Card key={index} className="border-2 border-accent/20">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {stat.title}
                    </CardTitle>
                    <div className="text-accent">{stat.icon}</div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stat.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Admin workflow */}
            <Card className="border-2 border-accent/20 mb-8" ref={adminSectionRef}>
              <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle>Admin Workflow</CardTitle>
                  <CardDescription>
                    Review, approve, suspend, or reinstate administrator accounts
                  </CardDescription>
                </div>
                <div className="flex flex-col items-start gap-2 text-sm text-muted-foreground lg:items-end">
                  <span>{getLastSyncedLabel()}</span>
                  <div className="flex items-center gap-2">
                    {isFetchingAdmins && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRefresh}
                      disabled={isRefreshing || isFetchingAdmins}
                    >
                      <RefreshCcw className="mr-2 h-4 w-4" />
                      Refresh
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as AdminStatus)}>
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <TabsList className="flex flex-wrap gap-2">
                      {(Object.keys(statusCopy) as AdminStatus[]).map((status) => (
                        <TabsTrigger key={status} value={status} className="capitalize">
                          {statusCopy[status].label}
                          <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">
                            {adminBuckets[status].length}
                          </span>
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    <div className="relative w-full md:w-72">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder="Search by name or email..."
                        className="pl-10"
                      />
                    </div>
                  </div>
                  {(Object.keys(statusCopy) as AdminStatus[]).map((status) => (
                    <TabsContent key={status} value={status} className="mt-6 space-y-4">
                      <p className="text-sm text-muted-foreground">{statusCopy[status].description}</p>
                      {renderAdminsForStatus(status)}
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-2 border-accent/20">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common administrative tasks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {quickActions.map((action) => (
                    <Button
                      key={action.title}
                      variant="outline"
                      className="h-auto py-6 flex flex-col items-start text-left"
                      onClick={action.onClick}
                    >
                      {action.icon}
                      <span className="font-semibold">{action.title}</span>
                      <span className="text-xs text-muted-foreground mt-1">
                        {action.description}
                      </span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Logout Button */}
            <div className="mt-8 text-center">
              <Button
                variant="outline"
                onClick={() => {
                  logout();
                  navigate("/admin/login", { replace: true });
                }}
              >
                Logout
              </Button>
            </div>
          </AnimatedSection>
        </div>
      </main>
    </div>
  );
};

export default SuperAdminDashboard;

