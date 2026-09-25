import Constants from "expo-constants";
import { Platform } from "react-native";

import { ImportedPlanDraft } from "@/src/plan-types";

const backendUrl = Constants.expoConfig?.extra?.backendUrl ?? process.env.EXPO_PUBLIC_BACKEND_URL;

export async function uploadPlanPdf(asset: { uri: string; name: string; mimeType?: string | null }): Promise<ImportedPlanDraft> {
  if (!backendUrl) throw new Error("The import service is unavailable in this app configuration.");
  const form = new FormData();
  if (Platform.OS === "web") {
    const blob = await (await fetch(asset.uri)).blob();
    form.append("file", blob, asset.name);
  } else {
    form.append("file", { uri: asset.uri, name: asset.name, type: asset.mimeType ?? "application/pdf" } as never);
  }
  const response = await fetch(`${backendUrl}/api/plans/import-pdf`, { method: "POST", body: form });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.detail ?? "The PDF could not be imported. Please try another structured plan.");
  }
  const payload = await response.json() as { source_filename?: string; source_path?: string; suggested_name?: string; tasks?: { row_id?: string; sprint?: number | null; day?: number | null; title?: string; minutes?: number | null; issues?: string[] }[]; issues?: string[]; total_minutes?: number };
  return {
    sourceFilename: payload.source_filename ?? asset.name,
    sourcePath: payload.source_path ?? "",
    suggestedName: payload.suggested_name ?? asset.name.replace(/\.pdf$/i, ""),
    tasks: (payload.tasks ?? []).map((task, index) => ({ rowId: task.row_id ?? `row-${index + 1}`, sprint: task.sprint ?? null, day: task.day ?? null, title: task.title ?? "", minutes: task.minutes ?? null, issues: task.issues ?? [] })),
    issues: payload.issues ?? [],
    totalMinutes: payload.total_minutes ?? 0,
  };
}