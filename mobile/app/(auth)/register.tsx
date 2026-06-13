import { useEffect, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../src/context/AuthContext";
import { Button, Chip, Field } from "../../src/components/ui";
import { categoriesApi } from "../../src/api";
import type { BusinessType, Category } from "../../src/api/types";
import { colors } from "../../src/theme/colors";
import { radius, spacing } from "../../src/theme/theme";

const TYPES: { label: string; value: BusinessType; hint: string }[] = [
  { label: "Sur RDV", value: "SERVICE", hint: "Coiffure, massage, plomberie..." },
  { label: "Boutique", value: "PRODUCT", hint: "Vente de produits" },
  { label: "Les deux", value: "BOTH", hint: "RDV et produits" },
];

export default function RegisterScreen() {
  const { register } = useAuth();
  const [role, setRole] = useState<"CLIENT" | "PROVIDER">("CLIENT");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  // Provider-only
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState<BusinessType>("SERVICE");
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [city, setCity] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
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
        businessName: role === "PROVIDER" ? businessName.trim() || fullName.trim() : undefined,
        businessType: role === "PROVIDER" ? businessType : undefined,
        categoryId: role === "PROVIDER" ? categoryId : undefined,
        city: role === "PROVIDER" ? city.trim() || undefined : undefined,
      });
    } catch (e) {
      Alert.alert("Inscription échouée", e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  const filteredCats = categories.filter(
    (c) => businessType === "BOTH" || c.kind === "BOTH" || c.kind === businessType
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Créer un compte</Text>

          {/* Role switch */}
          <View style={styles.roleRow}>
            {(["CLIENT", "PROVIDER"] as const).map((r) => (
              <Pressable key={r} onPress={() => setRole(r)} style={[styles.roleBtn, role === r && styles.roleBtnActive]}>
                <Text style={[styles.roleEmoji]}>{r === "CLIENT" ? "🔍" : "💼"}</Text>
                <Text style={[styles.roleText, role === r && { color: "#fff" }]}>{r === "CLIENT" ? "Je cherche" : "Je propose"}</Text>
              </Pressable>
            ))}
          </View>

          <Field label="Nom complet" value={fullName} onChangeText={setFullName} placeholder="Jean Dupont" />
          <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="vous@email.com" />
          <Field label="Téléphone (optionnel)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+33 6 12 34 56 78" />
          <Field label="Mot de passe" value={password} onChangeText={setPassword} secureTextEntry placeholder="6 caractères minimum" />

          {role === "PROVIDER" && (
            <View>
              <Field label="Nom de votre activité" value={businessName} onChangeText={setBusinessName} placeholder="Studio Léa Coiffure" />

              <Text style={styles.label}>Type d'activité</Text>
              <View style={styles.typeGrid}>
                {TYPES.map((t) => (
                  <Pressable key={t.value} onPress={() => setBusinessType(t.value)} style={[styles.typeCard, businessType === t.value && styles.typeCardActive]}>
                    <Text style={[styles.typeLabel, businessType === t.value && { color: "#fff" }]}>{t.label}</Text>
                    <Text style={[styles.typeHint, businessType === t.value && { color: "rgba(255,255,255,0.85)" }]}>{t.hint}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.label}>Catégorie</Text>
              <View style={styles.chips}>
                {filteredCats.map((c) => (
                  <Chip key={c.id} label={`${c.icon} ${c.name}`} active={categoryId === c.id} color={c.color} onPress={() => setCategoryId(c.id)} />
                ))}
              </View>

              <Field label="Ville" value={city} onChangeText={setCity} placeholder="Paris" />
            </View>
          )}

          <Button title="S'inscrire" onPress={onSubmit} loading={loading} />

          <View style={styles.footer}>
            <Text style={{ color: colors.textMuted }}>Déjà inscrit ? </Text>
            <Link href="/(auth)/login" style={{ color: colors.primary, fontWeight: "700" }}>Se connecter</Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.xl },
  title: { fontSize: 28, fontWeight: "800", color: colors.text, marginBottom: spacing.lg, letterSpacing: -0.5 },
  label: { fontSize: 13, color: colors.textMuted, marginBottom: 8, fontWeight: "600" },
  roleRow: { flexDirection: "row", gap: 12, marginBottom: spacing.lg },
  roleBtn: { flex: 1, paddingVertical: spacing.lg, borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.border, alignItems: "center", backgroundColor: colors.surface },
  roleBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  roleEmoji: { fontSize: 24, marginBottom: 4 },
  roleText: { color: colors.text, fontWeight: "700" },
  typeGrid: { flexDirection: "row", gap: 8, marginBottom: spacing.lg },
  typeCard: { flex: 1, padding: spacing.md, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface },
  typeCardActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  typeLabel: { fontSize: 14, fontWeight: "700", color: colors.text },
  typeHint: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: spacing.lg },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: spacing.xl },
});
