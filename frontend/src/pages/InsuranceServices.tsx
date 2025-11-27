import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import AnimatedSection from "@/components/AnimatedSection";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, FileCheck, Clock, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const InsuranceServices = () => {
  const insurancePartners = [
    "Aviva", "AXA", "Direct Line", "Admiral", "Churchill",
    "LV=", "Hastings Direct", "Zurich", "Allianz", "RSA"
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-grow">
        <section className="bg-primary text-primary-foreground py-16">
          <div className="container mx-auto px-4 text-center">
            <AnimatedSection>
              <h1 className="text-4xl lg:text-5xl font-bold mb-4">Insurance Services</h1>
              <p className="text-lg opacity-90 max-w-2xl mx-auto">
                Seamless integration with insurance providers for hassle-free claim processing.
              </p>
            </AnimatedSection>
          </div>
        </section>

        <section className="py-16 bg-secondary">
          <div className="container mx-auto px-4">
            <AnimatedSection>
              <div className="max-w-3xl mx-auto text-center mb-12">
                <h2 className="text-3xl font-bold mb-6">Working Directly With Insurance Companies</h2>
                <p className="text-lg text-muted-foreground">
                  We have established relationships with major UK insurance providers, enabling us to streamline 
                  the claim process and get you back on the road faster.
                </p>
              </div>
            </AnimatedSection>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <AnimatedSection delay={0}>
                <Card className="hover:shadow-xl transition-shadow">
                  <CardContent className="pt-8 text-center">
                    <Shield className="w-12 h-12 text-accent mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-3">Direct Billing</h3>
                    <p className="text-muted-foreground">We bill your insurance company directly - no upfront costs for you.</p>
                  </CardContent>
                </Card>
              </AnimatedSection>
              <AnimatedSection delay={100}>
                <Card className="hover:shadow-xl transition-shadow">
                  <CardContent className="pt-8 text-center">
                    <FileCheck className="w-12 h-12 text-accent mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-3">Claim Management</h3>
                    <p className="text-muted-foreground">We handle all communication and paperwork with your insurer.</p>
                  </CardContent>
                </Card>
              </AnimatedSection>
              <AnimatedSection delay={200}>
                <Card className="hover:shadow-xl transition-shadow">
                  <CardContent className="pt-8 text-center">
                    <Clock className="w-12 h-12 text-accent mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-3">Fast Approval</h3>
                    <p className="text-muted-foreground">Quick claim verification and approval process with insurers.</p>
                  </CardContent>
                </Card>
              </AnimatedSection>
              <AnimatedSection delay={300}>
                <Card className="hover:shadow-xl transition-shadow">
                  <CardContent className="pt-8 text-center">
                    <CheckCircle2 className="w-12 h-12 text-accent mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-3">Transparent Process</h3>
                    <p className="text-muted-foreground">Clear communication about claim status every step of the way.</p>
                  </CardContent>
                </Card>
              </AnimatedSection>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
              <div>
                <h2 className="text-3xl font-bold mb-6">How Insurance Claims Work With Us</h2>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xl font-bold text-accent-foreground">1</span>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">You Report Your Accident</h3>
                      <p className="text-muted-foreground">Contact us with your accident details and insurance information.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xl font-bold text-accent-foreground">2</span>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">We Verify With Your Insurer</h3>
                      <p className="text-muted-foreground">Our team contacts your insurance company to verify your claim and coverage.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xl font-bold text-accent-foreground">3</span>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Approval & Vehicle Delivery</h3>
                      <p className="text-muted-foreground">Once approved, we deliver your replacement vehicle, often within hours.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xl font-bold text-accent-foreground">4</span>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">We Handle The Billing</h3>
                      <p className="text-muted-foreground">All billing is done directly with your insurance company - nothing for you to pay upfront.</p>
                    </div>
                  </div>
                </div>
              </div>

              <Card className="bg-primary text-primary-foreground border-0">
                <CardContent className="pt-8">
                  <h3 className="text-2xl font-bold mb-4 text-accent">Non-Fault Accidents</h3>
                  <p className="mb-6 opacity-90">
                    If your accident was not your fault, you may be entitled to a like-for-like replacement 
                    vehicle at no cost to you. We work with your insurance company or the third party's 
                    insurer to ensure you get a suitable replacement.
                  </p>
                  <h3 className="text-2xl font-bold mb-4 text-accent">Fault Accidents</h3>
                  <p className="mb-6 opacity-90">
                    Even if the accident was your fault, we can still help. Depending on your policy coverage, 
                    your insurance may cover the cost of a replacement vehicle. We'll verify this with your 
                    insurer and explain your options clearly.
                  </p>
                  <Link to="/make-claim">
                    <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                      Make a Claim
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-16 bg-secondary">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Insurance Partners We Work With</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                We have established relationships with all major UK insurance providers
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-4xl mx-auto">
              {insurancePartners.map((partner, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6 pb-6 text-center">
                    <p className="font-semibold">{partner}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <p className="text-center text-muted-foreground mt-8">
              Don't see your insurance provider? Contact us - we work with most UK insurers.
            </p>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <h2 className="text-3xl font-bold mb-6">Transparent & Professional</h2>
            <p className="text-lg text-muted-foreground mb-6">
              We maintain transparent communication throughout the entire process. You'll always know 
              the status of your claim and what to expect next.
            </p>
            <p className="text-lg text-muted-foreground">
              Our professional approach and established relationships with insurance providers mean 
              faster approvals and less hassle for you.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default InsuranceServices;
