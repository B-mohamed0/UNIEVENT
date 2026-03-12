import React, { useEffect, useRef } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  View,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useNavbarContext } from "../context/NavbarContext";
import { useThemeContext } from "../context/ThemeContext";

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── CONFIG ────────────────────────────────────────────
const TAB_COUNT = 4;
const BAR_WIDTH = SCREEN_WIDTH * 0.7;
const TAB_WIDTH = BAR_WIDTH / TAB_COUNT;
const INDICATOR_SIZE = 48;
const INDICATOR_OFFSET = (TAB_WIDTH - INDICATOR_SIZE) / 2;

const TABS = [
  { screen: "Home", icon: "home", iconOutline: "home-outline" },
  { screen: "Eventsscreen", icon: "calendar", iconOutline: "calendar-outline" },
  { screen: "Organizer", icon: "bar-chart", iconOutline: "bar-chart-outline" },
  { screen: "Student", icon: "person", iconOutline: "person-outline" },
];

const BottomNav = ({ id, nom }) => {
  const navigation = useNavigation();
  const route = useRoute();
  const { lastIndex, setLastIndex } = useNavbarContext();
  const { isDarkMode } = useThemeContext();

  const getActiveIndex = () => {
    for (let i = 0; i < TABS.length; i++) {
      if (route.name === TABS[i].screen) return i;
    }
    if (route.name === "Eventinfo") return 1;
    if (route.name === "StudentStats") return 2;
    if (route.name === "StudentProfile") return 3;
    return -1;
  };

  const activeIndex = getActiveIndex();

  const animatedValue = useRef(new Animated.Value(lastIndex)).current;

  useEffect(() => {
    if (activeIndex !== -1) {
      Animated.timing(animatedValue, {
        toValue: activeIndex,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        setLastIndex(activeIndex);
      });
    }
  }, [activeIndex]);

  const translateX = animatedValue.interpolate({
    inputRange: TABS.map((_, i) => i),
    outputRange: TABS.map((_, i) => i * TAB_WIDTH + INDICATOR_OFFSET),
  });

  const handlePress = (tab) => {
    if (tab.screen === "Organizer") {
      navigation.navigate("StudentStats", { nom, id });
    } else if (tab.screen === "Student") {
      navigation.navigate("StudentProfile", { nom, id });
    } else {
      navigation.navigate(tab.screen, { nom, id });
    }
  };

  return (
    <View style={styles.wrapper}>
      <View style={[styles.glassContainer, { borderColor: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.3)" }]}>
        {/* Blur background */}
        <BlurView intensity={isDarkMode ? 25 : 10} tint={isDarkMode ? "dark" : "light"} style={styles.blur} />

        {/* Border overlay */}
        <View style={[styles.glassOverlay, { backgroundColor: isDarkMode ? "rgba(0, 0, 0, 0.06)" : "rgba(255, 255, 255, 0.22)" }]} />

        {/* ── Sliding Indicator ── */}
        {activeIndex !== -1 && (
          <AnimatedLinearGradient
            colors={["#6C9FFF", "#2563EB", "#1240A8"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.indicator,
              { transform: [{ translateX }] },
            ]}
          />
        )}

        {/* ── Tabs ── */}
        {TABS.map((tab) => {
          const isTabActive =
            route.name === tab.screen ||
            (tab.screen === "Eventsscreen" && route.name === "Eventinfo");

          return (
            <TouchableOpacity
              key={tab.screen}
              style={styles.tab}
              onPress={() => handlePress(tab)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isTabActive ? tab.icon : tab.iconOutline}
                size={24}
                color={isTabActive ? "#ffffffff" : (isDarkMode ? "rgba(255, 255, 255, 0.85)" : "#000000ff")}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default BottomNav;

// ─── STYLES ──────────────────────────────────────────────
const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    bottom: 20,
    width: "100%",
    alignItems: "center",
  },

  glassContainer: {
    width: BAR_WIDTH,
    height: 64,
    borderRadius: 32,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",

    // ombre douce
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
  },

  blur: {
    ...StyleSheet.absoluteFillObject,
  },

  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.22)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },

  tab: {
    width: TAB_WIDTH,
    height: 64,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },

  indicator: {
    position: "absolute",
    left: 0,
    width: INDICATOR_SIZE,
    height: INDICATOR_SIZE,
    borderRadius: INDICATOR_SIZE / 2,
    zIndex: 1,

    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});
