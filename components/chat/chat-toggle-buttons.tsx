"use client";

import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { NewChatIcon, ChevronRightIcon } from "@/components/icons";
import { useChatStore } from "@/stores/chat-store";

// Memoized toggle buttons (best practice 5.5)
export const ChatToggleButtons = memo(function ChatToggleButtons() {
  const sidebarOpen = useChatStore((state) => state.sidebarOpen);
  const toggleSidebar = useChatStore((state) => state.toggleSidebar);
  const createNewChat = useChatStore((state) => state.createNewChat);

  return (
    <AnimatePresence>
      {!sidebarOpen && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="absolute top-4 left-4 z-10"
        >
          <TooltipProvider delayDuration={0}>
            <div className="flex items-center gap-1 bg-white rounded-full border border-gray-200 p-1 shadow-sm">
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.button
                    onClick={toggleSidebar}
                    className="p-2 rounded-full text-gray-600 hover:bg-gray-100 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <ChevronRightIcon />
                  </motion.button>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={8}>
                  Open sidebar
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.button
                    onClick={createNewChat}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <NewChatIcon />
                  </motion.button>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={8}>
                  New chat
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
