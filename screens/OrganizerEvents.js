import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ImageBackground,
  StatusBar,
  ScrollView,
  FlatList,
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

export default function OrganizerEvents({ route, navigation }) {
  const { id, nom } = route.params;
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

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
    if (!confirm("Voulez-vous vraiment supprimer cet événement ?")) return;

    try {
      const response = await fetch(`http://192.168.1.3:3000/api/events/${eventId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setEvents(events.filter(e => e.id !== eventId));
        alert("Événement supprimé !");
      } else {
        alert("Erreur lors de la suppression.");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Erreur serveur.");
    }
  };

  const renderEvent = ({ item }) => {
    const statusColor = item.event_status === "EN COURS" ? "#00F908" : (item.event_status === "À VENIR" ? "#F4F900" : "#FF0000");

    return (
      <TouchableOpacity
        style={styles.eventCard}
        onPress={() => navigation.navigate("ManageEvent", { event: item, organizerId: id, nom })}
      >
        <BlurView intensity={30} tint="dark" style={styles.cardInner}>
          <View style={styles.cardHeader}>
            <View style={styles.titleRow}>
              <View style={styles.logoBox}>
                <Ionicons name="calendar" size={18} color="#FFF" />
              </View>
              <Text style={styles.eventTitle}>{item.nom_evenement}</Text>
            </View>
            <TouchableOpacity style={styles.backBtnHeader} onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          <Text style={styles.eventInfoText}>
            {new Date(item.date).toLocaleDateString("fr-FR", { day: 'numeric', month: 'long', year: 'numeric' })}, {item.heure_debut?.slice(0, 5)}, {item.lieu}
          </Text>

          <View style={styles.cardFooter}>
            <View style={[styles.statusBadge, { borderColor: statusColor }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>{item.event_status}</Text>
            </View>
            <View style={styles.actionIcons}>
              <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate("CreateEvent", { id, nom, editEvent: item })}>
                <Ionicons name="create-outline" size={20} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={() => handleDelete(item.id)}>
                <Ionicons name="trash-outline" size={20} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate("OrganizerStats", { id, nom })}>
                <Ionicons name="stats-chart" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </TouchableOpacity>
    );
  };

  return (
    <ImageBackground
      source={require("../assets/project/estwh.png")}
      style={styles.container}
      resizeMode="cover"
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <View style={styles.logoCircle}>
            <Ionicons name="apps" size={16} color="#FFF" />
          </View>
          <Text style={styles.headerTitle}>Mes Événements</Text>
        </View>
        <View style={{ width: 40 }} />
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
    </ImageBackground>
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
