import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Loader2, ShieldCheck, ArrowLeft, RefreshCw } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import AnimatedSection from "@/components/AnimatedSection";
import { authApi } from "@/services/authApi";
import type { AdminStatus } from "@/services/authApi";

const OTPVerification = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState<string>("");
  const [purpose, setPurpose] = useState<string>("verification");
  const [otp, setOtp] = useState("");
  const [pendingStatus, setPendingStatus] = useState<AdminStatus | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const state = location.state as
      | { email?: string; purpose?: string; status?: AdminStatus | string | null }
      | undefined;
    const emailFromState = state?.email;

    if (!emailFromState) {
      toast({
        title: "Email required",
        description: "Please register first to receive an OTP.",
        variant: "destructive",
      });
      navigate("/admin/register");
      return;
    }

    setEmail(emailFromState);
    setPurpose(state?.purpose || "verification");
    const normalizedStatus = authApi.normalizeAdminStatus(state?.status ?? null);
    setPendingStatus(normalizedStatus);
  }, [location.state, navigate, toast]);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setError("Please enter the 6-digit code sent to your email.");
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      await authApi.verifyOtp({
        email,
        otpCode: otp,
        purpose,
      });

      toast({
        title: "Email verified",
        description: "Registration completed successfully.",
      });

      const normalizedStatus = pendingStatus ?? null;
      if (normalizedStatus && normalizedStatus !== "active") {
        navigate(
          `/admin/status?state=${normalizedStatus}&email=${encodeURIComponent(email)}`,
        );
      } else {
        navigate("/admin/login", { state: { email } });
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Verification failed. Please try again.";
      setError(message);
      toast({
        title: "Verification failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setError(null);

    try {
      await authApi.resendVerificationOtp(email);
      toast({
        title: "Code sent",
        description: "Please check your email for the new verification code.",
      });
      setOtp("");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to resend code. Please try again.";
      setError(message);
      toast({
        title: "Resend failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  if (!email) {
    return null;
  }

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
                      <ShieldCheck className="w-8 h-8 text-accent" />
                    </div>
                  </div>
                  <div>
                    <CardTitle className="text-2xl lg:text-3xl font-bold">
                      Verify OTP
                    </CardTitle>
                    <CardDescription className="mt-2">
                      Enter the 6-digit code sent to{" "}
                      <span className="font-medium text-foreground">{email}</span>
                    </CardDescription>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-6">
                    {error && (
                      <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                        <p className="text-sm text-destructive font-medium">
                          {error}
                        </p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="otp" className="text-center w-full block">
                        Verification Code <span className="text-destructive">*</span>
                      </Label>
                      <div className="flex justify-center">
                        <InputOTP
                          maxLength={6}
                          value={otp}
                          onChange={(value) => {
                            setOtp(value);
                            setError(null);
                          }}
                          disabled={isVerifying}
                        >
                          <InputOTPGroup>
                            <InputOTPSlot index={0} />
                            <InputOTPSlot index={1} />
                            <InputOTPSlot index={2} />
                            <InputOTPSlot index={3} />
                            <InputOTPSlot index={4} />
                            <InputOTPSlot index={5} />
                          </InputOTPGroup>
                        </InputOTP>
                      </div>
                      <p className="text-xs text-muted-foreground text-center">
                        Enter the 6-digit code from your email
                      </p>
                    </div>

                    <Button
                      type="button"
                      size="lg"
                      className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                      onClick={handleVerify}
                      disabled={isVerifying || otp.length !== 6}
                    >
                      {isVerifying ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="mr-2 h-4 w-4" />
                          Verify OTP
                        </>
                      )}
                    </Button>

                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-2">
                        Didn&apos;t receive the code?
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleResend}
                        disabled={isResending || isVerifying}
                        className="text-accent hover:text-accent/80"
                      >
                        {isResending ? (
                          <>
                            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="mr-2 h-3 w-3" />
                            Resend Code
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="mt-6 text-center space-y-2">
                <Link
                  to="/admin/register"
                  className="inline-flex items-center text-sm text-muted-foreground hover:text-accent transition-colors"
                >
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  Back to registration
                </Link>
                <p className="text-sm text-muted-foreground">
                  Remember your password?{" "}
                  <Link
                    to="/admin/login"
                    className="text-accent hover:underline font-medium"
                  >
                    Sign in here
                  </Link>
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

export default OTPVerification;

