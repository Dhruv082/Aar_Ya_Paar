import * as Clipboard from "expo-clipboard";
import * as Notifications from "expo-notifications";
import { PropsWithChildren, createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Alert, Platform } from "react-native";

import { storage } from "@/src/utils/storage";
import { buildSchedule, createInitialState, dateKey, DEFAULT_SETTINGS, PlannerState } from "@/src/scheduler";

const STORAGE_KEY = "aap_ya_paar_state_v1";
type Settings = PlannerState["settings"];
type PlannerContextValue = {
  state: PlannerState | null;
  loading: boolean;
  saveOnboarding: (settings: Settings) => Promise<void>;
  toggleTask: (taskId: string) => Promise<void>;
  markMissed: () => Promise<void>;
  markUnavailable: (date: string, reason?: string) => Promise<void>;
  studyAhead: () => Promise<void>;
  updateSettings: (settings: Settings) => Promise<void>;
  resetProgress: () => Promise<void>;
  exportData: () => Promise<void>;
  importData: () => Promise<void>;
};

const PlannerContext = createContext<PlannerContextValue | null>(null);

function withSchedule(next: PlannerState): PlannerState {
  return { ...next, schedule: buildSchedule(next), scheduleVersion: next.scheduleVersion + 1, lastRecalculatedAt: new Date().toISOString() };
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
    const next = saved ? withSchedule({ ...saved, settings: { ...DEFAULT_SETTINGS, ...saved.settings }, extraCapacity: saved.extraCapacity ?? {} }) : createInitialState();
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
    await persist(withSchedule({ ...state, completionRecords }));
  }, [persist, state]);

  const markMissed = useCallback(async () => {
    if (!state) return;
    const today = dateKey();
    const dateOverrides = [...state.dateOverrides.filter((item) => item.date !== today), { date: today, type: "unavailable" as const, reason: "Missed study day" }];
    await persist(withSchedule({ ...state, dateOverrides }));
  }, [persist, state]);

  const markUnavailable = useCallback(async (date: string, reason = "Freedom day") => {
    if (!state) return;
    const dateOverrides = [...state.dateOverrides.filter((item) => item.date !== date), { date, type: "unavailable" as const, reason }];
    await persist(withSchedule({ ...state, dateOverrides }));
  }, [persist, state]);

  const studyAhead = useCallback(async () => {
    if (!state) return;
    const today = dateKey();
    await persist(withSchedule({ ...state, extraCapacity: { ...state.extraCapacity, [today]: (state.extraCapacity[today] ?? 0) + 60 } }));
  }, [persist, state]);

  const updateSettings = useCallback(async (settings: Settings) => {
    if (!state) return;
    await persist(withSchedule({ ...state, settings }));
    if (settings.notificationsEnabled && Platform.OS !== "web") {
      const permissions = await Notifications.getPermissionsAsync();
      if (!permissions.granted) await Notifications.requestPermissionsAsync();
      const [hour, minute] = settings.reminderTime.split(":").map(Number);
      await Notifications.scheduleNotificationAsync({
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
      await persist(withSchedule(parsed));
      Alert.alert("Backup restored", "Your schedule has been recalculated.");
    } catch {
      Alert.alert("Import unavailable", "Copy a valid Aap Ya Paar JSON backup first.");
    }
  }, [persist]);

  const value = useMemo(() => ({ state, loading, saveOnboarding, toggleTask, markMissed, markUnavailable, studyAhead, updateSettings, resetProgress, exportData, importData }), [state, loading, saveOnboarding, toggleTask, markMissed, markUnavailable, studyAhead, updateSettings, resetProgress, exportData, importData]);
  return <PlannerContext.Provider value={value}>{children}</PlannerContext.Provider>;
}

export function usePlanner() {
  const value = useContext(PlannerContext);
  if (!value) throw new Error("usePlanner must be used within PlannerProvider");
  return value;
}