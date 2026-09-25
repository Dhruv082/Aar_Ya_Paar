import { PlannerState } from "@/src/scheduler";

export type DraftTask = { rowId: string; sprint: number | null; day: number | null; title: string; minutes: number | null; issues?: string[] };
export type ImportedPlanDraft = { sourceFilename: string; sourcePath: string; suggestedName: string; tasks: DraftTask[]; issues: string[]; totalMinutes: number };
export type SavedPlan = { id: string; name: string; sourceFilename?: string; sourcePath?: string; importedAt?: string; state: PlannerState };
export type PlannerStore = { activePlanId: string; plans: SavedPlan[] };