import { api } from "./axios";

/** POST /insmed/boards/createboard/{UserId} */
export interface CreateBoardRequest {
  name: string;
  description?: string | null;
  board_tags?: string | null;
}

/** PUT /insmed/boards/updateboardname/{BoardId}/{UserId} */
export interface UpdateBoardRequest {
  name: string;
  description?: string | null;
  board_tags?: string | null;
}

/** DELETE /insmed/boards/deleteboard/{UserId} */
export interface DeleteBoardRequest {
  board_id: string;
}

/** POST /insmed/boards/data/{BoardId}/{UserId} */
export interface BoardDataRequest {
  filters?: Record<string, { operator: string; values: string[] }> | null;
}

/** POST /insmed/boards/summary/{BoardId}/{UserId} */
export interface GenerateSummaryRequest {
  tone: string;
  detail_level: string;
  style: string;
  force_regenerate?: boolean;
}

/** POST /insmed/boards/reformat/preview/{BoardId}/{UserId} */
export interface ReformatPreviewRequest {
  pin_id: string;
  chart_type: string;
}

/** PUT /insmed/boards/updatevisual/{BoardId}/{UserId} */
export interface UpdateVisualRequest {
  pin_id: string;
  visual_spec: Record<string, unknown>;
}

/** POST /insmed/boards/publish/{BoardId}/{UserId} */
export interface PublishBoardRequest {
  target_user_id: string;
  permission?: "view" | "manage";
}

/** DELETE /insmed/boards/unpublish/{BoardId}/{UserId} */
export interface UnpublishBoardRequest {
  target_user_id: string;
}

export interface BoardListItem {
  id: string;
  name: string;
  description: string | null;
  board_tags: string | null;
  pin_count: number;
  created_at: string;
}

/** GET /insmed/boards/getallboards/{UserId} */
export interface BoardListResponse {
  status: boolean;
  boards: BoardListItem[];
  total: number;
}

/** POST /insmed/boards/createboard/{UserId} */
export interface CreateBoardResponse {
  status: boolean;
  message: string;
  board: BoardListItem;
}

export interface BoardPinMeta {
  id: string;
  conversation_id: string;
  message_id: string;
  response_type: string;
  title: string;
  is_refreshable: boolean;
  last_refreshed_at: string | null;
  refresh_count: number;
  created_at: string;
  position: number;
  size: { width: number; height: number } | null;
  pin_tags: string | null;
}

export interface BoardPinData {
  id: string;
  title: string;
  response_type: string;
  visual_spec: Record<string, unknown>;
  chart_type: string;
  user_question: string | null;
  is_refreshable: boolean;
  last_refreshed_at: string | null;
  sql_query?: string | null;
  position: number;
  size: { width: number; height: number } | null;
}

/** GET /insmed/boards/getboarddetails/{BoardId}/{UserId} */
export interface BoardDetailsResponse {
  status: boolean;
  board: BoardListItem & { pins: BoardPinMeta[] };
}

/** POST /insmed/boards/data/{BoardId}/{UserId} */
export interface BoardDataResponse {
  status: boolean;
  id: string;
  name: string;
  description: string | null;
  board_tags: string | null;
  ai_summary: string | null;
  ai_summary_key: string | null;
  ai_summary_updated_at: string | null;
  created_at: string;
  updated_at: string;
  pins: BoardPinMeta[];
  pin_count: number;
  pins_data: BoardPinData[];
}

/** GET /insmed/boards/summary/options */
export interface SummaryOptionsResponse {
  status: boolean;
  tones: string[];
  detail_levels: string[];
  styles: string[];
}

/** POST /insmed/boards/summary/{BoardId}/{UserId} */
export interface BoardSummaryResponse {
  status: boolean;
  board_id: string;
  board_name: string;
  summary: string;
  tone: string;
  detail_level: string;
  style: string;
}

/** GET /insmed/boards/chartoptions/{BoardId}/{PinId}/{UserId} */
export interface ChartOptionsResponse {
  status: boolean;
  pin_id: string;
  current_chart_type: string;
  compatible_charts: string[];
  recommendations: Record<string, string>;
}

/** POST /insmed/boards/reformat/preview/{BoardId}/{UserId} */
export interface ReformatPreviewResponse {
  status: boolean;
  preview_spec: Record<string, unknown>;
  preview_spec_full: Record<string, unknown>;
  compatible_charts: string[];
}

export async function fetchBoards(userId: string): Promise<BoardListResponse> {
  const res = await api.get<BoardListResponse>(`/insmed/boards/getallboards/${userId}`);
  return res.data;
}

