import { api } from "./axios";

/** POST /insmed/pins/createpin/{UserId} */
export interface CreatePinRequest {
  message_id: string;
  conversation_id: string;
  title?: string | null;
  board_id?: string | null;
  question?: string | null;
  pin_tags?: string | null;
  response_type?: string | null;
  dataset_id?: string | null;
  /** Insight markdown from insights_ready / workflow_complete */
  content?: string | null;
  /** SQL from query_ready — helps pin when DB row isn't visible yet */
  sql_query?: string | null;
  /** Full chart/table spec from SSE — sent for reliable pinning */
  visual_spec?: Record<string, unknown> | null;
}

/** PUT /insmed/pins/updatepintitle/{PinId}/{UserId} */
export interface UpdatePinRequest {
  title?: string | null;
  pin_tags?: string | null;
}

/** DELETE /insmed/pins/unpin/{UserId} */
export interface UnpinRequest {
  pin_id: string;
}

/** PUT /insmed/pins/assign/{PinId}/{UserId} */
export interface AssignPinRequest {
  board_id: string;
}

/** POST /insmed/pins/bulk/assign/{UserId} */
export interface BulkAssignRequest {
  pin_ids: string[];
  board_id: string;
}

/** POST /insmed/pins/bulk/unassign/{UserId} */
export interface BulkUnassignRequest {
  pin_ids: string[];
  board_id?: string | null;
}

/** POST /insmed/pins/refine/{PinId}/{UserId} */
export interface RefinePinRequest {
  modification: string;
  board_id?: string | null;
  dataset_id?: string | null;
}

/** PUT /insmed/pins/layout/{BoardId}/{UserId} */
export interface PinLayoutItem {
  pin_id: string;
  position: number;
  size?: { width: number; height: number } | null;
}

export interface UpdateBoardLayoutRequest {
  layout: PinLayoutItem[];
}

export interface PinSummary {
  id: string;
  title: string;
  response_type: string;
  board_id?: string | null;
  board_name?: string | null;
  is_refreshable?: boolean;
  created_at?: string;
  pin_tags?: string | null;
  updated_at?: string;
  assigned_at?: string;
}

/** GET /insmed/pins/getallpins/{UserId} */
export interface PinListItem {
  id: string;
  title: string;
  response_type: string;
  board_id: string | null;
  conversation_id: string;
  chart_type?: string | null;
  pin_tags: string | null;
  is_refreshable: boolean;
  last_refreshed_at: string | null;
  refresh_count: number;
  created_at: string;
  updated_at?: string;
}

export interface PinsListResponse {
  status: boolean;
  pins: PinListItem[];
  total: number;
  error?: string;
}

/** GET /insmed/pins/getpindetails/{PinId}/{UserId} */
export interface PinDetail extends PinListItem {
  message_id: string;
  visual_spec?: Record<string, unknown> | null;
  sql_query?: string | null;
  user_question?: string | null;
}

export interface PinDetailResponse {
  status: boolean;
  pin?: PinDetail;
  error?: string;
}

export interface CreatePinResponse {
  status: boolean;
  message?: string;
  error?: string;
  pin?: PinSummary;
}

export interface PinMutationResponse {
  status: boolean;
  message?: string;
  error?: string;
  pin?: PinSummary;
}

export interface BulkUnassignResponse {
  status: boolean;
  message?: string;
  error?: string;
  result?: {
    unassigned_count: number;
    pin_ids: string[];
  };
}

export interface UpdateLayoutResponse {
  status: boolean;
  message?: string;
  error?: string;
  result?: Record<string, unknown>;
}

export async function fetchPins(userId: string): Promise<PinsListResponse> {
  const res = await api.get<PinsListResponse>(`/insmed/pins/getallpins/${userId}`);
  return res.data;
}

export async function createPin(
  userId: string,
  body: CreatePinRequest
): Promise<CreatePinResponse> {
  const res = await api.post<CreatePinResponse>(`/insmed/pins/createpin/${userId}`, body);
  return res.data;
}

export async function updatePin(
  pinId: string,
  userId: string,
  body: UpdatePinRequest
): Promise<PinMutationResponse> {
  const res = await api.put<PinMutationResponse>(
    `/insmed/pins/updatepintitle/${pinId}/${userId}`,
    body
  );
  return res.data;
}

export async function deletePin(
  pinId: string,
  userId: string
): Promise<PinMutationResponse> {
  const body: UnpinRequest = { pin_id: pinId };
  const res = await api.delete<PinMutationResponse>(`/insmed/pins/unpin/${userId}`, {
    data: body,
  });
  return res.data;
}

export async function assignPin(
  pinId: string,
  userId: string,
  boardId: string
): Promise<PinMutationResponse> {
  const body: AssignPinRequest = { board_id: boardId };
  const res = await api.put<PinMutationResponse>(
    `/insmed/pins/assign/${pinId}/${userId}`,
    body
  );
  return res.data;
}

export async function bulkAssignPins(
  userId: string,
  pinIds: string[],
  boardId: string
): Promise<PinMutationResponse> {
  const body: BulkAssignRequest = { pin_ids: pinIds, board_id: boardId };
  const res = await api.post<PinMutationResponse>(
    `/insmed/pins/bulk/assign/${userId}`,
    body
  );
  return res.data;
}

export async function fetchPinDetails(
  pinId: string,
  userId: string
): Promise<PinDetailResponse> {
  const res = await api.get<PinDetailResponse>(
    `/insmed/pins/getpindetails/${pinId}/${userId}`
  );
  return res.data;
}

export async function refinePin(
  pinId: string,
  userId: string,
  body: RefinePinRequest
): Promise<PinMutationResponse> {
  const res = await api.post<PinMutationResponse>(
    `/insmed/pins/refine/${pinId}/${userId}`,
    body
  );
  return res.data;
}

export async function bulkUnassignPins(
  userId: string,
  boardId: string,
  pinIds: string[]
): Promise<BulkUnassignResponse> {
  const body: BulkUnassignRequest = { pin_ids: pinIds, board_id: boardId };
  const res = await api.post<BulkUnassignResponse>(
    `/insmed/pins/bulk/unassign/${userId}`,
    body
  );
  return res.data;
}

export async function saveBoardLayout(
  boardId: string,
  userId: string,
  layout: PinLayoutItem[]
): Promise<UpdateLayoutResponse> {
  const body: UpdateBoardLayoutRequest = { layout };
  const res = await api.put<UpdateLayoutResponse>(
    `/insmed/pins/layout/${boardId}/${userId}`,
    body
  );
  return res.data;
}
