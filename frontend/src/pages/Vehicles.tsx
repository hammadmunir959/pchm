import { useState, useEffect, useCallback } from "react";
import {
  Car,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Loader2,
} from "lucide-react";
import DashboardHeader from "@/components/DashboardHeader";
import DashboardNavBar from "@/components/DashboardNavBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import VehicleModal, { type VehicleModalValues } from "@/components/VehicleModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { vehiclesApi, type Vehicle as VehicleDto } from "@/services/vehiclesApi";
import {
  adminVehiclesApi,
  type VehiclePayload,
  type VehicleStatus as AdminVehicleStatus,
} from "@/services/adminVehiclesApi";
import { useToast } from "@/hooks/use-toast";

type VehicleStatus = AdminVehicleStatus;

const VEHICLE_TYPES = [
  { value: "sedan", label: "Sedan" },
  { value: "suv", label: "SUV" },
  { value: "van", label: "Van" },
  { value: "hatch", label: "Hatch" },
] as const;

const getVehicleTypeLabel = (type: string) =>
  VEHICLE_TYPES.find((option) => option.value === type)?.label ?? type;

type Vehicle = VehicleDto;

type StatusOption = {
  value: VehicleStatus;
  label: string;
  baseClass: string;
  selectedClass: string;
  dotClass: string;
  selectedDotClass: string;
};

const STATUS_OPTIONS: StatusOption[] = [
  {
    value: "available",
    label: "Available",
    baseClass: "border-green-200 text-green-700 hover:bg-green-50 dark:border-green-700/50 dark:text-green-300 dark:hover:bg-green-950/40",
    selectedClass:
      "bg-green-600 text-white border-green-600 shadow-sm dark:bg-green-500 dark:border-green-500",
    dotClass: "bg-green-400",
    selectedDotClass: "bg-white",
  },
  {
    value: "booked",
    label: "Booked",
    baseClass: "border-red-200 text-red-700 hover:bg-red-50 dark:border-red-700/50 dark:text-red-300 dark:hover:bg-red-950/40",
    selectedClass:
      "bg-red-600 text-white border-red-600 shadow-sm dark:bg-red-500 dark:border-red-500",
    dotClass: "bg-red-400",
    selectedDotClass: "bg-white",
  },
  {
    value: "maintenance",
    label: "Maintenance",
    baseClass:
      "border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-700/50 dark:text-amber-200 dark:hover:bg-amber-950/40",
    selectedClass:
      "bg-amber-500 text-white border-amber-500 shadow-sm dark:bg-amber-400 dark:border-amber-400",
    dotClass: "bg-amber-400",
    selectedDotClass: "bg-white",
  },
];

const getVehicleImage = (vehicle: Vehicle) =>
  vehicle.image_url || vehicle.image || "/placeholder.svg";

const gbpFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 2,
});

const formatDailyRate = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === "") return "—";
  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    return gbpFormatter.format(numeric);
  }
  return String(value);
};

const formatTransmission = (value: string | null | undefined) =>
  value ? value.replace(/^\w/, (letter) => letter.toUpperCase()) : "—";

const formatFuel = (value: string | null | undefined) =>
  value ? value.replace(/^\w/, (letter) => letter.toUpperCase()) : "—";

const mapVehicleToModalValues = (vehicle: Vehicle): VehicleModalValues => ({
  id: vehicle.id,
  name: vehicle.name ?? "",
  manufacturer: vehicle.manufacturer ?? "",
  model: vehicle.model ?? "",
  type: vehicle.type as VehicleModalValues["type"],
  color: vehicle.color ?? "",
  registration: vehicle.registration ?? "",
  dailyRate: vehicle.daily_rate ? String(vehicle.daily_rate) : "",
  transmission: vehicle.transmission,
  seats: vehicle.seats ? String(vehicle.seats) : "",
  fuelType: vehicle.fuel_type,
  description: vehicle.description ?? "",
  status: (vehicle.status as VehicleStatus) ?? "available",
  image: getVehicleImage(vehicle),
});

