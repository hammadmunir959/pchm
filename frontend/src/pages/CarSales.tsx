import { useEffect, useMemo, useState, useCallback } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import AnimatedSection from "@/components/AnimatedSection";
import useEmblaCarousel from "embla-carousel-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { carSalesApi, type CarListing, type SellRequestPayload } from "@/services/carSalesApi";
import { Label } from "@/components/ui/label";

const fuelFilters = [
  { value: "all", label: "All fuel types" },
  { value: "petrol", label: "Petrol" },
  { value: "diesel", label: "Diesel" },
  { value: "electric", label: "Electric" },
  { value: "hybrid", label: "Hybrid" },
];

const transmissionFilters = [
  { value: "all", label: "All transmissions" },
  { value: "automatic", label: "Automatic" },
  { value: "manual", label: "Manual" },
];

const CarSales = () => {
  const { toast } = useToast();
  const [listings, setListings] = useState<CarListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState<CarListing | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [sellFormSubmitting, setSellFormSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Carousel setup
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "center",
    skipSnaps: false,
  });
  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  const [filters, setFilters] = useState({
    fuel: "all",
    transmission: "all",
    search: "",
  });

  useEffect(() => {
    const loadListings = async () => {
      setLoading(true);
      try {
        const data = await carSalesApi.list({ status: "published" });
        setListings(data);
      } catch (error) {
        toast({
          title: "Unable to load vehicles",
          description: error instanceof Error ? error.message : "Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadListings();
  }, [toast]);

  // Auto-play carousel
  useEffect(() => {
    if (!emblaApi) return;

    let animationFrame: number;
    const autoplay = () => {
      animationFrame = window.setTimeout(() => {
        emblaApi.scrollNext();
        autoplay();
      }, 4000); // 4 seconds for car sales (slightly longer than fleet)
    };

    autoplay();

    emblaApi.on("pointerDown", () => {
      window.clearTimeout(animationFrame);
    });

    emblaApi.on("pointerUp", () => {
      autoplay();
    });

    return () => {
      window.clearTimeout(animationFrame);
    };
  }, [emblaApi]);

  const filteredListings = useMemo(() => {
    return listings.filter((listing) => {
      const matchesFuel = filters.fuel === "all" || listing.fuel_type === filters.fuel;
      const matchesTransmission =
        filters.transmission === "all" || listing.transmission === filters.transmission;
      const query = filters.search.toLowerCase();
      const matchesSearch =
        query === "" ||
        listing.make.toLowerCase().includes(query) ||
        listing.model.toLowerCase().includes(query) ||
        listing.registration.toLowerCase().includes(query);

      return matchesFuel && matchesTransmission && matchesSearch;
    });
  }, [filters, listings]);

  const handleOpenDialog = (listing: CarListing) => {
    setSelectedListing(listing);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedListing) return;
    setFormSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      await carSalesApi.submitPurchaseRequest(selectedListing.id, {
        name: formData.get("name")?.toString() || "",
        email: formData.get("email")?.toString() || "",
        phone: formData.get("phone")?.toString() || "",
        message: formData.get("message")?.toString() || "",
        offer_price: formData.get("offerPrice")
          ? Number(formData.get("offerPrice"))
          : undefined,
        financing_required: formData.get("financing") === "on",
        trade_in_details: formData.get("tradeIn")?.toString() || "",
      });

      toast({
        title: "Request sent",
        description: "Our sales specialists will contact you shortly.",
      });
      setIsDialogOpen(false);
      form.reset();
    } catch (error) {
      toast({
        title: "Could not submit request",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleSellFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSellFormSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);

    const email = formData.get("sellEmail")?.toString() || "";
    const phone = formData.get("sellPhone")?.toString() || "";

    if (!email && !phone) {
      toast({
        title: "Contact information required",
        description: "Please provide either an email or phone number.",
        variant: "destructive",
      });
      setSellFormSubmitting(false);
      return;
    }

    const payload: SellRequestPayload = {
      name: formData.get("sellName")?.toString() || "",
      email: email || undefined,
      phone: phone || undefined,
      vehicle_make: formData.get("vehicleMake")?.toString() || "",
      vehicle_model: formData.get("vehicleModel")?.toString() || "",
      vehicle_year: formData.get("vehicleYear")
        ? Number(formData.get("vehicleYear"))
        : undefined,
      mileage: formData.get("mileage") ? Number(formData.get("mileage")) : undefined,
      message: formData.get("sellMessage")?.toString() || undefined,
      vehicle_image: (formData.get("vehicleImage") as File) || null,
    };

    try {
      await carSalesApi.submitSellRequest(payload);

      toast({
        title: "Request sent",
        description: "Our team will contact you shortly to discuss your vehicle.",
      });
      form.reset();
      setImagePreview(null);
    } catch (error) {
      toast({
        title: "Could not submit request",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setSellFormSubmitting(false);
    }
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const getImage = (listing: CarListing) =>
    listing.primary_image ||
    listing.images?.find((image) => image.is_primary)?.image_url ||
    "/placeholder.svg";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />

      <main className="flex-1 py-12 lg:py-16">
        <div className="container mx-auto px-4">
          <AnimatedSection>
            <div className="text-center mb-12">
              <Badge className="mb-4">Premium Vehicle Marketplace</Badge>
              <h1 className="text-4xl font-bold mb-4">Car Sales & Acquisition</h1>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Explore our curated collection of accident replacement vehicles ready for purchase.
                Every vehicle is vetted, maintained, and supported by our concierge team.
              </p>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={100}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
              <Input
                placeholder="Search by make, model or registration"
                value={filters.search}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, search: event.target.value }))
                }
              />
              <Select
                value={filters.fuel}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, fuel: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by fuel type" />
                </SelectTrigger>
                <SelectContent>
                  {fuelFilters.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filters.transmission}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, transmission: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by transmission" />
                </SelectTrigger>
                <SelectContent>
                  {transmissionFilters.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </AnimatedSection>

          {/* Carousel Section */}
          {!loading && filteredListings.length > 0 && (
            <AnimatedSection delay={150}>
              <section className="relative mx-auto h-[calc(100vh-200px)] w-full max-w-7xl mb-16">
                <div className="absolute inset-0 overflow-hidden rounded-3xl border border-border bg-card shadow-2xl transition-colors" ref={emblaRef}>
                  <div className="flex h-full">
                    {filteredListings.map((listing) => (
                      <article
                        key={listing.id}
                        className="relative min-w-full h-full group"
                      >
                        <img
                          src={getImage(listing)}
                          alt={`${listing.make} ${listing.model}`}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                          onError={(event) => {
                            (event.target as HTMLImageElement).src = "/placeholder.svg";
                          }}
                        />

                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent opacity-90 dark:opacity-90" />

                        <div className="absolute inset-0 flex flex-col justify-between p-10 sm:p-14 space-y-6">
                          <div className="space-y-3">
                            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs uppercase tracking-wide">
                              {listing.featured ? "Featured Listing" : "Available Now"}
                            </span>
                            <h2 className="text-4xl font-semibold text-white">
                              {listing.year} {listing.make} {listing.model}
                            </h2>
                            <p className="text-white/70 text-lg uppercase tracking-wide">
                              {listing.registration}
                            </p>
                          </div>

                          <div className="space-y-6">
                            <p className="max-w-xl text-white/80 text-lg line-clamp-2">
                              {listing.description || "Premium vehicle available for purchase."}
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm text-white/70 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                              <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
                                <p className="text-xs uppercase tracking-wide">Price</p>
                                <p className="mt-1 text-base text-white font-semibold">
                                  £{Number(listing.price).toLocaleString()}
                                </p>
                              </div>
                              <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
                                <p className="text-xs uppercase tracking-wide">Mileage</p>
                                <p className="mt-1 text-base text-white">
                                  {listing.mileage.toLocaleString()} mi
                                </p>
                              </div>
                              <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
                                <p className="text-xs uppercase tracking-wide">Fuel</p>
                                <p className="mt-1 text-base text-white capitalize">
                                  {listing.fuel_type}
                                </p>
                              </div>
                              <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
                                <p className="text-xs uppercase tracking-wide">Transmission</p>
                                <p className="mt-1 text-base text-white capitalize">
                                  {listing.transmission}
                                </p>
                              </div>
                            </div>
                            <Button
                              onClick={() => handleOpenDialog(listing)}
                              className="w-fit bg-white text-black hover:bg-white/90"
                              size="lg"
                            >
                              Request Purchase Info
                            </Button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>

                <button
                  onClick={scrollPrev}
                  className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/30 bg-black/60 p-3 text-white backdrop-blur transition hover:bg-black/80"
                  aria-label="Previous vehicle"
                >
                  ‹
                </button>
                <button
                  onClick={scrollNext}
                  className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/30 bg-black/60 p-3 text-white backdrop-blur transition hover:bg-black/80"
                  aria-label="Next vehicle"
                >
                  ›
                </button>
              </section>
            </AnimatedSection>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {loading ? (
                <p className="text-center text-muted-foreground">Loading vehicles...</p>
              ) : filteredListings.length === 0 ? (
                <p className="text-center text-muted-foreground">
                  No vehicles match your criteria right now. Please check back soon.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredListings.map((listing, index) => (
                    <AnimatedSection key={listing.id} delay={index * 50}>
                      <Card className="h-full flex flex-col">
                        <div className="h-56 w-full overflow-hidden rounded-t-lg bg-muted">
                          <img
                            src={getImage(listing)}
                            onError={(event) => {
                              (event.target as HTMLImageElement).src = "/placeholder.svg";
                            }}
                            alt={`${listing.make} ${listing.model}`}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <Badge variant={listing.featured ? "default" : "secondary"}>
                              {listing.featured ? "Featured" : "Available"}
                            </Badge>
                            <span className="text-xl font-semibold">
                              £{Number(listing.price).toLocaleString()}
                            </span>
                          </div>
                          <CardTitle className="text-2xl">
                            {listing.year} {listing.make} {listing.model}
                          </CardTitle>
                          <p className="text-muted-foreground text-sm uppercase tracking-wide">
                            {listing.registration}
                          </p>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4 flex-1">
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-muted-foreground">Mileage</p>
                              <p className="font-semibold">{listing.mileage.toLocaleString()} mi</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Fuel</p>
                              <p className="font-semibold capitalize">{listing.fuel_type}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Transmission</p>
                              <p className="font-semibold capitalize">{listing.transmission}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Location</p>
                              <p className="font-semibold">{listing.location || "UK-wide"}</p>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {listing.description}
                          </p>
                          <Button
                            className="mt-auto"
                            onClick={() => handleOpenDialog(listing)}
                          >
                            Request purchase info
                          </Button>
                        </CardContent>
                      </Card>
                    </AnimatedSection>
                  ))}
                </div>
              )}
            </div>

            <div className="lg:col-span-1">
              <AnimatedSection delay={200}>
                <Card className="sticky top-4">
                  <CardHeader>
                    <CardTitle className="text-xl">Wanna Sell a Car/Vehicle?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form className="space-y-4" onSubmit={handleSellFormSubmit}>
                      <div>
                        <Label htmlFor="sellName">Full Name *</Label>
                        <Input
                          id="sellName"
                          name="sellName"
                          placeholder="Your full name"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="sellEmail">Email</Label>
                        <Input
                          id="sellEmail"
                          name="sellEmail"
                          type="email"
                          placeholder="your.email@example.com"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Provide email or phone (at least one required)
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="sellPhone">Phone</Label>
                        <Input
                          id="sellPhone"
                          name="sellPhone"
                          type="tel"
                          placeholder="+44 123 456 7890"
                        />
                      </div>

                      <div>
                        <Label htmlFor="vehicleMake">Vehicle Make *</Label>
                        <Input
                          id="vehicleMake"
                          name="vehicleMake"
                          placeholder="e.g., BMW, Audi, Toyota"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="vehicleModel">Vehicle Model *</Label>
                        <Input
                          id="vehicleModel"
                          name="vehicleModel"
                          placeholder="e.g., X5, Q7, Corolla"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="vehicleYear">Vehicle Year</Label>
                        <Input
                          id="vehicleYear"
                          name="vehicleYear"
                          type="number"
                          placeholder="e.g., 2020"
                          min="1900"
                          max={new Date().getFullYear() + 1}
                        />
                      </div>

                      <div>
                        <Label htmlFor="mileage">Mileage</Label>
                        <Input
                          id="mileage"
                          name="mileage"
                          type="number"
                          placeholder="e.g., 50000"
                          min="0"
                        />
                      </div>

                      <div>
                        <Label htmlFor="vehicleImage">Vehicle Image (optional)</Label>
                        <Input
                          id="vehicleImage"
                          name="vehicleImage"
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                        />
                        {imagePreview && (
                          <div className="mt-2">
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="w-full h-32 object-cover rounded-md border"
                            />
                          </div>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="sellMessage">Additional Details</Label>
                        <Textarea
                          id="sellMessage"
                          name="sellMessage"
                          placeholder="Tell us about your vehicle..."
                          rows={4}
                        />
                      </div>

                      <Button type="submit" className="w-full" disabled={sellFormSubmitting}>
                        {sellFormSubmitting ? "Submitting..." : "Submit Request"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </AnimatedSection>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Request purchase information</DialogTitle>
            <DialogDescription>
              Share your contact details and we&apos;ll arrange a dedicated consultation
            </DialogDescription>
          </DialogHeader>

          {selectedListing && (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="rounded-md border border-border p-3 text-sm">
                <p className="font-semibold">
                  {selectedListing.year} {selectedListing.make} {selectedListing.model}
                </p>
                <p className="text-muted-foreground">{selectedListing.registration}</p>
              </div>

              <Input name="name" placeholder="Full name" required />
              <Input name="email" type="email" placeholder="Email address" required />
              <Input name="phone" placeholder="Phone number" required />
              <Textarea name="message" placeholder="Tell us about your interest" rows={4} />
              <Input
                name="offerPrice"
                type="number"
                placeholder="Proposed offer (£)"
                min="0"
                step="100"
              />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="financing" className="h-4 w-4" />
                I need help arranging vehicle financing
              </label>
              <Textarea
                name="tradeIn"
                placeholder="Tell us if you have a trade-in (optional)"
                rows={3}
              />
              <Button type="submit" className="w-full" disabled={formSubmitting}>
                {formSubmitting ? "Submitting..." : "Submit Request"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CarSales;


