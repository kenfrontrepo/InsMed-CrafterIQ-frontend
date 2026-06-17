import { API_BASE_URL } from "@/lib/constants";
import { api } from "./axios";

export async function streamChat(
  userId: string,
  question: string,
  context: string,
  conversation_id: string | null,
  is_report = false
): Promise<Response> {
  const res = await fetch(
    `${API_BASE_URL}/crafteriq/askcrafter/stream/${userId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify({
        question,
        schema: context || "sales",
        datasetid: "",
        conversation_id: conversation_id || "",
        is_report,
      }),
    }
  );
  if (!res.ok) {
    throw new Error(`Failed to connect to API (${res.status})`);
  }
  return res;
}

export async function fetchChatHistory(userId: string) {
  const res = await api.get(`/crafteriq/chathistory/${userId}`);
  return res.data;
}

export async function fetchConversationDetail(
  conversationId: string,
  userId: string
) {
  const res = await api.get(
    `/crafteriq/conversation-detail/${conversationId}/${userId}`
  );
  return res.data;
}

export async function deleteChatConversation(
  conversationId: string,
  userId: string
) {
  const res = await api.delete(
    `/crafteriq/deleteconversation/${conversationId}/${userId}`
  );
  return res.data;
}

export async function updateChatTitle(
  conversationId: string,
  userId: string,
  title: string
) {
  const res = await api.put(
    `/crafteriq/updatechatname/${conversationId}/${userId}`,
    { title }
  );
  return res.data;
}
