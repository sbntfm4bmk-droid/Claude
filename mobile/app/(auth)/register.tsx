import { useEffect, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../src/context/AuthContext";
import { Button, Field } from "../../src/components/ui";
import { categoriesApi } from "../../src/api";
import type { Category } from "../../src/api/types";
import { colors } from "../../src/theme/colors";

export default function RegisterScreen() {
  const { register } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"CLIENT" | "PROVIDER">("CLIENT");
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [hourlyRate, setHourlyRate] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    categoriesApi.list().then((r) => setCategories(r.categories)).catch(() => {});
  }, []);

  async function onSubmit() {
    if (!fullName || !email || !password) {
      Alert.alert("Champs requis", "Nom, email et mot de passe sont obligatoires.");
      return;
    }
    setLoading(true);
    try {
      await register({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        password,
        role,
        categoryId: role === "PROVIDER" ? categoryId : undefined,
        hourlyRate: role === "PROVIDER" && hourlyRate ? Number(hourlyRate) : undefined,
      });
    } catch (e) {
      Alert.alert("Inscription échouée", e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Créer un compte</Text>

          {/* Role switch: client vs provider */}
          <View style={styles.roleRow}>
            {(["CLIENT", "PROVIDER"] as const).map((r) => (
              <Pressable
                key={r}
                onPress={() => setRole(r)}
                style={[styles.roleBtn, role === r && styles.roleBtnActive]}
              >
                <Text style={[styles.roleText, role === r && styles.roleTextActive]}>
                  {r === "CLIENT" ? "Je cherche un pro" : "Je suis un pro"}
                </Text>
              </Pressable>
            ))}
          </View>

          <Field label="Nom complet" value={fullName} onChangeText={setFullName} placeholder="Jean Dupont" />
          <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="vous@email.com" />
          <Field label="Téléphone (optionnel)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+33 6 12 34 56 78" />
          <Field label="Mot de passe" value={password} onChangeText={setPassword} secureTextEntry placeholder="6 caractères minimum" />

          {role === "PROVIDER" && (
            <>
              <Text style={styles.label}>Métier</Text>
              <View style={styles.chips}>
                {categories.map((c) => (
                  <Pressable
                    key={c.id}
                    onPress={() => setCategoryId(c.id)}
                    style={[styles.chip, categoryId === c.id && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, categoryId === c.id && styles.chipTextActive]}>{c.name}</Text>
                  </Pressable>
                ))}
              </View>
              <Field label="Tarif horaire (€)" value={hourlyRate} onChangeText={setHourlyRate} keyboardType="numeric" placeholder="40" />
            </>
          )}

          <Button title="S'inscrire" onPress={onSubmit} loading={loading} />

          <View style={styles.footer}>
            <Text style={{ color: colors.textMuted }}>Déjà inscrit ? </Text>
            <Link href="/(auth)/login" style={{ color: colors.primary, fontWeight: "600" }}>
              Se connecter
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24 },
  title: { fontSize: 28, fontWeight: "800", color: colors.text, marginBottom: 20 },
  label: { fontSize: 13, color: colors.textMuted, marginBottom: 6, fontWeight: "500" },
  roleRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  roleBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.border, alignItems: "center", backgroundColor: colors.surface },
  roleBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  roleText: { color: colors.text, fontWeight: "600" },
  roleTextActive: { color: "#fff" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.text, fontSize: 13 },
  chipTextActive: { color: "#fff", fontWeight: "600" },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 24 },
});
