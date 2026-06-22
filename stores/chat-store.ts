import { create } from "zustand";
import { fetchConversationDetail } from "@/lib/api/chatApi";

export type ChatContext = "sales" | "opportunities";

export interface VisualSpec {
  chart_type: string;
  title: string;
  x: (string | number)[]; // Can be categories (strings) or values (numbers)
  y?: (string | number)[]; // Can be values (numbers) or categories (strings for horizontal bar)
  series?: { name: string; data: number[] }[]; // Series format (multi-series)
  x_label: string;
  y_label: string;
  is_visual: boolean;
  // Pie/donut alternative format
  labels?: string[];
  values?: number[];
  center_label?: string;
  center_value?: number;
  // Table-specific fields
  columns?: string[];
  data?: Record<string, unknown>[];
  sortable?: boolean;
  // KPI card fields — API may return `metric` (single object) or `metrics` (array)
  metric?: {
    label: string;
    value: number;
    delta: number | null;
    delta_type: "increase" | "decrease" | null;
    display_value: string;
  } | {
    label: string;
    value: number;
    delta: number | null;
    delta_type: "increase" | "decrease" | null;
    display_value: string;
  }[];
  metrics?: {
    label: string;
    value: number;
    delta: number | null;
    delta_type: "increase" | "decrease" | null;
    display_value: string;
  }[];
}

export function shouldAttachVisualSpec(spec?: VisualSpec): boolean {
  if (!spec) return false;
  if ((spec as unknown as { type?: string }).type === "report") return true;
  return spec.is_visual !== false && Boolean(spec.chart_type);
}

export interface StreamingEvent {
  event: string;
  message: string;
  phase: string;
  progress: number;
  sql_query?: string;
  result?: {
    sysoutput: string;
    conversation_id: string;
    message_id?: string;
    follow_up_questions: string[];
    visual_spec: VisualSpec;
  };
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  context?: ChatContext;
  visualSpec?: VisualSpec;
  followUpQuestions?: string[];
  conversationId?: string;
  /** Server-side message ID returned by the API (used for pinning, etc.) */
  serverMessageId?: string;
  isStreaming?: boolean;
  streamingPhase?: string;
  streamingMessage?: string;
  streamingProgress?: number;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  context: ChatContext;
  conversationId?: string;
}

interface ChatState {
  // State
  chats: Chat[];
  activeChat: Chat | null;
  isLoading: boolean;
  isLoadingHistory: boolean;
  sidebarOpen: boolean;
  selectedContext: ChatContext;
  followUpQuestions: string[];

  // Actions
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  createNewChat: () => void;
  setActiveChat: (chatId: string) => void;
  /** Load a conversation from history — fetches messages from API and populates the chat */
  loadConversationFromHistory: (conversationId: string, title: string, userId: string) => Promise<void>;
  addMessage: (message: Omit<Message, "id" | "timestamp">) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  setLoading: (loading: boolean) => void;
  clearActiveChat: () => void;
  setSelectedContext: (context: ChatContext) => void;
  setFollowUpQuestions: (questions: string[]) => void;
  addStreamingMessage: () => string;
  updateStreamingMessage: (messageId: string, event: StreamingEvent) => void;
  finalizeStreamingMessage: (
    messageId: string,
    result: StreamingEvent["result"]
  ) => void;
}

// Generate unique ID
const generateId = () => crypto.randomUUID();

