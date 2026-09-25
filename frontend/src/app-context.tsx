import * as Clipboard from "expo-clipboard";
import Constants from "expo-constants";
import { PropsWithChildren, createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Alert, Platform } from "react-native";

import { ImportedPlanDraft, PlannerStore, SavedPlan } from "@/src/plan-types";
import { addDays, buildSchedule, createInitialState, CURRICULUM, dateKey, DEFAULT_SETTINGS, PlannerState, rescheduleFrom, restoreUnavailableDay, ScheduleEntry, Task } from "@/src/scheduler";
import { storage } from "@/src/utils/storage";

const STORE_KEY = "aap_ya_paar_plan_store_v2";
const LEGACY_KEY = "aap_ya_paar_state_v1";
type Settings = PlannerState["settings"];
type NotificationsModule = typeof import("expo-notifications");

async function getNotifications(): Promise<NotificationsModule | null> {
  if (Platform.OS === "web" || (Platform.OS === "android" && Constants.executionEnvironment === "storeClient")) return null;
  return import("expo-notifications");
}

type PlannerContextValue = {
  state: PlannerState | null; plans: SavedPlan[]; activePlanId: string | null; loading: boolean;
  saveOnboarding: (settings: Settings) => Promise<void>; toggleTask: (taskId: string) => Promise<void>; markMissed: () => Promise<void>;
  markUnavailable: (date: string, reason?: string) => Promise<void>; markAvailable: (date: string) => Promise<void>; studyAhead: () => Promise<void>;
  updateSettings: (settings: Settings) => Promise<void>; resetProgress: () => Promise<void>; exportData: () => Promise<void>; importData: () => Promise<void>;
  setActivePlan: (id: string) => Promise<void>; saveImportedPlan: (name: string, draft: ImportedPlanDraft) => Promise<string>;
};
const PlannerContext = createContext<PlannerContextValue | null>(null);

function syncCompletion(schedule: ScheduleEntry[], next: PlannerState): ScheduleEntry[] {
  const complete = new Set(next.completionRecords.map((item) => item.taskId));
  return schedule.map((entry) => ({ ...entry, state: complete.has(entry.taskId) ? "completed" : entry.state === "completed" ? "scheduled" : entry.state }));
}
function withSchedule(next: PlannerState, schedule = buildSchedule(next)): PlannerState { return { ...next, schedule: syncCompletion(schedule, next), scheduleVersion: next.scheduleVersion + 1, lastRecalculatedAt: new Date().toISOString() }; }
function migrateState(saved: PlannerState): PlannerState {
  const needsCurriculumMigration = saved.curriculumVersion !== 2 || saved.tasks.length !== CURRICULUM.length;
  if (!needsCurriculumMigration) return { ...saved, settings: { ...DEFAULT_SETTINGS, ...saved.settings }, extraCapacity: saved.extraCapacity ?? {} };
  const completedTitles = new Set(saved.completionRecords.map((record) => saved.tasks.find((task) => task.id === record.taskId)?.title).filter(Boolean));
  const completionRecords = CURRICULUM.filter((task) => completedTitles.has(task.title)).map((task) => ({ taskId: task.id, completedAt: new Date().toISOString() }));
  return { ...saved, curriculumVersion: 2, tasks: CURRICULUM, completionRecords, dateOverrides: saved.dateOverrides ?? [], extraCapacity: saved.extraCapacity ?? {}, settings: { ...DEFAULT_SETTINGS, ...saved.settings }, schedule: [] };
}
function newStore(): PlannerStore { const state = createInitialState(); return { activePlanId: "starter", plans: [{ id: "starter", name: "Aar Ya Paar plan", state }] }; }
function normalizeStore(store: PlannerStore): PlannerStore { return { activePlanId: store.plans.some((plan) => plan.id === store.activePlanId) ? store.activePlanId : store.plans[0]?.id ?? "starter", plans: store.plans.map((plan) => { const state = migrateState(plan.state); return { ...plan, name: plan.name === "Aap Ya Paar plan" ? "Aar Ya Paar plan" : plan.name, state: withSchedule(state, state.schedule.length ? state.schedule : buildSchedule(state)) }; }) }; }
function makeImportedState(planId: string, draft: ImportedPlanDraft): PlannerState {
  const tasks: Task[] = draft.tasks.map((item, index) => ({ id: `${planId}-t${index + 1}`, sprint: item.sprint ?? 1, originalDay: item.day ?? 1, title: item.title.trim(), estimatedMinutes: item.minutes ?? 0, sequence: index + 1 }));
  const base = createInitialState(); const next = { ...base, initialized: true, tasks, completionRecords: [], dateOverrides: [], extraCapacity: {}, schedule: [], scheduleVersion: 1, lastRecalculatedAt: new Date().toISOString() };
  return { ...next, schedule: buildSchedule(next) };
}

