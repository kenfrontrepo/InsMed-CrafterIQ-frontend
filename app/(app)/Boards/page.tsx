"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Search,
  Plus,
  Filter,
  LayoutGrid,
  List,
  X,
  ChevronsUpDown,
} from "lucide-react";

import type { Board } from "@/components/boards/types";
import { fetchBoards } from "@/components/boards/types";
import { BoardCard, BoardCardSkeleton } from "@/components/boards/board-card";
import {
  CreateBoardModal,
  EditBoardModal,
  DeleteBoardDialog,
} from "@/components/boards/board-modals";
import { useUserId } from "@/hooks/use-user-id";

export default function BoardsPage() {
  const router = useRouter();
  const { userId } = useUserId();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBoard, setEditingBoard] = useState<Board | null>(null);
  const [deletingBoard, setDeletingBoard] = useState<Board | null>(null);

  // Fetch boards
  const { data: boardsData = [], isLoading, refetch } = useQuery({
    queryKey: ["boards", userId],
    queryFn: () => fetchBoards(userId!),
    enabled: !!userId,
  });

  const handleRefetch = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleBoardCreated = useCallback(
    (boardId: string, boardName: string) => {
      refetch();
      if (boardId) {
        const params = new URLSearchParams({ id: boardId, name: boardName, mode: "edit" });
        router.push(`/Boards/detail?${params.toString()}`);
      }
    },
    [refetch, router]
  );

  // Derived data
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    boardsData.forEach((board) => {
      if (board.board_tags) {
        board.board_tags.split(",").forEach((tag) => tags.add(tag.trim()));
      }
    });
    return Array.from(tags).sort();
  }, [boardsData]);

  const filteredBoards = useMemo(() => {
    return boardsData.filter((board) => {
      const matchesSearch = board.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesTag =
        selectedTag === "all" ||
        board.board_tags?.toLowerCase().includes(selectedTag.toLowerCase());
      return matchesSearch && matchesTag;
    });
  }, [boardsData, searchQuery, selectedTag]);

  const gridClass = `grid gap-4 ${
    viewMode === "grid"
      ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
      : "grid-cols-1"
  }`;

  return (
    <div className="p-6 overflow-auto scrollbar-hide h-full">
      {/* Header + Filters — single row */}
      <div className="flex items-center gap-4 mb-6">
        <div className="mr-auto">
          <h1 className="text-lg font-medium text-text-primary mb-2">Boards</h1>
          <p className="text-xs text-text-tertiary mb-2">
            {filteredBoards.length} board
            {filteredBoards.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Search */}
        <div className="relative w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search boards…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-[7px] border border-border-mid rounded-md bg-card text-[13px] text-text-primary placeholder:text-text-tertiary outline-none transition-colors focus:border-border-strong"
          />
        </div>

        {/* Tag filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 px-3 py-[7px] border border-border-mid rounded-md text-[13px] text-text-secondary hover:bg-hover transition-colors min-w-[130px] justify-between">
              <div className="flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5 opacity-60" />
                <span>{selectedTag === "all" ? "All Tags" : selectedTag}</span>
              </div>
              <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[180px]">
            <DropdownMenuLabel>Filter by Tag</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={selectedTag}
              onValueChange={setSelectedTag}
            >
              <DropdownMenuRadioItem value="all">
                All Tags
              </DropdownMenuRadioItem>
              <DropdownMenuSeparator />
              {allTags.map((tag) => (
                <DropdownMenuRadioItem key={tag} value={tag}>
                  {tag}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* View toggle */}
        <TooltipProvider delayDuration={0}>
          <div className="flex items-center border border-border-mid rounded-md p-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded transition-colors ${viewMode === "grid" ? "bg-hover text-text-primary" : "text-text-tertiary hover:text-text-secondary"}`}
                >
                  <LayoutGrid className="size-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Grid view</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded transition-colors ${viewMode === "list" ? "bg-hover text-text-primary" : "text-text-tertiary hover:text-text-secondary"}`}
                >
                  <List className="size-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>List view</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>

        {/* Create Board — dark/black button */}
        <motion.button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-[7px] bg-text-primary text-white rounded-md hover:bg-[#333330] transition-colors text-[13px] font-medium"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Create Board</span>
        </motion.button>
      </div>

      {/* Active filter tag */}
      {selectedTag !== "all" && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-text-tertiary">Filtered by:</span>
          <button
            onClick={() => setSelectedTag("all")}
            className="flex items-center gap-1 text-xs font-medium text-text-primary bg-hover border border-border-mid rounded-full px-2.5 py-1 hover:border-border-strong transition-colors"
          >
            {selectedTag}
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Boards Grid */}
      <div>
        {isLoading ? (
          <div className={gridClass}>
            {[...Array(6)].map((_, i) => (
              <BoardCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredBoards.length > 0 ? (
          <div className={gridClass}>
            <AnimatePresence>
              {filteredBoards.map((board, index) => (
                <BoardCard
                  key={board.id}
                  board={board}
                  index={index}
                  onEdit={setEditingBoard}
                  onDelete={setDeletingBoard}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center h-64 text-center"
          >
            <div className="w-16 h-16 bg-hover rounded-full flex items-center justify-center mb-4">
              <LayoutGrid className="h-6 w-6 text-text-tertiary" />
            </div>
            <h3 className="text-lg font-medium text-text-primary mb-1">
              No boards found
            </h3>
            <p className="text-sm text-text-secondary mb-4">
              {searchQuery
                ? `No results for "${searchQuery}"`
                : "Create your first board to get started"}
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-[7px] bg-text-primary text-white rounded-md hover:bg-[#333330] transition-colors text-[13px] font-medium"
            >
              <Plus className="h-3.5 w-3.5" />
              Create Board
            </button>
          </motion.div>
        )}
      </div>

      {/* Modals */}
      <CreateBoardModal
        open={showCreateModal}
        userId={userId ?? ""}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleBoardCreated}
      />
      <EditBoardModal
        board={editingBoard}
        userId={userId ?? ""}
        onClose={() => setEditingBoard(null)}
        onSuccess={handleRefetch}
      />
      <DeleteBoardDialog
        board={deletingBoard}
        userId={userId ?? ""}
        onClose={() => setDeletingBoard(null)}
        onSuccess={handleRefetch}
      />
    </div>
  );
}
