import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import ThemeBanner from "@/components/ThemeBanner";
import AnimatedSection from "@/components/AnimatedSection";
import ServiceSelectionPopup from "@/components/ServiceSelectionPopup";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Clock, Users, Car } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useTheme as useEventTheme } from "@/context/ThemeContext";
import { useEffect, useState } from "react";
import { testimonialsApi } from "@/services/testimonialsApi";
import { Logo } from "@/components/Logo";

const Index = () => {
  const { theme } = useTheme();
  const { theme: eventTheme } = useEventTheme();
  const [mounted, setMounted] = useState(false);
  const [testimonials, setTestimonials] = useState<
    { name: string; feedback: string; rating: number }[]
  >([
    {
      name: "Sarah Mitchell",
      feedback:
        "Excellent service during a stressful time. The team was professional and got me a replacement car within 3 hours.",
      rating: 5,
    },
    {
      name: "James Robertson",
      feedback: "Couldn't have asked for better support. They handled everything with my insurance company.",
      rating: 5,
    },
    {
      name: "Emma Thompson",
      feedback: "Professional, fast, and caring. Made a difficult situation so much easier to handle.",
      rating: 5,
    },
  ]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadTestimonials = async () => {
      try {
        const response = await testimonialsApi.list({ status: "approved" });
        if (isMounted && response.length > 0) {
          setTestimonials(
            response.slice(0, 3).map((item) => ({
              name: item.name,
              feedback: item.feedback,
              rating: item.rating,
            }))
          );
        }
      } catch {
        // fail silently, fallback data will remain
      }
    };

    loadTestimonials();
    return () => {
      isMounted = false;
    };
  }, []);

  const isDark = theme === "dark";
  const features = [
    {
      icon: <Clock className="w-12 h-12 text-accent" />,
      title: "Fast Response",
      description: "Get your replacement vehicle within hours of your accident claim."
    },
    {
      icon: <Shield className="w-12 h-12 text-accent" />,
      title: "Insurance Support",
      description: "We work directly with insurance providers to streamline your claim process."
    },
    {
      icon: <Users className="w-12 h-12 text-accent" />,
      title: "Dedicated Team",
      description: "Personal assistance throughout your entire journey with us."
    },
    {
      icon: <Car className="w-12 h-12 text-accent" />,
      title: "Quality Fleet",
      description: "Wide range of well-maintained, reliable replacement vehicles."
    }
  ];

  // Apply theme background and text colors only in light mode
  const backgroundColor = !isDark ? eventTheme?.theme.background_color : undefined;
  const textColor = !isDark ? eventTheme?.theme.text_color : undefined;
  
  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{
        backgroundColor: backgroundColor || undefined,
        color: textColor || undefined,
      }}
    >
      <Navigation />
      <ServiceSelectionPopup />
      <ThemeBanner />
      
      <main className="flex-grow">
        <Hero />

        {/* Claim Journey Section */}
        <section className="py-20 lg:py-28 bg-background">
          <div className="container mx-auto px-4">
            <AnimatedSection>
              <div className="text-center mb-16">
                <h2 className="text-3xl lg:text-4xl font-semibold mb-5 text-foreground tracking-tight">
                  Your claim journey starts here
                </h2>
                <p className="text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                  From start to finish, we're committed to simplifying your post-accident experience. 
                  Explore our services and let's drive progress together.
                </p>
              </div>
            </AnimatedSection>

            {/* Established Banner Section */}
            <div className="relative">
              <div className="container mx-auto px-4">
                <div className="relative bg-background border-2 border-accent rounded-2xl lg:rounded-3xl overflow-hidden">
                  <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] items-center gap-8 lg:gap-12 py-12 lg:py-16 px-8 lg:px-12">
                    {/* Content */}
                    <div className="text-foreground">
                      <h3 className="text-2xl lg:text-4xl font-bold mb-5 tracking-tight text-accent">
                        ESTABLISHED SINCE 2022
                      </h3>
                      <p className="text-base lg:text-lg text-muted-foreground leading-relaxed max-w-xl">
                        With years of commitment to excellence, we've built a reputation for delivering reliable and efficient claim management solutions. Our goal is to make every client experience seamless, transparent, and stress-free.
                      </p>
                    </div>

                    {/* Logo */}
                    <div className="flex justify-center lg:justify-end items-center">
                      <Logo className="h-40 lg:h-64 xl:h-80" alt="Prestige Car Hire Management" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 lg:py-24 bg-secondary">
          <div className="container mx-auto px-4">
            <AnimatedSection>
              <div className="text-center mb-12">
                <h2 className="text-3xl lg:text-4xl font-bold mb-4">Why Choose Prestige Car Hire<span className="text-accent">?</span></h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  We understand that accidents are stressful. That's why we're here to make getting back on the road as smooth as possible.
                </p>
              </div>
            </AnimatedSection>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <AnimatedSection key={index} delay={index * 100}>
                  <Card className="text-center hover:shadow-xl transition-shadow">
                    <CardContent className="pt-8 pb-6">
                      <div className="flex justify-center mb-4">{feature.icon}</div>
                      <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* Services Overview */}
        <section className="py-16 lg:py-24 bg-accent">
          <div className="container mx-auto px-4">
            <AnimatedSection>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-3xl lg:text-4xl font-bold mb-6 text-accent-foreground">Comprehensive Accident Vehicle Solutions</h2>
                  <p className="text-lg text-accent-foreground mb-6">
                    We provide professional car hire services specifically tailored for accident victims. 
                    Our team works closely with insurance providers to ensure a smooth, hassle-free experience.
                  </p>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-start gap-3">
                      <span className="text-accent-foreground text-xl">✓</span>
                      <span className="text-accent-foreground">24/7 emergency response and support</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-accent-foreground text-xl">✓</span>
                      <span className="text-accent-foreground">Direct insurance claim processing</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-accent-foreground text-xl">✓</span>
                      <span className="text-accent-foreground">Nationwide vehicle delivery service</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-accent-foreground text-xl">✓</span>
                      <span className="text-accent-foreground">Personal client assistance throughout</span>
                    </li>
                  </ul>
                  <Link to="/what-we-do">
                    <Button size="lg" className="bg-accent-foreground text-accent hover:bg-accent-foreground/90">
                      Learn More About Our Services
                    </Button>
                  </Link>
                </div>
                <div className="rounded-lg overflow-hidden h-[400px]">
                  <img
                    src="/odinei-ramone-UUGaMVsD63A-unsplash.jpg"
                    alt="Fleet Gallery"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16 lg:py-24 bg-secondary">
          <div className="container mx-auto px-4">
            <AnimatedSection>
              <div className="text-center mb-12">
                <h2 className="text-3xl lg:text-4xl font-bold mb-4">What Our <span className="text-accent">Clients</span> Say</h2>
                <p className="text-lg text-muted-foreground">
                  Don't just take our word for it - hear from those we've helped.
                </p>
              </div>
            </AnimatedSection>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((testimonial, index) => (
                <AnimatedSection key={index} delay={index * 100}>
                  <Card className="hover:shadow-xl transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex gap-1 mb-4">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <span key={i} className="text-accent text-xl">★</span>
                        ))}
                      </div>
                      <p className="text-muted-foreground mb-4 italic">"{testimonial.feedback}"</p>
                      <p className="font-semibold">{testimonial.name}</p>
                    </CardContent>
                  </Card>
                </AnimatedSection>
              ))}
            </div>

            <div className="text-center mt-8">
              <AnimatedSection delay={300}>
                <Link to="/testimonials">
                  <Button variant="outline" size="lg">
                    Read More Testimonials
                  </Button>
                </Link>
              </AnimatedSection>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 lg:py-24 bg-black text-white">
          <div className="container mx-auto px-4 text-center">
            <AnimatedSection>
              <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-white">Need a Replacement Vehicle?</h2>
              <p className="text-lg mb-8 text-white/90 max-w-2xl mx-auto">
                Submit your claim online and we'll get you back on the road quickly. Our team is ready to assist you 24/7.
              </p>
              <Link to="/make-claim">
                <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 text-lg px-8">
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

export default Index;
