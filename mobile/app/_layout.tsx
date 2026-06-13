import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import { CartProvider } from "../src/context/CartContext";
import { colors } from "../src/theme/colors";

// Redirects between the auth flow and the main app based on session state.
function AuthGate() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === "(auth)";
    if (!user && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (user && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [user, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="business/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="booking/[serviceId]" options={{ headerShown: true, title: "Choisir un créneau", presentation: "modal" }} />
      <Stack.Screen name="cart" options={{ headerShown: true, title: "Mon panier", presentation: "modal" }} />
      <Stack.Screen name="review/[appointmentId]" options={{ headerShown: true, title: "Laisser un avis", presentation: "modal" }} />
      <Stack.Screen name="manage/catalog" options={{ headerShown: true, title: "Gérer ma vitrine" }} />
      <Stack.Screen name="manage/service" options={{ headerShown: true, title: "Prestation", presentation: "modal" }} />
      <Stack.Screen name="manage/product" options={{ headerShown: true, title: "Produit", presentation: "modal" }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CartProvider>
          <StatusBar style="dark" />
          <AuthGate />
        </CartProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
