import Constants from "expo-constants";
import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";

import { ImportedPlanDraft } from "@/src/plan-types";

const backendUrl = Constants.expoConfig?.extra?.backendUrl ?? process.env.EXPO_PUBLIC_BACKEND_URL;

async function prepareNativePdf(uri: string): Promise<string> {
  // DocumentPicker already makes an app-readable cached file when
  // copyToCacheDirectory is true. Copying that URI again fails in standalone
  // Android builds on some devices, even though uploadAsync can read it.
  const info = await FileSystem.getInfoAsync(uri);
  if (!info.exists || !info.size) throw new Error("The selected PDF could not be prepared for upload. Please choose it again.");
  return uri;
}

export async function uploadPlanPdf(asset: { uri: string; name: string; mimeType?: string | null }): Promise<ImportedPlanDraft> {
  if (!backendUrl) throw new Error("The import service is unavailable in this app configuration.");
  const endpoint = `${backendUrl}/api/plans/import-pdf`;
  let payload: { detail?: string; source_filename?: string; source_path?: string; suggested_name?: string; tasks?: { row_id?: string; sprint?: number | null; day?: number | null; title?: string; minutes?: number | null; issues?: string[] }[]; issues?: string[]; total_minutes?: number };
  if (Platform.OS === "web") {
    const form = new FormData();
    const blob = await (await fetch(asset.uri)).blob();
    form.append("file", blob, asset.name);
    const response = await fetch(endpoint, { method: "POST", body: form });
    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}));
      throw new Error(errorPayload.detail ?? "The PDF could not be imported. Please try another structured plan.");
    }
    payload = await response.json();
  } else {
    const readableUri = await prepareNativePdf(asset.uri);
    const response = await FileSystem.uploadAsync(endpoint, readableUri, { httpMethod: "POST", uploadType: FileSystem.FileSystemUploadType.MULTIPART, fieldName: "file", mimeType: asset.mimeType ?? "application/pdf", parameters: { filename: asset.name } });
    payload = JSON.parse(response.body) as typeof payload;
    if (response.status < 200 || response.status >= 300) throw new Error(payload.detail ?? "The PDF could not be imported. Please try another structured plan.");
  }
  return {
    sourceFilename: payload.source_filename ?? asset.name,
    sourcePath: payload.source_path ?? "",
    suggestedName: payload.suggested_name ?? asset.name.replace(/\.pdf$/i, ""),
    tasks: (payload.tasks ?? []).map((task, index) => ({ rowId: task.row_id ?? `row-${index + 1}`, sprint: task.sprint ?? null, day: task.day ?? null, title: task.title ?? "", minutes: task.minutes ?? null, issues: task.issues ?? [] })),
    issues: payload.issues ?? [],
    totalMinutes: payload.total_minutes ?? 0,
  };
}
