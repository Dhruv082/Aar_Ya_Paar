import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import { getTask, PlannerState, ScheduleEntry } from "@/src/scheduler";
import { makeStyles, useTheme } from "@/src/theme";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

export function Icon({ name, size = 20, color }: { name: IconName; size?: number; color?: string }) {
  const { colors } = useTheme();
  return <MaterialCommunityIcons name={name} size={size} color={color ?? colors.onSurface} />;
}

export function ActionButton({ label, icon, onPress, secondary = false, disabled = false }: { label: string; icon?: IconName; onPress: () => void; secondary?: boolean; disabled?: boolean }) {
  const styles = useStyles();
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.button, secondary && styles.secondaryButton, disabled && styles.disabledButton, pressed && styles.pressed]}>
    {icon ? <Icon name={icon} size={18} color={secondary ? undefined : styles.buttonText.color} /> : null}
    <Text style={secondary ? styles.secondaryButtonText : styles.buttonText}>{label}</Text>
  </Pressable>;
}

export function StatTile({ label, value, accent = false, icon }: { label: string; value: string; accent?: boolean; icon?: IconName }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return <View style={[styles.statTile, accent && { borderColor: colors.brandSecondary }]}>
    <View style={styles.statTop}>{icon ? <Icon name={icon} size={16} color={accent ? colors.brandPrimary : colors.muted} /> : null}<Text style={styles.statLabel}>{label}</Text></View>
    <Text style={[styles.statValue, accent && { color: colors.brandPrimary }]}>{value}</Text>
  </View>;
}

export function TaskCard({ entry, state, onToggle }: { entry: ScheduleEntry; state: PlannerState; onToggle: () => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const task = getTask(state, entry.taskId);
  if (!task) return null;
  const complete = entry.state === "completed";
  return <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: complete }} onPress={onToggle} style={({ pressed }) => [styles.taskCard, pressed && styles.pressed]}>
    <View style={[styles.checkbox, complete && { backgroundColor: colors.success, borderColor: colors.success }]}>{complete ? <Icon name="check" size={16} color={colors.onSuccess} /> : null}</View>
    <View style={styles.taskBody}><Text style={[styles.taskTitle, complete && styles.completedText]}>{task.title}</Text><Text style={styles.taskMeta}>SPRINT {task.sprint}  /  ORIGINAL DAY {task.originalDay}</Text></View>
    <Text style={styles.taskMinutes}>{task.estimatedMinutes}m</Text>
  </Pressable>;
}

export function SectionTitle({ eyebrow, title, action, onAction }: { eyebrow?: string; title: string; action?: string; onAction?: () => void }) {
  const styles = useStyles();
  return <View style={styles.sectionHeader}><View>{eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}<Text style={styles.sectionTitle}>{title}</Text></View>{action && onAction ? <Pressable onPress={onAction} hitSlop={10}><Text style={styles.link}>{action}</Text></Pressable> : null}</View>;
}

export function EmptyState({ icon, title, message }: { icon: IconName; title: string; message: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return <View style={styles.empty}><Icon name={icon} size={32} color={colors.brandPrimary} /><Text style={styles.emptyTitle}>{title}</Text><Text style={styles.emptyMessage}>{message}</Text></View>;
}

const useStyles = makeStyles((colors) => ({
  button: { minHeight: 48, paddingHorizontal: 18, borderRadius: 12, backgroundColor: colors.brandPrimary, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  secondaryButton: { backgroundColor: colors.surfaceTertiary, borderWidth: 1, borderColor: colors.border },
  disabledButton: { opacity: 0.45 },
  pressed: { opacity: 0.78, transform: [{ scale: 0.985 }] },
  buttonText: { color: colors.onBrandPrimary, fontSize: 14, fontWeight: "800", letterSpacing: 0.3 },
  secondaryButtonText: { color: colors.onSurface, fontSize: 14, fontWeight: "700" },
  statTile: { flex: 1, minHeight: 78, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, backgroundColor: colors.surfaceSecondary },
  statTop: { flexDirection: "row", alignItems: "center", gap: 6 },
  statLabel: { color: colors.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.6, fontWeight: "700" },
  statValue: { color: colors.onSurface, fontSize: 22, fontWeight: "800", marginTop: 6 },
  taskCard: { minHeight: 76, padding: 14, borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.surfaceSecondary, flexDirection: "row", alignItems: "center", gap: 12 },
  checkbox: { width: 28, height: 28, borderRadius: 8, borderWidth: 1.5, borderColor: colors.borderStrong, alignItems: "center", justifyContent: "center" },
  taskBody: { flex: 1, gap: 5 },
  taskTitle: { color: colors.onSurface, fontSize: 16, fontWeight: "700" },
  completedText: { color: colors.muted, textDecorationLine: "line-through" },
  taskMeta: { color: colors.muted, fontSize: 10, letterSpacing: 0.5, fontWeight: "700" },
  taskMinutes: { color: colors.onSurfaceSecondary, fontSize: 13, fontWeight: "800" },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12 },
  eyebrow: { color: colors.brandPrimary, fontSize: 11, letterSpacing: 1.3, fontWeight: "800", textTransform: "uppercase", marginBottom: 4 },
  sectionTitle: { color: colors.onSurface, fontSize: 22, fontWeight: "800" },
  link: { color: colors.brandPrimary, fontSize: 13, fontWeight: "800" },
  empty: { paddingVertical: 44, alignItems: "center", gap: 10 },
  emptyTitle: { color: colors.onSurface, fontSize: 18, fontWeight: "800", textAlign: "center" },
  emptyMessage: { color: colors.muted, fontSize: 14, lineHeight: 20, textAlign: "center", maxWidth: 270 },
}));