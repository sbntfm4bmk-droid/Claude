import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { businessesApi, favoritesApi } from "../../src/api";
import type { Business, Product, Service } from "../../src/api/types";
import { useAuth } from "../../src/context/AuthContext";
import { useCart } from "../../src/context/CartContext";
import { Badge, Button, Card, Skeleton, Stars } from "../../src/components/ui";
import { colors } from "../../src/theme/colors";
import { radius, shadow, spacing } from "../../src/theme/theme";
import {
  businessTypeLabel,
  formatDistance,
  formatDuration,
  formatPrice,
} from "../../src/lib/format";

export default function StorefrontScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const cart = useCart();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"services" | "products">("services");
  const [favorited, setFavorited] = useState(false);

  useEffect(() => {
    if (!id) return;
    businessesApi
      .get(id)
      .then((r) => {
        setBusiness(r.business);
        setTab(r.business.type === "PRODUCT" ? "products" : "services");
      })
      .catch(() => setBusiness(null))
      .finally(() => setLoading(false));
  }, [id]);

  async function toggleFav() {
    if (!business) return;
    setFavorited((f) => !f);
    try {
      const r = await favoritesApi.toggle(business.id);
      setFavorited(r.favorited);
    } catch {
      setFavorited((f) => !f);
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, padding: spacing.lg, paddingTop: 80, gap: 12 }}>
        <Skeleton height={140} style={{ borderRadius: radius.lg }} />
        <Skeleton height={24} width="70%" />
        <Skeleton height={16} width="50%" />
      </View>
    );
  }
  if (!business) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={{ color: colors.textMuted }}>Vitrine introuvable.</Text>
      </SafeAreaView>
    );
  }

  const accent = business.category?.color ?? colors.primary;
  const icon = business.category?.icon ?? "✨";
  const distance = formatDistance(business.distanceKm);
  const isOwn = user?.business?.id === business.id;
  const hasServices = (business.services?.length ?? 0) > 0;
  const hasProducts = (business.products?.length ?? 0) > 0;
  const cartForThis = cart.businessId === business.id && cart.count > 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: cartForThis ? 110 : 40 }}>
        {/* Cover */}
        <LinearGradient colors={[accent, shade(accent)]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cover}>
          <SafeAreaView edges={["top"]} style={styles.coverNav}>
            <Pressable onPress={() => router.back()} style={styles.iconBtn}>
              <Text style={styles.iconBtnText}>‹</Text>
            </Pressable>
            <Pressable onPress={toggleFav} style={styles.iconBtn}>
              <Text style={{ fontSize: 18 }}>{favorited ? "❤️" : "🤍"}</Text>
            </Pressable>
          </SafeAreaView>
          <Text style={styles.coverIcon}>{icon}</Text>
        </LinearGradient>

        <View style={styles.body}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <Text style={styles.name}>{business.name}</Text>
            <Badge label={businessTypeLabel(business.type)} color={accent} />
          </View>
          {business.tagline ? <Text style={styles.tagline}>{business.tagline}</Text> : null}

          <View style={styles.metaRow}>
            <Stars value={business.ratingAvg} count={business.ratingCount} size={15} />
            {distance ? <Text style={styles.distance}>· 📍 {distance}</Text> : null}
          </View>
          {business.city ? <Text style={styles.address}>{business.addressLine ? `${business.addressLine}, ` : ""}{business.city}</Text> : null}

          {business.description ? (
            <Card style={{ marginTop: spacing.lg }}>
              <Text style={styles.sectionTitle}>À propos</Text>
              <Text style={styles.desc}>{business.description}</Text>
            </Card>
          ) : null}

          {/* Tabs (only if the business has both kinds) */}
          {hasServices && hasProducts ? (
            <View style={styles.tabs}>
              <Pressable onPress={() => setTab("services")} style={[styles.tab, tab === "services" && styles.tabActive]}>
                <Text style={[styles.tabText, tab === "services" && styles.tabTextActive]}>Prestations</Text>
              </Pressable>
              <Pressable onPress={() => setTab("products")} style={[styles.tab, tab === "products" && styles.tabActive]}>
                <Text style={[styles.tabText, tab === "products" && styles.tabTextActive]}>Boutique</Text>
              </Pressable>
            </View>
          ) : null}

          {/* Services */}
          {(tab === "services" || !hasProducts) && hasServices && (
            <View style={{ marginTop: spacing.md }}>
              {!hasProducts && <Text style={styles.listHeader}>Prestations</Text>}
              {business.services!.map((s) => (
                <ServiceRow
                  key={s.id}
                  service={s}
                  accent={accent}
                  disabled={isOwn}
                  onBook={() =>
                    router.push({
                      pathname: "/booking/[serviceId]",
                      params: {
                        serviceId: s.id,
                        name: s.name,
                        price: String(s.price),
                        duration: String(s.durationMin),
                        businessName: business.name,
                      },
                    })
                  }
                />
              ))}
            </View>
          )}

          {/* Products */}
          {(tab === "products" || !hasServices) && hasProducts && (
            <View style={{ marginTop: spacing.md }}>
              {!hasServices && <Text style={styles.listHeader}>Boutique</Text>}
              {business.products!.map((p) => (
                <ProductRow
                  key={p.id}
                  product={p}
                  accent={accent}
                  disabled={isOwn}
                  onAdd={() => cart.add({ id: business.id, name: business.name }, p)}
                />
              ))}
            </View>
          )}

          {/* Reviews */}
          {business.reviews && business.reviews.length > 0 ? (
            <View style={{ marginTop: spacing.xl }}>
              <Text style={styles.listHeader}>Avis ({business.ratingCount})</Text>
              {business.reviews.map((rev) => (
                <Card key={rev.id}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                    <Text style={styles.reviewer}>{rev.author?.fullName ?? "Client"}</Text>
                    <Stars value={rev.rating} />
                  </View>
                  {rev.comment ? <Text style={styles.desc}>{rev.comment}</Text> : null}
                </Card>
              ))}
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* Floating cart bar */}
      {cartForThis && (
        <View style={[styles.cartBar, shadow.float]}>
          <View>
            <Text style={styles.cartCount}>{cart.count} article{cart.count > 1 ? "s" : ""}</Text>
            <Text style={styles.cartTotal}>{formatPrice(cart.total)}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: spacing.lg }}>
            <Button title="Voir le panier" onPress={() => router.push("/cart")} />
          </View>
        </View>
      )}
    </View>
  );
}

