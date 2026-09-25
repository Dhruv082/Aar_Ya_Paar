import * as Clipboard from "expo-clipboard";
import Constants from "expo-constants";
import { PropsWithChildren, createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Alert, Platform } from "react-native";

import { storage } from "@/src/utils/storage";
import { addDays, buildSchedule, createInitialState, CURRICULUM, dateKey, DEFAULT_SETTINGS, PlannerState, rescheduleFrom, restoreUnavailableDay, ScheduleEntry } from "@/src/scheduler";

const STORAGE_KEY = "aap_ya_paar_state_v1";
type Settings = PlannerState["settings"];
type NotificationsModule = typeof import("expo-notifications");

async function getNotifications(): Promise<NotificationsModule | null> {
  const isExpoGoAndroid = Platform.OS === "android" && Constants.executionEnvironment === "storeClient";
  if (Platform.OS === "web" || isExpoGoAndroid) return null;
  return import("expo-notifications");
}

type PlannerContextValue = {
  state: PlannerState | null;
  loading: boolean;
  saveOnboarding: (settings: Settings) => Promise<void>;
  toggleTask: (taskId: string) => Promise<void>;
  markMissed: () => Promise<void>;
  markUnavailable: (date: string, reason?: string) => Promise<void>;
  markAvailable: (date: string) => Promise<void>;
  studyAhead: () => Promise<void>;
  updateSettings: (settings: Settings) => Promise<void>;
  resetProgress: () => Promise<void>;
  exportData: () => Promise<void>;
  importData: () => Promise<void>;
};

const PlannerContext = createContext<PlannerContextValue | null>(null);

function syncCompletion(schedule: ScheduleEntry[], next: PlannerState): ScheduleEntry[] {
  const completed = new Set(next.completionRecords.map((record) => record.taskId));
  return schedule.map((entry) => ({ ...entry, state: completed.has(entry.taskId) ? "completed" : entry.state === "completed" ? "scheduled" : entry.state }));
}

function withSchedule(next: PlannerState, schedule = buildSchedule(next)): PlannerState {
  return { ...next, schedule: syncCompletion(schedule, next), scheduleVersion: next.scheduleVersion + 1, lastRecalculatedAt: new Date().toISOString() };
}

function migrateSavedState(saved: PlannerState): PlannerState {
  const needsCurriculumMigration = saved.curriculumVersion !== 2 || saved.tasks.length !== CURRICULUM.length;
  if (!needsCurriculumMigration) return { ...saved, settings: { ...DEFAULT_SETTINGS, ...saved.settings }, extraCapacity: saved.extraCapacity ?? {} };
  const completedTitles = new Set(saved.completionRecords.map((record) => saved.tasks.find((task) => task.id === record.taskId)?.title).filter(Boolean));
  const completionRecords = CURRICULUM.filter((task) => completedTitles.has(task.title)).map((task) => ({ taskId: task.id, completedAt: new Date().toISOString() }));
  return { ...saved, curriculumVersion: 2, tasks: CURRICULUM, completionRecords, dateOverrides: saved.dateOverrides ?? [], extraCapacity: saved.extraCapacity ?? {}, settings: { ...DEFAULT_SETTINGS, ...saved.settings }, schedule: [] };
}

