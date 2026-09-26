import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { usePlanner } from "@/src/app-context";
import { ActionButton, Icon, SectionTitle } from "@/src/components/planner-ui";
import { TaskNoteModal } from "@/src/components/task-note-modal";
import { addDays, dateKey, formatDate, getTask } from "@/src/scheduler";
import { makeStyles, useTheme } from "@/src/theme";
import { usesNativeTabs } from "@/src/navigation";

export default function ScheduleScreen() {
  const { state, saveTaskNote, markAvailable, markUnavailable } = usePlanner();
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  const { colors } = useTheme();
  const [selected, setSelected] = useState(dateKey());
  const [noteTaskId, setNoteTaskId] = useState<string | null>(null);
  const today = dateKey();
  const days = useMemo(() => Array.from({ length: 21 }, (_, index) => addDays(today, index)), [today]);
  if (!state) return <View style={styles.center}><Text style={styles.muted}>Loading schedule…</Text></View>;
  const projected = state.schedule[state.schedule.length - 1]?.date ?? today;
  const selectedEntries = state.schedule.filter((entry) => entry.date === selected);
  const selectedOverride = state.dateOverrides.find((item) => item.date === selected);
  const canEditSelectedDay = selected >= today;
  return <View style={styles.screen}><ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 18, paddingBottom: 28 + (usesNativeTabs ? insets.bottom : 0) }]} showsVerticalScrollIndicator={false}>
    <View style={styles.header}><View><Text style={styles.overline}>Aar Ya Paar / TIMELINE</Text><Text style={styles.title}>Schedule</Text></View><View style={styles.projected}><Text style={styles.projectedLabel}>PROJECTED FINISH</Text><Text style={styles.projectedValue}>{formatDate(projected, { month: "short", day: "numeric", year: "numeric" })}</Text></View></View>
    <View style={styles.legend}><Legend color={colors.brandPrimary} label="Planned" /><Legend color={colors.success} label="Complete" /><Legend color={colors.error} label="Unavailable" /></View>
    <SectionTitle eyebrow="NEXT 21 DAYS" title="Your runway" />
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayRail}>{days.map((day) => { const entries = state.schedule.filter((entry) => entry.date === day); const override = state.dateOverrides.find((item) => item.date === day); const done = entries.length > 0 && entries.every((entry) => entry.state === "completed"); const active = day === selected; return <Pressable testID={`schedule-day-${day}`} key={day} onPress={() => setSelected(day)} style={[styles.dayCell, active && styles.dayCellActive, override?.type === "unavailable" && styles.dayCellUnavailable]}><Text style={[styles.dayWeek, active && styles.activeText]}>{formatDate(day, { weekday: "short" }).toUpperCase()}</Text><Text style={[styles.dayNumber, active && styles.activeText]}>{new Date(`${day}T12:00:00`).getDate()}</Text><View style={[styles.dot, { backgroundColor: override?.type === "unavailable" ? colors.error : done ? colors.success : entries.length ? colors.brandPrimary : colors.borderStrong }]} /></Pressable>; })}</ScrollView>
    <View style={styles.detailCard}><View style={styles.detailTop}><View><Text style={styles.detailEyebrow}>{selected === today ? "TODAY" : selected < today ? "PAST" : "UPCOMING"}</Text><Text style={styles.detailTitle}>{formatDate(selected, { weekday: "long", month: "long", day: "numeric" })}</Text></View>{selectedOverride ? <View style={styles.unavailablePill}><Text style={styles.unavailableText}>UNAVAILABLE</Text></View> : null}</View>{selectedEntries.length ? <View style={styles.entryList}>{selectedEntries.map((entry) => { const task = getTask(state, entry.taskId); const hasNote = Boolean(state.notesByTaskId[entry.taskId]); return <Pressable key={entry.taskId} testID={`schedule-task-note-${entry.taskId}`} accessibilityRole="button" accessibilityLabel={`Open note for ${task?.title ?? "task"}`} onPress={() => setNoteTaskId(entry.taskId)} style={styles.entry}><Icon name={entry.state === "completed" ? "check-circle" : "circle-outline"} size={19} color={entry.state === "completed" ? colors.success : colors.brandPrimary} /><Text style={[styles.entryTitle, entry.state === "completed" && styles.done]}>{task?.title}</Text>{hasNote ? <Icon name="notebook" size={16} color={colors.brandPrimary} /> : null}<Text style={styles.entryMinutes}>{entry.plannedMinutes}m</Text></Pressable>; })}</View> : <Text style={styles.emptyText}>{selectedOverride ? selectedOverride.reason : "No tasks are assigned to this day."}</Text>}{canEditSelectedDay && selectedOverride ? <ActionButton testID="mark-available-button" label="Mark available" icon="calendar-check-outline" secondary onPress={() => void markAvailable(selected)} /> : null}{selected > today && !selectedOverride ? <ActionButton testID="mark-unavailable-button" label="Mark unavailable" icon="calendar-remove-outline" secondary onPress={() => void markUnavailable(selected)} /> : null}</View>
  </ScrollView><TaskNoteModal key={noteTaskId ?? "closed"} visible={Boolean(noteTaskId)} taskId={noteTaskId} state={state} onClose={() => setNoteTaskId(null)} onSave={saveTaskNote} /></View>;
}

