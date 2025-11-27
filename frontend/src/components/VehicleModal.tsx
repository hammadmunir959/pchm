import { useState, useEffect } from "react";
import { Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  VehicleFuelType,
  VehiclePayload,
  VehicleStatus,
  VehicleTransmission,
} from "@/services/adminVehiclesApi";

const VEHICLE_TYPES = [
  { value: "sedan", label: "Sedan" },
  { value: "suv", label: "SUV" },
  { value: "van", label: "Van" },
  { value: "hatch", label: "Hatch" },
] as const;

const TRANSMISSION_OPTIONS = [
  { value: "automatic", label: "Automatic" },
  { value: "manual", label: "Manual" },
] as const;

const FUEL_TYPES = [
  { value: "petrol", label: "Petrol" },
  { value: "diesel", label: "Diesel" },
  { value: "hybrid", label: "Hybrid" },
  { value: "electric", label: "Electric" },
] as const;

type VehicleType = (typeof VEHICLE_TYPES)[number]["value"];
type TransmissionType = (typeof TRANSMISSION_OPTIONS)[number]["value"];
type FuelType = (typeof FUEL_TYPES)[number]["value"];

interface VehicleFormData {
  name: string;
  manufacturer: string;
  model: string;
  type: VehicleType | "";
  color: string;
  registration: string;
  dailyRate: string;
  transmission: TransmissionType | "";
  seats: string;
  fuelType: FuelType | "";
  description: string;
  status: VehicleStatus;
  imageFile?: File | null;
}

export interface VehicleModalValues {
  id?: number;
  name?: string;
  manufacturer?: string;
  model?: string;
  type?: VehicleType | string;
  color?: string;
  registration?: string;
  dailyRate?: string;
  transmission?: VehicleTransmission;
  seats?: string;
  fuelType?: VehicleFuelType;
  description?: string;
  status?: VehicleStatus;
  image?: string | null;
}

interface VehicleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle?: VehicleModalValues | null;
  onSave?: (vehicleData: VehiclePayload & { id?: number }) => Promise<void> | void;
}

const buildInitialState = (vehicle?: VehicleModalValues | null): VehicleFormData => ({
  name: vehicle?.name ?? "",
  manufacturer: vehicle?.manufacturer ?? "",
  model: vehicle?.model ?? "",
  type: (vehicle?.type as VehicleType) ?? "",
  color: vehicle?.color ?? "",
  registration: vehicle?.registration ?? "",
  dailyRate: vehicle?.dailyRate ?? "",
  transmission: (vehicle?.transmission as TransmissionType) ?? "",
  seats: vehicle?.seats ?? "",
  fuelType: (vehicle?.fuelType as FuelType) ?? "",
  description: vehicle?.description ?? "",
  status: (vehicle?.status || "available") as VehicleStatus,
  imageFile: null,
});

