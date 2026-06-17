import { api } from "./axios";

export interface SyncLog {
  id: string;
  type: "success" | "warning" | "error";
  message: string;
  records_updated: number;
  conflicts_skipped: number;
  trigger: "scheduled" | "manual";
  started_at: string;
  completed_at: string;
}

export interface SyncSchedule {
  frequency: string;
  time: string;
  days: string[];
  next_sync_at: string | null;
}

export interface SyncStatus {
  status: "idle" | "running" | "error";
  last_synced_at: string | null;
  schedule: SyncSchedule | null;
  logs: SyncLog[];
}

export interface SyncSchedulePayload {
  hour: number;
  minute: number;
  enabled: boolean;
}

export async function getSyncStatus(): Promise<SyncStatus> {
  const res = await api.get("/crafteriq/pipeline/history", {
    params: { limit: 10 },
  });
  return res.data;
}

export async function saveSyncSchedule(
  payload: SyncSchedulePayload
): Promise<unknown> {
  const res = await api.post("/crafteriq/pipeline/sync/schedule", payload);
  return res.data;
}

export async function triggerSyncNow(): Promise<unknown> {
  const res = await api.post("/crafteriq/pipeline/run");
  return res.data;
}
