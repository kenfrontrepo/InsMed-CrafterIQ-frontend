export interface PinBoard {
  board_id: string;
  board_name: string;
}

export interface PinItem {
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
}

export interface PinsApiResponse {
  status: boolean;
  pins: PinItem[];
}
