import { Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { Business } from "../api/types";
import { colors } from "../theme/colors";
import { radius, shadow, spacing } from "../theme/theme";
import { Badge, Stars } from "./ui";
import { businessTypeLabel, formatDistance } from "../lib/format";

// A rich storefront card with a colored cover banner derived from the category.
export function BusinessCard({ business, onPress }: { business: Business; onPress: () => void }) {
  const accent = business.category?.color ?? colors.primary;
  const icon = business.category?.icon ?? "✨";
  const distance = formatDistance(business.distanceKm);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, shadow.card, pressed && { opacity: 0.95 }]}
    >
      {/* Cover banner */}
      <LinearGradient
        colors={[accent, shade(accent)]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cover}
      >
        <Text style={styles.coverIcon}>{icon}</Text>
        {distance ? (
          <View style={styles.distancePill}>
            <Text style={styles.distanceText}>📍 {distance}</Text>
          </View>
        ) : null}
      </LinearGradient>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1}>
            {business.name}
          </Text>
        </View>
        <Text style={styles.tagline} numberOfLines={1}>
          {business.tagline ?? business.category?.name ?? "Professionnel"}
        </Text>
        <View style={styles.metaRow}>
          <Stars value={business.ratingAvg} count={business.ratingCount} />
          <Badge label={businessTypeLabel(business.type)} color={accent} />
        </View>
      </View>
    </Pressable>
  );
}

// Darken a hex color for the gradient end stop.
function shade(hex: string): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, ((n >> 16) & 255) - 40);
  const g = Math.max(0, ((n >> 8) & 255) - 40);
  const b = Math.max(0, (n & 255) - 40);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
    overflow: "hidden",
  },
  cover: { height: 92, padding: spacing.md, justifyContent: "space-between", flexDirection: "row" },
  coverIcon: { fontSize: 40 },
  distancePill: {
    backgroundColor: "rgba(0,0,0,0.25)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    alignSelf: "flex-start",
    height: 28,
  },
  distanceText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  body: { padding: spacing.lg },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  name: { fontSize: 18, fontWeight: "800", color: colors.text, flex: 1, letterSpacing: -0.3 },
  tagline: { fontSize: 14, color: colors.textMuted, marginTop: 2, marginBottom: spacing.md },
  metaRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
});
