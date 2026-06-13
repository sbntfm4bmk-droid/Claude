import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { appointmentsApi, paymentsApi, servicesApi } from "../../src/api";
import type { Slot } from "../../src/api/types";
import { Button, Card, Skeleton } from "../../src/components/ui";
import { colors } from "../../src/theme/colors";
import { radius, spacing } from "../../src/theme/theme";
import { formatDay, formatDuration, formatPrice, formatTime } from "../../src/lib/format";
import { scheduleAppointmentReminder } from "../../src/lib/notifications";

// Default deposit policy mirrors the server (30% of the price).
function depositFor(price: number): number {
  if (price <= 0) return 0;
  return Math.max(1, Math.round(price * 0.3));
}

// Build the next 14 selectable days.
function nextDays(n: number): Date[] {
  const out: Date[] = [];
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  for (let i = 0; i < n; i++) {
    const d = new Date(base);
    d.setDate(d.getDate() + i);
    out.push(d);
  }
  return out;
}

function toDateParam(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function BookingScreen() {
  const params = useLocalSearchParams<{
    serviceId: string;
    name?: string;
    price?: string;
    duration?: string;
    businessName?: string;
  }>();
  const router = useRouter();
  const days = nextDays(14);
  const [selectedDay, setSelectedDay] = useState(days[0]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    if (!params.serviceId) return;
    setLoadingSlots(true);
    setSelectedSlot(null);
    servicesApi
      .slots(params.serviceId, toDateParam(selectedDay))
      .then((r) => setSlots(r.slots))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [params.serviceId, selectedDay]);

  const price = Number(params.price ?? 0);
  const deposit = depositFor(price);

  async function confirm() {
    if (!selectedSlot || !params.serviceId) return;
    setBooking(true);
    try {
      const { appointment } = await appointmentsApi.create({
        serviceId: params.serviceId,
        startAt: selectedSlot,
      });

      // Take the deposit to secure the slot (simulated unless Stripe is live).
      let depositMsg = "";
      if (appointment.depositAmount > 0) {
        try {
          await paymentsApi.payDeposit(appointment.id);
          depositMsg = `\n\nAcompte de ${formatPrice(appointment.depositAmount)} réglé pour sécuriser le créneau.`;
        } catch {
          depositMsg = "";
        }
      }

      // Schedule a local reminder ~1h before (best-effort).
      scheduleAppointmentReminder({
        startAt: appointment.startAt,
        businessName: params.businessName,
        serviceName: params.name,
      });

      Alert.alert("RDV confirmé ✅", `Votre demande a été envoyée au professionnel.${depositMsg}`, [
        { text: "Voir mes RDV", onPress: () => router.replace("/(tabs)/appointments") },
      ]);
    } catch (e) {
      Alert.alert("Créneau indisponible", e instanceof Error ? e.message : "Réessayez.");
      // Refresh slots in case it was just taken.
      servicesApi.slots(params.serviceId, toDateParam(selectedDay)).then((r) => setSlots(r.slots));
    } finally {
      setBooking(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }}>
        <Card>
          <Text style={styles.svcName}>{params.name ?? "Prestation"}</Text>
          {params.businessName ? <Text style={styles.svcBiz}>{params.businessName}</Text> : null}
          <Text style={styles.svcMeta}>
            ⏱ {formatDuration(Number(params.duration ?? 60))} · {formatPrice(price)}
          </Text>
          {deposit > 0 ? (
            <Text style={styles.deposit}>🔒 Acompte de {formatPrice(deposit)} pour réserver</Text>
          ) : null}
        </Card>

        <Text style={styles.label}>Choisissez un jour</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
          {days.map((d) => {
            const active = toDateParam(d) === toDateParam(selectedDay);
            return (
              <Pressable key={d.toISOString()} onPress={() => setSelectedDay(d)} style={[styles.dayChip, active && styles.dayChipActive]}>
                <Text style={[styles.dayText, active && { color: "#fff" }]}>{formatDay(d)}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Text style={styles.label}>Créneaux disponibles</Text>
        {loadingSlots ? (
          <View style={styles.slotGrid}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} height={46} width="30%" style={{ borderRadius: radius.md }} />
            ))}
          </View>
        ) : slots.length === 0 ? (
          <Card>
            <Text style={{ color: colors.textMuted, textAlign: "center" }}>
              Aucun créneau ce jour-là. Essayez une autre date.
            </Text>
          </Card>
        ) : (
          <View style={styles.slotGrid}>
            {slots.map((s) => {
              const active = selectedSlot === s.startAt;
              return (
                <Pressable key={s.startAt} onPress={() => setSelectedSlot(s.startAt)} style={[styles.slot, active && styles.slotActive]}>
                  <Text style={[styles.slotText, active && { color: "#fff" }]}>{formatTime(s.startAt)}</Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={selectedSlot ? `Confirmer · ${formatTime(selectedSlot)}` : "Sélectionnez un créneau"}
          onPress={confirm}
          disabled={!selectedSlot}
          loading={booking}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  svcName: { fontSize: 20, fontWeight: "800", color: colors.text },
  svcBiz: { fontSize: 14, color: colors.textMuted, marginTop: 2 },
  svcMeta: { fontSize: 14, color: colors.primary, fontWeight: "600", marginTop: spacing.sm },
  deposit: { fontSize: 13, color: colors.textMuted, marginTop: 6 },
  label: { fontSize: 16, fontWeight: "700", color: colors.text, marginTop: spacing.xl, marginBottom: spacing.sm },
  dayChip: { paddingHorizontal: 16, height: 44, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, justifyContent: "center" },
  dayChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  dayText: { fontWeight: "700", color: colors.textMuted, fontSize: 14 },
  slotGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  slot: { width: "30%", height: 46, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  slotActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  slotText: { fontWeight: "700", color: colors.text },
  footer: { position: "absolute", left: 0, right: 0, bottom: 0, padding: spacing.lg, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
});
