import React, { useEffect, useRef } from "react";
import { View, StyleSheet, ImageBackground, Animated } from "react-native";
import { useThemeContext } from "../context/ThemeContext";

const OrganizerBackground = ({ children }) => {
    const { isDarkMode } = useThemeContext();
    const fadeAnim = useRef(new Animated.Value(isDarkMode ? 1 : 0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: isDarkMode ? 1 : 0,
            duration: 400, // Smooth 400ms transition 
            useNativeDriver: true,
        }).start();
    }, [isDarkMode]);

    return (
        <View style={styles.container}>
            {/* Light Background (Always at the bottom) */}
            <View style={StyleSheet.absoluteFill}>
                <ImageBackground
                    source={require("../assets/project/organizer_bg_light.png")}
                    style={StyleSheet.absoluteFill}
                    resizeMode="cover"
                />
            </View>

            {/* Dark Background (Fades in over the light one) */}
            <Animated.View style={[StyleSheet.absoluteFill, { opacity: fadeAnim }]}>
                <ImageBackground
                    source={require("../assets/project/organizer_bg.jpg")}
                    style={StyleSheet.absoluteFill}
                    resizeMode="cover"
                />
            </Animated.View>

            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});

export default OrganizerBackground;
