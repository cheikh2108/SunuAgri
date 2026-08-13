import { Tabs } from "expo-router";
import { View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../src/contexts/ThemeContext";
import { fontSize } from "../../../src/lib/tokens";

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const { colors } = useTheme();
  const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
    index: "leaf",
    market: "cart",
    messages: "chatbubbles",
    profile: "person",
  };

  return (
    <View style={[
      { padding: 4, borderRadius: 8 },
      focused && { backgroundColor: colors.successLight }
    ]}>
      <Ionicons
        name={icons[name]}
        size={24}
        color={focused ? colors.primary : colors.textMuted}
      />
    </View>
  );
}

export default function TabLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: fontSize.xs,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Foncier",
          tabBarIcon: ({ focused }) => <TabIcon name="index" focused={focused} />
        }}
      />
      <Tabs.Screen
        name="market"
        options={{
          title: "Marché",
          tabBarIcon: ({ focused }) => <TabIcon name="market" focused={focused} />
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarIcon: ({ focused }) => <TabIcon name="messages" focused={focused} />
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ focused }) => <TabIcon name="profile" focused={focused} />
        }}
      />
    </Tabs>
  );
}
