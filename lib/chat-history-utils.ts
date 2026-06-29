import type { QueryClient } from "@tanstack/react-query";
import type { InsmedConversation } from "@/lib/api/chatApi";
import type { Chat } from "@/stores/chat-store";

export function sortConversationsNewestFirst(
  conversations: InsmedConversation[]
): InsmedConversation[] {
  return [...conversations].sort(
    (a, b) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );
}

/** Map an in-memory chat (with server conversation_id) to a history list item */
export function chatToHistoryConversation(chat: Chat): InsmedConversation | null {
  if (!chat.conversationId || chat.messages.length === 0) return null;

  const firstUserMessage = chat.messages.find((m) => m.role === "user");
  const title =
    chat.title && chat.title !== "New Chat"
      ? chat.title
      : firstUserMessage?.content.slice(0, 50).trim() || "New Chat";

  return {
    id: chat.conversationId,
    title,
    created_at: chat.createdAt.toISOString(),
    updated_at: chat.updatedAt.toISOString(),
  };
}

/**
 * Merge API history with local zustand chats so completed conversations
 * appear immediately after "New chat" without waiting for a refetch.
 */
export function mergeConversationsWithLocalChats(
  apiConversations: InsmedConversation[],
  localChats: Chat[]
): InsmedConversation[] {
  const merged = new Map<string, InsmedConversation>();

  for (const conv of apiConversations) {
    merged.set(conv.id, conv);
  }

  for (const chat of localChats) {
    const localConv = chatToHistoryConversation(chat);
    if (!localConv) continue;

    const existing = merged.get(localConv.id);
    if (
      !existing ||
      new Date(localConv.updated_at).getTime() >=
        new Date(existing.updated_at).getTime()
    ) {
      merged.set(localConv.id, {
        ...localConv,
        title: existing?.title ?? localConv.title,
      });
    }
  }

  return sortConversationsNewestFirst([...merged.values()]);
}

export function upsertConversationInHistoryCache(
  queryClient: QueryClient,
  userId: string,
  conversation: InsmedConversation
) {
  queryClient.setQueryData<InsmedConversation[]>(
    ["chat-history", userId],
    (old = []) => {
      const filtered = old.filter((c) => c.id !== conversation.id);
      return sortConversationsNewestFirst([conversation, ...filtered]);
    }
  );
}
