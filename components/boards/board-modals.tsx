"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, LoaderIcon } from "lucide-react";
import { toast } from "sonner";
import type { Board } from "./types";
import {
  createBoard as apiCreateBoard,
  updateBoard as apiUpdateBoard,
  deleteBoard as apiDeleteBoard,
  type CreateBoardResponse,
} from "@/lib/api/boardsApi";
import { getApiErrorMessage } from "@/lib/api/axios";

// ── Shared modal backdrop ──────────────────────────────────
function ModalBackdrop({
  onClose,
  disabled,
  children,
}: {
  onClose: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={() => !disabled && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

// ── Create Board Modal ─────────────────────────────────────
interface CreateBoardModalProps {
  open: boolean;
  userId: string;
  onClose: () => void;
  onSuccess: (boardId: string, boardName: string) => void;
}

export function CreateBoardModal({
  open,
  userId,
  onClose,
  onSuccess,
}: CreateBoardModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const reset = () => {
    setName("");
    setDescription("");
    setTags("");
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    setIsLoading(true);
    try {
      const response: CreateBoardResponse = await apiCreateBoard(
        userId,
        name.trim(),
        description.trim(),
        tags.trim()
      );
      if (response?.status === false) {
        toast.error("Failed to create board");
        return;
      }
      const boardId = response.board.id;
      const boardName = response.board.name;
      toast.success(response?.message || `Board "${boardName}" created`);
      reset();
      onClose();
      onSuccess(boardId, boardName);
    } catch (error) {
      console.error("Error creating board:", error);
      toast.error(getApiErrorMessage(error, "Failed to create board"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <ModalBackdrop onClose={onClose} disabled={isLoading}>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Create New Board
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Board Name
              </label>
              <Input
                placeholder="Enter board name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Source
              </label>
              <div className="flex items-center h-9 px-3 border border-border-mid rounded-md bg-gray-50 text-sm text-text-secondary">
                Sales
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Description (optional)
              </label>
              <Textarea
                placeholder="Enter description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Tags (comma separated)
              </label>
              <Input
                placeholder="e.g., sales, 2024"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-6">
            <Button variant="secondary" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!name.trim() || isLoading}
            >
              {isLoading && (
                <LoaderIcon
                  className="h-4 w-4 animate-spin mr-2"
                  aria-hidden="true"
                />
              )}
              Create Board
            </Button>
          </div>
        </ModalBackdrop>
      )}
    </AnimatePresence>
  );
}

// ── Edit Board Modal ───────────────────────────────────────
interface EditBoardModalProps {
  board: Board | null;
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditBoardModal({
  board,
  userId,
  onClose,
  onSuccess,
}: EditBoardModalProps) {
  const [name, setName] = useState(board?.name ?? "");
  const [description, setDescription] = useState(board?.description ?? "");
  const [tags, setTags] = useState(board?.board_tags ?? "");
  const [isLoading, setIsLoading] = useState(false);

  // Sync fields when board changes (opening a different board)
  const [prevBoardId, setPrevBoardId] = useState(board?.id);
  if (board && board.id !== prevBoardId) {
    setPrevBoardId(board.id);
    setName(board.name);
    setDescription(board.description || "");
    setTags(board.board_tags || "");
  }

  const handleUpdate = async () => {
    if (!board || !name.trim()) return;
    setIsLoading(true);
    try {
      await apiUpdateBoard(board.id, userId, name.trim(), description.trim(), tags.trim());
      onClose();
      onSuccess();
    } catch (error) {
      console.error("Error updating board:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {board && (
        <ModalBackdrop onClose={onClose} disabled={isLoading}>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Edit Board
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Board Name
              </label>
              <Input
                placeholder="Enter board name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Description (optional)
              </label>
              <Textarea
                placeholder="Enter description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Tags (comma separated)
              </label>
              <Input
                placeholder="e.g., sales, 2024"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-6">
            <Button variant="secondary" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={!name.trim() || isLoading}
            >
              {isLoading && (
                <LoaderIcon
                  className="h-4 w-4 animate-spin mr-2"
                  aria-hidden="true"
                />
              )}
              Update Board
            </Button>
          </div>
        </ModalBackdrop>
      )}
    </AnimatePresence>
  );
}

// ── Delete Confirmation Dialog ─────────────────────────────
interface DeleteBoardDialogProps {
  board: Board | null;
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function DeleteBoardDialog({
  board,
  userId,
  onClose,
  onSuccess,
}: DeleteBoardDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    if (!board) return;
    setIsLoading(true);
    try {
      await apiDeleteBoard(userId, board.id);
      onClose();
      onSuccess();
    } catch (error) {
      console.error("Error deleting board:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {board && (
        <ModalBackdrop onClose={onClose} disabled={isLoading}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <Trash2 className="h-5 w-5 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Delete Board
            </h2>
          </div>

          <p className="text-sm text-gray-600 mb-6">
            Are you sure you want to delete{" "}
            <span className="font-medium text-gray-900">
              &quot;{board.name}&quot;
            </span>
            ? This action cannot be undone.
          </p>

          <div className="flex items-center justify-end gap-3">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isLoading && (
                <LoaderIcon
                  className="h-4 w-4 animate-spin mr-2"
                  aria-hidden="true"
                />
              )}
              Delete
            </Button>
          </div>
        </ModalBackdrop>
      )}
    </AnimatePresence>
  );
}
