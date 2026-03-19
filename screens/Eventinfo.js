import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Animated,
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import BackButton from "../components/BackButton";
import BottomNav from "../components/navbar";
import { useFocusEffect } from "@react-navigation/native";
import { API_URL } from "../config";
import { useThemeContext } from "../context/ThemeContext";


import conference from "../assets/project/conference.png";
import estwhite from "../assets/project/estwhite.png";
import estblack from "../assets/project/estblack.png";
import { LinearGradient } from "expo-linear-gradient";

const THEME_GRADIENTS = {
  "Dusk": ["#FF512F", "#DD2476"],
  "Ocean": ["#2193b0", "#6dd5ed"],
  "Emerald": ["#11998e", "#38ef7d"],
  "Purple Heat": ["#833ab4", "#fd1d1d", "#fcb045"],
  "Midnight": ["#232526", "#414345"],
  "Royal Blue": ["#1e3c72", "#2a5298"],
  "Sunset": ["#ee0979", "#ff6a00"],
  "Lavender": ["#DA22FF", "#9733EE"],
  "Azure": ["#00c6ff", "#0072ff"],
  "Golden Hour": ["#F2994A", "#F2C94C"],
  "default": ["#000000ff", "#434343ff"]
};

// Point pulsant style LIVE (Instagram/Facebook)
const PulsingDot = () => {
  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseScale, { toValue: 2.5, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseOpacity, { toValue: 0, duration: 1000, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(pulseScale, { toValue: 1, duration: 0, useNativeDriver: true }),
          Animated.timing(pulseOpacity, { toValue: 0.6, duration: 0, useNativeDriver: true }),
        ]),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <View style={{ width: 20, height: 20, justifyContent: "center", alignItems: "center", marginRight: 10 }}>
      <Animated.View
        style={{
          position: "absolute",
          width: 20,
          height: 20,
          borderRadius: 10,
          backgroundColor: "#00F908",
          opacity: pulseOpacity,
          transform: [{ scale: pulseScale }],
        }}
      />
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#00F908" }} />
    </View>
  );
};

