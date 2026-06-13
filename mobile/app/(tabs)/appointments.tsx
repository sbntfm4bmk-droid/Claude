import { useCallback, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { appointmentsApi } from "../../src/api";
import type { Appointment, AppointmentStatus } from "../../src/api/types";
import { useAuth } from "../../src/context/AuthContext";
import { Badge, Button, Card, Skeleton, STATUS_COLORS, STATUS_LABELS } from "../../src/components/ui";
import { colors } from "../../src/theme/colors";
import { spacing } from "../../src/theme/theme";
import { formatDateTime, formatPrice } from "../../src/lib/format";

export default function AppointmentsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const isProvider = user?.role === "PROVIDER";
  const [appts, setAppts] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const r = await appointmentsApi.list();
      setAppts(r.appointments);
    } catch {
      setAppts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function setStatus(id: string, status: AppointmentStatus) {
    try {
      await appointmentsApi.updateStatus(id, status);
      load();
    } catch (e) {
      Alert.alert("Erreur", e instanceof Error ? e.message : "Action impossible");
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, padding: spacing.lg, gap: 12 }}>
        {[0, 1, 2].map((i) => <Skeleton key={i} height={120} style={{ borderRadius: 16 }} />)}
      </View>
    );
  }

  return (
    <FlatList
      style={{ backgroundColor: colors.background }}
      data={appts}
      keyExtractor={(a) => a.id}
      contentContainerStyle={{ padding: spacing.lg }}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={{ fontSize: 44 }}>📅</Text>
          <Text style={styles.emptyTitle}>{isProvider ? "Aucun RDV pour l'instant" : "Aucun rendez-vous"}</Text>
          {!isProvider && <Text style={styles.emptyText}>Réservez une prestation depuis Découvrir.</Text>}
        </View>
      }
      renderItem={({ item }) => {
        const other = isProvider ? item.client?.fullName : item.business?.name;
        const accent = item.business?.category?.color ?? colors.primary;
        return (
          <Card>
            <View style={styles.head}>
              <Text style={styles.svc}>{item.service?.name ?? "Prestation"}</Text>
              <Badge label={STATUS_LABELS[item.status] ?? item.status} color={STATUS_COLORS[item.status]} />
            </View>
            <Text style={styles.when}>🗓 {formatDateTime(item.startAt)}</Text>
            <Text style={styles.party}>{isProvider ? "👤 " : "🏬 "}{other}</Text>
            <Text style={styles.price}>{formatPrice(item.priceAtBooking)}</Text>
            {item.depositPaid && item.depositAmount > 0 ? (
              <Text style={styles.deposit}>🔒 Acompte de {formatPrice(item.depositAmount)} réglé</Text>
            ) : null}

            {/* Provider actions */}
            {isProvider && item.status === "PENDING" && (
              <View style={styles.actions}>
                <View style={{ flex: 1 }}><Button title="Confirmer" small onPress={() => setStatus(item.id, "CONFIRMED")} /></View>
                <View style={{ flex: 1 }}><Button title="Refuser" small variant="danger" onPress={() => setStatus(item.id, "CANCELLED")} /></View>
              </View>
            )}
            {isProvider && item.status === "CONFIRMED" && (
              <View style={styles.actions}>
                <View style={{ flex: 1 }}><Button title="Terminé" small onPress={() => setStatus(item.id, "COMPLETED")} /></View>
                <View style={{ flex: 1 }}><Button title="Absent" small variant="secondary" onPress={() => setStatus(item.id, "NO_SHOW")} /></View>
              </View>
            )}

            {/* Client actions */}
            {!isProvider && (item.status === "PENDING" || item.status === "CONFIRMED") && (
              <Button title="Annuler le RDV" small variant="secondary" onPress={() => setStatus(item.id, "CANCELLED")} />
            )}
            {!isProvider && item.status === "COMPLETED" && !item.review && (
              <Button title="⭐ Laisser un avis" small onPress={() => router.push(`/review/${item.id}`)} />
            )}
            {!isProvider && item.review && (
              <Text style={styles.reviewed}>✅ Avis laissé ({item.review.rating}/5)</Text>
            )}
          </Card>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  svc: { fontSize: 17, fontWeight: "800", color: colors.text, flex: 1 },
  when: { fontSize: 14, color: colors.text, fontWeight: "600", marginBottom: 4 },
  party: { fontSize: 14, color: colors.textMuted, marginBottom: 4 },
  price: { fontSize: 14, color: colors.primary, fontWeight: "700", marginBottom: 4 },
  deposit: { fontSize: 12, color: colors.success, fontWeight: "600", marginBottom: 8 },
  actions: { flexDirection: "row", gap: 10 },
  reviewed: { fontSize: 13, color: colors.success, fontWeight: "600", marginTop: 4 },
  empty: { alignItems: "center", paddingVertical: 80, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: colors.text },
  emptyText: { fontSize: 14, color: colors.textMuted, textAlign: "center" },
});
