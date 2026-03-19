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
  Modal,
  Image,
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import OrganizerBackground from "../components/OrganizerBackground";
import { API_URL } from "../config";
import { useThemeContext } from "../context/ThemeContext";
import ThemeToggle from "../components/ThemeToggle";

const { width } = Dimensions.get("window");

export default function ManageEvent({ route, navigation }) {
  const { event, organizerId, nom } = route.params;
  const { isDarkMode, toggleDarkMode } = useThemeContext();
  const [data, setData] = useState({ event: event, participants: [] });
  const [stats, setStats] = useState({
    totalInscrit: 0,
    totalPresent: 0,
    tauxPresence: "0%"
  });
  const [loading, setLoading] = useState(true);
  const [feedbacks, setFeedbacks] = useState([]);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(false);

  const emojiMap = {
    verysad: "😡",
    sad: "☹️",
    normal: "😐",
    happy: "🙂",
    veryhappy: "😍",
  };

  const themeColors = {
    text: isDarkMode ? "#FFF" : "#0A0A1A",
    subText: isDarkMode ? "rgba(255,255,255,0.6)" : "rgba(10, 10, 26, 0.6)",
    headerTitle: isDarkMode ? "#FFF" : "#143287",
    blurTint: isDarkMode ? "dark" : "light",
    cardBorder: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
  };

  const API_URL_ORG = `${API_URL}/organizer`;
  const STATS_URL = `${API_URL}/events/stats`;

  useEffect(() => {
    fetchEventDetails();
    fetchEventStats();
  }, []);

  const fetchEventDetails = async () => {
    try {
      const response = await fetch(`${API_URL_ORG}/manage/${event.id}`);
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

  const fetchFeedbacks = async () => {
    setLoadingFeedbacks(true);
    setShowFeedbackModal(true);
    try {
      const response = await fetch(`${API_URL}/events/${event.id}/feedbacks`);
      const resFeedbacks = await response.json();
      if (response.ok) {
        setFeedbacks(resFeedbacks);
      }
    } catch (error) {
      console.error("Error fetching feedbacks:", error);
    } finally {
      setLoadingFeedbacks(false);
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
        <View style={styles.avatar}>
          <Image 
            source={item.photo ? { uri: item.photo } : { uri: `https://ui-avatars.com/api/?name=${item.nom}&background=random` }} 
            style={styles.avatarImage} 
          />
        </View>
        <Text style={[styles.participantName, { color: themeColors.text }]}>{item.nom}</Text>
      </View>
      <View style={[styles.presenceBadge, { backgroundColor: item.status === 'PRESENT' ? '#00A86B' : item.status === 'INSCRIT' ? '#2E5BFF' : '#C41E3A' }]}>
        <Text style={styles.presenceText}>{item.status === 'PRESENT' ? 'Présent' : item.status === 'INSCRIT' ? 'Inscrit' : 'Absent'}</Text>
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
        <ThemeToggle />
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
            !loading && <Text style={[styles.emptyText, { color: themeColors.text }]}>Aucun participant pour le moment.</Text>
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

          <TouchableOpacity style={styles.actionBtn} onPress={fetchFeedbacks}>
            <LinearGradient
              colors={["#FF8C00", "#FF4500"]}
              style={styles.feedbackBtnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.feedbackBtnText}>✨ Voir les feedbacks ✨</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* FEEDBACK MODAL */}
      <Modal
        visible={showFeedbackModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFeedbackModal(false)}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={80} tint={isDarkMode ? "dark" : "light"} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>Retours d'expérience</Text>
              <TouchableOpacity onPress={() => setShowFeedbackModal(false)}>
                <Ionicons name="close-circle" size={32} color={themeColors.text} />
              </TouchableOpacity>
            </View>

            {loadingFeedbacks ? (
              <View style={styles.modalCenter}>
                <Text style={{ color: themeColors.text }}>Chargement...</Text>
              </View>
            ) : feedbacks.length === 0 ? (
              <View style={styles.modalCenter}>
                <Ionicons name="chatbox-ellipses-outline" size={60} color={themeColors.subText} />
                <Text style={[styles.noFeedbackText, { color: themeColors.subText }]}>Aucun feedback pour le moment.</Text>
              </View>
            ) : (
              <FlatList
                data={feedbacks}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <View style={styles.whatsappContainer}>
                    <Image 
                      source={item.etudiant_photo ? { uri: item.etudiant_photo } : { uri: `https://ui-avatars.com/api/?name=${item.etudiant_nom}&background=random` }} 
                      style={styles.whatsappAvatar} 
                    />
                    <View style={[styles.whatsappCard, { backgroundColor: isDarkMode ? "#1e242d" : "#FFFFFF" }]}>
                      <View style={styles.whatsappTriangle} />
                      <View style={styles.whatsappHeader}>
                        <Text style={[styles.whatsappName, { color: isDarkMode ? "#00A86B" : "#2E5BFF" }]}>{item.etudiant_nom}</Text>
                        <Text style={styles.whatsappEmoji}>{emojiMap[item.status]}</Text>
                      </View>
                      <Text style={[styles.whatsappDescription, { color: themeColors.text }]}>{item.description || "Aucune observation."}</Text>
                      <Text style={[styles.whatsappTime, { color: themeColors.subText }]}>
                        {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  </View>
                )}
                contentContainerStyle={{ paddingBottom: 50 }}
              />
            )}
          </BlurView>
        </View>
      </Modal>
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
    marginBottom: 10,
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
    marginRight: 12,
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 18,
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
    textAlign: "center",
    marginVertical: 20,
    fontFamily: "Insignia",
  },
  feedbackBtnGradient: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 15,
    borderRadius: 12,
  },
  feedbackBtnText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Insignia",
    textAlign: "center",
    alignSelf: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    height: "80%",
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    padding: 25,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: "jokeyone",
  },
  modalCenter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noFeedbackText: {
    marginTop: 15,
    fontFamily: "Insignia",
    fontSize: 16,
  },
  feedbackCard: {
    padding: 15,
    borderRadius: 20,
    marginBottom: 15,
    borderWidth: 1,
  },
  feedbackHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  studentInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  feedbackAvatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  emojiText: {
    fontSize: 24,
  },
  feedbackStudentName: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Insignia",
  },
  feedbackDate: {
    fontSize: 12,
    fontFamily: "Insignia",
  },
  descriptionContainer: {
    flexDirection: "row",
    marginTop: 5,
    paddingLeft: 5,
  },
  quoteIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  feedbackDescription: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: "Insignia",
    fontStyle: "italic",
  },
  whatsappContainer: {
    flexDirection: "row",
    marginBottom: 20,
    width: "100%",
  },
  whatsappAvatar: {
    width: 30,
    height: 30,
    borderRadius: 20,
    marginRight: 10,
    marginTop: 0,
  },
  whatsappCard: {
    minWidth: width * 0.75,
    borderRadius: 15,
    borderTopLeftRadius: 0,
    padding: 12,
    position: "relative",
    elevation: 2,
    shadowColor: "#ffffffff",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  whatsappTriangle: {
    position: "absolute",
    left: -10,
    top: 0,
    width: 0,
    height: 0,
    borderTopWidth: 0,
    borderRightWidth: 10,
    borderBottomWidth: 10,
    borderLeftWidth: 0,
    borderTopColor: "transparent",
    borderRightColor: "inherit", 
    borderBottomColor: "transparent",
    borderLeftColor: "transparent",
  },
  whatsappHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  whatsappName: {
    fontSize: 14,
    fontWeight: "bold",
    fontFamily: "Insignia",
  },
  whatsappEmoji: {
    fontSize: 25,
  },
  whatsappDescription: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: "Insignia",
    marginBottom: 5,
  },
  whatsappTime: {
    fontSize: 11,
    textAlign: "right",
    fontFamily: "Insignia",
  },
});
