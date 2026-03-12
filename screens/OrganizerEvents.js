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
  ScrollView,
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import OrganizerNavbar from "../components/OrganizerNavbar";
import OrganizerBackground from "../components/OrganizerBackground";
import { API_URL } from "../config";
import { useThemeContext } from "../context/ThemeContext";
const { width } = Dimensions.get("window");

export default function OrganizerEvents({ route, navigation }) {
  const { id, nom } = route.params;
  const { isDarkMode } = useThemeContext();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("Toutes");
  const [selectedStatus, setSelectedStatus] = useState("Toutes");
  const [sortOrder, setSortOrder] = useState("desc"); // 'asc' or 'desc'

  const categories = ["Toutes", "Conférence", "Atelier", "Soirée"];
  const statuses = ["Toutes", "À venir", "En cours", "Terminé"];

  const themeColors = {
    text: isDarkMode ? "#FFF" : "#0A0A1A",
    subText: isDarkMode ? "rgba(255,255,255,0.7)" : "rgba(10, 10, 26, 0.7)",
    headerTitle: isDarkMode ? "#ffffffff" : "#143287",
    cardBorder: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0,0,0,0.05)",
    blurTint: isDarkMode ? "dark" : "light",
  };

  const API_URL_ORG = `${API_URL}/organizer`;

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch(`${API_URL_ORG}/events/${id}`);
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
              const response = await fetch(`${API_URL}/events/${eventId}`, {
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
    const statusColor = item.event_status === "En cours" ? "#00F908" : (item.event_status === "À venir" ? "#F4F900" : "#FF0000");

    return (
      <View style={styles.eventCard}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.navigate("OrganizerEventDetails", { event: item, organizerId: id, nom })}
        >

          <BlurView intensity={30} tint={themeColors.blurTint} style={[styles.cardInner, { backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.14)" : "rgba(0, 0, 0, 0.09)" }]}>
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
        <TouchableOpacity
          onPress={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          style={[styles.sortBtn, { backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0,0,0,0.05)" }]}
        >
          <Ionicons name={sortOrder === "asc" ? "arrow-up" : "arrow-down"} size={20} color={themeColors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.filterBar}>
        <Text style={[styles.filterLabel, { color: themeColors.subText }]}>Catégorie</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.filterTab,
                selectedCategory === cat && styles.filterTabActive,
                { backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.18)" : "rgba(0, 0, 0, 0.22)" }
              ]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[
                styles.filterTabText,
                { color: themeColors.text },
                selectedCategory === cat && styles.filterTabTextActive
              ]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.filterBar}>
        <Text style={[styles.filterLabel, { color: themeColors.subText }]}>Statut</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {statuses.map((stat) => (
            <TouchableOpacity
              key={stat}
              style={[
                styles.filterTab,
                selectedStatus === stat && styles.filterTabActive,
                { backgroundColor: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0, 0, 0, 0.15)" }
              ]}
              onPress={() => setSelectedStatus(stat)}
            >
              <Text style={[
                styles.filterTabText,
                { color: themeColors.text },
                selectedStatus === stat && styles.filterTabTextActive
              ]}>
                {stat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={events
          .filter(e => (selectedCategory === "Toutes" || e.categorie === selectedCategory))
          .filter(e => (selectedStatus === "Toutes" || e.event_status === selectedStatus))
          .sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
          })
        }
        renderItem={renderEvent}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !loading && <Text style={styles.emptyText}>Aucun événement trouvé.</Text>
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
  sortBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  filterBar: {
    marginBottom: 15,
  },
  filterLabel: {
    fontSize: 14,
    fontFamily: "Insignia",
    fontWeight: "600",
    marginLeft: 20,
    marginBottom: 8,
    opacity: 0.8,
  },
  filterScroll: {
    paddingHorizontal: 20,
    gap: 10,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  filterTabActive: {
    backgroundColor: "#005AC1",
    borderColor: "#005AC1",
  },
  filterTabText: {
    fontSize: 14,
    fontFamily: "Insignia",
    fontWeight: "600",
  },
  filterTabTextActive: {
    color: "#FFF",
  },
});
