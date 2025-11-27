import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import AnimatedSection from "@/components/AnimatedSection";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, FileText, Car, Shield, Users, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const WhatWeDo = () => {
  const services = [
    {
      icon: <Car className="w-12 h-12 text-accent" />,
      title: "Accident Replacement Vehicles",
      description: "We provide immediate access to quality replacement vehicles when your car is off the road due to an accident."
    },
    {
      icon: <Shield className="w-12 h-12 text-accent" />,
      title: "Insurance Claim Management",
      description: "Our team handles all communication with your insurance provider, ensuring smooth claim processing."
    },
    {
      icon: <Users className="w-12 h-12 text-accent" />,
      title: "Personal Client Support",
      description: "Dedicated support throughout your journey with us, from initial claim to vehicle return."
    },
    {
      icon: <FileText className="w-12 h-12 text-accent" />,
      title: "Documentation Assistance",
      description: "We help with all necessary paperwork and documentation required for your claim."
    },
    {
      icon: <Clock className="w-12 h-12 text-accent" />,
      title: "24/7 Emergency Service",
      description: "Round-the-clock availability for emergencies and urgent vehicle replacement needs."
    },
    {
      icon: <CheckCircle className="w-12 h-12 text-accent" />,
      title: "Quality Assurance",
      description: "All our vehicles are regularly serviced and maintained to the highest standards."
    }
  ];

  const process = [
    {
      step: "1",
      title: "Report Your Accident",
      description: "Contact us or submit your claim online with details of your accident."
    },
    {
      step: "2",
      title: "Claim Verification",
      description: "We verify your claim with your insurance provider and process the necessary documentation."
    },
    {
      step: "3",
      title: "Vehicle Selection",
      description: "Choose a suitable replacement vehicle from our quality fleet."
    },
    {
      step: "4",
      title: "Fast Delivery",
      description: "We deliver your replacement vehicle to your location, often within hours."
    },
    {
      step: "5",
      title: "Ongoing Support",
      description: "Our team stays in touch throughout your rental period to ensure everything runs smoothly."
    },
    {
      step: "6",
      title: "Simple Return",
      description: "Once your car is repaired, we arrange convenient collection of the replacement vehicle."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      
      <main className="flex-grow">
        <section className="bg-primary text-primary-foreground py-16">
          <div className="container mx-auto px-4 text-center">
            <AnimatedSection>
              <h1 className="text-4xl lg:text-5xl font-bold mb-4">What We Do</h1>
              <p className="text-lg opacity-90 max-w-2xl mx-auto">
                Professional car hire services designed specifically for accident victims, with comprehensive insurance support.
              </p>
            </AnimatedSection>
          </div>
        </section>

        <section className="py-16 bg-secondary">
          <div className="container mx-auto px-4">
            <AnimatedSection>
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">Our Services</h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  We provide end-to-end support for accident victims, from initial claim to final vehicle return.
                </p>
              </div>
            </AnimatedSection>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service, index) => (
                <AnimatedSection key={index} delay={index * 100}>
                  <Card className="hover:shadow-xl transition-shadow">
                    <CardContent className="pt-8">
                      <div className="mb-4">{service.icon}</div>
                      <h3 className="text-xl font-bold mb-3">{service.title}</h3>
                      <p className="text-muted-foreground">{service.description}</p>
                    </CardContent>
                  </Card>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4">
            <AnimatedSection>
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">How It Works</h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Our streamlined process gets you back on the road quickly and easily.
                </p>
              </div>
            </AnimatedSection>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {process.map((item, index) => (
                <AnimatedSection key={index} delay={index * 100}>
                  <div className="relative">
                    <Card className="h-full hover:shadow-xl transition-shadow">
                      <CardContent className="pt-6">
                        <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mb-4">
                          <span className="text-2xl font-bold text-accent-foreground">{item.step}</span>
                        </div>
                        <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                        <p className="text-muted-foreground">{item.description}</p>
                      </CardContent>
                    </Card>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <AnimatedSection>
              <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
              <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
                Submit your claim today and let us handle the rest. We're here to make your experience as smooth as possible.
              </p>
              <Link to="/make-claim">
                <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                  Make a Claim Now
                </Button>
              </Link>
            </AnimatedSection>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default WhatWeDo;