const EventInfo = ({ route, navigation }) => {
  const { eventId, studentId, nom } = route.params;
  const { isDarkMode } = useThemeContext();

  const theme = {
    background: isDarkMode ? "#414141ff" : "#F1F5F9",
    card: isDarkMode ? "rgba(162, 162, 162, 0.12)" : "rgba(56, 57, 57, 0.14)",
    text: isDarkMode ? "#ffffffff" : "#0F172A",
    textSecondary: isDarkMode ? "#94A3B8" : "#64748B",
  };

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);


  useFocusEffect(
    React.useCallback(() => {
      fetch(`${API_URL}/events/detail/${eventId}/${studentId}`)
        .then((res) => res.json())
        .then((data) => {
          setEvent(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }, [eventId, studentId])
  );
  const handleUnregister = async () => {
    try {
      const response = await fetch(`${API_URL}/events/unregister/${event.participation_id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (response.ok) {
        // Rafraîchir les données de l'événement
        const res = await fetch(`${API_URL}/events/detail/${eventId}/${studentId}`);
        const updatedData = await res.json();
        setEvent(updatedData);
      } else {
        alert(data.message || "Erreur lors de la désinscription");
      }
    } catch (error) {
      console.error("Error unregistering:", error);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.center}>
        <Text>Événement introuvable</Text>
      </View>
    );
  }

  const statusColor =
    event.status === "à venir"
      ? "#F4F900"
      : event.status === "en cours"
        ? "#00F908"
        : "#f9f9f9ff";

  return (
    <View style={styles.container}>
      <ImageBackground
        source={conference}
        style={styles.header}
        imageStyle={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}
      >
        <LinearGradient
          colors={["rgba(0,0,0,0.6)", "rgba(0,0,0,0.2)"]}
          style={StyleSheet.absoluteFill}
        />
        <BackButton />

        <View style={styles.headerContent}>
          <View>
            <Text style={styles.title}>{event.nom_evenement}</Text>

            <BlurView intensity={8} tint="light" style={styles.glassWrapper}>
              {event.participation_status === "INSCRIT" ? (
                <TouchableOpacity
                  style={[styles.glassButton, { borderColor: "#FF3B30", width: 140 }]}
                  onPress={handleUnregister}
                >
                  <Text style={[styles.glassText, { color: "#ff3939ff", fontSize: 13 }]}>Se désinscrire</Text>
                </TouchableOpacity>
              ) : event.participation_status === "PRESENT" ? (
                <View style={[styles.glassButton, { borderColor: "#00F908" }]}>
                  <Ionicons name="checkmark-circle" size={24} color="#00F908" />
                </View>
              ) : event.event_status !== "Terminé" ? (
                <TouchableOpacity
                  style={styles.glassButton}
                  onPress={() =>
                    navigation.navigate("inscription", {
                      eventId: eventId,
                      studentId: studentId,
                      nom: nom,
                      eventName: event.nom_evenement
                    })
                  }
                >
                  <Text style={styles.glassText}>S’inscrire</Text>
                </TouchableOpacity>
              ) : null}
            </BlurView>
          </View>

          <View style={styles.statusContainer}>
            {event.event_status === "En cours" ? (
              <PulsingDot />
            ) : (
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor:
                      event.event_status === "À venir"
                        ? "#f9dc00ff"
                        : "#FF0000",
                  },
                ]}
              />
            )}
            <Text style={styles.statusText}>
              {event.event_status}
            </Text>
          </View>
        </View>
      </ImageBackground >

      {/* BACKGROUND ESTWH FIXE */}
      <ImageBackground
        source={isDarkMode ? estblack : estwhite} // Use a dark version if you have one, or just background color
        style={[styles.estBackground, { backgroundColor: theme.background }]}
        imageStyle={[styles.estImage]}
      >
        {/* SEULE PARTIE SCROLLABLE */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* DESCRIPTION */}
          <BlurView intensity={20} tint={isDarkMode ? "dark" : "light"} style={[styles.card, { backgroundColor: theme.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Description</Text>
            <Text style={{ color: theme.text }}>{event.description}</Text>
          </BlurView>

          {/* INFORMATIONS */}
          <BlurView intensity={20} tint={isDarkMode ? "dark" : "light"} style={[styles.card, { backgroundColor: theme.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Informations</Text>

            <View style={styles.row}>
              <Ionicons name="calendar-outline" size={25} color={theme.text} />
              <Text style={[styles.infoText, { color: theme.text }]}>
                {new Date(event.date).toLocaleDateString()}
              </Text>
            </View>

            <View style={styles.row}>
              <Ionicons name="time-outline" size={25} color={theme.text} />
              <Text style={[styles.infoText, { color: theme.text }]}>
                {event.heure_debut?.slice(0, 5)} - {event.heure_fin?.slice(0, 5)}
              </Text>
            </View>

            <View style={styles.row}>
              <Ionicons name="location-outline" size={25} color={theme.text} />
              <Text style={[styles.infoText, { color: theme.text }]}>{event.lieu}</Text>
            </View>
          </BlurView>

          {/* ORGANISATION */}
          <BlurView intensity={20} tint={isDarkMode ? "dark" : "light"} style={[styles.card, { backgroundColor: theme.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Organisation</Text>
            <View style={styles.inforga}>
              <Text style={{ color: theme.text }}><Text style={{ fontWeight: 'bold' }}>Organisateur :</Text> {event.organisateur_nom}</Text>
              <Text style={{ color: theme.text }}><Text style={{ fontWeight: 'bold' }}>Animateur :</Text> {event.nom_animateur}</Text>
              <Text style={{ color: theme.text }}><Text style={{ fontWeight: 'bold' }}>Catégorie :</Text> {event.categorie}</Text>
            </View>
          </BlurView>

          <View style={{ height: 120 }} />
        </ScrollView >
      </ImageBackground >

      {/* NAVBAR FIXE */}
      < BottomNav id={studentId} nom={nom} />
    </View >
  );
};

export default EventInfo;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  header: {
    height: 300,
    padding: 20,
    justifyContent: "flex-end",
  },

  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    margin: 20,
    marginBottom: 60,
  },

  title: {
    color: "white",
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 20,
    fontFamily: "Insignia",
  },

  glassWrapper: {
    marginTop: 10,
    width: 140,
    borderRadius: 25,
    overflow: "hidden",
  },

  glassButton: {
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(176, 176, 176, 0.17)",
    shadowColor: "#ffffffff",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },

  glassText: {
    color: "white",
    fontSize: 16,
    fontFamily: "Insignia",
  },

  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: -100,
    marginBottom: 8,
  },

  statusDot: {
    width: 20,
    height: 20,
    borderRadius: 50,
    marginRight: 10,
  },

  statusText: {
    color: "white",
    fontSize: 20,
    fontFamily: "Insignia",
  },

  estBackground: {
    flex: 1,
    marginTop: -45,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    overflow: "hidden",
  },

  estImage: {
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
  },

  scrollContent: {
    paddingTop: 20,
  },

  card: {
    backgroundColor: "rgba(108, 149, 182, 0.26)",
    shadowColor: "#000000ff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 30,
    elevation: 6,
    overflow: "hidden",
  },


  sectionTitle: {
    fontSize: 20,
    marginBottom: 10,
    fontFamily: "jokeyone",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  inforga: {
    marginTop: 10,
    gap: 10,
  },

  infoText: {
    marginLeft: 10,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
