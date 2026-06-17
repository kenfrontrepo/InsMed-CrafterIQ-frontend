"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Share, LayoutGrid, Loader2, Check } from "lucide-react";
import type { PinItem } from "./types";

interface BoardOption {
  id: string;
  name: string;
}

import { fetchBoards as apiFetchBoards } from "@/lib/api/boardsApi";
import { assignPin } from "@/lib/api/pinsApi";

async function fetchBoards(userId: string): Promise<BoardOption[]> {
  const data = await apiFetchBoards(userId);
  return (data.boards || []).map((b: { id: string; name: string }) => ({
    id: b.id,
    name: b.name,
  }));
}

async function assignPinToBoard(
  pinId: string,
  boardId: string,
  userId: string
) {
  return assignPin(pinId, userId, boardId);
}

interface ShareDialogProps {
  pin: PinItem;
  userId: string;
  onClose: () => void;
}

export function ShareDialog({ pin, userId, onClose }: ShareDialogProps) {
  const queryClient = useQueryClient();
  const [selectedBoardId, setSelectedBoardId] = useState<string>("");

  const {
    data: boards = [],
    isLoading: boardsLoading,
  } = useQuery({
    queryKey: ["boards-list", userId],
    queryFn: () => fetchBoards(userId),
    enabled: !!userId,
  });

  const assignedBoardIds = new Set(pin.boards.map((b) => b.board_id));
  const availableBoards = boards.filter((b) => !assignedBoardIds.has(b.id));

  const assignMutation = useMutation({
    mutationFn: () => assignPinToBoard(pin.id, selectedBoardId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-pins", userId] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => !assignMutation.isPending && onClose()}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
            <Share className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Add to Board
            </h2>
            <p className="text-xs text-gray-500">
              Choose a board to add this pin to
            </p>
          </div>
        </div>

        <p className="text-sm font-medium text-gray-800 bg-gray-50 p-3 rounded-lg mb-4 line-clamp-2">
          {pin.title}
        </p>

        {/* Already assigned boards */}
        {pin.boards.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2">Already on:</p>
            <div className="flex flex-wrap gap-1.5">
              {pin.boards.map((b) => (
                <span
                  key={b.board_id}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-[#e8f0fe] text-primary rounded-full"
                >
                  <LayoutGrid className="h-3 w-3" />
                  {b.board_name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Board selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Select Board
          </label>
          {boardsLoading ? (
            <Skeleton className="h-9 w-full rounded-md" />
          ) : availableBoards.length === 0 ? (
            <p className="text-sm text-gray-500 py-2">
              {boards.length === 0
                ? "No boards available. Create a board first."
                : "This pin is already on all available boards."}
            </p>
          ) : (
            <Select value={selectedBoardId} onValueChange={setSelectedBoardId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a board" />
              </SelectTrigger>
              <SelectContent>
                {availableBoards.map((board) => (
                  <SelectItem key={board.id} value={board.id}>
                    <div className="flex items-center gap-2">
                      <LayoutGrid className="h-3.5 w-3.5 text-gray-400" />
                      {board.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={assignMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={() => assignMutation.mutate()}
            disabled={
              !selectedBoardId ||
              assignMutation.isPending ||
              availableBoards.length === 0
            }
          >
            {assignMutation.isPending ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : assignMutation.isSuccess ? (
              <Check className="mr-1.5 h-3.5 w-3.5" />
            ) : (
              <LayoutGrid className="mr-1.5 h-3.5 w-3.5" />
            )}
            Add to Board
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
