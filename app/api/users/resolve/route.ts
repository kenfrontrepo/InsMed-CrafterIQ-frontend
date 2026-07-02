import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getClerkUserName } from "@/lib/user-display";

export async function POST(request: Request) {
  const { userId: callerId } = await auth();
  if (!callerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const userIds = Array.isArray((body as { userIds?: unknown }).userIds)
    ? (body as { userIds: unknown[] }).userIds.filter(
        (id): id is string => typeof id === "string" && id.trim().length > 0
      )
    : [];

  const uniqueIds = [...new Set(userIds.map((id) => id.trim()))];
  if (uniqueIds.length === 0) {
    return NextResponse.json({ names: {} satisfies Record<string, string> });
  }

  const client = await clerkClient();
  const names: Record<string, string> = {};

  try {
    const { data: users } = await client.users.getUserList({
      userId: uniqueIds,
      limit: Math.min(uniqueIds.length, 100),
    });

    for (const user of users) {
      const displayName = getClerkUserName(user);
      if (displayName) {
        names[user.id] = displayName;
      }
    }
  } catch {
    return NextResponse.json(
      { error: "Failed to resolve user names" },
      { status: 500 }
    );
  }

  return NextResponse.json({ names });
}
