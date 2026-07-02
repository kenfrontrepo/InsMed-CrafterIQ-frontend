import { useUser } from "@clerk/nextjs";
import { getClerkUserName } from "@/lib/user-display";

export function useUserId() {
  const { user, isLoaded } = useUser();
  return {
    userId: user?.id ?? null,
    userName: getClerkUserName(user),
    isLoaded,
  };
}
