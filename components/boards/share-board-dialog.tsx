"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Share2, Loader2, UserMinus, Users } from "lucide-react";
import { toast } from "sonner";
import type { Board } from "./types";
import { getRelativeTime } from "./types";
import {
  publishBoard,
  unpublishBoard,
  fetchPublishRecipients,
  type BoardPermission,
  type PublishBoardResponse,
  type PublishRecipientItem,
} from "@/lib/api/boardsApi";
import { getApiErrorMessage } from "@/lib/api/axios";
import { useUserId } from "@/hooks/use-user-id";
import { displayShareUser, isSameShareUser } from "@/lib/user-display";

interface ShareBoardDialogProps {
  board: Board | null;
  userId: string;
  onClose: () => void;
}

function recipientKey(recipient: PublishRecipientItem): string {
  return recipient.target_user_id;
}

function recipientRevokeId(recipient: PublishRecipientItem): string {
  return recipient.target_user_name?.trim() || recipient.target_user_id;
}

export function ShareBoardDialog({
  board,
  userId,
  onClose,
}: ShareBoardDialogProps) {
  const queryClient = useQueryClient();
  const { userName: currentUserName } = useUserId();
  const [targetUserName, setTargetUserName] = useState("");
  const [permission, setPermission] = useState<BoardPermission>("manage");

  const {
    data: recipientsData,
    isLoading: recipientsLoading,
    isError: recipientsError,
  } = useQuery({
    queryKey: ["board-recipients", board?.id, userId],
    queryFn: () => fetchPublishRecipients(board!.id, userId),
    enabled: !!board && !!userId,
  });

  const recipients = recipientsData?.recipients ?? [];

  const invalidateShareQueries = () => {
    queryClient.invalidateQueries({
      queryKey: ["board-recipients", board?.id, userId],
    });
    queryClient.invalidateQueries({ queryKey: ["published-boards", userId] });
  };

  const publishMutation = useMutation({
    mutationFn: () =>
      publishBoard(board!.id, userId, targetUserName.trim(), permission),
    onSuccess: (data: PublishBoardResponse) => {
      if (data.status === false) {
        toast.error(data.error || data.message || "Failed to share board");
        return;
      }
      toast.success(data.message || "Board shared successfully");
      setTargetUserName("");
      invalidateShareQueries();
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to share board"));
    },
  });

  const unpublishMutation = useMutation({
    mutationFn: (recipient: PublishRecipientItem) =>
      unpublishBoard(board!.id, userId, recipientRevokeId(recipient)),
    onSuccess: (data) => {
      if (data.status === false) {
        toast.error(data.error || data.message || "Failed to revoke access");
        return;
      }
      toast.success(data.message || "Access revoked");
      invalidateShareQueries();
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to revoke access"));
    },
  });

  const handleShare = () => {
    if (!board) return;
    const trimmed = targetUserName.trim();
    if (!trimmed) return;
    if (isSameShareUser(trimmed, userId, currentUserName)) {
      toast.error("Cannot publish board to yourself");
      return;
    }
    publishMutation.mutate();
  };

  return (
    <AnimatePresence>
      {board && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50"
            onClick={() =>
              !publishMutation.isPending &&
              !unpublishMutation.isPending &&
              onClose()
            }
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <Share2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Share Board
                </h2>
                <p className="text-xs text-gray-500">
                  Publish this board to another user
                </p>
              </div>
            </div>

            <p className="text-sm font-medium text-gray-800 bg-gray-50 p-3 rounded-lg mb-4 line-clamp-2">
              {board.name}
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  User name
                </label>
                <Input
                  placeholder="e.g. John Smith or jsmith"
                  value={targetUserName}
                  onChange={(e) => setTargetUserName(e.target.value)}
                  disabled={publishMutation.isPending}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Permission
                </label>
                <Select
                  value={permission}
                  onValueChange={(v) => setPermission(v as BoardPermission)}
                  disabled={publishMutation.isPending}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="view">
                      View only — read board, charts, summary
                    </SelectItem>
                    <SelectItem value="manage">
                      Can manage — edit, refresh, layout, visuals
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-2">
                <Users className="h-3.5 w-3.5" />
                People with access
                {recipientsData?.total != null && (
                  <span className="text-gray-400">({recipientsData.total})</span>
                )}
              </div>

              {recipientsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full rounded-lg" />
                  <Skeleton className="h-12 w-full rounded-lg" />
                </div>
              ) : recipientsError ? (
                <p className="text-sm text-red-600 py-2">
                  Could not load recipients. You may not have owner access.
                </p>
              ) : recipients.length === 0 ? (
                <p className="text-sm text-gray-500 py-2">
                  Not shared with anyone yet.
                </p>
              ) : (
                <ul className="space-y-2 max-h-40 overflow-y-auto">
                  {recipients.map((user) => (
                    <li
                      key={recipientKey(user)}
                      className="flex items-center justify-between gap-2 rounded-lg border border-gray-100 px-3 py-2 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-gray-800 truncate">
                          {displayShareUser(
                            user.target_user_id,
                            user.target_user_name
                          )}
                        </p>
                        <p className="text-xs text-gray-500">
                          <span className="capitalize">{user.permission}</span>
                          {" · "}
                          {getRelativeTime(user.published_at)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        disabled={unpublishMutation.isPending}
                        onClick={() => unpublishMutation.mutate(user)}
                        title="Revoke access"
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={
                  publishMutation.isPending || unpublishMutation.isPending
                }
              >
                Cancel
              </Button>
              <Button
                onClick={handleShare}
                disabled={!targetUserName.trim() || publishMutation.isPending}
              >
                {publishMutation.isPending ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Share2 className="mr-1.5 h-3.5 w-3.5" />
                )}
                Share
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
