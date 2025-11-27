import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { testimonialsApi } from "@/services/testimonialsApi";
import { useToast } from "@/hooks/use-toast";

const DUMMY_TESTIMONIALS = [
  {
    name: "Sarah W.",
    feedback:
      "Prestige handled everything seamlessly after my accident. The replacement car was spotless and delivered on time.",
    rating: 5,
  },
  {
    name: "James K.",
    feedback:
      "Professional and compassionate team. They kept me updated at every step and made a stressful situation simple.",
    rating: 5,
  },
  {
    name: "Emily R.",
    feedback:
      "Fast response, clear communication, and excellent vehicles. I would happily recommend them to anyone.",
    rating: 5,
  },
];

const TestimonialForm = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [feedback, setFeedback] = useState("");
  const [rating, setRating] = useState(5);
  const [serviceType, setServiceType] = useState<string>("");

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

      // Redirect to /testimonials where only real testimonials are displayed
      navigate("/testimonials", {
        replace: true,
        state: {
          submitted: true,
          name: name.trim(),
        },
      });
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
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-grow py-12 lg:py-16 bg-secondary">
        <div className="container mx-auto px-4">
          <AnimatedSection>
            <div className="max-w-3xl mb-10">
              <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground mb-2">
                Share your experience
              </p>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">We value your feedback</h1>
              <p className="text-base md:text-lg text-muted-foreground">
                Your testimonial helps other drivers feel confident choosing Prestige when they need support
                most. Tell us about your experience and our team will review and publish genuine feedback on
                our testimonials page.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            {/* Left side: form */}
            <AnimatedSection className="order-2 lg:order-1">
              <Card className="shadow-lg">
                <CardContent className="pt-6">
                  <h2 className="text-2xl font-semibold mb-1">Share your experience</h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    We value your feedback. Approved testimonials appear on our testimonials page.
                  </p>

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
                            className={`text-2xl transition ${
                              star <= rating ? "text-accent" : "text-muted-foreground"
                            }`}
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

            {/* Right side: dummy testimonials (top) */}
            <AnimatedSection className="order-1 lg:order-2">
              <div className="space-y-4">
                {DUMMY_TESTIMONIALS.map((testimonial, index) => (
                  <Card key={index} className="border-accent/20">
                    <CardContent className="pt-5">
                      <div className="flex gap-1 mb-3">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <span key={i} className="text-accent text-lg">
                            ★
                          </span>
                        ))}
                      </div>
                      <p className="text-muted-foreground mb-3 italic">"{testimonial.feedback}"</p>
                      <p className="font-semibold text-sm">{testimonial.name}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </AnimatedSection>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TestimonialForm;


