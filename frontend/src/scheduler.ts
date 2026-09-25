export type Task = {
  id: string;
  sprint: number;
  originalDay: number;
  sequence: number;
  title: string;
  estimatedMinutes: number;
};

export type CompletionRecord = { taskId: string; completedAt: string };
export type DateOverride = { date: string; type: "unavailable" | "custom_capacity"; capacityMinutes?: number; reason?: string };
export type Settings = { weekdayMinutes: number; saturdayMinutes: number; sundayMinutes: number; reminderTime: string; notificationsEnabled: boolean };
export type ScheduleEntry = { date: string; taskId: string; plannedMinutes: number; state: "scheduled" | "completed" | "carried_forward" };

export type PlannerState = {
  initialized: boolean;
  tasks: Task[];
  completionRecords: CompletionRecord[];
  dateOverrides: DateOverride[];
  extraCapacity: Record<string, number>;
  settings: Settings;
  schedule: ScheduleEntry[];
  scheduleVersion: number;
  lastRecalculatedAt: string;
};

const sprintTopics = [
  ["Arrays & Hashing", ["Set Matrix Zeroes", "Majority Element-II", "Longest Consecutive Sequence", "Subarray Sum Equals K"]],
  ["Two Pointers", ["Valid Palindrome", "3Sum", "Container With Most Water", "Trapping Rain Water"]],
  ["Binary Search", ["Search in Rotated Array", "Find Peak Element", "Median of Two Sorted Arrays", "Koko Eating Bananas"]],
  ["Linked Lists", ["Reverse Linked List", "Detect Cycle", "Merge K Sorted Lists", "LRU Cache"]],
  ["Stacks & Queues", ["Valid Parentheses", "Min Stack", "Largest Rectangle", "Sliding Window Maximum"]],
  ["Trees", ["Maximum Depth", "Level Order Traversal", "Lowest Common Ancestor", "Serialize a Binary Tree"]],
  ["Graphs", ["Number of Islands", "Clone Graph", "Course Schedule", "Word Ladder"]],
  ["Dynamic Programming", ["Climbing Stairs", "House Robber", "Coin Change", "Longest Common Subsequence"]],
  ["Advanced Patterns", ["Backtracking Combinations", "N-Queens", "Union Find", "System Design Review"]],
];

export const CURRICULUM: Task[] = sprintTopics.flatMap(([topic, titles], sprintIndex) =>
  (titles as string[]).map((title, dayIndex) => ({
    id: `s${sprintIndex + 1}-d${dayIndex + 1}`,
    sprint: sprintIndex + 1,
    originalDay: dayIndex + 1,
    sequence: sprintIndex * 4 + dayIndex + 1,
    title,
    estimatedMinutes: [25, 35, 45, 30][dayIndex],
  })),
);

export const DEFAULT_SETTINGS: Settings = { weekdayMinutes: 60, saturdayMinutes: 240, sundayMinutes: 240, reminderTime: "20:30", notificationsEnabled: false };

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

export function formatDate(value: string, options: Intl.DateTimeFormatOptions = { weekday: "long", month: "long", day: "numeric" }): string {
  return dateFromKey(value).toLocaleDateString(undefined, options);
}

function capacityFor(date: Date, settings: Settings): number {
  if (date.getDay() === 6) return settings.saturdayMinutes;
  if (date.getDay() === 0) return settings.sundayMinutes;
  return settings.weekdayMinutes;
}

export function buildSchedule(state: Pick<PlannerState, "tasks" | "completionRecords" | "dateOverrides" | "extraCapacity" | "settings">, start = dateKey()): ScheduleEntry[] {
  const completed = new Map(state.completionRecords.map((record) => [record.taskId, record.completedAt]));
  const doneEntries = state.tasks.filter((task) => completed.has(task.id)).map((task) => ({ date: dateKey(new Date(completed.get(task.id) as string)), taskId: task.id, plannedMinutes: task.estimatedMinutes, state: "completed" as const }));
  const pending = state.tasks.filter((task) => !completed.has(task.id)).sort((a, b) => a.sequence - b.sequence);
  const overrides = new Map(state.dateOverrides.map((item) => [item.date, item]));
  const entries: ScheduleEntry[] = [...doneEntries];
  let cursor = start;
  let taskIndex = 0;
  let guard = 0;
  while (taskIndex < pending.length && guard < 900) {
    const override = overrides.get(cursor);
    const day = dateFromKey(cursor);
    const available = override?.type === "unavailable" ? 0 : override?.capacityMinutes ?? capacityFor(day, state.settings) + (state.extraCapacity[cursor] ?? 0);
    let remaining = available;
    while (taskIndex < pending.length) {
      const task = pending[taskIndex];
      if (available === 0 || (task.estimatedMinutes > remaining && remaining < available)) break;
      entries.push({ date: cursor, taskId: task.id, plannedMinutes: task.estimatedMinutes, state: cursor === start ? "carried_forward" : "scheduled" });
      remaining -= task.estimatedMinutes;
      taskIndex += 1;
      if (remaining <= 0) break;
    }
    cursor = addDays(cursor, 1);
    guard += 1;
  }
  return entries.sort((a, b) => a.date.localeCompare(b.date) || state.tasks.find((task) => task.id === a.taskId)!.sequence - state.tasks.find((task) => task.id === b.taskId)!.sequence);
}

export function createInitialState(): PlannerState {
  const base: PlannerState = { initialized: false, tasks: CURRICULUM, completionRecords: [], dateOverrides: [], extraCapacity: {}, settings: DEFAULT_SETTINGS, schedule: [], scheduleVersion: 1, lastRecalculatedAt: new Date().toISOString() };
  return { ...base, schedule: buildSchedule(base) };
}

export function getTask(state: PlannerState, taskId: string): Task | undefined { return state.tasks.find((task) => task.id === taskId); }
export function todayEntries(state: PlannerState, day = dateKey()): ScheduleEntry[] { return state.schedule.filter((entry) => entry.date === day); }