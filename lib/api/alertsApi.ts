import { api } from "./axios";

export async function fetchAlerts(
  userId: string,
  pinId: string,
  boardId: string
) {
  const res = await api.get(
    `/crafteriq/v2/alerts/${userId}?pin_id=${pinId}&board_id=${boardId}`,
    { headers: { accept: "application/json" } }
  );
  return res.data;
}

export async function fetchAlertSuggestions(
  userId: string,
  pinId: string,
  boardId: string
) {
  const res = await api.post(
    `/crafteriq/v2/alerts/suggest/${userId}?pin_id=${pinId}&board_id=${boardId}`,
    null,
    { headers: { accept: "application/json" } }
  );
  return res.data;
}

export async function createAlert(
  userId: string,
  body: { pin_id: string; board_id: string; message: string }
) {
  const res = await api.post(`/crafteriq/v2/alerts/create/${userId}`, body);
  return res.data;
}

export async function toggleAlert(
  alertId: string,
  userId: string,
  isActive: boolean
) {
  const res = await api.patch(
    `/crafteriq/v2/alerts/${alertId}/toggle/${userId}`,
    { is_active: isActive }
  );
  return res.data;
}

export async function deleteAlert(alertId: string, userId: string) {
  const res = await api.delete(`/crafteriq/v2/alerts/${alertId}/${userId}`);
  return res.data;
}