function Legend({ color, label }: { color: string; label: string }) { const styles = useStyles(); return <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: color }]} /><Text style={styles.legendText}>{label}</Text></View>; }

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.surface }, content: { paddingHorizontal: 18, gap: 22 }, center: { flex: 1, backgroundColor: colors.surface, justifyContent: "center", alignItems: "center" }, muted: { color: colors.muted },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" }, overline: { color: colors.muted, fontSize: 10, fontWeight: "900", letterSpacing: 1.2 }, title: { color: colors.onSurface, fontSize: 34, fontWeight: "900", marginTop: 3 }, projected: { alignItems: "flex-end", gap: 3 }, projectedLabel: { color: colors.muted, fontSize: 9, fontWeight: "900", letterSpacing: 0.6 }, projectedValue: { color: colors.brandPrimary, fontSize: 13, fontWeight: "900" },
  legend: { flexDirection: "row", gap: 16 }, legendItem: { flexDirection: "row", alignItems: "center", gap: 6 }, legendDot: { width: 7, height: 7, borderRadius: 4 }, legendText: { color: colors.muted, fontSize: 11, fontWeight: "700" }, dayRail: { gap: 8, paddingRight: 18 }, dayCell: { width: 52, height: 76, borderWidth: 1, borderColor: colors.border, borderRadius: 10, alignItems: "center", justifyContent: "center", gap: 5, backgroundColor: colors.surfaceSecondary }, dayCellActive: { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary }, dayCellUnavailable: { borderColor: colors.error }, dayWeek: { color: colors.muted, fontSize: 10, fontWeight: "900" }, dayNumber: { color: colors.onSurface, fontSize: 20, fontWeight: "900" }, activeText: { color: colors.onBrandPrimary }, dot: { width: 6, height: 6, borderRadius: 3 },
  detailCard: { backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 16, gap: 16 }, detailTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }, detailEyebrow: { color: colors.brandPrimary, fontSize: 10, fontWeight: "900", letterSpacing: 1 }, detailTitle: { color: colors.onSurface, fontSize: 20, fontWeight: "800", marginTop: 5 }, unavailablePill: { backgroundColor: colors.error, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 5 }, unavailableText: { color: colors.onError, fontSize: 9, fontWeight: "900" }, entryList: { gap: 4 }, entry: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 9, borderRadius: 8, paddingHorizontal: 6 }, entryTitle: { color: colors.onSurface, fontSize: 14, fontWeight: "700", flex: 1 }, entryMinutes: { color: colors.muted, fontSize: 12, fontWeight: "800" }, done: { color: colors.muted, textDecorationLine: "line-through" }, emptyText: { color: colors.muted, fontSize: 14, lineHeight: 20 },
}));