const VehicleModal = ({ open, onOpenChange, vehicle = null, onSave }: VehicleModalProps) => {
  const [formData, setFormData] = useState<VehicleFormData>(() => buildInitialState(vehicle));

  const [imagePreview, setImagePreview] = useState<string | null>(vehicle?.image || null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Update form data when vehicle prop changes
  useEffect(() => {
    setFormData(buildInitialState(vehicle));
    setImagePreview(vehicle?.image || null);
    setFormError(null);
  }, [vehicle, open]);

  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  // Handlers
  const handleSave = async () => {
    if (
      !formData.name.trim() ||
      !formData.registration.trim() ||
      !formData.type ||
      !formData.dailyRate ||
      !formData.transmission ||
      !formData.seats ||
      !formData.fuelType
    ) {
      setFormError("Please fill in all required fields.");
      return;
    }

    const seatsValue = Number(formData.seats);
    const dailyRateValue = Number(formData.dailyRate);

    if (!Number.isFinite(seatsValue) || seatsValue <= 0) {
      setFormError("Seats must be a number greater than zero.");
      return;
    }

    if (!Number.isFinite(dailyRateValue) || dailyRateValue < 0) {
      setFormError("Daily rate must be zero or a positive amount.");
      return;
    }

    if (!onSave) return;

    setFormError(null);
    setIsSaving(true);
    try {
      const payload: VehiclePayload & { id?: number } = {
        id: vehicle?.id,
        name: formData.name.trim(),
        manufacturer: formData.manufacturer.trim() || undefined,
        model: formData.model.trim() || undefined,
        type: formData.type as VehicleType,
        color: formData.color.trim() || undefined,
        registration: formData.registration.trim(),
        dailyRate: dailyRateValue.toFixed(2),
        transmission: formData.transmission as VehicleTransmission,
        seats: seatsValue,
        fuelType: formData.fuelType as VehicleFuelType,
        description: formData.description.trim() || undefined,
        status: formData.status,
        imageFile: formData.imageFile ?? null,
      };

      await onSave(payload);
      onOpenChange(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      setFormData({ ...formData, imageFile: file });
    }
  };

  const handleInputChange = (field: keyof VehicleFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{vehicle ? "Edit Vehicle" : "Add New Vehicle"}</DialogTitle>
          <DialogDescription>
            {vehicle ? "Update vehicle information" : "Fill in the details to add a new vehicle to the fleet"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="e.g., BMW X5"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="manufacturer">Manufacturer</Label>
              <Input
                id="manufacturer"
                placeholder="e.g., BMW"
                value={formData.manufacturer}
                onChange={(e) => handleInputChange("manufacturer", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                placeholder="e.g., X5"
                value={formData.model}
                onChange={(e) => handleInputChange("model", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="color">Colour</Label>
              <Input
                id="color"
                placeholder="e.g., Midnight Black"
                value={formData.color}
                onChange={(e) => handleInputChange("color", e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="type">Vehicle Type *</Label>
              <Select
                value={formData.type || "placeholder"}
                onValueChange={(value) => handleInputChange("type", value)}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select vehicle type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="placeholder" disabled>
                    Select vehicle type
                  </SelectItem>
                  {VEHICLE_TYPES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="registration">Reg No. *</Label>
              <Input
                id="registration"
                placeholder="e.g., ABC-123"
                value={formData.registration}
                onChange={(e) => handleInputChange("registration", e.target.value)}
                className="font-mono"
              />
            </div>
          </div>

  <div className="grid gap-4 md:grid-cols-3">
    <div className="grid gap-2">
      <Label htmlFor="dailyRate">Daily Rate (£) *</Label>
      <Input
        id="dailyRate"
        type="number"
        min="0"
        step="0.01"
        placeholder="e.g., 95"
        value={formData.dailyRate}
        onChange={(e) => handleInputChange("dailyRate", e.target.value)}
      />
    </div>
    <div className="grid gap-2">
      <Label htmlFor="transmission">Transmission *</Label>
      <Select
        value={formData.transmission || "placeholder"}
        onValueChange={(value) => handleInputChange("transmission", value)}
      >
        <SelectTrigger id="transmission">
          <SelectValue placeholder="Select transmission" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="placeholder" disabled>
            Select transmission
          </SelectItem>
          {TRANSMISSION_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
    <div className="grid gap-2">
      <Label htmlFor="seats">Seats *</Label>
      <Input
        id="seats"
        type="number"
        min="1"
        step="1"
        placeholder="e.g., 5"
        value={formData.seats}
        onChange={(e) => handleInputChange("seats", e.target.value)}
      />
    </div>
  </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="fuelType">Fuel Type *</Label>
              <Select
                value={formData.fuelType || "placeholder"}
                onValueChange={(value) => handleInputChange("fuelType", value)}
              >
                <SelectTrigger id="fuelType">
                  <SelectValue placeholder="Select fuel type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="placeholder" disabled>
                    Select fuel type
                  </SelectItem>
                  {FUEL_TYPES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status *</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="booked">Booked</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Highlight trim, condition, mileage, or availability details..."
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              rows={4}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="image-upload">Image Upload</Label>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Label
                  htmlFor="image-upload"
                  className="flex items-center justify-center gap-2 px-4 py-2 border border-dashed rounded-md cursor-pointer hover:bg-accent transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  <span className="text-sm">Choose image or drag and drop</span>
                </Label>
              </div>
              {imagePreview && (
                <div className="w-24 h-24 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-blue-500 hover:bg-blue-600 text-white" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
        {formError && (
          <p className="text-sm text-red-600 pt-2" role="alert">
            {formError}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default VehicleModal;

