import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { SanitizedUser, ApiResponse } from "@/types";

const USERS_QUERY_KEY = ["users"];

async function fetchUsers(refreshToken: string): Promise<SanitizedUser[]> {
  const response = await fetch("/api/users", {
    headers: {
      Authorization: `Bearer ${refreshToken}`,
    },
  });

  const json: ApiResponse<SanitizedUser[]> = await response.json();

  if (!json.success || !json.data) {
    throw new Error(json.error || "Failed to fetch users");
  }

  return json.data;
}

async function deleteUser(id: number, refreshToken: string): Promise<void> {
  const response = await fetch(`/api/users?id=${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${refreshToken}`,
    },
  });

  const json: ApiResponse = await response.json();

  if (!json.success) {
    throw new Error(json.error || "Failed to delete user");
  }
}

export function useUsers(refreshToken: string | null) {
  return useQuery({
    queryKey: USERS_QUERY_KEY,
    queryFn: () => {
      if (!refreshToken) throw new Error("No refresh token");
      return fetchUsers(refreshToken);
    },
    enabled: !!refreshToken,
  });
}

export function useDeleteUser(refreshToken: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => {
      if (!refreshToken) throw new Error("No refresh token");
      return deleteUser(id, refreshToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
  });
}
