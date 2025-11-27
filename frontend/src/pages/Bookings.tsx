import { useEffect, useMemo, useState } from "react";
import { Calendar, Search, Filter, Eye, ChevronRight, Loader2, User, Check, ChevronsUpDown } from "lucide-react";
import DashboardHeader from "@/components/DashboardHeader";
import DashboardNavBar from "@/components/DashboardNavBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { claimsApi, type Claim } from "@/services/claimsApi";
import { vehiclesApi, type Vehicle } from "@/services/vehiclesApi";
import { authApi, type AdminSummary } from "@/services/authApi";
import { authFetch } from "@/services/authFetch";
import { withBasePath } from "@/services/apiConfig";
import { useToast } from "@/hooks/use-toast";

const statusOptions = [
  { value: "all", label: "All Status" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "cancelled", label: "Cancelled" },
];

const claimStatusOptions = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "cancelled", label: "Cancelled" },
];

const Bookings = () => {
  const { toast } = useToast();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [staff, setStaff] = useState<AdminSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [modalActionLoading, setModalActionLoading] = useState(false);
  const [assignStaffId, setAssignStaffId] = useState("");
  const [assignVehicleId, setAssignVehicleId] = useState("");
  const [claimNotes, setClaimNotes] = useState("");
  const [claimStatus, setClaimStatus] = useState<"pending" | "approved" | "cancelled">("pending");
  
  // Track which claim is being updated for inline editing
  const [updatingClaimId, setUpdatingClaimId] = useState<number | null>(null);
  const [updatingField, setUpdatingField] = useState<string | null>(null);
  
  // Popover states for searchable dropdowns
  const [staffPopoverOpen, setStaffPopoverOpen] = useState(false);
  const [vehiclePopoverOpen, setVehiclePopoverOpen] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);

  const loadClaims = async () => {
    setIsLoading(true);
    try {
      const params = filterStatus === "all" ? {} : { status: filterStatus };
      const data = await claimsApi.list(params);
      setClaims(data);
    } catch (error) {
      toast({
        title: "Unable to load bookings",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadVehicles = async () => {
    try {
      const data = await vehiclesApi.list();
      setVehicles(data);
    } catch (error) {
      console.error("Failed to load vehicles:", error);
    }
  };

  const loadStaff = async () => {
    try {
      const data = await authApi.getAdmins("active");
      setStaff(data);
    } catch (error) {
      console.error("Failed to load staff:", error);
    }
  };

  useEffect(() => {
    loadClaims();
    loadVehicles();
    loadStaff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus]);

  const filteredBookings = useMemo(() => {
    return claims.filter((claim) => {
      const query = searchQuery.toLowerCase();
      const customerName = `${claim.first_name} ${claim.last_name}`.toLowerCase();
      const vehicleName = claim.vehicle_details?.name?.toLowerCase() ?? "";
      const reg = claim.vehicle_registration?.toLowerCase() ?? "";
      const staffName = claim.assigned_staff_details
        ? `${claim.assigned_staff_details.first_name} ${claim.assigned_staff_details.last_name}`.toLowerCase()
        : "";

      return (
        query === "" ||
        customerName.includes(query) ||
        vehicleName.includes(query) ||
        reg.includes(query) ||
        staffName.includes(query)
      );
    });
  }, [claims, searchQuery]);

  const getStatusBadge = (status: Claim["status"]) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-200">
            🟡 Pending
          </Badge>
        );
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
            ✅ Approved
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200">
            ❌ Cancelled
          </Badge>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStaffName = (staffId: number | null) => {
    if (!staffId) return "Unassigned";
    const staffMember = staff.find((s) => s.id === staffId);
    if (staffMember) {
      return `${staffMember.first_name} ${staffMember.last_name}`;
    }
    const claimStaff = claims.find((c) => c.assigned_staff === staffId)?.assigned_staff_details;
    if (claimStaff) {
      return `${claimStaff.first_name} ${claimStaff.last_name}`;
    }
    return `Staff #${staffId}`;
  };

  const updateClaimState = (updatedClaim: Claim) => {
    setClaims((prev) => prev.map((claim) => (claim.id === updatedClaim.id ? updatedClaim : claim)));
    setSelectedClaim(updatedClaim);
  };

  const handleInlineStatusUpdate = async (claimId: number, newStatus: "pending" | "approved" | "cancelled") => {
    setUpdatingClaimId(claimId);
    setUpdatingField("status");
    try {
      const updated = await claimsApi.updateStatus(claimId, newStatus);
      updateClaimState(updated);
      toast({
        title: "Status updated",
        description: `Status changed to ${newStatus}`,
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setUpdatingClaimId(null);
      setUpdatingField(null);
    }
  };

  const handleInlineVehicleUpdate = async (claimId: number, vehicleId: string) => {
    setUpdatingClaimId(claimId);
    setUpdatingField("vehicle");
    try {
      const vehicleIdNum = vehicleId === "" || vehicleId === "unassigned" ? null : Number(vehicleId);
      const updated = await claimsApi.assignVehicle(claimId, vehicleIdNum);
      updateClaimState(updated);
      toast({
        title: "Vehicle assigned",
        description: vehicleIdNum ? "Vehicle assigned successfully" : "Vehicle unassigned",
      });
    } catch (error) {
      toast({
        title: "Assignment failed",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setUpdatingClaimId(null);
      setUpdatingField(null);
    }
  };

  const handleInlineStaffUpdate = async (claimId: number, staffId: string) => {
    setUpdatingClaimId(claimId);
    setUpdatingField("staff");
    try {
      const staffIdNum = staffId === "" || staffId === "unassigned" ? null : Number(staffId);
      if (staffIdNum === null) {
        // Unassign staff - update via PATCH
        const response = await authFetch(`${withBasePath("/claims/")}${claimId}/`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ assigned_staff: null }),
        });
        if (response.ok) {
          const updated = await response.json();
          updateClaimState(updated);
          toast({
            title: "Staff unassigned",
          });
        } else {
          throw new Error("Failed to unassign staff");
        }
      } else {
        const updated = await claimsApi.assignStaff(claimId, staffIdNum);
        updateClaimState(updated);
        const staffMember = staff.find((s) => s.id === staffIdNum);
        toast({
          title: "Staff assigned",
          description: `Assigned to ${staffMember ? `${staffMember.first_name} ${staffMember.last_name}` : `Staff #${staffIdNum}`}`,
        });
      }
    } catch (error) {
      toast({
        title: "Assignment failed",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setUpdatingClaimId(null);
      setUpdatingField(null);
    }
  };

  const openModalForClaim = (claim: Claim) => {
    setSelectedClaim(claim);
    setAssignStaffId(claim.assigned_staff ? String(claim.assigned_staff) : "");
    setAssignVehicleId(claim.vehicle_details?.id ? String(claim.vehicle_details.id) : "");
    setSelectedStaffId(claim.assigned_staff);
    setSelectedVehicleId(claim.vehicle_details?.id || null);
    setClaimNotes(claim.notes || "");
    setClaimStatus(claim.status);
    setIsDetailsModalOpen(true);
  };

  const handleUpdateClaim = async () => {
    if (!selectedClaim) return;
    setModalActionLoading(true);
    try {
      const updateData: any = {
        status: claimStatus,
        notes: claimNotes,
      };
      
      // Update staff assignment if changed
      if (selectedStaffId !== selectedClaim.assigned_staff) {
        updateData.assigned_staff = selectedStaffId;
      }
      
      // Update vehicle assignment if changed
      if (selectedVehicleId !== (selectedClaim.vehicle_details?.id || null)) {
        updateData.vehicle = selectedVehicleId;
      }

      const response = await authFetch(`${withBasePath("/claims/")}${selectedClaim.id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const updated = await response.json();
        updateClaimState(updated);
        loadClaims(); // Reload the list to reflect changes
        toast({
          title: "Booking updated",
          description: "Changes saved successfully",
        });
      } else {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to update booking");
      }
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setModalActionLoading(false);
    }
  };

  const handleStatusAction = async (action: "approve" | "cancel") => {
    if (!selectedClaim) return;
    setModalActionLoading(true);
    try {
      const updated =
        action === "approve"
          ? await claimsApi.approve(selectedClaim.id)
          : await claimsApi.cancel(selectedClaim.id);
      updateClaimState(updated);
      toast({
        title: action === "approve" ? "Claim approved" : "Claim cancelled",
      });
    } catch (error) {
      toast({
        title: "Action failed",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setModalActionLoading(false);
    }
  };

  const handleAssignStaff = async () => {
    if (!selectedClaim) return;
    const staffId = assignStaffId === "" || assignStaffId === "unassigned" ? null : Number(assignStaffId);
    if (staffId !== null && Number.isNaN(staffId)) {
      toast({
        title: "Invalid staff selection",
        description: "Please select a valid staff member.",
        variant: "destructive",
      });
      return;
    }

    setModalActionLoading(true);
    try {
      if (staffId === null) {
        // Unassign staff
        const response = await authFetch(`${withBasePath("/claims/")}${selectedClaim.id}/`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ assigned_staff: null }),
        });
        if (response.ok) {
          const updated = await response.json();
          updateClaimState(updated);
          toast({
            title: "Staff unassigned",
          });
        } else {
          throw new Error("Failed to unassign staff");
        }
      } else {
        const updated = await claimsApi.assignStaff(selectedClaim.id, staffId);
        updateClaimState(updated);
        const staffMember = staff.find((s) => s.id === staffId);
        toast({
          title: "Staff assigned",
          description: `Assigned to ${staffMember ? `${staffMember.first_name} ${staffMember.last_name}` : `Staff #${staffId}`}`,
        });
      }
    } catch (error) {
      toast({
        title: "Assignment failed",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setModalActionLoading(false);
    }
  };

  const handleAssignVehicle = async () => {
    if (!selectedClaim) return;
    const vehicleId = selectedVehicleId;

    setModalActionLoading(true);
    try {
      if (vehicleId === null) {
        // Unassign vehicle - only if there's currently assigned vehicle
        if (selectedClaim.vehicle_details) {
          const updated = await claimsApi.assignVehicle(selectedClaim.id, null);
          updateClaimState(updated);
          toast({
            title: "Vehicle unassigned",
          });
        } else {
          toast({
            title: "No vehicle assigned",
            description: "No vehicle is currently assigned to unassign.",
            variant: "destructive",
          });
        }
      } else {
        const updated = await claimsApi.assignVehicle(selectedClaim.id, vehicleId);
        updateClaimState(updated);
        const vehicle = vehicles.find((v) => v.id === vehicleId);
        toast({
          title: "Vehicle assigned",
          description: `Assigned ${vehicle?.registration || vehicle?.name || `Vehicle #${vehicleId}`}`,
        });
      }
      setVehiclePopoverOpen(false);
    } catch (error) {
      toast({
        title: "Assignment failed",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setModalActionLoading(false);
    }
  };

  const handleAssignStaffFromButton = async () => {
    if (!selectedClaim) return;
    const staffId = selectedStaffId;

    setModalActionLoading(true);
    try {
      if (staffId === null) {
        // Unassign staff - only if there's currently assigned staff
        if (selectedClaim.assigned_staff) {
          const response = await authFetch(`${withBasePath("/claims/")}${selectedClaim.id}/`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ assigned_staff: null }),
          });
          if (response.ok) {
            const updated = await response.json();
            updateClaimState(updated);
            toast({
              title: "Staff unassigned",
            });
          } else {
            throw new Error("Failed to unassign staff");
          }
        } else {
          toast({
            title: "No staff assigned",
            description: "No staff is currently assigned to unassign.",
            variant: "destructive",
          });
        }
      } else {
        const updated = await claimsApi.assignStaff(selectedClaim.id, staffId);
        updateClaimState(updated);
        const staffMember = staff.find((s) => s.id === staffId);
        toast({
          title: "Staff assigned",
          description: `Assigned to ${staffMember ? `${staffMember.first_name} ${staffMember.last_name}` : `Staff #${staffId}`}`,
        });
      }
      setStaffPopoverOpen(false);
    } catch (error) {
      toast({
        title: "Assignment failed",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setModalActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <DashboardHeader />
      <DashboardNavBar />

      <main className="flex-grow py-8">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <Calendar className="w-8 h-8 text-accent" />
              Bookings Management
            </h1>
            <p className="text-muted-foreground">Manage and track accident replacement claims</p>
          </div>

          <div className="bg-white dark:bg-card shadow rounded-xl mb-6">
            <div className="flex flex-col sm:flex-row items-center p-4 gap-4">
              <div className="flex-1 w-full">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="🔍 Search by customer, vehicle, registration, or staff"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="w-full sm:w-48">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter: Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-card shadow rounded-xl p-4">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Pickup</TableHead>
                    <TableHead>Drop</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Staff</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Loading bookings...
                      </TableCell>
                    </TableRow>
                  ) : filteredBookings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No bookings found matching your criteria
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredBookings.map((claim) => {
                      const isUpdating = updatingClaimId === claim.id;
                      const isUpdatingStatus = isUpdating && updatingField === "status";
                      const isUpdatingVehicle = isUpdating && updatingField === "vehicle";
                      const isUpdatingStaff = isUpdating && updatingField === "staff";

                      return (
                        <TableRow key={claim.id}>
                          <TableCell>
                            <div className="font-semibold">
                              {claim.first_name} {claim.last_name}
                            </div>
                          </TableCell>
                          <TableCell>
                            {isUpdatingVehicle ? (
                              <div className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="text-xs text-muted-foreground">Updating...</span>
                              </div>
                            ) : (
                              <Select
                                value={claim.vehicle_details?.id ? String(claim.vehicle_details.id) : "unassigned"}
                                onValueChange={(value) => handleInlineVehicleUpdate(claim.id, value)}
                                disabled={isUpdating}
                              >
                                <SelectTrigger className="w-[180px] h-8 text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="unassigned">Unassigned</SelectItem>
                                  {vehicles.map((vehicle) => (
                                    <SelectItem key={vehicle.id} value={String(vehicle.id)}>
                                      {vehicle.name} ({vehicle.registration})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </TableCell>
                          <TableCell>{formatDate(claim.accident_date)}</TableCell>
                          <TableCell className="max-w-[150px] truncate">{claim.pickup_location}</TableCell>
                          <TableCell className="max-w-[150px] truncate">{claim.drop_location}</TableCell>
                          <TableCell>
                            {isUpdatingStatus ? (
                              <div className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="text-xs text-muted-foreground">Updating...</span>
                              </div>
                            ) : (
                              <Select
                                value={claim.status}
                                onValueChange={(value) =>
                                  handleInlineStatusUpdate(claim.id, value as "pending" | "approved" | "cancelled")
                                }
                                disabled={isUpdating}
                              >
                                <SelectTrigger className="w-[130px] h-8">
                                  {getStatusBadge(claim.status)}
                                </SelectTrigger>
                                <SelectContent>
                                  {claimStatusOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </TableCell>
                          <TableCell>
                            {isUpdatingStaff ? (
                              <div className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="text-xs text-muted-foreground">Updating...</span>
                              </div>
                            ) : (
                              <Select
                                value={claim.assigned_staff ? String(claim.assigned_staff) : "unassigned"}
                                onValueChange={(value) => handleInlineStaffUpdate(claim.id, value)}
                                disabled={isUpdating}
                              >
                                <SelectTrigger className="w-[160px] h-8 text-sm">
                                  <div className="flex items-center gap-2">
                                    <User className="w-3 h-3" />
                                    <SelectValue />
                                  </div>
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="unassigned">Unassigned</SelectItem>
                                  {staff.map((staffMember) => (
                                    <SelectItem key={staffMember.id} value={String(staffMember.id)}>
                                      {staffMember.first_name} {staffMember.last_name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="View Details"
                              onClick={() => openModalForClaim(claim)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="flex gap-2 justify-center mt-4">
              <span className="text-sm text-muted-foreground mr-2">Pagination:</span>
              <Button variant="outline" size="sm" className="min-w-[2rem]">
                1
              </Button>
              <Button variant="outline" size="sm" className="min-w-[2rem]">
                2
              </Button>
              <Button variant="outline" size="sm" className="min-w-[2rem]">
                3
              </Button>
              <Button variant="outline" size="sm" className="min-w-[2rem]">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-4 mt-8">
        <p className="text-center text-gray-500 text-xs">© 2025 CodeKonix | All Rights Reserved</p>
      </footer>

      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Booking details</DialogTitle>
            <DialogDescription>Review details and update the booking status</DialogDescription>
          </DialogHeader>

          {selectedClaim && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground uppercase">Customer</p>
                  <p className="font-semibold">
                    {selectedClaim.first_name} {selectedClaim.last_name}
                  </p>
                  <p>{selectedClaim.email}</p>
                  <p>{selectedClaim.phone}</p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground uppercase">Journey</p>
                  <p>Pickup: <span className="text-muted-foreground">{selectedClaim.pickup_location}</span></p>
                  <p>Drop: <span className="text-muted-foreground">{selectedClaim.drop_location}</span></p>
                  <p>Date: <span className="text-muted-foreground">{formatDate(selectedClaim.accident_date)}</span></p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground uppercase">Vehicle</p>
                  <p className="font-semibold">
                    {selectedClaim.vehicle_details?.name || "Unassigned"}
                  </p>
                  {selectedClaim.vehicle_details && (
                    <p className="text-xs text-muted-foreground">
                      Reg: {selectedClaim.vehicle_details.registration || selectedClaim.vehicle_registration || "—"}
                    </p>
                  )}
                  {selectedClaim.vehicle_details?.type && (
                    <p className="text-xs text-muted-foreground">
                      Type: {selectedClaim.vehicle_details.type}
                    </p>
                  )}
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground uppercase">Insurance</p>
                  <p className="font-semibold">{selectedClaim.insurance_company}</p>
                  <p className="font-mono text-xs">Policy #{selectedClaim.policy_number}</p>
                </div>
              </div>

              {selectedClaim.accident_details && (
                <div className="rounded-lg border border-border p-3 text-sm">
                  <p className="text-xs text-muted-foreground uppercase">Accident Details</p>
                  <p className="whitespace-pre-wrap mt-2">{selectedClaim.accident_details}</p>
                </div>
              )}

              {selectedClaim.documents?.length ? (
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground uppercase mb-2">Documents & Media</p>
                  <div className="grid gap-2">
                    {selectedClaim.documents.map((doc) => {
                      const isImage = /\.(png|jpg|jpeg|gif|webp)$/i.test(doc.file_name);
                      return (
                        <div key={doc.id} className="space-y-2">
                          <a
                            href={doc.file_url || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-primary hover:underline break-all text-sm"
                          >
                            {doc.file_name}
                          </a>
                          {isImage && doc.file_url && (
                            <img
                              src={doc.file_url}
                              alt={doc.file_name}
                              className="w-full h-48 object-cover rounded-md"
                              loading="lazy"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select 
                  value={claimStatus} 
                  onValueChange={(value) => setClaimStatus(value as "pending" | "approved" | "cancelled")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {claimStatusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Popover open={staffPopoverOpen} onOpenChange={setStaffPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={staffPopoverOpen}
                      className="w-full justify-between"
                      disabled={modalActionLoading}
                    >
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {selectedStaffId
                          ? staff.find((s) => s.id === selectedStaffId)
                            ? `${staff.find((s) => s.id === selectedStaffId)?.first_name} ${staff.find((s) => s.id === selectedStaffId)?.last_name}`
                            : getStaffName(selectedStaffId)
                          : "Assign staff (by name)"}
                      </div>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search staff by name..." />
                      <CommandList>
                        <CommandEmpty>No staff found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value="unassigned"
                            onSelect={() => {
                              setSelectedStaffId(null);
                              setStaffPopoverOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedStaffId === null ? "opacity-100" : "opacity-0"
                              )}
                            />
                            Unassigned
                          </CommandItem>
                          {staff.map((staffMember) => (
                            <CommandItem
                              key={staffMember.id}
                              value={`${staffMember.first_name} ${staffMember.last_name}`}
                              onSelect={() => {
                                setSelectedStaffId(staffMember.id);
                                setStaffPopoverOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedStaffId === staffMember.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {staffMember.first_name} {staffMember.last_name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <Popover open={vehiclePopoverOpen} onOpenChange={setVehiclePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={vehiclePopoverOpen}
                    className="w-full justify-between"
                    disabled={modalActionLoading}
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {selectedVehicleId
                        ? vehicles.find((v) => v.id === selectedVehicleId)
                          ? vehicles.find((v) => v.id === selectedVehicleId)?.registration
                          : `Vehicle #${selectedVehicleId}`
                        : "Assign vehicle (by registration)"}
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search by registration number..." />
                    <CommandList>
                      <CommandEmpty>No available vehicles found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="unassigned"
                          onSelect={() => {
                            setSelectedVehicleId(null);
                            setVehiclePopoverOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedVehicleId === null ? "opacity-100" : "opacity-0"
                            )}
                          />
                          Unassigned
                        </CommandItem>
                        {vehicles
                          .filter((v) => v.status === "available")
                          .map((vehicle) => (
                            <CommandItem
                              key={vehicle.id}
                              value={`${vehicle.registration} ${vehicle.name}`}
                              onSelect={() => {
                                setSelectedVehicleId(vehicle.id);
                                setVehiclePopoverOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedVehicleId === vehicle.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <span className="font-mono">{vehicle.registration}</span>
                              <span className="ml-2 text-muted-foreground">- {vehicle.name}</span>
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              <Textarea
                placeholder="Internal notes"
                value={claimNotes}
                onChange={(event) => setClaimNotes(event.target.value)}
                rows={4}
              />

              <Button onClick={handleUpdateClaim} disabled={modalActionLoading}>
                {modalActionLoading ? "Saving..." : "Update booking"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Bookings;
