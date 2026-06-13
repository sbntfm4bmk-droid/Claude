import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { productsApi } from "../../src/api";
import { Button, Field } from "../../src/components/ui";
import { colors } from "../../src/theme/colors";
import { spacing } from "../../src/theme/theme";

// Create or edit a product. If `id` is present in params, it's an edit.
export default function ProductEditScreen() {
  const params = useLocalSearchParams<{
    id?: string;
    name?: string;
    description?: string;
    price?: string;
    stock?: string;
  }>();
  const router = useRouter();
  const isEdit = Boolean(params.id);

  const [name, setName] = useState(params.name ?? "");
  const [description, setDescription] = useState(params.description ?? "");
  const [price, setPrice] = useState(params.price ?? "");
  const [stock, setStock] = useState(params.stock ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!name.trim()) {
      Alert.alert("Nom requis", "Donnez un nom au produit.");
      return;
    }
    setSaving(true);
    try {
      const body = {
        name: name.trim(),
        description: description.trim() || undefined,
        price: Number(price) || 0,
        stock: Number(stock) || 0,
      };
      if (isEdit && params.id) {
        await productsApi.update(params.id, body);
      } else {
        await productsApi.create(body);
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
      <Text style={styles.title}>{isEdit ? "Modifier le produit" : "Nouveau produit"}</Text>
      <Field label="Nom" value={name} onChangeText={setName} placeholder="Bouquet du moment" />
      <Field
        label="Description (optionnel)"
        value={description}
        onChangeText={setDescription}
        placeholder="Composition de saison"
        multiline
        numberOfLines={3}
        style={{ height: 90, textAlignVertical: "top", paddingTop: 12 }}
      />
      <Field label="Prix (€)" value={price} onChangeText={setPrice} keyboardType="numeric" placeholder="32" />
      <Field label="Stock" value={stock} onChangeText={setStock} keyboardType="numeric" placeholder="15" />
      <Button title={isEdit ? "Enregistrer" : "Créer le produit"} onPress={save} loading={saving} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: "800", color: colors.text, marginBottom: spacing.xl, letterSpacing: -0.5 },
});
