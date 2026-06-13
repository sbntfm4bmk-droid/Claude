import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { Link } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../src/context/AuthContext";
import { Button, Field } from "../../src/components/ui";
import { APP_NAME, APP_TAGLINE } from "../../src/constants/config";
import { colors, gradients } from "../../src/theme/colors";
import { spacing } from "../../src/theme/theme";

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("client@demo.com");
  const [password, setPassword] = useState("password123");
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (e) {
      Alert.alert("Connexion échouée", e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient colors={gradients.hero} style={styles.hero}>
        <SafeAreaView edges={["top"]}>
          <Text style={styles.logo}>{APP_NAME}</Text>
          <Text style={styles.tagline}>{APP_TAGLINE}</Text>
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Bon retour 👋</Text>
          <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="vous@email.com" />
          <Field label="Mot de passe" value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••••" />
          <Button title="Se connecter" onPress={onSubmit} loading={loading} />

          <View style={styles.footer}>
            <Text style={{ color: colors.textMuted }}>Pas encore de compte ? </Text>
            <Link href="/(auth)/register" style={{ color: colors.primary, fontWeight: "700" }}>Créer un compte</Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  logo: { fontSize: 38, fontWeight: "800", color: "#fff", marginTop: spacing.lg, letterSpacing: -1 },
  tagline: { fontSize: 16, color: "rgba(255,255,255,0.85)", marginTop: 6 },
  content: { padding: spacing.xl, flexGrow: 1 },
  title: { fontSize: 24, fontWeight: "800", color: colors.text, marginBottom: spacing.xl },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: spacing.xl },
});
