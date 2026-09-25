import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { usePlanner } from "@/src/app-context";
import { Icon, SectionTitle, StatTile } from "@/src/components/planner-ui";
import { formatDate } from "@/src/scheduler";
import { makeStyles, useTheme } from "@/src/theme";
import { usesNativeTabs } from "@/src/navigation";

export default function ProgressScreen() {
  const { state } = usePlanner();
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  const { colors } = useTheme();
  if (!state) return <View style={styles.center}><Text style={styles.muted}>Loading progress…</Text></View>;
  const completed = state.completionRecords.length;
  const total = state.tasks.length;
  const percent = Math.round((completed / total) * 100);
  const completedMinutes = state.tasks.filter((task) => state.completionRecords.some((record) => record.taskId === task.id)).reduce((sum, task) => sum + task.estimatedMinutes, 0);
  const projected = state.schedule[state.schedule.length - 1]?.date;
  const sprintRows = Array.from({ length: 9 }, (_, index) => { const tasks = state.tasks.filter((task) => task.sprint === index + 1); const done = tasks.filter((task) => state.completionRecords.some((record) => record.taskId === task.id)).length; return { sprint: index + 1, done, total: tasks.length }; });
  const studyDays = new Set(state.completionRecords.map((record) => record.completedAt.slice(0, 10))).size;
  return <View style={styles.screen}><ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 18, paddingBottom: 28 + (usesNativeTabs ? insets.bottom : 0) }]} showsVerticalScrollIndicator={false}>
    <View><Text style={styles.overline}>Aap Ya Paar / SIGNAL</Text><Text style={styles.title}>Progress</Text><Text style={styles.subtitle}>A clear read on the work behind you.</Text></View>
    <View style={styles.heroCard}><View style={styles.ring}><Text style={styles.ringValue}>{percent}%</Text><Text style={styles.ringLabel}>COMPLETE</Text></View><View style={styles.heroCopy}><Text style={styles.heroTitle}>{completed === 0 ? "Start your first sprint." : `${completed} tasks in the books.`}</Text><Text style={styles.heroText}>{projected ? `At your current pace, you finish on ${formatDate(projected, { month: "short", day: "numeric", year: "numeric" })}.` : "Keep moving through the sequence."}</Text></View></View>
    <View style={styles.metrics}><StatTile label="Tasks" value={`${completed}/${total}`} icon="format-list-checks" /><StatTile label="Minutes" value={`${completedMinutes}`} accent icon="timer-check-outline" /><StatTile label="Study days" value={`${studyDays}`} icon="calendar-check-outline" /></View>
    <SectionTitle eyebrow="THE FULL RUN" title="Sprint breakdown" />
    <View style={styles.sprintCard}>{sprintRows.map((row) => <View key={row.sprint} style={styles.sprintLine}><Text style={styles.sprintName}>S{String(row.sprint).padStart(2, "0")}</Text><View style={styles.sprintTrack}><View style={[styles.sprintFill, { width: `${(row.done / row.total) * 100}%` }]} /></View><Text style={styles.sprintCount}>{row.done}/{row.total}</Text></View>)}</View>
    <View style={styles.insight}><Icon name="brain" size={21} color={colors.brandPrimary} /><View style={styles.insightBody}><Text style={styles.insightTitle}>Deterministic by design</Text><Text style={styles.insightText}>Your sequence never changes. Capacity and real-life days are the only variables.</Text></View></View>
  </ScrollView></View>;
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.surface }, content: { paddingHorizontal: 18, gap: 22 }, center: { flex: 1, backgroundColor: colors.surface, justifyContent: "center", alignItems: "center" }, muted: { color: colors.muted }, overline: { color: colors.muted, fontSize: 10, fontWeight: "900", letterSpacing: 1.2 }, title: { color: colors.onSurface, fontSize: 34, fontWeight: "900", marginTop: 3 }, subtitle: { color: colors.onSurfaceSecondary, fontSize: 14, marginTop: 7 },
  heroCard: { backgroundColor: colors.brandTertiary, borderWidth: 1, borderColor: colors.brandSecondary, borderRadius: 14, padding: 18, flexDirection: "row", alignItems: "center", gap: 18 }, ring: { width: 84, height: 84, borderRadius: 42, borderWidth: 6, borderColor: colors.brandPrimary, alignItems: "center", justifyContent: "center" }, ringValue: { color: colors.onBrandTertiary, fontSize: 22, fontWeight: "900" }, ringLabel: { color: colors.onBrandTertiary, fontSize: 8, fontWeight: "900", letterSpacing: 0.5 }, heroCopy: { flex: 1, gap: 7 }, heroTitle: { color: colors.onSurface, fontSize: 17, fontWeight: "900" }, heroText: { color: colors.onSurfaceSecondary, fontSize: 12, lineHeight: 18 }, metrics: { flexDirection: "row", gap: 8 }, sprintCard: { backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 16, gap: 17 }, sprintLine: { flexDirection: "row", alignItems: "center", gap: 10 }, sprintName: { color: colors.muted, width: 26, fontSize: 12, fontWeight: "900" }, sprintTrack: { flex: 1, height: 7, backgroundColor: colors.surfaceTertiary, borderRadius: 4, overflow: "hidden" }, sprintFill: { height: 7, backgroundColor: colors.brandPrimary, borderRadius: 4 }, sprintCount: { color: colors.onSurfaceSecondary, fontSize: 11, fontWeight: "800", width: 30, textAlign: "right" }, insight: { flexDirection: "row", gap: 12, padding: 15, borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.surfaceSecondary }, insightBody: { flex: 1, gap: 4 }, insightTitle: { color: colors.onSurface, fontSize: 14, fontWeight: "800" }, insightText: { color: colors.muted, fontSize: 12, lineHeight: 18 },
}));