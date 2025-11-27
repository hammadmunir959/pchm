import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { vehiclesApi, type Vehicle } from "@/services/vehiclesApi";
import { useToast } from "@/hooks/use-toast";

const fallbackVehicles = [
  {
    name: "Toyota Corolla",
    image: encodeURI("/Toyota Corolla.jpg"),
    description: "Comfortable sedan - 4 seats",
    type: "Saloon",
    transmission: "Automatic",
    dailyRate: "£55 / day",
    seats: 4,
    fuelType: "Petrol",
  },
  {
    name: "Ford Explorer",
    image: encodeURI("/Ford Explorer.jpg"),
    description: "Spacious SUV - 7 seats",
    type: "SUV",
    transmission: "Automatic",
    dailyRate: "£85 / day",
    seats: 7,
    fuelType: "Petrol",
  },
  {
    name: "BMW 5 Series",
    image: encodeURI("/BMW 5 Series.jpg"),
    description: "Luxury executive car - 5 seats",
    type: "Executive Saloon",
    transmission: "Automatic",
    dailyRate: "£95 / day",
    seats: 5,
    fuelType: "Petrol",
  },
  {
    name: "Volkswagen Transporter",
    image: encodeURI("/Volkswagen Transporter.png"),
    description: "Premium people carrier - 8 seats",
    type: "MPV",
    transmission: "Automatic",
    dailyRate: "£75 / day",
    seats: 8,
    fuelType: "Diesel",
  },
  {
    name: "Tesla Model 3",
    image: encodeURI("/Tesla Model 3.jpg"),
    description: "Electric saloon - 5 seats",
    type: "Electric",
    transmission: "Single-speed",
    dailyRate: "£105 / day",
    seats: 5,
    fuelType: "Electric",
  },
  {
    name: "Mercedes V-Class",
    image: encodeURI("/Mercedes V-Class.jpg"),
    description: "Luxury MPV - 7 seats",
    type: "Executive MPV",
    transmission: "Automatic",
    dailyRate: "£115 / day",
    seats: 7,
    fuelType: "Diesel",
  },
];

type FleetVehicle = {
  name: string;
  image?: string;
  description?: string;
  type?: string;
  transmission?: string;
  dailyRate?: string;
  seats?: number;
  fuelType?: string;
};

const capitalize = (value?: string | null) =>
  value ? value.replace(/^\w/, (letter) => letter.toUpperCase()) : undefined;

const formatDailyRate = (value?: string | number | null) => {
  if (value === null || value === undefined || value === "") return "Contact for quote";
  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    if (numeric <= 0) {
      return "Contact for quote";
    }
    return `£${numeric.toFixed(2)} / day`;
  }
  return String(value);
};

