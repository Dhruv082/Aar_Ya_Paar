import { STUDY_PLAN } from "@/src/curriculum";

export type Task = {
  id: string;
  sprint: number;
  originalDay: number;
  sequence: number;
  title: string;
  estimatedMinutes: number;
};

export type CompletionRecord = { taskId: string; completedAt: string };
export type DateOverride = {
  date: string;
  type: "unavailable" | "custom_capacity";
  capacityMinutes?: number;
  reason?: string;
  reservedTaskIds?: string[];
};
export type Settings = {
  weekdayMinutes: number;
  saturdayMinutes: number;
  sundayMinutes: number;
  reminderTime: string;
  notificationsEnabled: boolean;
};
export type ScheduleEntry = {
  date: string;
  taskId: string;
  plannedMinutes: number;
  state: "scheduled" | "completed" | "carried_forward";
};

export type PlannerState = {
  initialized: boolean;
  curriculumVersion: number;
  planStartDate: string;
  tasks: Task[];
  completionRecords: CompletionRecord[];
  /** Personal, plan-local notes keyed by the stable task id. */
  notesByTaskId: Record<string, string>;
  dateOverrides: DateOverride[];
  extraCapacity: Record<string, number>;
  settings: Settings;
  schedule: ScheduleEntry[];
  scheduleVersion: number;
  lastRecalculatedAt: string;
};

let sequence = 0;
export const CURRICULUM: Task[] = STUDY_PLAN.flatMap((sprint, sprintIndex) =>
  sprint.flatMap((day, dayIndex) =>
    day.map(([title, estimatedMinutes], taskIndex) => ({
      id: `s${sprintIndex + 1}-d${dayIndex + 1}-t${taskIndex + 1}`,
      sprint: sprintIndex + 1,
      originalDay: dayIndex + 1,
      sequence: ++sequence,
      title,
      estimatedMinutes,
    })),
  ),
);

export const DEFAULT_SETTINGS: Settings = {
  weekdayMinutes: 60,
  saturdayMinutes: 240,
  sundayMinutes: 240,
  reminderTime: "20:30",
  notificationsEnabled: false,
};

export function dateKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function dateFromKey(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d, 12);
}

export function addDays(value: string, amount: number): string {
  const next = dateFromKey(value);
  next.setDate(next.getDate() + amount);
  return dateKey(next);
}

export function visibleScheduleDates(
  schedule: ScheduleEntry[],
  today = dateKey(),
  dateOverrides: DateOverride[] = [],
): string[] {
  const windowStart = addDays(today, -5);
  const dates = new Set(
    Array.from({ length: 31 }, (_, index) => addDays(windowStart, index)),
  );
  for (const entry of schedule) {
    if (
      entry.date < windowStart &&
      entry.date < today &&
      entry.state !== "completed"
    )
      dates.add(entry.date);
  }
  for (const override of dateOverrides) {
    if (
      override.date < windowStart &&
      override.date < today &&
      override.type === "unavailable"
    )
      dates.add(override.date);
  }
  return [...dates].sort();
}

export function formatDate(
  value: string,
  options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    month: "long",
    day: "numeric",
  },
): string {
  return dateFromKey(value).toLocaleDateString(undefined, options);
}

function capacityFor(date: Date, settings: Settings): number {
  if (date.getDay() === 6) return settings.saturdayMinutes;
  if (date.getDay() === 0) return settings.sundayMinutes;
  return settings.weekdayMinutes;
}

