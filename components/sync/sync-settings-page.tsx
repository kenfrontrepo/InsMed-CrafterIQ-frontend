"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  RefreshCw,
  CalendarDays,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
} from "lucide-react";
import {
  getSyncStatus,
  saveSyncSchedule,
  triggerSyncNow,
  type SyncLog,
} from "@/lib/api/syncApi";
import { formatDistanceToNow, format } from "date-fns";
import { toast } from "sonner";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 15, 30, 45];

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return "Never";
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch {
    return "Unknown";
  }
}

function logTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const timeStr = format(d, "h:mm a");
    if (d.toDateString() === now.toDateString()) return `Today, ${timeStr}`;
    if (d.toDateString() === yesterday.toDateString()) return `Yesterday, ${timeStr}`;
    return format(d, "MMM d, yyyy");
  } catch {
    return dateStr;
  }
}

function logMessage(log: SyncLog): string {
  let msg = log.message || "Sync completed";
  if (log.records_updated > 0)
    msg += ` — ${log.records_updated.toLocaleString()} records updated`;
  if (log.conflicts_skipped > 0)
    msg += ` — ${log.conflicts_skipped} conflicts skipped`;
  return msg;
}

export function SyncSettingsPage() {
  const queryClient = useQueryClient();
  const [frequency, setFrequency] = useState<"" | "daily">("");
  const [hour, setHour] = useState("3");
  const [minute, setMinute] = useState("0");
  const [clearedAt, setClearedAt] = useState<Date | null>(null);
  const [initialized, setInitialized] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["sync-status"],
    queryFn: getSyncStatus,
    refetchInterval: 30_000,
  });

  // Seed form from API on first load
  useEffect(() => {
    if (!data || initialized) return;
    if (data.schedule?.frequency === "daily") {
      setFrequency("daily");
      const t = data.schedule.time;
      if (t && t !== "string" && t.includes(":")) {
        const [h, m] = t.split(":");
        setHour(String(parseInt(h, 10)));
        setMinute(String(parseInt(m, 10)));
      }
    }
    setInitialized(true);
  }, [data, initialized]);

  const saveMutation = useMutation({
    mutationFn: saveSyncSchedule,
    onSuccess: () => {
      toast.success("Schedule saved");
      queryClient.invalidateQueries({ queryKey: ["sync-status"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail ?? "Failed to save schedule");
    },
  });

  const syncNowMutation = useMutation({
    mutationFn: triggerSyncNow,
    onSuccess: () => {
      toast.success("Sync triggered successfully");
      queryClient.invalidateQueries({ queryKey: ["sync-status"] });
    },
    onError: (err: any) => {
      if (err?.response?.status === 503) {
        toast.info("Sync queued — scheduler is starting");
      } else {
        toast.error(err?.response?.data?.detail ?? "Failed to trigger sync");
      }
    },
  });

  const visibleLogs = useMemo(() => {
    const logs = data?.logs ?? [];
    return clearedAt
      ? logs.filter((l) => new Date(l.started_at) > clearedAt)
      : logs;
  }, [data?.logs, clearedAt]);

  const scheduleLabel = useMemo(() => {
    if (frequency !== "daily") return "No schedule set";
    return `Daily at ${String(parseInt(hour, 10)).padStart(2, "0")}:${String(parseInt(minute, 10)).padStart(2, "0")} UTC`;
  }, [frequency, hour, minute]);

  const statusDot =
    data?.status === "running"
      ? "bg-blue-500 animate-pulse"
      : data?.status === "error"
        ? "bg-red-500"
        : "bg-green-500";

  const statusText =
    data?.status === "running" ? "Syncing…" :
    data?.status === "error"   ? "Error"    : "Idle";

  return (
    <div className="space-y-5 pb-8 w-full">
      {/* Header */}
      <div className="flex items-start gap-3 pb-5 border-b border-gray-200">
        {/* <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 shrink-0">
          <RefreshCw className="w-5 h-5 text-blue-600" />
        </div> */}
        <div>
          <h2 className="text-base font-semibold text-gray-900">Data sync</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {isLoading
              ? "Loading…"
              : data?.last_synced_at
                ? `Last synced ${relativeTime(data.last_synced_at)}`
                : "Never synced"}
          </p>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      )}

      {/* Error */}
      {isError && (
        <p className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
          Failed to load sync status. Please try again.
        </p>
      )}

      {!isLoading && !isError && data && (
        <>
          {/* Status cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
              <p className="text-xs font-medium text-gray-500 mb-1.5">Status</p>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full shrink-0 ${statusDot}`} />
                <span className="text-sm font-semibold text-gray-800">{statusText}</span>
              </div>
            </div>
            <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
              <p className="text-xs font-medium text-gray-500 mb-1.5">Next sync</p>
              <p className="text-sm font-semibold text-gray-800">
                {data.schedule?.next_sync_at
                  ? relativeTime(data.schedule.next_sync_at)
                  : "Not scheduled"}
              </p>
            </div>
          </div>

          {/* Schedule card */}
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-200">
              <CalendarDays className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-semibold text-gray-800">Schedule</span>
            </div>
            <div className="p-4 space-y-4">
              {/* Frequency */}
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">Frequency</label>
                <div className="relative">
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as "" | "daily")}
                    className="w-full appearance-none px-3 py-2 pr-9 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 cursor-pointer"
                  >
                    <option value="">— select frequency —</option>
                    <option value="daily">Daily</option>
                  </select>
                  <svg
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </div>
              </div>

              {/* Time picker — shown when daily is selected */}
              {frequency === "daily" && (
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">
                    Run at{" "}
                    <span className="text-gray-400 text-xs font-normal">(UTC)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <select
                        value={hour}
                        onChange={(e) => setHour(e.target.value)}
                        className="w-full appearance-none px-3 py-2 pr-8 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400"
                      >
                        {HOURS.map((h) => (
                          <option key={h} value={String(h)}>
                            {String(h).padStart(2, "0")}
                          </option>
                        ))}
                      </select>
                      <svg className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M6 9l6 6 6-6" /></svg>
                    </div>
                    <span className="text-gray-400 font-semibold text-base">:</span>
                    <div className="relative flex-1">
                      <select
                        value={minute}
                        onChange={(e) => setMinute(e.target.value)}
                        className="w-full appearance-none px-3 py-2 pr-8 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400"
                      >
                        {MINUTES.map((m) => (
                          <option key={m} value={String(m)}>
                            {String(m).padStart(2, "0")}
                          </option>
                        ))}
                      </select>
                      <svg className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M6 9l6 6 6-6" /></svg>
                    </div>
                  </div>
                </div>
              )}

              {/* Footer row */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-sm text-gray-500">{scheduleLabel}</span>
                <button
                  onClick={() =>
                    saveMutation.mutate({
                      hour: parseInt(hour, 10),
                      minute: parseInt(minute, 10),
                      enabled: frequency === "daily",
                    })
                  }
                  disabled={saveMutation.isPending}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-50 text-blue-700 text-sm font-medium hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saveMutation.isPending && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}
                  Save schedule
                </button>
              </div>
            </div>
          </div>

          {/* Sync log */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">Sync log</h3>
              {/* {visibleLogs.length > 0 && (
                <button
                  onClick={() => setClearedAt(new Date())}
                  className="text-sm text-gray-400 hover:text-gray-700 transition-colors"
                >
                  Clear
                </button>
              )} */}
            </div>

            {visibleLogs.length === 0 ? (
              <div className="rounded-xl border border-gray-100 px-4 py-8 text-center text-sm text-gray-400">
                No sync logs yet
              </div>
            ) : (
              <div className="rounded-xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
                {visibleLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 px-4 py-3">
                    {log.type === "success" ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                    ) : log.type === "warning" ? (
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm text-gray-800 leading-snug">
                        {logMessage(log)}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {logTime(log.started_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sync now */}
          <button
            onClick={() => syncNowMutation.mutate()}
            disabled={syncNowMutation.isPending || data.status === "running"}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-50 text-blue-700 font-medium text-sm hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {syncNowMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {syncNowMutation.isPending ? "Syncing…" : "Sync now"}
          </button>
        </>
      )}
    </div>
  );
}
