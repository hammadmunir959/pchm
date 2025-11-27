import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import AnimatedSection from "@/components/AnimatedSection";
import { Card, CardContent } from "@/components/ui/card";
import { teamMembersApi, type TeamMember } from "@/services/teamMembersApi";
import { Loader2 } from "lucide-react";

const OurPeople = () => {
  const { data: team = [], isLoading, error } = useQuery<TeamMember[]>({
    queryKey: ["team-members"],
    queryFn: () => teamMembersApi.list(),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      
      <main className="flex-grow">
        <section className="bg-primary text-primary-foreground py-16">
          <div className="container mx-auto px-4 text-center">
            <AnimatedSection>
              <h1 className="text-4xl lg:text-5xl font-bold mb-4">Our People</h1>
              <p className="text-lg opacity-90 max-w-2xl mx-auto">
                Meet the dedicated team behind Prestige Car Hire Management. We're here to support you every step of the way.
              </p>
            </AnimatedSection>
          </div>
        </section>

        <section className="py-16 bg-secondary">
          <div className="container mx-auto px-4">
            {isLoading ? (
              <div className="flex justify-center items-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground">
                  Unable to load team members. Please try again later.
                </p>
              </div>
            ) : team.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground">No team members available at this time.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {team.map((member, index) => (
                  <AnimatedSection key={member.id} delay={index * 100}>
                    <Card className="hover:shadow-xl transition-shadow">
                      <CardContent className="pt-6">
                        <div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden border border-border shadow-md bg-muted">
                          {member.image_url ? (
                            <img
                              src={member.image_url}
                              alt={member.name}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
                              <span className="text-2xl font-semibold">
                                {member.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <h3 className="text-xl font-bold text-center mb-2">{member.name}</h3>
                        <p className="text-accent text-center font-semibold mb-3">{member.role}</p>
                        <p className="text-muted-foreground text-center">{member.description}</p>
                      </CardContent>
                    </Card>
                  </AnimatedSection>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <AnimatedSection>
              <h2 className="text-3xl font-bold mb-6">Committed to Excellence</h2>
              <p className="text-lg text-muted-foreground mb-6">
                At Prestige Car Hire Management, our people are our greatest asset. Every team member is trained 
                to provide compassionate, professional service during what can be a challenging time for our clients.
              </p>
              <p className="text-lg text-muted-foreground">
                We understand that dealing with an accident is stressful. That's why we've built a team that not 
                only knows the industry inside and out but genuinely cares about making your experience as smooth 
                and stress-free as possible.
              </p>
            </AnimatedSection>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default OurPeople;
