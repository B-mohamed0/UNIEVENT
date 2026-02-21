import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ImageBackground,
  StatusBar,
  Dimensions,
  Platform,
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import DateTimePicker from "@react-native-community/datetimepicker";
import OrganizerNavbar from "../components/OrganizerNavbar";
import { useThemeContext } from "../context/ThemeContext";
import OrganizerBackground from "../components/OrganizerBackground";
import ThemeToggle from "../components/ThemeToggle";

const { width } = Dimensions.get("window");

export default function CreateEvent({ route, navigation }) {
  const { id, nom, editEvent } = route.params;
  const { isDarkMode } = useThemeContext();

  const themeColors = {
    text: isDarkMode ? "#FFF" : "#0A0A1A",
    subText: isDarkMode ? "rgba(255,255,255,0.7)" : "rgba(10, 10, 26, 0.7)",
    headerTitle: isDarkMode ? "#FFF" : "#143287",
    blurTint: isDarkMode ? "dark" : "light",
    cardBorder: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
    inputBg: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.03)",
    placeholder: isDarkMode ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)",
  };

  const [form, setForm] = useState({
    title: editEvent?.nom_evenement || "",
    description: editEvent?.description || "",
    dateDebut: editEvent ? new Date(editEvent.date) : new Date(),
    dateFin: editEvent ? new Date(editEvent.date_fin || editEvent.date) : new Date(),
    heureDebut: editEvent ? new Date(`2000-01-01T${editEvent.heure_debut}:00`) : new Date(),
    heureFin: editEvent ? new Date(`2000-01-01T${editEvent.heure_fin}:00`) : new Date(),
    lieu: editEvent?.lieu || "",
    categorie: editEvent?.categorie || "Conférence",
    capaciteMax: editEvent?.capacite_max?.toString() || "100",
    animator: editEvent?.nom_animateur || nom,
  });

  const [showDatePicker, setShowDatePicker] = useState(null); // 'debut', 'fin', 'hDebut', 'hFin'

  const categories = ["Conférence", "Atelier", "Soirée"];

  const API_URL = "http://192.168.1.3:3000/api/events";

  const handleCreate = async () => {
    // Validation simple
    if (!form.title || !form.lieu) {
      alert("Veuillez remplir au moins le titre et le lieu.");
      return;
    }

    try {
      const formatDate = (date) => {
        const d = new Date(date);
        return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
      };

      const payload = {
        nom_evenement: form.title,
        nom_animateur: form.animator,
        description: form.description,
        lieu: form.lieu,
        date: formatDate(form.dateDebut),
        date_fin: formatDate(form.dateFin),
        heure_debut: form.heureDebut.toTimeString().split(" ")[0].slice(0, 5),
        heure_fin: form.heureFin.toTimeString().split(" ")[0].slice(0, 5),
        categorie: form.categorie,
        capacite_max: parseInt(form.capaciteMax) || 0,
        idorganisateur: parseInt(id),
      };

      const url = editEvent ? `http://192.168.1.3:3000/api/events/${editEvent.id}` : API_URL;
      const method = editEvent ? "PUT" : "POST";

      console.log("SENDING PAYLOAD:", payload);

      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert(editEvent ? "Événement mis à jour !" : "Événement créé avec succès !");
        navigation.navigate("OrganizerDashboard", { id, nom });
      } else {
        const errorData = await response.json();
        alert(`Erreur: ${errorData.error || "Problème serveur"}`);
      }
    } catch (error) {
      console.error("Error creating event:", error);
      alert("Erreur de connexion au serveur.");
    }
  };

  const formatTime = (date) => {
    if (!date || isNaN(date.getTime())) return "--:--";
    return date.toTimeString().split(" ")[0].slice(0, 5);
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(null);
    if (selectedDate) {
      if (showDatePicker === 'debut') setForm({ ...form, dateDebut: selectedDate });
      if (showDatePicker === 'fin') setForm({ ...form, dateFin: selectedDate });
      if (showDatePicker === 'hDebut') setForm({ ...form, heureDebut: selectedDate });
      if (showDatePicker === 'hFin') setForm({ ...form, heureFin: selectedDate });
    }
  };

  return (
    <OrganizerBackground>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} translucent backgroundColor="transparent" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={themeColors.text} />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={[styles.headerTitle, { color: themeColors.headerTitle }]}>{editEvent ? "Modifier" : "Créer"} Événement</Text>
        </View>
        <ThemeToggle color={themeColors.text} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <BlurView intensity={30} tint={themeColors.blurTint} style={[styles.formCard, { borderColor: themeColors.cardBorder }]}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: themeColors.text }]}>Titre de l'événement</Text>
            <TextInput
              style={[styles.input, { color: themeColors.text, borderBottomColor: themeColors.placeholder }]}
              placeholder="Titre..."
              placeholderTextColor={themeColors.placeholder}
              value={form.title}
              onChangeText={(text) => setForm({ ...form, title: text })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: themeColors.text }]}>Description</Text>
            <TextInput
              style={[styles.input, { height: 80, color: themeColors.text, borderBottomColor: themeColors.placeholder }]}
              placeholder="Décrivez votre événement..."
              placeholderTextColor={themeColors.placeholder}
              multiline
              value={form.description}
              onChangeText={(text) => setForm({ ...form, description: text })}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
              <Text style={[styles.label, { color: themeColors.text }]}>Date de début</Text>
              <TouchableOpacity style={[styles.datePickerBtn, { backgroundColor: themeColors.inputBg }]} onPress={() => setShowDatePicker('debut')}>
                <Ionicons name="calendar-outline" size={20} color={themeColors.text} />
                <Text style={[styles.dateText, { color: themeColors.text }]}>{form.dateDebut.toLocaleDateString()}</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: themeColors.text }]}>Date de fin</Text>
              <TouchableOpacity style={[styles.datePickerBtn, { backgroundColor: themeColors.inputBg }]} onPress={() => setShowDatePicker('fin')}>
                <Ionicons name="calendar-outline" size={20} color={themeColors.text} />
                <Text style={[styles.dateText, { color: themeColors.text }]}>{form.dateFin.toLocaleDateString()}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
              <Text style={[styles.label, { color: themeColors.text }]}>Heure</Text>
              <TouchableOpacity style={[styles.datePickerBtn, { backgroundColor: themeColors.inputBg }]} onPress={() => setShowDatePicker('hDebut')}>
                <Ionicons name="time-outline" size={20} color={themeColors.text} />
                <Text style={[styles.dateText, { color: themeColors.text }]}>{formatTime(form.heureDebut)}</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.inputGroup, { flex: 1, justifyContent: 'flex-end' }]}>
              <TouchableOpacity style={[styles.datePickerBtn, { backgroundColor: themeColors.inputBg }]} onPress={() => setShowDatePicker('hFin')}>
                <Ionicons name="time-outline" size={20} color={themeColors.text} />
                <Text style={[styles.dateText, { color: themeColors.text }]}>{formatTime(form.heureFin)}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: themeColors.text }]}>Lieu</Text>
            <View style={[styles.inputWithIcon, { borderBottomColor: themeColors.placeholder }]}>
              <TextInput
                style={[styles.input, { flex: 1, borderBottomWidth: 0, paddingLeft: 0, color: themeColors.text }]}
                placeholder="Site, Salle..."
                placeholderTextColor={themeColors.placeholder}
                value={form.lieu}
                onChangeText={(text) => setForm({ ...form, lieu: text })}
              />
              <Ionicons name="location-outline" size={20} color={themeColors.text} />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: themeColors.text }]}>Catégories</Text>
            <View style={styles.categoryTabs}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catTab, { backgroundColor: themeColors.inputBg }, form.categorie === cat && styles.catTabActive]}
                  onPress={() => setForm({ ...form, categorie: cat })}
                >
                  <Text style={[styles.catTabText, { color: themeColors.text }, form.categorie === cat && styles.catTabTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: themeColors.text }]}>Capacité max</Text>
            <View style={[styles.capacityRow, { backgroundColor: themeColors.inputBg }]}>
              <Ionicons name="people-outline" size={20} color={themeColors.text} />
              <TextInput
                style={[styles.input, { flex: 1, textAlign: 'center', borderBottomWidth: 0, color: themeColors.text }]}
                keyboardType="numeric"
                value={form.capaciteMax}
                onChangeText={(text) => setForm({ ...form, capaciteMax: text })}
              />
            </View>
          </View>

          <TouchableOpacity style={styles.publishBtn} onPress={handleCreate}>
            <LinearGradient
              colors={["#005AC1", "#143287"]}
              style={styles.publishGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.publishText}>{editEvent ? "Mettre à jour" : "Publier"} l'événement</Text>
            </LinearGradient>
          </TouchableOpacity>
        </BlurView>
      </ScrollView>

      {showDatePicker && (
        <DateTimePicker
          value={
            showDatePicker === 'debut' ? form.dateDebut :
              showDatePicker === 'fin' ? form.dateFin :
                showDatePicker === 'hDebut' ? form.heureDebut : form.heureFin
          }
          mode={showDatePicker.startsWith('h') ? 'time' : 'date'}
          is24Hour={true}
          display="default"
          onChange={onDateChange}
        />
      )}
      <OrganizerNavbar id={id} nom={nom} />
    </OrganizerBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A1A",
  },
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
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#2E5BFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  headerTitle: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "600",
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
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: "#FFF",
    fontSize: 16,
    marginBottom: 10,
    fontFamily: "Insignia",
  },
  input: {
    color: "#FFF",
    fontSize: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.3)",
    paddingVertical: 8,
    fontFamily: "Insignia",
  },
  row: {
    flexDirection: "row",
    marginBottom: 10,
  },
  datePickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    padding: 10,
    borderRadius: 10,
    gap: 8,
  },
  dateText: {
    color: "#FFF",
    fontSize: 14,
    fontFamily: "jokeyone",
  },
  inputWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.3)",
  },
  categoryTabs: {
    flexDirection: "row",
    gap: 10,
  },
  catTab: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  catTabActive: {
    backgroundColor: "#005AC1",
  },
  catTabText: {
    color: "#FFF",
    fontSize: 14,
    fontFamily: "Insignia",
  },
  catTabTextActive: {
    fontWeight: "700",
  },
  capacityRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 15,
    borderRadius: 10,
    gap: 10,
  },
  publishBtn: {
    marginTop: 30,
    borderRadius: 15,
    overflow: "hidden",
  },
  publishGradient: {
    paddingVertical: 15,
    alignItems: "center",
  },
  publishText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Insignia",
  },
});
