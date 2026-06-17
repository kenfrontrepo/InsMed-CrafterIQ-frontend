"use client";

import { useState, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Pin, RefreshCw, AlertCircle } from "lucide-react";
import { useUserId } from "@/hooks/use-user-id";
import {
  PinCard,
  PinCardSkeleton,
  PinDetailsDialog,
  DeleteDialog,
  EditDialog,
  ShareDialog,
  fetchPins,
  deletePin,
  updatePin,
  type PinItem,
} from "@/components/pins";

export default function AllPinsPage() {
  const queryClient = useQueryClient();
  const { userId } = useUserId();

  const {
    data: pins = [],
    isLoading,
    isError,
    error,
    refetch,
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
    mutationFn: ({
      pinId,
      title,
      tags,
    }: {
      pinId: string;
      title: string;
      tags: string;
    }) => updatePin(pinId, userId!, title, tags),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-pins", userId] });
      setPinToEdit(null);
    },
  });

  const handleDeleteClick = useCallback((pin: PinItem) => {
    setPinToDelete(pin);
  }, []);

  const handleEditClick = useCallback((pin: PinItem) => {
    setPinToEdit(pin);
  }, []);

  const handleShareClick = useCallback((pin: PinItem) => {
    setPinToShare(pin);
  }, []);

  const handleDetailsClick = useCallback((pin: PinItem) => {
    setPinToView(pin);
  }, []);

  return (
    <div className="h-full overflow-auto">
      {/* Delete Confirmation Dialog */}
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

      {/* Edit Dialog */}
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

      {/* Share Dialog */}
      <AnimatePresence>
        {pinToShare && userId && (
          <ShareDialog
            pin={pinToShare}
            userId={userId}
            onClose={() => setPinToShare(null)}
          />
        )}
      </AnimatePresence>

      {/* Details Dialog */}
      <AnimatePresence>
        {pinToView && (
          <PinDetailsDialog
            pin={pinToView}
            onClose={() => setPinToView(null)}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="bg-card border-b border-border-subtle px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-text-primary">All Pins</h1>
            <p className="text-sm text-text-tertiary mt-0.5">
              {isLoading ? "Loading..." : `${pins.length} pins saved`}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="p-6">
        {isError && (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-6 w-6 text-red-500" />
            </div>
            <h3 className="text-lg font-medium text-text-primary mb-1">
              Failed to load pins
            </h3>
            <p className="text-sm text-text-secondary max-w-sm mb-4">
              {error instanceof Error
                ? error.message
                : "Something went wrong"}
            </p>
            <Button variant="outline" onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        )}

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(8)].map((_, i) => (
              <PinCardSkeleton key={i} />
            ))}
          </div>
        )}

        {!isLoading && !isError && pins.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pins.map((pin, index) => (
              <PinCard
                key={pin.id}
                pin={pin}
                index={index}
                onEdit={handleEditClick}
                onDelete={handleDeleteClick}
                onShare={handleShareClick}
                onDetails={handleDetailsClick}
              />
            ))}
          </div>
        )}

        {!isLoading && !isError && pins.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 bg-hover rounded-full flex items-center justify-center mb-4">
              <Pin className="h-6 w-6 text-text-tertiary" />
            </div>
            <h3 className="text-lg font-medium text-text-primary mb-1">
              No pins yet
            </h3>
            <p className="text-sm text-text-secondary max-w-sm">
              Pin charts and insights from your conversations to save them here
              for quick access.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
