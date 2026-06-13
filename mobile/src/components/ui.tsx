import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { colors, gradients } from "../theme/colors";
import { radius, shadow, spacing } from "../theme/theme";

// ---- Button (gradient primary, outline secondary, ghost) ----
export function Button({
  title,
  onPress,
  loading,
  variant = "primary",
  disabled,
  small,
  icon,
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  disabled?: boolean;
  small?: boolean;
  icon?: string;
}) {
  const height = small ? 42 : 52;
  const handle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress();
  };

  const content = loading ? (
    <ActivityIndicator color={variant === "secondary" || variant === "ghost" ? colors.primary : "#fff"} />
  ) : (
    <Text
      style={[
        styles.btnText,
        { fontSize: small ? 14 : 16 },
        (variant === "secondary" || variant === "ghost") && { color: colors.primary },
      ]}
    >
      {icon ? `${icon}  ` : ""}
      {title}
    </Text>
  );

  if (variant === "primary") {
    return (
      <Pressable onPress={handle} disabled={disabled || loading} style={({ pressed }) => [{ opacity: disabled ? 0.5 : pressed ? 0.9 : 1 }]}>
        <LinearGradient colors={gradients.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.btn, { height }, shadow.card]}>
          {content}
        </LinearGradient>
      </Pressable>
    );
  }

  const bg =
    variant === "danger" ? colors.danger : variant === "ghost" ? "transparent" : colors.surface;
  return (
    <Pressable
      onPress={handle}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        { height, backgroundColor: bg, opacity: disabled ? 0.5 : pressed ? 0.9 : 1 },
        variant === "secondary" && { borderWidth: 1.5, borderColor: colors.primary },
      ]}
    >
      {variant === "danger" ? (
        <Text style={[styles.btnText, { fontSize: small ? 14 : 16 }]}>{title}</Text>
      ) : (
        content
      )}
    </Pressable>
  );
}

// ---- Labeled input ----
export function Field({ label, style, ...props }: TextInputProps & { label?: string }) {
  return (
    <View style={{ marginBottom: spacing.lg }}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput placeholderTextColor={colors.textFaint} style={[styles.input, style]} {...props} />
    </View>
  );
}

// ---- Card ----
export function Card({ children, style, onPress }: { children: React.ReactNode; style?: ViewStyle; onPress?: () => void }) {
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [styles.card, shadow.card, style, pressed && { opacity: 0.95 }]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, shadow.card, style]}>{children}</View>;
}

// ---- Star rating ----
export function Stars({ value, count, size = 13 }: { value: number; count?: number; size?: number }) {
  const full = Math.round(value);
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <Text style={{ color: colors.star, fontSize: size }}>
        {"★".repeat(full)}
        <Text style={{ color: colors.border }}>{"★".repeat(5 - full)}</Text>
      </Text>
      {count != null && (
        <Text style={{ color: colors.textMuted, marginLeft: 6, fontSize: size - 1 }}>
          {value > 0 ? value.toFixed(1) : "Nouveau"}
          {count > 0 ? ` (${count})` : ""}
        </Text>
      )}
    </View>
  );
}

// ---- Colored avatar with initials (or emoji) ----
export function Avatar({ name, size = 48, color = colors.primary, emoji }: { name?: string; size?: number; color?: string; emoji?: string }) {
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]}>
      <Text style={{ color: "#fff", fontSize: size * (emoji ? 0.5 : 0.4), fontWeight: "700" }}>
        {emoji ?? (name?.charAt(0).toUpperCase() || "?")}
      </Text>
    </View>
  );
}

// ---- Pill / chip ----
export function Chip({ label, active, onPress, color }: { label: string; active?: boolean; onPress?: () => void; color?: string }) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        active && { backgroundColor: color ?? colors.primary, borderColor: color ?? colors.primary },
      ]}
    >
      <Text style={[styles.chipText, active && { color: "#fff", fontWeight: "700" }]}>{label}</Text>
    </Pressable>
  );
}

// ---- Small status badge ----
export function Badge({ label, color = colors.primary }: { label: string; color?: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: color + "1A" }]}>
      <Text style={{ color, fontSize: 11, fontWeight: "700" }}>{label}</Text>
    </View>
  );
}

// ---- Section header ----
export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? (
        <Pressable onPress={onAction}>
          <Text style={styles.sectionAction}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

// ---- Skeleton block (loading placeholder) ----
export function Skeleton({ height = 16, width = "100%", style }: { height?: number; width?: number | string; style?: ViewStyle }) {
  return <View style={[{ height, width: width as any, backgroundColor: colors.surfaceAlt, borderRadius: radius.sm }, style]} />;
}

// Human-friendly status labels (FR).
export const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  CONFIRMED: "Confirmé",
  COMPLETED: "Terminé",
  CANCELLED: "Annulé",
  NO_SHOW: "Absent",
  PAID: "Payé",
  FULFILLED: "Récupéré",
};

export const STATUS_COLORS: Record<string, string> = {
  PENDING: colors.warning,
  CONFIRMED: colors.primary,
  COMPLETED: colors.success,
  CANCELLED: colors.textMuted,
  NO_SHOW: colors.danger,
  PAID: colors.primary,
  FULFILLED: colors.success,
};

const styles = StyleSheet.create({
  btn: { borderRadius: radius.lg, alignItems: "center", justifyContent: "center", flexDirection: "row" },
  btnText: { color: "#fff", fontWeight: "700" },
  label: { fontSize: 13, color: colors.textMuted, marginBottom: 6, fontWeight: "600" },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    height: 52,
    fontSize: 16,
    color: colors.text,
  },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md },
  avatar: { alignItems: "center", justifyContent: "center" },
  chip: {
    paddingHorizontal: 16,
    height: 38,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: "center",
  },
  chipText: { color: colors.text, fontSize: 14, fontWeight: "500" },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.sm, alignSelf: "flex-start" },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md, marginTop: spacing.sm },
  sectionTitle: { fontSize: 19, fontWeight: "800", color: colors.text, letterSpacing: -0.3 },
  sectionAction: { fontSize: 14, color: colors.primary, fontWeight: "600" },
});
