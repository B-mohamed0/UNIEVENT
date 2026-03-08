import React from "react";
import { View, StyleSheet, ImageBackground } from "react-native";

const OrganizerBackground = ({ children }) => {
    return (
        <View style={styles.container}>
            <View style={StyleSheet.absoluteFill}>
                <ImageBackground
                    source={require("../assets/project/organizer_bg_light.png")}
                    style={StyleSheet.absoluteFill}
                    resizeMode="cover"
                />
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
