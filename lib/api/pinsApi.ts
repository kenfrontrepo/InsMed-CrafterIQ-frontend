import { api } from "./axios";

export async function fetchPins(userId: string) {
  const res = await api.get(`/crafteriq/pins/getallpins/${userId}`);
  return res.data;
}

export async function createPin(
  userId: string,
  message_id: string,
  conversation_id: string,
  title: string
) {
  const res = await api.post(`/crafteriq/pins/createpin/${userId}`, {
    message_id,
    conversation_id,
    title: title || "",
  });
  return res.data;
}

export async function updatePin(
  pinId: string,
  userId: string,
  title: string,
  pin_tags: string
) {
  const res = await api.put(`/crafteriq/pins/updatepintitle/${pinId}/${userId}`, {
    title,
    pin_tags,
  });
  return res.data;
}

export async function deletePin(pin_id: string, userId: string) {
  const res = await api.delete(`/crafteriq/pins/unpin/${userId}`, {
    data: { pin_id },
  });
  return res.data;
}

export async function assignPin(
  pinId: string,
  userId: string,
  board_id: string
) {
  const res = await api.put(`/crafteriq/pins/assign/${pinId}/${userId}`, {
    board_id,
  });
  return res.data;
}

export async function bulkAssignPins(
  userId: string,
  pin_ids: string[],
  board_id: string
) {
  const res = await api.post(`/crafteriq/pins/bulk/assign/${userId}`, {
    pin_ids,
    board_id,
  });
  return res.data;
}

export async function fetchPinDetails(pinId: string, userId: string) {
  const res = await api.get(`/crafteriq/pins/getpindetails/${pinId}/${userId}`, {
    headers: { accept: "application/json" },
  });
  return res.data;
}

export async function bulkUnassignPins(
  userId: string,
  board_id: string,
  pin_ids: string[]
) {
  const res = await api.post(`/crafteriq/pins/bulk/unassign/${userId}`, {
    board_id,
    pin_ids,
  });
  return res.data;
}
