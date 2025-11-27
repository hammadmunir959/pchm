import { useEffect, useMemo, useState } from "react";
import DashboardHeader from "@/components/DashboardHeader";
import DashboardNavBar from "@/components/DashboardNavBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { adminCarSalesApi, type CarPurchaseRequest } from "@/services/adminCarSalesApi";
import { authApi, type AdminSummary } from "@/services/authApi";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, MessagesSquare } from "lucide-react";

const STATUS_OPTIONS = [
  "pending",
  "contacted",
  "viewing_scheduled",
  "offer_made",
  "accepted",
  "rejected",
  "completed",
  "cancelled",
] as const;

const PurchaseRequests = () => {
  const { toast } = useToast();
  const [requests, setRequests] = useState<CarPurchaseRequest[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<CarPurchaseRequest | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [notes, setNotes] = useState("");
  const [assignedStaff, setAssignedStaff] = useState("");
  const [status, setStatus] = useState<CarPurchaseRequest["status"]>("pending");
  const [isLoading, setIsLoading] = useState(true);
  const [staffMembers, setStaffMembers] = useState<AdminSummary[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);

  const loadRequests = async () => {
    setIsLoading(true);
    try {
      const params = filterStatus === "all" ? {} : { status: filterStatus };
      const data = await adminCarSalesApi.listPurchaseRequests(params);
      setRequests(data);
    } catch (error) {
      toast({
        title: "Unable to load purchase requests",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus]);

  useEffect(() => {
    const loadStaff = async () => {
      setStaffLoading(true);
      try {
        const admins = await authApi.getAdmins("active");
        setStaffMembers(admins);
      } catch (error) {
        toast({
          title: "Unable to load staff members",
          description: error instanceof Error ? error.message : "Please try again later.",
          variant: "destructive",
        });
      } finally {
        setStaffLoading(false);
      }
    };

    loadStaff();
  }, [toast]);

  const filteredRequests = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return requests.filter((request) => {
      const matchesSearch =
        query === "" ||
        request.name.toLowerCase().includes(query) ||
        (request.car_listing_title || "").toLowerCase().includes(query);
      return matchesSearch;
    });
  }, [requests, searchQuery]);

  const openDialog = (request: CarPurchaseRequest) => {
    setSelectedRequest(request);
    setNotes(request.notes || "");
    setAssignedStaff(request.assigned_staff ? String(request.assigned_staff) : "");
    setStatus(request.status);
    setIsDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedRequest) return;
    setUpdateLoading(true);
    try {
      await adminCarSalesApi.updatePurchaseRequest(selectedRequest.id, {
        status,
        notes,
        assigned_staff: assignedStaff ? Number(assignedStaff) : undefined,
      });
      toast({ title: "Request updated" });
      setIsDialogOpen(false);
      loadRequests();
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setUpdateLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <DashboardHeader />
      <DashboardNavBar />

      <main className="flex-grow py-8">
        <div className="container mx-auto px-4">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <MessagesSquare className="w-8 h-8 text-accent" />
                Purchase Requests
              </h1>
              <p className="text-muted-foreground">
                Track incoming leads for vehicle purchases and manage follow-ups
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-card shadow rounded-xl mb-6 p-4 flex flex-col gap-4 md:flex-row md:items-center">
            <Input
              placeholder="Search by customer or vehicle"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="flex-1"
            />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-56">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={loadRequests} disabled={isLoading}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          <div className="bg-white dark:bg-card shadow rounded-xl p-4">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Offer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Loading purchase requests...
                      </TableCell>
                    </TableRow>
                  ) : filteredRequests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No leads match the current filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div>
                            <div className="font-semibold">{request.name}</div>
                            <p className="text-xs text-muted-foreground">{request.email}</p>
                            <p className="text-xs text-muted-foreground">{request.phone}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold">{request.car_listing_title}</div>
                          <p className="text-xs text-muted-foreground">
                            Ref #{request.car_listing}
                          </p>
                        </TableCell>
                        <TableCell>
                          {request.offer_price
                            ? `£${Number(request.offer_price).toLocaleString()}`
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={request.status}
                            onValueChange={async (newStatus) => {
                              try {
                                await adminCarSalesApi.updatePurchaseRequest(request.id, {
                                  status: newStatus as CarPurchaseRequest["status"],
                                });
                                setRequests((prev) =>
                                  prev.map((r) =>
                                    r.id === request.id ? { ...r, status: newStatus } : r
                                  )
                                );
                                toast({ title: "Status updated" });
                              } catch (error) {
                                toast({
                                  title: "Update failed",
                                  description:
                                    error instanceof Error
                                      ? error.message
                                      : "Please try again later.",
                                  variant: "destructive",
                                });
                              }
                            }}
                          >
                            <SelectTrigger className="w-[160px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUS_OPTIONS.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option.replace(/_/g, " ")}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {request.notes || "—"}
                          </p>
                        </TableCell>
                        <TableCell>
                          {new Date(request.created_at).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => openDialog(request)}>
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-4 mt-8">
        <p className="text-center text-gray-500 text-xs">
          © {new Date().getFullYear()} CodeKonix | All Rights Reserved
        </p>
      </footer>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Purchase request details</DialogTitle>
            <DialogDescription>Review conversation notes and update the lead status</DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground uppercase">Customer</p>
                  <p className="font-semibold">{selectedRequest.name}</p>
                  <p>{selectedRequest.email}</p>
                  <p>{selectedRequest.phone}</p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground uppercase">Vehicle</p>
                  <p className="font-semibold">{selectedRequest.car_listing_title}</p>
                  <p className="text-xs text-muted-foreground">Ref #{selectedRequest.car_listing}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground uppercase">Offer</p>
                  <p className="font-semibold">
                    {selectedRequest.offer_price
                      ? `£${Number(selectedRequest.offer_price).toLocaleString()}`
                      : "No offer specified"}
                  </p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground uppercase">Financing</p>
                  <p className="font-semibold">
                    {selectedRequest.financing_required ? "Required" : "Not required"}
                  </p>
                </div>
              </div>

              {selectedRequest.trade_in_details && (
                <div className="rounded-lg border border-border p-3 text-sm">
                  <p className="text-xs text-muted-foreground uppercase">Trade-in details</p>
                  <p>{selectedRequest.trade_in_details}</p>
                </div>
              )}

              {selectedRequest.message && (
                <div className="rounded-lg border border-border p-3 text-sm">
                  <p className="text-xs text-muted-foreground uppercase">Message</p>
                  <p>{selectedRequest.message}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select value={status} onValueChange={(value) => setStatus(value as CarPurchaseRequest["status"])}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="space-y-1">
                  <Select
                    value={assignedStaff}
                    onValueChange={setAssignedStaff}
                    disabled={staffLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={staffLoading ? "Loading staff..." : "Assign staff"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Unassigned</SelectItem>
                      {staffMembers.map((staff) => {
                        const fullName = `${staff.first_name ?? ""} ${staff.last_name ?? ""}`.trim();
                        const displayName = fullName || staff.email;
                        return (
                          <SelectItem key={staff.id} value={String(staff.id)}>
                            {displayName}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Current: {selectedRequest.assigned_staff_name || "Unassigned"}
                  </p>
                </div>
              </div>

              <Textarea
                placeholder="Internal notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={4}
              />

              <Button onClick={handleUpdate} disabled={updateLoading}>
                {updateLoading ? "Saving..." : "Update request"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PurchaseRequests;


