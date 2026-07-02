type ClerkLikeUser = {
  username?: string | null;
  fullName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  primaryEmailAddress?: { emailAddress?: string } | null;
  emailAddresses?: Array<{ emailAddress?: string; id?: string }>;
  primaryEmailAddressId?: string | null;
};

/** Preferred display/login name from Clerk profile */
export function getClerkUserName(
  user: ClerkLikeUser | null | undefined
): string | null {
  if (!user) return null;

  const username = user.username?.trim();
  if (username) return username;

  const fullName =
    user.fullName?.trim() ||
    [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  if (fullName) return fullName;

  const email =
    user.primaryEmailAddress?.emailAddress ||
    user.emailAddresses?.find((e) => e.id === user.primaryEmailAddressId)
      ?.emailAddress ||
    user.emailAddresses?.[0]?.emailAddress;
  if (email) {
    const local = email.split("@")[0]?.trim();
    if (local) return local;
  }

  return null;
}

/** Show name when available; avoid showing raw Clerk ids when unresolved */
export function displayShareUser(
  userId: string,
  userName?: string | null
): string {
  const name = userName?.trim();
  if (name) return name;
  if (userId.startsWith("user_")) return "Unknown user";
  return userId;
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
