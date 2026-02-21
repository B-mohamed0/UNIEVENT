import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ImageBackground,
  StatusBar,
  FlatList,
  Alert,
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import OrganizerNavbar from "../components/OrganizerNavbar";
import { useThemeContext } from "../context/ThemeContext";
import OrganizerBackground from "../components/OrganizerBackground";
import ThemeToggle from "../components/ThemeToggle";

const { width } = Dimensions.get("window");

export default function OrganizerEvents({ route, navigation }) {
  const { id, nom } = route.params;
  const { isDarkMode } = useThemeContext();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const themeColors = {
    text: isDarkMode ? "#FFF" : "#0A0A1A",
    subText: isDarkMode ? "rgba(255,255,255,0.7)" : "rgba(10, 10, 26, 0.7)",
    headerTitle: isDarkMode ? "#FFF" : "#143287",
    cardBorder: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
    blurTint: isDarkMode ? "dark" : "light",
  };

  const API_URL = "http://192.168.1.3:3000/api/organizer";

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch(`${API_URL}/events/${id}`);
      const data = await response.json();
      setEvents(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching events:", error);
      setLoading(false);
    }
  };

  const handleDelete = async (eventId) => {
    Alert.alert(
      "Confirmation",
      "Voulez-vous vraiment supprimer cet événement ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await fetch(`http://192.168.1.3:3000/api/events/${eventId}`, {
                method: "DELETE",
              });

              if (response.ok) {
                setEvents(events.filter(e => e.id !== eventId));
                Alert.alert("Succès", "Événement supprimé !");
              } else {
                Alert.alert("Erreur", "Erreur lors de la suppression.");
              }
            } catch (error) {
              console.error("Delete error:", error);
              Alert.alert("Erreur", "Erreur serveur.");
            }
          }
        }
      ]
    );
  };

  const renderEvent = ({ item }) => {
    const statusColor = item.event_status === "EN COURS" ? "#00F908" : (item.event_status === "À VENIR" ? "#F4F900" : "#FF0000");

    return (
      <View style={styles.eventCard}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.navigate("OrganizerEventDetails", { event: item, organizerId: id, nom })}
        >
          <BlurView intensity={30} tint={themeColors.blurTint} style={styles.cardInner}>
            <View style={styles.cardHeader}>
              <View style={styles.titleRow}>
                <View style={[styles.logoBox, { backgroundColor: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)" }]}>
                  <Ionicons name="calendar" size={18} color={themeColors.text} />
                </View>
                <Text style={[styles.eventTitle, { color: themeColors.text }]}>{item.nom_evenement}</Text>
              </View>
            </View>

            <Text style={[styles.eventInfoText, { color: themeColors.subText }]}>
              {new Date(item.date).toLocaleDateString("fr-FR", { day: 'numeric', month: 'long', year: 'numeric' })}, {item.heure_debut?.slice(0, 5)}, {item.lieu}
            </Text>

            <View style={styles.cardFooter}>
              <View style={[styles.statusBadge, { borderColor: statusColor }]}>
                <Text style={[styles.statusText, { color: statusColor }]}>{item.event_status}</Text>
              </View>
              <View style={styles.actionIcons}>
                <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate("CreateEvent", { id, nom, editEvent: item })}>
                  <Ionicons name="create-outline" size={20} color={themeColors.text} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconBtn} onPress={() => handleDelete(item.id)}>
                  <Ionicons name="trash-outline" size={20} color={themeColors.text} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate("ManageEvent", { event: item, organizerId: id, nom })}>
                  <Ionicons name="stats-chart" size={20} color={themeColors.text} />
                </TouchableOpacity>
              </View>
            </View>
          </BlurView>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <OrganizerBackground>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} translucent backgroundColor="transparent" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={themeColors.text} />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={[styles.headerTitle, { color: themeColors.headerTitle }]}>Mes Événements</Text>
        </View>
        <ThemeToggle color={themeColors.text} />
      </View>

      <FlatList
        data={events}
        renderItem={renderEvent}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !loading && <Text style={styles.emptyText}>Aucun événement créé pour le moment.</Text>
        }
      />
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
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  eventCard: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  cardInner: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  logoBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  eventTitle: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "jokeyone",
  },
  eventInfoText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    marginBottom: 20,
    fontFamily: "Insignia",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusBadge: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 15,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Insignia",
  },
  actionIcons: {
    flexDirection: "row",
    gap: 15,
  },
  iconBtn: {
    padding: 5,
  },
  emptyText: {
    color: "#FFF",
    textAlign: "center",
    marginTop: 50,
    fontFamily: "Insignia",
    fontSize: 16,
  },
});