export const useChatStore = create<ChatState>((set, get) => ({
  // Initial state
  chats: [],
  activeChat: null,
  isLoading: false,
  isLoadingHistory: false,
  sidebarOpen: false,
  selectedContext: "sales",
  followUpQuestions: [],

  // Actions using functional setState (best practice 5.9)
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setSelectedContext: (context) => set({ selectedContext: context }),

  setFollowUpQuestions: (questions) => set({ followUpQuestions: questions }),

  createNewChat: () => {
    const { selectedContext } = get();
    const newChat: Chat = {
      id: generateId(),
      title: "New Chat",
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      context: selectedContext,
    };

    set((state) => ({
      chats: [newChat, ...state.chats],
      activeChat: newChat,
      followUpQuestions: [],
    }));
  },

  setActiveChat: (chatId) => {
    const { chats } = get();
    const chat = chats.find((c) => c.id === chatId);
    if (chat) {
      set({ activeChat: chat, followUpQuestions: [] });
    }
  },

  loadConversationFromHistory: async (conversationId, title, userId) => {
    const { chats } = get();

    // If already loaded with messages, just switch to it
    const existing = chats.find(
      (c) => c.conversationId === conversationId && c.messages.length > 0
    );
    if (existing) {
      set({ activeChat: existing, followUpQuestions: [] });
      return;
    }

    // Set loading and create a placeholder active chat
    set({ isLoading: true });

    try {
      const data = await fetchConversationDetail(conversationId, userId);

      if (!data.status) {
        throw new Error("Failed to load conversation");
      }

      const messages: Message[] = (data.messages ?? []).map((m) => ({
        id: m.id,
        role: m.role as "user" | "assistant",
        content: m.content,
        timestamp: new Date(m.timestamp),
        context: "sales",
        visualSpec:
          m.visual_spec &&
          shouldAttachVisualSpec(m.visual_spec as unknown as VisualSpec)
            ? (m.visual_spec as unknown as VisualSpec)
            : undefined,
        followUpQuestions: m.follow_up_questions,
        conversationId,
        serverMessageId: m.role === "assistant" ? m.id : undefined,
      }));

      const firstTimestamp = messages[0]?.timestamp ?? new Date();
      const lastTimestamp =
        messages[messages.length - 1]?.timestamp ?? firstTimestamp;

      // Find last assistant message's follow-up questions
      const lastAssistant = [...messages]
        .reverse()
        .find((m) => m.role === "assistant");
      const followUps = lastAssistant?.followUpQuestions ?? [];

      const loadedChat: Chat = {
        id: generateId(),
        title,
        messages,
        createdAt: firstTimestamp,
        updatedAt: lastTimestamp,
        context: "sales",
        conversationId,
      };

      set((state) => {
        // Remove any existing shell for this conversation
        const filtered = state.chats.filter(
          (c) => c.conversationId !== conversationId
        );
        return {
          chats: [loadedChat, ...filtered],
          activeChat: loadedChat,
          followUpQuestions: followUps,
          isLoading: false,
        };
      });
    } catch (error) {
      console.error("Failed to load conversation:", error);
      set({ isLoading: false });
    }
  },

  addMessage: (message) => {
    const { selectedContext } = get();
    const newMessage: Message = {
      ...message,
      id: generateId(),
      timestamp: new Date(),
      context: selectedContext,
    };

    set((state) => {
      if (!state.activeChat) {
        // Create new chat if none active
        const newChat: Chat = {
          id: generateId(),
          title: message.content.slice(0, 50) || "New Chat",
          messages: [newMessage],
          createdAt: new Date(),
          updatedAt: new Date(),
          context: selectedContext,
        };
        return {
          chats: [newChat, ...state.chats],
          activeChat: newChat,
        };
      }

      // Update existing chat
      const updatedChat: Chat = {
        ...state.activeChat,
        messages: [...state.activeChat.messages, newMessage],
        updatedAt: new Date(),
        // Update title from first user message
        title:
          state.activeChat.messages.length === 0 && message.role === "user"
            ? message.content.slice(0, 50)
            : state.activeChat.title,
      };

      return {
        activeChat: updatedChat,
        chats: state.chats.map((c) =>
          c.id === updatedChat.id ? updatedChat : c
        ),
      };
    });

    return newMessage.id;
  },

  updateMessage: (messageId, updates) => {
    set((state) => {
      if (!state.activeChat) return state;

      const updatedMessages = state.activeChat.messages.map((msg) =>
        msg.id === messageId ? { ...msg, ...updates } : msg
      );

      const updatedChat: Chat = {
        ...state.activeChat,
        messages: updatedMessages,
        updatedAt: new Date(),
      };

      return {
        activeChat: updatedChat,
        chats: state.chats.map((c) =>
          c.id === updatedChat.id ? updatedChat : c
        ),
      };
    });
  },

  addStreamingMessage: () => {
    const { selectedContext } = get();
    const messageId = generateId();
    const newMessage: Message = {
      id: messageId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      context: selectedContext,
      isStreaming: true,
      streamingPhase: "understanding",
      streamingMessage: "Understanding your question...",
      streamingProgress: 0,
    };

    set((state) => {
      if (!state.activeChat) return state;

      const updatedChat: Chat = {
        ...state.activeChat,
        messages: [...state.activeChat.messages, newMessage],
        updatedAt: new Date(),
      };

      return {
        activeChat: updatedChat,
        chats: state.chats.map((c) =>
          c.id === updatedChat.id ? updatedChat : c
        ),
      };
    });

    return messageId;
  },

  updateStreamingMessage: (messageId, event) => {
    set((state) => {
      if (!state.activeChat) return state;

      const updatedMessages = state.activeChat.messages.map((msg) =>
        msg.id === messageId
          ? {
              ...msg,
              streamingPhase: event.phase,
              streamingMessage: event.message,
              streamingProgress: event.progress,
            }
          : msg
      );

      const updatedChat: Chat = {
        ...state.activeChat,
        messages: updatedMessages,
      };

      return {
        activeChat: updatedChat,
        chats: state.chats.map((c) =>
          c.id === updatedChat.id ? updatedChat : c
        ),
      };
    });
  },

  finalizeStreamingMessage: (messageId, result) => {
    if (!result) return;

    set((state) => {
      if (!state.activeChat) return state;

      const updatedMessages = state.activeChat.messages.map((msg) =>
        msg.id === messageId
          ? {
              ...msg,
              content: result.sysoutput,
              visualSpec: shouldAttachVisualSpec(result.visual_spec)
                ? result.visual_spec
                : undefined,
              followUpQuestions: result.follow_up_questions,
              conversationId: result.conversation_id,
              serverMessageId: result.message_id,
              isStreaming: false,
              streamingPhase: undefined,
              streamingMessage: undefined,
              streamingProgress: undefined,
            }
          : msg
      );

      const updatedChat: Chat = {
        ...state.activeChat,
        messages: updatedMessages,
        conversationId: result.conversation_id,
      };

      return {
        activeChat: updatedChat,
        chats: state.chats.map((c) =>
          c.id === updatedChat.id ? updatedChat : c
        ),
        followUpQuestions: result.follow_up_questions || [],
      };
    });
  },

  setLoading: (loading) => set({ isLoading: loading }),

  clearActiveChat: () => set({ activeChat: null, followUpQuestions: [] }),
}));
