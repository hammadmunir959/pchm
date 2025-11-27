import { useMemo } from "react";
import type { ReactNode } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import AnimatedSection from "@/components/AnimatedSection";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock } from "lucide-react";
import type { AdminStatus } from "@/services/authApi";

const STATUS_CONFIG: Record<
  Exclude<AdminStatus, "active">,
  { title: string; description: string; icon: ReactNode }
> = {
  pending_approval: {
    title: "Awaiting Super Admin Approval",
    description:
      "Your registration is pending review. We will notify you by email as soon as the Super Admin approves your access.",
    icon: <Clock className="h-10 w-10 text-accent" />,
  },
  suspended: {
    title: "Account Suspended",
    description:
      "Your access has been temporarily suspended. Please contact support or the Super Admin for assistance.",
    icon: <AlertTriangle className="h-10 w-10 text-destructive" />,
  },
};

const AdminStatusPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const status = (searchParams.get("state") as AdminStatus | null) ?? null;
  const email = searchParams.get("email") ?? "";

  const statusConfig = useMemo(() => {
    if (!status || status === "active") return null;
    return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
  }, [status]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />

      <main className="flex-grow py-12 lg:py-16">
        <div className="container mx-auto px-4">
          <AnimatedSection>
            <div className="max-w-xl mx-auto">
              <Card className="border-2 border-accent/20 shadow-lg">
                <CardHeader className="text-center space-y-4 pb-4">
                  <div className="flex justify-center">{statusConfig?.icon}</div>
                  <div>
                    <CardTitle className="text-2xl lg:text-3xl font-bold">
                      {statusConfig?.title ?? "Account Status"}
                    </CardTitle>
                    <CardDescription className="mt-2 text-base leading-relaxed">
                      {statusConfig?.description ??
                        "We are unable to determine your account status. Please contact support if you believe this is an error."}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 text-center">
                  {email && (
                    <p className="text-sm text-muted-foreground">
                      Status for <span className="font-medium text-foreground">{email}</span>
                    </p>
                  )}
                  <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                    <Button variant="secondary" onClick={() => navigate("/admin/login")}>
                      Back to Login
                    </Button>
                    {status === "suspended" && (
                      <Button variant="destructive" onClick={() => navigate("/contact")}>
                        Contact Support
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </AnimatedSection>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AdminStatusPage;


