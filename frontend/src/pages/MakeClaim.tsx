import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import AnimatedSection from "@/components/AnimatedSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { bookingsApi } from "@/services/bookingsApi";

const MakeClaim = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const form = e.currentTarget;
      const formData = new FormData(form);

      // Ensure optional fields exist
      if (!formData.get("notes")) {
        formData.set("notes", "");
      }

      await bookingsApi.submitClaim(formData);

      toast({
        title: "Claim submitted successfully",
        description: "Our team will contact you shortly to arrange your replacement vehicle.",
      });

      form.reset();
    } catch (error) {
      toast({
        title: "Unable to submit claim",
        description:
          error instanceof Error ? error.message : "Please check your details and try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-grow bg-secondary py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <AnimatedSection>
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-4">Make a Claim</h1>
              <p className="text-lg text-muted-foreground">
                Fill out the form below and we'll arrange your replacement vehicle as quickly as possible.
              </p>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={100}>
            <Card>
              <CardHeader>
                <CardTitle>Accident Claim Details</CardTitle>
                <CardDescription>
                  Please provide accurate information so we can process your claim efficiently.
                </CardDescription>
              </CardHeader>
              <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input id="firstName" name="first_name" required placeholder="John" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input id="lastName" name="last_name" required placeholder="Doe" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input id="email" name="email" type="email" required placeholder="john.doe@example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input id="phone" name="phone" type="tel" required placeholder="+44 7700 900000" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Full Address *</Label>
                  <Input id="address" name="address" required placeholder="123 Main Street, London" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="accidentDate">Accident Date *</Label>
                    <Input id="accidentDate" name="accident_date" type="date" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vehicleReg">Your Vehicle Registration *</Label>
                    <Input id="vehicleReg" name="vehicle_registration" required placeholder="AB12 CDE" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="insuranceCompany">Insurance Company *</Label>
                  <Input id="insuranceCompany" name="insurance_company" required placeholder="Your Insurance Provider" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="policyNumber">Policy Number *</Label>
                  <Input id="policyNumber" name="policy_number" required placeholder="POL123456789" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accidentDetails">Accident Details *</Label>
                  <Textarea 
                    id="accidentDetails" 
                    name="accident_details"
                    required 
                    placeholder="Please describe what happened during the accident..."
                    rows={5}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="pickupLocation">Pickup Location *</Label>
                    <Input
                      id="pickupLocation"
                      name="pickup_location"
                      required
                      placeholder="Accident site or preferred pickup"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dropLocation">Drop-off Location *</Label>
                    <Input
                      id="dropLocation"
                      name="drop_location"
                      required
                      placeholder="Return location"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    placeholder="Share any other details we should know..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="documents">Upload Documents (Optional)</Label>
                  <Input id="documents" name="documents" type="file" multiple accept=".pdf,.jpg,.jpeg,.png" />
                  <p className="text-sm text-muted-foreground">
                    You can upload photos of the accident, insurance documents, etc.
                  </p>
                </div>

                <div className="flex gap-4">
                  <Button 
                    type="submit" 
                    size="lg" 
                    className="bg-accent text-accent-foreground hover:bg-accent/90"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Submitting..." : "Submit Claim"}
                  </Button>
                </div>
              </form>
            </CardContent>
            </Card>
          </AnimatedSection>

          <AnimatedSection delay={200}>
            <Card className="mt-8 bg-primary text-primary-foreground border-0">
              <CardContent className="pt-6">
                <h3 className="text-xl font-semibold mb-3 text-accent">Need Immediate Assistance?</h3>
                <p className="mb-4 opacity-90">
                  If you need urgent help or have questions about making a claim, our team is available 24/7.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div>
                    <p className="font-semibold">Emergency Line:</p>
                    <p className="text-accent">+44 (0) 20 1234 5678</p>
                  </div>
                  <div>
                    <p className="font-semibold">Email:</p>
                    <p className="text-accent">claims@prestigecarhire.co.uk</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </AnimatedSection>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MakeClaim;
