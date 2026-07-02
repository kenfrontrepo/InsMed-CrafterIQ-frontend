export async function resolveUserDisplayNames(
  userIds: string[]
): Promise<Record<string, string>> {
  const uniqueIds = [...new Set(userIds.map((id) => id.trim()).filter(Boolean))];
  if (uniqueIds.length === 0) return {};

  const res = await fetch("/api/users/resolve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userIds: uniqueIds }),
  });

  if (!res.ok) {
    throw new Error("Failed to resolve user names");
  }

  const data = (await res.json()) as { names?: Record<string, string> };
  return data.names ?? {};
}
