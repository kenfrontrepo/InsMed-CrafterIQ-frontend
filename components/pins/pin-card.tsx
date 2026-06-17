"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import dynamic from "next/dynamic";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pin,
  Calendar,
  MoreHorizontal,
  Trash2,
  Pencil,
  Info,
  Share,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { LayoutGrid } from "lucide-react";
import type { PinItem } from "./types";
import { getRelativeTime, getTypeConfig } from "./utils";
import { fetchPinDetails } from "@/lib/api/pinsApi";
import { useUserId } from "@/hooks/use-user-id";
import { markdownComponents } from "../chat/markdown-components";

const ChatChart = dynamic(
  () => import("@/components/chat/chat-chart").then((m) => m.ChatChart),
  {
    ssr: false,
    loading: () => (
      <div className="h-[300px] bg-gray-50 rounded-xl animate-pulse" />
    ),
  }
);

/* ── Pin Details Dialog (exported for page-level rendering) ── */

export function PinDetailsDialog({
  pin: pinItem,
  onClose,
}: {
  pin: PinItem;
  onClose: () => void;
}) {
  const { userId } = useUserId();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["pin-details", pinItem.id, userId],
    queryFn: () => fetchPinDetails(pinItem.id, userId!),
    enabled: !!userId,
  });

  const pin = data?.pin;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <h2 className="text-base font-semibold text-gray-900 truncate pr-4">
            {isLoading ? "Loading..." : pin?.title ?? pinItem.title}
          </h2>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400 mb-3" />
              <p className="text-sm text-gray-500">Loading pin details...</p>
            </div>
          )}

          {isError && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <AlertCircle className="h-6 w-6 text-red-400 mb-3" />
              <p className="text-sm text-red-600">
                {error instanceof Error ? error.message : "Failed to load details"}
              </p>
            </div>
          )}

          {!isLoading && !isError && pin && (
            <>
              {/* Visual spec chart */}
              {pin.visual_spec &&
                pin.visual_spec.is_visual !== false &&
                pin.visual_spec.chart_type && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <ChatChart visualSpec={pin.visual_spec} bare height={350} />
                  </div>
                )}

              {/* Content rendered as markdown */}
              {pin.content && (
                <div className="prose prose-sm max-w-none text-gray-700 prose-headings:text-gray-800 prose-strong:text-gray-800 prose-table:text-sm">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                    {pin.content}
                  </ReactMarkdown>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── PinCard component ──────────────────────────────────── */

interface PinCardProps {
  pin: PinItem;
  index: number;
  onEdit: (pin: PinItem) => void;
  onDelete: (pin: PinItem) => void;
  onShare: (pin: PinItem) => void;
  onDetails: (pin: PinItem) => void;
}

export const PinCard = memo(function PinCard({
  pin,
  index,
  onEdit,
  onDelete,
  onShare,
  onDetails,
}: PinCardProps) {
  const typeConfig = getTypeConfig(pin.response_type);

  const tags =
    pin.pin_tags
      ?.split(",")
      .map((t) => t.trim())
      .filter(Boolean) || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="h-[200px]"
    >
      <Card className="bg-white border-gray-200 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer group h-full flex flex-col">
        <CardHeader className="pb-3 shrink-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <CardTitle className="text-sm font-medium text-gray-900 group-hover:text-primary transition-colors line-clamp-2">
                {pin.title}
              </CardTitle>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48"
                onClick={(e) => e.stopPropagation()}
              >
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onEdit(pin)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDetails(pin)}>
                  <Info className="mr-2 h-4 w-4" />
                  Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onShare(pin)}>
                  <Share className="mr-2 h-4 w-4" />
                  Assign to Board
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={() => onDelete(pin)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Unpin
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="pb-3 shrink-0">
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <span>{getRelativeTime(pin.created_at)}</span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="pt-0 mt-auto">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-600 rounded-full">
              {pin.schema_name}
            </span>

            {tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 text-[10px] font-medium bg-purple-50 text-purple-600 rounded-full"
              >
                {tag}
              </span>
            ))}

            {pin.boards.length > 0 ? (
              pin.boards.map((board) => (
                <span
                  key={board.board_id}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-[#e8f0fe] text-primary rounded-full"
                >
                  <LayoutGrid className="h-3 w-3" />
                  {board.board_name}
                </span>
              ))
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-gray-50 text-gray-400 rounded-full">
                <Pin className="h-3 w-3" />
                Not in any board
              </span>
            )}
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
});

export function PinCardSkeleton() {
  return (
    <div className="h-[200px]">
      <Card className="bg-white border-gray-200 h-full flex flex-col">
        <CardHeader className="pb-3 shrink-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-4 w-40" />
            </div>
            <Skeleton className="h-6 w-6 rounded" />
          </div>
        </CardHeader>
        <CardContent className="pb-3 shrink-0">
          <div className="flex items-center gap-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
        </CardContent>
        <CardFooter className="pt-0 mt-auto">
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
