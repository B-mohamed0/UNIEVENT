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
    { screen: "OrganizerDashboard", icon: "grid", iconOutline: "grid-outline" },
    { screen: "OrganizerEvents", icon: "list", iconOutline: "list-outline" },
    { screen: "CreateEvent", icon: "add-circle", iconOutline: "add-circle-outline" },
    { screen: "OrganizerStats", icon: "stats-chart", iconOutline: "stats-chart-outline" },
];

const OrganizerNavbar = ({ id, nom }) => {
    const { isDarkMode } = useThemeContext();
    const navigation = useNavigation();
    const route = useRoute();
    const { orgLastIndex, setOrgLastIndex } = useNavbarContext();

    const getActiveIndex = () => {
        for (let i = 0; i < TABS.length; i++) {
            if (route.name === TABS[i].screen) return i;
        }
        return -1;
    };

    const activeIndex = getActiveIndex();

    const animatedValue = useRef(new Animated.Value(orgLastIndex)).current;

    useEffect(() => {
        if (activeIndex !== -1) {
            Animated.timing(animatedValue, {
                toValue: activeIndex,
                duration: 300,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }).start(() => {
                setOrgLastIndex(activeIndex);
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
            {/* Shadow container (PAS de overflow ici) */}
            <View style={styles.glassShadow}>
                
                {/* Glass container (overflow + radius ici) */}
                <View
                    style={[
                        styles.glassContainer,
                        {
                            borderColor: isDarkMode
                                ? "rgba(255,255,255,0.15)"
                                : "rgba(0,0,0,0.1)",
                        },
                    ]}
                >
                    {/* Blur */}
                    <BlurView
                        intensity={15}
                        tint={isDarkMode ? "light" : "dark"}
                        style={styles.blur}
                    />

                    {/* Glass overlay */}
                    <View
                        style={[
                            styles.glassOverlay,
                            {
                                backgroundColor: isDarkMode
                                    ? "rgba(255, 255, 255, 0.12)"
                                    : "rgba(0, 0, 0, 0.05)",
                            },
                        ]}
                    />

                    {/* Sliding Indicator */}
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

                    {/* Tabs */}
                    {TABS.map((tab) => {
                        const isTabActive = route.name === tab.screen;

                        return (
                            <TouchableOpacity
                                key={tab.screen}
                                style={styles.tab}
                                onPress={() => handlePress(tab)}
                                activeOpacity={0.7}
                            >
                                <Ionicons
                                    name={
                                        isTabActive
                                            ? tab.icon
                                            : tab.iconOutline
                                    }
                                    size={24}
                                    color={
                                        isTabActive
                                            ? "#FFF"
                                            : isDarkMode
                                            ? "rgba(255,255,255,0.5)"
                                            : "rgba(0,0,0,0.5)"
                                    }
                                />
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>
        </View>
    );
};

export default OrganizerNavbar;

// ─── STYLES ──────────────────────────────────────────────
const styles = StyleSheet.create({
    wrapper: {
        position: "absolute",
        bottom: 20,
        width: "100%",
        alignItems: "center",
    },

    // Shadow séparée
    glassShadow: {
        width: BAR_WIDTH,
        height: 64,
        borderRadius: 32,

        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 15,
    },

    // Glass réel (radius + overflow ici)
    glassContainer: {
        flex: 1,
        borderRadius: 32,
        overflow: "hidden",
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
    },

    blur: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 32,
    },

    glassOverlay: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 32,
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