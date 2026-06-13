import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import { categoriesApi, providersApi } from "../../src/api";
import type { Category, ProviderProfile } from "../../src/api/types";
import { Card, Stars } from "../../src/components/ui";
import { colors } from "../../src/theme/colors";

export default function SearchScreen() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCat, setSelectedCat] = useState<string | undefined>();
  const [query, setQuery] = useState("");
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Ask for location once so we can sort providers by distance.
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const pos = await Location.getCurrentPositionAsync({});
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        }
      } catch {
        // Location is optional; ignore failures.
      }
    })();
    categoriesApi.list().then((r) => setCategories(r.categories)).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    try {
      const r = await providersApi.list({
        categoryId: selectedCat,
        lat: coords?.lat,
        lng: coords?.lng,
        q: query.trim() || undefined,
      });
      setProviders(r.providers);
    } catch {
      setProviders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCat, coords, query]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Text style={{ fontSize: 18 }}>🔍</Text>
        <TextInput
          placeholder="Rechercher un prestataire..."
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={load}
          style={styles.searchInput}
        />
      </View>

      {/* Category filter chips */}
      <View style={{ height: 48 }}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ id: "all", name: "Tous", slug: "all", icon: "" } as Category, ...categories]}
          keyExtractor={(c) => c.id}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          renderItem={({ item }) => {
            const active = item.id === "all" ? !selectedCat : selectedCat === item.id;
            return (
              <Pressable
                onPress={() => setSelectedCat(item.id === "all" ? undefined : item.id)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{item.name}</Text>
              </Pressable>
            );
          }}
        />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
      ) : (
        <FlatList
          data={providers}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
            />
          }
          ListEmptyComponent={
            <Text style={styles.empty}>Aucun prestataire trouvé pour ce filtre.</Text>
          }
          renderItem={({ item }) => (
            <Pressable onPress={() => router.push(`/provider/${item.id}`)}>
              <Card>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{item.user?.fullName}</Text>
                    <Text style={styles.cat}>{item.category?.name ?? "Service"}</Text>
                    <Stars value={item.ratingAvg} count={item.ratingCount} />
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.price}>{item.hourlyRate}€/h</Text>
                    {item.distanceKm != null && (
                      <Text style={styles.distance}>{item.distanceKm.toFixed(1)} km</Text>
                    )}
                  </View>
                </View>
                {item.bio ? <Text style={styles.bio} numberOfLines={2}>{item.bio}</Text> : null}
              </Card>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingTop: 12 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 14,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: { flex: 1, fontSize: 16, color: colors.text },
  chip: { paddingHorizontal: 16, height: 36, borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, justifyContent: "center" },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontSize: 14 },
  chipTextActive: { color: "#fff", fontWeight: "600" },
  name: { fontSize: 17, fontWeight: "700", color: colors.text },
  cat: { fontSize: 13, color: colors.accent, marginBottom: 4, fontWeight: "500" },
  price: { fontSize: 16, fontWeight: "700", color: colors.primary },
  distance: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  bio: { fontSize: 13, color: colors.textMuted, marginTop: 8 },
  empty: { textAlign: "center", color: colors.textMuted, marginTop: 40 },
});
