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

// Routes spécifiques au Professeur
const TABS = [
  { screen: "ProfHome", icon: "home", iconOutline: "home-outline" },
  { screen: "ProfEventsscreen", icon: "calendar", iconOutline: "calendar-outline" },
  { screen: "ProfStats", icon: "bar-chart", iconOutline: "bar-chart-outline" },
  { screen: "ProfProfile", icon: "person", iconOutline: "person-outline" },
];

const ProfNavbar = ({ id, nom }) => {
  const navigation = useNavigation();
  const route = useRoute();
  const { lastIndex, setLastIndex } = useNavbarContext();
  const { isDarkMode } = useThemeContext();

  const getActiveIndex = () => {
    const index = TABS.findIndex(tab => route.name === tab.screen);
    if (index !== -1) return index;
    
    // Fallback for sub-screens
    if (route.name === "ProfEventinfo") return 1;
    if (route.name === "ProfInscription") return 1;
    if (route.name === "ProfScanner") return 0; // Highlight Home or similar
    if (route.name === "ProfNotifications") return 0; // Highlight Home
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
    navigation.navigate(tab.screen, { nom, id });
  };

  return (
    <View style={styles.wrapper}>
      <View style={[styles.glassContainer, { borderColor: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.3)" }]}>
        <BlurView intensity={isDarkMode ? 25 : 10} tint={isDarkMode ? "dark" : "light"} style={styles.blur} />
        <View style={[styles.glassOverlay, { backgroundColor: isDarkMode ? "rgba(0, 0, 0, 0.06)" : "rgba(255, 255, 255, 0.22)" }]} />

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

        {TABS.map((tab) => {
          const isTabActive =
            route.name === tab.screen ||
            (tab.screen === "ProfEventsscreen" && route.name === "ProfEventinfo");

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

export default ProfNavbar;

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
