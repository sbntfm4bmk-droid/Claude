import { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { businessesApi, categoriesApi } from "../../src/api";
import type { Business, BusinessType, Category } from "../../src/api/types";
import { useAuth } from "../../src/context/AuthContext";
import { BusinessCard } from "../../src/components/BusinessCard";
import { Skeleton } from "../../src/components/ui";
import { colors, gradients } from "../../src/theme/colors";
import { radius, spacing } from "../../src/theme/theme";
import {
  APP_NAME,
  DEFAULT_RADIUS_KM,
  FALLBACK_COORDS,
  RADIUS_STEPS,
} from "../../src/constants/config";

const TYPE_FILTERS: { label: string; value?: BusinessType }[] = [
  { label: "Tout", value: undefined },
  { label: "Sur RDV", value: "SERVICE" },
  { label: "Boutiques", value: "PRODUCT" },
];

export default function DiscoverScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCat, setSelectedCat] = useState<string | undefined>();
  const [typeFilter, setTypeFilter] = useState<BusinessType | undefined>();
  const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS_KM);
  const [query, setQuery] = useState("");
  const [coords, setCoords] = useState(FALLBACK_COORDS);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const pos = await Location.getCurrentPositionAsync({});
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        }
      } catch {
        // Keep fallback coords.
      }
    })();
    categoriesApi.list().then((r) => setCategories(r.categories)).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    try {
      const r = await businessesApi.list({
        categoryId: selectedCat,
        type: typeFilter,
        lat: coords.lat,
        lng: coords.lng,
        radiusKm,
        q: query.trim() || undefined,
      });
      setBusinesses(r.businesses);
    } catch {
      setBusinesses([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCat, typeFilter, coords, radiusKm, query]);

  useEffect(() => {
    load();
  }, [load]);

  const firstName = user?.fullName?.split(" ")[0] ?? "";

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Hero header */}
      <LinearGradient colors={gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        <SafeAreaView edges={["top"]}>
          <Text style={styles.heroHi}>Bonjour {firstName} 👋</Text>
          <Text style={styles.heroTitle}>Que cherchez-vous{"\n"}aujourd'hui ?</Text>

          <View style={styles.searchBar}>
            <Text style={{ fontSize: 17 }}>🔍</Text>
            <TextInput
              placeholder={`Coiffeur, fleuriste, plombier...`}
              placeholderTextColor={colors.textFaint}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={load}
              returnKeyType="search"
              style={styles.searchInput}
            />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <FlatList
        data={loading ? [] : businesses}
        keyExtractor={(b) => b.id}
        contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.md }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
          />
        }
        ListHeaderComponent={
          <View>
            {/* Radius selector */}
            <View style={styles.radiusRow}>
              <Text style={styles.radiusLabel}>📍 Autour de moi · {radiusKm} km</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: spacing.md }}>
              {RADIUS_STEPS.map((r) => (
                <Pressable
                  key={r}
                  onPress={() => setRadiusKm(r)}
                  style={[styles.radiusChip, radiusKm === r && styles.radiusChipActive]}
                >
                  <Text style={[styles.radiusChipText, radiusKm === r && { color: "#fff" }]}>{r} km</Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Type filter */}
            <View style={styles.typeRow}>
              {TYPE_FILTERS.map((t) => (
                <Pressable
                  key={t.label}
                  onPress={() => setTypeFilter(t.value)}
                  style={[styles.typeBtn, typeFilter === t.value && styles.typeBtnActive]}
                >
                  <Text style={[styles.typeText, typeFilter === t.value && { color: "#fff" }]}>{t.label}</Text>
                </Pressable>
              ))}
            </View>

            {/* Categories */}
            <Text style={styles.catTitle}>Catégories</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingVertical: spacing.sm }}>
              {categories.map((c) => {
                const active = selectedCat === c.id;
                return (
                  <Pressable key={c.id} onPress={() => setSelectedCat(active ? undefined : c.id)} style={styles.catItem}>
                    <View style={[styles.catIcon, { backgroundColor: c.color + "1A", borderColor: active ? c.color : "transparent" }]}>
                      <Text style={{ fontSize: 26 }}>{c.icon}</Text>
                    </View>
                    <Text style={[styles.catName, active && { color: c.color, fontWeight: "700" }]} numberOfLines={1}>
                      {c.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text style={styles.resultsTitle}>
              {businesses.length} résultat{businesses.length > 1 ? "s" : ""} près de vous
            </Text>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={{ gap: spacing.lg }}>
              {[0, 1, 2].map((i) => (
                <View key={i} style={{ gap: 8 }}>
                  <Skeleton height={92} style={{ borderRadius: radius.lg }} />
                  <Skeleton height={14} width="60%" />
                  <Skeleton height={12} width="40%" />
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.empty}>
              <Text style={{ fontSize: 40 }}>🗺️</Text>
              <Text style={styles.emptyTitle}>Personne dans ce rayon</Text>
              <Text style={styles.emptyText}>Élargissez le rayon ou changez de filtre.</Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <BusinessCard business={item} onPress={() => router.push(`/business/${item.id}`)} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  heroHi: { color: "rgba(255,255,255,0.85)", fontSize: 15, fontWeight: "600", marginTop: spacing.sm },
  heroTitle: { color: "#fff", fontSize: 26, fontWeight: "800", marginTop: 4, letterSpacing: -0.5 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#fff",
    marginTop: spacing.lg,
    paddingHorizontal: 16,
    height: 52,
    borderRadius: radius.lg,
  },
  searchInput: { flex: 1, fontSize: 16, color: colors.text },
  radiusRow: { marginTop: spacing.lg, marginBottom: spacing.sm },
  radiusLabel: { fontSize: 15, fontWeight: "700", color: colors.text },
  radiusChip: { paddingHorizontal: 14, height: 34, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, justifyContent: "center" },
  radiusChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  radiusChipText: { fontSize: 13, fontWeight: "700", color: colors.textMuted },
  typeRow: { flexDirection: "row", gap: 8, marginBottom: spacing.sm },
  typeBtn: { flex: 1, height: 40, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  typeBtnActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  typeText: { fontWeight: "700", color: colors.textMuted, fontSize: 14 },
  catTitle: { fontSize: 19, fontWeight: "800", color: colors.text, marginTop: spacing.md, letterSpacing: -0.3 },
  catItem: { alignItems: "center", width: 76 },
  catIcon: { width: 64, height: 64, borderRadius: radius.lg, alignItems: "center", justifyContent: "center", borderWidth: 2, marginBottom: 6 },
  catName: { fontSize: 12, color: colors.textMuted, textAlign: "center" },
  resultsTitle: { fontSize: 19, fontWeight: "800", color: colors.text, marginTop: spacing.lg, marginBottom: spacing.md, letterSpacing: -0.3 },
  empty: { alignItems: "center", paddingVertical: 60, gap: 8 },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: colors.text },
  emptyText: { fontSize: 14, color: colors.textMuted, textAlign: "center" },
});
