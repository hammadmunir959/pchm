import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, Link } from "react-router-dom";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, LogIn, Eye, EyeOff } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import AnimatedSection from "@/components/AnimatedSection";
import { authApi, ApiError } from "@/services/authApi";
import type { AdminType, AdminStatus } from "@/services/authApi";
import { useAuth } from "@/context/AuthContext";
import { clearSession } from "@/services/authStorage";

// Validation schema
const adminLoginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  adminType: z.enum(["super-admin", "admin"], {
    required_error: "Please select an admin type",
  }),
});

type AdminLoginFormData = z.infer<typeof adminLoginSchema>;

const AdminLogin = () => {
  const { toast } = useToast();
  const { login: authLogin } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AdminLoginFormData>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      email: "",
      password: "",
      adminType: undefined,
    },
  });

  const adminType = watch("adminType");
  const selectAdminTypeValue = adminType ?? "";

  const redirectToStatusPage = (status: AdminStatus | null, email: string) => {
    if (!status || status === "active") {
      return false;
    }
    navigate(`/admin/status?state=${status}&email=${encodeURIComponent(email)}`);
    return true;
  };

  const onSubmit = async (data: AdminLoginFormData) => {
    setIsSubmitting(true);
    setLoginError(null);

    try {
      const result = await authApi.login({
        email: data.email,
        password: data.password,
      });

      const backendAdminType = authApi.normalizeAdminType(result.user?.admin_type);

      if (!backendAdminType) {
        throw new Error("Your account does not have the correct admin permissions.");
      }

      if (backendAdminType !== data.adminType) {
        clearSession();
        const mismatchMessage = "Selected admin type does not match your account.";
        setLoginError(mismatchMessage);
        toast({
          title: "Login Failed",
          description: mismatchMessage,
          variant: "destructive",
        });
        return;
      }

      const normalizedStatus = authApi.normalizeAdminStatus(result.user?.status);
      if (redirectToStatusPage(normalizedStatus, data.email)) {
        return;
      }

      authLogin({
        access: result.access,
        refresh: result.refresh,
        user: result.user,
      });

      toast({
        title: "Login Successful",
        description: "Redirecting to your dashboard...",
      });

      if (backendAdminType === "super-admin") {
        navigate("/super-admin/dashboard");
      } else {
        navigate("/admin/dashboard");
      }
    } catch (error) {
      if (error instanceof ApiError) {
        const providedStatus = authApi.normalizeAdminStatus(
          (error.data as { status?: string } | null)?.status,
        );
        if (redirectToStatusPage(providedStatus, data.email)) {
          toast({
            title: "Login Pending",
            description: error.message,
          });
          return;
        }
      }

      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred. Please try again.";
      setLoginError(errorMessage);
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background" data-admin-area>
      <Navigation />
      
      <main className="flex-grow py-12 lg:py-16">
        <div className="container mx-auto px-4">
          <AnimatedSection>
            <div className="max-w-md mx-auto">
              <Card className="border-2 border-accent/20 shadow-lg">
                <CardHeader className="text-center space-y-4 pb-4">
                  <div className="flex justify-center">
                    <div className="rounded-full bg-accent/10 p-4">
                      <LogIn className="w-8 h-8 text-accent" />
                    </div>
                  </div>
                  <div>
                    <CardTitle className="text-2xl lg:text-3xl font-bold">
                      Admin Login
                    </CardTitle>
                    <CardDescription className="mt-2">
                      Sign in to access the admin panel
                    </CardDescription>
                  </div>
                </CardHeader>

                <CardContent>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Error Message */}
                    {loginError && (
                      <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                        <p className="text-sm text-destructive font-medium">
                          {loginError}
                        </p>
                      </div>
                    )}

                    {/* Email Field */}
                    <div className="space-y-2">
                      <Label htmlFor="email">
                        Email Address <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="admin@example.com"
                        {...register("email")}
                        className={errors.email ? "border-destructive" : ""}
                        disabled={isSubmitting}
                      />
                      {errors.email && (
                        <p className="text-sm text-destructive">
                          {errors.email.message}
                        </p>
                      )}
                    </div>

                    {/* Password Field */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password">
                          Password <span className="text-destructive">*</span>
                        </Label>
                        <Link
                          to="/admin/forgot-password"
                          className="text-xs text-accent hover:underline"
                        >
                          Forgot password?
                        </Link>
                      </div>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          {...register("password")}
                          className={errors.password ? "border-destructive pr-10" : "pr-10"}
                          disabled={isSubmitting}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          disabled={isSubmitting}
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      {errors.password && (
                        <p className="text-sm text-destructive">
                          {errors.password.message}
                        </p>
                      )}
                    </div>

                    {/* Admin Type Field */}
                    <div className="space-y-2">
                      <Label htmlFor="adminType">
                        Admin Type <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={selectAdminTypeValue}
                        onValueChange={(value) =>
                          setValue("adminType", value as "super-admin" | "admin")
                        }
                        disabled={isSubmitting}
                      >
                        <SelectTrigger
                          id="adminType"
                          className={errors.adminType ? "border-destructive" : ""}
                        >
                          <SelectValue placeholder="Select admin type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="super-admin">Super Admin</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.adminType && (
                        <p className="text-sm text-destructive">
                          {errors.adminType.message}
                        </p>
                      )}
                    </div>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        <>
                          <LogIn className="mr-2 h-4 w-4" />
                          Sign In
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Additional Info */}
              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <a
                    href="/admin/register"
                    className="text-accent hover:underline font-medium"
                  >
                    Register here
                  </a>
                </p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AdminLogin;

