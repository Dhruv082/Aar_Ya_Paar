import { Tabs } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ColorValue, Platform } from "react-native";

import { usesNativeTabs } from "@/src/navigation";
import { useTheme } from "@/src/theme";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

export default function TabsLayout() {
  const { colors } = useTheme();
  if (usesNativeTabs) {
    return <NativeTabs>
      <NativeTabs.Trigger name="index"><NativeTabs.Trigger.Icon sf="house.fill" /><NativeTabs.Trigger.Label>Today</NativeTabs.Trigger.Label></NativeTabs.Trigger>
      <NativeTabs.Trigger name="schedule"><NativeTabs.Trigger.Icon sf="calendar" /><NativeTabs.Trigger.Label>Schedule</NativeTabs.Trigger.Label></NativeTabs.Trigger>
      <NativeTabs.Trigger name="progress"><NativeTabs.Trigger.Icon sf="chart.bar.fill" /><NativeTabs.Trigger.Label>Progress</NativeTabs.Trigger.Label></NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings"><NativeTabs.Trigger.Icon sf="gearshape.fill" /><NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label></NativeTabs.Trigger>
    </NativeTabs>;
  }
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.brandPrimary, tabBarInactiveTintColor: colors.muted, tabBarStyle: { backgroundColor: colors.surfaceSecondary, borderTopColor: colors.border, ...(Platform.OS === "web" ? { height: 64 } : {}) }, tabBarItemStyle: { alignSelf: "center" } }}>
    <Tabs.Screen name="index" options={{ title: "Today", tabBarIcon: ({ color }) => <TabsIcon name="home" color={color} /> }} />
    <Tabs.Screen name="schedule" options={{ title: "Schedule", tabBarIcon: ({ color }) => <TabsIcon name="calendar" color={color} /> }} />
    <Tabs.Screen name="progress" options={{ title: "Progress", tabBarIcon: ({ color }) => <TabsIcon name="chart-bar" color={color} /> }} />
    <Tabs.Screen name="settings" options={{ title: "Settings", tabBarIcon: ({ color }) => <TabsIcon name="cog" color={color} /> }} />
  </Tabs>;
}

function TabsIcon({ name, color }: { name: IconName; color: ColorValue }) {
  return <MaterialCommunityIcons name={name} size={22} color={color} />;
}