function ServiceRow({ service, accent, onBook, disabled }: { service: Service; accent: string; onBook: () => void; disabled?: boolean }) {
  return (
    <Card>
      <View style={styles.rowBetween}>
        <View style={{ flex: 1, paddingRight: spacing.md }}>
          <Text style={styles.itemName}>{service.name}</Text>
          {service.description ? <Text style={styles.itemDesc} numberOfLines={2}>{service.description}</Text> : null}
          <Text style={styles.itemMeta}>⏱ {formatDuration(service.durationMin)} · {formatPrice(service.price)}</Text>
        </View>
        {!disabled && <Button title="Réserver" small onPress={onBook} />}
      </View>
    </Card>
  );
}

function ProductRow({ product, accent, onAdd, disabled }: { product: Product; accent: string; onAdd: () => void; disabled?: boolean }) {
  const out = product.stock <= 0;
  return (
    <Card>
      <View style={styles.rowBetween}>
        <View style={{ flex: 1, paddingRight: spacing.md }}>
          <Text style={styles.itemName}>{product.name}</Text>
          {product.description ? <Text style={styles.itemDesc} numberOfLines={2}>{product.description}</Text> : null}
          <Text style={styles.itemMeta}>{formatPrice(product.price)} · {out ? "Épuisé" : `${product.stock} en stock`}</Text>
        </View>
        {!disabled && <Button title={out ? "Épuisé" : "Ajouter"} small variant={out ? "secondary" : "primary"} disabled={out} onPress={onAdd} />}
      </View>
    </Card>
  );
}

function shade(hex: string): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, ((n >> 16) & 255) - 45);
  const g = Math.max(0, ((n >> 8) & 255) - 45);
  const b = Math.max(0, (n & 255) - 45);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  cover: { height: 200, justifyContent: "space-between" },
  coverNav: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: spacing.lg },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.9)", alignItems: "center", justifyContent: "center" },
  iconBtnText: { fontSize: 28, fontWeight: "800", color: colors.text, marginTop: -4 },
  coverIcon: { fontSize: 64, alignSelf: "center", marginBottom: spacing.lg },
  body: { padding: spacing.lg, marginTop: -16, backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  name: { fontSize: 26, fontWeight: "800", color: colors.text, flex: 1, letterSpacing: -0.5 },
  tagline: { fontSize: 15, color: colors.textMuted, marginTop: 4 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: spacing.md },
  distance: { fontSize: 14, color: colors.textMuted },
  address: { fontSize: 13, color: colors.textFaint, marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 6 },
  desc: { fontSize: 14, color: colors.textMuted, lineHeight: 21 },
  tabs: { flexDirection: "row", backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: 4, marginTop: spacing.xl },
  tab: { flex: 1, height: 42, borderRadius: radius.sm, alignItems: "center", justifyContent: "center" },
  tabActive: { backgroundColor: colors.surface, ...shadow.card },
  tabText: { fontWeight: "700", color: colors.textMuted },
  tabTextActive: { color: colors.primary },
  listHeader: { fontSize: 19, fontWeight: "800", color: colors.text, marginBottom: spacing.md, letterSpacing: -0.3 },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  itemName: { fontSize: 16, fontWeight: "700", color: colors.text },
  itemDesc: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  itemMeta: { fontSize: 13, color: colors.primary, fontWeight: "600", marginTop: 6 },
  reviewer: { fontSize: 14, fontWeight: "700", color: colors.text },
  cartBar: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
    paddingLeft: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
  },
  cartCount: { fontSize: 12, color: colors.textMuted, fontWeight: "600" },
  cartTotal: { fontSize: 18, fontWeight: "800", color: colors.text },
});
