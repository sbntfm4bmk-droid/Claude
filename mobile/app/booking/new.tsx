import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Location from "expo-location";
import { bookingsApi } from "../../src/api";
import { Button, Field } from "../../src/components/ui";
import { colors } from "../../src/theme/colors";

export default function NewBookingScreen() {
  const { providerId } = useLocalSearchParams<{ providerId: string }>();
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    if (!providerId) return;
    if (!description.trim()) {
      Alert.alert("Description requise", "Décrivez le service dont vous avez besoin.");
      return;
    }
    setLoading(true);
    try {
      // Attach current coordinates if available, to help the provider locate the job.
      let coords: { latitude: number; longitude: number } | undefined;
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === "granted") {
          const pos = await Location.getCurrentPositionAsync({});
          coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        }
      } catch {
        // optional
      }

      await bookingsApi.create({
        providerId,
        description: description.trim(),
        address: address.trim() || undefined,
        latitude: coords?.latitude,
        longitude: coords?.longitude,
      });
      Alert.alert("Demande envoyée", "Le prestataire va recevoir votre demande.", [
        { text: "OK", onPress: () => router.replace("/(tabs)/bookings") },
      ]);
    } catch (e) {
      Alert.alert("Erreur", e instanceof Error ? e.message : "Impossible d'envoyer la demande");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.title}>Décrivez votre besoin</Text>
      <Field
        label="Description du service"
        value={description}
        onChangeText={setDescription}
        placeholder="Ex : fuite sous l'évier de la cuisine à réparer"
        multiline
        numberOfLines={4}
        style={styles.textarea}
      />
      <Field
        label="Adresse (optionnel)"
        value={address}
        onChangeText={setAddress}
        placeholder="12 rue de la Paix, Paris"
      />
      <Button title="Envoyer la demande" onPress={onSubmit} loading={loading} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: "800", color: colors.text, marginBottom: 20 },
  textarea: {
    height: 110,
    textAlignVertical: "top",
    paddingTop: 12,
  },
});
