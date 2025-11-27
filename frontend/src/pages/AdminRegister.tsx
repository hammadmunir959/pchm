import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from "react-router-dom";
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
import { Shield, Loader2, Eye, EyeOff } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import AnimatedSection from "@/components/AnimatedSection";
import { authApi } from "@/services/authApi";

// Validation schema
const adminRegisterSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
  adminType: z.enum(["super-admin", "admin"], {
    required_error: "Please select an admin type",
  }),
});

type AdminRegisterFormData = z.infer<typeof adminRegisterSchema>;

const AdminRegister = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AdminRegisterFormData>({
    resolver: zodResolver(adminRegisterSchema),
    defaultValues: {
      email: "",
      password: "",
      adminType: undefined,
    },
  });

  const adminType = watch("adminType");
  const selectAdminTypeValue = adminType ?? "";

  const onSubmit = async (data: AdminRegisterFormData) => {
    setIsSubmitting(true);
    try {
      const response = await authApi.registerAdmin({
        email: data.email,
        password: data.password,
        adminType: data.adminType,
      });

      toast({
        title: "Registration Successful",
        description: "Please verify your email to complete registration.",
      });

      navigate("/admin/otp-verification", {
        state: {
          email: data.email,
          purpose: "verification",
          status: response.status,
        },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "An unexpected error occurred. Please try again.";
      toast({
        title: "Registration Failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      
      <main className="flex-grow py-12 lg:py-16">
        <div className="container mx-auto px-4">
          <AnimatedSection>
            <div className="max-w-md mx-auto">
              <Card className="border-2 border-accent/20 shadow-lg">
                <CardHeader className="text-center space-y-4 pb-4">
                  <div className="flex justify-center">
                    <div className="rounded-full bg-accent/10 p-4">
                      <Shield className="w-8 h-8 text-accent" />
                    </div>
                  </div>
                  <div>
                    <CardTitle className="text-2xl lg:text-3xl font-bold">
                      Admin Registration
                    </CardTitle>
                    <CardDescription className="mt-2">
                      Create a new admin account for the panel
                    </CardDescription>
                  </div>
                </CardHeader>

                <CardContent>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                      <Label htmlFor="password">
                        Password <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter a strong password"
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
                      <p className="text-xs text-muted-foreground">
                        Must be at least 8 characters with uppercase, lowercase, and a number
                      </p>
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
                          Registering...
                        </>
                      ) : (
                        "Register Admin"
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Additional Info */}
              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <a
                    href="/admin/login"
                    className="text-accent hover:underline font-medium"
                  >
                    Sign in here
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

export default AdminRegister;

