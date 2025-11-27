import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import AnimatedSection from "@/components/AnimatedSection";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { blogApi, type BlogPost } from "@/services/blogApi";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const PublicNews = () => {
  const { toast } = useToast();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activePost, setActivePost] = useState<BlogPost | null>(null);

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const response = await blogApi.list({ status: "published" });
        setPosts(response);
      } catch (error) {
        toast({
          title: "Unable to load articles",
          description: error instanceof Error ? error.message : "Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadPosts();
  }, [toast]);

  const formatDate = (date?: string | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />

      <main className="flex-grow py-12 lg:py-16">
        <div className="container mx-auto px-4">
          <AnimatedSection>
            <div className="text-center mb-10">
              <h1 className="text-4xl font-bold mb-3">Latest News & Updates</h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Stay informed with company news, service updates, and helpful guides from the Prestige
                Car Hire Management team.
              </p>
            </div>
          </AnimatedSection>

          {isLoading ? (
            <p className="text-center text-muted-foreground">Loading articles...</p>
          ) : posts.length === 0 ? (
            <p className="text-center text-muted-foreground">
              No published posts yet. Check back soon for updates.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post, index) => (
                <AnimatedSection key={post.id} delay={index * 100}>
                  <Card
                    className="h-full flex flex-col cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setActivePost(post)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setActivePost(post);
                      }
                    }}
                  >
                    {post.featured_image_url && (
                      <div className="h-48 w-full overflow-hidden">
                        <img
                          src={post.featured_image_url}
                          alt={post.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    <CardContent className="pt-6 flex flex-col flex-1">
                      <div className="text-sm text-muted-foreground mb-2">
                        {formatDate(post.published_at || post.created_at)} • {post.author_name || "Admin"}
                      </div>
                      <h2 className="text-xl font-semibold mb-3">{post.title}</h2>
                      <p className="text-muted-foreground flex-1">
                        {post.excerpt || post.content.slice(0, 160)}...
                      </p>
                    </CardContent>
                  </Card>
                </AnimatedSection>
              ))}
            </div>
          )}

          <AnimatedSection delay={200}>
            <div className="text-center mt-12">
              <Link to="/contact">
                <Button size="lg" variant="outline">
                  Contact us for press or partnership enquiries
                </Button>
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </main>

      {/* Article Modal */}
      <Dialog open={!!activePost} onOpenChange={() => setActivePost(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{activePost?.title}</DialogTitle>
            <DialogDescription>
              {activePost?.author_name || "Admin"} •{" "}
              {activePost?.published_at || activePost?.created_at
                ? new Date(activePost?.published_at || (activePost?.created_at as string)).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {activePost?.featured_image_url && (
              <img
                src={activePost.featured_image_url}
                alt="Featured"
                className="w-full h-56 object-cover rounded-md border"
              />
            )}
            <div
              className="prose prose-sm md:prose-base max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-a:text-accent prose-li:text-foreground"
              dangerouslySetInnerHTML={{ __html: activePost?.content || "" }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActivePost(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default PublicNews;


