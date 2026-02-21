import React, { useRef, useEffect } from "react";
import { View, StyleSheet, ImageBackground, Animated } from "react-native";
import { useThemeContext } from "../context/ThemeContext";

const OrganizerBackground = ({ children }) => {
    const { isDarkMode } = useThemeContext();
    const fadeAnim = useRef(new Animated.Value(isDarkMode ? 1 : 0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: isDarkMode ? 1 : 0,
            duration: 500,
            useNativeDriver: true,
        }).start();
    }, [isDarkMode]);

    return (
        <View style={styles.container}>
            <View style={StyleSheet.absoluteFill}>
                <ImageBackground
                    source={require("../assets/project/organizer_bg_light.png")}
                    style={StyleSheet.absoluteFill}
                    resizeMode="cover"
                />
                <Animated.View style={[StyleSheet.absoluteFill, { opacity: fadeAnim }]}>
                    <ImageBackground
                        source={require("../assets/project/organizer_bg.png")}
                        style={StyleSheet.absoluteFill}
                        resizeMode="cover"
                    />
                </Animated.View>
            </View>
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
