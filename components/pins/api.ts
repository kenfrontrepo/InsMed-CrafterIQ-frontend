import type { PinItem, PinsApiResponse } from "./types";
import {
  fetchPins as apiFetchPins,
  deletePin as apiDeletePin,
  updatePin as apiUpdatePin,
} from "@/lib/api/pinsApi";

export async function fetchPins(userId: string): Promise<PinItem[]> {
  const data: PinsApiResponse = await apiFetchPins(userId);
  return data.pins || [];
}

export async function deletePin(pinId: string, userId: string): Promise<void> {
  await apiDeletePin(pinId, userId);
}

export async function updatePin(
  pinId: string,
  userId: string,
  title: string,
  pinTags: string
): Promise<void> {
  await apiUpdatePin(pinId, userId, title, pinTags);
}
