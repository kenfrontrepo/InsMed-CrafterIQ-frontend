export interface Board {
  id: string;
  name: string;
  description: string;
  created_at: string;
  filter_status: string;
  pin_count: number;
  board_tags: string | null;
  schema_name?: string;
}

export interface BoardsApiResponse {
  status: boolean;
  boards: Board[];
  total: number;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffInDays === 0) return "Today";
  if (diffInDays === 1) return "Yesterday";
  if (diffInDays < 7) return `${diffInDays} days ago`;
  return formatDate(dateString);
}

export async function fetchBoards(userId: string): Promise<Board[]> {
  const { fetchBoards: apiFetchBoards } = await import("@/lib/api/boardsApi");
  const data: BoardsApiResponse = await apiFetchBoards(userId);
  return data.boards ?? [];
}
