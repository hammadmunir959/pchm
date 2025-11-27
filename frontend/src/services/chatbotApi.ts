import { withBasePath } from "./apiConfig";
import { authFetch } from "./authFetch";

const CHATBOT_CONTEXT_URL = withBasePath("/chatbot/context/");
const CONVERSATIONS_URL = withBasePath("/chatbot/conversations/");
const CHATBOT_SETTINGS_URL = withBasePath("/chatbot/settings/");

export interface ChatbotContext {
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

export interface Conversation {
  id: number;
  session_id: string;
  user_email: string | null;
  user_name: string | null;
  user_phone: string | null;
  ip_address: string | null;
  is_lead: boolean;
  status: 'active' | 'completed' | 'manual';
  manual_reply_active: boolean;
  collected_data: Record<string, any>;
  intent_classification: string;
  confidence_score: number | null;
  started_at: string;
  ended_at: string | null;
  last_activity: string;
  messages: ConversationMessage[];
  message_count: number;
}

export interface ConversationMessage {
  id: number;
  message_type: 'user' | 'assistant' | 'admin';
  content: string;
  response_time_ms: number | null;
  timestamp: string;
  is_admin_reply: boolean;
}

export interface ChatbotSettings {
  id: number;
  api_key: string;
  model: string;
  max_tokens: number;
  temperature: number;
  is_active: boolean;
  auto_populate_context: boolean;
  updated_at: string;
  updated_by: number | null;
  updated_by_name: string | null;
}

export const chatbotApi = {
  // Context management
  async getContexts(): Promise<ChatbotContext[]> {
    const response = await authFetch(CHATBOT_CONTEXT_URL);
    if (!response.ok) {
      throw new Error("Unable to load chatbot contexts.");
    }
    return response.json();
  },

  async createContext(data: Partial<ChatbotContext>): Promise<ChatbotContext> {
    const response = await authFetch(CHATBOT_CONTEXT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Unable to create context.");
    }
    return response.json();
  },

  async updateContext(id: number, data: Partial<ChatbotContext>): Promise<ChatbotContext> {
    const response = await authFetch(`${CHATBOT_CONTEXT_URL}${id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Unable to update context.");
    }
    return response.json();
  },

  async deleteContext(id: number): Promise<void> {
    const response = await authFetch(`${CHATBOT_CONTEXT_URL}${id}/`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error("Unable to delete context.");
    }
  },

  // Conversation management
  async getConversations(params?: {
    status?: string;
    is_lead?: boolean;
    manual_reply_active?: boolean;
  }): Promise<Conversation[]> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.is_lead !== undefined) searchParams.set('is_lead', params.is_lead.toString());
    if (params?.manual_reply_active !== undefined) searchParams.set('manual_reply_active', params.manual_reply_active.toString());

    const url = `${CONVERSATIONS_URL}?${searchParams.toString()}`;
    const response = await authFetch(url);
    if (!response.ok) {
      throw new Error("Unable to load conversations.");
    }
    return response.json();
  },

  async getConversation(id: number): Promise<Conversation> {
    const response = await authFetch(`${CONVERSATIONS_URL}${id}/`);
    if (!response.ok) {
      throw new Error("Unable to load conversation.");
    }
    return response.json();
  },

  async toggleManualReply(id: number): Promise<{ message: string; manual_reply_active: boolean }> {
    const response = await authFetch(`${CONVERSATIONS_URL}${id}/toggle_manual_reply/`, {
      method: "POST",
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Unable to toggle manual reply.");
    }
    return response.json();
  },

  async sendManualReply(id: number, message: string): Promise<{ message: string }> {
    const response = await authFetch(`${CONVERSATIONS_URL}${id}/send_manual_reply/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Unable to send manual reply.");
    }
    return response.json();
  },

  // Chatbot message exchange (public endpoint)
  async sendMessage(message: string, sessionId: string): Promise<{
    message: string;
    response_time_ms: number;
    session_id: string;
    manual_reply_active: boolean;
    intent_classified: boolean;
    silent_block?: boolean;
  }> {
    const response = await fetch(withBasePath("/chatbot/message/"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, session_id: sessionId }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Unable to send message.");
    }
    return response.json();
  },

  // Get latest messages for a session (for polling) - public endpoint
  async getLatestMessages(sessionId: string, lastMessageId?: number): Promise<{
    messages: ConversationMessage[];
    manual_reply_active: boolean;
    status: string;
  }> {
    try {
      const params = new URLSearchParams({ session_id: sessionId });
      if (lastMessageId && lastMessageId > 0) {
        params.append('last_message_id', lastMessageId.toString());
      }
      
      const url = `${withBasePath("/chatbot/messages/")}?${params.toString()}`;
      const response = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      
      if (!response.ok) {
        return { messages: [], manual_reply_active: false, status: 'active' };
      }
      
      const data = await response.json();
      const messages = data.messages || [];
      
      // Messages are already filtered on backend, but ensure they're in order
      messages.sort((a: ConversationMessage, b: ConversationMessage) => a.id - b.id);
      
      return {
        messages,
        manual_reply_active: data.manual_reply_active || false,
        status: data.status || 'active'
      };
    } catch (error) {
      console.error('Error fetching latest messages:', error);
      return { messages: [], manual_reply_active: false, status: 'active' };
    }
  },

  // Settings management
  async getSettings(): Promise<ChatbotSettings> {
    const response = await authFetch(CHATBOT_SETTINGS_URL);
    if (!response.ok) {
      throw new Error("Unable to load chatbot settings.");
    }
    const data = await response.json();
    // Settings endpoint returns array with single item
    return Array.isArray(data) ? data[0] : data;
  },

  async updateSettings(data: Partial<ChatbotSettings>): Promise<ChatbotSettings> {
    const response = await authFetch(`${CHATBOT_SETTINGS_URL}1/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Unable to update settings.");
    }
    return response.json();
  },
};
