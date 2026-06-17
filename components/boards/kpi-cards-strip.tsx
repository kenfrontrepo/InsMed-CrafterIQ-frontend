"use client";

import { memo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2, TrendingUp, TrendingDown, Minus, X } from "lucide-react";
import type { Pin } from "./pin-card";
import type { KpiMetric } from "@/components/ui/kpi-card";
import { bulkUnassignPins } from "@/lib/api/pinsApi";

interface KpiCardsStripProps {
  pins: Pin[];
  isWriteMode: boolean;
  boardId?: string;
  userId?: string;
}

function formatLargeNumber(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1e12) return (value / 1e12).toFixed(1).replace(/\.0$/, "") + "T";
  if (abs >= 1e9) return (value / 1e9).toFixed(1).replace(/\.0$/, "") + "B";
  if (abs >= 1e6) return (value / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
  if (abs >= 1e3) return (value / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
  return value.toLocaleString();
}

function KpiPinCard({
  pin,
  isWriteMode,
  boardId,
  userId,
}: {
  pin: Pin;
  isWriteMode: boolean;
  boardId?: string;
  userId?: string;
}) {
  const queryClient = useQueryClient();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const spec = pin.visualSpec as unknown as Record<string, unknown> | undefined;
  const raw = spec?.metrics ?? spec?.metric;
  const metrics: KpiMetric[] = !raw
    ? []
    : Array.isArray(raw)
      ? (raw as KpiMetric[])
      : [raw as KpiMetric];

  const deleteMutation = useMutation({
    mutationFn: () =>
      bulkUnassignPins(userId!, boardId!, [pin.id]),
    onSuccess: () => {
      setShowDeleteConfirm(false);
      queryClient.invalidateQueries({ queryKey: ["board-data"] });
    },
  });

  if (metrics.length === 0) return null;

  return (
    <>
      {metrics.map((metric) => {
        const hasDelta = metric.delta !== null && metric.delta !== undefined;
        const isIncrease = metric.delta_type === "increase";
        const isDecrease = metric.delta_type === "decrease";

        return (
          <div
            key={metric.label}
            className="group/metric relative shrink-0  border hover:shadow-md min-w-[200px] rounded-xl bg-linear-to-br from-white to-gray-50/80 px-5 py-6   flex flex-col gap-2 transition-all "
          >
            {isWriteMode && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="absolute top-2 right-2 p-0.5 rounded-full opacity-0 group-hover/metric:opacity-100 text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all"
              >
                <X className="h-3 w-3" />
              </button>
            )}
            <span className="text-[11px] font-medium text-gray-600 truncate pr-3">
              {metric.label}
            </span>
            <div className="flex items-baseline mt-2 gap-2">
              <span className="text-[22px] font-semibold text-gray-900 leading-none tracking-tight whitespace-nowrap">
                {metric.display_value || (Number.isFinite(metric.value) ? formatLargeNumber(metric.value) : "")}
              </span>
              {hasDelta && (
                <span
                  className={`inline-flex items-center gap-0.5 text-[11px] font-medium ${
                    isIncrease
                      ? "text-emerald-500"
                      : isDecrease
                        ? "text-red-400"
                        : "text-gray-400"
                  }`}
                >
                  {isIncrease ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : isDecrease ? (
                    <TrendingDown className="h-3 w-3" />
                  ) : (
                    <Minus className="h-3 w-3" />
                  )}
                  {Math.abs(metric.delta!)}%
                </span>
              )}
            </div>
          </div>
        );
      })}

      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {showDeleteConfirm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                onClick={() =>
                  !deleteMutation.isPending && setShowDeleteConfirm(false)
                }
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                      <Trash2 className="h-5 w-5 text-red-600" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Delete KPI card?
                    </h2>
                  </div>
                  <p className="text-sm text-gray-500 mb-6">
                    This will remove{" "}
                    <span className="font-medium text-gray-700">
                      {pin.title}
                    </span>{" "}
                    from the board. This action cannot be undone.
                  </p>
                  <div className="flex items-center justify-end gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={deleteMutation.isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteMutation.mutate()}
                      disabled={deleteMutation.isPending}
                    >
                      {deleteMutation.isPending ? (
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                      )}
                      Delete
                    </Button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}

export const KpiCardsStrip = memo(function KpiCardsStrip({
  pins,
  isWriteMode,
  boardId,
  userId,
}: KpiCardsStripProps) {
  if (pins.length === 0) return null;

  return (
    <div className="flex flex-row gap-4 overflow-x-auto pb-3 scrollbar-hide">
      {pins.map((pin) => (
        <KpiPinCard
          key={pin.id}
          pin={pin}
          isWriteMode={isWriteMode}
          boardId={boardId}
          userId={userId}
        />
      ))}
    </div>
  );
});
