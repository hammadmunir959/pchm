import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import AnimatedSection from "@/components/AnimatedSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, Mail, MapPin, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { inquiriesApi } from "@/services/inquiriesApi";
import { cmsApi, type LandingPageConfig } from "@/services/cmsApi";

const Contact = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cmsConfig, setCmsConfig] = useState<LandingPageConfig | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);

  useEffect(() => {
    const loadCmsConfig = async () => {
      try {
        const config = await cmsApi.getConfig();
        setCmsConfig(config);
      } catch (error) {
        console.error("Failed to load CMS configuration:", error);
        // Continue with default values if CMS config fails to load
      } finally {
        setIsLoadingConfig(false);
      }
    };

    loadCmsConfig();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      await inquiriesApi.create({
        name: formData.get("name")?.toString() || "",
        email: formData.get("contactEmail")?.toString() || "",
        phone: formData.get("contactPhone")?.toString() || "",
        subject: formData.get("subject")?.toString() || "",
        message: formData.get("message")?.toString() || "",
        vehicle_interest: "",
      });

      toast({
        title: "Message Sent",
        description: "Thank you for contacting us. We'll respond within 24 hours.",
      });
      form.reset();
    } catch (error) {
      toast({
        title: "Submission Failed",
        description:
          error instanceof Error ? error.message : "Unable to send your message right now.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      
      <main className="flex-grow">
        <section className="bg-primary text-primary-foreground py-16">
          <div className="container mx-auto px-4 text-center">
            <AnimatedSection>
              <h1 className="text-4xl lg:text-5xl font-bold mb-4">Contact Us</h1>
              <p className="text-lg opacity-90 max-w-2xl mx-auto">
                Get in touch with our team. We're here to help you 24/7.
              </p>
            </AnimatedSection>
          </div>
        </section>

        <section className="py-12 bg-secondary">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <AnimatedSection delay={0}>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <Phone className="w-12 h-12 text-accent mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">Phone</h3>
                    <p className="text-sm text-muted-foreground">
                      {cmsConfig?.contact_phone || "+44 (0) 20 1234 5678"}
                    </p>
                  </CardContent>
                </Card>
              </AnimatedSection>
              <AnimatedSection delay={100}>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <Mail className="w-12 h-12 text-accent mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">Email</h3>
                    <p className="text-sm text-muted-foreground">
                      {cmsConfig?.contact_email || "info@prestigecarhire.co.uk"}
                    </p>
                  </CardContent>
                </Card>
              </AnimatedSection>
              <AnimatedSection delay={200}>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <MapPin className="w-12 h-12 text-accent mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">Address</h3>
                    <p className="text-sm text-muted-foreground">
                      {cmsConfig?.contact_address || "London, United Kingdom"}
                    </p>
                  </CardContent>
                </Card>
              </AnimatedSection>
              <AnimatedSection delay={300}>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <Clock className="w-12 h-12 text-accent mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">Hours</h3>
                    <p className="text-sm text-muted-foreground">
                      {cmsConfig?.contact_hours || "24/7 Emergency Service"}
                    </p>
                  </CardContent>
                </Card>
              </AnimatedSection>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <AnimatedSection delay={100}>
                <Card>
                  <CardHeader>
                    <CardTitle>Send Us a Message</CardTitle>
                    <CardDescription>
                      Fill out the form and we'll get back to you as soon as possible.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input id="name" name="name" required placeholder="Your name" />
                      </div>
                      <div className="space-y-2">
                      <Label htmlFor="contactEmail">Email Address *</Label>
                      <Input
                        id="contactEmail"
                        name="contactEmail"
                        type="email"
                        required
                        placeholder="your.email@example.com"
                      />
                      </div>
                      <div className="space-y-2">
                      <Label htmlFor="contactPhone">Phone Number</Label>
                      <Input
                        id="contactPhone"
                        name="contactPhone"
                        type="tel"
                        placeholder="+44 7700 900000"
                      />
                      </div>
                      <div className="space-y-2">
                      <Label htmlFor="subject">Subject *</Label>
                      <Input id="subject" name="subject" required placeholder="How can we help?" />
                      </div>
                      <div className="space-y-2">
                      <Label htmlFor="message">Message *</Label>
                        <Textarea 
                          id="message" 
                        name="message"
                          required 
                          placeholder="Tell us more about your inquiry..."
                          rows={5}
                        />
                      </div>
                      <Button 
                        type="submit" 
                        size="lg" 
                        className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Sending..." : "Send Message"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </AnimatedSection>

              <div className="space-y-6">
                <AnimatedSection delay={200}>
                  <Card>
                    <CardHeader>
                      <CardTitle>Visit Our Office</CardTitle>
                    </CardHeader>
                  <CardContent>
                      <div className="rounded-lg overflow-hidden bg-muted">
                        {cmsConfig?.google_map_embed_url ? (
                          <div dangerouslySetInnerHTML={{ __html: cmsConfig.google_map_embed_url }} />
                        ) : (
                          <iframe
                            title="Prestige Car Hire Management Office Location"
                            src="https://maps.google.com/maps?q=51.5074,-0.1278&z=15&output=embed"
                            className="w-full h-[300px] border-0"
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            allowFullScreen
                          />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </AnimatedSection>

                <AnimatedSection delay={300}>
                  <Card className="bg-primary text-primary-foreground border-0">
                    <CardHeader>
                      <CardTitle className="text-accent">Emergency Assistance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-4 opacity-90">
                        If you've been in an accident and need immediate assistance, please call our emergency line.
                      </p>
                      <div className="space-y-2">
                        <p className="font-semibold">24/7 Emergency Line:</p>
                        <p className="text-accent text-2xl font-bold">+44 (0) 20 1234 5678</p>
                      </div>
                    </CardContent>
                  </Card>
                </AnimatedSection>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
