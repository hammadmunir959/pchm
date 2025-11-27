import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { chatbotApi } from "@/services/chatbotApi";

interface Message {
  id: string;
  text: string;
  sender: "user" | "assistant" | "admin";
  timestamp: Date;
  responseTimeMs?: number;
  isAdminReply?: boolean;
}

interface ChatSession {
  sessionId: string;
  messages: Message[];
  lastActivity: Date;
  isManualReplyActive: boolean;
}

const AIChatWidget = () => {
  // Session management
  const [sessionId, setSessionId] = useState<string>(() => {
    return localStorage.getItem('chatbot_session_id') ||
           `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  });

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isManualReplyActive, setIsManualReplyActive] = useState(false);
  const [lastMessageId, setLastMessageId] = useState<number>(0);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatWindowRef = useRef<HTMLDivElement>(null);
  const chatButtonRef = useRef<HTMLButtonElement>(null);

  // Load saved session on mount
  useEffect(() => {
    const savedSession = localStorage.getItem('chatbot_session');
    if (savedSession) {
      try {
        const session: ChatSession = JSON.parse(savedSession);
        setSessionId(session.sessionId);
        const loadedMessages = session.messages.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(loadedMessages);
        setIsManualReplyActive(session.isManualReplyActive);

        // Initialize lastMessageId from loaded messages
        if (loadedMessages.length > 0) {
          // Try to extract numeric ID from message IDs (format: "admin-123" or just "123")
          const ids = loadedMessages.map(m => {
            const parts = m.id.split('-');
            return parseInt(parts[parts.length - 1]) || 0;
          });
          if (ids.length > 0) {
            setLastMessageId(Math.max(...ids));
          }
        }

        // Check if session is still valid (within 24 hours)
        const sessionAge = Date.now() - new Date(session.lastActivity).getTime();
        if (sessionAge > 24 * 60 * 60 * 1000) { // 24 hours
          resetSession();
        }
      } catch (error) {
        console.error('Failed to load saved session:', error);
        resetSession();
      }
    } else {
      // Initialize with welcome message
      setMessages([{
        id: "welcome",
        text: "Hi! I'm your AI assistant for Prestige Car Hire Management. I can help answer questions about our services, fleet, claims process, and more. How can I help you today?",
        sender: "assistant",
        timestamp: new Date(),
      }]);
    }
  }, []);

  // Save session to localStorage whenever it changes
  useEffect(() => {
    if (messages.length > 0) {
      const session: ChatSession = {
        sessionId,
        messages,
        lastActivity: new Date(),
        isManualReplyActive,
      };
      localStorage.setItem('chatbot_session', JSON.stringify(session));
      localStorage.setItem('chatbot_session_id', sessionId);
    }
  }, [sessionId, messages, isManualReplyActive]);

  // Scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Sync messages from server when chat opens or manual reply becomes active
  useEffect(() => {
    if (!sessionId || (!isOpen && !isManualReplyActive)) {
      return;
    }
    
    // Initial sync to get any missed messages
    const syncMessages = async () => {
      try {
        const result = await chatbotApi.getLatestMessages(sessionId, lastMessageId);
        
        // Update manual reply status
        if (result.manual_reply_active !== isManualReplyActive) {
          setIsManualReplyActive(result.manual_reply_active);
        }
        
        if (result.messages && result.messages.length > 0) {
          // Get existing message IDs from current state
          setMessages((prev) => {
            const existingMessageIds = new Set(prev.map(m => {
              // Extract numeric ID from message ID (format: "admin-123" or "assistant-123" or just "123")
              const parts = m.id.split('-');
              return parseInt(parts[parts.length - 1]) || 0;
            }));
            
            const newMessages = result.messages.filter(msg => !existingMessageIds.has(msg.id));
            
            if (newMessages.length > 0) {
              const formattedMessages: Message[] = newMessages.map(msg => {
                const sender = msg.message_type === 'admin' || msg.is_admin_reply ? 'admin' : 
                             msg.message_type === 'user' ? 'user' : 'assistant';
                return {
                  id: `${sender}-${msg.id}`,
                  text: msg.content,
                  sender: sender as "user" | "assistant" | "admin",
                  timestamp: new Date(msg.timestamp),
                  isAdminReply: msg.is_admin_reply || false,
                  responseTimeMs: msg.response_time_ms || undefined,
                };
              });
              
              // Update last message ID
              const maxId = Math.max(...newMessages.map(m => m.id));
              if (maxId > lastMessageId) {
                setLastMessageId(maxId);
              }
              
              return [...prev, ...formattedMessages];
            }
            
            return prev;
          });
        }
      } catch (error) {
        console.error('Error syncing messages:', error);
      }
    };
    
    // Sync immediately when conditions change
    syncMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isManualReplyActive, sessionId]); // Only sync when these change, not on every render

  // Poll for new admin messages when manual reply is active OR when chat is open
  useEffect(() => {
    if (sessionId && (isManualReplyActive || isOpen)) {
      // Poll every 2 seconds for new messages (especially admin messages)
      pollingIntervalRef.current = setInterval(async () => {
        try {
          const result = await chatbotApi.getLatestMessages(sessionId, lastMessageId);
          
          // Update manual reply status
          if (result.manual_reply_active !== isManualReplyActive) {
            setIsManualReplyActive(result.manual_reply_active);
          }
          
          if (result.messages && result.messages.length > 0) {
            // Get all new messages (not just admin messages, but filter admin ones for adding)
            const newMessages = result.messages.filter(msg => msg.id > lastMessageId);
            
            if (newMessages.length > 0) {
              // Filter for admin messages only
              const adminMessages = newMessages.filter(msg => 
                msg.message_type === 'admin' || msg.is_admin_reply === true
              );
              
              // Also get any assistant messages that are new
              const assistantMessages = newMessages.filter(msg => 
                msg.message_type === 'assistant' && !msg.is_admin_reply
              );
              
              // Add admin messages
              if (adminMessages.length > 0) {
                const formattedAdminMessages: Message[] = adminMessages.map(msg => ({
                  id: `admin-${msg.id}`,
                  text: msg.content,
                  sender: "admin",
                  timestamp: new Date(msg.timestamp),
                  isAdminReply: true,
                }));
                setMessages((prev) => [...prev, ...formattedAdminMessages]);
              }
              
              // Add assistant messages
              if (assistantMessages.length > 0) {
                const formattedAssistantMessages: Message[] = assistantMessages.map(msg => ({
                  id: `assistant-${msg.id}`,
                  text: msg.content,
                  sender: "assistant",
                  timestamp: new Date(msg.timestamp),
                  responseTimeMs: msg.response_time_ms,
                }));
                setMessages((prev) => [...prev, ...formattedAssistantMessages]);
              }
              
              // Update last message ID to the highest ID we've seen
              const maxId = Math.max(...newMessages.map(m => m.id));
              if (maxId > lastMessageId) {
                setLastMessageId(maxId);
              }
            }
          }
        } catch (error) {
          console.error('Error polling for messages:', error);
        }
      }, 2000); // Poll every 2 seconds
    } else {
      // Clear polling when chat is closed and manual reply is not active
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [isOpen, sessionId, lastMessageId, isManualReplyActive]);

  const resetSession = () => {
    if (!confirm("Are you sure you want to start a new conversation? This will clear your current chat history.")) {
      return;
    }
    
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setSessionId(newSessionId);
    setMessages([{
      id: "welcome",
      text: "Hi! I'm your AI assistant for Prestige Car Hire Management. I can help answer questions about our services, fleet, claims process, and more. How can I help you today?",
      sender: "assistant",
      timestamp: new Date(),
    }]);
    setIsManualReplyActive(false);
    setError(null);
    setIsTyping(false);
    setIsLoading(false);
    setInputValue("");
    localStorage.removeItem('chatbot_session');
    localStorage.setItem('chatbot_session_id', newSessionId);
  };

  // Close chat when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!isOpen) return;

      const target = event.target as Node;
      
      // Don't close if clicking inside the chat window
      if (chatWindowRef.current?.contains(target)) {
        return;
      }

      // Don't close if clicking on the chat button
      if (chatButtonRef.current?.contains(target)) {
        return;
      }

      // Close the chat when clicking outside
      setIsOpen(false);
    };

    if (isOpen) {
      // Add event listener with a slight delay to avoid immediate closing
      setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 100);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Generate AI response using agentic chatbot API
  const generateAIResponse = async (userMessage: string): Promise<{ message: string; responseTimeMs: number; isManualReplyActive: boolean; silentBlock?: boolean }> => {
    try {
      setError(null);
      const response = await chatbotApi.sendMessage(userMessage, sessionId);

      // Update manual reply status
      setIsManualReplyActive(response.manual_reply_active);

      return {
        message: response.message,
        responseTimeMs: response.response_time_ms,
        isManualReplyActive: response.manual_reply_active,
        silentBlock: response.silent_block,
      };
    } catch (error: any) {
      console.error('Chatbot API error:', error);
      setError('Failed to get response from AI assistant');

      // Fallback response
      return {
        message: "I apologize, but I'm having trouble connecting right now. Please try again in a moment, or contact our support team directly at info@prestigecarhire.co.uk.",
        responseTimeMs: 0,
        isManualReplyActive: false,
      };
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue.trim(),
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);
    setIsLoading(true);
    setError(null);

    try {
      const response = await generateAIResponse(userMessage.text);

      // Update manual reply status
      setIsManualReplyActive(response.isManualReplyActive);

      // If silent block, don't add any assistant message - just wait for admin reply
      if (response.silentBlock) {
        // Silently blocked - no message added, polling will pick up admin replies
        setIsTyping(false);
        setIsLoading(false);
        return;
      }

      // Only add assistant message if there's actual content
      if (response.message && response.message.trim()) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: response.message,
          sender: "assistant",
          timestamp: new Date(),
          responseTimeMs: response.responseTimeMs,
        };

        setMessages((prev) => [...prev, assistantMessage]);
      }

    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I apologize, but I'm having trouble processing your request right now. Please try again or contact our support team for assistance.",
        sender: "assistant",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Chat Icon */}
      <button
        ref={chatButtonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-20 right-8 z-50 w-14 h-14 rounded-full bg-accent text-accent-foreground shadow-lg hover:bg-accent/90 transition-all duration-300 flex items-center justify-center"
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        {isManualReplyActive ? (
          <span className="text-lg font-bold">A</span>
        ) : (
          <MessageCircle className="w-6 h-6" />
        )}
        {/* Notification dot */}
        <span className="absolute top-0 right-0 w-3 h-3 bg-blue-500 rounded-full border-2 border-accent"></span>
      </button>

      {/* Chat Window */}
      <div
        ref={chatWindowRef}
        className={`fixed bottom-32 right-8 z-50 w-[calc(100%-4rem)] sm:w-full max-w-sm h-[400px] max-h-[calc(100vh-14rem)] bg-card border border-border rounded-lg shadow-2xl flex flex-col transition-all duration-300 ${
          isOpen
            ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
            : "opacity-0 scale-95 translate-y-4 pointer-events-none"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-primary text-primary-foreground px-4 py-3 rounded-t-lg flex items-center justify-between border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
              {isManualReplyActive ? (
                <span className="text-sm font-bold">A</span>
              ) : (
                <Bot className="w-5 h-5 text-accent" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-sm">
                {isManualReplyActive ? 'Human Representative' : 'AI Assistant'}
              </h3>
              <p className="text-xs text-muted-foreground">Online</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={resetSession}
              className="px-2 py-1 text-xs rounded-md hover:bg-primary/20 transition-colors flex items-center gap-1 border border-primary/30"
              aria-label="Restart conversation"
              title="Start a new conversation"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Restart</span>
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-md hover:bg-primary/20 transition-colors flex items-center justify-center"
              aria-label="Close chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="px-4 py-2 bg-red-100 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
          {messages.map((message) => {
            const isAdmin = message.sender === "admin" || message.isAdminReply;
            const isAssistant = message.sender === "assistant" && !isAdmin;
            
            return (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {(isAssistant || isAdmin) && (
                  <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                    {isAdmin ? (
                      <span className="text-xs font-bold">A</span>
                    ) : (
                      <Bot className="w-4 h-4 text-accent" />
                    )}
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.sender === "user"
                      ? "bg-accent text-accent-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {message.text}
                  </p>
                </div>
                {message.sender === "user" && (
                  <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-4 h-4 text-accent" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-accent" />
              </div>
              <div className="bg-muted text-muted-foreground rounded-lg px-4 py-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-current rounded-full animate-bounce"></span>
                  <span
                    className="w-2 h-2 bg-current rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></span>
                  <span
                    className="w-2 h-2 bg-current rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-border p-4 bg-background rounded-b-lg">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about Prestige Car Hire..."
              disabled={isTyping || isLoading}
              className="flex-1"
            />
            <Button
              onClick={handleSend}
              disabled={!inputValue.trim() || isTyping || isLoading}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Press Enter to send • {isManualReplyActive ? "Human Representative" : "Powered by AI"}
          </p>
        </div>
      </div>
    </>
  );
};

export default AIChatWidget;


