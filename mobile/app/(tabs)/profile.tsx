import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../../src/context/AuthContext";
import { Button, Card, Stars } from "../../src/components/ui";
import { colors } from "../../src/theme/colors";

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  if (!user) return null;

  const isProvider = user.role === "PROVIDER";
  const profile = user.providerProfile;

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={{ padding: 16 }}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user.fullName.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{user.fullName}</Text>
        <Text style={styles.email}>{user.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{isProvider ? "Prestataire" : "Particulier"}</Text>
        </View>
      </View>

      <Card>
        <Text style={styles.rowLabel}>Téléphone</Text>
        <Text style={styles.rowValue}>{user.phone ?? "Non renseigné"}</Text>
      </Card>

      {isProvider && profile && (
        <Card>
          <Text style={styles.sectionTitle}>Mon activité</Text>
          <Text style={styles.rowLabel}>Métier</Text>
          <Text style={styles.rowValue}>{profile.category?.name ?? "Non défini"}</Text>
          <Text style={[styles.rowLabel, { marginTop: 10 }]}>Tarif horaire</Text>
          <Text style={styles.rowValue}>{profile.hourlyRate}€/h</Text>
          <Text style={[styles.rowLabel, { marginTop: 10 }]}>Note</Text>
          <Stars value={profile.ratingAvg} count={profile.ratingCount} />
        </Card>
      )}

      <Button title="Se déconnecter" variant="danger" onPress={logout} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: "center", marginVertical: 24 },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarText: { color: "#fff", fontSize: 36, fontWeight: "700" },
  name: { fontSize: 22, fontWeight: "800", color: colors.text },
  email: { fontSize: 14, color: colors.textMuted, marginTop: 2 },
  roleBadge: {
    marginTop: 10,
    backgroundColor: colors.accent + "22",
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 16,
  },
  roleText: { color: colors.accent, fontWeight: "600" },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 10 },
  rowLabel: { fontSize: 13, color: colors.textMuted },
  rowValue: { fontSize: 16, color: colors.text, fontWeight: "500" },
});
