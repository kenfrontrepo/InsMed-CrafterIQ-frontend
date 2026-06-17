"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import type { PinItem } from "./types";

interface DeleteDialogProps {
  pin: PinItem;
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteDialog({
  pin,
  isPending,
  onClose,
  onConfirm,
}: DeleteDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => !isPending && onClose()}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <Trash2 className="h-5 w-5 text-red-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Remove Pin</h2>
        </div>
        <p className="text-sm text-gray-600 mb-2">
          Are you sure you want to remove this pin?
        </p>
        <p className="text-sm font-medium text-gray-800 bg-gray-50 p-3 rounded-lg mb-6 line-clamp-2">
          {pin.title}
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            )}
            Remove
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
