import type { PinItem, PinsApiResponse } from "./types";
import {
  fetchPins as apiFetchPins,
  deletePin as apiDeletePin,
  updatePin as apiUpdatePin,
  type UpdatePinRequest,
} from "@/lib/api/pinsApi";

export async function fetchPins(userId: string): Promise<PinItem[]> {
  const data = await apiFetchPins(userId);
  if (!data.status) return [];
  return (data.pins ?? []) as PinItem[];
}

export async function deletePin(pinId: string, userId: string): Promise<void> {
  const data = await apiDeletePin(pinId, userId);
  if (!data.status) {
    throw new Error(data.error || data.message || "Failed to delete pin");
  }
}

export async function updatePin(
  pinId: string,
  userId: string,
  title: string,
  pinTags: string
): Promise<void> {
  const body: UpdatePinRequest = {
    title: title || null,
    pin_tags: pinTags || null,
  };
  const data = await apiUpdatePin(pinId, userId, body);
  if (!data.status) {
    throw new Error(data.error || data.message || "Failed to update pin");
  }
}
