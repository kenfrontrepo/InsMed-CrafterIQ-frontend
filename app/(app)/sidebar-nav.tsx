"use client";

import { useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useChatStore } from "@/stores/chat-store";
import { useSidebarStore } from "@/stores/sidebar-store";
import { ChatHistory } from "@/components/chat-history";
// import Link from "next/link";
// import { useState, useRef } from "react";
// import { useQuery, useQueryClient } from "@tanstack/react-query";
// import { useUserId } from "@/hooks/use-user-id";
// import { fetchBoards, type Board } from "@/components/boards/types";
// import { CreateBoardModal } from "@/components/boards/board-modals";

export function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();
  // const queryClient = useQueryClient();
  const createNewChat = useChatStore((state) => state.createNewChat);
  const setOpen = useSidebarStore((s) => s.setOpen);
  // const { userId } = useUserId();
  // const [createBoardOpen, setCreateBoardOpen] = useState(false);
  // const [chatHeight, setChatHeight] = useState(50);
  // const dragging = useRef(false);
  // const containerRef = useRef<HTMLDivElement>(null);

  const closeOnMobile = useCallback(() => {
    if (window.innerWidth < 768) setOpen(false);
  }, [setOpen]);

  // const handlePointerDown = useCallback((e: React.PointerEvent) => {
  //   e.preventDefault();
  //   (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  //   dragging.current = true;
  //
  //   const onPointerMove = (ev: PointerEvent) => {
  //     if (!dragging.current || !containerRef.current) return;
  //     const rect = containerRef.current.getBoundingClientRect();
  //     const pct = Math.min(Math.max(((ev.clientY - rect.top) / rect.height) * 100, 20), 80);
  //     setChatHeight(pct);
  //   };
  //
  //   const onPointerUp = () => {
  //     dragging.current = false;
  //     document.removeEventListener("pointermove", onPointerMove);
  //     document.removeEventListener("pointerup", onPointerUp);
  //   };
  //
  //   document.addEventListener("pointermove", onPointerMove);
  //   document.addEventListener("pointerup", onPointerUp);
  // }, []);

  const handleNewChat = useCallback(() => {
    createNewChat();
    if (!pathname.startsWith("/chat")) {
      router.push("/chat");
    }
    closeOnMobile();
  }, [createNewChat, pathname, router, closeOnMobile]);

  // const handleCreateBoard = useCallback(() => {
  //   const onBoardsList = pathname === "/Boards" || pathname === "/Boards/";
  //   if (!onBoardsList) {
  //     router.push("/Boards");
  //   }
  //   setCreateBoardOpen(true);
  // }, [pathname, router]);
  //
  // const handleCreateBoardSuccess = useCallback(() => {
  //   queryClient.invalidateQueries({ queryKey: ["boards", userId] });
  // }, [queryClient, userId]);
  //
  // const { data: boards = [] } = useQuery({
  //   queryKey: ["boards", userId],
  //   queryFn: () => fetchBoards(userId!),
  //   enabled: !!userId,
  //   staleTime: 60_000,
  // });

  return (
    <div className="bg-card border-r border-border-subtle flex flex-col overflow-hidden h-full">
      {/* New conversation button */}
      <div className="px-3.5 pt-4 pb-2 shrink-0">
        <button
          onClick={handleNewChat}
          className="flex items-center gap-[7px] w-full px-2 py-[7px] border border-border-mid rounded-md bg-transparent text-[13px] text-text-secondary hover:bg-hover hover:text-text-primary transition-colors cursor-pointer"
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-[13px] h-[13px]">
            <path d="M8 3v10M3 8h10"/>
          </svg>
          New conversation
        </button>
      </div>

      {/* Chat history section */}
      <div className="flex-1 flex flex-col min-h-0 px-3.5 pb-2">
        <div className="flex-1 min-h-0 overflow-hidden">
          <ChatHistory />
        </div>
      </div>

      {/* Boards section hidden
      <div ref={containerRef} className="flex-1 flex flex-col min-h-0">
        <div className="flex flex-col min-h-0 px-3.5 pb-1" style={{ height: `${chatHeight}%` }}>
          <div className="flex-1 min-h-0 overflow-hidden">
            <ChatHistory />
          </div>
        </div>

        <div
          onPointerDown={handlePointerDown}
          className="shrink-0 h-[9px] flex items-center justify-center cursor-row-resize touch-none group hover:bg-hover/60 transition-colors"
        >
          <div className="w-8 h-[3px] rounded-full bg-border-mid group-hover:bg-text-tertiary transition-colors" />
        </div>

        <div className="flex flex-col min-h-0 px-3.5 pt-1 pb-2" style={{ height: `${100 - chatHeight}%` }}>
          <div className="flex items-center justify-between px-1 mb-2 shrink-0">
            <span className="text-[10px] font-medium tracking-[0.07em] uppercase text-text-tertiary">
              Boards
            </span>
            <Link
              href="/Boards"
              onClick={closeOnMobile}
              className="text-[11px] text-text-tertiary hover:text-text-primary transition-colors"
            >
              All boards
            </Link>
          </div>

          <div className="shrink-0 mb-2">
            <button
              type="button"
              onClick={handleCreateBoard}
              className="flex items-center gap-[7px] w-full px-2 py-[7px] border border-border-mid rounded-md bg-transparent text-[13px] text-text-secondary hover:bg-hover hover:text-text-primary transition-colors cursor-pointer"
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-[13px] h-[13px]">
                <path d="M8 3v10M3 8h10"/>
              </svg>
              Create board
            </button>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide">
            {boards.length > 0 ? (
              boards.map((board: Board) => (
                <Link
                  key={board.id}
                  href={`/Boards/detail?id=${board.id}&name=${encodeURIComponent(board.name)}`}
                  onClick={closeOnMobile}
                  className={`flex items-center gap-[9px] px-2 py-[7px] rounded-md text-[13px] transition-colors mb-px ${
                    pathname.includes(board.id)
                      ? "bg-hover text-text-primary font-medium"
                      : "text-text-secondary hover:bg-hover hover:text-text-primary"
                  }`}
                >
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5 opacity-50 shrink-0">
                    <rect x="2" y="2" width="12" height="12" rx="2"/><path d="M2 6h12M6 6v8"/>
                  </svg>
                  <span className="flex-1 truncate">{board.name}</span>
                </Link>
              ))
            ) : (
              <div className="px-2 py-2 text-[12px] text-text-tertiary">
                No boards yet
              </div>
            )}
          </div>
        </div>
      </div>

      <CreateBoardModal
        open={createBoardOpen}
        userId={userId ?? ""}
        onClose={() => setCreateBoardOpen(false)}
        onSuccess={handleCreateBoardSuccess}
      />
      */}
    </div>
  );
}
