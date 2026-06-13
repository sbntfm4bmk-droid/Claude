import { Tabs } from "expo-router";
import { Text, View } from "react-native";
import { colors } from "../../src/theme/colors";
import { useCart } from "../../src/context/CartContext";

function Icon({ glyph, color, focused }: { glyph: string; color: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: focused ? 24 : 22, opacity: focused ? 1 : 0.7, color }}>{glyph}</Text>
  );
}

export default function TabsLayout() {
  const { count } = useCart();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarStyle: { height: 62, paddingBottom: 8, paddingTop: 6, borderTopColor: colors.border },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { color: colors.text, fontWeight: "800" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Découvrir", headerShown: false, tabBarIcon: ({ color, focused }) => <Icon glyph="🧭" color={color} focused={focused} /> }}
      />
      <Tabs.Screen
        name="appointments"
        options={{ title: "Mes RDV", tabBarIcon: ({ color, focused }) => <Icon glyph="📅" color={color} focused={focused} /> }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Achats",
          tabBarIcon: ({ color, focused }) => (
            <View>
              <Icon glyph="🛍️" color={color} focused={focused} />
              {count > 0 && (
                <View
                  style={{
                    position: "absolute",
                    top: -4,
                    right: -10,
                    backgroundColor: colors.accent,
                    borderRadius: 9,
                    minWidth: 18,
                    height: 18,
                    alignItems: "center",
                    justifyContent: "center",
                    paddingHorizontal: 4,
                  }}
                >
                  <Text style={{ color: "#fff", fontSize: 10, fontWeight: "800" }}>{count}</Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: "Profil", tabBarIcon: ({ color, focused }) => <Icon glyph="👤" color={color} focused={focused} /> }}
      />
    </Tabs>
  );
}
