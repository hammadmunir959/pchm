import { useEffect, useState } from "react";
import { Save, Settings as SettingsIcon, RefreshCw, MessageSquare, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import DashboardHeader from "@/components/DashboardHeader";
import DashboardNavBar from "@/components/DashboardNavBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { chatbotApi, type ChatbotSettings } from "@/services/chatbotApi";

const MODEL_OPTIONS = [
  // Production Models
  { value: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B Instant (560 tps, 131K context)' },
  { value: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B Versatile (280 tps, 131K context)' },
  { value: 'meta-llama/llama-guard-4-12b', label: 'Llama Guard 4 12B (1200 tps, 131K context) - Content Moderation' },
  { value: 'openai/gpt-oss-120b', label: 'OpenAI GPT-OSS 120B (500 tps, 131K context)' },
  { value: 'openai/gpt-oss-20b', label: 'OpenAI GPT-OSS 20B (1000 tps, 131K context)' },
  
  // Production Systems
  { value: 'groq/compound', label: 'Groq Compound (450 tps, 131K context) - Agentic AI System' },
  { value: 'groq/compound-mini', label: 'Groq Compound Mini (450 tps, 131K context)' },
  
  // Preview Models
  { value: 'meta-llama/llama-4-maverick-17b-128e-instruct', label: 'Llama 4 Maverick 17B 128E (600 tps, 131K context)' },
  { value: 'meta-llama/llama-4-scout-17b-16e-instruct', label: 'Llama 4 Scout 17B 16E (750 tps, 131K context)' },
  { value: 'meta-llama/llama-prompt-guard-2-22m', label: 'Llama Prompt Guard 2 22M - Content Moderation' },
  { value: 'meta-llama/llama-prompt-guard-2-86m', label: 'Llama Prompt Guard 2 86M - Content Moderation' },
  { value: 'moonshotai/kimi-k2-instruct-0905', label: 'Moonshot AI Kimi K2 (200 tps, 262K context)' },
  { value: 'openai/gpt-oss-safeguard-20b', label: 'OpenAI GPT-OSS Safeguard 20B (1000 tps, 131K context) - Safety Model' },
  { value: 'qwen/qwen3-32b', label: 'Qwen3 32B (400 tps, 131K context)' },
  
  // Legacy/Deprecated (keeping for backward compatibility)
  { value: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B (32K context) - Legacy' },
  { value: 'llama-3.1-70b-versatile', label: 'Llama 3.1 70B Versatile - Legacy' },
  { value: 'gemma-7b-it', label: 'Gemma 7B IT - Legacy' },
  { value: 'llama-3.2-90b-text-preview', label: 'Llama 3.2 90B Text Preview - Legacy' },
];

const ChatbotSettings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<ChatbotSettings | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    api_key: '',
    model: 'llama-3.1-8b-instant',
    max_tokens: 500,
    temperature: 0.7,
    is_active: true,
    auto_populate_context: true,
  });

  const loadSettings = async () => {
    try {
      setIsLoadingSettings(true);
      const data = await chatbotApi.getSettings();
      setSettings(data);
      setSettingsForm({
        api_key: data.api_key || '',
        model: data.model || 'llama-3.1-8b-instant',
        max_tokens: data.max_tokens || 500,
        temperature: data.temperature || 0.7,
        is_active: data.is_active ?? true,
        auto_populate_context: data.auto_populate_context ?? true,
      });
    } catch (error: any) {
      toast({
        title: "Failed to load settings",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSavingSettings(true);
      await chatbotApi.updateSettings(settingsForm);
      toast({
        title: "Settings Updated",
        description: "Chatbot settings have been updated successfully.",
      });
      await loadSettings();
    } catch (error: any) {
      toast({
        title: "Failed to save settings",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

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
                  <SettingsIcon className="w-8 h-8" />
                  Chatbot Settings
                </h1>
                <p className="text-muted-foreground mt-2">
                  Configure API keys, model selection, and response parameters.
                </p>
              </div>
              <div className="flex gap-2">
                <Link to="/admin/dashboard/chatbot">
                  <Button variant="outline" className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Sessions
                  </Button>
                </Link>
                <Link to="/admin/dashboard/chatbot/context">
                  <Button variant="outline" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Context
                  </Button>
                </Link>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SettingsIcon className="w-5 h-5" />
                  Configuration
                </CardTitle>
                <CardDescription>
                  Manage chatbot API settings, model selection, and response parameters.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingSettings ? (
                  <div className="text-center py-8">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Loading settings...</p>
                  </div>
                ) : (
                  <form onSubmit={handleSaveSettings} className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="api_key">Groq API Key</Label>
                        <Input
                          id="api_key"
                          type="password"
                          value={settingsForm.api_key}
                          onChange={(e) => setSettingsForm(prev => ({ ...prev, api_key: e.target.value }))}
                          placeholder="Leave empty to use environment variable GROQ_API_KEY"
                        />
                        <p className="text-sm text-muted-foreground">
                          If left empty, the system will use the GROQ_API_KEY environment variable.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="model">Model</Label>
                        <Select
                          value={settingsForm.model}
                          onValueChange={(value) => setSettingsForm(prev => ({ ...prev, model: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a model" />
                          </SelectTrigger>
                          <SelectContent>
                            {MODEL_OPTIONS.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="max_tokens">Max Tokens</Label>
                          <Input
                            id="max_tokens"
                            type="number"
                            min="100"
                            max="2000"
                            value={settingsForm.max_tokens}
                            onChange={(e) => setSettingsForm(prev => ({ ...prev, max_tokens: parseInt(e.target.value) || 500 }))}
                          />
                          <p className="text-sm text-muted-foreground">
                            Maximum tokens for AI responses (100-2000)
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="temperature">Temperature</Label>
                          <Input
                            id="temperature"
                            type="number"
                            min="0"
                            max="2"
                            step="0.1"
                            value={settingsForm.temperature}
                            onChange={(e) => setSettingsForm(prev => ({ ...prev, temperature: parseFloat(e.target.value) || 0.7 }))}
                          />
                          <p className="text-sm text-muted-foreground">
                            Response creativity (0.0-2.0, higher = more creative)
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="is_active"
                            checked={settingsForm.is_active}
                            onChange={(e) => setSettingsForm(prev => ({ ...prev, is_active: e.target.checked }))}
                            className="rounded"
                          />
                          <Label htmlFor="is_active">Enable Chatbot</Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="auto_populate_context"
                            checked={settingsForm.auto_populate_context}
                            onChange={(e) => setSettingsForm(prev => ({ ...prev, auto_populate_context: e.target.checked }))}
                            className="rounded"
                          />
                          <Label htmlFor="auto_populate_context">Auto-populate Default Contexts</Label>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button type="submit" disabled={isSavingSettings}>
                        {isSavingSettings ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Save Settings
                          </>
                        )}
                      </Button>
                    </div>

                    {settings && (
                      <div className="text-xs text-muted-foreground pt-4 border-t">
                        Last updated: {new Date(settings.updated_at).toLocaleString()}
                        {settings.updated_by_name && ` by ${settings.updated_by_name}`}
                      </div>
                    )}
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ChatbotSettings;

