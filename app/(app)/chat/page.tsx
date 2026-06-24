"use client";

import { Suspense, useCallback, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useChatStore } from "@/stores/chat-store";
import { useChatStream } from "@/hooks/use-chat-stream";
import { ChatWelcome } from "@/components/chat/chat-welcome";
import { ChatInput, type ChatInputHandle } from "@/components/chat/chat-input";
import { ChatMessage } from "@/components/chat/chat-message";
import { FollowUpQuestions } from "@/components/chat/follow-up-questions";
import { ChatPinsDrawer } from "@/components/chat/chat-pins-drawer";

function HistoryLoadingSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-end">
        <div className="bg-hover rounded-2xl px-4 py-3 max-w-[60%] space-y-2">
          <div className="h-3.5 bg-border-mid rounded-full w-40 animate-pulse" />
        </div>
      </div>
      <div className="flex justify-start">
        <div className="w-full space-y-3">
          <div className="h-3.5 bg-border-mid rounded-full w-3/4 animate-pulse" />
          <div className="h-3.5 bg-border-mid rounded-full w-full animate-pulse" />
          <div className="h-3.5 bg-border-mid rounded-full w-5/6 animate-pulse" />
          <div className="h-3.5 bg-border-mid rounded-full w-2/3 animate-pulse" />
          <div className="h-[200px] bg-hover rounded-xl mt-3 animate-pulse" />
        </div>
      </div>
      <div className="flex justify-end">
        <div className="bg-hover rounded-2xl px-4 py-3 max-w-[60%] space-y-2">
          <div className="h-3.5 bg-border-mid rounded-full w-56 animate-pulse" />
        </div>
      </div>
      <div className="flex justify-start">
        <div className="w-full space-y-3">
          <div className="h-3.5 bg-border-mid rounded-full w-2/3 animate-pulse" />
          <div className="h-3.5 bg-border-mid rounded-full w-full animate-pulse" />
          <div className="h-3.5 bg-border-mid rounded-full w-4/5 animate-pulse" />
          <div className="h-[200px] bg-hover rounded-xl mt-3 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense>
      <ChatPageContent />
    </Suspense>
  );
}

function ChatPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeChat = useChatStore((state) => state.activeChat);
  const isLoading = useChatStore((state) => state.isLoading);
  const isLoadingHistory = useChatStore((state) => state.isLoadingHistory);
  const followUpQuestions = useChatStore((state) => state.followUpQuestions);
  const { sendMessage } = useChatStream();
  const chatInputRef = useRef<ChatInputHandle>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const conversationId = activeChat?.conversationId;
    const currentUrlConversationId = searchParams.get("conversation_id");

    if (conversationId && conversationId !== currentUrlConversationId) {
      router.replace(`/chat?conversation_id=${conversationId}`, {
        scroll: false,
      });
    } else if (!conversationId && currentUrlConversationId) {
      router.replace("/chat", { scroll: false });
    }
  }, [activeChat?.conversationId, router, searchParams]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChat?.messages]);

  const handleSendMessage = useCallback(
    (content: string, options?: { is_brief?: boolean }) => {
      sendMessage(content, options);
    },
    [sendMessage]
  );

  const handleSuggestionSelect = useCallback(
    (query: string) => {
      chatInputRef.current?.setValue(query);
    },
    []
  );

  const handleFollowUpSelect = useCallback((question: string) => {
    chatInputRef.current?.setValue(question);
  }, []);

  const showWelcome =
    !isLoadingHistory && (!activeChat || activeChat.messages.length === 0);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Chat area — takes all space above the pinned bar */}
      <div className="flex-1 flex flex-col min-h-0 relative">
        {showWelcome ? (
          <>
            <div className="flex-1 overflow-y-auto min-h-0">
              <ChatWelcome onSuggestionSelect={handleSuggestionSelect} />
            </div>

            {/* Floating input bar */}
            <div className="shrink-0 pb-4 pt-2 bg-linear-to-t from-page via-page to-transparent">
              <div className="max-w-3xl  mx-auto">
                <ChatInput
                  ref={chatInputRef}
                  onSubmit={handleSendMessage}
                  placeholder="Ask anything about your data…"
                  disabled={isLoading}
                />
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto py-6 min-h-0">
              <div className="max-w-3xl mx-auto px-8 space-y-6">
                {isLoadingHistory ? (
                  <HistoryLoadingSkeleton />
                ) : (
                  activeChat?.messages.map((message) => (
                    <ChatMessage key={message.id} message={message} />
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input at bottom with follow-up questions */}
            <div className="shrink-0 pb-4 w-full max-w-3xl mx-auto px-8">
              {!isLoading && (
                <FollowUpQuestions
                  questions={followUpQuestions}
                  onSelect={handleFollowUpSelect}
                />
              )}
              <ChatInput
                ref={chatInputRef}
                onSubmit={handleSendMessage}
                placeholder="Continue the conversation…"
                disabled={isLoading || isLoadingHistory}
              />
            </div>
          </>
        )}
      </div>

      <ChatPinsDrawer />
    </div>
  );
}
