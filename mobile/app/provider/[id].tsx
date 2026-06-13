import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { providersApi } from "../../src/api";
import type { ProviderProfile } from "../../src/api/types";
import { Button, Card, Stars } from "../../src/components/ui";
import { useAuth } from "../../src/context/AuthContext";
import { colors } from "../../src/theme/colors";

export default function ProviderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [provider, setProvider] = useState<ProviderProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    providersApi
      .get(id)
      .then((r) => setProvider(r.provider))
      .catch(() => setProvider(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />;
  if (!provider) return <Text style={styles.empty}>Prestataire introuvable.</Text>;

  const isOwnProfile = user?.providerProfile?.id === provider.id;

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={{ padding: 16 }}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{provider.user?.fullName?.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{provider.user?.fullName}</Text>
        <Text style={styles.cat}>{provider.category?.name ?? "Service"}</Text>
        <Stars value={provider.ratingAvg} count={provider.ratingCount} />
        <Text style={styles.price}>{provider.hourlyRate}€/h</Text>
      </View>

      {provider.bio ? (
        <Card>
          <Text style={styles.sectionTitle}>À propos</Text>
          <Text style={styles.bio}>{provider.bio}</Text>
        </Card>
      ) : null}

      <Text style={styles.sectionTitle}>Avis ({provider.ratingCount})</Text>
      {provider.reviews && provider.reviews.length > 0 ? (
        provider.reviews.map((rev) => (
          <Card key={rev.id}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={styles.reviewer}>{rev.author?.fullName ?? "Client"}</Text>
              <Stars value={rev.rating} />
            </View>
            {rev.comment ? <Text style={styles.bio}>{rev.comment}</Text> : null}
          </Card>
        ))
      ) : (
        <Text style={styles.muted}>Aucun avis pour le moment.</Text>
      )}

      {!isOwnProfile && (
        <Button
          title="Demander ce service"
          onPress={() => router.push({ pathname: "/booking/new", params: { providerId: provider.id } })}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: "center", marginBottom: 16 },
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
  name: { fontSize: 24, fontWeight: "800", color: colors.text },
  cat: { fontSize: 15, color: colors.accent, marginVertical: 4, fontWeight: "600" },
  price: { fontSize: 18, fontWeight: "700", color: colors.primary, marginTop: 8 },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: colors.text, marginBottom: 10, marginTop: 8 },
  bio: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  reviewer: { fontSize: 14, fontWeight: "600", color: colors.text },
  muted: { color: colors.textMuted, marginBottom: 16 },
  empty: { textAlign: "center", color: colors.textMuted, marginTop: 40 },
});
