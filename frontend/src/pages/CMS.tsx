import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Car, Store, FileText, LayoutTemplate, Star } from "lucide-react";
import DashboardHeader from "@/components/DashboardHeader";
import DashboardNavBar from "@/components/DashboardNavBar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Vehicles from "./Vehicles";
import CarSalesManagement from "./CarSalesManagement";
import NewsManagement from "./News";
import LandingPageManagement from "./LandingPageManagement";
import TestimonialsManagement from "./TestimonialsManagement";

const CMS = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const deriveSectionFromPath = (pathname: string): "fleet" | "car-sales" | "news" | "landing" | "testimonials" => {
    const segments = pathname.split("/").filter(Boolean);
    const idx = segments.indexOf("cms");
    const section = idx !== -1 ? segments[idx + 1] : undefined;
    if (section === "car-sales") return "car-sales";
    if (section === "news") return "news";
    if (section === "landing") return "landing";
    if (section === "testimonials") return "testimonials";
    return "fleet";
  };

  const [activeTab, setActiveTab] = useState<"fleet" | "car-sales" | "news" | "landing" | "testimonials">(
    deriveSectionFromPath(location.pathname),
  );

  useEffect(() => {
    const next = deriveSectionFromPath(location.pathname);
    if (next !== activeTab) setActiveTab(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const onTabChange = (value: string) => {
    const next = value as "fleet" | "car-sales" | "news" | "landing" | "testimonials";
    setActiveTab(next);
    const segments = location.pathname.split("/").filter(Boolean);
    const cmsIndex = segments.indexOf("cms");
    const base = cmsIndex !== -1 ? `/${segments.slice(0, cmsIndex + 1).join("/")}` : "/admin/dashboard/cms";
    const nextPath = `${base}/${next}`;
    if (location.pathname !== nextPath) {
      navigate(nextPath, { replace: false });
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
              <LayoutDashboard className="w-8 h-8 text-accent" />
              CMS
            </h1>
            <p className="text-muted-foreground">Manage Fleet, Cars for Sale, News, Landing Page and Testimonials</p>
          </div>

          <Tabs value={activeTab} onValueChange={onTabChange} className="space-y-6">
            <TabsList>
              <TabsTrigger value="fleet" className="flex items-center gap-2">
                <Car className="w-4 h-4" />
                Fleet
              </TabsTrigger>
              <TabsTrigger value="car-sales" className="flex items-center gap-2">
                <Store className="w-4 h-4" />
                Cars for Sale
              </TabsTrigger>
              <TabsTrigger value="news" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                News
              </TabsTrigger>
              <TabsTrigger value="landing" className="flex items-center gap-2">
                <LayoutTemplate className="w-4 h-4" />
                Landing Page
              </TabsTrigger>
              <TabsTrigger value="testimonials" className="flex items-center gap-2">
                <Star className="w-4 h-4" />
                Testimonials
              </TabsTrigger>
            </TabsList>

            <TabsContent value="fleet" className="space-y-6">
              <Vehicles embedded />
            </TabsContent>
            <TabsContent value="car-sales" className="space-y-6">
              <CarSalesManagement embedded />
            </TabsContent>
            <TabsContent value="news" className="space-y-6">
              <NewsManagement embedded />
            </TabsContent>
            <TabsContent value="landing" className="space-y-6">
              <LandingPageManagement embedded />
            </TabsContent>
            <TabsContent value="testimonials" className="space-y-6">
              <TestimonialsManagement embedded />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <footer className="py-4 mt-8">
        <p className="text-center text-gray-500 text-xs">© {new Date().getFullYear()} CodeKonix | All Rights Reserved</p>
      </footer>
    </div>
  );
};

export default CMS;


