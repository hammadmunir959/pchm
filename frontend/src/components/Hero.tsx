import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
// Background switched from static image to video. Place your video in public/hero-video.mp4

const Hero = () => {
  const { theme } = useTheme();
  
  // Get hero background from theme or use default video
  const heroBackground = theme?.theme.hero_background;
  const hasCustomBackground = heroBackground && heroBackground.trim() !== "";
  
  // Determine if hero_background is a color or image URL
  const isColor = heroBackground?.startsWith('#') || heroBackground?.startsWith('rgb');
  const isImage = heroBackground && !isColor && (heroBackground.startsWith('http') || heroBackground.startsWith('/'));
  
  return (
    <section 
      className="relative h-[600px] lg:h-[700px] flex items-center justify-center overflow-hidden"
      style={
        hasCustomBackground && isColor
          ? { backgroundColor: heroBackground }
          : hasCustomBackground && isImage
          ? { 
              backgroundImage: `url(${heroBackground})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }
          : {}
      }
    >
      {!hasCustomBackground && (
        <>
          {/* Video background: autoplay, muted, loop. Put /hero-video.mp4 in the public folder. */}
          <video
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            poster="/placeholder.svg"
          >
            <source src="/5124621_People_Person_1920x1080.mp4" type="video/mp4" />
            {/* Fallback for browsers that don't support <video> */}
            Your browser does not support the video tag.
          </video>
        </>
      )}

      {/* Gradient overlay on top of the video/background to keep text readable */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight animate-fadeInUp whitespace-nowrap">
            Get Back on the Road <span className="text-accent">Fast</span>
          </h1>
          <p className="text-lg lg:text-xl text-white/90 mb-8 max-w-2xl mx-auto animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
            Professional accident replacement vehicles with seamless insurance claim management. 
            We're here to help you during stressful times with fast, reliable service.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
            <Link to="/make-claim">
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 text-lg px-8 group">
                Make a Claim
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/contact">
              <Button size="lg" className="bg-transparent border border-accent text-accent hover:bg-accent/10 text-lg px-8">
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
