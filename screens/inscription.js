import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  StatusBar,
  ScrollView,
  TextInput,
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import OrganizerBackground from "../components/OrganizerBackground";

const Inscription = ({ route, navigation }) => {
  const { eventId, studentId, nom, eventName } = route.params;

  const [participantName, setParticipantName] = useState(nom || "");
  const [filiere, setFiliere] = useState("GI");
  const [annee, setAnnee] = useState("1ere");

  const filieres = ["GI", "GM", "GP", "GE", "MDO"];
  const annees = ["1ere", "2eme", "3eme"];

  const handleSubmit = async () => {
    try {
      const response = await fetch(
        `http://192.168.1.3:3000/api/events/${eventId}/inscription`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentId,
            eventId,
            nom: participantName,
            filiere,
            annee,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          "Succès ✅",
          `Inscription réussie !`,
          [{ text: "OK", onPress: () => navigation.goBack() }]
        );
      } else {
        if (data.message !== "Vous êtes déjà inscrit à cet événement") {
          Alert.alert("Erreur ❌", data.message);
        } else {
          navigation.goBack();
        }
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Erreur ❌", "Impossible de contacter le serveur");
    }
  };

  return (
    <OrganizerBackground>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Inscription</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <BlurView intensity={30} tint="dark" style={styles.formCard}>
          <Text style={styles.eventLabel}>Événement :</Text>
          <Text style={styles.eventName}>{eventName}</Text>

          <View style={styles.section}>
            <Text style={styles.label}>Nom complet</Text>
            <TextInput
              style={styles.nameInput}
              placeholder="Votre nom..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={participantName}
              onChangeText={setParticipantName}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Votre Filière</Text>
            <View style={styles.optionsContainer}>
              {filieres.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.optionButton,
                    filiere === item && styles.optionButtonActive,
                  ]}
                  onPress={() => setFiliere(item)}
                >
                  <Text style={[
                    styles.optionText,
                    filiere === item && styles.optionTextActive
                  ]}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Année d'étude</Text>
            <View style={styles.optionsContainer}>
              {annees.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.optionButton,
                    annee === item && styles.optionButtonActive,
                  ]}
                  onPress={() => setAnnee(item)}
                >
                  <Text style={[
                    styles.optionText,
                    annee === item && styles.optionTextActive
                  ]}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
            <LinearGradient
              colors={["#005AC1", "#143287"]}
              style={styles.submitGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.submitText}>Confirmer mon inscription</Text>
            </LinearGradient>
          </TouchableOpacity>
        </BlurView>
      </ScrollView>
    </OrganizerBackground>
  );
};

export default Inscription;

const styles = StyleSheet.create({
  header: {
    paddingTop: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "700",
    fontFamily: "Insignia",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  formCard: {
    borderRadius: 30,
    padding: 25,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  eventLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    fontFamily: "Insignia",
    marginBottom: 5,
  },
  eventName: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "700",
    fontFamily: "jokeyone",
    marginBottom: 30,
  },
  section: {
    marginBottom: 25,
  },
  label: {
    color: "#FFF",
    fontSize: 18,
    fontFamily: "Insignia",
    marginBottom: 15,
  },
  optionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  optionButton: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  optionButtonActive: {
    backgroundColor: "#005AC1",
    borderColor: "#0072ff",
  },
  optionText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 16,
    fontFamily: "Insignia",
  },
  optionTextActive: {
    color: "#FFF",
    fontWeight: "700",
  },
  submitBtn: {
    marginTop: 20,
    borderRadius: 15,
    overflow: "hidden",
  },
  submitGradient: {
    paddingVertical: 15,
    alignItems: "center",
  },
  submitText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Insignia",
  },
  nameInput: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 12,
    color: "#FFF",
    fontSize: 16,
    fontFamily: "Insignia",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
});