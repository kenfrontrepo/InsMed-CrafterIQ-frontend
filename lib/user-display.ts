import type { UserResource } from "@clerk/types";

/** Preferred display/login name from Clerk profile */
export function getClerkUserName(
  user: UserResource | null | undefined
): string | null {
  if (!user) return null;

  const username = user.username?.trim();
  if (username) return username;

  const fullName = user.fullName?.trim();
  if (fullName) return fullName;

  const email = user.primaryEmailAddress?.emailAddress;
  if (email) {
    const local = email.split("@")[0]?.trim();
    if (local) return local;
  }

  return null;
}

/** Show name when API provides it, otherwise fall back to identifier */
export function displayShareUser(
  userId: string,
  userName?: string | null
): string {
  return userName?.trim() || userId;
}

export function isSameShareUser(
  entered: string,
  currentUserId: string,
  currentUserName?: string | null
): boolean {
  const norm = (value: string) => value.trim().toLowerCase();
  const target = norm(entered);
  if (!target) return false;
  if (target === norm(currentUserId)) return true;
  if (currentUserName && target === norm(currentUserName)) return true;
  return false;
}
