import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { SanitizedUser, ApiResponse } from "@/types";
import type { SettingsInput } from "@/types/auth";

const USERS_QUERY_KEY = ["users"];

async function fetchUsers(): Promise<SanitizedUser[]> {
  const response = await fetch("/api/users");

  const json: ApiResponse<SanitizedUser[]> = await response.json();

  if (!json.success || !json.data) {
    throw new Error(json.error || "Failed to fetch users");
  }

  return json.data;
}

async function deleteUser(id: number): Promise<void> {
  const response = await fetch(`/api/users?id=${id}`, {
    method: "DELETE",
  });

  const json: ApiResponse = await response.json();

  if (!json.success) {
    throw new Error(json.error || "Failed to delete user");
  }
}

export function useUsers() {
  return useQuery({
    queryKey: USERS_QUERY_KEY,
    queryFn: fetchUsers,
    staleTime: 1000 * 60, // 1 minute
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
  });
}

async function updateSettings(data: SettingsInput): Promise<SanitizedUser> {
  const response = await fetch("/api/settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const json: ApiResponse<SanitizedUser> = await response.json();

  if (!json.success || !json.data) {
    throw new Error(json.error || "Failed to update settings");
  }

  return json.data;
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
  });
}
