"use client";

import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Bell,
  X,
  Trash2,
  Plus,
  Loader2,
  Lightbulb,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  fetchAlerts,
  fetchAlertSuggestions,
  createAlert,
  toggleAlert,
  deleteAlert,
} from "@/lib/api/alertsApi";

interface Alert {
  alert_id: string;
  alert_type: string;
  name: string;
  description: string;
  is_active: boolean;
}

interface Suggestion {
  name: string;
  description: string;
}

interface AlertsPanelProps {
  open: boolean;
  onClose: () => void;
  pinId: string;
  boardId: string;
  userId: string;
  pinTitle?: string;
}

export function AlertsPanel({
  open,
  onClose,
  pinId,
  boardId,
  userId,
  pinTitle,
}: AlertsPanelProps) {
  const queryClient = useQueryClient();
  const alertsQueryKey = ["pin-alerts", userId, pinId, boardId];
  const suggestionsQueryKey = ["alert-suggestions", userId, pinId, boardId];

  const [newAlertMessage, setNewAlertMessage] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [needInfoMessage, setNeedInfoMessage] = useState<string | null>(null);

  const {
    data: alertsData,
    isLoading: alertsLoading,
  } = useQuery({
    queryKey: alertsQueryKey,
    queryFn: () => fetchAlerts(userId, pinId, boardId),
    enabled: open,
  });

  const {
    data: suggestionsData,
    isLoading: suggestionsLoading,
  } = useQuery({
    queryKey: suggestionsQueryKey,
    queryFn: () => fetchAlertSuggestions(userId, pinId, boardId),
    enabled: open && (showSuggestions || (!!alertsData && (alertsData.alerts ?? []).length === 0)),
  });

  const alerts: Alert[] = alertsData?.status ? alertsData.alerts ?? [] : [];
  const allSuggestions: Suggestion[] = suggestionsData?.status
    ? suggestionsData.suggestions ?? []
    : [];

  const alertNames = useMemo(
    () => new Set(alerts.map((a) => a.name.toLowerCase())),
    [alerts]
  );
  const suggestions = useMemo(
    () => allSuggestions.filter((s) => !alertNames.has(s.name.toLowerCase())),
    [allSuggestions, alertNames]
  );

  const hasAlerts = !alertsLoading && alerts.length >= 1;

  const createMutation = useMutation({
    mutationFn: (message: string) =>
      createAlert(userId, { pin_id: pinId, board_id: boardId, message }),
    onSuccess: (data) => {
      if (data?.action === "need_info") {
        setNeedInfoMessage(data.message || "Please provide more details for this alert.");
        return;
      }
      setNeedInfoMessage(null);
      toast.success("Alert created");
      setNewAlertMessage("");
      queryClient.invalidateQueries({ queryKey: alertsQueryKey });
    },
    onError: (err: Error) => {
      setNeedInfoMessage(null);
      try {
        const parsed = JSON.parse(err.message);
        toast.error(parsed.error || "Failed to create alert");
      } catch {
        toast.error("Failed to create alert");
      }
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ alertId, isActive }: { alertId: string; isActive: boolean }) =>
      toggleAlert(alertId, userId, isActive),
    onMutate: async ({ alertId, isActive }) => {
      await queryClient.cancelQueries({ queryKey: alertsQueryKey });
      const previous = queryClient.getQueryData(alertsQueryKey);
      queryClient.setQueryData(alertsQueryKey, (old: typeof alertsData) => {
        if (!old?.alerts) return old;
        return {
          ...old,
          alerts: old.alerts.map((a: Alert) =>
            a.alert_id === alertId ? { ...a, is_active: isActive } : a
          ),
        };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(alertsQueryKey, context.previous);
      }
      toast.error("Failed to toggle alert");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (alertId: string) => deleteAlert(alertId, userId),
    onSuccess: (data) => {
      toast.success(data.message || "Alert deleted");
      queryClient.invalidateQueries({ queryKey: alertsQueryKey });
    },
    onError: (err: Error) => {
      try {
        const parsed = JSON.parse(err.message);
        toast.error(parsed.error || "Failed to delete alert");
      } catch {
        toast.error("Failed to delete alert");
      }
    },
  });

  const handleCreateFromInput = useCallback(() => {
    const trimmed = newAlertMessage.trim();
    if (!trimmed) return;
    createMutation.mutate(trimmed);
  }, [newAlertMessage, createMutation]);

  const handleCreateFromSuggestion = useCallback(
    (suggestion: Suggestion) => {
      setNewAlertMessage(suggestion.name);
      createMutation.mutate(suggestion.name);
    },
    [createMutation]
  );

  const handleToggle = useCallback(
    (alertId: string, currentActive: boolean) => {
      toggleMutation.mutate({ alertId, isActive: !currentActive });
    },
    [toggleMutation]
  );

  const handleDelete = useCallback(
    (alertId: string) => {
      deleteMutation.mutate(alertId);
    },
    [deleteMutation]
  );

  const handleCancel = useCallback(() => {
    setNewAlertMessage("");
    onClose();
  }, [onClose]);

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()} direction="right">
      <DrawerContent className="h-full w-[420px] sm:max-w-[420px] rounded-none">
        <DrawerHeader className="flex flex-col gap-1 border-b px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <DrawerTitle className="text-base">Alerts</DrawerTitle>
            </div>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon-sm">
                <X className="h-4 w-4" />
              </Button>
            </DrawerClose>
          </div>
          {pinTitle && (
            <p className="text-xs text-gray-500 truncate pl-7">
              {pinTitle}
            </p>
          )}
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          {/* ── Create Alert ─────────────────────────── */}
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Create Alert
            </h3>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Alert message
              </label>
              <Input
                className="placeholder:text-muted-foreground/50"
                placeholder="e.g. Alert when spend exceeds $30M"
                value={newAlertMessage}
                onChange={(e) => { setNewAlertMessage(e.target.value); setNeedInfoMessage(null); }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateFromInput();
                }}
              />
              <p className="text-xs text-gray-400">
                Describe the condition you want to be alerted about.
              </p>
              {needInfoMessage && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 mt-1">
                  <Lightbulb className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 leading-relaxed">{needInfoMessage}</p>
                </div>
              )}
            </div>
          </section>

          {/* ── Active Alerts ────────────────────────── */}
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Your Alerts
            </h3>

            {alertsLoading ? (
              <div className="space-y-3">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="rounded-lg border p-4 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                ))}
              </div>
            ) : alerts.length === 0 ? (
              <div className="text-center py-6 border rounded-lg bg-gray-50/50">
                <Bell className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No alerts yet</p>
                <p className="text-xs text-gray-400 mt-1">
                  Create one above or pick from suggestions below
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div
                    key={alert.alert_id}
                    className="rounded-lg border border-gray-200 p-4 transition-colors hover:border-gray-300"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {alert.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {alert.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Switch
                          size="sm"
                          checked={alert.is_active}
                          onCheckedChange={() =>
                            handleToggle(alert.alert_id, alert.is_active)
                          }
                        />
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          className="text-gray-400 hover:text-red-600"
                          onClick={() => handleDelete(alert.alert_id)}
                          disabled={deleteMutation.isPending}
                        >
                          {deleteMutation.isPending &&
                          deleteMutation.variables === alert.alert_id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ── Suggestions ──────────────────────────── */}
          {hasAlerts && !showSuggestions ? (
            <button
              onClick={() => setShowSuggestions(true)}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg border border-dashed border-gray-300 text-sm text-gray-500 hover:border-primary/40 hover:text-primary transition-colors"
            >
              <Lightbulb className="h-4 w-4" />
              Need suggestions?
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          ) : (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Suggested Alerts
                </h3>
                {hasAlerts && (
                  <button
                    onClick={() => setShowSuggestions(false)}
                    className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
                  >
                    Hide
                    <ChevronUp className="h-3 w-3" />
                  </button>
                )}
              </div>

              {suggestionsLoading ? (
                <div className="flex flex-col items-center justify-center py-8 gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                  <p className="text-xs text-gray-400">Loading suggestions…</p>
                </div>
              ) : suggestions.length === 0 ? (
                <div className="text-center py-6 border rounded-lg bg-gray-50/50">
                  <Lightbulb className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">
                    {allSuggestions.length > 0
                      ? "All suggestions have been added"
                      : "No suggestions available"}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {suggestions.map((suggestion, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-gray-200 p-4 transition-colors hover:border-gray-300 cursor-pointer"
                      onClick={() => setNewAlertMessage(suggestion.name)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {suggestion.name}
                          </p>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-3">
                            {suggestion.description}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="shrink-0 gap-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCreateFromSuggestion(suggestion);
                          }}
                          disabled={createMutation.isPending}
                        >
                          {createMutation.isPending &&
                          createMutation.variables === suggestion.name ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Plus className="h-3.5 w-3.5" />
                          )}
                          Add
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>

        {/* ── Footer: Cancel / Add Alert ─────────────── */}
        <DrawerFooter className="border-t px-5 py-4 flex flex-row items-center justify-end gap-3">
          <Button variant="outline" size="sm" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleCreateFromInput}
            disabled={!newAlertMessage.trim() || createMutation.isPending}
          >
            {createMutation.isPending ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Plus className="mr-1.5 h-3.5 w-3.5" />
            )}
            Add alert
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
