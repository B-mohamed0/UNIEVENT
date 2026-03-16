import React, { useRef, useEffect } from "react";
import {
  View,
  Animated,
  Easing,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

const LiquidGlassCard = ({
  children,
  isDarkMode,
  containerStyle,
  colors1,
  colors2,
  blurIntensity,
}) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim2 = useRef(new Animated.Value(0)).current;
  const rotateAnim3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 10000,
        useNativeDriver: true,
        easing: Easing.linear,
      })
    ).start();

    Animated.loop(
      Animated.timing(rotateAnim2, {
        toValue: 1,
        duration: 7000,
        useNativeDriver: true,
        easing: Easing.linear,
      })
    ).start();

    Animated.loop(
      Animated.timing(rotateAnim3, {
        toValue: 1,
        duration: 12000,
        useNativeDriver: true,
        easing: Easing.linear,
      })
    ).start();
  }, []);

  const spin1 = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const spin2 = rotateAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: ["360deg", "0deg"],
  });

  const spin3 = rotateAnim3.interpolate({
    inputRange: [0, 1],
    outputRange: ["45deg", "405deg"],
  });

  const defaultColors1 = isDarkMode
    ? ["#00f7ff2b", "#1e397d"]
    : ["#89f6fe", "#116ff2"];

  const defaultColors2 = isDarkMode
    ? ["#3d5684", "#3b717b"]
    : ["#9a9cff", "#000000"];

  return (
    <View style={[styles.cardContainer, containerStyle]}>
      {/* Liquid animated background */}
      <View style={styles.liquidBackgroundWrapper}>
        <Animated.View
          style={[
            styles.liquidBlob1,
            { transform: [{ rotate: spin1 }, { scale: 1.4 }] },
          ]}
        >
          <LinearGradient
            colors={colors1 || defaultColors1}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
        <Animated.View
          style={[
            styles.liquidBlob2,
            {
              transform: [
                { rotate: spin2 },
                { scale: 1.3 },
                { translateX: -10 },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={colors2 || defaultColors2}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
        <Animated.View
          style={[
            styles.liquidBlob3,
            { transform: [{ rotate: spin3 }, { scale: 1.2 }] },
          ]}
        >
          <LinearGradient
            colors={
              isDarkMode
                ? ["#1a1a4e88", "#00c6ff44"]
                : ["#ffffff55", "#66a6ff33"]
            }
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>

      {/* Glass blur layer */}
      <BlurView
        intensity={blurIntensity || (isDarkMode ? 40 : 60)}
        tint={isDarkMode ? "dark" : "light"}
        style={styles.glassLayer}
      >
        <View
          style={[
            styles.innerBorder,
            {
              borderColor: isDarkMode
                ? "rgba(255, 255, 255, 0.25)"
                : "rgba(255, 255, 255, 0.19)",
            },
          ]}
        >
          {/* Glossy highlight */}
          <LinearGradient
            colors={[
              isDarkMode ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.5)",
              "rgba(255,255,255,0)",
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.glossyHighlight}
          />
          {/* Content */}
          {children}
        </View>
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 30,
    height: 220,
    width: 110,
    overflow: "hidden",
    backgroundColor: "transparent",
    shadowColor: "#00c6ff",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  liquidBackgroundWrapper: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  liquidBlob1: {
    position: "absolute",
    width: 90,
    height: 90,
    borderRadius: 45,
    top: -25,
    left: -20,
    opacity: 0.7,
  },
  liquidBlob2: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    bottom: -30,
    right: -25,
    opacity: 0.7,
  },
  liquidBlob3: {
    position: "absolute",
    width: 70,
    height: 70,
    borderRadius: 35,
    top: 60,
    left: 20,
    opacity: 0.5,
  },
  glassLayer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 30,
  },
  innerBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 30,
    borderWidth: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: 30,
    paddingHorizontal: 10,
  },
  glossyHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "40%",
    borderRadius: 30,
  },
});

export default LiquidGlassCard;
