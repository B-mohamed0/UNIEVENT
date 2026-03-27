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
  ImageBackground,
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import OrganizerBackground from "../components/OrganizerBackground";
import { API_URL } from "../config";
import { useThemeContext } from "../context/ThemeContext";
import estwh from "../assets/project/estwh.png";
import estblack from "../assets/project/estblack.png";

const Inscription = ({ route, navigation }) => {
  const { eventId, profId: studentId, nom, eventName } = route.params;
  const { isDarkMode } = useThemeContext();

  const theme = {
    background: isDarkMode ? "#0f172aff" : "#F1F5F9",
    text: isDarkMode ? "#F8FAFC" : "#FFF",
    textSecondary: isDarkMode ? "#94A3B8" : "rgba(255,255,255,0.6)",
    card: isDarkMode ? "rgba(30, 41, 59, 0.7)" : "rgba(0, 0, 0, 0.3)",
    inputBg: isDarkMode ? "rgba(255, 255, 255, 0.05)" : "rgba(255,255,255,0.1)",
    border: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(255,255,255,0.05)",
  };

  const [participantName, setParticipantName] = useState(nom || "");
  const [filiere, setFiliere] = useState("GI");
  const [annee, setAnnee] = useState("1ere");

  const filieres = ["GI", "GM", "GP", "GE", "MDO"];
  const annees = ["1ere", "2eme", "3eme"];

  const handleSubmit = async () => {
    try {
      const response = await fetch(
        `${API_URL}/prof/events/${eventId}/inscription`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            profId: studentId,
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
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "light-content"} translucent backgroundColor="transparent" />
      <ImageBackground
        source={isDarkMode ? estblack : estwh}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      />
      {!isDarkMode && <View style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(0, 0, 0, 0.3)" }]} />}

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Inscription</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <BlurView intensity={30} tint={isDarkMode ? "dark" : "dark"} style={[styles.formCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.eventLabel, { color: theme.textSecondary }]}>Événement :</Text>
          <Text style={[styles.eventName, { color: theme.text }]}>{eventName}</Text>

          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.text }]}>Nom complet</Text>
            <TextInput
              style={[styles.nameInput, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
              placeholder="Votre nom..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={participantName}
              onChangeText={setParticipantName}
            />
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.text }]}>Votre Département</Text>
            <View style={styles.optionsContainer}>
              {filieres.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.optionButton,
                    { backgroundColor: theme.inputBg, borderColor: theme.border },
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
            <Text style={[styles.label, { color: theme.text }]}>Grade / Titre</Text>
            <View style={styles.optionsContainer}>
              {annees.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.optionButton,
                    { backgroundColor: theme.inputBg, borderColor: theme.border },
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
    </View>
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