export function PlannerProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<PlannerState | null>(null);
  const [loading, setLoading] = useState(true);

  const persist = useCallback(async (next: PlannerState) => {
    setState(next);
    await storage.setItem(STORAGE_KEY, next);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    const saved = await storage.getItem<PlannerState | null>(STORAGE_KEY, null);
    const normalized = saved ? migrateSavedState(saved) : null;
    const next = normalized ? withSchedule(normalized, normalized.schedule.length ? normalized.schedule : buildSchedule(normalized)) : createInitialState();
    setState(next);
    if (saved) await storage.setItem(STORAGE_KEY, next);
    setLoading(false);
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const saveOnboarding = useCallback(async (settings: Settings) => {
    const next = withSchedule({ ...(state ?? createInitialState()), initialized: true, settings });
    await persist(next);
  }, [persist, state]);

  const toggleTask = useCallback(async (taskId: string) => {
    if (!state) return;
    const exists = state.completionRecords.some((item) => item.taskId === taskId);
    const completionRecords = exists
      ? state.completionRecords.filter((item) => item.taskId !== taskId)
      : [...state.completionRecords, { taskId, completedAt: new Date().toISOString() }];
    await persist(withSchedule({ ...state, completionRecords }, state.schedule));
  }, [persist, state]);

  const markMissed = useCallback(async () => {
    if (!state) return;
    const today = dateKey();
    const reservedTaskIds = state.schedule.filter((entry) => entry.date === today && entry.state !== "completed").map((entry) => entry.taskId);
    const dateOverrides = [...state.dateOverrides.filter((item) => item.date !== today), { date: today, type: "unavailable" as const, reason: "Missed study day", reservedTaskIds }];
    const next = { ...state, dateOverrides };
    await persist(withSchedule(next, rescheduleFrom(next, addDays(today, 1))));
  }, [persist, state]);

  const markUnavailable = useCallback(async (date: string, reason = "Freedom day") => {
    if (!state) return;
    const existing = state.dateOverrides.find((item) => item.date === date);
    const reservedTaskIds = existing?.reservedTaskIds ?? state.schedule.filter((entry) => entry.date === date && entry.state !== "completed").map((entry) => entry.taskId);
    const dateOverrides = [...state.dateOverrides.filter((item) => item.date !== date), { date, type: "unavailable" as const, reason, reservedTaskIds }];
    const next = { ...state, dateOverrides };
    await persist(withSchedule(next, rescheduleFrom(next, date)));
  }, [persist, state]);

  const markAvailable = useCallback(async (date: string) => {
    if (!state) return;
    const override = state.dateOverrides.find((item) => item.date === date);
    const fallbackTask = state.schedule.find((entry) => entry.date >= date && entry.state !== "completed")?.taskId;
    const reservedTaskIds = override?.reservedTaskIds?.length ? override.reservedTaskIds : fallbackTask ? [fallbackTask] : [];
    const next = { ...state, dateOverrides: state.dateOverrides.filter((item) => item.date !== date) };
    await persist(withSchedule(next, reservedTaskIds.length ? restoreUnavailableDay(next, date, reservedTaskIds) : rescheduleFrom(next, date)));
  }, [persist, state]);

  const studyAhead = useCallback(async () => {
    if (!state) return;
    const today = dateKey();
    const next = { ...state, extraCapacity: { ...state.extraCapacity, [today]: (state.extraCapacity[today] ?? 0) + 60 } };
    await persist(withSchedule(next, rescheduleFrom(next, today)));
  }, [persist, state]);

  const updateSettings = useCallback(async (settings: Settings) => {
    if (!state) return;
    const next = { ...state, settings };
    await persist(withSchedule(next, rescheduleFrom(next, addDays(dateKey(), 1))));
    const notifications = await getNotifications();
    if (settings.notificationsEnabled && notifications) {
      const permissions = await notifications.getPermissionsAsync();
      if (!permissions.granted) await notifications.requestPermissionsAsync();
      const [hour, minute] = settings.reminderTime.split(":").map(Number);
      await notifications.scheduleNotificationAsync({
        content: { title: "Aap Ya Paar", body: "Time to study. Your next task is waiting." },
        trigger: { hour, minute, repeats: true } as any,
      });
    }
  }, [persist, state]);

  const resetProgress = useCallback(async () => {
    const fresh = createInitialState();
    await persist({ ...fresh, initialized: true, settings: state?.settings ?? DEFAULT_SETTINGS });
  }, [persist, state]);

  const exportData = useCallback(async () => {
    if (!state) return;
    await Clipboard.setStringAsync(JSON.stringify(state));
    Alert.alert("Backup copied", "Your planner data is now in the clipboard.");
  }, [state]);

  const importData = useCallback(async () => {
    const raw = await Clipboard.getStringAsync();
    try {
      const parsed = JSON.parse(raw) as PlannerState;
      if (!parsed.tasks || !parsed.settings) throw new Error("Invalid backup");
      const normalized = migrateSavedState(parsed);
      await persist(withSchedule(normalized, normalized.schedule.length ? normalized.schedule : buildSchedule(normalized)));
      Alert.alert("Backup restored", "Your schedule has been recalculated.");
    } catch {
      Alert.alert("Import unavailable", "Copy a valid Aap Ya Paar JSON backup first.");
    }
  }, [persist]);

  const value = useMemo(() => ({ state, loading, saveOnboarding, toggleTask, markMissed, markUnavailable, markAvailable, studyAhead, updateSettings, resetProgress, exportData, importData }), [state, loading, saveOnboarding, toggleTask, markMissed, markUnavailable, markAvailable, studyAhead, updateSettings, resetProgress, exportData, importData]);
  return <PlannerContext.Provider value={value}>{children}</PlannerContext.Provider>;
}

export function usePlanner() {
  const value = useContext(PlannerContext);
  if (!value) throw new Error("usePlanner must be used within PlannerProvider");
  return value;
}