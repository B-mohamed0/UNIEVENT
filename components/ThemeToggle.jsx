import React, { useEffect, useRef } from "react";
import { TouchableWithoutFeedback, Animated, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { useThemeContext } from "../context/ThemeContext";

const ThemeToggle = () => {
    const { isDarkMode, toggleDarkMode } = useThemeContext();
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const rotateAnim = useRef(new Animated.Value(isDarkMode ? 1 : 0)).current;

    useEffect(() => {
        Animated.timing(rotateAnim, {
            toValue: isDarkMode ? 1 : 0,
            duration: 500,
            useNativeDriver: true,
        }).start();
    }, [isDarkMode]);

    const spin = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg']
    });

    const handlePressIn = () => {
        Animated.spring(scaleAnim, { toValue: 0.85, useNativeDriver: true }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start();
    };

    return (
        <TouchableWithoutFeedback
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={toggleDarkMode}
        >
            <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }, { rotate: spin }] }]}>
                <BlurView
                    intensity={isDarkMode ? 30 : 50}
                    tint={isDarkMode ? "dark" : "light"}
                    style={styles.glass}
                >
                    <Ionicons
                        name={isDarkMode ? "moon-outline" : "sunny-outline"}
                        size={22}
                        color={isDarkMode ? "#FFF" : "#0A0A1A"}
                    />
                </BlurView>
            </Animated.View>
        </TouchableWithoutFeedback>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 10, // ~25% of 40px
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.2)",
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        marginRight: 10,
    },
    glass: {
        width: 40,
        height: 40,
        justifyContent: "center",
        alignItems: "center",
    }
});

export default ThemeToggle;
