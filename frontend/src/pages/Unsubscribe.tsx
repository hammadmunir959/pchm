import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2 } from "lucide-react";

const Unsubscribe = () => {
  const { toast } = useToast();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUnsubscribed, setIsUnsubscribed] = useState(false);
  const [hasAutoUnsubscribed, setHasAutoUnsubscribed] = useState(false);

  const handleUnsubscribe = async (emailToUnsubscribe: string) => {
    if (!emailToUnsubscribe.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const { newsletterApi } = await import("@/services/newsletterApi");
      const result = await newsletterApi.unsubscribe(emailToUnsubscribe.trim());
      setIsUnsubscribed(true);
      toast({ 
        title: "Unsubscribed", 
        description: result.message || "You will no longer receive our newsletters." 
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unsubscribe failed. Please try again.";
      toast({ title: "Unsubscribe failed", description: message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const e = params.get("email") || "";
    setEmail(e);
    
    // Auto-unsubscribe if email is provided in URL (only once)
    if (e && e.trim() && !hasAutoUnsubscribed && !isSubmitting) {
      setHasAutoUnsubscribed(true);
      handleUnsubscribe(e.trim());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    await handleUnsubscribe(email.trim());
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-grow py-12 flex items-center justify-center">
        <div className="container mx-auto px-4 max-w-xl">
          {isUnsubscribed ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center mb-4">
                <CheckCircle2 className="w-16 h-16 text-green-500" />
              </div>
              <h1 className="text-3xl font-bold mb-2">Successfully Unsubscribed</h1>
              <p className="text-muted-foreground mb-4">
                You have been unsubscribed from our newsletter. You will no longer receive emails from us.
              </p>
              <p className="text-sm text-muted-foreground">
                If you change your mind, you can always subscribe again from our website.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="text-3xl font-bold mb-2">Unsubscribe from Newsletter</h1>
                <p className="text-muted-foreground">
                  {email 
                    ? "We're processing your unsubscribe request..."
                    : "Enter your email address to unsubscribe from our newsletter."}
                </p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  required
                  disabled={isSubmitting || !!email}
                  className="text-center"
                />
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !!email}
                  className="w-full"
                  size="lg"
                >
                  {isSubmitting ? "Processing..." : email ? "Unsubscribing..." : "Unsubscribe"}
                </Button>
              </form>
              {email && (
                <p className="text-sm text-center text-muted-foreground">
                  Unsubscribing <strong>{email}</strong>...
                </p>
              )}
            </div>
          )}
        </div>
      </main>
      <footer className="py-4 mt-8">
        <p className="text-center text-muted-foreground text-xs">
          © {new Date().getFullYear()} Prestige Car Hire Management | All Rights Reserved
        </p>
      </footer>
    </div>
  );
};

export default Unsubscribe;


