import { useMemo, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { usePlanner } from "@/src/app-context";
import { ActionButton, EmptyState, Icon, SectionTitle, StatTile, TaskCard } from "@/src/components/planner-ui";
import { dateKey, formatDate, getTask, todayEntries } from "@/src/scheduler";
import { makeStyles, useTheme } from "@/src/theme";
import { usesNativeTabs } from "@/src/navigation";

export default function TodayScreen() {
  const { state, loading, toggleTask, markMissed, studyAhead } = usePlanner();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useStyles();
  const [showCurriculum, setShowCurriculum] = useState(false);
  if (loading || !state) return <View style={styles.center}><Text style={styles.muted}>Loading today…</Text></View>;
  const today = dateKey();
  const entries = todayEntries(state, today);
  const completedMinutes = entries.filter((entry) => entry.state === "completed").reduce((sum, entry) => sum + entry.plannedMinutes, 0);
  const plannedMinutes = entries.reduce((sum, entry) => sum + entry.plannedMinutes, 0);
  const remainingMinutes = Math.max(0, plannedMinutes - completedMinutes);
  const allTodayDone = entries.length > 0 && entries.every((entry) => entry.state === "completed");
  const pendingCount = state.tasks.length - state.completionRecords.length;
  const firstTask = entries[0] ? getTask(state, entries[0].taskId) : undefined;
  const override = state.dateOverrides.find((item) => item.date === today);
  const sprintLabel = firstTask ? `SPRINT ${firstTask.sprint}  ·  ORIGINAL DAY ${firstTask.originalDay}` : "CURRICULUM COMPLETE";

  return <View style={styles.screen}>
    <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 18, paddingBottom: 28 + (usesNativeTabs ? insets.bottom : 0) }]} showsVerticalScrollIndicator={false}>
      <View style={styles.topbar}><View><Text style={styles.overline}>Aap Ya Paar / OPERATIONS</Text><Text style={styles.title}>Today</Text></View><View style={styles.dateBadge}><Text style={styles.dateDay}>{new Date().getDate()}</Text><Text style={styles.dateMonth}>{new Date().toLocaleDateString(undefined, { month: "short" }).toUpperCase()}</Text></View></View>
      <View style={styles.dateLine}><Icon name="calendar-blank-outline" size={15} color={colors.brandPrimary} /><Text style={styles.dateText}>{formatDate(today)}</Text><Text style={styles.capacityText}>{override?.type === "unavailable" ? "UNAVAILABLE" : `${plannedMinutes} MIN PLANNED`}</Text></View>
      {override?.type === "unavailable" ? <View style={styles.alert}><Icon name="pause-circle-outline" size={18} color={colors.warning} /><Text style={styles.alertText}>{override.reason ?? "Today is unavailable"}. Your plan resumes tomorrow.</Text></View> : null}
      <View style={styles.metrics}><StatTile label="Planned" value={`${plannedMinutes}m`} icon="target" /><StatTile label="Complete" value={`${completedMinutes}m`} accent icon="check-circle-outline" /><StatTile label="Remaining" value={`${remainingMinutes}m`} icon="clock-outline" /></View>
      <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${plannedMinutes ? Math.min(100, (completedMinutes / plannedMinutes) * 100) : 0}%` }]} /></View>
      <SectionTitle eyebrow={sprintLabel} title={entries.length ? "Today's work" : "Clear runway"} action="Curriculum" onAction={() => setShowCurriculum(true)} />
      {entries.length ? <View style={styles.tasks}>{entries.map((entry) => <TaskCard key={`${entry.date}-${entry.taskId}`} entry={entry} state={state} onToggle={() => void toggleTask(entry.taskId)} />)}</View> : <EmptyState icon="check-decagram-outline" title="All curriculum sprints caught up!" message="You have cleared today's runway. Use Study Ahead to pull in the next challenge." />}
      <View style={styles.actions}>{allTodayDone && pendingCount > 0 ? <ActionButton label="Study Ahead +60m" icon="fast-forward" onPress={() => void studyAhead()} /> : null}<ActionButton label="Handle missed day" icon="calendar-remove-outline" onPress={() => Alert.alert("Handle missed day?", "Unfinished work will move to the next available study day.", [{ text: "Cancel", style: "cancel" }, { text: "Mark missed", style: "destructive", onPress: () => void markMissed() }])} secondary /></View>
      <View style={styles.footerNote}><Icon name="shield-check-outline" size={16} color={colors.success} /><Text style={styles.footerText}>Local-first · schedule version {state.scheduleVersion}</Text></View>
    </ScrollView>
    <CurriculumModal visible={showCurriculum} onClose={() => setShowCurriculum(false)} state={state} />
  </View>;
}

function CurriculumModal({ visible, onClose, state }: { visible: boolean; onClose: () => void; state: NonNullable<ReturnType<typeof usePlanner>["state"]> }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const sprints = useMemo(() => Array.from({ length: 9 }, (_, index) => state.tasks.filter((task) => task.sprint === index + 1)), [state.tasks]);
  return <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}><View style={styles.modal}><View style={styles.modalHeader}><View><Text style={styles.overline}>THE FULL RUN</Text><Text style={styles.modalTitle}>Curriculum</Text></View><Pressable onPress={onClose} style={styles.close}><Icon name="close" size={20} color={colors.onSurface} /></Pressable></View><ScrollView contentContainerStyle={styles.modalContent}>{sprints.map((tasks, index) => { const done = tasks.filter((task) => state.completionRecords.some((record) => record.taskId === task.id)).length; return <View key={index} style={styles.sprintRow}><View style={styles.sprintNumber}><Text style={styles.sprintNumberText}>{String(index + 1).padStart(2, "0")}</Text></View><View style={styles.sprintBody}><Text style={styles.sprintTitle}>Sprint {index + 1}</Text><Text style={styles.sprintMeta}>{done}/{tasks.length} tasks cleared</Text></View><Text style={styles.sprintPercent}>{Math.round((done / tasks.length) * 100)}%</Text></View>; })}</ScrollView></View></Modal>;
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { paddingHorizontal: 18, gap: 20 },
  center: { flex: 1, backgroundColor: colors.surface, justifyContent: "center", alignItems: "center" },
  muted: { color: colors.muted, fontSize: 14 },
  topbar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  overline: { color: colors.muted, fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  title: { color: colors.onSurface, fontSize: 34, fontWeight: "900", marginTop: 3 },
  dateBadge: { width: 52, height: 58, backgroundColor: colors.brandPrimary, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  dateDay: { color: colors.onBrandPrimary, fontSize: 22, fontWeight: "900", lineHeight: 23 },
  dateMonth: { color: colors.onBrandPrimary, fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  dateLine: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: -8 },
  dateText: { color: colors.onSurfaceTertiary, fontSize: 14, fontWeight: "700", flex: 1 },
  capacityText: { color: colors.muted, fontSize: 10, fontWeight: "900", letterSpacing: 0.5 },
  alert: { flexDirection: "row", gap: 8, alignItems: "center", backgroundColor: colors.brandTertiary, borderWidth: 1, borderColor: colors.brandSecondary, borderRadius: 10, padding: 12 },
  alertText: { color: colors.onBrandTertiary, fontSize: 13, fontWeight: "700", flex: 1, lineHeight: 18 },
  metrics: { flexDirection: "row", gap: 8 },
  progressBar: { height: 5, backgroundColor: colors.surfaceTertiary, borderRadius: 5, marginTop: -8 },
  progressFill: { height: 5, backgroundColor: colors.success, borderRadius: 5 },
  tasks: { gap: 10, marginTop: -4 },
  actions: { gap: 10, marginTop: -4 },
  footerNote: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, paddingVertical: 4 },
  footerText: { color: colors.muted, fontSize: 11, fontWeight: "700" },
  modal: { flex: 1, backgroundColor: colors.surface, paddingTop: 22 },
  modalHeader: { paddingHorizontal: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: colors.divider },
  modalTitle: { color: colors.onSurface, fontSize: 28, fontWeight: "900", marginTop: 4 },
  close: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceTertiary, alignItems: "center", justifyContent: "center" },
  modalContent: { padding: 20, gap: 10 },
  sprintRow: { minHeight: 68, flexDirection: "row", alignItems: "center", padding: 12, backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border, borderRadius: 10 },
  sprintNumber: { width: 40, height: 40, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center", borderRadius: 8 },
  sprintNumberText: { color: colors.onBrandTertiary, fontSize: 13, fontWeight: "900" },
  sprintBody: { flex: 1, marginLeft: 12, gap: 4 },
  sprintTitle: { color: colors.onSurface, fontSize: 15, fontWeight: "800" },
  sprintMeta: { color: colors.muted, fontSize: 12 },
  sprintPercent: { color: colors.brandPrimary, fontSize: 13, fontWeight: "900" },
}));