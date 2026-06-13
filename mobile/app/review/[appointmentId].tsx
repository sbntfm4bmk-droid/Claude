import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { reviewsApi } from "../../src/api";
import { Button, Field } from "../../src/components/ui";
import { colors } from "../../src/theme/colors";
import { spacing } from "../../src/theme/theme";

export default function ReviewScreen() {
  const { appointmentId } = useLocalSearchParams<{ appointmentId: string }>();
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!appointmentId) return;
    setSaving(true);
    try {
      await reviewsApi.create({ appointmentId, rating, comment: comment.trim() || undefined });
      Alert.alert("Merci ! ⭐", "Votre avis a été publié.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert("Erreur", e instanceof Error ? e.message : "Impossible d'envoyer l'avis");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing.xl }}>
      <Text style={styles.title}>Comment s'est passé votre RDV ?</Text>

      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable key={n} onPress={() => setRating(n)}>
            <Text style={[styles.star, { color: n <= rating ? colors.star : colors.border }]}>★</Text>
          </Pressable>
        ))}
      </View>

      <Field
        label="Votre commentaire (optionnel)"
        value={comment}
        onChangeText={setComment}
        placeholder="Partagez votre expérience..."
        multiline
        numberOfLines={4}
        style={{ height: 110, textAlignVertical: "top", paddingTop: 12 }}
      />

      <Button title="Publier mon avis" onPress={submit} loading={saving} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: "800", color: colors.text, marginBottom: spacing.xl, textAlign: "center" },
  starsRow: { flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: spacing.xl },
  star: { fontSize: 44 },
});
