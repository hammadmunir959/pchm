import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Search, Filter, Eye, RefreshCw, AlertCircle, Send, User, Settings2, Bot, MessageSquare, FileText, Settings } from "lucide-react";
import DashboardHeader from "@/components/DashboardHeader";
import DashboardNavBar from "@/components/DashboardNavBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { chatbotApi, type Conversation } from "@/services/chatbotApi";
import { useToast } from "@/hooks/use-toast";


const ChatbotSessions = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Sessions state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [showConversationModal, setShowConversationModal] = useState(false);
  const [manualReplyMessage, setManualReplyMessage] = useState("");
  const [isManualReplyLoading, setIsManualReplyLoading] = useState(false);

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const params: any = {};
      if (statusFilter !== "all") params.status = statusFilter;
      const data: Conversation[] | any = await chatbotApi.getConversations(params);
      console.log("Conversations loaded:", data, "Type:", typeof data, "IsArray:", Array.isArray(data));
      
      // Ensure we have an array
      let conversationsArray: Conversation[] = [];
      if (Array.isArray(data)) {
        conversationsArray = data;
      } else if (data && typeof data === 'object') {
        conversationsArray = data.results || data.data || [];
      }
      console.log("Processed conversations:", conversationsArray.length);
      setConversations(conversationsArray);
    } catch (error: any) {
      console.error("Failed to load conversations:", error);
      setError(error?.message || "Failed to load conversations");
      setConversations([]);
      toast({
        title: "Failed to load conversations",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log("ChatbotSessions mounted, loading conversations...");
    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);



  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = !searchQuery ||
      conv.session_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (conv.user_name && conv.user_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (conv.user_email && conv.user_email.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesSearch;
  });

  const handleViewConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setShowConversationModal(true);
  };

  const handleToggleManualReply = async () => {
    if (!selectedConversation) return;

    try {
      const response = await chatbotApi.toggleManualReply(selectedConversation.id);
      // Update the selected conversation state
      setSelectedConversation({
        ...selectedConversation,
        manual_reply_active: response.manual_reply_active
      });
      // Reload conversations to get updated state
      loadConversations();
      toast({
        title: response.manual_reply_active ? "Switched to Manual Mode" : "Switched to Auto Mode",
        description: response.message,
      });
    } catch (error: any) {
      toast({
        title: "Failed to toggle mode",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSendManualReply = async () => {
    if (!selectedConversation || !manualReplyMessage.trim()) return;

    try {
      setIsManualReplyLoading(true);
      const response = await chatbotApi.sendManualReply(selectedConversation.id, manualReplyMessage);
      toast({
        title: "Reply Sent",
        description: "Your reply has been sent successfully.",
      });
      setManualReplyMessage("");
      // Reload conversation to get updated messages
      const updatedConv = await chatbotApi.getConversation(selectedConversation.id);
      setSelectedConversation(updatedConv);
      loadConversations();
    } catch (error: any) {
      toast({
        title: "Failed to send reply",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsManualReplyLoading(false);
    }
  };

  const handleModalClose = () => {
    // If in manual mode, switch back to auto when closing
    if (selectedConversation?.manual_reply_active && selectedConversation?.status === 'active') {
      chatbotApi.toggleManualReply(selectedConversation.id).catch(() => {
        // Silently fail if toggle fails on close
      });
    }
    setShowConversationModal(false);
    setManualReplyMessage("");
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'completed': return 'secondary';
      case 'manual': return 'destructive';
      default: return 'outline';
    }
  };

  const formatCollectedData = (data: any) => {
    if (!data || Object.keys(data).length === 0) return "No data collected";

    const entries = Object.entries(data)
      .filter(([_, value]) => value !== null && value !== "")
      .map(([key, value]) => `${key}: ${value}`)
      .join(", ");

    return entries || "No data collected";
  };

  if (error && conversations.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <DashboardHeader />
        <DashboardNavBar />
        <main className="flex-grow py-8">
          <div className="container mx-auto px-4">
            <div className="w-full p-8 text-center bg-background">
              <AlertCircle className="w-8 h-8 mx-auto mb-4 text-destructive" />
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={loadConversations} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <DashboardHeader />

      {/* NavBar */}
      <DashboardNavBar />

      {/* Main Content */}
      <main className="flex-grow py-8">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                  <Bot className="w-8 h-8 text-accent" />
                  AI Chatbot - Sessions
                </h1>
                <p className="text-muted-foreground">Manage chatbot conversation sessions</p>
              </div>
              <div className="flex gap-2">
                <Link to="/admin/dashboard/chatbot/context">
                  <Button variant="outline" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Context
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
          </div>

          <div className="space-y-6">
              <div className="w-full space-y-6 bg-background text-foreground min-h-[400px]">
            <div className="bg-white dark:bg-card shadow rounded-xl text-foreground">
              <div className="flex flex-col sm:flex-row justify-between items-center p-4 gap-4">
                <div className="flex-1 w-full sm:w-auto">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      type="text"
                      placeholder="🔍 Search: Session ID, Name, Email"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-48">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Filter: Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="manual">Manual Reply</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={loadConversations} variant="outline" disabled={isLoading}>
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>

              <div className="p-4 bg-background">
                <div className="rounded-md border bg-background">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Session ID</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Started</TableHead>
                        <TableHead>IP Address</TableHead>
                        <TableHead>Collected Data</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading && conversations.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground bg-background">
                            <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2" />
                            Loading conversations...
                          </TableCell>
                        </TableRow>
                      ) : filteredConversations.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground bg-background">
                            {searchQuery || statusFilter !== "all"
                              ? "No conversations match your filters"
                              : "No chatbot conversations yet. Start chatting with the AI widget to see conversations here."}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredConversations.map((conv) => (
                          <TableRow key={conv.id}>
                            <TableCell className="font-mono text-sm">
                              {conv.session_id ? `${conv.session_id.substring(0, 8)}...` : 'N/A'}
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="font-medium">
                                  {conv.user_name || "Anonymous"}
                                </div>
                                {conv.user_email && (
                                  <div className="text-sm text-muted-foreground">
                                    {conv.user_email}
                                  </div>
                                )}
                                {conv.user_phone && (
                                  <div className="text-sm text-muted-foreground">
                                    {conv.user_phone}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getStatusBadgeVariant(conv.status)}>
                                {conv.status === 'manual' 
                                  ? 'Manual Reply' 
                                  : conv.status === 'active' 
                                    ? 'Active' 
                                    : conv.status === 'completed' 
                                      ? 'Completed' 
                                      : conv.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {conv.started_at 
                                ? `${new Date(conv.started_at).toLocaleDateString()} ${new Date(conv.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                                : 'N/A'}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {conv.ip_address || "N/A"}
                            </TableCell>
                            <TableCell className="max-w-xs">
                              <div className="text-sm truncate" title={formatCollectedData(conv.collected_data)}>
                                {formatCollectedData(conv.collected_data)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewConversation(conv)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
              </div>
          </div>
        </div>
      </main>

      {/* Conversation View Modal - Beautiful Redesign */}
      <Dialog open={showConversationModal} onOpenChange={handleModalClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
          {selectedConversation && (
            <>
              {/* Header */}
              <div className="px-6 py-4 border-b bg-gradient-to-r from-primary/5 to-primary/10">
                <div className="flex items-center justify-between">
                  <div>
                    <DialogTitle className="text-xl font-semibold">Conversation</DialogTitle>
                    <DialogDescription className="mt-1">
                      Session: <span className="font-mono text-xs">{selectedConversation.session_id.substring(0, 12)}...</span> • 
                      <Badge variant={getStatusBadgeVariant(selectedConversation.status)} className="ml-2">
                        {selectedConversation.status === 'manual' 
                          ? 'Manual Reply' 
                          : selectedConversation.status === 'active' 
                            ? 'Active' 
                            : 'Completed'}
                      </Badge>
                    </DialogDescription>
                  </div>
                  {selectedConversation.status === 'active' && (
                    <Button
                      variant={selectedConversation.manual_reply_active ? "default" : "outline"}
                      size="sm"
                      onClick={handleToggleManualReply}
                      className="flex items-center gap-2"
                    >
                      <Settings2 className="w-4 h-4" />
                      {selectedConversation.manual_reply_active ? "Manual Mode" : "Auto Mode"}
                    </Button>
                  )}
                </div>
              </div>

              {/* User Info Bar */}
              <div className="px-6 py-3 border-b bg-muted/30">
                <div className="flex items-center gap-6 text-sm">
                  <div>
                    <span className="text-muted-foreground">Name:</span>{" "}
                    <span className="font-medium">{selectedConversation.user_name || "Anonymous"}</span>
                  </div>
                  {selectedConversation.user_email && (
                    <div>
                      <span className="text-muted-foreground">Email:</span>{" "}
                      <span className="font-medium">{selectedConversation.user_email}</span>
                    </div>
                  )}
                  {selectedConversation.user_phone && (
                    <div>
                      <span className="text-muted-foreground">Phone:</span>{" "}
                      <span className="font-medium">{selectedConversation.user_phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Messages Container */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-gradient-to-b from-background to-muted/20">
                {selectedConversation.messages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No messages yet
                  </div>
                ) : (
                  selectedConversation.messages.map((msg) => {
                    const isUser = msg.message_type === 'user';
                    const isAdmin = msg.message_type === 'admin' || msg.is_admin_reply;
                    const isAssistant = msg.message_type === 'assistant' && !isAdmin;

                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-3 ${isUser ? 'justify-start' : 'justify-end'}`}
                      >
                        {isUser && (
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="w-4 h-4 text-primary" />
                          </div>
                        )}
                        <div className={`flex flex-col max-w-[75%] ${isUser ? 'items-start' : 'items-end'}`}>
                          <div
                            className={`rounded-2xl px-4 py-2.5 ${
                              isUser
                                ? 'bg-primary text-primary-foreground rounded-tl-sm'
                                : isAdmin
                                ? 'bg-accent text-accent-foreground rounded-tr-sm'
                                : 'bg-muted text-foreground rounded-tr-sm'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                          </div>
                          <div className="flex items-center gap-2 mt-1 px-1">
                            <span className="text-xs text-muted-foreground">
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isAssistant && msg.response_time_ms && (
                              <span className="text-xs text-muted-foreground">
                                • {msg.response_time_ms}ms
                              </span>
                            )}
                          </div>
                        </div>
                        {!isUser && (
                          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                            isAdmin 
                              ? 'bg-accent text-accent-foreground' 
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {isAdmin ? 'A' : <Bot className="w-4 h-4" />}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Input Area - Always Visible */}
              {selectedConversation.status === 'active' && (
                <div className="px-6 py-4 border-t bg-background">
                  <div className="flex items-end gap-2">
                    <div className="flex-1 relative">
                      <Textarea
                        placeholder={
                          selectedConversation.manual_reply_active
                            ? "Type your reply as admin..."
                            : "Auto mode - Chatbot will respond automatically"
                        }
                        value={manualReplyMessage}
                        onChange={(e) => setManualReplyMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey && selectedConversation.manual_reply_active) {
                            e.preventDefault();
                            handleSendManualReply();
                          }
                        }}
                        disabled={!selectedConversation.manual_reply_active}
                        rows={2}
                        className="resize-none pr-12"
                      />
                      {selectedConversation.manual_reply_active && (
                        <div className="absolute right-2 bottom-2 text-xs text-muted-foreground">
                          Press Enter to send
                        </div>
                      )}
                    </div>
                    <Button
                      onClick={handleSendManualReply}
                      disabled={!selectedConversation.manual_reply_active || !manualReplyMessage.trim() || isManualReplyLoading}
                      size="icon"
                      className="h-10 w-10"
                    >
                      {isManualReplyLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  {!selectedConversation.manual_reply_active && (
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      Switch to Manual Mode to reply as admin
                    </p>
                  )}
                </div>
              )}

              {/* Footer Info */}
              {selectedConversation.status === 'completed' && (
                <div className="px-6 py-3 border-t bg-muted/30 text-center text-sm text-muted-foreground">
                  This conversation has been completed
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChatbotSessions;

