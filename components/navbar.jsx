import React from "react";
import { StyleSheet, TouchableOpacity, View, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";

const BottomNav = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const isActive = (screen) => route.name === screen;

  return (
    <View style={styles.wrapper}>
      <BlurView intensity={10} tint="light" style={styles.glassContainer}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("Home")}
        >
          {isActive("Home") && (
            <LinearGradient
              colors={["#7aadffff", "#2563EB", "#0e2d96ff"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.activeGradient}
            />
          )}

          <Ionicons
            name="home"
            size={24}
            color={isActive("Home") ? "#fff" : "#000"}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("Student")}
        >
          {isActive("Student") && (
            <LinearGradient
              colors={["#7aadffff", "#2563EB", "#0e2d96ff"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.activeGradient}
            />
          )}

          <Ionicons
            name="calendar"
            size={24}
            color={isActive("Student") ? "#fff" : "#000"}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("Organizer")}
        >
          {isActive("Organizer") && (
            <LinearGradient
              colors={["#7aadffff", "#2563EB", "#0e2d96ff"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.activeGradient}
            />
          )}

          <Ionicons
            name="bar-chart"
            size={24}
            color={isActive("Organizer") ? "#fff" : "#000"}
          />
        </TouchableOpacity>
      </BlurView>
    </View>
  );
};

export default BottomNav;

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    bottom: 25,
    width: "100%",
    alignItems: "center",
  },

  glassContainer: {
    flexDirection: "row",
    width: 200,
    height: 60,
    borderRadius: 30,
    justifyContent: "space-around",
    alignItems: "center",

    // Effet glass
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.6)",

    // Ombre douce
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,

    overflow: "hidden",
  },

  navItem: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },

  activeGradient: {
    position: "absolute",
    width: 70,
    height: 60,
    borderRadius: 30,
  },
});
