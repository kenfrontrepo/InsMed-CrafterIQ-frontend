"use client";

import { useState, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUserId } from "@/hooks/use-user-id";
import {
  PinDetailsDialog,
  DeleteDialog,
  EditDialog,
  ShareDialog,
  fetchPins,
  deletePin,
  updatePin,
  type PinItem,
} from "@/components/pins";

function PinnedCard({
  pin,
  onClick,
}: {
  pin: PinItem;
  onClick: () => void;
}) {
  const typeLabel = pin.response_type?.toUpperCase() ?? "NOTE";
  const tags = pin.pin_tags || "";

  return (
    <button
      onClick={onClick}
      className="shrink-0 w-[200px] bg-page border border-border-subtle rounded-[10px] px-3 py-2.5 cursor-pointer text-left transition-colors hover:border-border-strong"
    >
      <div className="text-[10px] text-text-tertiary mb-1 tracking-wide uppercase">
        {typeLabel}{tags ? ` · ${tags}` : ""}
      </div>
      <div className="text-xs font-medium text-text-primary leading-snug mb-1.5 line-clamp-2">
        {pin.title}
      </div>
      {/* {pin.response_type === "chart" && (
        <div className="h-8 rounded flex items-end gap-[3px] pt-1">
          {[65, 80, 45, 55, 90, 40].map((h, i) => (
            <div
              key={i}
              className={`flex-1 rounded-t-sm ${h > 60 ? "bg-text-primary" : "bg-border-subtle"}`}
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      )} */}
      {pin.response_type === "alert" && (
        <div className="mt-1.5 text-[11px] text-[#92580A] bg-[#FEF3E2] px-[7px] py-1 rounded">
          Alert · Refreshes on update
        </div>
      )}
    </button>
  );
}

export function ChatPinsDrawer() {
  const queryClient = useQueryClient();
  const { userId } = useUserId();
  const [open, setOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");

  const {
    data: pins = [],
    isLoading,
  } = useQuery({
    queryKey: ["all-pins", userId],
    queryFn: () => fetchPins(userId!),
    enabled: !!userId,
  });

  const [pinToDelete, setPinToDelete] = useState<PinItem | null>(null);
  const [pinToEdit, setPinToEdit] = useState<PinItem | null>(null);
  const [pinToShare, setPinToShare] = useState<PinItem | null>(null);
  const [pinToView, setPinToView] = useState<PinItem | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (pinId: string) => deletePin(pinId, userId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-pins", userId] });
      setPinToDelete(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ pinId, title, tags }: { pinId: string; title: string; tags: string }) =>
      updatePin(pinId, userId!, title, tags),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-pins", userId] });
      setPinToEdit(null);
    },
  });

  const handleDetailsClick = useCallback((pin: PinItem) => {
    setPinToView(pin);
  }, []);

  const filters = ["All", "Charts", "Notes", "Alerts"];

  const filteredPins = pins.filter((pin) => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Charts") return pin.response_type === "chart";
    if (activeFilter === "Notes") return pin.response_type === "note";
    if (activeFilter === "Alerts") return pin.response_type === "alert";
    return true;
  });

  if (pins.length === 0 && !isLoading) return null;

  return (
    <>
      {/* Pinned bar — always visible 40px handle in flex flow */}
      <div className="shrink-0 relative z-20">
        {/* Expanded content — overlays upward */}
        {open && (
          <div className="absolute bottom-full left-0 right-0 bg-card border-t border-border-mid shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
            {/* Filter row */}
            <div className="flex gap-1.5 px-5 py-2 border-b border-border-subtle">
              {filters.map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`text-[11px] px-2.5 py-[3px] border rounded-full transition-colors cursor-pointer ${
                    activeFilter === f
                      ? "bg-text-primary text-white border-text-primary"
                      : "bg-transparent text-text-secondary border-border-mid hover:bg-hover"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Pin cards — wrap to rows; scroll vertically if needed */}
            <div className="flex flex-wrap gap-2.5 px-5 py-2.5 pb-4 max-h-[min(45vh,360px)] overflow-y-auto scrollbar-hide content-start">
              {isLoading ? (
                <>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="shrink-0 w-[200px] h-[100px] bg-hover rounded-[10px] animate-pulse" />
                  ))}
                </>
              ) : filteredPins.length > 0 ? (
                filteredPins.map((pin) => (
                  <PinnedCard
                    key={pin.id}
                    pin={pin}
                    onClick={() => handleDetailsClick(pin)}
                  />
                ))
              ) : (
                <div className="w-full text-xs text-text-tertiary py-4 px-2">
                  No {activeFilter.toLowerCase()} pins found
                </div>
              )}
            </div>
          </div>
        )}

        {/* Handle bar */}
        <div className="flex items-center h-10 bg-card border-t border-border-mid">
          {/* Pinned insights toggle */}
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-2 flex-1 px-4 h-full cursor-pointer select-none text-left"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M8 2v1M8 13v1M2 8h1M13 8h1M4.2 4.2l.7.7M11.1 11.1l.7.7M4.2 11.8l.7-.7M11.1 4.9l.7-.7"/>
              <circle cx="8" cy="8" r="3"/>
            </svg>
            <span className="text-xs font-medium text-text-secondary">Pinned insights</span>
            <span className="text-[10px] font-medium bg-page border border-border-mid rounded-[10px] px-[7px] py-px text-text-tertiary">
              {isLoading ? "…" : pins.length}
            </span>
            <span
              className="ml-auto text-[10px] text-text-tertiary transition-transform duration-200"
              style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
            >
              ▲
            </span>
          </button>
        </div>
      </div>

      {/* Dialogs */}
      <AnimatePresence>
        {pinToDelete && (
          <DeleteDialog
            pin={pinToDelete}
            isPending={deleteMutation.isPending}
            onClose={() => setPinToDelete(null)}
            onConfirm={() => deleteMutation.mutate(pinToDelete.id)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {pinToEdit && (
          <EditDialog
            pin={pinToEdit}
            isPending={updateMutation.isPending}
            onClose={() => setPinToEdit(null)}
            onSave={(title, tags) =>
              updateMutation.mutate({ pinId: pinToEdit.id, title, tags })
            }
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {pinToShare && userId && (
          <ShareDialog
            pin={pinToShare}
            userId={userId}
            onClose={() => setPinToShare(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {pinToView && (
          <PinDetailsDialog
            pin={pinToView}
            onClose={() => setPinToView(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
