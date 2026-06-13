import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { servicesApi } from "../../src/api";
import { Button, Field } from "../../src/components/ui";
import { colors } from "../../src/theme/colors";
import { spacing } from "../../src/theme/theme";

// Create or edit a service. If `id` is present in params, it's an edit.
export default function ServiceEditScreen() {
  const params = useLocalSearchParams<{
    id?: string;
    name?: string;
    description?: string;
    durationMin?: string;
    price?: string;
  }>();
  const router = useRouter();
  const isEdit = Boolean(params.id);

  const [name, setName] = useState(params.name ?? "");
  const [description, setDescription] = useState(params.description ?? "");
  const [durationMin, setDurationMin] = useState(params.durationMin ?? "60");
  const [price, setPrice] = useState(params.price ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!name.trim()) {
      Alert.alert("Nom requis", "Donnez un nom à la prestation.");
      return;
    }
    setSaving(true);
    try {
      const body = {
        name: name.trim(),
        description: description.trim() || undefined,
        durationMin: Number(durationMin) || 60,
        price: Number(price) || 0,
      };
      if (isEdit && params.id) {
        await servicesApi.update(params.id, body);
      } else {
        await servicesApi.create(body);
      }
      router.back();
    } catch (e) {
      Alert.alert("Erreur", e instanceof Error ? e.message : "Enregistrement impossible");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing.xl }}>
      <Text style={styles.title}>{isEdit ? "Modifier la prestation" : "Nouvelle prestation"}</Text>
      <Field label="Nom" value={name} onChangeText={setName} placeholder="Coupe femme" />
      <Field
        label="Description (optionnel)"
        value={description}
        onChangeText={setDescription}
        placeholder="Shampoing, coupe, brushing"
        multiline
        numberOfLines={3}
        style={{ height: 90, textAlignVertical: "top", paddingTop: 12 }}
      />
      <Field label="Durée (minutes)" value={durationMin} onChangeText={setDurationMin} keyboardType="numeric" placeholder="60" />
      <Field label="Prix (€)" value={price} onChangeText={setPrice} keyboardType="numeric" placeholder="39" />
      <Button title={isEdit ? "Enregistrer" : "Créer la prestation"} onPress={save} loading={saving} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: "800", color: colors.text, marginBottom: spacing.xl, letterSpacing: -0.5 },
});
