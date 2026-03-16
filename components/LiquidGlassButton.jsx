import React, { useRef, useEffect } from "react";
import {
  TouchableOpacity,
  View,
  Text,
  Animated,
  Easing,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

const LiquidGlassButton = ({
  onPress,
  isDarkMode,
  title = "Button",
  containerStyle,
  textStyle,
  colors1,
  colors2,
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 8000,
        useNativeDriver: true,
        easing: Easing.linear,
      })
    ).start();

    Animated.loop(
      Animated.timing(rotateAnim2, {
        toValue: 1,
        duration: 6000,
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

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.92,
      friction: 4,
      tension: 50,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const defaultColors1 = isDarkMode
    ? ["#00f7ff2b", "#0008ff"]
    : ["#89f6fe", "#116ef2"];

  const defaultColors2 = isDarkMode
    ? ["#3d5684", "#3b717b"]
    : ["#9a9cff", "#000000"];

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      style={containerStyle ? undefined : { flex: 1 }}
    >
      <Animated.View
        style={[
          styles.liquidButtonContainer,
          containerStyle,
          {
            transform: [{ scale }],
          },
        ]}
      >
        <View style={styles.liquidBackgroundWrapper}>
          <Animated.View
            style={[
              styles.liquidShape1,
              { transform: [{ rotate: spin1 }, { scale: 1.5 }] },
            ]}
          >
            <LinearGradient
              colors={colors1 || defaultColors1}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
          <Animated.View
            style={[
              styles.liquidShape2,
              {
                transform: [
                  { rotate: spin2 },
                  { scale: 1.5 },
                  { translateX: -20 },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={colors2 || defaultColors2}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>

        <BlurView
          intensity={isDarkMode ? 50 : 70}
          tint={isDarkMode ? "dark" : "light"}
          style={styles.liquidGlassLayer}
        >
          <View
            style={[
              styles.liquidInnerBorder,
              {
                borderColor: isDarkMode
                  ? "rgba(255, 255, 255, 0.4)"
                  : "rgba(255, 255, 255, 0.8)",
              },
            ]}
          >
            <LinearGradient
              colors={["rgba(255,255,255,0.6)", "rgba(255,255,255,0)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.glossyHighlight}
            />
            <Text
              style={[
                styles.buttonText,
                { color: isDarkMode ? "#FFF" : "#ffffffff", elevation: 2 },
                textStyle,
              ]}
            >
              {title}
            </Text>
          </View>
        </BlurView>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  liquidButtonContainer: {
    width: "100%",
    height: 50,
    borderRadius: 30,
    overflow: "hidden",
    backgroundColor: "transparent",
    shadowColor: "#00c6ff",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  liquidBackgroundWrapper: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  liquidShape1: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    top: -20,
    left: -20,
    opacity: 0.8,
  },
  liquidShape2: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    bottom: -30,
    right: -20,
    opacity: 0.8,
  },
  liquidGlassLayer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 30,
  },
  liquidInnerBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 30,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  glossyHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "50%",
    borderRadius: 30,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: "600",
    fontFamily: "jokeyone",
  },
});

export default LiquidGlassButton;
