"use client";

import { useMemo, useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useChatStore } from "@/stores/chat-store";
import { Loader2, MoreVertical, Pencil, Trash2, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUserId } from "@/hooks/use-user-id";
import {
  fetchChatHistory as apiFetchChatHistory,
  updateChatTitle,
  deleteChatConversation,
  type InsmedConversation,
  type InsmedChatHistoryResponse,
} from "@/lib/api/chatApi";

async function fetchChatHistory(userId: string): Promise<InsmedConversation[]> {
  const data: InsmedChatHistoryResponse = await apiFetchChatHistory(userId);
  if (!data.status) return [];
  return data.conversations ?? [];
}

async function updateChatName(
  conversationId: string,
  userId: string,
  title: string
): Promise<void> {
  await updateChatTitle(conversationId, userId, title);
}

async function deleteChat(
  conversationId: string,
  userId: string
): Promise<void> {
  await deleteChatConversation(conversationId, userId);
}

/** Group conversations by relative date */
function getDateGroup(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays <= 7) return "This week";
  if (diffDays <= 30) return "This month";
  return "Older";
}

// Edit Dialog Component
function EditChatDialog({
  conversation,
  isOpen,
  isSaving,
  onClose,
  onSave,
}: {
  conversation: InsmedConversation | null;
  isOpen: boolean;
  isSaving: boolean;
  onClose: () => void;
  onSave: (title: string) => void;
}) {
  const [title, setTitle] = useState("");

  // Reset form when dialog opens with new conversation
  if (isOpen && conversation && title === "" && conversation.title !== "") {
    setTitle(conversation.title);
  }

  const handleClose = () => {
    setTitle("");
    onClose();
  };

  if (!isOpen || !conversation) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-white rounded-xl shadow-xl p-5 w-full max-w-sm mx-4"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 rounded-full">
              <Pencil className="h-4 w-4 text-blue-600" />
            </div>
            <h2 className="text-base font-semibold text-gray-900">Rename Chat</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        <div className="mb-5">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter chat name"
            className="w-full"
            autoFocus
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={handleClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => onSave(title)}
            disabled={isSaving || !title.trim()}
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// Delete Confirmation Dialog
function DeleteChatDialog({
  conversation,
  isOpen,
  isDeleting,
  onClose,
  onConfirm,
}: {
  conversation: InsmedConversation | null;
  isOpen: boolean;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!isOpen || !conversation) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-white rounded-xl shadow-xl p-5 w-full max-w-sm mx-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 bg-red-100 rounded-full">
            <Trash2 className="h-4 w-4 text-red-600" />
          </div>
          <h2 className="text-base font-semibold text-gray-900">Delete Chat</h2>
        </div>
        <p className="text-sm text-gray-600 mb-2">
          Are you sure you want to delete this conversation?
        </p>
        <p className="text-sm font-medium text-gray-800 bg-gray-50 p-2.5 rounded-lg mb-5 line-clamp-2">
          {conversation.title}
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

export function ChatHistory() {
  const queryClient = useQueryClient();
  const { userId } = useUserId();
  const pathname = usePathname();
  const router = useRouter();
  const loadConversationFromHistory = useChatStore(
    (state) => state.loadConversationFromHistory
  );
  const activeChat = useChatStore((state) => state.activeChat);

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ["chat-history", userId],
    queryFn: () => fetchChatHistory(userId!),
    enabled: !!userId,
    staleTime: 30_000,
  });

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [conversationToEdit, setConversationToEdit] = useState<InsmedConversation | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<InsmedConversation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Group by date
  const grouped = useMemo(() => {
    const groups: Record<string, InsmedConversation[]> = {};
    for (const conv of conversations) {
      const group = getDateGroup(conv.updated_at);
      if (!groups[group]) groups[group] = [];
      groups[group].push(conv);
    }
    return groups;
  }, [conversations]);

  const handleSelect = (conv: InsmedConversation) => {
    loadConversationFromHistory(conv.id, conv.title, userId!);
    if (!pathname.startsWith("/chat")) {
      router.push("/chat");
    }
  };

  // Handle edit click
  const handleEditClick = useCallback((conv: InsmedConversation) => {
    setConversationToEdit(conv);
    setEditDialogOpen(true);
  }, []);

  // Handle edit save
  const handleEditSave = useCallback(
    async (title: string) => {
      if (!conversationToEdit) return;
      setIsSaving(true);
      try {
        await updateChatName(conversationToEdit.id, userId!, title);
        queryClient.invalidateQueries({ queryKey: ["chat-history"] });
        setEditDialogOpen(false);
        setConversationToEdit(null);
      } catch (err) {
        console.error("Update failed:", err);
      } finally {
        setIsSaving(false);
      }
    },
    [conversationToEdit, queryClient, userId]
  );

  // Handle delete click
  const handleDeleteClick = useCallback((conv: InsmedConversation) => {
    setConversationToDelete(conv);
    setDeleteDialogOpen(true);
  }, []);

  // Handle delete confirm
  const handleDeleteConfirm = useCallback(async () => {
    if (!conversationToDelete) return;
    setIsDeleting(true);
    try {
      await deleteChat(conversationToDelete.id, userId!);
      queryClient.invalidateQueries({ queryKey: ["chat-history"] });
      setDeleteDialogOpen(false);
      setConversationToDelete(null);
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setIsDeleting(false);
    }
  }, [conversationToDelete, queryClient, userId]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-4 w-4 animate-spin text-text-tertiary" />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex h-full items-center justify-center px-4">
        <p className="text-[13px] text-text-tertiary text-center">
          No conversations yet. Start a new chat!
        </p>
      </div>
    );
  }

  let animIndex = 0;

  return (
    <div className="flex flex-col h-full">
      {/* Edit Dialog */}
      <AnimatePresence>
        {editDialogOpen && (
          <EditChatDialog
            conversation={conversationToEdit}
            isOpen={editDialogOpen}
            isSaving={isSaving}
            onClose={() => {
              setEditDialogOpen(false);
              setConversationToEdit(null);
            }}
            onSave={handleEditSave}
          />
        )}
      </AnimatePresence>

      {/* Delete Dialog */}
      <AnimatePresence>
        {deleteDialogOpen && (
          <DeleteChatDialog
            conversation={conversationToDelete}
            isOpen={deleteDialogOpen}
            isDeleting={isDeleting}
            onClose={() => {
              setDeleteDialogOpen(false);
              setConversationToDelete(null);
            }}
            onConfirm={handleDeleteConfirm}
          />
        )}
      </AnimatePresence>

      <div className="text-[10px] font-medium tracking-[0.07em] uppercase text-text-tertiary mb-2 px-1 shrink-0">
        Recent
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide">
        {Object.entries(grouped).map(([group, convs]) => (
          <div key={group}>
            <div className="space-y-px">
              {convs.map((conv) => {
                const idx = animIndex++;
                const isActive = activeChat?.conversationId === conv.id;
                return (
                  <motion.div
                    key={conv.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: 0.1 + idx * 0.02 }}
                    className={`group/item flex items-center gap-[9px] px-2 py-[7px] rounded-md transition-colors cursor-pointer ${
                      isActive
                        ? "bg-hover text-text-primary font-medium"
                        : "text-text-secondary hover:bg-hover hover:text-text-primary"
                    }`}
                  >
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'opacity-80' : 'opacity-50'}`}>
                      <path d="M2 4h12M2 8h8M2 12h5"/>
                    </svg>

                    <button
                      onClick={() => handleSelect(conv)}
                      className="flex-1 text-left min-w-0"
                    >
                      <span className="block truncate text-[13px]">
                        {conv.title}
                      </span>
                    </button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="p-1 rounded opacity-0 group-hover/item:opacity-100 transition-opacity shrink-0 hover:bg-border-subtle"
                        >
                          <MoreVertical className="h-3 w-3" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-32">
                        <DropdownMenuItem onClick={() => handleEditClick(conv)}>
                          <Pencil className="mr-2 h-3.5 w-3.5" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(conv)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="mr-2 h-3.5 w-3.5" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
