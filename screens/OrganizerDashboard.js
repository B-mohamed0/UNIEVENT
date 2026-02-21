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
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import BottomNav from "../components/navbar";

const { width } = Dimensions.get("window");

export default function OrganizerDashboard({ route, navigation }) {
  const { id, nom } = route.params;
  const [stats, setStats] = useState({
    upcomingEvents: 0,
    todayEvents: "0/0",
    avgAttendance: "0%",
  });

  const API_URL = "http://192.168.1.3:3000/api/organizer"; // Ajuster l'IP si besoin

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/stats/${id}`);
      const data = await response.json();
      setStats({
        upcomingEvents: data.upcomingEvents || 0,
        todayEvents: data.todayEvents || 0, // Idéalement "X/Y"
        avgAttendance: `${data.avgAttendance || 0}%`,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  return (
    <ImageBackground
      source={require("../assets/project/estwh.png")}
      style={styles.container}
      resizeMode="cover"
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <View style={styles.logoCircle}>
              <Ionicons name="flash" size={16} color="#FFF" />
            </View>
            <Text style={styles.headerTitle}>Espace Organisateur</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Statistics Cards */}
        <View style={styles.statsList}>
          <BlurView intensity={30} tint="dark" style={styles.statLine}>
            <Text style={styles.statLabel}>Événements à venir</Text>
            <Text style={styles.statValue}>{stats.upcomingEvents}</Text>
          </BlurView>

          <BlurView intensity={30} tint="dark" style={styles.statLine}>
            <Text style={styles.statLabel}>Aujourd'hui</Text>
            <Text style={styles.statValue}>{stats.todayEvents}</Text>
          </BlurView>

          <BlurView intensity={30} tint="dark" style={styles.statLine}>
            <Text style={styles.statLabel}>Taux moyen</Text>
            <Text style={styles.statValue}>{stats.avgAttendance}</Text>
          </BlurView>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => navigation.navigate("OrganizerEvents", { id, nom })}
          >
            <BlurView intensity={30} tint="dark" style={styles.navItemInner}>
              <Text style={styles.navText}>Mes Événements</Text>
              <Ionicons name="chevron-forward" size={20} color="#FFF" />
            </BlurView>
          </TouchableOpacity>



          <TouchableOpacity
            style={styles.navItem}
            onPress={() => navigation.navigate("OrganizerStats", { id, nom })}
          >
            <BlurView intensity={30} tint="dark" style={styles.navItemInner}>
              <Text style={styles.navText}>Statistiques Globales</Text>
              <Ionicons name="chevron-forward" size={20} color="#FFF" />
            </BlurView>
          </TouchableOpacity>
        </View>

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
            <Ionicons name="add" size={24} color="#FFF" />
            <Text style={styles.createButtonText}>Créer événement</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      <BottomNav id={id} nom={nom} />
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
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  statsList: {
    marginTop: 20,
    gap: 15,
  },
  statLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 15,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  statLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 16,
    fontFamily: "Insignia",
  },
  statValue: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "700",
    fontFamily: "jokeyone",
  },
  navItem: {
    marginTop: 5,
  },
  navItemInner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 15,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  navText: {
    color: "#FFF",
    fontSize: 16,
    fontFamily: "Insignia",
  },
  createButtonContainer: {
    marginTop: 40,
    borderRadius: 25,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#005AC1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    gap: 10,
  },
  createButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "Insignia",
  },
});
