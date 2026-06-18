import { useCallback } from "react";
import {
  useChatStore,
  type StreamingEvent,
  type VisualSpec,
} from "@/stores/chat-store";
import { useUserId } from "@/hooks/use-user-id";
import { streamChat } from "@/lib/api/chatApi";

type InsmedStreamEvent = {
  event: string;
  status?: string;
  message?: string;
  phase?: string;
  progress?: number;
  conversation_id?: string | null;
  sysoutput?: string;
  follow_up_questions?: string[];
  visual_spec?: VisualSpec;
  message_id?: string;
  result?: StreamingEvent["result"];
};

const STREAM_PHASES: Record<string, { phase: string; message: string; progress: number }> = {
  workflow_start: { phase: "understanding", message: "Starting analysis…", progress: 10 },
  retrieving_memory: { phase: "understanding", message: "Loading conversation context…", progress: 20 },
  generating_query: { phase: "querying", message: "Generating query…", progress: 40 },
  query_ready: { phase: "querying", message: "Query ready", progress: 50 },
  executing_query: { phase: "executing", message: "Running query…", progress: 60 },
  data_ready: { phase: "executing", message: "Data loaded", progress: 70 },
  generating_insights: { phase: "analyzing", message: "Generating insights…", progress: 85 },
  visual_ready: { phase: "analyzing", message: "Building visualization…", progress: 90 },
  insights_ready: { phase: "analyzing", message: "Insights ready", progress: 95 },
};

function toStreamResult(
  event: InsmedStreamEvent
): NonNullable<StreamingEvent["result"]> {
  return {
    sysoutput: event.sysoutput || "",
    conversation_id: event.conversation_id || event.result?.conversation_id || "",
    message_id: event.message_id || event.result?.message_id,
    follow_up_questions:
      event.follow_up_questions || event.result?.follow_up_questions || [],
    visual_spec: event.visual_spec ||
      event.result?.visual_spec || {
        chart_type: "",
        title: "",
        x: [],
        series: [],
        x_label: "",
        y_label: "",
        is_visual: false,
      },
  };
}

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
  const activeChat = useChatStore((state) => state.activeChat);

  const sendMessage = useCallback(
    async (question: string) => {
      if (!userId) return;

      addMessage({ role: "user", content: question });

      setLoading(true);
      const messageId = addStreamingMessage();
      let latestResult: NonNullable<StreamingEvent["result"]> | null = null;

      try {
        const response = await streamChat(
          userId,
          question,
          activeChat?.conversationId || null
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

          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;

            const data = line.slice(6).trim();
            if (!data || data === "[DONE]") continue;

            try {
              const event = JSON.parse(data) as InsmedStreamEvent;

              if (event.event === "insights_ready") {
                latestResult = toStreamResult(event);
              }

              if (event.event === "workflow_complete") {
                const result = event.result
                  ? toStreamResult(event)
                  : latestResult ||
                    toStreamResult({
                      ...event,
                      sysoutput: "No response received.",
                    });
                finalizeStreamingMessage(messageId, result);
                continue;
              }

              const phase = STREAM_PHASES[event.event];
              if (phase) {
                updateStreamingMessage(messageId, {
                  event: event.event,
                  message: event.message || phase.message,
                  phase: event.phase || phase.phase,
                  progress: event.progress ?? phase.progress,
                });
              }
            } catch {
              console.warn("Invalid JSON in SSE:", data);
            }
          }
        }

        if (latestResult) {
          finalizeStreamingMessage(messageId, latestResult);
        }
      } catch (error) {
        console.error("Chat stream error:", error);
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
      activeChat?.conversationId,
      userId,
    ]
  );

  return { sendMessage };
}
