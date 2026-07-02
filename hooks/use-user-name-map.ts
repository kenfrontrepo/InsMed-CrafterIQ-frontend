import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { resolveUserDisplayNames } from "@/lib/api/usersApi";

export function useUserNameMap(userIds: string[]) {
  const lookupKey = useMemo(() => {
    const unique = [...new Set(userIds.map((id) => id.trim()).filter(Boolean))];
    unique.sort();
    return unique.join("\0");
  }, [userIds]);

  const ids = useMemo(
    () => (lookupKey ? lookupKey.split("\0") : []),
    [lookupKey]
  );

  return useQuery({
    queryKey: ["user-display-names", lookupKey],
    queryFn: () => resolveUserDisplayNames(ids),
    enabled: ids.length > 0,
    staleTime: 5 * 60 * 1000,
  });
}
