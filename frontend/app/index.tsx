import { Redirect, router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { usePlanner } from "@/src/app-context";
import { ActionButton, Icon } from "@/src/components/planner-ui";
import { useTheme, makeStyles } from "@/src/theme";
import { DEFAULT_SETTINGS } from "@/src/scheduler";

export default function Index() {
  const { state, loading } = usePlanner();
  const styles = useStyles();
  const { colors } = useTheme();
  if (loading || !state) return <View style={styles.loading}><ActivityIndicator color={colors.brandPrimary} /><Text style={styles.loadingText}>Loading your plan…</Text></View>;
  if (state.initialized) return <Redirect href="/(tabs)" />;
  return <Onboarding />;
}

function Onboarding() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { saveOnboarding } = usePlanner();
  const [step, setStep] = useState(0);
  const [weekday, setWeekday] = useState(String(DEFAULT_SETTINGS.weekdayMinutes));
  const [saturday, setSaturday] = useState(String(DEFAULT_SETTINGS.saturdayMinutes));
  const [sunday, setSunday] = useState(String(DEFAULT_SETTINGS.sundayMinutes));
  const [reminder, setReminder] = useState(DEFAULT_SETTINGS.reminderTime);
  const [saving, setSaving] = useState(false);
  const styles = useStyles();
  const next = async () => {
    if (step < 2) return setStep(step + 1);
    setSaving(true);
    await saveOnboarding({ weekdayMinutes: Math.max(15, Number(weekday) || 60), saturdayMinutes: Math.max(15, Number(saturday) || 240), sundayMinutes: Math.max(15, Number(sunday) || 240), reminderTime: reminder || "20:30", notificationsEnabled: false });
    setSaving(false);
    router.replace("/(tabs)");
  };
  return <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : "height"}>
    <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 28, paddingBottom: insets.bottom + 24 }]} keyboardShouldPersistTaps="handled">
      <View style={styles.brandRow}><View style={styles.brandMark}><Icon name="lightning-bolt" size={22} color={colors.onBrandPrimary} /></View><Text style={styles.brand}>AAP YA PAAR</Text></View>
      <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${((step + 1) / 3) * 100}%` }]} /></View>
      {step === 0 ? <View style={styles.hero}><Text style={styles.kicker}>YOUR CURRICULUM. YOUR PACE.</Text><Text style={styles.title}>Turn study intent into daily momentum.</Text><Text style={styles.body}>Aap Ya Paar keeps your 9-sprint curriculum in order, then reshapes the calendar around the time you actually have.</Text><View style={styles.heroRule}><Icon name="calendar-sync" size={22} color={colors.brandPrimary} /><Text style={styles.ruleText}>Elastic scheduling · offline by default</Text></View></View> : null}
      {step === 1 ? <View style={styles.form}><Text style={styles.kicker}>CAPACITY SETUP</Text><Text style={styles.stepTitle}>How much time can you protect?</Text><Text style={styles.body}>Use minutes per day. You can change these any time.</Text><CapacityInput label="WEEKDAYS" value={weekday} onChangeText={setWeekday} /><CapacityInput label="SATURDAY" value={saturday} onChangeText={setSaturday} /><CapacityInput label="SUNDAY" value={sunday} onChangeText={setSunday} /></View> : null}
      {step === 2 ? <View style={styles.form}><Text style={styles.kicker}>DAILY RHYTHM</Text><Text style={styles.stepTitle}>Choose your reminder time.</Text><Text style={styles.body}>We’ll keep it local. No account, no sync, no noise.</Text><Text style={styles.inputLabel}>REMINDER TIME</Text><TextInput value={reminder} onChangeText={setReminder} placeholder="20:30" placeholderTextColor={colors.muted} style={styles.timeInput} keyboardType="numbers-and-punctuation" /><View style={styles.preview}><Icon name="bell-outline" size={20} color={colors.brandPrimary} /><View><Text style={styles.previewTitle}>Your first session</Text><Text style={styles.previewText}>Starts with Sprint 1 · 60 minute weekday plan</Text></View></View></View> : null}
      <View style={styles.footer}><Text style={styles.stepCount}>0{step + 1} / 03</Text><ActionButton testID={step === 2 ? "onboarding-build-plan" : "onboarding-continue"} label={saving ? "Building plan…" : step === 2 ? "Build my plan" : "Continue"} icon={step === 2 ? "rocket-launch-outline" : "arrow-right"} onPress={() => void next()} disabled={saving} /></View>
      {step > 0 ? <Pressable testID="onboarding-back" onPress={() => setStep(step - 1)} style={styles.back}><Text style={styles.backText}>Back</Text></Pressable> : null}
    </ScrollView>
  </KeyboardAvoidingView>;
}

function CapacityInput({ label, value, onChangeText }: { label: string; value: string; onChangeText: (value: string) => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return <View style={styles.capacityRow}><Text style={styles.inputLabel}>{label}</Text><View style={styles.inputWrap}><TextInput testID={`onboarding-${label.toLowerCase()}`} value={value} onChangeText={onChangeText} keyboardType="number-pad" style={styles.capacityInput} maxLength={3} /><Text style={styles.unit}>MIN</Text></View></View>;
}

const useStyles = makeStyles((colors) => ({
  loading: { flex: 1, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { color: colors.muted, fontSize: 14 },
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { flexGrow: 1, paddingHorizontal: 24, justifyContent: "space-between" },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  brandMark: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.brandPrimary, alignItems: "center", justifyContent: "center" },
  brand: { color: colors.onSurface, fontSize: 14, fontWeight: "900", letterSpacing: 1.4 },
  progressTrack: { height: 4, backgroundColor: colors.surfaceTertiary, borderRadius: 4, marginTop: 32 },
  progressFill: { height: 4, backgroundColor: colors.brandPrimary, borderRadius: 4 },
  hero: { paddingTop: 48, flex: 1, justifyContent: "center" },
  kicker: { color: colors.brandPrimary, fontSize: 11, letterSpacing: 1.5, fontWeight: "900", marginBottom: 14 },
  title: { color: colors.onSurface, fontSize: 38, lineHeight: 42, fontWeight: "900", letterSpacing: -1 },
  stepTitle: { color: colors.onSurface, fontSize: 28, lineHeight: 34, fontWeight: "900" },
  body: { color: colors.onSurfaceSecondary, fontSize: 16, lineHeight: 24, marginTop: 18 },
  heroRule: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 38, paddingTop: 18, borderTopWidth: 1, borderTopColor: colors.border },
  ruleText: { color: colors.onSurfaceTertiary, fontSize: 13, fontWeight: "700" },
  form: { flex: 1, paddingTop: 44 },
  capacityRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: colors.divider, paddingVertical: 16 },
  inputLabel: { color: colors.muted, fontSize: 11, letterSpacing: 1, fontWeight: "800" },
  inputWrap: { flexDirection: "row", alignItems: "center", gap: 8 },
  capacityInput: { color: colors.onSurface, backgroundColor: colors.surfaceTertiary, borderRadius: 8, width: 70, height: 44, textAlign: "center", fontSize: 18, fontWeight: "800" },
  unit: { color: colors.muted, fontSize: 11, fontWeight: "800" },
  timeInput: { color: colors.onSurface, backgroundColor: colors.surfaceTertiary, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 16, height: 52, fontSize: 20, fontWeight: "800", marginTop: 28 },
  preview: { flexDirection: "row", gap: 12, alignItems: "center", backgroundColor: colors.brandTertiary, borderRadius: 12, padding: 16, marginTop: 22 },
  previewTitle: { color: colors.onBrandTertiary, fontWeight: "800", fontSize: 14 },
  previewText: { color: colors.onSurfaceSecondary, fontSize: 12, marginTop: 3 },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 32 },
  stepCount: { color: colors.muted, fontSize: 12, fontWeight: "800", letterSpacing: 1 },
  back: { alignSelf: "center", padding: 12, minHeight: 44 },
  backText: { color: colors.muted, fontSize: 13, fontWeight: "700" },
}));