const OurFleet = () => {
  const { toast } = useToast();
  const [vehicles, setVehicles] = useState<FleetVehicle[]>(fallbackVehicles);
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "center",
    skipSnaps: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  useEffect(() => {
    const loadVehicles = async () => {
      try {
        const response = await vehiclesApi.list({ status: "available" });
        if (response.length === 0) {
          setVehicles(fallbackVehicles);
        } else {
          const normalized = response.map(
            (vehicle: Vehicle): FleetVehicle => ({
              name: vehicle.name,
              image: vehicle.image_url || fallbackVehicles[0]?.image,
              description: vehicle.description || "Available for immediate hire.",
              type: vehicle.type ?? "Vehicle",
              transmission: capitalize(vehicle.transmission) ?? "Automatic",
              dailyRate: formatDailyRate(vehicle.daily_rate),
              seats: vehicle.seats,
              fuelType: capitalize(vehicle.fuel_type) ?? "—",
            }),
          );
          setVehicles(normalized);
        }
      } catch (error) {
        toast({
          title: "Unable to load fleet",
          description: error instanceof Error ? error.message : "Please try again later.",
          variant: "destructive",
        });
        setVehicles(fallbackVehicles);
      } finally {
        setIsLoading(false);
      }
    };

    loadVehicles();
  }, [toast]);

  useEffect(() => {
    if (!emblaApi) return;

    let animationFrame: number;
    const autoplay = () => {
      animationFrame = window.setTimeout(() => {
        emblaApi.scrollNext();
        autoplay();
      }, 3000);
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

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors">
      <Navigation />
      
      <main className="flex-1">
        <header className="space-y-3 py-10 text-center">
          <h1 className="text-4xl font-bold tracking-tight">Our Fleet</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Explore our range of vehicles available for hire. Swipe or use the arrows to view each vehicle and discover its key features.
          </p>
        </header>

        <section className="relative mx-auto h-[calc(100vh-100px)] w-full max-w-7xl">
          <div className="absolute inset-0 overflow-hidden rounded-3xl border border-border bg-card shadow-2xl transition-colors" ref={emblaRef}>
            <div className="flex h-full">
              {(isLoading ? fallbackVehicles : vehicles).map((vehicle) => (
                <article
                  key={vehicle.name}
                  className="relative min-w-full h-full group"
                >
                  <img
                    src={vehicle.image}
                    alt={vehicle.name}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent opacity-90 dark:opacity-90" />

                  <div className="absolute inset-0 flex flex-col justify-between p-10 sm:p-14 space-y-6">
                    <div className="space-y-3">
                      <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs uppercase tracking-wide">
                        Prestige Fleet
                      </span>
                      <h2 className="text-4xl font-semibold text-white">{vehicle.name}</h2>
          </div>

                    <div className="space-y-6">
                      <p className="max-w-xl text-white/80 text-lg">{vehicle.description}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm text-white/70 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
                          <p className="text-xs uppercase tracking-wide">Type</p>
                          <p className="mt-1 text-base text-white">{vehicle.type}</p>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
                          <p className="text-xs uppercase tracking-wide">Transmission</p>
                          <p className="mt-1 text-base text-white">{vehicle.transmission}</p>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
                          <p className="text-xs uppercase tracking-wide">Seats</p>
                          <p className="mt-1 text-base text-white">
                            {vehicle.seats ?? "N/A"}
                          </p>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
                          <p className="text-xs uppercase tracking-wide">Daily Rate</p>
                          <p className="mt-1 text-base text-white">{vehicle.dailyRate}</p>
                        </div>
                      </div>
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

        <section className="mx-auto mt-16 max-w-6xl px-6 pb-16">
          <h2 className="text-2xl font-semibold mb-6 text-foreground">Explore the Fleet</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {(isLoading ? fallbackVehicles : vehicles).map((vehicle) => (
              <article
                key={`thumb-${vehicle.name}`}
                className="group overflow-hidden rounded-2xl border border-border bg-card text-foreground shadow-lg transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="relative h-48">
                  <img
                    src={vehicle.image}
                    alt={vehicle.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-90" />
                  <div className="absolute inset-0 flex flex-col justify-between p-4 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <div>
                      <h3 className="text-lg font-semibold">{vehicle.name}</h3>
                    </div>
                    <div className="rounded-xl bg-black/65 backdrop-blur-sm border border-white/10 divide-y divide-white/10">
                      <div className="grid grid-cols-2 gap-3 px-4 py-3 text-white/80 text-xs uppercase tracking-wide">
                        <div>
                          Type
                          <strong className="block text-base text-white normal-case font-semibold">{vehicle.type}</strong>
                        </div>
                        <div>
                          Daily Rate
                          <strong className="block text-base text-white normal-case font-semibold">{vehicle.dailyRate}</strong>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 px-4 py-3 text-white/80 text-xs uppercase tracking-wide">
                        <div>
                          Transmission
                          <strong className="block text-base text-white normal-case font-semibold">{vehicle.transmission}</strong>
                        </div>
                        <div>
                          Seats
                          <strong className="block text-base text-white normal-case font-semibold">
                            {vehicle.seats ?? "N/A"}
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-4 text-sm text-muted-foreground">
                  {vehicle.description || "Available for immediate hire."}
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default OurFleet;

