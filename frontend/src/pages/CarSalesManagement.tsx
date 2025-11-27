import { useEffect, useMemo, useState } from "react";
import DashboardHeader from "@/components/DashboardHeader";
import DashboardNavBar from "@/components/DashboardNavBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useToast } from "@/hooks/use-toast";
import { adminCarSalesApi, type CarListingPayload } from "@/services/adminCarSalesApi";
import type { CarListing } from "@/services/carSalesApi";
import { Plus, Car, RefreshCw, Trash2, Image as ImageIcon, UploadCloud, X, Search, Filter, Edit } from "lucide-react";

const STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "sold", label: "Sold" },
  { value: "archived", label: "Archived" },
];

const defaultPayload: CarListingPayload = {
  make: "",
  model: "",
  year: new Date().getFullYear(),
  mileage: 0,
  color: "",
  registration: "",
  price: 0,
  original_price: null,
  fuel_type: "petrol",
  transmission: "automatic",
  engine_size: "",
  doors: 4,
  seats: 5,
  description: "",
  features: [],
  condition: "Used",
  location: "",
  status: "draft",
  featured: false,
};

const CarSalesManagement = ({ embedded = false }: { embedded?: boolean }) => {
  const { toast } = useToast();
  const [listings, setListings] = useState<CarListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingListing, setEditingListing] = useState<CarListing | null>(null);
  const [formData, setFormData] = useState<CarListingPayload>(defaultPayload);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CarListing | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageAltText, setImageAltText] = useState("");

  const loadListings = async () => {
    setIsLoading(true);
    try {
      const params = filterStatus === "all" ? {} : { status: filterStatus };
      const data = await adminCarSalesApi.list(params);
      setListings(data);
    } catch (error) {
      toast({
        title: "Unable to load listings",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadListings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus]);

  const filteredListings = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return listings.filter((listing) => {
      const matchesSearch =
        query === "" ||
        listing.make.toLowerCase().includes(query) ||
        listing.model.toLowerCase().includes(query) ||
        listing.registration.toLowerCase().includes(query);
      return matchesSearch;
    });
  }, [listings, searchQuery]);

  const resetMediaState = () => {
    if (imagePreview && imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(null);
    setImagePreview(null);
    setImageAltText("");
  };

  const openCreateDialog = () => {
    setEditingListing(null);
    setFormData(defaultPayload);
    resetMediaState();
    setIsDialogOpen(true);
  };

  const openEditDialog = (listing: CarListing) => {
    setEditingListing(listing);
    setFormData({
      make: listing.make,
      model: listing.model,
      year: listing.year,
      mileage: listing.mileage,
      color: listing.color,
      registration: listing.registration,
      price: Number(listing.price),
      original_price: listing.original_price ? Number(listing.original_price) : null,
      fuel_type: listing.fuel_type,
      transmission: listing.transmission,
      engine_size: listing.engine_size || "",
      doors: listing.doors,
      seats: listing.seats,
      description: listing.description,
      features: Array.isArray(listing.features) ? listing.features : [],
      condition: listing.condition,
      location: listing.location || "",
      status: listing.status,
      featured: listing.featured,
    });
    const primaryImage =
      listing.primary_image ||
      listing.images?.find((image) => image.is_primary)?.image_url ||
      listing.images?.[0]?.image_url ||
      null;
    const primaryAlt =
      listing.images?.find((image) => image.is_primary)?.alt_text ||
      listing.images?.[0]?.alt_text ||
      "";
    setImagePreview(primaryImage ?? null);
    setImageAltText(primaryAlt ?? "");
    setImageFile(null);
    setIsDialogOpen(true);
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);

    try {
      const payload: CarListingPayload = {
        ...formData,
        year: Number(formData.year),
        mileage: Number(formData.mileage),
        price: Number(formData.price),
        doors: Number(formData.doors),
        seats: Number(formData.seats),
        features: formData.features.filter(Boolean),
      };

      let savedListing: CarListing;
      if (editingListing) {
        savedListing = await adminCarSalesApi.update(editingListing.id, payload);
        toast({ title: "Listing updated" });
      } else {
        savedListing = await adminCarSalesApi.create(payload);
        toast({ title: "Listing created" });
      }

      if (imageFile) {
        try {
          await adminCarSalesApi.uploadImage(savedListing.id, {
            image: imageFile,
            altText: imageAltText,
            isPrimary: true,
          });
          toast({ title: "Primary image uploaded" });
        } catch (error) {
          toast({
            title: "Image upload failed",
            description: error instanceof Error ? error.message : "Please try again later.",
            variant: "destructive",
          });
        }
      }

      setIsDialogOpen(false);
      setEditingListing(null);
      resetMediaState();
      await loadListings();
    } catch (error) {
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminCarSalesApi.delete(deleteTarget.id);
      toast({ title: "Listing deleted" });
      setDeleteTarget(null);
      loadListings();
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const quickUpdate = async (id: number, payload: Partial<CarListingPayload>) => {
    try {
      await adminCarSalesApi.update(id, payload);
      loadListings();
      toast({ title: "Listing updated" });
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingListing(null);
      resetMediaState();
      setFormData(defaultPayload);
    }
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    if (imagePreview && imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeSelectedImage = () => {
    resetMediaState();
  };

  return (
    <div className={embedded ? "" : "min-h-screen flex flex-col bg-background"}>
      {!embedded && <DashboardHeader />}
      {!embedded && <DashboardNavBar />}

      <main className={embedded ? "" : "flex-grow py-8"}>
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <Car className="w-8 h-8 text-accent" />
              {embedded ? "Cars for Sale" : "Car Listings"}
            </h1>
            <p className="text-muted-foreground">
              Manage cars available for sale across the Prestige fleet
            </p>
          </div>

          {/* Top Bar Controls */}
          <div className="bg-white dark:bg-card shadow rounded-xl mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-center p-4 gap-4">
              {/* Add Listing Button */}
              <Button 
                onClick={openCreateDialog}
                className="bg-blue-500 hover:bg-blue-600 text-white w-full sm:w-auto whitespace-nowrap"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Listing
              </Button>

              {/* Search */}
              <div className="flex-1 w-full sm:max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="🔍 Search by make, model or registration..."
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    className="pl-10"
                  />
                </div>
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
                    {STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Refresh Button */}
              <Button variant="outline" onClick={loadListings} disabled={isLoading} className="w-full sm:w-auto">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          <div className="bg-white dark:bg-card shadow rounded-xl p-4">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Reg</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Fuel</TableHead>
                    <TableHead>Operations</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Loading listings...
                      </TableCell>
                    </TableRow>
                  ) : filteredListings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No listings found matching your criteria
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredListings.map((listing) => (
                      <TableRow key={listing.id}>
                        <TableCell>
                          <div>
                            <div className="font-semibold">
                              {listing.year} {listing.make} {listing.model}
                            </div>
                            <p className="text-xs text-muted-foreground">{listing.mileage} miles</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{listing.registration}</TableCell>
                        <TableCell>£{Number(listing.price).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={`capitalize ${
                              listing.status === "published" 
                                ? "bg-green-100 text-green-700 border-green-200" 
                                : listing.status === "draft"
                                ? "bg-gray-100 text-gray-700 border-gray-200"
                                : listing.status === "sold"
                                ? "bg-blue-100 text-blue-700 border-blue-200"
                                : "bg-orange-100 text-orange-700 border-orange-200"
                            }`}
                          >
                            {listing.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="capitalize">{listing.fuel_type}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-blue-600 hover:text-blue-700"
                              title="Edit"
                              onClick={() => openEditDialog(listing)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:text-red-700"
                              title="Delete"
                              onClick={() => setDeleteTarget(listing)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`h-8 ${listing.status === "published" ? "text-gray-600 hover:text-gray-700" : "text-green-600 hover:text-green-700"}`}
                              title={listing.status === "published" ? "Archive" : "Publish"}
                              onClick={() =>
                                quickUpdate(listing.id, {
                                  status: listing.status === "published" ? "archived" : "published",
                                })
                              }
                            >
                              {listing.status === "published" ? "Archive" : "Publish"}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`h-8 ${listing.featured ? "text-yellow-600 hover:text-yellow-700" : "text-gray-600 hover:text-gray-700"}`}
                              title={listing.featured ? "Unfeature" : "Feature"}
                              onClick={() => quickUpdate(listing.id, { featured: !listing.featured })}
                            >
                              {listing.featured ? "Featured" : "Feature"}
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
            © {new Date().getFullYear()} CodeKonix | All Rights Reserved
          </p>
        </footer>
      )}

      {/* Create / edit dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingListing ? "Edit listing" : "Create listing"}</DialogTitle>
            <DialogDescription>Provide the core vehicle details and pricing</DialogDescription>
          </DialogHeader>

          <form className="space-y-6" onSubmit={handleSave}>
            <section className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Vehicle details</h3>
                <p className="text-sm text-muted-foreground">
                  Give buyers the basics — make, model, year, mileage and colour.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="make">Make</Label>
                  <Input
                    id="make"
                    placeholder="e.g., Range Rover"
                    value={formData.make}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, make: event.target.value }))
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    placeholder="e.g., Vogue SE"
                    value={formData.model}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, model: event.target.value }))
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    type="number"
                    placeholder="e.g., 2022"
                    value={formData.year}
                    min={1950}
                    max={new Date().getFullYear() + 1}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, year: Number(event.target.value) }))
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="mileage">Mileage</Label>
                  <Input
                    id="mileage"
                    type="number"
                    placeholder="Total miles driven"
                    value={formData.mileage}
                    min={0}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, mileage: Number(event.target.value) }))
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="color">Colour</Label>
                  <Input
                    id="color"
                    placeholder="e.g., Santorini Black"
                    value={formData.color}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, color: event.target.value }))
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="registration">Registration</Label>
                  <Input
                    id="registration"
                    placeholder="e.g., AB21 PCH"
                    value={formData.registration}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, registration: event.target.value }))
                    }
                    required
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Pricing & availability</h3>
                <p className="text-sm text-muted-foreground">
                  Set fair pricing and determine the listing status.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="price">Price (£)</Label>
                  <Input
                    id="price"
                    type="number"
                    min={0}
                    step="100"
                    placeholder="e.g., 64,950"
                    value={formData.price}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, price: Number(event.target.value) }))
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="original-price">Original / MSRP (optional)</Label>
                  <Input
                    id="original-price"
                    type="number"
                    min={0}
                    step="100"
                    placeholder="Useful for highlighting savings"
                    value={formData.original_price ?? ""}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        original_price: event.target.value ? Number(event.target.value) : null,
                      }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">Listing status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="e.g., London Heathrow showroom"
                    value={formData.location}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, location: event.target.value }))
                    }
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Mechanical details</h3>
                <p className="text-sm text-muted-foreground">
                  Help buyers understand the spec — powertrain, seats and more.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Fuel type</Label>
                  <Select
                    value={formData.fuel_type}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, fuel_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select fuel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="petrol">Petrol</SelectItem>
                      <SelectItem value="diesel">Diesel</SelectItem>
                      <SelectItem value="electric">Electric</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Transmission</Label>
                  <Select
                    value={formData.transmission}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, transmission: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select transmission" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="automatic">Automatic</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="engine-size">Engine size</Label>
                  <Input
                    id="engine-size"
                    placeholder="e.g., 3.0L V6"
                    value={formData.engine_size}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, engine_size: event.target.value }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="doors">Doors</Label>
                  <Input
                    id="doors"
                    type="number"
                    min={2}
                    max={6}
                    placeholder="Number of doors"
                    value={formData.doors}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, doors: Number(event.target.value) }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="seats">Seats</Label>
                  <Input
                    id="seats"
                    type="number"
                    min={2}
                    max={9}
                    placeholder="Passenger capacity"
                    value={formData.seats}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, seats: Number(event.target.value) }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="condition">Condition</Label>
                  <Input
                    id="condition"
                    placeholder="e.g., Approved Used"
                    value={formData.condition}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, condition: event.target.value }))
                    }
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Copy & features</h3>
                <p className="text-sm text-muted-foreground">
                  Use inviting language — this content feeds the public listing.
                </p>
              </div>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Tell the story of this car, highlight history, servicing, unique selling points..."
                    value={formData.description}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, description: event.target.value }))
                    }
                    rows={4}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="features">Key features</Label>
                  <Textarea
                    id="features"
                    placeholder="Comma-separated list, e.g., Panoramic roof, Heated seats, Meridian audio"
                    value={formData.features.join(", ")}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        features: event.target.value
                          .split(",")
                          .map((item) => item.trim())
                          .filter(Boolean),
                      }))
                    }
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    These render as bullet points on the public detail page.
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <input
                  id="featured"
                  type="checkbox"
                  className="h-4 w-4"
                  checked={formData.featured}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, featured: event.target.checked }))
                  }
                />
                <Label htmlFor="featured" className="text-sm font-normal">
                  Feature this listing on the public website (appears first in the grid)
                </Label>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-muted-foreground" />
                <div>
                  <h3 className="text-lg font-semibold">Primary image</h3>
                  <p className="text-sm text-muted-foreground">
                    Upload the hero image buyers will see first (landscape, at least 1600px wide).
                  </p>
                </div>
              </div>
              <div className="grid gap-3">
                <Label
                  htmlFor="primary-image"
                  className="flex flex-col gap-2 rounded-lg border border-dashed border-muted-foreground/40 p-4 text-sm text-muted-foreground hover:bg-muted/40 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span>{imageFile ? imageFile.name : "Upload or drag a JPG/PNG"}</span>
                    <UploadCloud className="w-4 h-4" />
                  </div>
                  <Input
                    id="primary-image"
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={handleImageChange}
                  />
                </Label>
                {imagePreview && (
                  <div className="flex items-center gap-4">
                    <img
                      src={imagePreview}
                      alt="Primary preview"
                      className="h-24 w-40 rounded-md object-cover border"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground"
                      onClick={removeSelectedImage}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                <div className="grid gap-2">
                  <Label htmlFor="image-alt">Alt text (optional)</Label>
                  <Input
                    id="image-alt"
                    placeholder="Describe the scene for accessibility, e.g., Front three-quarter shot."
                    value={imageAltText}
                    onChange={(event) => setImageAltText(event.target.value)}
                  />
                </div>
              </div>
            </section>

            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : editingListing ? "Update listing" : "Create listing"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete listing</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete{" "}
              <strong>{deleteTarget?.make} {deleteTarget?.model}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CarSalesManagement;


