import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { bookingsApi } from "../../src/api";
import type { Booking, BookingStatus } from "../../src/api/types";
import { useAuth } from "../../src/context/AuthContext";
import { Button, Card, StatusBadge } from "../../src/components/ui";
import { colors } from "../../src/theme/colors";

export default function BookingsScreen() {
  const { user } = useAuth();
  const isProvider = user?.role === "PROVIDER";
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const r = await bookingsApi.list();
      setBookings(r.bookings);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Reload whenever the tab gains focus (e.g. after creating a booking).
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function changeStatus(id: string, status: BookingStatus) {
    try {
      await bookingsApi.updateStatus(id, status);
      load();
    } catch (e) {
      Alert.alert("Erreur", e instanceof Error ? e.message : "Action impossible");
    }
  }

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />;

  return (
    <FlatList
      style={{ backgroundColor: colors.background }}
      data={bookings}
      keyExtractor={(b) => b.id}
      contentContainerStyle={{ padding: 16 }}
      ListEmptyComponent={<Text style={styles.empty}>Aucune réservation pour le moment.</Text>}
      renderItem={({ item }) => {
        // The "other party" depends on whether we're a client or a provider.
        const otherName = isProvider
          ? item.client?.fullName
          : item.provider?.user?.fullName;
        return (
          <Card>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
              <Text style={styles.cat}>{item.category?.name ?? "Service"}</Text>
              <StatusBadge status={item.status} />
            </View>
            <Text style={styles.party}>{isProvider ? "Client" : "Prestataire"} : {otherName}</Text>
            <Text style={styles.desc}>{item.description}</Text>
            {item.priceEstimate != null && (
              <Text style={styles.price}>Estimation : {item.priceEstimate}€/h</Text>
            )}

            {/* Provider actions on a pending request */}
            {isProvider && item.status === "PENDING" && (
              <View style={styles.actions}>
                <View style={{ flex: 1 }}>
                  <Button title="Accepter" onPress={() => changeStatus(item.id, "ACCEPTED")} />
                </View>
                <View style={{ flex: 1 }}>
                  <Button title="Refuser" variant="danger" onPress={() => changeStatus(item.id, "REJECTED")} />
                </View>
              </View>
            )}
            {isProvider && item.status === "ACCEPTED" && (
              <Button title="Démarrer la mission" onPress={() => changeStatus(item.id, "IN_PROGRESS")} />
            )}
            {isProvider && item.status === "IN_PROGRESS" && (
              <Button title="Marquer terminé" onPress={() => changeStatus(item.id, "COMPLETED")} />
            )}

            {/* Client can cancel while still pending/accepted */}
            {!isProvider && (item.status === "PENDING" || item.status === "ACCEPTED") && (
              <Button title="Annuler" variant="secondary" onPress={() => changeStatus(item.id, "CANCELLED")} />
            )}
          </Card>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  cat: { fontSize: 14, fontWeight: "700", color: colors.accent },
  party: { fontSize: 14, color: colors.text, marginBottom: 4, fontWeight: "500" },
  desc: { fontSize: 14, color: colors.textMuted, marginBottom: 6 },
  price: { fontSize: 13, color: colors.primary, fontWeight: "600", marginBottom: 4 },
  actions: { flexDirection: "row", gap: 10 },
  empty: { textAlign: "center", color: colors.textMuted, marginTop: 60 },
});
