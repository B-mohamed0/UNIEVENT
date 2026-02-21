import React, { useRef, useEffect } from "react";
import { TouchableOpacity, Animated, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeContext } from "../context/ThemeContext";

const ThemeToggle = ({ color }) => {
    const { isDarkMode, toggleTheme } = useThemeContext();
    const rotateAnim = useRef(new Animated.Value(isDarkMode ? 1 : 0)).current;

    useEffect(() => {
        Animated.timing(rotateAnim, {
            toValue: isDarkMode ? 1 : 0,
            duration: 500,
            useNativeDriver: true,
        }).start();
    }, [isDarkMode]);

    const rotate = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ["180deg", "0deg"],
    });

    return (
        <TouchableOpacity onPress={toggleTheme} style={[styles.button, { backgroundColor: isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.03)", borderColor: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)" }]}>
            <Animated.View style={{ transform: [{ rotate }] }}>
                <Ionicons name={isDarkMode ? "sunny" : "moon"} size={20} color={color} />
            </Animated.View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        padding: 8,
        borderRadius: 12,
        borderWidth: 1,
        justifyContent: "center",
        alignItems: "center",
    },
});

export default ThemeToggle;
