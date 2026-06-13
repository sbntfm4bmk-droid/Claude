import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { ordersApi, paymentsApi } from "../src/api";
import { useCart } from "../src/context/CartContext";
import { Button, Card } from "../src/components/ui";
import { colors } from "../src/theme/colors";
import { radius, spacing } from "../src/theme/theme";
import { formatPrice } from "../src/lib/format";

export default function CartScreen() {
  const router = useRouter();
  const cart = useCart();
  const [fulfillment, setFulfillment] = useState<"PICKUP" | "DELIVERY">("PICKUP");
  const [placing, setPlacing] = useState(false);

  async function checkout() {
    if (!cart.businessId || cart.lines.length === 0) return;
    setPlacing(true);
    try {
      // Create the order, then pay it (simulated PSP unless Stripe is configured).
      const { order } = await ordersApi.create({
        businessId: cart.businessId,
        fulfillment,
        items: cart.lines.map((l) => ({ productId: l.product.id, quantity: l.quantity })),
      });
      await paymentsApi.payOrder(order.id);
      cart.clear();
      Alert.alert("Paiement confirmé 🎉", "Votre commande est payée et envoyée au commerçant.", [
        { text: "Voir mes achats", onPress: () => router.replace("/(tabs)/orders") },
      ]);
    } catch (e) {
      Alert.alert("Paiement impossible", e instanceof Error ? e.message : "Réessayez.");
    } finally {
      setPlacing(false);
    }
  }

  if (cart.lines.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={{ fontSize: 48 }}>🛒</Text>
        <Text style={styles.emptyTitle}>Votre panier est vide</Text>
        <Text style={styles.emptyText}>Ajoutez des produits depuis une boutique.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 160 }}>
        <Text style={styles.shop}>🏬 {cart.businessName}</Text>

        {cart.lines.map((l) => (
          <Card key={l.product.id}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{l.product.name}</Text>
                <Text style={styles.unit}>{formatPrice(l.product.price)} / unité</Text>
              </View>
              <View style={styles.stepper}>
                <Pressable onPress={() => cart.setQuantity(l.product.id, l.quantity - 1)} style={styles.stepBtn}>
                  <Text style={styles.stepText}>−</Text>
                </Pressable>
                <Text style={styles.qty}>{l.quantity}</Text>
                <Pressable
                  onPress={() => cart.setQuantity(l.product.id, Math.min(l.quantity + 1, l.product.stock))}
                  style={styles.stepBtn}
                >
                  <Text style={styles.stepText}>+</Text>
                </Pressable>
              </View>
            </View>
          </Card>
        ))}

        <Text style={styles.label}>Mode de récupération</Text>
        <View style={{ flexDirection: "row", gap: 10 }}>
          {(["PICKUP", "DELIVERY"] as const).map((f) => (
            <Pressable key={f} onPress={() => setFulfillment(f)} style={[styles.fulfill, fulfillment === f && styles.fulfillActive]}>
              <Text style={[styles.fulfillText, fulfillment === f && { color: "#fff" }]}>
                {f === "PICKUP" ? "🏪 Retrait" : "🚚 Livraison"}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatPrice(cart.total)}</Text>
        </View>
        <Button title={`Payer ${formatPrice(cart.total)}`} onPress={checkout} loading={placing} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background, gap: 8, padding: spacing.xl },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: colors.text },
  emptyText: { fontSize: 14, color: colors.textMuted, textAlign: "center" },
  shop: { fontSize: 17, fontWeight: "800", color: colors.text, marginBottom: spacing.md },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  name: { fontSize: 16, fontWeight: "700", color: colors.text },
  unit: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  stepper: { flexDirection: "row", alignItems: "center", gap: 14 },
  stepBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.surfaceAlt, alignItems: "center", justifyContent: "center" },
  stepText: { fontSize: 20, fontWeight: "800", color: colors.primary },
  qty: { fontSize: 16, fontWeight: "700", color: colors.text, minWidth: 20, textAlign: "center" },
  label: { fontSize: 16, fontWeight: "700", color: colors.text, marginTop: spacing.xl, marginBottom: spacing.sm },
  fulfill: { flex: 1, height: 48, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  fulfillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  fulfillText: { fontWeight: "700", color: colors.textMuted },
  footer: { position: "absolute", left: 0, right: 0, bottom: 0, padding: spacing.lg, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md },
  totalLabel: { fontSize: 16, color: colors.textMuted, fontWeight: "600" },
  totalValue: { fontSize: 24, fontWeight: "800", color: colors.text },
});
