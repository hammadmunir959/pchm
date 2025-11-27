import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Eye, EyeOff, Save, X, Bot, RefreshCw, Search, MessageSquare, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import DashboardHeader from "@/components/DashboardHeader";
import DashboardNavBar from "@/components/DashboardNavBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { chatbotApi } from "@/services/chatbotApi";

interface ChatbotContext {
  id: number;
  section: string;
  title: string;
  content: string;
  keywords: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  created_by: number;
  created_by_name: string;
}

const SECTION_CHOICES = [
  { value: 'intro', label: 'Chatbot Introduction' },
  { value: 'company', label: 'Company Information' },
  { value: 'services', label: 'Services Overview' },
  { value: 'working', label: 'How We Work' },
  { value: 'faqs', label: 'Frequently Asked Questions' },
  { value: 'pricing', label: 'Pricing Information' },
  { value: 'contact', label: 'Contact Details' },
  { value: 'policies', label: 'Company Policies' },
  { value: 'emergency', label: 'Emergency Services' },
];

const ChatbotContext = () => {
  const { toast } = useToast();
  const [contexts, setContexts] = useState<ChatbotContext[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sectionFilter, setSectionFilter] = useState<string>("all");

  // Form state
  const [formData, setFormData] = useState({
    section: '',
    title: '',
    content: '',
    keywords: '',
    is_active: true,
    display_order: 0,
  });

  const loadContexts = async () => {
    try {
      setIsLoading(true);
      const response: ChatbotContext[] | any = await chatbotApi.getContexts();
      // Ensure response is an array
      let contextsArray: ChatbotContext[] = [];
      if (Array.isArray(response)) {
        contextsArray = response;
      } else if (response && typeof response === 'object') {
        contextsArray = response.results || response.data || [];
      }
      setContexts(contextsArray);
    } catch (error: any) {
      toast({
        title: "Failed to load chatbot contexts",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
      setContexts([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  const filteredContexts = Array.isArray(contexts) ? contexts.filter(context => {
    const matchesSearch = !searchQuery ||
      context.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      context.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      context.keywords.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSection = sectionFilter === "all" || context.section === sectionFilter;
    
    return matchesSearch && matchesSection;
  }) : [];

  useEffect(() => {
    loadContexts();
  }, []);

  const resetForm = () => {
    setFormData({
      section: '',
      title: '',
      content: '',
      keywords: '',
      is_active: true,
      display_order: 0,
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.section || !formData.title || !formData.content) {
      toast({
        title: "Validation Error",
        description: "Section, title, and content are required.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingId) {
        await chatbotApi.updateContext(editingId, formData);
        toast({
          title: "Context Updated",
          description: "Chatbot context has been updated successfully.",
        });
      } else {
        await chatbotApi.createContext(formData);
        toast({
          title: "Context Created",
          description: "New chatbot context has been created successfully.",
        });
      }
      resetForm();
      loadContexts();
    } catch (error: any) {
      toast({
        title: "Failed to save context",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (context: ChatbotContext) => {
    setFormData({
      section: context.section,
      title: context.title,
      content: context.content,
      keywords: context.keywords,
      is_active: context.is_active,
      display_order: context.display_order,
    });
    setEditingId(context.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this context?")) return;

    try {
      await chatbotApi.deleteContext(id);
      toast({
        title: "Context Deleted",
        description: "Chatbot context has been deleted successfully.",
      });
      loadContexts();
    } catch (error: any) {
      toast({
        title: "Failed to delete context",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleActive = async (id: number, currentStatus: boolean) => {
    try {
      await chatbotApi.updateContext(id, { is_active: !currentStatus });
      toast({
        title: "Status Updated",
        description: `Context ${!currentStatus ? 'activated' : 'deactivated'} successfully.`,
      });
      loadContexts();
    } catch (error: any) {
      toast({
        title: "Failed to update status",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <DashboardHeader />
      <DashboardNavBar />
      <main className="flex-grow py-8">
        <div className="container mx-auto px-4">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Bot className="w-8 h-8" />
                Chatbot Context Management
              </h1>
              <p className="text-muted-foreground mt-2">
                Manage context sections that help the AI chatbot classify intents and provide appropriate responses.
              </p>
            </div>
            <div className="flex gap-2">
              <Link to="/admin/dashboard/chatbot">
                <Button variant="outline" className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Sessions
                </Button>
              </Link>
              <Link to="/admin/dashboard/chatbot/settings">
                <Button variant="outline" className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Settings
                </Button>
              </Link>
            </div>
            </div>
            <div className="flex items-center justify-end">
            <Button onClick={() => setShowForm(true)} disabled={showForm}>
              <Plus className="w-4 h-4 mr-2" />
              Add Context
            </Button>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="text"
                placeholder="Search contexts by title, content, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={sectionFilter} onValueChange={setSectionFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by section" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sections</SelectItem>
                {SECTION_CHOICES.map(choice => (
                  <SelectItem key={choice.value} value={choice.value}>
                    {choice.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={loadContexts} variant="outline" disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            </div>

            {/* Add/Edit Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Context' : 'Add New Context'}</DialogTitle>
            <DialogDescription>
              {editingId 
                ? 'Update the chatbot context section. Changes will affect how the AI responds to user queries.'
                : 'Create a new context section to help the chatbot understand and respond to user queries.'}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="section">Section *</Label>
                  <Select
                    value={formData.section}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, section: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a section" />
                    </SelectTrigger>
                    <SelectContent>
                      {SECTION_CHOICES.map(choice => (
                        <SelectItem key={choice.value} value={choice.value}>
                          {choice.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="display_order">Display Order</Label>
                  <Input
                    id="display_order"
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter context title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Enter detailed context content for this section"
                  rows={6}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="keywords">Keywords (comma-separated)</Label>
                <Textarea
                  id="keywords"
                  value={formData.keywords}
                  onChange={(e) => setFormData(prev => ({ ...prev, keywords: e.target.value }))}
                  placeholder="Enter keywords for intent classification (e.g., pricing, cost, price, rates)"
                  rows={2}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="is_active">Active</Label>
              </div>

              <div className="flex space-x-2">
                <Button type="submit">
                  <Save className="w-4 h-4 mr-2" />
                  {editingId ? 'Update' : 'Create'} Context
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

            {/* Contexts List */}
      {isLoading ? (
        <Card>
          <CardContent className="text-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Loading contexts...</p>
          </CardContent>
        </Card>
      ) : filteredContexts.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Bot className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">
              {searchQuery || sectionFilter !== "all"
                ? "No contexts match your filters"
                : "No chatbot contexts found. Create your first context to get started."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredContexts.map((context) => (
          <Card key={context.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CardTitle className="text-lg">{context.title}</CardTitle>
                  <Badge variant={context.is_active ? "default" : "secondary"}>
                    {SECTION_CHOICES.find(s => s.value === context.section)?.label || context.section}
                  </Badge>
                  {!context.is_active && (
                    <Badge variant="outline">Inactive</Badge>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleActive(context.id, context.is_active)}
                  >
                    {context.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(context)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(context.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Content Preview</h4>
                  <p className="text-sm line-clamp-3">{context.content}</p>
                </div>
                {context.keywords && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Keywords</h4>
                    <div className="flex flex-wrap gap-1">
                      {context.keywords.split(',').map((keyword, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {keyword.trim()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  Order: {context.display_order} • Updated: {new Date(context.updated_at).toLocaleDateString()}
                  {context.created_by_name && ` • By: ${context.created_by_name}`}
                </div>
              </div>
            </CardContent>
          </Card>
          ))}
        </div>
      )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ChatbotContext;
