"use client";

import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PlusIcon, ChevronLeftIcon } from "@/components/icons";
import { ChatHistory } from "@/components/chat-history";
import { useChatStore } from "@/stores/chat-store";

// Memoized to prevent re-renders (best practice 5.5)
export const ChatSidebar = memo(function ChatSidebar() {
  const sidebarOpen = useChatStore((state) => state.sidebarOpen);
  const toggleSidebar = useChatStore((state) => state.toggleSidebar);
  const createNewChat = useChatStore((state) => state.createNewChat);

  const handleNewChat = () => {
    createNewChat();
  };

  return (
    <AnimatePresence>
      {sidebarOpen && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 280, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="h-full bg-white border-r border-gray-200 flex flex-col overflow-hidden shrink-0"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="flex flex-col h-full p-3 overflow-hidden"
          >
            {/* New Chat Button + Close Button */}
            <TooltipProvider delayDuration={0}>
              <div className="flex items-center justify-between mb-4">
                <motion.button
                  onClick={handleNewChat}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: 0.2 }}
                  className="flex items-center gap-3 px-4 py-3 bg-[#e8f0fe] text-primary rounded-full hover:bg-[#d2e3fc] transition-colors"
                >
                  <PlusIcon />
                  <span className="font-medium">New chat</span>
                </motion.button>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.button
                      onClick={toggleSidebar}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2, delay: 0.25 }}
                      className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <ChevronLeftIcon />
                    </motion.button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" sideOffset={8}>
                    Close sidebar
                  </TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>

            {/* Chat History */}
            <ChatHistory />
          </motion.div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
});