export function PlannerProvider({ children }: PropsWithChildren) {
  const [store, setStore] = useState<PlannerStore | null>(null); const [loading, setLoading] = useState(true);
  const persist = useCallback(async (next: PlannerStore) => { setStore(next); await storage.setItem(STORE_KEY, next); }, []);
  useEffect(() => { void (async () => { setLoading(true); const saved = await storage.getItem<PlannerStore | null>(STORE_KEY, null); const legacy = saved ? null : await storage.getItem<PlannerState | null>(LEGACY_KEY, null); const next = saved ? normalizeStore(saved) : legacy ? { activePlanId: "starter", plans: [{ id: "starter", name: "Aar Ya Paar plan", state: migrateState(legacy) }] } : newStore(); await storage.setItem(STORE_KEY, next); setStore(next); setLoading(false); })(); }, []);
  const active = store?.plans.find((plan) => plan.id === store.activePlanId) ?? null;
  const updateActive = useCallback(async (update: (current: PlannerState) => PlannerState) => { if (!store || !active) return; const next = { ...store, plans: store.plans.map((plan) => plan.id === active.id ? { ...plan, state: update(plan.state) } : plan) }; await persist(next); }, [active, persist, store]);
  const saveOnboarding = useCallback((settings: Settings) => updateActive((current) => withSchedule({ ...current, initialized: true, settings })), [updateActive]);
  const toggleTask = useCallback((taskId: string) => updateActive((current) => { const exists = current.completionRecords.some((item) => item.taskId === taskId); const completionRecords = exists ? current.completionRecords.filter((item) => item.taskId !== taskId) : [...current.completionRecords, { taskId, completedAt: new Date().toISOString() }]; return withSchedule({ ...current, completionRecords }, current.schedule); }), [updateActive]);
  const markMissed = useCallback(() => updateActive((current) => { const today = dateKey(); const reservedTaskIds = current.schedule.filter((entry) => entry.date === today && entry.state !== "completed").map((entry) => entry.taskId); const next = { ...current, dateOverrides: [...current.dateOverrides.filter((item) => item.date !== today), { date: today, type: "unavailable" as const, reason: "Missed study day", reservedTaskIds }] }; return withSchedule(next, rescheduleFrom(next, addDays(today, 1))); }), [updateActive]);
  const markUnavailable = useCallback((date: string, reason = "Freedom day") => updateActive((current) => { const existing = current.dateOverrides.find((item) => item.date === date); const reservedTaskIds = existing?.reservedTaskIds ?? current.schedule.filter((entry) => entry.date === date && entry.state !== "completed").map((entry) => entry.taskId); const next = { ...current, dateOverrides: [...current.dateOverrides.filter((item) => item.date !== date), { date, type: "unavailable" as const, reason, reservedTaskIds }] }; return withSchedule(next, rescheduleFrom(next, date)); }), [updateActive]);
  const markAvailable = useCallback((date: string) => updateActive((current) => { const override = current.dateOverrides.find((item) => item.date === date); const fallback = current.schedule.find((entry) => entry.date >= date && entry.state !== "completed")?.taskId; const reserved = override?.reservedTaskIds?.length ? override.reservedTaskIds : fallback ? [fallback] : []; const next = { ...current, dateOverrides: current.dateOverrides.filter((item) => item.date !== date) }; return withSchedule(next, reserved.length ? restoreUnavailableDay(next, date, reserved) : rescheduleFrom(next, date)); }), [updateActive]);
  const studyAhead = useCallback(() => updateActive((current) => { const today = dateKey(); const next = { ...current, extraCapacity: { ...current.extraCapacity, [today]: (current.extraCapacity[today] ?? 0) + 60 } }; return withSchedule(next, rescheduleFrom(next, today)); }), [updateActive]);
  const updateSettings = useCallback(async (settings: Settings) => { await updateActive((current) => { const next = { ...current, settings }; return withSchedule(next, rescheduleFrom(next, addDays(dateKey(), 1))); }); const notifications = await getNotifications(); if (settings.notificationsEnabled && notifications) { const permissions = await notifications.getPermissionsAsync(); if (!permissions.granted) await notifications.requestPermissionsAsync(); const [hour, minute] = settings.reminderTime.split(":").map(Number); await notifications.scheduleNotificationAsync({ content: { title: "Aar Ya Paar", body: "Time to study. Your next task is waiting." }, trigger: { hour, minute, repeats: true } as never }); } }, [updateActive]);
  const resetProgress = useCallback(() => updateActive((current) => { const fresh = createInitialState(); return { ...fresh, initialized: true, settings: current.settings }; }), [updateActive]);
  const exportData = useCallback(async () => { if (!store) return; await Clipboard.setStringAsync(JSON.stringify(store)); Alert.alert("Backup copied", "All saved plans are now in the clipboard."); }, [store]);
  const importData = useCallback(async () => { try { const parsed = JSON.parse(await Clipboard.getStringAsync()) as PlannerStore; if (!parsed.plans?.length) throw new Error(); await persist(normalizeStore(parsed)); Alert.alert("Backup restored", "Your saved plans are ready."); } catch { Alert.alert("Import unavailable", "Copy a valid Aar Ya Paar backup first."); } }, [persist]);
  const setActivePlan = useCallback(async (id: string) => { if (!store?.plans.some((plan) => plan.id === id)) return; await persist({ ...store, activePlanId: id }); }, [persist, store]);
  const saveImportedPlan = useCallback(async (name: string, draft: ImportedPlanDraft) => { if (!store) throw new Error("Plans are still loading."); const id = `plan-${Date.now()}`; const plan: SavedPlan = { id, name: name.trim() || draft.suggestedName, sourceFilename: draft.sourceFilename, sourcePath: draft.sourcePath, importedAt: new Date().toISOString(), state: makeImportedState(id, draft) }; await persist({ ...store, plans: [...store.plans, plan] }); return id; }, [persist, store]);
  const value = useMemo(() => ({ state: active?.state ?? null, plans: store?.plans ?? [], activePlanId: active?.id ?? null, loading, saveOnboarding, toggleTask, markMissed, markUnavailable, markAvailable, studyAhead, updateSettings, resetProgress, exportData, importData, setActivePlan, saveImportedPlan }), [active, store, loading, saveOnboarding, toggleTask, markMissed, markUnavailable, markAvailable, studyAhead, updateSettings, resetProgress, exportData, importData, setActivePlan, saveImportedPlan]);
  return <PlannerContext.Provider value={value}>{children}</PlannerContext.Provider>;
}
export function usePlanner() { const value = useContext(PlannerContext); if (!value) throw new Error("usePlanner must be used within PlannerProvider"); return value; }