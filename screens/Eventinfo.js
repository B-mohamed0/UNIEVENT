import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import BackButton from "../components/BackButton";
import BottomNav from "../components/navbar";
import conference from "../assets/project/conference.png";
import estwhite from "../assets/project/estwhite.png";

const EventInfo = ({ route }) => {
  const { eventId, studentId } = route.params;

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://192.168.1.15:3000/api/events/detail/${eventId}/${studentId}`)
      .then((res) => res.json())
      .then((data) => {
        setEvent(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

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
      {/* HEADER FIXE */}
      <ImageBackground source={conference} style={styles.header}>
        <BackButton />

        <View style={styles.headerContent}>
          <View>
            <Text style={styles.title}>{event.nom_evenement}</Text>

            <BlurView intensity={8} tint="light" style={styles.glassWrapper}>
              <TouchableOpacity style={styles.glassButton}>
                <Text style={styles.glassText}>S’inscrire</Text>
              </TouchableOpacity>
            </BlurView>
          </View>

          <View style={styles.statusContainer}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor:
                    event.status === "à venir"
                      ? "#F4F900"
                      : event.status === "en cours"
                        ? "#00F908"
                        : "#36f900ff",
                },
              ]}
            />
            <Text style={styles.statusText}>
              {event.status === "terminé"
                ? "Terminé"
                : event.status === "en cours"
                  ? "En cours"
                  : "À venir"}
            </Text>
          </View>
        </View>
      </ImageBackground>

      {/* BACKGROUND ESTWH FIXE */}
      <ImageBackground
        source={estwhite}
        style={styles.estBackground}
        imageStyle={styles.estImage}
      >
        {/* SEULE PARTIE SCROLLABLE */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* DESCRIPTION */}
          <BlurView intensity={20} tint="light" style={styles.card}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text>{event.description}</Text>
          </BlurView>

          {/* INFORMATIONS */}
          <BlurView intensity={20} tint="light" style={styles.card}>
            <Text style={styles.sectionTitle}>Informations</Text>

            <View style={styles.row}>
              <Ionicons name="calendar-outline" size={25} />
              <Text style={styles.infoText}>
                {new Date(event.date).toLocaleDateString()}
              </Text>
            </View>

            <View style={styles.row}>
              <Ionicons name="time-outline" size={25} />
              <Text style={styles.infoText}>
                {event.heure_debut} - {event.heure_fin}
              </Text>
            </View>

            <View style={styles.row}>
              <Ionicons name="location-outline" size={25} />
              <Text style={styles.infoText}>{event.lieu}</Text>
            </View>
          </BlurView>

          {/* ORGANISATION */}
          <BlurView intensity={20} tint="light" style={styles.card}>
            <Text style={styles.sectionTitle}>Organisation</Text>
            <View style={styles.inforga}>
            <Text>Organisateur : {event.organisateur_nom}</Text>
            <Text>Animateur : {event.nom_animateur}</Text>
            <Text>Catégorie : {event.categorie}</Text>
            </View>
          </BlurView>

          <View style={{ height: 120 }} />
        </ScrollView>
      </ImageBackground>

      {/* NAVBAR FIXE */}
      <BottomNav />
    </View>
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
    marginBottom: 50,
  },

  title: {
    color: "white",
    fontSize: 40,
    fontWeight: "bold",
    marginBottom: 20,
    fontFamily: "Insignia",
  },

  glassWrapper: {
    marginTop: 10,
    width: 130,
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
    marginRight: 20,
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
