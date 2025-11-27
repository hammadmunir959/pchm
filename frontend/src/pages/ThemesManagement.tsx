import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Palette,
  Calendar as CalendarIcon,
  Edit,
  Trash2,
  Plus,
  Save,
} from "lucide-react";
import DashboardHeader from "@/components/DashboardHeader";
import DashboardNavBar from "@/components/DashboardNavBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { themeApi, type Theme, type ThemeEvent, type ThemeConfig } from "@/services/themeApi";
import { useTheme as useEventTheme } from "@/context/ThemeContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ThemesManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { theme: activeTheme, refreshTheme } = useEventTheme();

  // State for themes
  const [themes, setThemes] = useState<Theme[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [isThemeDialogOpen, setIsThemeDialogOpen] = useState(false);
  const [isEditingTheme, setIsEditingTheme] = useState(false);
  const [themeKey, setThemeKey] = useState<string>(""); // For creating new themes
  const [isSettingPreview, setIsSettingPreview] = useState(false);

  // State for events
  const [events, setEvents] = useState<ThemeEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<ThemeEvent | null>(null);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [isEditingEvent, setIsEditingEvent] = useState(false);

  // Form states for theme editing
  const [themeForm, setThemeForm] = useState<Partial<ThemeConfig>>({
    name: "",
    primary_color: "#0b5cff",
    secondary_color: "#00d4ff",
    background_color: "#ffffff",
    text_color: "#000000",
    accent_color: "#d4af37",
    banner: "",
    hero_background: "",
    icons_path: "",
    animations: [],
    popup: null,
    landing_popup: {
      enabled: false,
      title: "Had an Accident?",
      subtitle: "Get a Replacement Car Now!",
      description: "Don't wait. Prestige Car Hire Management LTD provides stress-free, fast replacement vehicles while we manage your insurance claim. We're here to help you get back on the road.",
      button_text: "Report an Accident & Start Claim (Fast 5 Mins)",
      image_url: "",
      overlay_text: "Fast & Reliable Replacement Vehicles Available 24/7",
    },
  });

  // Form states for event editing
  const [eventForm, setEventForm] = useState<Partial<ThemeEvent>>({
    name: "",
    slug: "",
    theme_key: "",
    start_date: "",
    end_date: "",
    is_active: true,
  });

  // Fetch themes
  const { data: themesData, isLoading: isLoadingThemes } = useQuery<Theme[]>({
    queryKey: ["themes"],
    queryFn: themeApi.listThemes,
    staleTime: 60 * 1000,
  });

  // Fetch events
  const { data: eventsData, isLoading: isLoadingEvents } = useQuery<ThemeEvent[]>({
    queryKey: ["theme-events"],
    queryFn: themeApi.listEvents,
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    if (themesData) {
      setThemes(themesData);
    }
  }, [themesData]);

  useEffect(() => {
    if (eventsData) {
      setEvents(eventsData);
    }
  }, [eventsData]);

  // Create theme mutation
  const createThemeMutation = useMutation({
    mutationFn: (themeData: {
      key: string;
      name: string;
      primary_color: string;
      secondary_color: string;
      banner?: string;
      icons_path?: string;
      animations?: string[];
      popup_title?: string;
      popup_content?: string;
      landing_popup_enabled?: boolean;
      landing_popup_title?: string;
      landing_popup_subtitle?: string;
      landing_popup_description?: string;
      landing_popup_button_text?: string;
      landing_popup_image_url?: string;
      landing_popup_overlay_text?: string;
    }) => themeApi.createTheme(themeData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["themes"] });
      queryClient.invalidateQueries({ queryKey: ["active-theme"] });
      toast({
        title: "Theme created",
        description: "New theme has been created successfully.",
      });
      setIsThemeDialogOpen(false);
      setSelectedTheme(null);
      resetThemeForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Creation failed",
        description: error.message || "Failed to create theme",
        variant: "destructive",
      });
    },
  });

  // Update theme mutation
  const updateThemeMutation = useMutation({
    mutationFn: ({ themeKey, config }: { themeKey: string; config: Partial<ThemeConfig> }) =>
      themeApi.updateTheme(themeKey, config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["themes"] });
      queryClient.invalidateQueries({ queryKey: ["active-theme"] });
      toast({
        title: "Theme updated",
        description: "Theme configuration has been saved successfully.",
      });
      setIsThemeDialogOpen(false);
      setSelectedTheme(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update theme",
        variant: "destructive",
      });
    },
  });

  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: (event: Omit<ThemeEvent, "id">) => themeApi.createEvent(event),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["theme-events"] });
      queryClient.invalidateQueries({ queryKey: ["active-theme"] });
      toast({
        title: "Event created",
        description: "Theme event has been created successfully.",
      });
      setIsEventDialogOpen(false);
      setSelectedEvent(null);
      resetEventForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Creation failed",
        description: error.message || "Failed to create event",
        variant: "destructive",
      });
    },
  });

  // Update event mutation
  const updateEventMutation = useMutation({
    mutationFn: ({ eventId, event }: { eventId: number; event: Partial<ThemeEvent> }) =>
      themeApi.updateEvent(eventId, event),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["theme-events"] });
      queryClient.invalidateQueries({ queryKey: ["active-theme"] });
      toast({
        title: "Event updated",
        description: "Theme event has been updated successfully.",
      });
      setIsEventDialogOpen(false);
      setSelectedEvent(null);
      resetEventForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update event",
        variant: "destructive",
      });
    },
  });

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: (eventId: number) => themeApi.deleteEvent(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["theme-events"] });
      queryClient.invalidateQueries({ queryKey: ["active-theme"] });
      toast({
        title: "Event deleted",
        description: "Theme event has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Deletion failed",
        description: error.message || "Failed to delete event",
        variant: "destructive",
      });
    },
  });

  const resetThemeForm = () => {
    setThemeForm({
      name: "",
      primary_color: "#0b5cff",
      secondary_color: "#00d4ff",
      background_color: "#ffffff",
      text_color: "#000000",
      accent_color: "#d4af37",
      banner: "",
      hero_background: "",
      icons_path: "",
      animations: [],
      popup: null,
      landing_popup: {
        enabled: true,
        title: "Had an Accident?",
        subtitle: "Get a Replacement Car Now!",
        description: "Don't wait. Prestige Car Hire Management LTD provides stress-free, fast replacement vehicles while we manage your insurance claim. We're here to help you get back on the road.",
        button_text: "Report an Accident & Start Claim (Fast 5 Mins)",
        image_url: "",
        overlay_text: "Fast & Reliable Replacement Vehicles Available 24/7",
      },
    });
    setThemeKey("");
  };

  const resetEventForm = () => {
    setEventForm({
      name: "",
      slug: "",
      theme_key: "",
      start_date: "",
      end_date: "",
      is_active: true,
    });
  };

  const handleCreateTheme = () => {
    setSelectedTheme(null);
    resetThemeForm();
    setIsEditingTheme(false);
    setIsThemeDialogOpen(true);
  };

  const handleEditTheme = (theme: Theme) => {
    // Only allow editing custom themes
    if (!theme.is_custom) {
      toast({
        title: "Cannot edit",
        description: "Predefined themes cannot be edited. Create a custom theme to customize.",
        variant: "destructive",
      });
      return;
    }
    setSelectedTheme(theme);
    setThemeKey(theme.key);
    setThemeForm({
      name: theme.config.name,
      primary_color: theme.config.primary_color,
      secondary_color: theme.config.secondary_color,
      background_color: theme.config.background_color || "#ffffff",
      text_color: theme.config.text_color || "#000000",
      accent_color: theme.config.accent_color || "#d4af37",
      banner: theme.config.banner,
      hero_background: theme.config.hero_background || "",
      icons_path: theme.config.icons_path,
      animations: theme.config.animations || [],
      popup: theme.config.popup,
      landing_popup: theme.config.landing_popup || {
        enabled: true,
        title: "Had an Accident?",
        subtitle: "Get a Replacement Car Now!",
        description: "Don't wait. Prestige Car Hire Management LTD provides stress-free, fast replacement vehicles while we manage your insurance claim. We're here to help you get back on the road.",
        button_text: "Report an Accident & Start Claim (Fast 5 Mins)",
        image_url: "",
        overlay_text: "Fast & Reliable Replacement Vehicles Available 24/7",
      },
    });
    setIsEditingTheme(true);
    setIsThemeDialogOpen(true);
  };

  const handleSaveTheme = () => {
    if (isEditingTheme && selectedTheme) {
      // Flatten the config for the API
      const landingPopup = themeForm.landing_popup || {
        enabled: false,
        title: "",
        subtitle: "",
        description: "",
        button_text: "",
        image_url: "",
        overlay_text: "",
      };
      
      const flattenedConfig = {
        name: themeForm.name,
        primary_color: themeForm.primary_color,
        secondary_color: themeForm.secondary_color,
        background_color: themeForm.background_color,
        text_color: themeForm.text_color,
        accent_color: themeForm.accent_color,
        banner: themeForm.banner,
        hero_background: themeForm.hero_background,
        icons_path: themeForm.icons_path,
        animations: themeForm.animations || [],
        popup_title: themeForm.popup?.title || "",
        popup_content: themeForm.popup?.content || "",
        landing_popup_enabled: landingPopup.enabled,
        landing_popup_title: landingPopup.title || "",
        landing_popup_subtitle: landingPopup.subtitle || "",
        landing_popup_description: landingPopup.description || "",
        landing_popup_button_text: landingPopup.button_text || "",
        landing_popup_image_url: landingPopup.image_url || "",
        landing_popup_overlay_text: landingPopup.overlay_text || "",
      };
      
      // Update existing theme (only custom themes)
      updateThemeMutation.mutate({
        themeKey: selectedTheme.key,
        config: flattenedConfig,
      });
    } else {
      // Create new theme
      if (!themeKey.trim() || !themeForm.name?.trim()) {
        toast({
          title: "Validation error",
          description: "Please provide a theme key and name",
          variant: "destructive",
        });
        return;
      }
      
      const landingPopup = themeForm.landing_popup || {
        enabled: false,
        title: "",
        subtitle: "",
        description: "",
        button_text: "",
        image_url: "",
        overlay_text: "",
      };

      createThemeMutation.mutate({
        key: themeKey.trim().toLowerCase().replace(/\s+/g, '_'),
        name: themeForm.name!,
        primary_color: themeForm.primary_color || "#0b5cff",
        secondary_color: themeForm.secondary_color || "#00d4ff",
        background_color: themeForm.background_color || "#ffffff",
        text_color: themeForm.text_color || "#000000",
        accent_color: themeForm.accent_color || "#d4af37",
        banner: themeForm.banner || "",
        hero_background: themeForm.hero_background || "",
        icons_path: themeForm.icons_path || "",
        animations: themeForm.animations || [],
        popup_title: themeForm.popup?.title || "",
        popup_content: themeForm.popup?.content || "",
        landing_popup_enabled: landingPopup.enabled,
        landing_popup_title: landingPopup.title || "",
        landing_popup_subtitle: landingPopup.subtitle || "",
        landing_popup_description: landingPopup.description || "",
        landing_popup_button_text: landingPopup.button_text || "",
        landing_popup_image_url: landingPopup.image_url || "",
        landing_popup_overlay_text: landingPopup.overlay_text || "",
      });
    }
  };

  const handleCreateEvent = () => {
    setSelectedEvent(null);
    resetEventForm();
    setIsEditingEvent(false);
    setIsEventDialogOpen(true);
  };

  const handleEditEvent = (event: ThemeEvent) => {
    setSelectedEvent(event);
    setEventForm({
      name: event.name,
      slug: event.slug,
      theme_key: event.theme_key,
      start_date: event.start_date,
      end_date: event.end_date,
      is_active: event.is_active ?? true,
    });
    setIsEditingEvent(true);
    setIsEventDialogOpen(true);
  };

  const handleSaveEvent = () => {
    if (isEditingEvent && selectedEvent?.id) {
      updateEventMutation.mutate({
        eventId: selectedEvent.id,
        event: eventForm,
      });
    } else {
      if (!eventForm.name || !eventForm.slug || !eventForm.theme_key || !eventForm.start_date || !eventForm.end_date) {
        toast({
          title: "Validation error",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }
      createEventMutation.mutate({
        name: eventForm.name!,
        slug: eventForm.slug!,
        theme_key: eventForm.theme_key!,
        start_date: eventForm.start_date!,
        end_date: eventForm.end_date!,
        is_active: eventForm.is_active ?? true,
      });
    }
  };

  const handleDeleteEvent = (event: ThemeEvent) => {
    if (!event.id) return;
    if (window.confirm(`Are you sure you want to delete the event "${event.name}"?`)) {
      deleteEventMutation.mutate(event.id);
    }
  };

  const getThemeName = (themeKey: string) => {
    const theme = themes.find((t) => t.key === themeKey);
    return theme?.name || themeKey;
  };

  const isEventActive = (event: ThemeEvent) => {
    if (!event.is_active) return false;
    const now = new Date();
    const start = new Date(event.start_date);
    const end = new Date(event.end_date);
    return now >= start && now <= end;
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <DashboardNavBar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Themes Management</h1>
          <p className="text-muted-foreground">
            Manage calendar-based themes and customize landing page popups. Themes automatically change based on calendar events.
          </p>
        </div>

        {/* Active Theme Selector Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Active Theme Control</CardTitle>
            <CardDescription>
              The active theme changes automatically based on calendar events. You can manually override it here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label>Current Active Theme</Label>
                  <div className="mt-2 p-3 bg-accent/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {activeTheme?.theme && (
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: activeTheme.theme.primary_color }}
                        />
                      )}
                      <div>
                        <p className="font-medium">{activeTheme?.theme?.name || "Loading..."}</p>
                        {activeTheme?.event && (
                          <p className="text-sm text-muted-foreground">
                            Active via event: {activeTheme.event.name}
                          </p>
                        )}
                        {activeTheme?.preview && (
                          <Badge variant="default" className="mt-1">Preview Mode</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex-1">
                  <Label>Manually Select Theme (Preview)</Label>
                  <Select
                    value={activeTheme?.preview ? activeTheme.theme_key : "auto"}
                    onValueChange={async (value) => {
                      setIsSettingPreview(true);
                      try {
                        const themeKey = value === "auto" ? null : value;
                        await themeApi.setPreviewTheme(themeKey);
                        await refreshTheme();
                        queryClient.invalidateQueries({ queryKey: ["themes"] });
                        toast({
                          title: value === "auto" ? "Preview Disabled" : "Preview Enabled",
                          description: value === "auto"
                            ? "Active theme will be used based on calendar events."
                            : `Previewing "${themes.find((t) => t.key === value)?.name || value}" theme. Visit the frontend to see it.`,
                        });
                      } catch (error) {
                        toast({
                          title: "Error",
                          description: error instanceof Error ? error.message : "Failed to set preview theme",
                          variant: "destructive",
                        });
                      } finally {
                        setIsSettingPreview(false);
                      }
                    }}
                    disabled={isSettingPreview}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select theme to preview..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Use Calendar-Based Theme (Auto)</SelectItem>
                      {themes.map((theme) => (
                        <SelectItem key={theme.key} value={theme.key}>
                          {theme.config.name} {theme.is_custom && "(Custom)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {activeTheme?.preview && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      setIsSettingPreview(true);
                      try {
                        await themeApi.setPreviewTheme(null);
                        await refreshTheme();
                        queryClient.invalidateQueries({ queryKey: ["themes"] });
                        toast({
                          title: "Preview Disabled",
                          description: "Active theme will be used based on calendar events.",
                        });
                      } catch (error) {
                        toast({
                          title: "Error",
                          description: error instanceof Error ? error.message : "Failed to clear preview",
                          variant: "destructive",
                        });
                      } finally {
                        setIsSettingPreview(false);
                      }
                    }}
                    disabled={isSettingPreview}
                  >
                    Clear Preview
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Preview mode is active. The selected theme will override calendar-based themes.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Themes Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="w-5 h-5" />
                    Themes
                  </CardTitle>
                  <CardDescription>Customize theme configurations</CardDescription>
                </div>
                <Button onClick={handleCreateTheme} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Theme
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingThemes ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : themes.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No themes found</p>
              ) : (
                <div className="space-y-2">
                  {themes.map((theme) => (
                    <div
                      key={theme.key}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: theme.config.primary_color }}
                        />
                        <div>
                          <p className="font-medium">{theme.config.name}</p>
                          <p className="text-sm text-muted-foreground">{theme.key}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditTheme(theme)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Events Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5" />
                    Calendar Events
                  </CardTitle>
                  <CardDescription>Manage calendar-based theme events</CardDescription>
                </div>
                <Button onClick={handleCreateEvent} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Event
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingEvents ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : events.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No events found</p>
              ) : (
                <div className="space-y-2">
                  {events.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{event.name}</p>
                          {isEventActive(event) && (
                            <Badge variant="default" className="bg-green-500">
                              Active
                            </Badge>
                          )}
                          {!event.is_active && (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {getThemeName(event.theme_key)} • {format(new Date(event.start_date), "MMM d")} - {format(new Date(event.end_date), "MMM d, yyyy")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditEvent(event)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteEvent(event)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Theme Edit/Create Dialog */}
        <Dialog open={isThemeDialogOpen} onOpenChange={setIsThemeDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isEditingTheme ? `Edit Theme: ${selectedTheme?.config.name}` : "Create New Theme"}
              </DialogTitle>
              <DialogDescription>
                {isEditingTheme 
                  ? "Customize theme colors, banner, and landing page popup settings"
                  : "Create a new custom theme with your own colors and settings"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Basic Theme Settings */}
              <div className="space-y-4">
                <h3 className="font-semibold">Basic Settings</h3>
                {!isEditingTheme && (
                  <div>
                    <Label htmlFor="theme-key">Theme Key (Unique Identifier)</Label>
                    <Input
                      id="theme-key"
                      value={themeKey}
                      onChange={(e) => setThemeKey(e.target.value)}
                      placeholder="e.g., summer_2024"
                      className="font-mono"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      This will be used as a unique identifier. Use lowercase letters, numbers, and underscores only.
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="theme-name">Theme Name</Label>
                    <Input
                      id="theme-name"
                      value={themeForm.name || ""}
                      onChange={(e) => setThemeForm({ ...themeForm, name: e.target.value })}
                      placeholder="e.g., Summer 2024"
                    />
                  </div>
                  <div>
                    <Label htmlFor="primary-color">Primary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="primary-color"
                        type="color"
                        value={themeForm.primary_color || "#0b5cff"}
                        onChange={(e) => setThemeForm({ ...themeForm, primary_color: e.target.value })}
                        className="w-20 h-10"
                      />
                      <Input
                        value={themeForm.primary_color || "#0b5cff"}
                        onChange={(e) => setThemeForm({ ...themeForm, primary_color: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="secondary-color">Secondary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="secondary-color"
                        type="color"
                        value={themeForm.secondary_color || "#00d4ff"}
                        onChange={(e) => setThemeForm({ ...themeForm, secondary_color: e.target.value })}
                        className="w-20 h-10"
                      />
                      <Input
                        value={themeForm.secondary_color || "#00d4ff"}
                        onChange={(e) => setThemeForm({ ...themeForm, secondary_color: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="background-color">Background Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="background-color"
                        type="color"
                        value={themeForm.background_color || "#ffffff"}
                        onChange={(e) => setThemeForm({ ...themeForm, background_color: e.target.value })}
                        className="w-20 h-10"
                      />
                      <Input
                        value={themeForm.background_color || "#ffffff"}
                        onChange={(e) => setThemeForm({ ...themeForm, background_color: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="text-color">Text Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="text-color"
                        type="color"
                        value={themeForm.text_color || "#000000"}
                        onChange={(e) => setThemeForm({ ...themeForm, text_color: e.target.value })}
                        className="w-20 h-10"
                      />
                      <Input
                        value={themeForm.text_color || "#000000"}
                        onChange={(e) => setThemeForm({ ...themeForm, text_color: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="accent-color">Accent Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="accent-color"
                        type="color"
                        value={themeForm.accent_color || "#d4af37"}
                        onChange={(e) => setThemeForm({ ...themeForm, accent_color: e.target.value })}
                        className="w-20 h-10"
                      />
                      <Input
                        value={themeForm.accent_color || "#d4af37"}
                        onChange={(e) => setThemeForm({ ...themeForm, accent_color: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="banner">Banner Path</Label>
                    <Input
                      id="banner"
                      value={themeForm.banner || ""}
                      onChange={(e) => setThemeForm({ ...themeForm, banner: e.target.value })}
                      placeholder="themes/theme-name/banner.jpg"
                    />
                  </div>
                  <div>
                    <Label htmlFor="hero-background">Hero Background (Color or Image URL)</Label>
                    <Input
                      id="hero-background"
                      value={themeForm.hero_background || ""}
                      onChange={(e) => setThemeForm({ ...themeForm, hero_background: e.target.value })}
                      placeholder="#000000 or https://example.com/image.jpg"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Enter a hex color (e.g., #000000) or image URL. Leave empty to use default video.
                    </p>
                  </div>
                </div>
              </div>

              {/* Landing Popup Settings */}
              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Landing Page Popup</h3>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={themeForm.landing_popup?.enabled || false}
                      onCheckedChange={(checked) =>
                        setThemeForm({
                          ...themeForm,
                          landing_popup: {
                            ...themeForm.landing_popup!,
                            enabled: checked,
                          },
                        })
                      }
                    />
                    <Label>Enable Popup</Label>
                  </div>
                </div>

                {themeForm.landing_popup?.enabled && (
                  <div className="space-y-4 bg-accent/50 p-4 rounded-lg">
                    <div>
                      <Label htmlFor="popup-title">Title</Label>
                      <Input
                        id="popup-title"
                        value={themeForm.landing_popup.title || ""}
                        onChange={(e) =>
                          setThemeForm({
                            ...themeForm,
                            landing_popup: {
                              ...themeForm.landing_popup!,
                              title: e.target.value,
                            },
                          })
                        }
                        placeholder="Had an Accident?"
                      />
                    </div>
                    <div>
                      <Label htmlFor="popup-subtitle">Subtitle</Label>
                      <Input
                        id="popup-subtitle"
                        value={themeForm.landing_popup.subtitle || ""}
                        onChange={(e) =>
                          setThemeForm({
                            ...themeForm,
                            landing_popup: {
                              ...themeForm.landing_popup!,
                              subtitle: e.target.value,
                            },
                          })
                        }
                        placeholder="Get a Replacement Car Now!"
                      />
                    </div>
                    <div>
                      <Label htmlFor="popup-description">Description</Label>
                      <Textarea
                        id="popup-description"
                        value={themeForm.landing_popup.description || ""}
                        onChange={(e) =>
                          setThemeForm({
                            ...themeForm,
                            landing_popup: {
                              ...themeForm.landing_popup!,
                              description: e.target.value,
                            },
                          })
                        }
                        placeholder="Don't wait. Prestige Car Hire Management LTD provides..."
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="popup-button-text">Button Text</Label>
                      <Input
                        id="popup-button-text"
                        value={themeForm.landing_popup.button_text || ""}
                        onChange={(e) =>
                          setThemeForm({
                            ...themeForm,
                            landing_popup: {
                              ...themeForm.landing_popup!,
                              button_text: e.target.value,
                            },
                          })
                        }
                        placeholder="Report an Accident & Start Claim (Fast 5 Mins)"
                      />
                    </div>
                    <div>
                      <Label htmlFor="popup-image">Image URL</Label>
                      <Input
                        id="popup-image"
                        value={themeForm.landing_popup.image_url || ""}
                        onChange={(e) =>
                          setThemeForm({
                            ...themeForm,
                            landing_popup: {
                              ...themeForm.landing_popup!,
                              image_url: e.target.value,
                            },
                          })
                        }
                        placeholder="URL or path to image"
                      />
                    </div>
                    <div>
                      <Label htmlFor="popup-overlay-text">Overlay Text</Label>
                      <Input
                        id="popup-overlay-text"
                        value={themeForm.landing_popup.overlay_text || ""}
                        onChange={(e) =>
                          setThemeForm({
                            ...themeForm,
                            landing_popup: {
                              ...themeForm.landing_popup!,
                              overlay_text: e.target.value,
                            },
                          })
                        }
                        placeholder="Fast & Reliable Replacement Vehicles Available 24/7"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsThemeDialogOpen(false);
                resetThemeForm();
              }}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveTheme}
                disabled={updateThemeMutation.isPending || createThemeMutation.isPending}
              >
                {(updateThemeMutation.isPending || createThemeMutation.isPending) ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isEditingTheme ? "Saving..." : "Creating..."}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {isEditingTheme ? "Save Changes" : "Create Theme"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Event Edit Dialog */}
        <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {isEditingEvent ? "Edit Event" : "Create New Event"}
              </DialogTitle>
              <DialogDescription>
                Set up a calendar-based theme event
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="event-name">Event Name</Label>
                <Input
                  id="event-name"
                  value={eventForm.name || ""}
                  onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })}
                  placeholder="Christmas 2024"
                />
              </div>
              <div>
                <Label htmlFor="event-slug">Slug</Label>
                <Input
                  id="event-slug"
                  value={eventForm.slug || ""}
                  onChange={(e) => setEventForm({ ...eventForm, slug: e.target.value })}
                  placeholder="christmas-2024"
                />
              </div>
              <div>
                <Label htmlFor="event-theme">Theme</Label>
                <select
                  id="event-theme"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={eventForm.theme_key || ""}
                  onChange={(e) => setEventForm({ ...eventForm, theme_key: e.target.value })}
                >
                  <option value="">Select a theme</option>
                  {themes.map((theme) => (
                    <option key={theme.key} value={theme.key}>
                      {theme.config.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={eventForm.start_date || ""}
                    onChange={(e) => setEventForm({ ...eventForm, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={eventForm.end_date || ""}
                    onChange={(e) => setEventForm({ ...eventForm, end_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={eventForm.is_active ?? true}
                  onCheckedChange={(checked) => setEventForm({ ...eventForm, is_active: checked })}
                />
                <Label>Active</Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEventDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveEvent}
                disabled={createEventMutation.isPending || updateEventMutation.isPending}
              >
                {(createEventMutation.isPending || updateEventMutation.isPending) ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {isEditingEvent ? "Update" : "Create"} Event
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ThemesManagement;

