import { API_BASE_URL } from "@/lib/constants";
import { api } from "./axios";

export interface InsmedConversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface InsmedChatHistoryResponse {
  status: boolean;
  conversations: InsmedConversation[];
  total: number;
  has_more: boolean;
}

export interface InsmedConversationMessage {
  id: string;
  role: string;
  content: string;
  timestamp: string;
  visual_spec?: Record<string, unknown>;
  follow_up_questions?: string[];
}

export interface InsmedConversationDetailResponse {
  id: string;
  title: string;
  created_at: string;
  updated_at?: string;
  messages?: InsmedConversationMessage[];
}

function userHeaders(userId: string) {
  return { "X-User-ID": userId };
}

export async function streamChat(
  userId: string,
  question: string,
  conversationId: string | null
): Promise<Response> {
  const res = await fetch(`${API_BASE_URL}/insmed/ask-stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      ...userHeaders(userId),
    },
    body: JSON.stringify({
      question,
      user_id: userId,
      conversation_id: conversationId || null,
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to connect to API (${res.status})`);
  }

  return res;
}

export async function fetchChatHistory(
  userId: string,
  limit = 50,
  offset = 0
): Promise<InsmedChatHistoryResponse> {
  const res = await api.get<InsmedChatHistoryResponse>("/insmed/chat-history", {
    headers: userHeaders(userId),
    params: { limit, offset },
  });
  return res.data;
}

export async function fetchConversationDetail(
  conversationId: string,
  userId: string
): Promise<InsmedConversationDetailResponse> {
  const res = await api.get<InsmedConversationDetailResponse>(
    `/insmed/chat-history/${conversationId}`,
    { headers: userHeaders(userId) }
  );
  return res.data;
}

export async function deleteChatConversation(
  conversationId: string,
  userId: string
) {
  const res = await api.delete(`/insmed/chat-history/${conversationId}`, {
    headers: userHeaders(userId),
  });
  return res.data;
}

export async function updateChatTitle(
  conversationId: string,
  userId: string,
  title: string
) {
  const res = await api.put(
    `/insmed/chat-history/${conversationId}/rename`,
    { title },
    { headers: userHeaders(userId) }
  );
  return res.data;
}

export async function regenerateChatTitle(
  conversationId: string,
  userId: string
) {
  const res = await api.post(
    `/insmed/chat-history/${conversationId}/regenerate-title`,
    null,
    { headers: userHeaders(userId) }
  );
  return res.data;
}

export async function checkApiHealth() {
  const res = await api.get("/health");
  return res.data;
}
