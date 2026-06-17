import { api } from "./axios";

export async function fetchBoards(userId: string) {
  const res = await api.get(`/crafteriq/boards/getallboards/${userId}`);
  return res.data;
}

export async function createBoard(
  userId: string,
  name: string,
  description: string,
  board_tags: string,
  schema_name: string
) {
  const res = await api.post(`/crafteriq/boards/createboard/${userId}`, {
    name,
    description: description || "",
    board_tags: board_tags || "",
    schema_name,
  });
  return res.data;
}

export async function updateBoard(
  boardId: string,
  userId: string,
  name: string,
  description: string,
  board_tags: string
) {
  const res = await api.put(`/crafteriq/boards/updateboardname/${boardId}/${userId}`, {
    name,
    description: description || "",
    board_tags: board_tags || "",
  });
  return res.data;
}

export async function deleteBoard(userId: string, board_id: string) {
  const res = await api.delete(`/crafteriq/boards/deleteboard/${userId}`, {
    data: { board_id },
  });
  return res.data;
}

export async function fetchBoardData(
  boardId: string,
  userId: string,
  filters: Record<string, { operator: string; values: string[] }> = {}
) {
  const res = await api.post(`/crafteriq/boards/data/${boardId}/${userId}`, {
    filters,
  });
  return res.data;
}

export async function saveBoardLayout(
  boardId: string,
  userId: string,
  pins: Array<{ pin_id: string; position: number; size: { width: number; height: number } }>
) {
  const res = await api.put(`/crafteriq/pins/layout/${boardId}/${userId}`, {
    layout: pins,
  });
  return res.data;
}

export async function fetchBoardSummary(
  boardId: string,
  userId: string,
  opts: {
    tone: string;
    detail_level: string;
    style: string;
    force_regenerate?: boolean;
  }
) {
  const res = await api.post(`/crafteriq/boards/summary/${boardId}/${userId}`, opts);
  return res.data;
}

export async function fetchChartOptions(
  boardId: string,
  pinId: string,
  userId: string
) {
  const res = await api.get(`/crafteriq/boards/chartoptions/${boardId}/${pinId}/${userId}`);
  return res.data;
}

export async function fetchReformatPreview(
  boardId: string,
  userId: string,
  pin_id: string,
  chart_type: string
) {
  const res = await api.post(`/crafteriq/boards/reformat/preview/${boardId}/${userId}`, {
    pin_id,
    chart_type,
  });
  return res.data;
}

export async function updateVisual(
  boardId: string,
  userId: string,
  pin_id: string,
  visual_spec: Record<string, unknown>
) {
  const res = await api.put(`/crafteriq/boards/updatevisual/${boardId}/${userId}`, {
    pin_id,
    visual_spec,
  });
  return res.data;
}
