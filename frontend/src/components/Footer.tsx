import { Link } from "react-router-dom";
import { Linkedin, Facebook, Instagram, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/Logo";
import { newsletterApi } from "@/services/newsletterApi";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUnsubOpen, setIsUnsubOpen] = useState(false);
  const [unsubEmail, setUnsubEmail] = useState("");
  const [isUnsubmitting, setIsUnsubmitting] = useState(false);

  const companyLinks = [
    { label: "About Us", to: "/our-people" },
    { label: "Mission & Values", to: "/what-we-do" },
    { label: "News", to: "/news" },
    { label: "Careers", to: "/contact" },
  ];

  const platformLinks = [
    { label: "How It Works", to: "/what-we-do" },
    { label: "Our Services", to: "/personal-assistance" },
    { label: "Testimonials", to: "/testimonials" },
    { label: "Contact Support", to: "/contact" },
  ];

  const legalLinks = [
    { label: "Terms of Service", to: "#" },
    { label: "Privacy Policy", to: "#" },
    { label: "Cookie Policy", to: "#" },
  ];

  const socialLinks = [
    { href: "https://www.linkedin.com", icon: Linkedin, label: "LinkedIn" },
    { href: "https://www.facebook.com", icon: Facebook, label: "Facebook" },
    { href: "https://www.instagram.com", icon: Instagram, label: "Instagram" },
    { href: "https://www.youtube.com", icon: Youtube, label: "YouTube" },
  ];

  return (
    <footer className="bg-background text-foreground border-t border-border">
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-5 items-start">
          <div className="space-y-2">
            <Logo className="h-20 w-44" alt="Prestige Car Hire" />
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
              Premium accident replacement vehicles and dedicated insurance support across the UK. We keep you moving
              while we handle the paperwork.
            </p>
            <div className="flex items-center gap-1.5 text-foreground">
              {socialLinks.map(({ href, icon: Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="p-2 rounded-full border border-border hover:border-accent hover:text-accent transition-colors"
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <h4 className="text-base font-semibold">Company</h4>
            <ul className="space-y-0.5 text-sm text-muted-foreground">
              {companyLinks.map((item) => (
                <li key={item.label}>
                  <Link to={item.to} className="hover:text-accent transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-1">
            <h4 className="text-base font-semibold">Platform</h4>
            <ul className="space-y-0.5 text-sm text-muted-foreground">
              {platformLinks.map((item) => (
                <li key={item.label}>
                  <Link to={item.to} className="hover:text-accent transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-1">
            <h4 className="text-base font-semibold">Legal</h4>
            <ul className="space-y-0.5 text-sm text-muted-foreground">
              {legalLinks.map((item) => (
                <li key={item.label}>
                  <Link to={item.to} className="hover:text-accent transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-1.5">
            <h4 className="text-base font-semibold">Our Newsletter</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Subscribe to receive updates, industry insights, and priority access to our replacement vehicle fleet.
            </p>
            <form
              className="flex flex-col sm:flex-row gap-1.5"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!email.trim()) return;
                setIsSubmitting(true);
                try {
                  await newsletterApi.subscribe(email.trim(), undefined, "footer");
                  toast({ title: "You're subscribed!", description: "Thanks for joining our newsletter." });
                  setEmail("");
                } catch (error) {
                  const message = error instanceof Error ? error.message : "Subscription failed. Please try again.";
                  toast({ title: "Subscription failed", description: message, variant: "destructive" });
                } finally {
                  setIsSubmitting(false);
                }
              }}
            >
              <Input
                type="email"
                placeholder="Email Address"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                className="bg-muted border border-border text-foreground placeholder:text-muted-foreground sm:flex-1 text-base py-2"
              />
              <Button type="submit" disabled={isSubmitting} className="sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90 px-6 py-2 text-base font-semibold">
                {isSubmitting ? "Joining..." : "Join"}
              </Button>
            </form>
            <div className="text-xs text-muted-foreground">
              <button
                type="button"
                onClick={() => { setIsUnsubOpen(true); setUnsubEmail(email); }}
                className="underline hover:text-accent mt-1"
              >
                Unsubscribe
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-6 pt-4 text-center text-sm text-muted-foreground">
          <p>&copy; {currentYear} Prestige Car Hire Management LTD. All rights reserved.</p>
        </div>
      </div>

      <Dialog open={isUnsubOpen} onOpenChange={setIsUnsubOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Unsubscribe from Newsletter</DialogTitle>
            <DialogDescription>Enter your email to stop receiving our newsletters.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Input
              type="email"
              placeholder="email@example.com"
              value={unsubEmail}
              onChange={(e) => setUnsubEmail(e.target.value)}
              disabled={isUnsubmitting}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUnsubOpen(false)} disabled={isUnsubmitting}>Cancel</Button>
            <Button
              onClick={async () => {
                if (!unsubEmail.trim()) {
                  toast({ title: "Email required", variant: "destructive" });
                  return;
                }
                setIsUnsubmitting(true);
                try {
                  await newsletterApi.unsubscribe(unsubEmail.trim());
                  toast({ title: "Unsubscribed", description: "You have been removed from our newsletter." });
                  setIsUnsubOpen(false);
                } catch (error) {
                  const message = error instanceof Error ? error.message : "Unsubscribe failed. Please try again.";
                  toast({ title: "Unsubscribe failed", description: message, variant: "destructive" });
                } finally {
                  setIsUnsubmitting(false);
                }
              }}
              disabled={isUnsubmitting}
            >
              {isUnsubmitting ? "Unsubscribing..." : "Unsubscribe"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </footer>
  );
};

export default Footer;
