import { useEffect, useState, useRef } from "react";
import { Video, Image as ImageIcon, UploadCloud, X, MapPin, Phone } from "lucide-react";
import { adminLandingPageApi, LandingPageConfig } from "@/services/adminLandingPageApi";
import { landingPageApi } from "@/services/landingPageApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface LandingPageManagementProps {
  embedded?: boolean;
}

const LandingPageManagement = ({ embedded }: LandingPageManagementProps) => {
  const { toast } = useToast();
  const [config, setConfig] = useState<LandingPageConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // File refs
  const heroVideoRef = useRef<HTMLInputElement>(null);
  const logoLightRef = useRef<HTMLInputElement>(null);
  const logoDarkRef = useRef<HTMLInputElement>(null);

  // File states
  const [heroVideoFile, setHeroVideoFile] = useState<File | null>(null);
  const [logoLightFile, setLogoLightFile] = useState<File | null>(null);
  const [logoDarkFile, setLogoDarkFile] = useState<File | null>(null);

  // Form states
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactAddress, setContactAddress] = useState("");
  const [contactHours, setContactHours] = useState("");
  const [googleMapEmbedUrl, setGoogleMapEmbedUrl] = useState("");

  useEffect(() => {
    const loadConfig = async () => {
      try {
        setIsLoading(true);
        const data = await adminLandingPageApi.getConfig();
        setConfig(data);
        setContactPhone(data.contact_phone || "");
        setContactEmail(data.contact_email || "");
        setContactAddress(data.contact_address || "");
        setContactHours(data.contact_hours || "");
        setGoogleMapEmbedUrl(data.google_map_embed_url || "");
      } catch (error: any) {
        toast({
          title: "Failed to load landing page content",
          description: error?.message || "Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    loadConfig();
  }, [toast]);

  const handleSave = async () => {
    if (!config) {
      toast({
        title: "Config not loaded",
        description: "Please wait for configuration to load.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);
      const formData = new FormData();

      // Add files if selected
      if (heroVideoFile) {
        formData.append("hero_video", heroVideoFile);
      }
      if (logoLightFile) {
        formData.append("logo_light", logoLightFile);
      }
      if (logoDarkFile) {
        formData.append("logo_dark", logoDarkFile);
      }

      // Add contact info
      formData.append("contact_phone", contactPhone);
      formData.append("contact_email", contactEmail);
      formData.append("contact_address", contactAddress);
      formData.append("contact_hours", contactHours);
      formData.append("google_map_embed_url", googleMapEmbedUrl);

      const result = await adminLandingPageApi.updateConfig(config.id, formData);
      setConfig(result);

      // Clear cache so updated logos are immediately visible
      landingPageApi.clearCache();

      // Clear file inputs after successful save
      if (heroVideoFile) setHeroVideoFile(null);
      if (logoLightFile) setLogoLightFile(null);
      if (logoDarkFile) setLogoDarkFile(null);

      // Reset file inputs
      if (heroVideoRef.current) heroVideoRef.current.value = "";
      if (logoLightRef.current) logoLightRef.current.value = "";
      if (logoDarkRef.current) logoDarkRef.current.value = "";

      toast({
        title: "Landing page updated",
        description: "Your changes have been saved successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to save",
        description: error?.message || "Please review the fields and try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileChange = (
    file: File | null,
    setter: (file: File | null) => void,
    type: "video" | "image"
  ) => {
    if (!file) {
      setter(null);
      return;
    }

    // Validate file type
    if (type === "video") {
      if (!file.type.startsWith("video/")) {
        toast({
          title: "Invalid file type",
          description: "Please select a video file.",
          variant: "destructive",
        });
        return;
      }
    } else {
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file.",
          variant: "destructive",
        });
        return;
      }
    }

    setter(file);
  };

  const removeFile = (setter: (file: File | null) => void, ref: React.RefObject<HTMLInputElement>) => {
    setter(null);
    if (ref.current) ref.current.value = "";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading landing page configuration...</p>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Unable to load configuration.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Section Video */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            Hero Section Video
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Hero Background Video</Label>
            <div className="mt-2 flex items-center gap-4">
              <input
                ref={heroVideoRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => handleFileChange(e.target.files?.[0] || null, setHeroVideoFile, "video")}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => heroVideoRef.current?.click()}
                className="flex items-center gap-2"
              >
                <UploadCloud className="w-4 h-4" />
                {heroVideoFile ? "Change Video" : "Upload Video"}
              </Button>
              {heroVideoFile && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{heroVideoFile.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-600 hover:text-red-700"
                    onClick={() => removeFile(setHeroVideoFile, heroVideoRef)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
              {config.hero_video_url && !heroVideoFile && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Current video uploaded</span>
                  <video src={config.hero_video_url} className="h-20 w-auto rounded border" controls={false} muted />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            Logos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Light Mode Logo */}
            <div>
              <Label>Light Mode Logo</Label>
              <div className="mt-2 flex items-center gap-4">
                <input
                  ref={logoLightRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileChange(e.target.files?.[0] || null, setLogoLightFile, "image")}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => logoLightRef.current?.click()}
                  className="flex items-center gap-2"
                >
                  <UploadCloud className="w-4 h-4" />
                  {logoLightFile ? "Change" : "Upload"}
                </Button>
                {logoLightFile && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{logoLightFile.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-600 hover:text-red-700"
                      onClick={() => removeFile(setLogoLightFile, logoLightRef)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                {config.logo_light_url && !logoLightFile && (
                  <img src={config.logo_light_url} alt="Light logo" className="h-16 w-auto rounded border" />
                )}
              </div>
            </div>

            {/* Dark Mode Logo */}
            <div>
              <Label>Dark Mode Logo</Label>
              <div className="mt-2 flex items-center gap-4">
                <input
                  ref={logoDarkRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileChange(e.target.files?.[0] || null, setLogoDarkFile, "image")}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => logoDarkRef.current?.click()}
                  className="flex items-center gap-2"
                >
                  <UploadCloud className="w-4 h-4" />
                  {logoDarkFile ? "Change" : "Upload"}
                </Button>
                {logoDarkFile && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{logoDarkFile.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-600 hover:text-red-700"
                      onClick={() => removeFile(setLogoDarkFile, logoDarkRef)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                {config.logo_dark_url && !logoDarkFile && (
                  <img src={config.logo_dark_url} alt="Dark logo" className="h-16 w-auto rounded border" />
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5" />
            Contact Us
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contact_phone">Phone</Label>
              <Input
                id="contact_phone"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+44 (0) 20 1234 5678"
              />
            </div>
            <div>
              <Label htmlFor="contact_email">Email</Label>
              <Input
                id="contact_email"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="info@prestigecarhire.co.uk"
              />
            </div>
            <div>
              <Label htmlFor="contact_address">Address</Label>
              <Input
                id="contact_address"
                value={contactAddress}
                onChange={(e) => setContactAddress(e.target.value)}
                placeholder="London, United Kingdom"
              />
            </div>
            <div>
              <Label htmlFor="contact_hours">Hours</Label>
              <Input
                id="contact_hours"
                value={contactHours}
                onChange={(e) => setContactHours(e.target.value)}
                placeholder="Monday - Friday: 9:00 AM - 6:00 PM"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Google Map */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Visit Our Office - Google Map
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="google_map">Google Maps Embed URL or Iframe Code</Label>
            <Textarea
              id="google_map"
              value={googleMapEmbedUrl}
              onChange={(e) => setGoogleMapEmbedUrl(e.target.value)}
              placeholder="Paste Google Maps embed URL or iframe code here..."
              rows={4}
            />
            <p className="text-xs text-muted-foreground mt-2">
              Get the embed code from Google Maps: Share → Embed a map → Copy HTML
            </p>
          </div>
          {googleMapEmbedUrl && (
            <div className="mt-4">
              <Label>Preview</Label>
              <div
                className="mt-2 border rounded-lg overflow-hidden"
                dangerouslySetInnerHTML={{ __html: googleMapEmbedUrl }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} className="min-w-32">
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
};

export default LandingPageManagement;
