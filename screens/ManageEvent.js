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
import { useThemeContext } from "../context/ThemeContext";
import OrganizerBackground from "../components/OrganizerBackground";
import ThemeToggle from "../components/ThemeToggle";

const { width } = Dimensions.get("window");

export default function ManageEvent({ route, navigation }) {
  const { event, organizerId, nom } = route.params;
  const { isDarkMode } = useThemeContext();
  const [data, setData] = useState({ event: event, participants: [] });
  const [stats, setStats] = useState({
    totalInscrit: 0,
    totalPresent: 0,
    tauxPresence: "0%"
  });
  const [loading, setLoading] = useState(true);

  const themeColors = {
    text: isDarkMode ? "#FFF" : "#0A0A1A",
    subText: isDarkMode ? "rgba(255,255,255,0.6)" : "rgba(10, 10, 26, 0.6)",
    headerTitle: isDarkMode ? "#FFF" : "#143287",
    blurTint: isDarkMode ? "dark" : "light",
    cardBorder: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
  };

  const API_URL = "http://192.168.1.3:3000/api/organizer";
  const STATS_URL = "http://192.168.1.3:3000/api/events/stats";

  useEffect(() => {
    fetchEventDetails();
    fetchEventStats();
  }, []);

  const fetchEventDetails = async () => {
    try {
      const response = await fetch(`${API_URL}/manage/${event.id}`);
      const resData = await response.json();
      setData(resData);
    } catch (error) {
      console.error("Error fetching event details:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEventStats = async () => {
    try {
      const response = await fetch(`${STATS_URL}/${event.id}`);
      const resStats = await response.json();
      if (response.ok) {
        setStats(resStats);
      }
    } catch (error) {
      console.error("Error fetching event stats:", error);
    }
  };

  const rendersStatCard = (label, value, subLabel) => (
    <BlurView intensity={30} tint={themeColors.blurTint} style={[styles.statCard, { borderColor: themeColors.cardBorder }]}>
      <Text style={[styles.statLabel, { color: themeColors.subText }]}>{label}</Text>
      <Text style={[styles.statValue, { color: themeColors.text }]}>{value}</Text>
      {subLabel && <Text style={[styles.statSubLabel, { color: themeColors.subText }]}>{subLabel}</Text>}
    </BlurView>
  );

  const renderParticipant = ({ item }) => (
    <BlurView intensity={20} tint={themeColors.blurTint} style={[styles.participantRow, { borderColor: themeColors.cardBorder }]}>
      <View style={styles.participantInfo}>
        <View style={[styles.avatar, { backgroundColor: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)" }]}>
          <Ionicons name="person" size={20} color={themeColors.text} />
        </View>
        <Text style={[styles.participantName, { color: themeColors.text }]}>{item.nom}</Text>
      </View>
      <View style={[styles.presenceBadge, { backgroundColor: item.status === 'PRESENT' ? '#00A86B' : '#C41E3A' }]}>
        <Text style={styles.presenceText}>{item.status === 'PRESENT' ? 'Présent' : 'Absent'}</Text>
      </View>
    </BlurView>
  );



  return (
    <OrganizerBackground>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} translucent backgroundColor="transparent" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={themeColors.text} />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={[styles.headerTitle, { color: themeColors.headerTitle }]}>{event.nom_evenement}</Text>
          <Text style={[styles.headerSubTitle, { color: themeColors.subText }]}>Aujourd'hui, {new Date(event.date).toLocaleDateString()}</Text>
        </View>
        <ThemeToggle color={themeColors.text} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.statsRow}>
          {rendersStatCard("Inscrit", stats.totalInscrit)}
          {rendersStatCard("Presents", stats.totalPresent)}
          {rendersStatCard("Taux présent", stats.tauxPresence)}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Participants</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>Voir-tous</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={data.participants}
          renderItem={renderParticipant}
          keyExtractor={(item) => item.id.toString()}
          scrollEnabled={false}
          ListEmptyComponent={
            !loading && <Text style={styles.emptyText}>Aucun participant pour le moment.</Text>
          }
        />

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionBtn}>
            <BlurView intensity={30} tint={themeColors.blurTint} style={[styles.actionBtnInner, { borderColor: themeColors.cardBorder }]}>
              <Text style={[styles.actionBtnText, { color: themeColors.text }]}>Exporter liste CSV</Text>
              <Ionicons name="chevron-forward" size={18} color={themeColors.text} />
            </BlurView>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn}>
            <BlurView intensity={30} tint={themeColors.blurTint} style={[styles.actionBtnInner, { borderColor: themeColors.cardBorder }]}>
              <Text style={[styles.actionBtnText, { color: themeColors.text }]}>Envoyer rappel</Text>
              <Ionicons name="chevron-forward" size={18} color={themeColors.text} />
            </BlurView>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    alignItems: "center",
  },
  headerTitle: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "jokeyone",
  },
  headerSubTitle: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    fontFamily: "Insignia",
  },
  profileBtn: {
    padding: 5,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 20,
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 15,
    padding: 15,
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  statLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    fontFamily: "Insignia",
    marginBottom: 5,
  },
  statValue: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "700",
    fontFamily: "jokeyone",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 15,
  },
  sectionTitle: {
    color: "#FFF",
    fontSize: 18,
    fontFamily: "Insignia",
  },
  seeAllText: {
    color: "#2E5BFF",
    fontSize: 14,
    fontFamily: "Insignia",
  },
  participantRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    overflow: "hidden",
  },
  participantInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  participantName: {
    color: "#FFF",
    fontSize: 16,
    fontFamily: "Insignia",
  },
  presenceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  presenceText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Insignia",
  },
  actionButtons: {
    marginTop: 20,
    gap: 10,
  },
  actionBtn: {
    borderRadius: 12,
    overflow: "hidden",
  },
  actionBtnInner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
  },
  actionBtnText: {
    color: "#FFF",
    fontSize: 16,
    fontFamily: "Insignia",
  },
  emptyText: {
    color: "rgba(255,255,255,0.4)",
    textAlign: "center",
    marginVertical: 20,
    fontFamily: "Insignia",
  },
});
