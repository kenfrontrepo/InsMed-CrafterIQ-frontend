import { useCallback } from "react";
import { useChatStore, type StreamingEvent } from "@/stores/chat-store";
import { useUserId } from "@/hooks/use-user-id";
import { streamChat } from "@/lib/api/chatApi";

export function useChatStream() {
  const { userId } = useUserId();
  const addMessage = useChatStore((state) => state.addMessage);
  const addStreamingMessage = useChatStore((state) => state.addStreamingMessage);
  const updateStreamingMessage = useChatStore(
    (state) => state.updateStreamingMessage
  );
  const finalizeStreamingMessage = useChatStore(
    (state) => state.finalizeStreamingMessage
  );
  const setLoading = useChatStore((state) => state.setLoading);
  const selectedContext = useChatStore((state) => state.selectedContext);
  const activeChat = useChatStore((state) => state.activeChat);

  const sendMessage = useCallback(
    async (question: string, options?: { is_report?: boolean }) => {
      const isReport = options?.is_report ?? false;

      addMessage({ role: "user", content: question });

      setLoading(true);
      const messageId = addStreamingMessage();

      try {
        const response = await streamChat(
          userId!,
          question,
          selectedContext,
          activeChat?.conversationId || null,
          isReport
        );

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("No response body");
        }

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Process complete SSE events
          const lines = buffer.split("\n");
          buffer = lines.pop() || ""; // Keep incomplete line in buffer

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6).trim();

              if (data === "[DONE]") {
                setLoading(false);
                return;
              }

              try {
                const event: StreamingEvent = JSON.parse(data);

                if (event.event === "workflow_complete" && event.result) {
                  finalizeStreamingMessage(messageId, event.result);
                } else {
                  updateStreamingMessage(messageId, event);
                }
              } catch {
                console.warn("Invalid JSON in SSE:", data);
              }
            }
          }
        }
      } catch (error) {
        console.error("Chat stream error:", error);
        // Update message with error
        finalizeStreamingMessage(messageId, {
          sysoutput: "Sorry, something went wrong. Please try again.",
          conversation_id: "",
          follow_up_questions: [],
          visual_spec: {
            chart_type: "",
            title: "",
            x: [],
            series: [],
            x_label: "",
            y_label: "",
            is_visual: false,
          },
        });
      } finally {
        setLoading(false);
      }
    },
    [
      addMessage,
      addStreamingMessage,
      updateStreamingMessage,
      finalizeStreamingMessage,
      setLoading,
      selectedContext,
      activeChat?.conversationId,
      userId,
    ]
  );

  return { sendMessage };
}
