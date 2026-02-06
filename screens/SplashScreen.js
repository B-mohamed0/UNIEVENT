import { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ImageBackground,
  Animated,
  Dimensions,
} from "react-native";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

export default function SplashScreen({ navigation }) {
const scaleAnim = useRef(new Animated.Value(0.95)).current;
const opacityAnim = useRef(new Animated.Value(0)).current;
const translateYAnim = useRef(new Animated.Value(10)).current;

useEffect(() => {

  Animated.parallel([
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: true,
    }),
    Animated.timing(opacityAnim, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: true,
    }),
    Animated.timing(translateYAnim, {
      toValue: 0,
      duration: 1200,
      useNativeDriver: true,
    }),
  ]).start();

  const timer = setTimeout(() => {
    navigation.replace("QuiSuisJe");
  }, 3000);

  return () => clearTimeout(timer);
}, []);

  return (
    <ImageBackground
      source={require("../assets/project/splash.png")}
      style={styles.background}
    >
      <View style={styles.logoContainer}>
        <Image
          source={require("../assets/project/logoblue.png")}
          style={styles.logo}
        />

        {/* TEXTE UNIEVENT AVEC DÉGRADÉ + ZOOM */}
        <MaskedView
          maskElement={
            <Text style={styles.title}>
              UNIEVENT
            </Text>
          }
        >
          <Animated.View
  style={{
    opacity: opacityAnim,
    transform: [
      { scale: scaleAnim },
      { translateY: translateYAnim },
    ],
  }}
>

            <LinearGradient
              colors={[
                "#2749A0",
                "#8AA5EA",
                "#2749A0",
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradient}
            >
              <Text style={[styles.title, { opacity: 0 }]}>
                UNIEVENT
              </Text>
            </LinearGradient>
          </Animated.View>
        </MaskedView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    width: width,
    height: height,
    justifyContent: "flex-end",
  },

  logoContainer: {
    alignItems: "center",
    marginBottom: 290,
  },

  logo: {
    width: 100,
    height: 100,
    resizeMode: "contain",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },

  title: {
    fontSize: 28,
    letterSpacing: 3,
    textAlign: "center",
    fontFamily: "HeyComic",
  },
});