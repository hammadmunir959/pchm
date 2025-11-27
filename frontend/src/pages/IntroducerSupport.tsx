import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import AnimatedSection from "@/components/AnimatedSection";
import { Card, CardContent } from "@/components/ui/card";
import { Handshake, TrendingUp, Award, HeadphonesIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const IntroducerSupport = () => {
  const benefits = [
    {
      icon: <Handshake className="w-12 h-12 text-accent" />,
      title: "Partnership Opportunities",
      description: "Build a mutually beneficial relationship with competitive commission structures and ongoing support."
    },
    {
      icon: <TrendingUp className="w-12 h-12 text-accent" />,
      title: "Revenue Growth",
      description: "Expand your service offerings and generate additional income by referring clients to us."
    },
    {
      icon: <Award className="w-12 h-12 text-accent" />,
      title: "Quality Service",
      description: "Rest assured your referrals receive exceptional service, protecting your reputation."
    },
    {
      icon: <HeadphonesIcon className="w-12 h-12 text-accent" />,
      title: "Dedicated Support",
      description: "Access to a dedicated partner manager who understands your business needs."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-grow">
        <section className="bg-primary text-primary-foreground py-16">
          <div className="container mx-auto px-4 text-center">
            <AnimatedSection>
              <h1 className="text-4xl lg:text-5xl font-bold mb-4">Introducer Support</h1>
              <p className="text-lg opacity-90 max-w-2xl mx-auto">
                Partner with us to provide your clients with premium accident replacement vehicle services.
              </p>
            </AnimatedSection>
          </div>
        </section>

        <section className="py-16 bg-secondary">
          <div className="container mx-auto px-4">
            <AnimatedSection>
              <div className="max-w-3xl mx-auto text-center mb-12">
                <h2 className="text-3xl font-bold mb-6">Why Partner With Us?</h2>
                <p className="text-lg text-muted-foreground">
                  We work with solicitors, insurance brokers, accident management companies, and other 
                  professionals who want to provide their clients with top-quality vehicle replacement services.
                </p>
              </div>
            </AnimatedSection>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              {benefits.map((benefit, index) => (
                <AnimatedSection key={index} delay={index * 100}>
                  <Card className="hover:shadow-xl transition-shadow">
                    <CardContent className="pt-8">
                      <div className="mb-4">{benefit.icon}</div>
                      <h3 className="text-xl font-bold mb-3">{benefit.title}</h3>
                      <p className="text-muted-foreground">{benefit.description}</p>
                    </CardContent>
                  </Card>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
              <Card className="bg-primary text-primary-foreground border-0">
                <CardContent className="pt-8">
                  <h3 className="text-2xl font-bold mb-4 text-accent">What We Offer Partners</h3>
                  <ul className="space-y-4 opacity-90">
                    <li className="flex items-start gap-3">
                      <span className="text-accent text-xl font-bold">✓</span>
                      <span>Fast response times to all referrals</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-accent text-xl font-bold">✓</span>
                      <span>Transparent communication and regular updates</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-accent text-xl font-bold">✓</span>
                      <span>Competitive commission structures</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-accent text-xl font-bold">✓</span>
                      <span>Marketing materials and support</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-accent text-xl font-bold">✓</span>
                      <span>Dedicated partner portal for tracking referrals</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-accent text-xl font-bold">✓</span>
                      <span>Professional handling of all client interactions</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <div>
                <h2 className="text-3xl font-bold mb-6">How It Works</h2>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xl font-bold text-accent-foreground">1</span>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Refer Your Client</h3>
                      <p className="text-muted-foreground">Simply refer your client to us via phone, email, or our partner portal.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xl font-bold text-accent-foreground">2</span>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">We Take Over</h3>
                      <p className="text-muted-foreground">Our team contacts the client immediately and handles all aspects of the vehicle replacement.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xl font-bold text-accent-foreground">3</span>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Stay Informed</h3>
                      <p className="text-muted-foreground">Receive regular updates on the status of your referral and client satisfaction.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xl font-bold text-accent-foreground">4</span>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Earn Commission</h3>
                      <p className="text-muted-foreground">Receive your commission promptly once the service is complete.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-secondary">
          <div className="container mx-auto px-4 text-center max-w-3xl">
            <h2 className="text-3xl font-bold mb-6">Who Can Become a Partner?</h2>
            <p className="text-lg text-muted-foreground mb-8">
              We work with a wide range of professionals who interact with accident victims:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <Card>
                <CardContent className="pt-6">
                  <ul className="space-y-2">
                    <li>• Personal Injury Solicitors</li>
                    <li>• Insurance Brokers</li>
                    <li>• Claims Management Companies</li>
                    <li>• Accident Management Firms</li>
                  </ul>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <ul className="space-y-2">
                    <li>• Recovery Operators</li>
                    <li>• Repair Shops</li>
                    <li>• Independent Assessors</li>
                    <li>• Other Industry Professionals</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-16 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Partner With Us?</h2>
            <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
              Join our network of trusted partners and start providing your clients with exceptional vehicle replacement services.
            </p>
            <Link to="/contact">
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                Get in Touch
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default IntroducerSupport;
