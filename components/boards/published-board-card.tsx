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
import { Calendar, Share2, User } from "lucide-react";
import type { PublishedBoardItem } from "@/lib/api/boardsApi";
import { getRelativeTime } from "./types";
import { displayShareUser } from "@/lib/user-display";

interface PublishedBoardCardProps {
  board: PublishedBoardItem;
  index: number;
}

export function PublishedBoardCard({ board, index }: PublishedBoardCardProps) {
  const router = useRouter();

  const handleClick = () => {
    const params = new URLSearchParams({
      id: board.board_id,
      name: board.name,
    });
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
        className="bg-white border-gray-200 hover:border-primary/30 hover:shadow-md transition-all cursor-pointer group h-full flex flex-col"
        onClick={handleClick}
      >
        <CardHeader className="pb-3 shrink-0">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base font-medium text-gray-900 group-hover:text-primary transition-colors line-clamp-1">
              {board.name}
            </CardTitle>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-blue-50 text-blue-700 rounded-full shrink-0">
              <Share2 className="h-3 w-3" />
              Shared
            </span>
          </div>
        </CardHeader>

        <CardContent className="pb-3 shrink-0">
          <div className="flex flex-col gap-2 text-sm text-gray-500">
            <div className="flex items-center gap-1.5 min-w-0">
              <User className="h-4 w-4 shrink-0" />
              <span className="truncate">
                Owner:{" "}
                {displayShareUser(board.owner_user_id, board.owner_user_name)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 shrink-0" />
              <span>{getRelativeTime(board.published_at)}</span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="pt-0 mt-auto">
          <span className="px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full capitalize">
            {board.permission} access
          </span>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
