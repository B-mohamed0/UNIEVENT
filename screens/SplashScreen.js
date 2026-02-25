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
import { Easing } from "react-native";

const { width, height } = Dimensions.get("window");

export default function SplashScreen({ navigation }) {
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;


  useEffect(() => {

    const loopAnimation = Animated.loop(
      Animated.sequence([
        // Apparition
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 700,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 700,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]),

        // Disparition
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 0.98,
            duration: 300,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 300,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    const timer = setTimeout(() => { navigation.replace("QuiSuisJe"); }, 3000);
    loopAnimation.start();

    return () => loopAnimation.stop();

  }, []);



  return (
    <ImageBackground
      source={require("../assets/project/splash.png")}
      style={styles.background}
    >
      <View style={styles.logoContainer}>
        <View style={styles.logoShadow}>
          <Image
            source={require("../assets/project/logoblue.png")}
            style={styles.logo}
          />
        </View>

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

  logoShadow: {
  width: 110,
  height: 110,
  justifyContent: "center",
  alignItems: "center",
  marginBottom: 20,

  backgroundColor: "#fff",     // IMPORTANT pour Android
  borderRadius: 30,            // pour une ombre “propre”
  
  shadowColor: "#000",         // iOS
  shadowOffset: { width: 0, height: 7 },
  shadowOpacity: 0.7,
  shadowRadius: 10,

  elevation: 8,                // Android
},

logo: {
  width: 100,
  height: 100,
  resizeMode: "contain",
},
  title: {
    fontSize: 28,
    letterSpacing: 3,
    textAlign: "center",
    fontFamily: "HeyComic",
  },
});