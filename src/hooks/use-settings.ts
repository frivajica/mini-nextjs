import { useMutation } from "@tanstack/react-query";
import type { SanitizedUser, ApiResponse } from "@/types";
import type { SettingsInput } from "@/types/auth";

const SETTINGS_MUTATION_KEY = ["settings"];

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
  return useMutation({
    mutationKey: SETTINGS_MUTATION_KEY,
    mutationFn: updateSettings,
  });
}
