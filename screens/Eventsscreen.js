import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  TextInput,
  ImageBackground,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import BottomNav from "../components/navbar";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

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

const API_URL_EVENTS = `${process.env.EXPO_PUBLIC_API_URL}/events`;

export default function EventsScreen({ route, navigation }) {
  const { nom, id } = route.params;

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("Tous");
  const [selectedCategory, setSelectedCategory] = useState("TOUTES");
  const [expandedEventId, setExpandedEventId] = useState(null);
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const sidebarWidth = SCREEN_WIDTH * 0.75;
  const sidebarAnim = useRef(new Animated.Value(sidebarWidth)).current;

  const filters = ["Tous", "À venir", "En cours", "Terminé"];
  const categories = ["TOUTES", "Conférence", "Atelier", "Soirée"];

  const toggleFilter = () => {
    if (!isFilterVisible) {
      setIsFilterVisible(true);
      Animated.timing(sidebarAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(sidebarAnim, {
        toValue: sidebarWidth,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setIsFilterVisible(false));
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch(API_URL_EVENTS);
      const data = await res.json();
      setEvents(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.log("Erreur fetch events:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (date, hDebut, hFin) => {
    if (!date || !hDebut || !hFin) return "À venir";

    const now = new Date();
    const eventDate = new Date(date);

    // Normalize dates to compare days
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());

    if (eventDay > today) return "À venir";
    if (eventDay < today) return "Terminé";

    // Same day logic
    const [hStart, mStart] = hDebut.split(":").map(Number);
    const [hEnd, mEnd] = hFin.split(":").map(Number);
    const start = new Date(now).setHours(hStart, mStart, 0, 0);
    const end = new Date(now).setHours(hEnd, mEnd, 0, 0);

    if (now < start) return "À venir";
    if (now > end) return "Terminé";
    return "En cours";
  };

  const formatDate = (dateInput) => {
    let day, month, year;

    // Si c'est un objet (déjà formaté par le backend)
    if (dateInput && typeof dateInput === "object" && dateInput.day) {
      day = dateInput.day;
      month = dateInput.month || "";
      year = dateInput.year;
    } else {
      const date = new Date(dateInput);
      if (isNaN(date.getTime())) return { day: "??", month: "???", year: "????" };
      day = date.getDate().toString().padStart(2, "0");
      month = date.toLocaleDateString("fr-FR", { month: "short" });
      year = date.getFullYear();
    }

    // Suppression systématique des accents pour le mois
    const normalizedMonth = month
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(".", "")
      .toUpperCase()
      .slice(0, 3);

    return { day, month: normalizedMonth, year };
  };

  const filteredEvents = events.filter((ev) => {
    // Utiliser le statut du backend s'il existe, sinon calculer en local
    let status = ev.event_status || getStatusLabel(ev.date, ev.heure_debut || ev.time, ev.heure_fin);

    // Normaliser pour la comparaison avec les filtres (cas du accent sur TERMINÉ)
    const matchesFilter = selectedFilter === "Tous" || status === selectedFilter;
    const matchesCategory = selectedCategory === "TOUTES" || ev.categorie === selectedCategory;
    const evName = ev.nom_evenement || ev.title || "";
    const matchesSearch = evName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesCategory && matchesSearch;
  });

  return (
    <ImageBackground
      source={require("../assets/project/organizer_bg_light.png")}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButtonGlass}>
          <BlurView intensity={20} tint="light" style={styles.iconBlur}>
            <Ionicons name="chevron-back" size={24} color="#FFF" />
          </BlurView>
        </TouchableOpacity>
        <Text style={styles.pageTitle}>ÉVÉNEMENTS</Text>
        <TouchableOpacity onPress={toggleFilter} style={styles.iconButtonGlass}>
          <BlurView intensity={20} tint="light" style={styles.iconBlur}>
            <Ionicons name="filter" size={24} color="#FFF" />
          </BlurView>
        </TouchableOpacity>
      </View>

      {/* SEARCH & FILTERS */}
      <View style={styles.searchSection}>
        <BlurView intensity={20} tint="light" style={styles.searchBar}>
          <Ionicons name="search" size={20} color="rgba(3, 3, 3, 0.6)" />
          <TextInput
            placeholder="Rechercher un événement..."
            placeholderTextColor="rgba(0, 0, 0, 1)"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </BlurView>
      </View>

      {/* EVENTS LIST */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#FFF" style={{ marginTop: 50 }} />
        ) : filteredEvents.length > 0 ? (
          filteredEvents.map((event, index) => {
            const { day, month, year } = formatDate(event.date);
            const isExpanded = expandedEventId === event.id;

            return (
              <TouchableOpacity
                key={`${event.id}-${index}`}
                activeOpacity={0.9}
                onPress={() => setExpandedEventId(isExpanded ? null : event.id)}
                style={styles.cardContainer}
              >
                <LinearGradient
                  colors={THEME_GRADIENTS[event.theme_color] || THEME_GRADIENTS.default}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.activeEventCard, !isExpanded && { paddingBottom: 1 }]}
                >
                  <View style={styles.eventContainer}>
                    <View style={[styles.eventContent, { flex: 1 }]}>
                      {/* LIGNE DE TITRE (Toujours visible) */}
                      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                        <Text
                          style={[styles.eventTitle, { flex: 1, marginBottom: isExpanded ? 5 : 0 }]}
                          numberOfLines={isExpanded ? 0 : 1}
                        >
                          {event.nom_evenement || event.title || "Événement sans nom"}
                        </Text>
                        {!isExpanded && (
                          <Ionicons name="chevron-down" size={20} color="rgba(255,255,255,0.6)" style={{ marginLeft: 10 }} />
                        )}
                      </View>

                      {/* INFORMATIONS SUPPLÉMENTAIRES (Si agrandi) */}
                      {isExpanded && (
                        <View>
                          <Text style={styles.animatorText}>{event.nom_animateur || event.animator}</Text>
                          <Text style={styles.timeText}>
                            {(event.time || event.heure_debut || "00:00").slice(0, 5)}
                          </Text>
                        </View>
                      )}

                      {/* BOUTON D'ACTION (Si agrandi) */}
                      {isExpanded && (
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
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

                          <TouchableOpacity onPress={() => setExpandedEventId(null)} style={{ padding: 10 }}>
                            <Ionicons name="chevron-up" size={24} color="#FFF" />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>

                    {/* Date box - Uniquement si agrandi */}
                    {isExpanded && (
                      <View style={styles.dateBox}>
                        <Text style={styles.dateDay}>{day}</Text>
                        <Text style={styles.dateMonth}>{month}</Text>
                        <Text style={styles.dateYear}>{year}</Text>
                      </View>
                    )}
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            );
          })
        ) : (
          <Text style={styles.noEventsText}>Aucun événement trouvé.</Text>
        )}
      </ScrollView>

      <BottomNav id={id} nom={nom} />

      {/* SIDEBAR FILTER */}
      {isFilterVisible && (
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={toggleFilter}
        />
      )}

      <Animated.View style={[styles.sidebar, { transform: [{ translateX: sidebarAnim }] }]}>
        <BlurView intensity={40} tint="light" style={styles.sidebarBlur}>
          <Text style={styles.sidebarTitle}>FILTRES</Text>

          <Text style={styles.sidebarLabel}>CATÉGORIES</Text>
          <View style={styles.sidebarFilterList}>
            {categories.map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => setSelectedCategory(c)}
                style={[styles.sidebarFilterBtn, selectedCategory === c && styles.sidebarFilterBtnActive]}
              >
                <Text style={[styles.sidebarFilterText, selectedCategory === c && styles.sidebarFilterTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.sidebarDivider} />

          <Text style={styles.sidebarLabel}>STATUT</Text>
          <View style={styles.sidebarFilterList}>
            {filters.map((f) => (
              <TouchableOpacity
                key={f}
                onPress={() => setSelectedFilter(f)}
                style={[styles.sidebarFilterBtn, selectedFilter === f && styles.sidebarFilterBtnActive]}
              >
                <Text style={[styles.sidebarFilterText, selectedFilter === f && styles.sidebarFilterTextActive]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </BlurView>
      </Animated.View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  iconButtonGlass: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.22)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.38)",
  },
  iconBlur: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  pageTitle: {
    fontSize: 24,
    color: "#FFF",
    fontFamily: "jokeyone",
    letterSpacing: 2,
  },
  searchSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 20,
    paddingHorizontal: 15,
    height: 50,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    marginBottom: 15,
    overflow: "hidden",
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    color: "#FFF",
    fontSize: 16,
    fontFamily: "Insignia",
  },
  filterContainer: {
    paddingBottom: 5,
  },
  filterBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginRight: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  filterBtnActive: {
    backgroundColor: "#FFF",
    borderColor: "#FFF",
  },
  filterText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontFamily: "jokeyone",
    fontSize: 14,
  },
  filterTextActive: {
    color: "#000",
  },
  cardContainer: {
    marginBottom: 15,
    borderRadius: 30,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  activeEventCard: {
    borderRadius: 30,
    paddingTop: 18,
    paddingRight: 20,
    paddingLeft: 20,
    paddingBottom: 15,
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
    fontFamily: "insignia",

  },
  timeText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "insignia",
    letterSpacing: 1,
  },
  dateBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 4,
  },
  dateDay: {
    color: "#FFF",
    fontSize: 45,
    fontWeight: "700",
    fontFamily: "Comicy",
    letterSpacing: 5,
    lineHeight: 60,
  },
  dateMonth: {
    color: "#FFF",
    fontSize: 30,
    textTransform: "uppercase",
    fontFamily: "Comicy",
    lineHeight: 40,
  },
  dateYear: {
    color: "#FFF",
    fontSize: 24,
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
  noEventsText: {
    color: "#FFF",
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
    fontFamily: "Insignia",
  },
  // SIDEBAR STYLES
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    zIndex: 90,
  },
  sidebar: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: SCREEN_WIDTH * 0.45,
    zIndex: 100,
  },
  sidebarBlur: {
    flex: 1,
    paddingTop: 80,
    paddingHorizontal: 20,
    backgroundColor: "rgba(142, 142, 142, 0.12)",
  },
  sidebarTitle: {
    fontSize: 28,
    color: "#FFF",
    fontFamily: "jokeyone",
    marginBottom: 30,
    letterSpacing: 2,
    alignSelf: "center",
  },
  sidebarLabel: {
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
    fontFamily: "Insignia",
    marginBottom: 15,
    marginTop: 20,
    textTransform: "uppercase",
  },
  sidebarFilterList: {
    flexDirection: "column",
    gap: 10,
  },
  sidebarFilterBtn: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  sidebarFilterBtnActive: {
    backgroundColor: "#FFF",
    borderColor: "#FFF",
  },
  sidebarFilterText: {
    color: "rgba(255,255,255,0.8)",
    fontFamily: "jokeyone",
    alignSelf: "center",
    fontSize: 16,
  },
  sidebarFilterTextActive: {
    color: "#000",
  },
  sidebarDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginVertical: 10,
  },
});