export async function createBoard(
  userId: string,
  name: string,
  description: string,
  board_tags: string
): Promise<CreateBoardResponse> {
  const body: CreateBoardRequest = {
    name,
    description: description || null,
    board_tags: board_tags || null,
  };
  const res = await api.post<CreateBoardResponse>(
    `/insmed/boards/createboard/${userId}`,
    body
  );
  return res.data;
}

export async function fetchBoardDetails(
  boardId: string,
  userId: string
): Promise<BoardDetailsResponse> {
  const res = await api.get<BoardDetailsResponse>(
    `/insmed/boards/getboarddetails/${boardId}/${userId}`
  );
  return res.data;
}

export async function updateBoard(
  boardId: string,
  userId: string,
  name: string,
  description: string,
  board_tags: string
): Promise<{ status: boolean; message: string; board?: BoardListItem }> {
  const body: UpdateBoardRequest = {
    name,
    description: description || null,
    board_tags: board_tags || null,
  };
  const res = await api.put(`/insmed/boards/updateboardname/${boardId}/${userId}`, body);
  return res.data;
}

export async function deleteBoard(
  userId: string,
  board_id: string
): Promise<{ status: boolean; message: string }> {
  const body: DeleteBoardRequest = { board_id };
  const res = await api.delete(`/insmed/boards/deleteboard/${userId}`, { data: body });
  return res.data;
}

export async function fetchBoardData(
  boardId: string,
  userId: string,
  filters: Record<string, { operator: string; values: string[] }> = {}
): Promise<BoardDataResponse> {
  const hasFilters = Object.keys(filters).length > 0;
  const body: BoardDataRequest = { filters: hasFilters ? filters : null };
  const res = await api.post<BoardDataResponse>(
    `/insmed/boards/data/${boardId}/${userId}`,
    body
  );
  return res.data;
}

export async function refreshBoard(
  boardId: string,
  userId: string
): Promise<{ status: boolean; message: string }> {
  const res = await api.post(`/insmed/boards/refreshboard/${boardId}/${userId}`);
  return res.data;
}

export async function fetchSummaryOptions(): Promise<SummaryOptionsResponse> {
  const res = await api.get<SummaryOptionsResponse>("/insmed/boards/summary/options");
  return res.data;
}

export async function fetchBoardSummary(
  boardId: string,
  userId: string,
  opts: GenerateSummaryRequest
): Promise<BoardSummaryResponse> {
  const res = await api.post<BoardSummaryResponse>(
    `/insmed/boards/summary/${boardId}/${userId}`,
    opts
  );
  return res.data;
}

export async function fetchChartOptions(
  boardId: string,
  pinId: string,
  userId: string
): Promise<ChartOptionsResponse> {
  const res = await api.get<ChartOptionsResponse>(
    `/insmed/boards/chartoptions/${boardId}/${pinId}/${userId}`
  );
  return res.data;
}

export async function fetchReformatPreview(
  boardId: string,
  userId: string,
  pin_id: string,
  chart_type: string
): Promise<ReformatPreviewResponse> {
  const body: ReformatPreviewRequest = { pin_id, chart_type };
  const res = await api.post<ReformatPreviewResponse>(
    `/insmed/boards/reformat/preview/${boardId}/${userId}`,
    body
  );
  return res.data;
}

export async function updateVisual(
  boardId: string,
  userId: string,
  pin_id: string,
  visual_spec: Record<string, unknown>
): Promise<{ status: boolean; message: string }> {
  const body: UpdateVisualRequest = { pin_id, visual_spec };
  const res = await api.put(`/insmed/boards/updatevisual/${boardId}/${userId}`, body);
  return res.data;
}

export async function publishBoard(
  boardId: string,
  userId: string,
  target_user_id: string,
  permission: "view" | "manage" = "manage"
): Promise<{ status: boolean; message: string }> {
  const body: PublishBoardRequest = { target_user_id, permission };
  const res = await api.post(`/insmed/boards/publish/${boardId}/${userId}`, body);
  return res.data;
}

export async function unpublishBoard(
  boardId: string,
  userId: string,
  target_user_id: string
): Promise<{ status: boolean; message: string }> {
  const body: UnpublishBoardRequest = { target_user_id };
  const res = await api.delete(`/insmed/boards/unpublish/${boardId}/${userId}`, {
    data: body,
  });
  return res.data;
}

export async function fetchPublishedBoards(
  userId: string
): Promise<{ status: boolean; boards: BoardListItem[]; total: number }> {
  const res = await api.get(`/insmed/boards/getpublishedboards/${userId}`);
  return res.data;
}

export { saveBoardLayout } from "./pinsApi";
