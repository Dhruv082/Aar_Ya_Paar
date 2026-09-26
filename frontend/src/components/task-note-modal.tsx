import { useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";

import { ActionButton, Icon } from "@/src/components/planner-ui";
import { PlannerState, Task, getTask } from "@/src/scheduler";
import { makeStyles, useTheme } from "@/src/theme";

const NOTE_LIMIT = 1000;

type Props = {
  visible: boolean;
  taskId: string | null;
  state: PlannerState;
  onClose: () => void;
  onSave: (taskId: string, note: string) => Promise<void>;
};

export function TaskNoteModal({ visible, taskId, state, onClose, onSave }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  const task = taskId ? getTask(state, taskId) : undefined;
  const [note, setNote] = useState(() => taskId ? state.notesByTaskId[taskId] ?? "" : "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!task || saving) return;
    setSaving(true);
    await onSave(task.id, note);
    setSaving(false);
    onClose();
  };

  return <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.header}>
        <View style={styles.headerCopy}><Text style={styles.overline}>TASK MEMORY</Text><Text style={styles.title}>Task note</Text></View>
        <Pressable testID="task-note-close" accessibilityRole="button" accessibilityLabel="Close task note" onPress={onClose} style={styles.close}><Icon name="close" size={20} color={colors.onSurface} /></Pressable>
      </View>
      {task ? <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TaskSummary task={task} complete={state.completionRecords.some((record) => record.taskId === task.id)} />
        <View style={styles.editorCard}>
          <View style={styles.editorHeader}><Text style={styles.label}>YOUR NOTE</Text><Text style={styles.count}>{note.length}/{NOTE_LIMIT}</Text></View>
          <TextInput testID="task-note-input" accessibilityLabel="Personal note" value={note} onChangeText={(value) => setNote(value.slice(0, NOTE_LIMIT))} multiline textAlignVertical="top" placeholder="Capture a key idea, mistake, or reminder for later." placeholderTextColor={colors.muted} style={styles.input} maxLength={NOTE_LIMIT} />
          <Text style={styles.help}>A blank saved note removes it. Notes are private to this plan and available offline.</Text>
        </View>
        <ActionButton testID="task-note-save" label={saving ? "Saving…" : "Save note"} icon="content-save-outline" disabled={saving} onPress={() => void save()} />
      </ScrollView> : null}
    </KeyboardAvoidingView>
  </Modal>;
}

function TaskSummary({ task, complete }: { task: Task; complete: boolean }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return <View style={styles.summary}><View style={styles.summaryIcon}><Icon name={complete ? "check" : "notebook-outline"} size={19} color={complete ? colors.onSuccess : colors.onBrandTertiary} /></View><View style={styles.summaryBody}><Text style={styles.taskTitle}>{task.title}</Text><Text style={styles.meta}>SPRINT {task.sprint} · ORIGINAL DAY {task.originalDay} · {task.estimatedMinutes} MIN</Text>{complete ? <Text style={styles.complete}>COMPLETED</Text> : null}</View></View>;
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.surface },
  header: { paddingHorizontal: 20, paddingTop: 22, paddingBottom: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomWidth: 1, borderBottomColor: colors.divider },
  headerCopy: { gap: 4 }, overline: { color: colors.brandPrimary, fontSize: 10, fontWeight: "900", letterSpacing: 1.2 }, title: { color: colors.onSurface, fontSize: 28, fontWeight: "900" },
  close: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceTertiary, alignItems: "center", justifyContent: "center" },
  content: { padding: 20, gap: 18, flexGrow: 1 },
  summary: { flexDirection: "row", gap: 12, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceSecondary },
  summaryIcon: { width: 38, height: 38, borderRadius: 9, backgroundColor: colors.brandTertiary, justifyContent: "center", alignItems: "center" }, summaryBody: { flex: 1, gap: 5 },
  taskTitle: { color: colors.onSurface, fontSize: 16, fontWeight: "800" }, meta: { color: colors.muted, fontSize: 10, fontWeight: "800", letterSpacing: 0.4 }, complete: { color: colors.success, fontSize: 10, fontWeight: "900", letterSpacing: 0.8 },
  editorCard: { gap: 10 }, editorHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, label: { color: colors.onSurfaceSecondary, fontSize: 11, fontWeight: "900", letterSpacing: 0.8 }, count: { color: colors.muted, fontSize: 11, fontWeight: "700" },
  input: { minHeight: 170, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.surfaceSecondary, color: colors.onSurface, fontSize: 16, lineHeight: 23 }, help: { color: colors.muted, fontSize: 12, lineHeight: 18 },
}));
