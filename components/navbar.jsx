import React, { useEffect, useState } from "react";
import { StyleSheet, TouchableOpacity, View, Platform, Animated, Easing } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";

const BottomNav = ({ id, nom }) => {
  const navigation = useNavigation();
  const route = useRoute();

  const isActive = (screen) =>
    route.name === screen || (screen === "Student" && route.name === "Eventinfo");

  // Determine active index based on route
  const getActiveIndex = () => {
    if (isActive("Home")) return 0;
    if (isActive("Student")) return 1;
    if (isActive("Organizer")) return 2;
    return -1; // Default or fallback
  };

  const activeIndex = getActiveIndex();
  const animatedValue = React.useRef(new Animated.Value(activeIndex)).current;

  // Animate when active index changes
  useEffect(() => {
    if (activeIndex !== -1) {
      Animated.timing(animatedValue, {
        toValue: activeIndex,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [activeIndex]);

  // Width of container is 200 (hardcoded in styles)
  // 3 items distributed with space-around.
  // Center positions: ~33.33, ~100, ~166.66
  // Gradient width: 70
  // Left offsets: 33.33 - 35 = -1.67, 100 - 35 = 65, 166.66 - 35 = 131.66

  // Interpolation mapping index to translateX
  const translateX = animatedValue.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [-1.67, 65, 131.66],
  });

  const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

  return (
    <View style={styles.wrapper}>
      <BlurView intensity={10} tint="light" style={styles.glassContainer}>
        {/* Animated Active Indicator */}
        {activeIndex !== -1 && (
          <AnimatedLinearGradient
            colors={["#7aadffff", "#2563EB", "#0e2d96ff"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.activeGradient,
              { transform: [{ translateX }] }
            ]}
          />
        )}

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("Home", { nom, id })}
        >
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
    zIndex: 1, // Ensure icon is above gradient
  },

  activeGradient: {
    position: "absolute",
    left: 0, // Base position
    width: 70,
    height: 60,
    borderRadius: 30,
    zIndex: 0, // Behind the icons
  },
});
