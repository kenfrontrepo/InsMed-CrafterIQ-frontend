import type { PinListItem } from "@/lib/api/pinsApi";

export type PinResponseType = "note" | "chart" | "table" | "alert";

export interface PinItem extends PinListItem {
  response_type: PinResponseType;
}

export interface PinsApiResponse {
  status: boolean;
  pins: PinItem[];
  total: number;
}
