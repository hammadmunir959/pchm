import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import AnimatedSection from "@/components/AnimatedSection";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { testimonialsApi, type Testimonial } from "@/services/testimonialsApi";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const getServiceTypeLabel = (serviceType?: string | null): string => {
  const serviceLabels: Record<string, string> = {
    car_hire: "Car Hire",
    car_rental: "Car Rental",
    claims_management: "Claims Management",
    car_purchase_sale: "Car Purchase/ Sale",
  };
  return serviceType ? serviceLabels[serviceType] || serviceType : "";
};

const PublicTestimonials = () => {
  const { toast } = useToast();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [submittedName, setSubmittedName] = useState<string | null>(null);
  
  // Form state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [feedback, setFeedback] = useState("");
  const [rating, setRating] = useState(5);
  const [serviceType, setServiceType] = useState<string>("");

  const loadTestimonials = async () => {
    setIsLoading(true);
    try {
      const response = await testimonialsApi.list({ status: "approved" });
      setTestimonials(response);
    } catch (error) {
      toast({
        title: "Unable to load testimonials",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTestimonials();
  }, [toast]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim() || !feedback.trim()) {
      toast({
        title: "Please complete the form",
        description: "Full Name and Feedback are required.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await testimonialsApi.create({
        name: name.trim(),
        feedback: feedback.trim(),
        rating,
        service_type: serviceType || undefined,
      });

      // Show success message
      setSubmittedName(name.trim());
      
      // Reset form
      setName("");
      setFeedback("");
      setRating(5);
      setServiceType("");

      // Reload testimonials to show the new one
      await loadTestimonials();

      // Clear success message after 5 seconds
      setTimeout(() => {
        setSubmittedName(null);
      }, 5000);
    } catch (error) {
      toast({
        title: "Submission failed",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />

      <main className="flex-grow py-12 lg:py-16 bg-secondary">
        <div className="container mx-auto px-4">
          <AnimatedSection>
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold mb-4">Testimonials</h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                We&apos;re proud to support drivers through difficult situations. Read their
                experiences or share your own.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <AnimatedSection className="lg:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {isLoading ? (
                  <p className="col-span-full text-center text-muted-foreground">Loading testimonials...</p>
                ) : testimonials.length === 0 ? (
                  <p className="col-span-full text-center text-muted-foreground">
                    No testimonials yet. Be the first to share your experience!
                  </p>
                ) : (
                  testimonials.map((testimonial) => (
                    <Card key={testimonial.id}>
                      <CardContent className="pt-6">
                        <div className="flex gap-1 mb-4">
                          {[...Array(testimonial.rating)].map((_, index) => (
                            <span key={index} className="text-accent text-lg">
                              ★
                            </span>
                          ))}
                        </div>
                        <p className="text-muted-foreground mb-4 italic">"{testimonial.feedback}"</p>
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold">{testimonial.name}</p>
                          {testimonial.service_type && (
                            <Badge variant="outline" className="text-xs">
                              {getServiceTypeLabel(testimonial.service_type)}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </AnimatedSection>

            <AnimatedSection delay={100}>
              <Card>
                <CardContent className="pt-6">
                  <h2 className="text-2xl font-semibold mb-3">Share your experience</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    We value your feedback. Approved testimonials appear on this page.
                  </p>

                  {submittedName && (
                    <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <p className="text-green-800 dark:text-green-200">
                        Thank you, {submittedName}. Your testimonial has been submitted.
                      </p>
                    </div>
                  )}

                  <form className="space-y-4" onSubmit={handleSubmit}>
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="Jane Doe"
                        required
                        disabled={isSubmitting}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="service_type">Service Used</Label>
                      <Select value={serviceType} onValueChange={setServiceType} disabled={isSubmitting}>
                        <SelectTrigger id="service_type">
                          <SelectValue placeholder="Select a service" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="car_hire">Car Hire</SelectItem>
                          <SelectItem value="car_rental">Car Rental</SelectItem>
                          <SelectItem value="claims_management">Claims Management</SelectItem>
                          <SelectItem value="car_purchase_sale">Car Purchase/ Sale</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="feedback">Your Feedback</Label>
                      <Textarea
                        id="feedback"
                        name="feedback"
                        rows={4}
                        placeholder="Tell us about your experience..."
                        required
                        disabled={isSubmitting}
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                      />
                    </div>

                    <div>
                      <Label>Rating</Label>
                      <div className="flex items-center gap-1 mt-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            disabled={isSubmitting}
                            className={`text-2xl transition ${
                              star <= rating ? "text-accent" : "text-muted-foreground"
                            } ${isSubmitting ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                            aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                          >
                            ★
                          </button>
                        ))}
                        <span className="ml-2 text-sm text-muted-foreground">{rating}/5</span>
                      </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? "Submitting..." : "Submit Feedback"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </AnimatedSection>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PublicTestimonials;


