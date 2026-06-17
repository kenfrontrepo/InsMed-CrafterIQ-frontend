import { useUser } from "@clerk/nextjs";

export function useUserId() {
  const { user, isLoaded } = useUser();
  return { userId: user?.id ?? null, isLoaded };
}