const Vehicles = ({ embedded = false }: { embedded?: boolean }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<number | null>(null);

  // Vehicle data state
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadVehicles = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await vehiclesApi.list();
      setVehicles(data);
    } catch (error) {
      toast({
        title: "Unable to load vehicles",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadVehicles();
  }, [loadVehicles]);

  // Filter vehicles based on search and filters
  const filteredVehicles = vehicles.filter((vehicle) => {
    const lowerQuery = searchQuery.toLowerCase();
    const searchableFields = [
      vehicle.name,
      vehicle.registration,
      vehicle.manufacturer,
      vehicle.model,
      vehicle.color,
    ];
    const matchesSearch =
      searchQuery === "" ||
      searchableFields.some((field) => field?.toLowerCase().includes(lowerQuery));

    const matchesType = filterType === "all" || vehicle.type === filterType;
    const matchesStatus = filterStatus === "all" || vehicle.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusLabel = (status: VehicleStatus) =>
    STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status;

  // CRUD Handlers
  const handleAddVehicle = () => {
    console.log("Add Vehicle clicked");
    setSelectedVehicle(null);
    setIsModalOpen(true);
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    console.log("Edit Vehicle clicked:", vehicle);
    setSelectedVehicle(vehicle);
    setIsModalOpen(true);
  };

  const handleDeleteVehicle = (vehicle: Vehicle) => {
    console.log("Delete Vehicle clicked:", vehicle);
    setVehicleToDelete(vehicle);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!vehicleToDelete) return;
    try {
      await adminVehiclesApi.delete(vehicleToDelete.id);
      toast({
        title: "Vehicle removed",
        description: `${vehicleToDelete.name} has been deleted.`,
      });
      setVehicleToDelete(null);
      setDeleteDialogOpen(false);
      loadVehicles();
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSaveVehicle = async ({ id, ...vehicleData }: VehiclePayload & { id?: number }) => {
    const normalizedPayload: VehiclePayload = {
      ...vehicleData,
      type: vehicleData.type?.toLowerCase?.() ?? vehicleData.type,
    };

    try {
      if (id) {
        await adminVehiclesApi.update(id, normalizedPayload);
        toast({ title: "Vehicle updated" });
      } else {
        await adminVehiclesApi.create(normalizedPayload);
        toast({ title: "Vehicle added" });
      }

      setSelectedVehicle(null);
      await loadVehicles();
    } catch (error) {
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
      throw error instanceof Error ? error : new Error("Vehicle save failed.");
    }
  };

  const handleStatusChange = async (vehicleId: number, newStatus: VehicleStatus) => {
    const currentVehicle = vehicles.find((vehicle) => vehicle.id === vehicleId);
    if (!currentVehicle || currentVehicle.status === newStatus) {
      return;
    }

    setStatusUpdatingId(vehicleId);
    try {
      await adminVehiclesApi.updateStatus(vehicleId, newStatus);
      setVehicles((prev) =>
        prev.map((vehicle) =>
          vehicle.id === vehicleId
            ? {
                ...vehicle,
                status: newStatus,
              }
            : vehicle,
        ),
      );
      toast({
        title: "Status updated",
        description: `${currentVehicle.name} marked as ${getStatusLabel(newStatus)}.`,
      });
    } catch (error) {
      toast({
        title: "Status update failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const modalVehicle = selectedVehicle ? mapVehicleToModalValues(selectedVehicle) : null;

  return (
    <div className={embedded ? "" : "min-h-screen flex flex-col bg-background"}>
      {!embedded && <DashboardHeader />}
      {!embedded && <DashboardNavBar />}
      <main className={embedded ? "" : "flex-grow py-8"}>
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <Car className="w-8 h-8 text-accent" />
              {embedded ? "Fleet" : "Vehicle Management"}
            </h1>
            <p className="text-muted-foreground">
              {embedded ? "Manage and track your vehicle fleet" : "Manage and track your vehicle fleet"}
            </p>
          </div>

          {/* Top Bar Controls */}
          <div className="bg-white dark:bg-card shadow rounded-xl mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-center p-4 gap-4">
              {/* Add Vehicle Button */}
              <Button 
                onClick={handleAddVehicle}
                className="bg-blue-500 hover:bg-blue-600 text-white w-full sm:w-auto whitespace-nowrap"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Vehicle
              </Button>

              {/* Search */}
              <div className="flex-1 w-full sm:max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="🔍 Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Type Filter */}
              <div className="w-full sm:w-48">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-full">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter: Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {VEHICLE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div className="w-full sm:w-48">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter: Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="booked">Booked</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Table of Vehicles */}
          <div className="bg-white dark:bg-card shadow rounded-xl p-4">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Image</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Reg No.</TableHead>
                    <TableHead>Transmission</TableHead>
                    <TableHead>Fuel / Seats</TableHead>
                    <TableHead>Daily Rate</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        Loading vehicles...
                      </TableCell>
                    </TableRow>
                  ) : filteredVehicles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        No vehicles found matching your criteria
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredVehicles.map((vehicle) => (
                      <TableRow key={vehicle.id}>
                        <TableCell>
                          <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                            {getVehicleImage(vehicle) ? (
                              <img
                                src={getVehicleImage(vehicle)}
                                alt={vehicle.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "/placeholder.svg";
                                }}
                              />
                            ) : (
                              <Car className="w-8 h-8 text-gray-400" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold">{vehicle.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {[vehicle.manufacturer, vehicle.model].filter(Boolean).join(" • ") || "—"}
                          </div>
                          {vehicle.color && (
                            <div className="text-xs text-muted-foreground">Colour: {vehicle.color}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{getVehicleTypeLabel(vehicle.type)}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {vehicle.registration}
                        </TableCell>
                        <TableCell className="capitalize text-sm">
                          {formatTransmission(vehicle.transmission)}
                        </TableCell>
                        <TableCell className="text-sm">
                          <div>{formatFuel(vehicle.fuel_type)}</div>
                          <div className="text-xs text-muted-foreground">{vehicle.seats} seats</div>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatDailyRate(vehicle.daily_rate)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1" role="radiogroup" aria-label="Vehicle status">
                            {STATUS_OPTIONS.map((option) => {
                              const selected = vehicle.status === option.value;
                              return (
                                <button
                                  key={option.value}
                                  type="button"
                                  role="radio"
                                  aria-checked={selected}
                                  disabled={statusUpdatingId === vehicle.id}
                                  className={`flex items-center gap-2 rounded-md border px-3 py-1 text-xs font-semibold transition-colors ${
                                    selected ? option.selectedClass : option.baseClass
                                  } ${statusUpdatingId === vehicle.id ? "opacity-60 cursor-not-allowed" : ""}`}
                                  onClick={() => {
                                    if (!selected) {
                                      handleStatusChange(vehicle.id, option.value);
                                    }
                                  }}
                                >
                                  <span
                                    className={`h-2.5 w-2.5 rounded-full ${
                                      selected ? option.selectedDotClass : option.dotClass
                                    }`}
                                  />
                                  {option.label}
                                </button>
                              );
                            })}
                            {statusUpdatingId === vehicle.id && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                Updating...
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-blue-600 hover:text-blue-700"
                              title="Edit"
                              onClick={() => handleEditVehicle(vehicle)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:text-red-700"
                              title="Delete"
                              onClick={() => handleDeleteVehicle(vehicle)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
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
      {!embedded && (
        <footer className="py-4 mt-8">
          <p className="text-center text-gray-500 text-xs">
            © 2025 CodeKonix | All Rights Reserved
          </p>
        </footer>
      )}

      {/* Vehicle Modal */}
      <VehicleModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        vehicle={modalVehicle}
        onSave={handleSaveVehicle}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the vehicle{" "}
              <strong>{vehicleToDelete?.name}</strong> ({vehicleToDelete?.registration}).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setVehicleToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Vehicles;

