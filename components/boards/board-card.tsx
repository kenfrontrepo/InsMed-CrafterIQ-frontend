"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
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
  Info,
  Pencil,
  Share2,
  Trash2,
} from "lucide-react";
import type { Board } from "./types";
import { getRelativeTime } from "./types";

interface BoardCardProps {
  board: Board;
  index: number;
  onEdit: (board: Board) => void;
  onDelete: (board: Board) => void;
  onShare: (board: Board) => void;
}

export function BoardCard({ board, index, onEdit, onDelete, onShare }: BoardCardProps) {
  const router = useRouter();
  const tags =
    board.board_tags
      ?.split(",")
      .map((tag) => tag.trim())
      .filter(Boolean) || [];

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("[data-radix-dropdown-menu]")) {
      return;
    }
    const params = new URLSearchParams({ id: board.id, name: board.name });
    router.push(`/Boards/detail?${params.toString()}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="h-[180px]"
    >
      <Card
        className="bg-white border-gray-200 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer group h-full flex flex-col"
        onClick={handleCardClick}
      >
        <CardHeader className="pb-3 shrink-0">
          <div className="flex items-start justify-between">
            <CardTitle className="text-base font-medium text-gray-900 group-hover:text-primary transition-colors line-clamp-1">
              {board.name}
            </CardTitle>
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
                <DropdownMenuItem
                  onClick={() => {
                    const params = new URLSearchParams({
                      id: board.id,
                      name: board.name,
                    });
                    router.push(`/Boards/detail?${params.toString()}`);
                  }}
                >
                  <Info className="mr-2 h-4 w-4" />
                  Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(board)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onShare(board)}>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={() => onDelete(board)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="pb-3 shrink-0">
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1.5">
              <Pin className="h-4 w-4" />
              <span>{board.pin_count} pins</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              <span>{getRelativeTime(board.created_at)}</span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="pt-0 mt-auto">
          <div className="flex flex-wrap gap-2 overflow-hidden max-h-[28px]">
            {tags.length > 0 ? (
              tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
                >
                  {tag}
                </span>
              ))
            ) : (
              <span className="text-xs text-gray-400">No tags</span>
            )}
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

export function BoardCardSkeleton() {
  return (
    <div className="h-[180px]">
      <Card className="bg-white border-gray-200 h-full flex flex-col">
        <CardHeader className="pb-3 shrink-0">
          <div className="flex items-start justify-between">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-6 w-6 rounded" />
          </div>
        </CardHeader>
        <CardContent className="pb-3 shrink-0">
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
        </CardContent>
        <CardFooter className="pt-0 mt-auto">
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
