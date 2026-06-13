import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { favoritesApi } from "../../src/api";
import type { Favorite } from "../../src/api/types";
import { useAuth } from "../../src/context/AuthContext";
import { Avatar, Button, Card, Stars } from "../../src/components/ui";
import { colors, gradients } from "../../src/theme/colors";
import { spacing } from "../../src/theme/theme";
import { businessTypeLabel } from "../../src/lib/format";

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>([]);

  useEffect(() => {
    favoritesApi.list().then((r) => setFavorites(r.favorites)).catch(() => {});
  }, []);

  if (!user) return null;
  const isProvider = user.role === "PROVIDER";
  const business = user.business;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient colors={gradients.hero} style={styles.hero}>
        <SafeAreaView edges={["top"]} style={{ alignItems: "center" }}>
          <Avatar name={user.fullName} size={84} color="rgba(255,255,255,0.25)" />
          <Text style={styles.name}>{user.fullName}</Text>
          <Text style={styles.email}>{user.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{isProvider ? "Professionnel" : "Particulier"}</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        {isProvider && business && (
          <Card>
            <Text style={styles.sectionTitle}>Ma vitrine</Text>
            <Text style={styles.bizName}>{business.name}</Text>
            <Text style={styles.bizMeta}>{businessTypeLabel(business.type)}{business.category ? ` · ${business.category.name}` : ""}</Text>
            <View style={{ marginTop: 6 }}>
              <Stars value={business.ratingAvg} count={business.ratingCount} size={15} />
            </View>
          </Card>
        )}

        <Card>
          <Text style={styles.rowLabel}>Téléphone</Text>
          <Text style={styles.rowValue}>{user.phone ?? "Non renseigné"}</Text>
        </Card>

        {!isProvider && (
          <Card>
            <Text style={styles.sectionTitle}>❤️ Mes favoris</Text>
            {favorites.length === 0 ? (
              <Text style={styles.rowLabel}>Aucun favori pour l'instant.</Text>
            ) : (
              favorites.map((f) => (
                <Text key={f.id} style={styles.favItem}>
                  {f.business?.category?.icon ?? "✨"}  {f.business?.name}
                </Text>
              ))
            )}
          </Card>
        )}

        <View style={{ marginTop: spacing.sm }}>
          <Button title="Se déconnecter" variant="danger" onPress={logout} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { paddingBottom: spacing.xl, paddingHorizontal: spacing.lg, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  name: { fontSize: 22, fontWeight: "800", color: "#fff", marginTop: spacing.md },
  email: { fontSize: 14, color: "rgba(255,255,255,0.8)", marginTop: 2 },
  roleBadge: { marginTop: spacing.md, backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 16, paddingVertical: 6, borderRadius: 999 },
  roleText: { color: "#fff", fontWeight: "700" },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: colors.text, marginBottom: 8 },
  bizName: { fontSize: 18, fontWeight: "800", color: colors.text },
  bizMeta: { fontSize: 14, color: colors.textMuted, marginTop: 2 },
  rowLabel: { fontSize: 13, color: colors.textMuted },
  rowValue: { fontSize: 16, color: colors.text, fontWeight: "600", marginTop: 2 },
  favItem: { fontSize: 15, color: colors.text, paddingVertical: 6, fontWeight: "500" },
});