export function buildSchedule(
  state: Pick<
    PlannerState,
    | "planStartDate"
    | "tasks"
    | "completionRecords"
    | "dateOverrides"
    | "extraCapacity"
    | "settings"
  >,
  start = state.planStartDate ?? dateKey(),
): ScheduleEntry[] {
  const completed = new Map(
    state.completionRecords.map((record) => [
      record.taskId,
      record.completedAt,
    ]),
  );
  const doneEntries = state.tasks
    .filter((task) => completed.has(task.id))
    .map((task) => ({
      date: dateKey(new Date(completed.get(task.id) as string)),
      taskId: task.id,
      plannedMinutes: task.estimatedMinutes,
      state: "completed" as const,
    }));
  const pending = state.tasks
    .filter((task) => !completed.has(task.id))
    .sort((a, b) => a.sequence - b.sequence);
  const overrides = new Map(
    state.dateOverrides.map((item) => [item.date, item]),
  );
  const entries: ScheduleEntry[] = [...doneEntries];
  let cursor = start;
  let taskIndex = 0;
  let guard = 0;
  while (taskIndex < pending.length && guard < 900) {
    const override = overrides.get(cursor);
    const day = dateFromKey(cursor);
    const available =
      override?.type === "unavailable"
        ? 0
        : (override?.capacityMinutes ?? capacityFor(day, state.settings)) +
          (state.extraCapacity[cursor] ?? 0);
    let remaining = available;
    while (taskIndex < pending.length) {
      const task = pending[taskIndex];
      if (
        available === 0 ||
        (task.estimatedMinutes > remaining && remaining < available)
      )
        break;
      entries.push({
        date: cursor,
        taskId: task.id,
        plannedMinutes: task.estimatedMinutes,
        state: cursor === start ? "carried_forward" : "scheduled",
      });
      remaining -= task.estimatedMinutes;
      taskIndex += 1;
      if (remaining <= 0) break;
    }
    cursor = addDays(cursor, 1);
    guard += 1;
  }
  return entries.sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      state.tasks.find((task) => task.id === a.taskId)!.sequence -
        state.tasks.find((task) => task.id === b.taskId)!.sequence,
  );
}

export function rescheduleFrom(
  state: PlannerState,
  start: string,
): ScheduleEntry[] {
  const completed = new Set(
    state.completionRecords.map((record) => record.taskId),
  );
  const locked = state.schedule.filter(
    (entry) => completed.has(entry.taskId) || entry.date < start,
  );
  const lockedIds = new Set(locked.map((entry) => entry.taskId));
  const pending = state.tasks.filter(
    (task) => !completed.has(task.id) && !lockedIds.has(task.id),
  );
  const rebuilt = buildSchedule({ ...state, tasks: pending }, start);
  return [...locked, ...rebuilt].sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      state.tasks.find((task) => task.id === a.taskId)!.sequence -
        state.tasks.find((task) => task.id === b.taskId)!.sequence,
  );
}

export function restoreUnavailableDay(
  state: PlannerState,
  date: string,
  reservedTaskIds: string[],
): ScheduleEntry[] {
  const completed = new Set(
    state.completionRecords.map((record) => record.taskId),
  );
  const reserved = new Set(
    reservedTaskIds.filter((taskId) => !completed.has(taskId)),
  );
  const locked = state.schedule.filter(
    (entry) => completed.has(entry.taskId) || entry.date < date,
  );
  const lockedIds = new Set(locked.map((entry) => entry.taskId));
  const restored = state.tasks
    .filter((task) => reserved.has(task.id) && !lockedIds.has(task.id))
    .map((task) => ({
      date,
      taskId: task.id,
      plannedMinutes: task.estimatedMinutes,
      state:
        date === dateKey()
          ? ("carried_forward" as const)
          : ("scheduled" as const),
    }));
  const excluded = new Set([...lockedIds, ...reserved]);
  const remaining = state.tasks.filter(
    (task) => !completed.has(task.id) && !excluded.has(task.id),
  );
  const rebuilt = buildSchedule(
    { ...state, tasks: remaining },
    addDays(date, 1),
  );
  return [...locked, ...restored, ...rebuilt].sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      state.tasks.find((task) => task.id === a.taskId)!.sequence -
        state.tasks.find((task) => task.id === b.taskId)!.sequence,
  );
}

export function createInitialState(): PlannerState {
  const base: PlannerState = {
    initialized: false,
    curriculumVersion: 2,
    planStartDate: dateKey(),
    tasks: CURRICULUM,
    completionRecords: [],
    notesByTaskId: {},
    dateOverrides: [],
    extraCapacity: {},
    settings: DEFAULT_SETTINGS,
    schedule: [],
    scheduleVersion: 1,
    lastRecalculatedAt: new Date().toISOString(),
  };
  return { ...base, schedule: buildSchedule(base) };
}

export function getTask(state: PlannerState, taskId: string): Task | undefined {
  return state.tasks.find((task) => task.id === taskId);
}
export function todayEntries(
  state: PlannerState,
  day = dateKey(),
): ScheduleEntry[] {
  return state.schedule.filter((entry) => entry.date === day);
}
