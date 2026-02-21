import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Animated,
  Dimensions,
} from "react-native";
import { ImageBackground } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import BottomNav from "../components/navbar";





const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH - 40;

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

// ================= CONFIGURATION API =================
const API_URL_USER = "http://192.168.1.3:3000/api/user";
const API_URL_EVENTS = "http://192.168.1.3:3000/api/events";

export default function ProfileScreen({ route, navigation }) {
  const { nom, id } = route.params;

  const [openEventId, setOpenEventId] = useState(null);

  const [userData, setUserData] = useState({
    name: nom,
    greeting: "Bonjour",
    dateInfo: new Date().toLocaleDateString("fr-FR"),
    stats: { upcomingEvents: 0, todayEvents: 0, completedEvents: 0 },
  });
  const [events, setEvents] = useState([]);

  // ================= 🆕 ÉTAT POUR CARROUSEL D'ÉVÉNEMENTS =================
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(1);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const loopedEvents =
    upcomingEvents.length > 0
      ? [
        upcomingEvents[upcomingEvents.length - 1],
        ...upcomingEvents,
        upcomingEvents[0],
      ]
      : [];
  const scrollX = useRef(new Animated.Value(0)).current;
  const carouselRef = useRef(null);

  // ================= 🆕 ANIMATION BARRE DE PROGRESSION =================
  const [progressAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (upcomingEvents.length > 0) {
      progressAnim.setValue(0);

      Animated.loop(
        Animated.sequence([
          Animated.timing(progressAnim, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: false,
          }),
          Animated.timing(progressAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: false,
          }),
        ]),
      ).start();
    }
  }, [upcomingEvents]);

  // ================= CAROUSEL AUTO INFINI =================

  // Auto scroll
  useEffect(() => {
    if (upcomingEvents.length === 0) return;

    setCurrentIndex(1);

    const interval = setInterval(() => {
      setCurrentIndex((prev) => prev + 1);
    }, 2000);

    return () => clearInterval(interval);
  }, [upcomingEvents]);

  // Déplacement automatique quand currentIndex change
  useEffect(() => {
    if (!carouselRef.current) return;

    carouselRef.current.scrollTo({
      x: currentIndex * SCREEN_WIDTH,
      animated: true,
    });
  }, [currentIndex]);

  // Loop invisible
  const handleScrollEnd = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    let index = Math.round(offsetX / SCREEN_WIDTH);

    if (index === 0) {
      carouselRef.current.scrollTo({
        x: upcomingEvents.length * SCREEN_WIDTH,
        animated: false,
      });
      index = upcomingEvents.length;
    }

    if (index === loopedEvents.length - 1) {
      carouselRef.current.scrollTo({
        x: SCREEN_WIDTH,
        animated: false,
      });
      index = 1;
    }

    setCurrentIndex(index);
  };

  // ================= 🆕 RÉCUPÉRATION ÉVÉNEMENTS NON EXPIRÉS =================
  useEffect(() => {
    const fetchUpcomingEvents = async () => {
      try {
        const response = await fetch(`${API_URL_EVENTS}/upcoming/${id}`);
        const data = await response.json();

        if (data.events && data.events.length > 0) {
          console.log("✅ Événements carrousel reçus:", data.events.length);
          setUpcomingEvents(data.events);
        } else {
          console.log("⚠️ Aucun événement carrousel trouvé");
          setUpcomingEvents([]);
        }
        setLoadingEvents(false);
      } catch (error) {
        console.error("Erreur lors du chargement des événements:", error);
        setLoadingEvents(false);
      }
    };

    fetchUpcomingEvents();
    const interval = setInterval(fetchUpcomingEvents, 30000);
    return () => clearInterval(interval);
  }, [id]);

  // ================= API CALLS ORIGINAUX =================
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_URL_EVENTS}/${id}`);
        const data = await res.json();
        setUserData((prev) => ({
          ...prev,
          stats: {
            upcomingEvents: data.upcomingEvents ?? 0,
            todayEvents: data.todayEvents ?? 0,
            completedEvents: data.completedEvents ?? 0,
          },
        }));
      } catch (err) {
        console.log("Erreur fetch stats:", err);
      }
    };

    const fetchEventList = async () => {
      try {
        const res = await fetch(API_URL_EVENTS);
        const data = await res.json();
        const eventsArray = Array.isArray(data) ? data : data.data || [];
        setEvents(eventsArray);
      } catch (err) {
        console.log("Erreur fetch events:", err);
      }
    };

    const fetchUserData = async () => {
      try {
        const res = await fetch(API_URL_USER);
        const data = await res.json();
        setUserData((prev) => ({
          ...prev,
          ...data,
          name: nom,
          dateInfo: new Date().toLocaleDateString("fr-FR"),
        }));
      } catch (err) {
        console.log("Erreur fetch user:", err);
      }
    };

    fetchStats();
    fetchEventList();
    fetchUserData();
  }, [id]);

  // ================= 🆕 FONCTION POUR FORMATER LA DATE =================
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = date
      .toLocaleDateString("fr-FR", { month: "short" })
      .normalize("NFD") // sépare les accents
      .replace(/[\u0300-\u036f]/g, "") // supprime les accents
      .replace(".", "")
      .slice(0, 3)
      .toUpperCase();
    const year = date.getFullYear();
    return { day, month, year };
  };

  // ================= 🆕 RENDU D'UNE CARTE ÉVÉNEMENT ================
  const renderEventCard = (event, index) => {
    const { day, month, year } = formatDate(event.date);

    return (
      <View key={`${event.id}-${index}`} style={styles.carouselCard}>
        <LinearGradient
          colors={THEME_GRADIENTS[event.theme_color] || THEME_GRADIENTS.default}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.activeEventCard}
        >
          <View style={styles.eventContainer}>
            <View style={styles.eventContent}>
              {/* Informations de l'événement */}
              <View style={styles.eventInfo}>
                <Text style={styles.eventTitle}>{event.nom_evenement}</Text>
                <Text style={styles.animatorText}>{event.nom_animateur}</Text>
                <Text style={styles.timeText}>
                  {event.heure_debut ? event.heure_debut.slice(0, 5) : "00:00"}
                </Text>
              </View>

              {/* Bouton "Voir l'événement" */}
              <TouchableOpacity
                style={styles.viewButton}
                onPress={() =>
                  navigation.navigate("Eventinfo", {
                    eventId: event.id,
                    studentId: id,
                    nom,
                  })
                }
              >
                <Text style={styles.viewButtonText}>voir l'évènement</Text>
              </TouchableOpacity>
            </View>
            {/* Date box */}
            <View style={styles.dateBox}>
              <Text style={styles.dateDay}>{day}</Text>
              <Text style={styles.dateMonth}>{month}</Text>
              <Text style={styles.dateYear}>{year}</Text>
            </View>
          </View>
          {/* Indicateur de statut de l'événement */}
          <View style={styles.eventStatusBadge}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor:
                    event.event_status === "EN COURS"
                      ? "#00F908"
                      : event.event_status === "À VENIR"
                        ? "#F4F900"
                        : "#FF0000",
                },
              ]}
            />
          </View>
        </LinearGradient>
      </View>
    );
  };

  // ================= 🆕 RENDU DU CARROUSEL =================
  const renderCarousel = () => {
    if (loadingEvents) {
      return (
        <BlurView intensity={20} tint="light" style={styles.loadingCard}>
          <Text style={styles.loadingText}>Chargement...</Text>
        </BlurView>
      );
    }

    if (upcomingEvents.length === 0) {
      return (
        <BlurView intensity={10} tint="light" style={styles.noEventCard}>
          <Ionicons name="calendar-outline" size={40} color="#0050acff" />
          <Text style={styles.noEventText}>Aucun événement à venir</Text>
        </BlurView>
      );
    }

    return (
      <View style={styles.carouselContainer}>
        <ScrollView
          ref={carouselRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          snapToInterval={SCREEN_WIDTH}
          decelerationRate="fast"
          onMomentumScrollEnd={handleScrollEnd}
          contentOffset={{ x: SCREEN_WIDTH, y: 0 }}
        >
          {loopedEvents.map((event, index) => renderEventCard(event, index))}
        </ScrollView>
      </View>
    );
  };

  return (
    <ImageBackground
      source={require("../assets/project/estwh.png")}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />

      {/* HEADER FIXE */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconButtonGlass}
          onPress={() => console.log("Notifs")}
        >
          <BlurView intensity={20} tint="light" style={styles.iconBlur}>
            <Ionicons name="notifications" size={20} color="#ffffffff" />
          </BlurView>
        </TouchableOpacity>

        <View style={styles.userInfo}>
          <Text style={styles.dateText}>{userData.dateInfo}</Text>
        </View>

        <TouchableOpacity
          style={styles.iconButtonGlass}
          onPress={() => console.log("Profile")}
        >
          <BlurView intensity={20} tint="light" style={styles.iconBlur}>
            <Ionicons name="person" size={20} color="#ffffffff" />
          </BlurView>
        </TouchableOpacity>
      </View>

      {/* SCROLL SEULEMENT ICI */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 160, paddingTop: 10 }}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
        {/* GREETING */}
        <View style={styles.greetingSection}>
          <Text style={styles.greetingText}>{userData.greeting}</Text>
          <Text style={styles.nameText}>{userData.name}</Text>
        </View>
        {/* CAROUSEL */}
        {renderCarousel()}

        {/* STATS */}
        <View style={styles.statsContainer}>
          <BlurView intensity={10} tint="light" style={styles.statCard}>
            <Ionicons name="calendar" size={40} color="#000" />
            <Text style={styles.statLabel}>Événements à venir</Text>
            <Text style={styles.statNumber}>
              {userData.stats.upcomingEvents}
            </Text>
          </BlurView>

          <BlurView intensity={10} tint="light" style={styles.statCard}>
            <Ionicons name="time" size={40} color="#000" />
            <Text style={styles.statLabel}>Événements d'aujourd'hui</Text>
            <Text style={styles.statNumber}>{userData.stats.todayEvents}</Text>
          </BlurView>

          <BlurView intensity={10} tint="light" style={styles.statCard}>
            <Ionicons name="checkmark-circle" size={40} color="#000" />
            <Text style={styles.statLabel}>Présences validées</Text>
            <Text style={styles.statNumber}>
              {userData.stats.completedEvents}
            </Text>
          </BlurView>
        </View>

        {/* EVENTS LIST */}
        <View style={styles.scrollContent}>
          {events.map((event) => (
            <TouchableOpacity
              key={event.id}
              activeOpacity={0.9}
              onPress={() =>
                setOpenEventId(openEventId === event.id ? null : event.id)
              }
            >
              <LinearGradient
                colors={THEME_GRADIENTS[event.theme_color] || THEME_GRADIENTS.default}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.eventCard}
              >
                <View style={styles.eventHeader}>
                  <View style={styles.eventTextContainer}>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    <Text style={styles.animatorText}>{event.animator}</Text>
                    {openEventId === event.id && (
                      <Text style={styles.timeText}>{event.time}</Text>
                    )}
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}

          {/* BUTTONS */}
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={styles.actionButtonWrapper}
              onPress={() => navigation.navigate("Eventsscreen", { id, nom })}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["rgba(124,154,225,0.8)", "#426EBC"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientActionButton}
              >
                <Text style={styles.actionButtonText}>Voir Évènements</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButtonWrapper}
              onPress={() =>
                navigation.navigate("EditProfileScreen", { id, nom })
              }
            >
              <View style={styles.actionButtonOutline}>
                <Text style={styles.actionButtonOutlineText}>
                  Modifier le Profil
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      <BottomNav id={id} nom={nom} />

    </ImageBackground>
  );
}
// ================= STYLES =================
const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: "#818181ff" },
  container: { flex: 1, paddingTop: 50 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 20,
    marginTop: 50,
  },
  iconButtonGlass: {
    marginTop: 10,
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: "hidden",
    backgroundColor: "rgba(0, 74, 143, 0.46)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.13)",
  },
  iconBlur: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  userInfo: { alignItems: "center" },
  dateText: {
    fontSize: 25,
    color: "#333",
    fontWeight: "500",
    marginTop: 15,
    fontFamily: "jokeyone",
  },
  greetingSection: {
    alignItems: "flex-start",
    marginBottom: 20,
    marginLeft: 40,
  },
  greetingText: {
    fontSize: 20,
    color: "#ffffffff",
    paddingBottom: 10,
    fontFamily: "jokeyone",
  },
  nameText: { fontSize: 30, fontWeight: "700", fontFamily: "daretro" },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 10,
    gap: 10,
  },
  statCard: {
    borderRadius: 30,
    height: 220,
    width: 110,
    paddingTop: 30,
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(144, 144, 144, 0.2)",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },

  statLabel: {
    fontSize: 15,
    paddingHorizontal: 10,
    color: "#666",
    marginTop: 10,
    marginBottom: 15,
    fontFamily: "jokeyone",
    textAlign: "center",
  },
  statNumber: { fontSize: 30, fontFamily: "babyu" },

  // ================= 🆕 STYLES CARROUSEL =================
  carouselContainer: {
    position: "relative",
    marginBottom: 20,
  },
  carouselCard: {
    width: SCREEN_WIDTH,
    paddingHorizontal: 20,
  },
  arrowLeft: {
    position: "absolute",
    left: 10,
    top: "50%",
    marginTop: -20,
    zIndex: 10,
    backgroundColor: "#FFF",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  arrowRight: {
    position: "absolute",
    right: 10,
    top: "50%",
    marginTop: -20,
    zIndex: 10,
    backgroundColor: "#FFF",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  paginationDots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 15,
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    transition: "width 0.3s",
  },
  eventStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },

  // ================= STYLES CARTE ÉVÉNEMENT =================
  activeEventCard: {
    borderRadius: 30,
    paddingTop: 18,
    paddingRight: 20,
    paddingLeft: 20,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    alignSelf: "flex-start",
    marginBottom: 15,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  liveText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 15,
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#FFF",
    borderRadius: 2,
  },
  eventContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  eventContent: {
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 15,
  },
  eventInfo: {
    flex: 1,
    paddingRight: 10,
  },
  eventTitle: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 5,
    textTransform: "uppercase",
    fontFamily: "jokeyone",
    letterSpacing: 1,
  },
  animatorText: {
    color: "rgba(255, 255, 255, 0.85)",
    fontSize: 15,
    marginBottom: 5,
    fontWeight: "600",
  },
  timeText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  dateBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 4,
  },
  dateDay: {
    color: "#FFF",
    fontSize: 50,
    fontWeight: "700",
    fontFamily: "Comicy",
    letterSpacing: 5,
    lineHeight: 60,
  },
  dateMonth: {
    color: "#FFF",
    fontSize: 27,
    textTransform: "uppercase",
    fontFamily: "Comicy",
    lineHeight: 40,
  },
  dateYear: {
    color: "#FFF",
    fontSize: 23,
    fontWeight: "700",
    fontFamily: "Comicy",
    lineHeight: 40,
  },
  viewButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: 11,
    paddingHorizontal: 20,
    marginTop: 15,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  viewButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },

  loadingCard: {
    borderRadius: 20,
    padding: 40,
    marginHorizontal: 20,
    marginVertical: 15,
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    overflow: "hidden",
  },
  loadingText: {
    color: "#FFF",
    fontSize: 14,
  },
  noEventCard: {
    borderRadius: 20,
    padding: 40,
    marginHorizontal: 20,
    marginVertical: 15,
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    overflow: "hidden",
  },
  noEventText: {
    color: "#0050acff",
    fontSize: 14,
    marginTop: 10,
    fontWeight: "600",
  },

  // ================= STYLES ORIGINAUX =================
  scrollContent: { padding: 20, paddingBottom: 120 },
  eventCard: { borderRadius: 15, padding: 15, marginBottom: 10 },
  eventHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  eventTextContainer: { flex: 1, paddingRight: 10 },
  dateBoxLarge: {
    backgroundColor: "rgba(50,70,100,0.7)",
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: "center",
    minWidth: 80,
  },
  dateDayLarge: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 28,
  },
  dateMonthLarge: { color: "#FFF", fontSize: 12, lineHeight: 16 },
  dateYearLarge: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 24,
  },
  chevronContainer: { alignItems: "center", marginTop: 8 },

  actionButtonsContainer: { flexDirection: "row", gap: 12, marginTop: 20 },
  actionButtonWrapper: {
    flex: 1,
  },

  gradientActionButton: {
    width: "100%",
    height: 50,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    borderBlockColor: "#ffffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.13,
    shadowRadius: 24,
    elevation: 8,
  },

  actionButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "jokeyone",
  },

  actionButtonOutline: {
    width: "100%",
    borderWidth: 2,
    borderColor: "#01419aff",
    height: 50,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },

  actionButtonOutlineText: {
    color: "#000000ff",
    fontSize: 17,
    fontWeight: "600",
    fontFamily: "jokeyone",
  },

});
