import { useCallback, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { ordersApi } from "../../src/api";
import type { Order, OrderStatus } from "../../src/api/types";
import { useAuth } from "../../src/context/AuthContext";
import { useCart } from "../../src/context/CartContext";
import { Badge, Button, Card, Skeleton, STATUS_COLORS, STATUS_LABELS } from "../../src/components/ui";
import { colors } from "../../src/theme/colors";
import { spacing } from "../../src/theme/theme";
import { formatPrice } from "../../src/lib/format";

export default function OrdersScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const cart = useCart();
  const isProvider = user?.role === "PROVIDER";
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const r = await ordersApi.list();
      setOrders(r.orders);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function setStatus(id: string, status: OrderStatus) {
    try {
      await ordersApi.updateStatus(id, status);
      load();
    } catch (e) {
      Alert.alert("Erreur", e instanceof Error ? e.message : "Action impossible");
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, padding: spacing.lg, gap: 12 }}>
        {[0, 1, 2].map((i) => <Skeleton key={i} height={110} style={{ borderRadius: 16 }} />)}
      </View>
    );
  }

  return (
    <FlatList
      style={{ backgroundColor: colors.background }}
      data={orders}
      keyExtractor={(o) => o.id}
      contentContainerStyle={{ padding: spacing.lg }}
      ListHeaderComponent={
        cart.count > 0 ? (
          <Card style={{ backgroundColor: colors.accentSoft }}>
            <Text style={styles.cartTitle}>🛒 Panier en cours · {cart.businessName}</Text>
            <Text style={styles.cartMeta}>{cart.count} article{cart.count > 1 ? "s" : ""} · {formatPrice(cart.total)}</Text>
            <Button title="Finaliser ma commande" small onPress={() => router.push("/cart")} />
          </Card>
        ) : null
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={{ fontSize: 44 }}>🛍️</Text>
          <Text style={styles.emptyTitle}>{isProvider ? "Aucune commande reçue" : "Aucun achat"}</Text>
          {!isProvider && <Text style={styles.emptyText}>Commandez auprès des boutiques près de vous.</Text>}
        </View>
      }
      renderItem={({ item }) => (
        <Card>
          <View style={styles.head}>
            <Text style={styles.shop}>{isProvider ? `👤 ${item.client?.fullName}` : `🏬 ${item.business?.name}`}</Text>
            <Badge label={STATUS_LABELS[item.status] ?? item.status} color={STATUS_COLORS[item.status]} />
          </View>
          {item.items?.map((li) => (
            <Text key={li.id} style={styles.line}>
              {li.quantity} × {li.product?.name ?? "Produit"} — {formatPrice(li.unitPrice * li.quantity)}
            </Text>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.fulfill}>{item.fulfillment === "PICKUP" ? "🏪 Retrait" : "🚚 Livraison"}</Text>
            <Text style={styles.total}>{formatPrice(item.total)}</Text>
          </View>

          {isProvider && item.status === "PENDING" && (
            <View style={styles.actions}>
              <View style={{ flex: 1 }}><Button title="Marquer payé" small onPress={() => setStatus(item.id, "PAID")} /></View>
              <View style={{ flex: 1 }}><Button title="Annuler" small variant="secondary" onPress={() => setStatus(item.id, "CANCELLED")} /></View>
            </View>
          )}
          {isProvider && item.status === "PAID" && (
            <Button title="Marquer récupéré" small onPress={() => setStatus(item.id, "FULFILLED")} />
          )}
        </Card>
      )}
    />
  );
}

const styles = StyleSheet.create({
  cartTitle: { fontSize: 15, fontWeight: "800", color: colors.text },
  cartMeta: { fontSize: 13, color: colors.textMuted, marginTop: 2, marginBottom: spacing.sm },
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  shop: { fontSize: 16, fontWeight: "800", color: colors.text, flex: 1 },
  line: { fontSize: 14, color: colors.textMuted, marginBottom: 2 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8, marginBottom: 4 },
  fulfill: { fontSize: 13, color: colors.textMuted, fontWeight: "600" },
  total: { fontSize: 18, fontWeight: "800", color: colors.text },
  actions: { flexDirection: "row", gap: 10, marginTop: 4 },
  empty: { alignItems: "center", paddingVertical: 80, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: colors.text },
  emptyText: { fontSize: 14, color: colors.textMuted, textAlign: "center" },
});
