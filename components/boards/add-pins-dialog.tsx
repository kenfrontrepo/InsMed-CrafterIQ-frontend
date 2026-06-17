"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Check,
  LoaderIcon,
  BarChart3,
  FileText,
  Bell,
  Calendar,
  X,
  Pin,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";
import { fetchPins as apiFetchAllPins } from "@/lib/api/pinsApi";
import { bulkAssignPins } from "@/lib/api/pinsApi";

interface PinBoard {
  board_id: string;
  board_name: string;
}

interface PinItem {
  id: string;
  board_id: string | null;
  boards: PinBoard[];
  conversation_id: string;
  message_id: string;
  response_type: "note" | "chart" | "alert";
  title: string;
  is_refreshable: boolean;
  last_refreshed_at: string;
  refresh_count: number;
  created_at: string;
  pin_tags: string | null;
  schema_name: string;
  chart_type: string | null;
}

interface AddPinsDialogProps {
  open: boolean;
  boardId: string;
  boardName: string;
  userId: string;
  existingPinIds: string[];
  onClose: () => void;
  onSuccess: () => void;
}

function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString();
}

function getTypeIcon(responseType: PinItem["response_type"]) {
  switch (responseType) {
    case "chart":
      return { icon: BarChart3, bgColor: "bg-blue-50", textColor: "text-blue-500" };
    case "alert":
      return { icon: Bell, bgColor: "bg-red-50", textColor: "text-red-500" };
    case "note":
    default:
      return { icon: FileText, bgColor: "bg-amber-50", textColor: "text-amber-500" };
  }
}

