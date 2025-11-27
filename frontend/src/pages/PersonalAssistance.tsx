import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import AnimatedSection from "@/components/AnimatedSection";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Clock, Phone, UserCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const PersonalAssistance = () => {
  const benefits = [
    {
      icon: <Heart className="w-12 h-12 text-accent" />,
      title: "Compassionate Care",
      description: "We understand accidents are stressful. Our team provides caring, personalized support throughout your journey."
    },
    {
      icon: <UserCheck className="w-12 h-12 text-accent" />,
      title: "Dedicated Account Manager",
      description: "You'll have a single point of contact who knows your case and is always available to help."
    },
    {
      icon: <Phone className="w-12 h-12 text-accent" />,
      title: "24/7 Availability",
      description: "Accidents don't follow a schedule, and neither do we. Reach us anytime, day or night."
    },
    {
      icon: <Clock className="w-12 h-12 text-accent" />,
      title: "Regular Updates",
      description: "Stay informed with regular updates about your claim status and vehicle arrangements."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-grow">
        <section className="bg-primary text-primary-foreground py-16">
          <div className="container mx-auto px-4 text-center">
            <AnimatedSection>
              <h1 className="text-4xl lg:text-5xl font-bold mb-4">Personal Assistance</h1>
              <p className="text-lg opacity-90 max-w-2xl mx-auto">
                One-on-one support tailored to your needs during a challenging time.
              </p>
            </AnimatedSection>
          </div>
        </section>

        <section className="py-16 bg-secondary">
          <div className="container mx-auto px-4">
            <AnimatedSection>
              <div className="max-w-3xl mx-auto text-center mb-12">
                <h2 className="text-3xl font-bold mb-6">We're Here For You</h2>
                <p className="text-lg text-muted-foreground">
                  Dealing with an accident is more than just paperwork and vehicle logistics. It's a stressful, 
                  often overwhelming experience. That's why we provide personal assistance every step of the way.
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
              <div>
                <h2 className="text-3xl font-bold mb-6">What We Handle For You</h2>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <span className="text-accent text-xl font-bold">✓</span>
                    <div>
                      <h3 className="font-semibold mb-1">Insurance Communication</h3>
                      <p className="text-muted-foreground">We liaise with your insurance company so you don't have to.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-accent text-xl font-bold">✓</span>
                    <div>
                      <h3 className="font-semibold mb-1">Documentation Support</h3>
                      <p className="text-muted-foreground">Help with all paperwork and documentation required for your claim.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-accent text-xl font-bold">✓</span>
                    <div>
                      <h3 className="font-semibold mb-1">Vehicle Delivery & Collection</h3>
                      <p className="text-muted-foreground">Convenient delivery to your location and collection when you're done.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-accent text-xl font-bold">✓</span>
                    <div>
                      <h3 className="font-semibold mb-1">Ongoing Check-ins</h3>
                      <p className="text-muted-foreground">Regular contact to ensure everything is running smoothly.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-accent text-xl font-bold">✓</span>
                    <div>
                      <h3 className="font-semibold mb-1">Flexible Solutions</h3>
                      <p className="text-muted-foreground">We adapt to your specific needs and circumstances.</p>
                    </div>
                  </li>
                </ul>
              </div>
              <Card className="bg-primary text-primary-foreground border-0">
                <CardContent className="pt-8">
                  <h3 className="text-2xl font-bold mb-4 text-accent">Your Dedicated Team</h3>
                  <p className="mb-6 opacity-90">
                    When you choose Prestige Car Hire, you're not just getting a replacement vehicle - 
                    you're getting a dedicated support team that genuinely cares about making your experience 
                    as stress-free as possible.
                  </p>
                  <p className="mb-6 opacity-90">
                    Our personal assistance service means you always have someone to turn to with questions, 
                    concerns, or just to get an update. We're here to help, 24 hours a day, 7 days a week.
                  </p>
                  <Link to="/contact">
                    <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                      Contact Our Team
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-16 bg-secondary">
          <div className="container mx-auto px-4 text-center max-w-3xl">
            <h2 className="text-3xl font-bold mb-6">Real People, Real Support</h2>
            <p className="text-lg text-muted-foreground mb-6">
              Unlike automated systems or call centers, you'll work with real people who understand 
              your situation and are committed to helping you through it.
            </p>
            <p className="text-lg text-muted-foreground">
              Every member of our team is trained not just in the technical aspects of car hire and 
              insurance claims, but in providing compassionate, understanding service during difficult times.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default PersonalAssistance;
