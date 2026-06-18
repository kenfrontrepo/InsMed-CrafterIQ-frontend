"use client";

import { memo, useState, useRef } from "react";
// import { memo, useState, useCallback, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Eye, EyeOff, FileText, ArrowRight } from "lucide-react";
// import { Pin, PinOff, Eye, EyeOff, FileText, ArrowRight } from "lucide-react";
// import { useQueryClient } from "@tanstack/react-query";
// import { toast } from "sonner";
import type { Message } from "@/stores/chat-store";
import dynamic from "next/dynamic";
import { markdownComponents } from "./markdown-components";
// import { useUserId } from "@/hooks/use-user-id";
// import { createPin, deletePin as apiDeletePin } from "@/lib/api/pinsApi";
// import { getApiErrorMessage } from "@/lib/api/axios";

// Dynamically import chart component to reduce initial bundle
const ChatChart = dynamic(() => import("./chat-chart").then((m) => m.ChatChart), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] bg-hover rounded-xl animate-pulse" />
  ),
});

interface ChatMessageProps {
  message: Message;
}



// Loading shimmer component
function StreamingLoader({
  phase,
  message,
  progress,
}: {
  phase: string;
  message: string;
  progress: number;
}) {
  

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-3 p-4 bg-surface rounded-[14px] border border-border-subtle"
    >
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-text-primary">
          {message}
        </span>
      </div>
      <div className="h-1.5 bg-border-mid rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-text-primary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-border-mid rounded animate-pulse w-3/4" />
        <div className="h-4 bg-border-mid rounded animate-pulse w-1/2" />
        <div className="h-4 bg-border-mid rounded animate-pulse w-5/6" />
      </div>
    </motion.div>
  );
}

// Memoized ChatMessage component
export const ChatMessage = memo(function ChatMessage({
  message,
}: ChatMessageProps) {
  const isUser = message.role === "user";
  const [chartVisible, setChartVisible] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  const hasChart = message.visualSpec && message.visualSpec && Object.keys(message.visualSpec).length > 0;

  /* Pin / Unpin — hidden until pins API is available in Insmed
  const queryClient = useQueryClient();
  const { userId } = useUserId();
  const [pinId, setPinId] = useState<string | null>(null);
  const [isPinning, setIsPinning] = useState(false);

  const handlePin = useCallback(async () => {
    if (!message.visualSpec || isPinning) return;
    setIsPinning(true);
    try {
      const data = await createPin(
        userId ?? "",
        message.serverMessageId || message.id,
        message.conversationId || "",
        message.visualSpec.title || ""
      );
      if (data?.status === false) {
        toast.error(data.error || "Failed to pin");
        return;
      }
      setPinId(data.pin?.id ?? null);
      queryClient.invalidateQueries({ queryKey: ["all-pins", userId] });
      toast.success(data?.message || "Pinned successfully");
    } catch (err) {
      console.error("Pin failed:", err);
      toast.error(getApiErrorMessage(err, "Failed to pin"));
    } finally {
      setIsPinning(false);
    }
  }, [message.id, message.serverMessageId, message.conversationId, message.visualSpec, isPinning, queryClient, userId]);

  const handleUnpin = useCallback(async () => {
    if (!pinId || isPinning) return;
    setIsPinning(true);
    try {
      await apiDeletePin(pinId, userId ?? "");
      setPinId(null);
      queryClient.invalidateQueries({ queryKey: ["all-pins", userId] });
      toast.success("Unpinned successfully");
    } catch (err) {
      console.error("Unpin failed:", err);
      toast.error(getApiErrorMessage(err, "Failed to unpin"));
    } finally {
      setIsPinning(false);
    }
  }, [pinId, isPinning, queryClient, userId]);
  */

  // Show streaming loader if message is streaming
  if (message.isStreaming) {
    return (
      <div className="flex justify-start">
        <div className="max-w-[85%] w-full">
          <StreamingLoader
            phase={message.streamingPhase || "understanding"}
            message={message.streamingMessage || "Processing..."}
            progress={message.streamingProgress || 0}
          />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={` ${
          isUser
            ? "bg-accent text-black px-4 py-3 rounded-2xl max-w-[95%]"
            : "space-y-4 w-full"
        }`}
      >
        {isUser ? (
          <p className="text-black font-medium">{message.content}</p>
        ) : (
          <>
            <div className="prose prose-sm max-w-none prose-headings:text-text-primary prose-p:text-text-secondary prose-strong:text-text-primary prose-table:text-sm">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {message.content}
              </ReactMarkdown>
            </div>

            {/* Report link */}
            {message.visualSpec &&
              (message.visualSpec as unknown as { type?: string; report_id?: string }).type === "report" &&
              (message.visualSpec as unknown as { report_id?: string }).report_id && (
                <Link
                  href={`/report?id=${(message.visualSpec as unknown as { report_id: string }).report_id}`}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-text-primary text-white text-sm font-medium rounded-lg hover:bg-[#333330] transition-colors mt-1"
                >
                  <FileText className="h-4 w-4" />
                  View Brief
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Link>
              )}

            {/* Chart action bar + collapsible chart */}
            {hasChart && message.visualSpec && (message.visualSpec as unknown as { type?: string }).type !== "report" && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setChartVisible((v) => !v)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-text-primary font-medium rounded-lg border border-border-mid bg-card hover:bg-hover transition-colors"
                  >
                    {chartVisible ? (
                      <EyeOff className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                    {chartVisible ? "Visualize" : "Visualize"}
                  </button>
                </div>

                <AnimatePresence>
                  {chartVisible && (
                    <motion.div
                      ref={chartRef}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="overflow-hidden"
                      onAnimationComplete={() => {
                        if (chartVisible) {
                          chartRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
                        }
                      }}
                    >
                      <div className="relative group/chart">
                        <ChatChart visualSpec={message.visualSpec!} />
                        {/* Pin / Unpin button — hidden until pins API is available in Insmed
                        <button
                          type="button"
                          onClick={pinId ? handleUnpin : handlePin}
                          disabled={isPinning}
                          className={`absolute top-2 right-2 inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border shadow-sm transition-all disabled:opacity-50 opacity-0 group-hover/chart:opacity-100 focus:opacity-100 ${
                            pinId
                              ? "border-text-primary/30 bg-text-primary/10 text-text-primary hover:bg-text-primary/15"
                              : "border-border-mid bg-card/90 backdrop-blur-sm text-text-secondary hover:bg-card"
                          }`}
                        >
                          {pinId ? (
                            <PinOff className="h-3.5 w-3.5" />
                          ) : (
                            <Pin className="h-3.5 w-3.5" />
                          )}
                          {isPinning
                            ? "..."
                            : pinId
                              ? "Unpin"
                              : "Pin"}
                        </button>
                        */}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
});
