import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ImageBackground,
  Image,
  StatusBar,
  ScrollView,
  FlatList,
  Animated,
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import OrganizerNavbar from "../components/OrganizerNavbar";
import OrganizerBackground from "../components/OrganizerBackground";
import { API_URL } from "../config";

const { width } = Dimensions.get("window");

export default function OrganizerDashboard({ route, navigation }) {
  const { id, nom: initialNom } = route.params;
  const [nom, setNom] = useState(initialNom);
  const [photo, setPhoto] = useState(null);
  const [stats, setStats] = useState({
    activeEvents: 0,
    totalRegistrations: 0,
    totalAttendances: 0,
    avgAttendance: 0,
  });
  const isDarkMode = false;
  const [weekEvents, setWeekEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fadeAnim = useRef(new Animated.Value(isDarkMode ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: isDarkMode ? 1 : 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [isDarkMode]);

  const themeColors = {
    text: isDarkMode ? "#FFF" : "#0A0A1A",
    subText: isDarkMode ? "rgba(255, 255, 255, 0.6)" : "rgba(10, 10, 26, 0.6)",
    cardBg: isDarkMode ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)",
    blurTint: isDarkMode ? "light" : "dark",
    headerTitle: isDarkMode ? "#FFF" : "#143287",
    headerFade: isDarkMode ? ["#0A0A1A", "rgba(10, 10, 26, 0.9)", "rgba(10, 10, 26, 0)"] : ["#FFFFFF", "rgba(255, 255, 255, 0.9)", "rgba(255, 255, 255, 0)"],
  };

  const API_URL_ORG = `${API_URL}/organizer`;

  useEffect(() => {
    fetchStats();
    fetchWeekEvents();
    fetchProfile();
  }, []);

  // Rafraîchir si on revient de la page profil avec de nouveaux paramètres
  useEffect(() => {
    if (route.params?.nom) setNom(route.params.nom);
    if (route.params?.photo) setPhoto(route.params.photo);
  }, [route.params?.refresh]);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`${API_URL_ORG}/profile/${id}`);
      const data = await response.json();
      if (response.ok) {
        setNom(data.nom);
        setPhoto(data.photo);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL_ORG}/stats/${id}`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchWeekEvents = async () => {
    try {
      const response = await fetch(`${API_URL_ORG}/events-week/${id}`);
      const data = await response.json();
      setWeekEvents(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching week events:", error);
      setLoading(false);
    }
  };

  return (
    <OrganizerBackground>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} translucent backgroundColor="transparent" />

      <LinearGradient
        colors={themeColors.headerFade}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <View style={styles.titleContainer}>
              <Text style={[styles.headerTitle, { color: themeColors.headerTitle }]}>Bonjour</Text>
              <Text style={[styles.headerSubTitle, { color: themeColors.text }]}>{nom}</Text>
            </View>
          </View>
          <BlurView intensity={30} tint={isDarkMode ? "dark" : "light"} style={styles.glassActionBar}>
            <TouchableOpacity
              style={[styles.profileButton, { borderColor: isDarkMode ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)" }]}
              onPress={() => navigation.navigate("OrganizerProfile", { id })}
            >
              <View style={[styles.avatarPlaceholder, { backgroundColor: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)" }]}>
                {photo ? (
                  <Image source={{ uri: photo }} style={styles.avatarImage} />
                ) : (
                  <Ionicons name="person" size={16} color={themeColors.text} />
                )}
              </View>
            </TouchableOpacity>

            <View style={styles.actionBarDivider} />

            <View style={styles.actionIcon}>
              <Ionicons name="sunny-outline" size={20} color={themeColors.text} />
            </View>

            <View style={styles.actionBarDivider} />

            <TouchableOpacity style={styles.actionIcon}>
              <View style={styles.notificationCircle}>
                <Ionicons name="notifications-outline" size={20} color={themeColors.text} />
                <View style={styles.notificationBadge} />
              </View>
            </TouchableOpacity>
          </BlurView>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Statistics 2x2 Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <BlurView intensity={10} tint={themeColors.blurTint} style={styles.statCard}>
              <LinearGradient colors={isDarkMode ? ["rgba(255, 255, 255, 0)", "rgba(255,255,255,0.05)"] : ["rgba(255, 255, 255, 0)", "rgba(255, 255, 255, 0)"]} style={styles.cardGradient}>
                <Ionicons name="flash-outline" size={24} color={themeColors.text} />
                <Text style={[styles.statValue, { color: themeColors.text }]}>{stats.activeEvents}</Text>
                <Text style={[styles.statLabel, { color: themeColors.subText }]}>Événements actifs</Text>
              </LinearGradient>
            </BlurView>

            <BlurView intensity={10} tint={themeColors.blurTint} style={styles.statCard}>
              <LinearGradient colors={isDarkMode ? ["rgba(255,255,255,0.1)", "rgba(255,255,255,0.05)"] : ["rgba(0,0,0,0.05)", "rgba(0,0,0,0.02)"]} style={styles.cardGradient}>
                <Ionicons name="people-outline" size={24} color={themeColors.text} />
                <Text style={[styles.statValue, { color: themeColors.text }]}>{stats.totalRegistrations}</Text>
                <Text style={[styles.statLabel, { color: themeColors.subText }]}>Total Inscriptions</Text>
              </LinearGradient>
            </BlurView>
          </View>

          <View style={styles.statsRow}>
            <BlurView intensity={10} tint={themeColors.blurTint} style={styles.statCard}>
              <LinearGradient colors={isDarkMode ? ["rgba(255,255,255,0.1)", "rgba(255,255,255,0.05)"] : ["rgba(0,0,0,0.05)", "rgba(0,0,0,0.02)"]} style={styles.cardGradient}>
                <Ionicons name="checkmark-circle-outline" size={24} color={themeColors.text} />
                <Text style={[styles.statValue, { color: themeColors.text }]}>{stats.totalAttendances}</Text>
                <Text style={[styles.statLabel, { color: themeColors.subText }]}>Présences validées</Text>
              </LinearGradient>
            </BlurView>

            <BlurView intensity={10} tint={themeColors.blurTint} style={styles.statCard}>
              <LinearGradient colors={isDarkMode ? ["rgba(255,255,255,0.1)", "rgba(255,255,255,0.05)"] : ["rgba(0,0,0,0.05)", "rgba(0,0,0,0.02)"]} style={styles.cardGradient}>
                <Ionicons name="trending-up-outline" size={24} color={themeColors.text} />
                <Text style={[styles.statValue, { color: themeColors.text }]}>{stats.avgAttendance}%</Text>
                <Text style={[styles.statLabel, { color: themeColors.subText }]}>Taux global</Text>
              </LinearGradient>
            </BlurView>
          </View>
        </View>

        {/* Create Event Button */}
        <TouchableOpacity
          style={styles.createButtonContainer}
          onPress={() => navigation.navigate("CreateEvent", { id, nom })}
        >
          <LinearGradient
            colors={["#005AC1", "#143287"]}
            style={styles.createButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="add-circle" size={24} color="#FFF" />
            <Text style={styles.createButtonText}>Créer un nouvel événement</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Recent Events (This Week) */}
        <View style={styles.recentSection}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Événements de la semaine</Text>
          {weekEvents.length > 0 ? (
            weekEvents.map((event) => (
              <TouchableOpacity
                key={event.id}
                style={[styles.recentEventCard, { borderColor: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)" }]}
                onPress={() => navigation.navigate("OrganizerEventDetails", { event, organizerId: id, nom })}
              >
                <BlurView intensity={10} tint={themeColors.blurTint} style={styles.recentEventInner}>
                  <View style={styles.eventInfo}>
                    <Text style={[styles.eventTitle, { color: themeColors.text }]}>{event.nom_evenement}</Text>
                    <Text style={[styles.eventDate, { color: themeColors.subText }]}>
                      {new Date(event.date).toLocaleDateString("fr-FR", { day: 'numeric', month: 'short' })} • {event.heure_debut?.slice(0, 5)}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={isDarkMode ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.3)"} />
                </BlurView>
              </TouchableOpacity>
            ))
          ) : (
            !loading && <Text style={[styles.emptyText, { color: themeColors.subText }]}>Aucun événement prévu cette semaine.</Text>
          )}
        </View>
      </ScrollView>

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
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 60,
    zIndex: 100,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  titleContainer: {
    flexDirection: "column",
    justifyContent: "center",
  },
  glassActionBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 30,
    paddingHorizontal: 15,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(116, 116, 116, 0.2)",
    overflow: "hidden",
  },
  actionIcon: {
    padding: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  actionBarDivider: {
    width: 1,
    height: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    marginHorizontal: 4,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  notificationCircle: {
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF3B30",
    borderWidth: 1,
    borderColor: "#071c53ff",
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
  headerSubTitle: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "700",
    fontFamily: "Insignia",
    marginTop: -4,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 150,
    paddingBottom: 150,
  },
  statsGrid: {
    marginTop: 10,
    gap: 15,
  },
  statsRow: {
    flexDirection: "row",
    gap: 15,
  },
  statCard: {
    flex: 1,
    borderRadius: 30,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  cardGradient: {
    padding: 20,
    alignItems: "center",
    gap: 0,
  },
  statLabel: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 12,
    fontFamily: "Insignia",
    lineHeight: 16,
  },
  statValue: {
    color: "#FFF",
    fontSize: 40,
    fontWeight: "700",
    fontFamily: "jokeyone",
  },
  createButtonContainer: {
    marginTop: 30,
    borderRadius: 20,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    gap: 12,
  },
  createButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Insignia",
  },
  recentSection: {
    marginTop: 40,
  },
  sectionTitle: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "jokeyone",
    marginBottom: 20,
  },
  recentEventCard: {
    marginBottom: 12,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  recentEventInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 18,
  },
  eventInfo: {
    flex: 1,
    gap: 4,
  },
  eventTitle: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Insignia",
  },
  eventDate: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
    fontFamily: "Insignia",
  },
  emptyText: {
    color: "rgba(255,255,255,0.4)",
    textAlign: "center",
    marginTop: 20,
    fontFamily: "Insignia",
  },
});
