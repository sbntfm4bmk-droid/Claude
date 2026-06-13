import { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { businessesApi, productsApi, servicesApi } from "../../src/api";
import type { Business, Product, Service } from "../../src/api/types";
import { Button, Card, SectionHeader, Skeleton } from "../../src/components/ui";
import { colors } from "../../src/theme/colors";
import { radius, spacing } from "../../src/theme/theme";
import { formatDuration, formatPrice } from "../../src/lib/format";

export default function CatalogScreen() {
  const router = useRouter();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const r = await businessesApi.catalog();
      setBusiness(r.business);
    } catch {
      setBusiness(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function removeService(s: Service) {
    Alert.alert("Supprimer", `Supprimer « ${s.name} » ?`, [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          try {
            await servicesApi.remove(s.id);
            load();
          } catch (e) {
            Alert.alert("Erreur", e instanceof Error ? e.message : "Impossible");
          }
        },
      },
    ]);
  }

  async function removeProduct(p: Product) {
    Alert.alert("Supprimer", `Supprimer « ${p.name} » ?`, [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          try {
            await productsApi.remove(p.id);
            load();
          } catch (e) {
            Alert.alert("Erreur", e instanceof Error ? e.message : "Impossible");
          }
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, padding: spacing.lg, gap: 12 }}>
        {[0, 1, 2].map((i) => <Skeleton key={i} height={70} style={{ borderRadius: 16 }} />)}
      </View>
    );
  }
  if (!business) {
    return (
      <View style={styles.center}>
        <Text style={{ color: colors.textMuted }}>Aucune vitrine à gérer.</Text>
      </View>
    );
  }

  const showServices = business.type === "SERVICE" || business.type === "BOTH";
  const showProducts = business.type === "PRODUCT" || business.type === "BOTH";

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing.lg }}>
      <Text style={styles.bizName}>{business.name}</Text>

      {showServices && (
        <View style={{ marginTop: spacing.md }}>
          <SectionHeader title="Prestations" action="+ Ajouter" onAction={() => router.push("/manage/service")} />
          {business.services && business.services.length > 0 ? (
            business.services.map((s) => (
              <Card key={s.id} style={!s.isActive ? { opacity: 0.5 } : undefined}>
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{s.name}{!s.isActive ? " (masqué)" : ""}</Text>
                    <Text style={styles.meta}>⏱ {formatDuration(s.durationMin)} · {formatPrice(s.price)}</Text>
                  </View>
                  <View style={styles.actions}>
                    <Pressable onPress={() => router.push({ pathname: "/manage/service", params: serviceParams(s) })} style={styles.editBtn}>
                      <Text style={styles.editText}>Modifier</Text>
                    </Pressable>
                    <Pressable onPress={() => removeService(s)} style={styles.delBtn}>
                      <Text style={styles.delText}>🗑</Text>
                    </Pressable>
                  </View>
                </View>
              </Card>
            ))
          ) : (
            <Text style={styles.empty}>Aucune prestation. Ajoutez-en une.</Text>
          )}
        </View>
      )}

      {showProducts && (
        <View style={{ marginTop: spacing.lg }}>
          <SectionHeader title="Produits" action="+ Ajouter" onAction={() => router.push("/manage/product")} />
          {business.products && business.products.length > 0 ? (
            business.products.map((p) => (
              <Card key={p.id} style={!p.isActive ? { opacity: 0.5 } : undefined}>
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{p.name}{!p.isActive ? " (masqué)" : ""}</Text>
                    <Text style={styles.meta}>{formatPrice(p.price)} · {p.stock} en stock</Text>
                  </View>
                  <View style={styles.actions}>
                    <Pressable onPress={() => router.push({ pathname: "/manage/product", params: productParams(p) })} style={styles.editBtn}>
                      <Text style={styles.editText}>Modifier</Text>
                    </Pressable>
                    <Pressable onPress={() => removeProduct(p)} style={styles.delBtn}>
                      <Text style={styles.delText}>🗑</Text>
                    </Pressable>
                  </View>
                </View>
              </Card>
            ))
          ) : (
            <Text style={styles.empty}>Aucun produit. Ajoutez-en un.</Text>
          )}
        </View>
      )}

      <View style={{ height: spacing.xl }} />
    </ScrollView>
  );
}

function serviceParams(s: Service) {
  return { id: s.id, name: s.name, description: s.description ?? "", durationMin: String(s.durationMin), price: String(s.price) };
}
function productParams(p: Product) {
  return { id: p.id, name: p.name, description: p.description ?? "", price: String(p.price), stock: String(p.stock) };
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  bizName: { fontSize: 24, fontWeight: "800", color: colors.text, letterSpacing: -0.5 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  name: { fontSize: 16, fontWeight: "700", color: colors.text },
  meta: { fontSize: 13, color: colors.primary, fontWeight: "600", marginTop: 4 },
  actions: { flexDirection: "row", alignItems: "center", gap: 8 },
  editBtn: { paddingHorizontal: 12, height: 36, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.primary, justifyContent: "center" },
  editText: { color: colors.primary, fontWeight: "700", fontSize: 13 },
  delBtn: { width: 36, height: 36, borderRadius: radius.md, backgroundColor: colors.surfaceAlt, alignItems: "center", justifyContent: "center" },
  delText: { fontSize: 16 },
  empty: { color: colors.textMuted, fontSize: 14, paddingVertical: spacing.sm },
});