export function AddPinsDialog({
  open,
  boardId,
  boardName,
  userId,
  existingPinIds,
  onClose,
  onSuccess,
}: AddPinsDialogProps) {
  const [allPins, setAllPins] = useState<PinItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isFetchingPins, setIsFetchingPins] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasFetched, setHasFetched] = useState(false);

  const fetchAllPins = useCallback(async () => {
    setIsFetchingPins(true);
    try {
      const data = await apiFetchAllPins(userId);
      setAllPins(data.pins || []);
      setHasFetched(true);
    } catch (error) {
      console.error("Error fetching pins:", error);
      toast.error("Failed to load pins");
    } finally {
      setIsFetchingPins(false);
    }
  }, [userId]);

  // Fetch pins when dialog opens
  const [didFetch, setDidFetch] = useState(false);
  if (open && !didFetch) {
    setDidFetch(true);
    fetchAllPins();
  }
  if (!open && didFetch) {
    setDidFetch(false);
    setHasFetched(false);
    setAllPins([]);
    setSelectedIds(new Set());
    setSearchQuery("");
  }

  // Filter out pins already on this board, and apply search
  const availablePins = useMemo(() => {
    const existingSet = new Set(existingPinIds);
    return allPins
      .filter((pin) => !existingSet.has(pin.id))
      .filter((pin) =>
        searchQuery
          ? pin.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (pin.pin_tags?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
          : true
      );
  }, [allPins, existingPinIds, searchQuery]);

  const togglePin = useCallback((pinId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(pinId)) {
        next.delete(pinId);
      } else {
        next.add(pinId);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === availablePins.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(availablePins.map((p) => p.id)));
    }
  }, [availablePins, selectedIds.size]);

  const handleAssign = useCallback(async () => {
    if (selectedIds.size === 0) return;
    setIsAssigning(true);
    try {
      await bulkAssignPins(userId, Array.from(selectedIds), boardId);
      toast.success(`${selectedIds.size} pin${selectedIds.size > 1 ? "s" : ""} added to board`);
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error assigning pins:", error);
      toast.error("Failed to add pins to board");
    } finally {
      setIsAssigning(false);
    }
  }, [selectedIds, boardId, userId, onSuccess, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => !isAssigning && onClose()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 flex flex-col max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-mid">
              <div>
                <h2 className="text-lg font-semibold text-text-primary">
                  Add Pins
                </h2>
                <p className="text-xs text-text-tertiary mt-0.5">
                  Select pins to add to &ldquo;{boardName}&rdquo;
                </p>
              </div>
              <button
                onClick={onClose}
                disabled={isAssigning}
                className="p-1.5 hover:bg-hover rounded-lg transition-colors"
              >
                <X className="h-4 w-4 text-text-tertiary" />
              </button>
            </div>

            {/* Search */}
            <div className="px-5 pt-3 pb-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
                <Input
                  placeholder="Search pins..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Select all */}
            {hasFetched && availablePins.length > 0 && (
              <div className="px-5 py-2 flex items-center justify-between">
                <button
                  onClick={handleSelectAll}
                  className="text-xs font-medium text-text-primary hover:underline"
                >
                  {selectedIds.size === availablePins.length
                    ? "Deselect all"
                    : `Select all (${availablePins.length})`}
                </button>
                {selectedIds.size > 0 && (
                  <span className="text-xs text-text-tertiary">
                    {selectedIds.size} selected
                  </span>
                )}
              </div>
            )}

            {/* Pin list */}
            <div className="flex-1 overflow-auto px-3 pb-2 min-h-0">
              {isFetchingPins ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <LoaderIcon className="h-6 w-6 animate-spin text-text-tertiary mb-2" />
                  <p className="text-sm text-text-tertiary">Loading pins...</p>
                </div>
              ) : availablePins.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-12 h-12 bg-hover rounded-full flex items-center justify-center mb-3">
                    <Pin className="h-5 w-5 text-text-tertiary" />
                  </div>
                  <p className="text-sm font-medium text-text-secondary">
                    {searchQuery
                      ? "No matching pins found"
                      : "All pins are already on this board"}
                  </p>
                  <p className="text-xs text-text-tertiary mt-1">
                    {searchQuery
                      ? "Try a different search term"
                      : "Create new pins from your conversations"}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {availablePins.map((pin) => {
                    const isSelected = selectedIds.has(pin.id);
                    const typeConfig = getTypeIcon(pin.response_type);
                    const TypeIcon = typeConfig.icon;
                    const tags = pin.pin_tags
                      ?.split(",")
                      .map((t) => t.trim())
                      .filter(Boolean) || [];

                    return (
                      <button
                        key={pin.id}
                        onClick={() => togglePin(pin.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                          isSelected
                            ? "bg-text-primary/5 border border-text-primary/20"
                            : "hover:bg-hover border border-transparent"
                        }`}
                      >
                        {/* Checkbox */}
                        <div
                          className={`shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                            isSelected
                              ? "bg-text-primary border-text-primary"
                              : "border-border-mid"
                          }`}
                        >
                          {isSelected && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </div>

                        

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-text-primary truncate">
                              {pin.title}
                            </p>
                            {pin.chart_type === "kpi_card" && (
                              <span className="text-[10px] text-amber-700 bg-amber-100 border border-amber-300 rounded px-2 py-0.5 font-semibold uppercase tracking-wide truncate max-w-[120px]">
                                KPI
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-text-tertiary flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {getRelativeTime(pin.created_at)}
                            </span>
                            {tags.length > 0 && (
                              <span className="text-[10px] text-purple-500 bg-purple-50 px-1.5 py-0.5 rounded-full truncate max-w-[120px]">
                                {tags.join(", ")}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Disclaimer */}
            <div className="flex items-center gap-2 px-5 py-2 bg-amber-50 border-t border-amber-100">
              <TriangleAlert className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              <p className="text-[11px] text-amber-700">
                Each board can contain a maximum of 20 pins. Please ensure your selection does not exceed this limit.
              </p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-border-mid">
              <Button
                variant="secondary"
                size="sm"
                onClick={onClose}
                disabled={isAssigning}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleAssign}
                disabled={selectedIds.size === 0 || isAssigning}
              >
                {isAssigning && (
                  <LoaderIcon className="h-4 w-4 animate-spin mr-2" />
                )}
                Add {selectedIds.size > 0 ? `${selectedIds.size} ` : ""}Pin
                {selectedIds.size !== 1 ? "s" : ""}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
