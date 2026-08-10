import { Tabs } from "expo-router";
import { View, StyleSheet } from "react-native";
import { colors, fontSize } from "../../../src/lib/tokens";

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    index: "🌱",
    market: "🛒",
    messages: "💬",
    profile: "👤",
  };
  return (
    <View style={[styles.icon, focused && styles.iconActive]}>
      <View>
        {/* icône textuelle en attendant une lib SVG */}
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Foncier", tabBarIcon: ({ focused }) => null }}
      />
      <Tabs.Screen
        name="market"
        options={{ title: "Marché", tabBarIcon: ({ focused }) => null }}
      />
      <Tabs.Screen
        name="messages"
        options={{ title: "Messages", tabBarIcon: ({ focused }) => null }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: "Profil", tabBarIcon: ({ focused }) => null }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    height: 64,
    paddingBottom: 8,
    paddingTop: 6,
  },
  tabLabel: {
    fontSize: fontSize.xs,
    fontWeight: "600",
  },
  icon: {
    padding: 4,
    borderRadius: 8,
  },
  iconActive: {
    backgroundColor: colors.successLight,
  },
});
