import { useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useChatStore } from "@/stores/chat-store";
import { useUserId } from "@/hooks/use-user-id";

/** Start a fresh chat and refresh sidebar history (playpower behavior) */
export function useNewChat() {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { userId } = useUserId();
  const createNewChat = useChatStore((state) => state.createNewChat);

  return useCallback(() => {
    createNewChat();

    if (userId) {
      void queryClient.invalidateQueries({ queryKey: ["chat-history", userId] });
    }

    if (pathname.startsWith("/chat")) {
      router.replace("/chat", { scroll: false });
    } else {
      router.push("/chat");
    }
  }, [createNewChat, pathname, queryClient, router, userId]);
}
